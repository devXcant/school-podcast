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

  // Only course reps can access these stats
  if (session.user.role !== 'course_rep') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    // Get courses where user is enrolled
    const { data: enrollments } = await supabase
      .from('user_courses')
      .select('course_id')
      .eq('user_id', session.user.id);

    const enrolledCourseIds = enrollments ? enrollments.map(e => e.course_id) : [];

    // Get courses where user is the course rep
    const { data: repCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('course_rep', session.user.id);

    const repCourseIds = repCourses ? repCourses.map(c => c.id) : [];

    // Combine both sets of course IDs without using Set spreading
    const uniqueCourseIds: string[] = [];

    // Add enrolled course IDs
    enrolledCourseIds.forEach(id => {
      if (!uniqueCourseIds.includes(id)) {
        uniqueCourseIds.push(id);
      }
    });

    // Add rep course IDs
    repCourseIds.forEach(id => {
      if (!uniqueCourseIds.includes(id)) {
        uniqueCourseIds.push(id);
      }
    });

    // Get total courses count
    const totalCourses = uniqueCourseIds.length;

    // Get courses with details
    let courses = [];

    if (uniqueCourseIds.length > 0) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          *,
          lecturer:users!courses_lecturer_fkey(name)
        `)
        .in('id', uniqueCourseIds)
        .order('created_at', { ascending: false });

      courses = coursesData || [];
    }

    // Get podcasts recorded by the course rep
    const { data: podcasts } = await supabase
      .from('podcasts')
      .select(`
        *,
        course:courses(title, code)
      `)
      .eq('recorded_by', session.user.id)
      .order('created_at', { ascending: false });

    // Get total podcasts count
    const totalPodcasts = podcasts ? podcasts.length : 0;

    return res.status(200).json({
      totalCourses,
      totalPodcasts,
      recentPodcasts: podcasts ? podcasts.slice(0, 10) : [],
      courses,
    });
  } catch (error: any) {
    console.error('Error fetching course rep stats:', error);
    return res.status(500).json({ message: 'Failed to fetch course rep stats', error: error.message });
  }
}
