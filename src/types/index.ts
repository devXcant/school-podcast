// types/index.ts
import { DefaultSession } from 'next-auth';

export type UserRole = 'student' | 'course_rep' | 'lecturer' | 'admin';

export interface IUser {
  id: string;
  _id?: string; // MongoDB compatibility
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  courses?: string[] | ICourse[];
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date; // MongoDB compatibility
  updatedAt?: Date; // MongoDB compatibility
}

export interface ICourse {
  id: string;
  _id?: string; // MongoDB compatibility
  code: string;
  title: string;
  description?: string;
  lecturer: string | IUser;
  course_rep?: string | IUser;
  courseRep?: string | IUser; // MongoDB compatibility
  students?: string[] | IUser[];
  podcasts?: IPodcast[];
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date; // MongoDB compatibility
  updatedAt?: Date; // MongoDB compatibility
}

export interface IPodcast {
  id: string;
  _id?: string; // MongoDB compatibility
  title: string;
  description?: string;
  course_id: string;
  course?: ICourse;
  recorded_by: string;
  recordedBy?: string | IUser; // MongoDB compatibility
  recorded_by_user?: IUser;
  file_url: string;
  fileUrl?: string; // MongoDB compatibility
  storage_path: string;
  duration?: number;
  is_live?: boolean;
  isLive?: boolean; // MongoDB compatibility
  view_count?: number;
  viewCount?: number; // MongoDB compatibility
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date; // MongoDB compatibility
  updatedAt?: Date; // MongoDB compatibility
}

// NextAuth.js type declarations
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
