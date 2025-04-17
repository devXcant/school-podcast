import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Course from '../../../models/Course';
import Podcast from '../../../models/Podcast';

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
    await dbConnect();

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalPodcasts = await Podcast.countDocuments();

    // Get recent podcasts
    const recentPodcasts = await Podcast.find()
      .populate('course', 'title code')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

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
