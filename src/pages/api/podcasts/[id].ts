import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  // GET - Fetch podcast by ID
  if (req.method === 'GET') {
    try {
      const { data: podcast, error } = await supabase
        .from('podcasts')
        .select(`
          *,
          course:courses(*),
          recorded_by:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast not found' });
      }

      // Check if user has access to this podcast's course
      if (session.user.role === 'student') {
        const { data: enrollment } = await supabase
          .from('user_courses')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('course_id', podcast.course_id)
          .single();

        if (!enrollment) {
          return res.status(403).json({ message: 'Access denied to this podcast' });
        }
      }

      // Increment view count
      await supabase
        .from('podcasts')
        .update({ view_count: (podcast.view_count || 0) + 1 })
        .eq('id', id);

      return res.status(200).json({ success: true, data: podcast });
    } catch (error: any) {
      console.error('Error fetching podcast:', error);
      return res.status(500).json({ message: 'Error fetching podcast', error: error.message });
    }
  }

  // PUT - Update podcast
  if (req.method === 'PUT') {
    try {
      // Get podcast with course info
      const { data: podcast, error: podcastError } = await supabase
        .from('podcasts')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', id)
        .single();

      if (podcastError || !podcast) {
        return res.status(404).json({ message: 'Podcast not found' });
      }

      // Check permissions
      const isAdmin = session.user.role === 'admin';
      const isLecturer = podcast.course.lecturer === session.user.id;
      const isCourseRep = podcast.course.course_rep === session.user.id;
      const isCreator = podcast.recorded_by === session.user.id;

      if (!isAdmin && !isLecturer && !(isCourseRep && isCreator)) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { title, description, fileUrl, duration, isLive } = req.body;

      // Update podcast
      const { data: updatedPodcast, error: updateError } = await supabase
        .from('podcasts')
        .update({
          title,
          description,
          file_url: fileUrl,
          duration,
          is_live: isLive,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        data: updatedPodcast,
      });
    } catch (error: any) {
      console.error('Error updating podcast:', error);
      return res.status(500).json({ message: 'Error updating podcast', error: error.message });
    }
  }

  // DELETE - Delete podcast
  if (req.method === 'DELETE') {
    try {
      // Get podcast with course info
      const { data: podcast, error: podcastError } = await supabase
        .from('podcasts')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', id)
        .single();

      if (podcastError || !podcast) {
        return res.status(404).json({ message: 'Podcast not found' });
      }

      // Check permissions
      const isAdmin = session.user.role === 'admin';
      const isLecturer = podcast.course.lecturer === session.user.id;
      const isCourseRep = podcast.course.course_rep === session.user.id;
      const isCreator = podcast.recorded_by === session.user.id;

      if (!isAdmin && !isLecturer && !(isCourseRep && isCreator)) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      // Delete file from storage if storage path exists
      if (podcast.storage_path) {
        await supabase.storage.from('podcasts').remove([podcast.storage_path]);
      }

      // Delete podcast record
      const { error: deleteError } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        success: true,
        message: 'Podcast deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting podcast:', error);
      return res.status(500).json({ message: 'Error deleting podcast', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
