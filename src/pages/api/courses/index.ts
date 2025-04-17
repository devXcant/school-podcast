// pages/api/courses/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Course from '../../../models/Course';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  // GET - Fetch all courses (with filtering)
  if (req.method === 'GET') {
    try {
      const { department, lecturer } = req.query;

      let query: any = {};

      if (department) {
        query.department = department;
      }

      if (lecturer) {
        query.lecturer = lecturer;
      }

      // If user is a student, only return courses they are enrolled in
      if (session.user.role === 'student') {
        const user = await User.findById(session.user.id);
        const coursesIds = user.courses;
        query._id = { $in: coursesIds };
      }

      const courses = await Course.find(query)
        .populate('lecturer', 'name email')
        .populate('courseRep', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: courses });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
  }

  // POST - Create a new course (admin or lecturer only)
  if (req.method === 'POST') {
    try {
      // Check if user has permission to create courses
      if (!['admin', 'lecturer'].includes(session.user.role)) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { code, title, description, lecturer, courseRep, students } = req.body;

      // Create course
      const course = await Course.create({
        code,
        title,
        description,
        lecturer: lecturer || session.user.id, // Default to current user if lecturer not specified
        courseRep,
        students: students || [],
      });

      // Add course to students' course list
      if (students && students.length > 0) {
        await User.updateMany(
          { _id: { $in: students } },
          { $push: { courses: course._id } }
        );
      }

      // Add course to lecturer's course list
      const lecturerId = lecturer || session.user.id;
      await User.findByIdAndUpdate(
        lecturerId,
        { $push: { courses: course._id } }
      );

      // Add course to course rep's course list if assigned
      if (courseRep) {
        await User.findByIdAndUpdate(
          courseRep,
          { $push: { courses: course._id } }
        );
      }

      return res.status(201).json({
        success: true,
        data: course,
      });
    } catch (error: any) {
      console.error('Error creating course:', error);
      return res.status(500).json({ message: 'Error creating course', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
