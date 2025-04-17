// pages/api/podcasts/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { IncomingForm } from 'formidable';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '../../../lib/mongodb';
import Podcast from '../../../models/Podcast';
import Course from '../../../models/Course';

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has permission to upload
  const isAdmin = session.user.role === 'admin';
  const isLecturer = session.user.role === 'lecturer';
  const isCourseRep = session.user.role === 'course_rep';

  if (!isAdmin && !isLecturer && !isCourseRep) {
    return res.status(403).json({ message: 'Permission denied' });
  }

  try {
    await dbConnect();

    // Parse the form data
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const { title, description, course: courseId, duration } = fields;

    // Validate required fields
    if (!title || !courseId || !file) {
      return res.status(400).json({ message: 'Title, course, and file are required' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permission for the specific course
    const isCourseOwner = isLecturer && course.lecturer.toString() === session.user.id;
    const isAssignedCourseRep = isCourseRep && course.courseRep && course.courseRep.toString() === session.user.id;

    if (!isAdmin && !isCourseOwner && !isAssignedCourseRep) {
      return res.status(403).json({ message: 'Permission denied for this course' });
    }

    // Upload file to S3
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `podcasts/${courseId}/${fileId}${fileExtension}`;

    const fileContent = fs.readFileSync(file.filepath);

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(s3Params));

    // Get the file URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Create podcast record in database
    const podcast = await Podcast.create({
      title: title[0],
      description: description ? description[0] : '',
      course: courseId[0],
      recordedBy: session.user.id,
      fileUrl,
      duration: duration ? parseInt(duration[0]) : 0,
      isLive: false,
    });

    // Add podcast to course
    await Course.findByIdAndUpdate(courseId[0], {
      $push: { podcasts: podcast._id },
    });

    return res.status(201).json({
      success: true,
      data: podcast,
    });
  } catch (error: any) {
    console.error('Error uploading podcast:', error);
    return res.status(500).json({ message: 'Failed to upload podcast', error: error.message });
  }
}
