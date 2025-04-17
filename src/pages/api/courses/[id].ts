import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  // GET - Fetch course by ID
  if (req.method === 'GET') {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          *,
          lecturer:users!courses_lecturer_fkey(*),
          course_rep:users!courses_course_rep_fkey(*),
          podcasts(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user has access to this course
      if (session.user.role === 'student') {
        const { data: enrollment } = await supabase
          .from('user_courses')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('course_id', id)
          .single();

        if (!enrollment) {
          return res.status(403).json({ message: 'Access denied to this course' });
        }
      }

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from('user_courses')
        .select('user_id')
        .eq('course_id', id);

      const studentIds = enrollments ? enrollments.map(e => e.user_id) : [];

      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('users')
          .select('id, name, email, role')
          .in('id', studentIds);

        course.students = students || [];
      } else {
        course.students = [];
      }

      return res.status(200).json({ success: true, data: course });
    } catch (error: any) {
      console.error('Error fetching course:', error);
      return res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
  }

  // PUT - Update course
  if (req.method === 'PUT') {
    try {
      // Check if course exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingCourse) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check permissions
      const isAdmin = session.user.role === 'admin';
      const isLecturer = existingCourse.lecturer === session.user.id;

      if (!isAdmin && !isLecturer) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { code, title, description, lecturer, courseRep, students } = req.body;

      // Update course
      const { data: updatedCourse, error: updateError } = await supabase
        .from('courses')
        .update({
          code,
          title,
          description,
          lecturer,
          course_rep: courseRep,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update enrolled students if provided
      if (students) {
        // First, remove all existing enrollments
        await supabase
          .from('user_courses')
          .delete()
          .eq('course_id', id);

        // Then add new enrollments
        if (students.length > 0) {
          const userCourses = students.map(studentId => ({
            user_id: studentId,
            course_id: id,
          }));

          await supabase
            .from('user_courses')
            .insert(userCourses);
        }
      }

      return res.status(200).json({
        success: true,
        data: updatedCourse,
      });
    } catch (error: any) {
      console.error('Error updating course:', error);
      return res.status(500).json({ message: 'Error updating course', error: error.message });
    }
  }

  // DELETE - Delete course
  if (req.method === 'DELETE') {
    try {
      // Only admin can delete courses
      if (session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Permission denied' });
      }

      // Check if course exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingCourse) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Get podcast storage paths for deletion
      const { data: podcasts } = await supabase
        .from('podcasts')
        .select('storage_path')
        .eq('course_id', id);

      // Delete course (cascades to enrollments and podcasts in DB)
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Delete podcast files from storage
      if (podcasts && podcasts.length > 0) {
        const storagePaths = podcasts.map(p => p.storage_path);
        await supabase.storage.from('podcasts').remove(storagePaths);
      }

      return res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
