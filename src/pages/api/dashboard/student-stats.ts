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

  // Only students can access these stats
  if (session.user.role !== 'student') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    await dbConnect();

    // Get student's profile with enrolled courses
    const student = await User.findById(session.user.id);

    // Get student's courses
    const courses = await Course.find({ _id: { $in: student.courses } })
      .populate('lecturer', 'name')
      .populate('courseRep', 'name')
      .sort({ createdAt: -1 });

    // Get total courses count
    const totalCourses = courses.length;

    // Get course IDs
    const courseIds = courses.map(course => course._id);

    // Get recent podcasts from enrolled courses
    const recentPodcasts = await Podcast.find({ course: { $in: courseIds } })
      .populate('course', 'title code')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      totalCourses,
      recentPodcasts,
      courses,
    });
  } catch (error: any) {
    console.error('Error fetching student stats:', error);
    return res.status(500).json({ message: 'Failed to fetch student stats', error: error.message });
  }
}
