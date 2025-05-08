import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';

// Store for active socket connections
interface SocketConnection {
  userId: string;
  socket: any;
}

let io: SocketIOServer | null = null;
const activeConnections: SocketConnection[] = [];

// Initialize Socket.io server
const initSocketServer = (req: NextApiRequest, res: NextApiResponse) => {
  if (res.socket && !io) {
    const httpServer: HttpServer = (res.socket as any).server;
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', async (socket) => {
      console.log('New client connected', socket.id);

      // Authenticate socket connection using session
      try {
        const session = await getSession({ req });

        if (!session) {
          socket.disconnect();
          return;
        }

        const userId = session.user.id;

        // Verify user exists in Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (error || !user) {
          socket.disconnect();
          return;
        }

        // Store connection
        activeConnections.push({ userId, socket });

        // Join user to their own room
        socket.join(`user:${userId}`);

        // Handle live audio streaming
        socket.on('start-stream', (courseId: string) => {
          socket.join(`course:${courseId}`);
          socket.to(`course:${courseId}`).emit('stream-started', { userId });
        });

        socket.on('audio-chunk', (data: { courseId: string, chunk: ArrayBuffer }) => {
          socket.to(`course:${data.courseId}`).emit('audio-chunk', {
            userId,
            chunk: data.chunk,
          });
        });

        socket.on('stop-stream', (courseId: string) => {
          socket.to(`course:${courseId}`).emit('stream-stopped', { userId });
          socket.leave(`course:${courseId}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('Client disconnected', socket.id);
          const index = activeConnections.findIndex(conn => conn.socket.id === socket.id);
          if (index !== -1) {
            activeConnections.splice(index, 1);
          }
        });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.disconnect();
      }
    });
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default initSocketServer;
