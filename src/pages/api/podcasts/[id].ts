import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { supabase } from "../../../lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  console.log("API Request ID:", id); // Debug log

  // Validate ID
  if (!id) {
    console.log("Missing ID in request"); // Debug log
    return res.status(400).json({
      message: "Podcast ID is required",
      error: "ID is missing",
    });
  }

  // Ensure id is a string
  const podcastId = Array.isArray(id) ? id[0] : id;
  console.log("Processed podcast ID:", podcastId); // Debug log

  // GET - Fetch podcast by ID
  if (req.method === "GET") {
    try {
      console.log("Fetching podcast with ID:", podcastId); // Debug log

      const { data: podcast, error } = await supabase
        .from("podcasts")
        .select(
          `
          *,
          course:courses(*),
          recorded_by:users(*)
        `
        )
        .eq("id", podcastId)
        .single();

      if (error) {
        console.error("Supabase error:", error); // Debug log
        throw error;
      }

      if (!podcast) {
        console.log("Podcast not found for ID:", podcastId); // Debug log
        return res.status(404).json({ message: "Podcast not found" });
      }

      console.log("Found podcast:", podcast); // Debug log

      // Check if user has access to this podcast's course
      if (session.user.role === "student") {
        // First check if student is enrolled
        const { data: enrollment } = await supabase
          .from("user_courses")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("course_id", podcast.course_id)
          .single();

        // Then check if student is the course representative
        const { data: courseData } = await supabase
          .from("courses")
          .select("course_rep")
          .eq("id", podcast.course_id)
          .single();

        // Deny access if student is neither enrolled nor course rep
        if (!enrollment && courseData?.course_rep !== session.user.id) {
          return res
            .status(403)
            .json({ message: "Access denied to this podcast" });
        }
      }

      // Increment view count
      await supabase
        .from("podcasts")
        .update({ view_count: (podcast.view_count || 0) + 1 })
        .eq("id", podcastId);

      return res.status(200).json({ success: true, data: podcast });
    } catch (error: any) {
      console.error("Error fetching podcast:", error);
      return res.status(500).json({
        message: "Error fetching podcast",
        error: error.message,
        details: error.details || null,
      });
    }
  }

  // PUT - Update podcast
  if (req.method === "PUT") {
    try {
      // Get podcast with course info
      const { data: podcast, error: podcastError } = await supabase
        .from("podcasts")
        .select(
          `
          *,
          course:courses(*)
        `
        )
        .eq("id", podcastId)
        .single();

      if (podcastError || !podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }

      // Check permissions
      const isAdmin = session.user.role === "admin";
      const isLecturer = podcast.course.lecturer === session.user.id;
      const isCourseRep = podcast.course.course_rep === session.user.id;
      const isCreator = podcast.recorded_by === session.user.id;

      if (!isAdmin && !isLecturer && !(isCourseRep && isCreator)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const { title, description, fileUrl, duration, isLive } = req.body;

      // Update podcast
      const { data: updatedPodcast, error: updateError } = await supabase
        .from("podcasts")
        .update({
          title,
          description,
          file_url: fileUrl,
          duration,
          is_live: isLive,
        })
        .eq("id", podcastId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        data: updatedPodcast,
      });
    } catch (error: any) {
      console.error("Error updating podcast:", error);
      return res
        .status(500)
        .json({ message: "Error updating podcast", error: error.message });
    }
  }

  // DELETE - Delete podcast
  if (req.method === "DELETE") {
    try {
      // Get podcast with course info
      const { data: podcast, error: podcastError } = await supabase
        .from("podcasts")
        .select(
          `
          *,
          course:courses(*)
        `
        )
        .eq("id", podcastId)
        .single();

      if (podcastError || !podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }

      // Check permissions
      const isAdmin = session.user.role === "admin";
      const isLecturer = podcast.course.lecturer === session.user.id;
      const isCourseRep = podcast.course.course_rep === session.user.id;
      const isCreator = podcast.recorded_by === session.user.id;

      if (!isAdmin && !isLecturer && !(isCourseRep && isCreator)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      // Delete file from storage if storage path exists
      if (podcast.storage_path) {
        await supabase.storage.from("podcasts").remove([podcast.storage_path]);
      }

      // Delete podcast record
      const { error: deleteError } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", podcastId);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        success: true,
        message: "Podcast deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting podcast:", error);
      return res
        .status(500)
        .json({ message: "Error deleting podcast", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
