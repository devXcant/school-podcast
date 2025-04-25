import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { supabase } from "../../../lib/supabase";

// Extend NextApiRequest to include session
interface ExtendedNextApiRequest extends NextApiRequest {
  session?: {
    user?: {
      id: string;
      role: string;
    };
  };
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  // Get session from the authorization header
  const session = await getSession({ req });

  if (!session) {
    // Try to get the user ID from the authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const userId = authHeader.split(" ")[1];
      if (userId) {
        // Get user data from Supabase
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Create a session-like object
        const tempSession = {
          user: {
            id: userData.id,
            role: userData.role,
          },
        };

        // Use this session for the rest of the function
        req.session = tempSession;
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // GET - Fetch all courses (with filtering)
  if (req.method === "GET") {
    try {
      const { department, lecturer } = req.query;

      let query = supabase.from("courses").select(`
          *,
          lecturer:users!courses_lecturer_fkey(*),
          course_rep:users!courses_course_rep_fkey(*),
          podcasts(*)
        `);

      if (department) {
        query = query.eq("department", department);
      }

      if (lecturer) {
        query = query.eq("lecturer", lecturer);
      }

      // If user is a student, only return courses they are enrolled in
      if (req.session?.user?.role === "student") {
        const { data: userCourses } = await supabase
          .from("user_courses")
          .select("course_id")
          .eq("user_id", req.session.user.id);

        if (userCourses && userCourses.length > 0) {
          const courseIds = userCourses.map((uc) => uc.course_id);
          query = query.in("id", courseIds);
        } else {
          return res.status(200).json({ success: true, data: [] });
        }
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      return res
        .status(500)
        .json({ message: "Error fetching courses", error: error.message });
    }
  }

  // POST - Create a new course (admin or lecturer only)
  if (req.method === "POST") {
    try {
      // Check if user has permission to create courses
      if (!["admin", "lecturer"].includes(req.session?.user?.role as string)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const { code, title, description, lecturer, courseRep, students } =
        req.body;

      // Create course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert([
          {
            code,
            title,
            description,
            lecturer:
              lecturer || (req.session?.user?.id as string) || "system-default",
            course_rep: courseRep || null,
          },
        ])
        .select()
        .single();

      if (courseError) throw courseError;

      // Add students to the course
      if (students && students.length > 0) {
        const userCourses = students.map((studentId: any) => ({
          user_id: studentId,
          course_id: course.id,
        }));

        const { error: enrollmentError } = await supabase
          .from("user_courses")
          .insert(userCourses);

        if (enrollmentError) throw enrollmentError;
      }

      return res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error: any) {
      console.error("Error creating course:", error);
      return res
        .status(500)
        .json({ message: "Error creating course", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
