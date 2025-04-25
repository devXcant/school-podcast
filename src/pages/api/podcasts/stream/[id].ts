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

    // FIXED: Always prioritize storage_path and use signed URLs
    // This is the key change to fix the 400 Bad Request error
    if (podcast.storage_path) {
      // If storage_path exists, create a signed URL (works regardless of bucket privacy)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('podcasts')
        .createSignedUrl(podcast.storage_path, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return res.status(500).json({ message: 'Error creating signed URL' });
      }

      if (signedUrlData && signedUrlData.signedUrl) {
        // Handle range requests
        const range = req.headers.range;
        if (!range) {
          // If no range header, redirect to signed URL
          return res.redirect(signedUrlData.signedUrl);
        }
      }
    } else if (podcast.file_url && podcast.file_url.startsWith('http')) {
      // Fallback for legacy entries without storage_path
      console.warn('Using legacy file_url without storage_path for podcast:', podcast.id);

      // Try to extract a valid storage path from file_url
      try {
        const url = new URL(podcast.file_url);
        const pathParts = url.pathname.split('/');
        // Remove duplicated "podcasts/" prefix if present
        const storagePath = pathParts
          .filter(part => part !== '')
          .slice(3) // Skip "/storage/v1/object/public/"
          .join('/');

        console.log('Extracted storage path:', storagePath);

        // Try to create a signed URL with the extracted path
        const { data: signedUrlData, error: signedUrlError } = await supabase
          .storage
          .from(pathParts[4]) // This should be "podcasts" bucket name
          .createSignedUrl(storagePath, 3600);

        if (!signedUrlError && signedUrlData) {
          return res.redirect(signedUrlData.signedUrl);
        }
      } catch (e) {
        console.error('Error extracting storage path from URL:', e);
      }

      // If we can't create a signed URL, try the original URL as a last resort
      return res.redirect(podcast.file_url);
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
    const range = req.headers.range;
    const parts = range ? range.replace(/bytes=/, '').split('-') : ['0', `${totalSize - 1}`];
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
