// pages/api/podcasts/stream/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../../lib/supabase';
import { Readable } from 'stream';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.query;

    // Fetch podcast details
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('id', id)
      .single();

    if (podcastError || !podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Check if user has access to this podcast's course
    if (session.user.role === 'student' || session.user.role === 'course_rep') {
      const { data: enrollment } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('course_id', podcast.course_id)
        .single();

      if (!enrollment) {
        return res.status(403).json({ message: 'Access denied to this podcast' });
      }
    }

    // Special case for direct file access
    if (podcast.file_url && podcast.file_url.startsWith('http')) {
      // For files already with public URLs, redirect to the file
      return res.redirect(podcast.file_url);
    }

    // For files stored in Supabase storage, use the storage_path
    if (!podcast.storage_path) {
      return res.status(404).json({ message: 'File path not found' });
    }

    // Handle range requests to support seeking in audio player
    const range = req.headers.range;

    if (!range) {
      // If no range requested, get a signed URL and redirect
      const { data: signedUrl } = await supabase
        .storage
        .from('podcasts')
        .createSignedUrl(podcast.storage_path, 3600); // 1 hour expiry

      if (signedUrl) {
        return res.redirect(signedUrl.signedUrl);
      } else {
        return res.status(404).json({ message: 'File not found in storage' });
      }
    }

    // For range requests, we need to download the file and stream it with the correct ranges
    // Note: Supabase storage doesn't support range requests directly via their API
    // This is a workaround that will download the full file first
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('podcasts')
      .download(podcast.storage_path);

    if (fileError || !fileData) {
      return res.status(404).json({ message: 'File not found in storage' });
    }

    // Convert the file to a buffer
    const buffer = await fileData.arrayBuffer();
    const totalSize = buffer.byteLength;

    // Parse the range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
    const chunkSize = end - start + 1;

    // Set headers for range request
    res.status(206);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Create a slice of the buffer for the requested range
    const slice = Buffer.from(buffer.slice(start, end + 1));

    // Stream the slice
    const readable = new Readable();
    readable._read = () => {}; // Required implementation
    readable.push(slice);
    readable.push(null);
    readable.pipe(res);

  } catch (error: any) {
    console.error('Error streaming podcast:', error);
    return res.status(500).json({ message: 'Failed to stream podcast', error: error.message });
  }
}
