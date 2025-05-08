// pages/api/podcasts/signed-url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

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

    console.log('Podcast data:', {
      id: podcast.id,
      storage_path: podcast.storage_path,
      course_id: podcast.course_id
    });

    // IMPORTANT: We need to fix the storage_path to remove any duplicate "podcasts/" prefix
    let storagePath = podcast.storage_path;

    if (storagePath && storagePath.startsWith('podcasts/')) {
      // Remove the leading "podcasts/" since the bucket name is already "podcasts"
      storagePath = storagePath.substring(9); // "podcasts/".length = 9
      console.log('Fixed storage path:', storagePath);
    }

    // Try to create a signed URL using the fixed storage path
    if (storagePath) {
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('podcasts') // This is the bucket name
        .createSignedUrl(storagePath, 3600);

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
      } else if (signedUrlData && signedUrlData.signedUrl) {
        console.log('Successfully created signed URL');
        return res.status(200).json({ url: signedUrlData.signedUrl });
      }
    }

    // If direct approach fails, try to parse from file_url
    if (podcast.file_url) {
      try {
        const url = new URL(podcast.file_url);
        const pathParts = url.pathname.split('/');

        // Find the filename (last part of the path)
        const fileName = pathParts[pathParts.length - 1];

        // Build different path combinations to try
        const pathsToTry = [];

        // Try course ID + filename if course_id exists
        if (podcast.course_id) {
          pathsToTry.push(`${podcast.course_id}/${fileName}`);
        }

        // Try the full path without the bucket name and leading "public/"
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex >= 0 && publicIndex + 2 < pathParts.length) {
          let extractedPath = '';
          for (let i = publicIndex + 2; i < pathParts.length; i++) {
            extractedPath += (extractedPath ? '/' : '') + pathParts[i];
          }
          pathsToTry.push(extractedPath);
        }

        // Add just the filename as a last resort
        pathsToTry.push(fileName);

        // Try each path
        for (const path of pathsToTry) {
          console.log('Trying path:', path);

          const { data: pathSignedUrl, error: pathSignedUrlError } = await supabase
            .storage
            .from('podcasts')
            .createSignedUrl(path, 3600);

          if (!pathSignedUrlError && pathSignedUrl && pathSignedUrl.signedUrl) {
            console.log('Success with path:', path);
            return res.status(200).json({ url: pathSignedUrl.signedUrl });
          }
        }
      } catch (e) {
        console.error('Error processing file URL:', e);
      }
    }

    // All attempts failed
    return res.status(404).json({
      message: 'Could not generate a valid audio URL after trying multiple approaches',
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
