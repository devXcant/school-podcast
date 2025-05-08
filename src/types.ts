// types.ts
import { DefaultSession } from 'next-auth';

export type UserRole = 'student' | 'course_rep' | 'lecturer' | 'admin';

export interface IUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  courses?: string[] | ICourse[];
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourse {
  id: string;
  _id?: string;
  code: string;
  title: string;
  description?: string;
  lecturer: string | IUser;
  course_rep?: string | IUser;
  courseRep?: string | IUser;
  students?: string[] | IUser[];
  podcasts?: IPodcast[];
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPodcast {
  author: string;
  id: string;
  _id?: string;
  title: string;
  description?: string;
  course_id?: string;
  course?: ICourse;
  recorded_by?: string;
  recordedBy?: string | IUser;
  recorded_by_user?: IUser;
  file_url?: string;
  fileUrl?: string;
  storage_path?: string;
  duration?: number;
  is_live?: boolean;
  isLive?: boolean;
  view_count?: number;
  viewCount?: number;
  created_at?: Date;
  updated_at?: Date;
  live_started_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
