// pages/api/podcasts/index.js
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Podcast from '../../../models/Podcast';
import Course from '../../../models/Course';
import User from '../../../models/Users';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  // GET - Fetch all podcasts (with filtering)
  if (req.method === 'GET') {
    try {
      const { course, isLive } = req.query;

      let query = {};

      if (course) {
        query.course = course;
      }

      if (isLive !== undefined) {
        query.isLive = isLive === 'true';
      }

      // If user is a student, only return podcasts from their courses
      if (session.user.role === 'student') {
        const user = await User.findById(session.user.id);
        const userCourses = user.courses;

        if (!course) { // Only apply this filter if no specific course is requested
          query.course = { $in: userCourses };
        } else if (!userCourses.includes(course)) {
          // Student is trying to access a course they're not enrolled in
          return res.status(403).json({ message: 'Access denied to this course' });
        }
      }

      const podcasts = await Podcast.find(query)
        .populate('course', 'code title')
        .populate('recordedBy', 'name')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: podcasts });
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      return res.status(500).json({ message: 'Error fetching podcasts', error: error.message });
    }
  }

  // POST - Create a new podcast (admin, lecturer, or course rep only)
  if (req.method === 'POST') {
    try {
      const { title, description, course: courseId, fileUrl, duration, isLive } = req.body;

      // Get the course
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user has permission to add podcasts to this course
      const isAdmin = session.user.role === 'admin';
      const isLecturer = course.lecturer.toString() === session.user.id;
      const isCourseRep = course.courseRep && course.courseRep.toString() === session.user.id;

      if (!isAdmin && !isLecturer && !isCourseRep) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      // Create podcast
      const podcast = await Podcast.create({
        title,
        description,
        course: courseId,
        recordedBy: session.user.id,
        fileUrl,
        duration,
        isLive: isLive || false,
      });

      // Add podcast to course
      await Course.findByIdAndUpdate(
        courseId,
        { $push: { podcasts: podcast._id } }
      );

      return res.status(201).json({
        success: true,
        data: podcast,
      });
    } catch (error) {
      console.error('Error creating podcast:', error);
      return res.status(500).json({ message: 'Error creating podcast', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// pages/api/podcasts/[id].js
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Podcast from '../../../models/Podcast';
import Course from '../../../models/Course';
import User from '../../../models/Users';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  const { id } = req.query;

  // GET - Fetch podcast by ID
  if (req.method === 'GET') {
    try {
      const podcast = await Podcast.findById(id)
        .populate('course', 'code title')
        .populate('recordedBy', 'name email');

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast not found' });
      }

      // Check if user has access to this podcast's course
      if (session.user.role === 'student') {
        const user = await User.findById(session.user.id);
        if (!user.courses.includes(podcast.course._id)) {
          return res.status(403).json({ message: 'Access denied to this podcast' });
        }
      }

      // Increment view count
      await Podcast.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

      return res.status(200).json({ success: true, data: podcast });
    } catch (error) {
      console.error('Error fetching podcast:', error);
      return res.status(500).json({ message: 'Error fetching podcast', error: error.message });
    }
  }

  // PUT - Update podcast
  if (req.method === 'PUT') {
    try {
      const podcast = await Podcast.findById(id);

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast not found' });
      }

      // Get course
      const course = await Course.findById(podcast.course);

      // Check permissions
      const isAdmin = session.user.role === 'admin';
      const isLecturer = course.lecturer.toString() === session.user.id;
      const isCourseRep = course.courseRep && course.courseRep.toString() === session.user.id;
      const isCreator = podcast.recordedBy.toString() === session.user.id;

      if (!isAdmin && !isLecturer && !(isCourseRep && isCreator)) {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const { title, description, fileUrl, duration, isLive } = req.body;

      // Update podcast
      const updatedPodcast = await Podcast.findByIdAndUpdate(
        id,
        {
          title,
          description,
          fileUrl,
          duration,
          isLive,
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        data: updatedPodcast,
      });
