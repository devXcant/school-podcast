// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { UserRole } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admin can manage users
  if (session.user.role !== 'admin' && req.method !== 'GET') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  await dbConnect();

  // GET - Fetch users (with filtering)
  if (req.method === 'GET') {
    try {
      const { role, department, search } = req.query;

      let query: any = {};

      // Filter by role(s)
      if (role) {
        if (typeof role === 'string' && role.includes(',')) {
          query.role = { $in: role.split(',') };
        } else {
          query.role = role;
        }
      }

      // Filter by department
      if (department) {
        query.department = department;
      }

      // Search by name or email
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  }

  // POST - Create a new user
  if (req.method === 'POST') {
    try {
      const { name, email, password, role, department } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password,
        role: role as UserRole || 'student',
        department: department || '',
      });

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        }
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
