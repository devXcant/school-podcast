import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import formidable from 'formidable';

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

  const isAdmin = session.user.role === 'admin';
  const isLecturer = session.user.role === 'lecturer';
  const isCourseRep = session.user.role === 'course_rep';

  if (!isAdmin && !isLecturer && !isCourseRep) {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0] || files.file;
    const { title, description, course: courseId, duration } = fields;

    if (!title || !courseId || !file) {
      return res.status(400).json({ message: 'Title, course, and file are required' });
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', Array.isArray(courseId) ? courseId[0] : courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isCourseOwner = isLecturer && course.lecturer === session.user.id;
    const isAssignedCourseRep = isCourseRep && course.course_rep === session.user.id;

    if (!isAdmin && !isCourseOwner && !isAssignedCourseRep) {
        return res.status(403).json({ message: 'Permission denied for this course' });
    }

    const fileContent = fs.readFileSync(file.filepath);
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `podcasts/${Array.isArray(courseId) ? courseId[0] : courseId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('podcasts')
      .upload(filePath, fileContent, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('podcasts')
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    const { data: podcast, error: podcastError } = await supabaseAdmin
      .from('podcasts')
      .insert([{
        title: Array.isArray(title) ? title[0] : title,
        description: description ? (Array.isArray(description) ? description[0] : description) : '',
        course_id: Array.isArray(courseId) ? courseId[0] : courseId,
        recorded_by: session.user.id,
        file_url: fileUrl,
        storage_path: filePath,
        duration: duration ? parseInt(Array.isArray(duration) ? duration[0] : duration) : 0,
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
