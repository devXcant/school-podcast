// pages/api/users/[id].ts
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

  // Only admin can manage users or users can manage their own account
  if (session.user.role !== 'admin' && session.user.id !== req.query.id) {
    return res.status(403).json({ message: 'Permission denied' });
  }

  await dbConnect();

  const { id } = req.query;

  // GET - Fetch user by ID
  if (req.method === 'GET') {
    try {
      const user = await User.findById(id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
  }

  // PUT - Update user
  if (req.method === 'PUT') {
    try {
      const { name, email, role, department } = req.body;

      // Check if email is already in use by another user
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      // Prepare update object
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (department) updateData.department = department;

      // Only admin can update role
      if (role && session.user.role === 'admin') {
        updateData.role = role as UserRole;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  }

  // DELETE - Delete user
  if (req.method === 'DELETE') {
    try {
      // Only admin can delete users
      if (session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Permission denied' });
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
