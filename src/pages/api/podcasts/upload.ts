import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import { promises as fs } from "fs";

// Create a Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    // Debug logs
    console.log("Session user:", session.user);
    console.log("Auth UID:", await supabaseAdmin.auth.getUser());
    console.log("Received fields:", fields);
    console.log("Received files:", files);

    const courseId = fields.course?.[0];
    const title = fields.title?.[0];
    const description = fields.description?.[0];
    const file = files.file?.[0];

    console.log("Parsed data:", { courseId, title, description, file });

    if (!courseId || !title || !file) {
      console.log("Missing fields:", { courseId, title, file });
      return res.status(400).json({
        message: "Missing required fields",
        received: { courseId, title, file },
      });
    }

    // Verify course access
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("lecturer")
      .eq("id", courseId)
      .single();

    console.log("Course data:", course);
    console.log("Session user ID:", session.user.id);
    console.log("Course lecturer ID:", course?.lecturer);

    if (courseError) {
      console.error("Course error:", courseError);
      throw new Error("Course not found");
    }

    if (course.lecturer !== session.user.id) {
      console.log("Permission denied - User is not the course lecturer");
      return res
        .status(403)
        .json({ message: "Only course lecturer can upload podcasts" });
    }

    // Read the file
    const fileBuffer = await fs.readFile(file.filepath);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${courseId}/${timestamp}-${title}.mp3`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("podcasts")
      .upload(filename, fileBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Create podcast record
    const { data: podcast, error: podcastError } = await supabaseAdmin
      .from("podcasts")
      .insert({
        title,
        description,
        course_id: courseId,
        file_url: uploadData.path,
        storage_path: filename,
        recorded_by: session.user.id,
      })
      .select()
      .single();

    if (podcastError) {
      console.error("Podcast creation error:", podcastError);
      // If podcast creation fails, delete the uploaded file
      await supabaseAdmin.storage.from("podcasts").remove([filename]);
      throw podcastError;
    }

    return res.status(200).json({ success: true, data: podcast });
  } catch (error: any) {
    console.error("Error uploading podcast:", error);
    return res.status(500).json({
      message: "Error uploading podcast",
      error: error.message,
    });
  }
}
