import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has permission to upload
  const isAdmin = session.user.role === 'admin';
  const isLecturer = session.user.role === 'lecturer';
  const isCourseRep = session.user.role === 'course_rep';

  if (!isAdmin && !isLecturer && !isCourseRep) {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    // Parse the form data
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const { title, description, course: courseId, duration } = fields;

    // Validate required fields
    if (!title || !courseId || !file) {
      return res.status(400).json({ message: 'Title, course, and file are required' });
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId[0])
      .single();

    if (courseError || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permission for the specific course
    const isCourseOwner = isLecturer && course.lecturer === session.user.id;
    const isAssignedCourseRep = isCourseRep && course.course_rep === session.user.id;

    if (!isAdmin && !isCourseOwner && !isAssignedCourseRep) {
        return res.status(403).json({ message: 'Permission denied for this course' });
        }

    // Upload file to Supabase Storage
    const fileContent = fs.readFileSync(file.filepath);
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `podcasts/${courseId[0]}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('podcasts')
      .upload(filePath, fileContent, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabase
      .storage
      .from('podcasts')
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    // Create podcast record in database
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .insert([{
        title: title[0],
        description: description ? description[0] : '',
        course_id: courseId[0],
        recorded_by: session.user.id,
        file_url: fileUrl,
        storage_path: filePath,
        duration: duration ? parseInt(duration[0]) : 0,
        is_live: false,
        view_count: 0,
      }])
      .select()
      .single();

    if (podcastError) {
      throw new Error(podcastError.message);
    }

    return res.status(201).json({
      success: true,
      data: podcast,
    });
  } catch (error: any) {
    console.error('Error uploading podcast:', error);
    return res.status(500).json({ message: 'Failed to upload podcast', error: error.message });
  }
}
