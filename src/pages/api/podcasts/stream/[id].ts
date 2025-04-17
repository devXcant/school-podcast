import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../../lib/mongodb';
import Podcast from '../../../../models/Podcast';
import User from '../../../../models/User';
import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    const { id } = req.query;

    // Fetch podcast details
    const podcast = await Podcast.findById(id).populate('course');

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Check if user has access to this podcast's course
    if (session.user.role === 'student' || session.user.role === 'course_rep') {
      const user = await User.findById(session.user.id);
      if (!user.courses.includes(podcast.course._id)) {
        return res.status(403).json({ message: 'Access denied to this podcast' });
      }
    }

    // Get file from S3
    // Extract bucket and key from file URL
    const fileUrl = new URL(podcast.fileUrl);
    const filePath = fileUrl.pathname.substring(1); // Remove leading slash

    // Send range requests to support seeking in audio player
    const range = req.headers.range;

    if (!range) {
      // If no range requested, return the full file
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filePath,
      };

      const s3Response = await s3Client.send(new GetObjectCommand(s3Params));

      if (!s3Response.Body) {
        throw new Error('Failed to retrieve file from S3');
      }

      // Set content type and other headers
      res.setHeader('Content-Type', s3Response.ContentType || 'audio/mpeg');
      res.setHeader('Content-Length', s3Response.ContentLength || 0);
      res.setHeader('Accept-Ranges', 'bytes');

      // Stream the file to the response
      const readableStream = s3Response.Body as Readable;
      readableStream.pipe(res);

      return;
    }

    // Handle range request
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Range: range,
    };

    const s3Response = await s3Client.send(new GetObjectCommand(s3Params));

    if (!s3Response.Body) {
      throw new Error('Failed to retrieve file from S3');
    }

    // Parse the range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : (s3Response.ContentLength || 0) - 1;
    const contentLength = end - start + 1;

    // Set headers for range request
    res.status(206);
    res.setHeader('Content-Type', s3Response.ContentType || 'audio/mpeg');
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${s3Response.ContentLength}`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the file to the response
    const readableStream = s3Response.Body as Readable;
    readableStream.pipe(res);
  } catch (error: any) {
    console.error('Error streaming podcast:', error);
    return res.status(500).json({ message: 'Failed to stream podcast', error: error.message });
  }
}
