import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only lecturers can access these stats
  if (session.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    // Get lecturer's courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        course_rep:users!courses_course_rep_fkey(name)
      `)
      .eq('lecturer', session.user.id)
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;

    // Get total courses count
    const totalCourses = courses ? courses.length : 0;

    // Get course IDs
    const courseIds = courses ? courses.map(course => course.id) : [];

    // Get lecturer's podcasts
    const { data: podcasts, error: podcastsError } = await supabase
      .from('podcasts')
      .select(`
        *,
        course:courses(title, code)
      `)
      .or(`recorded_by.eq.${session.user.id},course_id.in.(${courseIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (podcastsError) throw podcastsError;

    // Get total podcasts count
    const totalPodcasts = podcasts ? podcasts.length : 0;

    // Get total students count by checking enrollments
    let totalStudents = 0;

    if (courseIds.length > 0) {
      const { count, error: studentsError } = await supabase
        .from('user_courses')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds);

      if (!studentsError) {
        totalStudents = count || 0;
      }
    }

    return res.status(200).json({
      totalCourses,
      totalPodcasts,
      totalStudents,
      recentPodcasts: podcasts ? podcasts.slice(0, 10) : [],
      courses: courses || [],
    });
  } catch (error: any) {
    console.error('Error fetching lecturer stats:', error);
    return res.status(500).json({ message: 'Failed to fetch lecturer stats', error: error.message });
  }
}
