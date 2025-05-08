import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { supabase } from "@/src/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { courseId } = req.query;

    try {
      // Check if user is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("user_courses")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .single();

      if (enrollmentError && enrollmentError.code !== "PGRST116") {
        throw enrollmentError;
      }

      // Check if user is the lecturer
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("lecturer")
        .eq("id", courseId)
        .single();

      if (courseError) {
        throw courseError;
      }

      const hasAccess = enrollment || course.lecturer === session.user.id;

      return res.status(200).json({ hasAccess });
    } catch (error: any) {
      console.error("Error checking course access:", error);
      return res
        .status(500)
        .json({
          message: "Error checking course access",
          error: error.message,
        });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
