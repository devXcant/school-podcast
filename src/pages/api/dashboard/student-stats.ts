import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only students can access these stats
  if (session.user.role !== "student") {
    return res.status(403).json({ message: "Permission denied" });
  }

  try {
    // Get student's enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("user_courses")
      .select("course_id")
      .eq("user_id", session.user.id);

    if (enrollmentsError) throw enrollmentsError;

    // Get course IDs
    const courseIds = enrollments ? enrollments.map((e) => e.course_id) : [];

    // Get total courses count
    const totalCourses = courseIds.length;

    // Get student's courses with details
    let courses = [];
    let totalPodcasts = 0;

    if (courseIds.length > 0) {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(
          `
          *,
          lecturer:users!courses_lecturer_fkey(name),
          course_rep:users!courses_course_rep_fkey(name),
          podcasts(*)
        `
        )
        .in("id", courseIds)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      courses = coursesData || [];

      // Calculate total podcasts across all courses
      totalPodcasts = courses.reduce((total, course) => {
        return total + (course.podcasts?.length || 0);
      }, 0);
    }

    // Get recent podcasts from enrolled courses
    let recentPodcasts = [];

    if (courseIds.length > 0) {
      const { data: podcastsData, error: podcastsError } = await supabase
        .from("podcasts")
        .select(
          `
          *,
          course:courses(title, code),
          recorded_by:users(name)
        `
        )
        .in("course_id", courseIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (podcastsError) throw podcastsError;

      recentPodcasts = podcastsData || [];
    }

    // Get live streams count
    const { count: liveStreamsCount, error: liveStreamsError } = await supabase
      .from("podcasts")
      .select("*", { count: "exact", head: true })
      .in("course_id", courseIds)
      .eq("is_live", true);

    if (liveStreamsError) throw liveStreamsError;

    return res.status(200).json({
      totalCourses,
      totalPodcasts,
      liveStreamsCount: liveStreamsCount || 0,
      recentPodcasts,
      courses,
    });
  } catch (error: any) {
    console.error("Error fetching student stats:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch student stats", error: error.message });
  }
}
