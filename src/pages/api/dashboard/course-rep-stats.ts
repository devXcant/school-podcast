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

  // Only course reps can access these stats
  if (session.user.role !== 'course_rep') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    await dbConnect();

    // Get course rep's profile with enrolled courses
    const courseRep = await User.findById(session.user.id);

    // Get courses where student is enrolled + courses where they are the course rep
    const courses = await Course.find({
      $or: [
        { _id: { $in: courseRep.courses } },
        { courseRep: session.user.id }
      ]
    })
      .populate('lecturer', 'name')
      .sort({ createdAt: -1 });

    // Get total courses count
    const totalCourses = courses.length;

    // Get course IDs
    const courseIds = courses.map(course => course._id);

    // Get podcasts recorded by the course rep
    const podcasts = await Podcast.find({ recordedBy: session.user.id })
      .populate('course', 'title code')
      .sort({ createdAt: -1 });

    // Get total podcasts count
    const totalPodcasts = podcasts.length;

    // Get recent podcasts from courses
    const recentCoursePodcasts = await Podcast.find({ course: { $in: courseIds } })
      .populate('course', 'title code')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      totalCourses,
      totalPodcasts,
      recentPodcasts: podcasts.slice(0, 10),
      courses,
    });
  } catch (error: any) {
    console.error('Error fetching course rep stats:', error);
    return res.status(500).json({ message: 'Failed to fetch course rep stats', error: error.message });
  }
}
