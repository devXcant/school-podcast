// pages/api/courses/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Course from '../../../models/Course';
import User from '../../../models/User';
import Podcast from '../../../models/Podcast';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  const { id } = req.query;

  // GET - Fetch course by ID
  if (req.method === 'GET') {
    try {
      const course = await Course.findById(id)
        .populate('lecturer', 'name email')
        .populate('courseRep', 'name email')
        .populate({
          path: 'podcasts',
          select: 'title description fileUrl duration viewCount createdAt',
          options: { sort: { createdAt: -1 } }
        });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user has access to this course
      if (session.user.role === 'student') {
        const user = await User.findById(session.user.id);
        if (!user.courses.includes(course._id)) {
          return res.status(403).json({ message: 'Access denied to this course' });
        }
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
      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check permissions (only admin, course lecturer, or IT admin can update)
      if (
        session.user.role !== 'admin' &&
        course.lecturer.toString() !== session.user.id
      ) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { code, title, description, lecturer, courseRep, students } = req.body;

      // Update course
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        {
          code,
          title,
          description,
          lecturer,
          courseRep,
          students,
        },
        { new: true, runValidators: true }
      );

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

      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Remove course from users
      await User.updateMany(
        { courses: course._id },
        { $pull: { courses: course._id } }
      );

      // Delete all podcasts associated with the course
      await Podcast.deleteMany({ course: course._id });

      // Delete the course
      await Course.findByIdAndDelete(id);

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
