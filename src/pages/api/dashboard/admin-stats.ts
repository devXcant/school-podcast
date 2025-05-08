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

  // Only admin can access these stats
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    // Get total counts using Supabase
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (coursesError) throw coursesError;

    const { count: totalPodcasts, error: podcastsError } = await supabase
      .from('podcasts')
      .select('*', { count: 'exact', head: true });

    if (podcastsError) throw podcastsError;

    // Get recent podcasts
    const { data: recentPodcasts, error: recentError } = await supabase
      .from('podcasts')
      .select(`
        *,
        course:courses(title, code),
        recorded_by:users(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    return res.status(200).json({
      totalUsers,
      totalCourses,
      totalPodcasts,
      recentPodcasts,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
  }
}
