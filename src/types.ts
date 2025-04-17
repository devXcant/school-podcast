// types/index.ts
import { ObjectId } from 'mongoose';

export type UserRole = 'student' | 'course_rep' | 'lecturer' | 'admin';

export interface IUser {
  _id: string | ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  courses?: string[] | ICourse[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourse {
  _id: string | ObjectId;
  code: string;
  title: string;
  description?: string;
  lecturer: string | ObjectId | IUser;
  courseRep?: string | ObjectId | IUser;
  students?: string[] | ObjectId[] | IUser[];
  podcasts?: string[] | ObjectId[] | IPodcast[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPodcast {
  _id: string | ObjectId;
  title: string;
  description?: string;
  course: string | ObjectId | ICourse;
  recordedBy: string | ObjectId | IUser;
  fileUrl: string;
  duration?: number;
  isLive?: boolean;
  viewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

import { DefaultSession } from 'next-auth';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
