import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';
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

  const { id } = req.query;

  // GET - Fetch user by ID
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, data });
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
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .neq('id', id)
          .single();

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

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ success: true, data });
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

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
