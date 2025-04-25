// pages/api/podcasts/debug-proxy.ts
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
    // Get podcast details with full logging
    console.log(`Fetching podcast with ID: ${podcastId}`);

    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (podcastError) {
      console.error('Error fetching podcast:', podcastError);
      return res.status(404).json({
        message: 'Podcast not found',
        error: podcastError.message,
        details: podcastError.details
      });
    }

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found (null data)' });
    }

    console.log('Found podcast:', {
      id: podcast.id,
      title: podcast.title,
      file_url: podcast.file_url,
      storage_path: podcast.storage_path
    });

    // First try using just the mp3 filename from the URL as a last resort
    let fileUrl = podcast.file_url;
    let fileName = '';

    if (fileUrl && fileUrl.includes('.mp3')) {
      try {
        const urlObj = new URL(fileUrl);
        const pathSegments = urlObj.pathname.split('/');
        fileName = pathSegments[pathSegments.length - 1];
        console.log('Extracted file name:', fileName);

        // Try to find this file in the podcasts bucket
        const { data: listData, error: listError } = await supabase
          .storage
          .from('podcasts')
          .list();

        if (listError) {
          console.error('Error listing bucket contents:', listError);
        } else {
          console.log('Files in root of podcasts bucket:', listData.map(item => item.name));
        }

        // List all course ID folders in the bucket
        if (podcast.course_id) {
          console.log(`Checking course folder: ${podcast.course_id}`);
          const { data: courseFolder, error: courseFolderError } = await supabase
            .storage
            .from('podcasts')
            .list(podcast.course_id);

          if (courseFolderError) {
            console.error(`Error listing course folder: ${podcast.course_id}`, courseFolderError);
          } else if (courseFolder) {
            console.log(`Files in course folder ${podcast.course_id}:`, courseFolder.map(item => item.name));

            // Check if our file is in this folder
            const fileMatch = courseFolder.find(item => item.name === fileName);
            if (fileMatch) {
              console.log('Found matching file in course folder!');
              const filePath = `${podcast.course_id}/${fileName}`;

              const { data: signedUrl, error: signedUrlError } = await supabase
                .storage
                .from('podcasts')
                .createSignedUrl(filePath, 3600);

              if (signedUrlError) {
                console.error('Error creating signed URL:', signedUrlError);
              } else if (signedUrl) {
                console.log('Successfully created signed URL using found file path');
                return res.redirect(signedUrl.signedUrl);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing file URL:', e);
      }
    }

    // Try storage_path if available
    if (podcast.storage_path) {
      console.log(`Trying storage_path: ${podcast.storage_path}`);

      // Create a signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('podcasts')
        .createSignedUrl(podcast.storage_path, 3600);

      if (signedUrlError) {
        console.error('Error creating signed URL from storage_path:', signedUrlError);
      } else if (signedUrlData) {
        console.log('Successfully created signed URL from storage_path');
        return res.redirect(signedUrlData.signedUrl);
      }
    }

    // If we got here, we couldn't create a working URL
    return res.status(404).json({
      message: 'Could not access audio file',
      podcastData: {
        id: podcast.id,
        title: podcast.title,
        hasFileUrl: !!podcast.file_url,
        hasStoragePath: !!podcast.storage_path,
        courseId: podcast.course_id
      }
    });

  } catch (error: any) {
    console.error('Error in debug proxy:', error);
    return res.status(500).json({
      message: 'Error in debug proxy',
      error: error.message,
      stack: error.stack
    });
  }
}
