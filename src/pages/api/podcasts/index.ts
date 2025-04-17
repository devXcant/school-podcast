import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Fetch all podcasts (with filtering)
  if (req.method === 'GET') {
    try {
      const { course, isLive } = req.query;

      let query = supabase
        .from('podcasts')
        .select(`
          *,
          course:courses(*),
          recorded_by:users(*)
        `);

      if (course) {
        query = query.eq('course_id', course);
      }

      if (isLive !== undefined) {
        query = query.eq('is_live', isLive === 'true');
      }

      // If user is a student, only return podcasts from their courses
      if (session.user.role === 'student') {
        const { data: userCourses } = await supabase
          .from('user_courses')
          .select('course_id')
          .eq('user_id', session.user.id);

        if (userCourses && userCourses.length > 0) {
          const courseIds = userCourses.map(uc => uc.course_id);

          if (!course) {
            // Only apply this filter if no specific course is requested
            query = query.in('course_id', courseIds);
          } else if (!courseIds.includes(course)) {
            // Student is trying to access a course they're not enrolled in
            return res.status(403).json({ message: 'Access denied to this course' });
          }
        } else if (!course) {
          return res.status(200).json({ success: true, data: [] });
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Error fetching podcasts:', error);
      return res.status(500).json({ message: 'Error fetching podcasts', error: error.message });
    }
  }

  // POST - Create a new podcast (admin, lecturer, or course rep only)
  if (req.method === 'POST') {
    try {
      const { title, description, course: courseId, fileUrl, duration, isLive } = req.body;

      // Get the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user has permission to add podcasts to this course
      const isAdmin = session.user.role === 'admin';
      const isLecturer = course.lecturer === session.user.id;
      const isCourseRep = course.course_rep === session.user.id;

      if (!isAdmin && !isLecturer && !isCourseRep) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      // Create podcast
      const { data: podcast, error: podcastError } = await supabase
        .from('podcasts')
        .insert([{
          title,
          description,
          course_id: courseId,
          recorded_by: session.user.id,
          file_url: fileUrl,
          storage_path: '', // This would be set in the upload endpoint
          duration,
          is_live: isLive || false,
        }])
        .select()
        .single();

      if (podcastError) throw podcastError;

      return res.status(201).json({
        success: true,
        data: podcast,
      });
    } catch (error: any) {
      console.error('Error creating podcast:', error);
      return res.status(500).json({ message: 'Error creating podcast', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
