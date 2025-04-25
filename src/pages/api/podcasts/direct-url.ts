// pages/api/podcasts/direct-url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

// Create a new Supabase client specifically for this endpoint
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // Use the service key for admin privileges
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Podcast ID is required' });
  }

  const podcastId = Array.isArray(id) ? id[0] : id;

  try {
    // Get podcast data
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (podcastError || !podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Extract the courseid and filename from the storage_path
    if (podcast.storage_path) {
      const pathParts = podcast.storage_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      let courseId = '';

      // Look for the course_id in the path
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (pathParts[i] !== 'podcasts') {
          courseId = pathParts[i];
          break;
        }
      }

      // If we found a course ID and filename
      if (courseId && fileName && fileName.includes('.mp3')) {
        // Try to create a signed URL with explicit path
        const { data: signedUrl, error: signedUrlError } = await supabase
          .storage
          .from('podcasts')
          .createSignedUrl(`${courseId}/${fileName}`, 3600);

        if (!signedUrlError && signedUrl && signedUrl.signedUrl) {
          return res.status(200).json({ url: signedUrl.signedUrl });
        }
      }
    }

    // If we got here, we couldn't create a working URL
    return res.status(404).json({
      message: 'Could not generate a valid signed URL',
      details: {
        podcastId,
        storagePath: podcast.storage_path
      }
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return res.status(500).json({ message: error.message });
  }
}
