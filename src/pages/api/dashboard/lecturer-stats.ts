import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
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

  // Only lecturers can access these stats
  if (session.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    await dbConnect();

    // Get lecturer's courses
    const courses = await Course.find({ lecturer: session.user.id })
      .populate('courseRep', 'name')
      .sort({ createdAt: -1 });

    // Get total courses count
    const totalCourses = courses.length;

    // Get course IDs
    const courseIds = courses.map(course => course._id);

    // Get lecturer's podcasts
    const podcasts = await Podcast.find({
      $or: [
        { recordedBy: session.user.id },
        { course: { $in: courseIds } }
      ]
    })
      .populate('course', 'title code')
      .sort({ createdAt: -1 });

    // Get total podcasts count
    const totalPodcasts = podcasts.length;

    // Get total students count
    const totalStudents = courses.reduce((total, course) => {
      return total + (Array.isArray(course.students) ? course.students.length : 0);
    }, 0);

    return res.status(200).json({
      totalCourses,
      totalPodcasts,
      totalStudents,
      recentPodcasts: podcasts.slice(0, 10),
      courses,
    });
  } catch (error: any) {
    console.error('Error fetching lecturer stats:', error);
    return res.status(500).json({ message: 'Failed to fetch lecturer stats', error: error.message });
  }
}
