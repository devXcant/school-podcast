import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';
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

  // GET - Fetch users (with filtering)
  if (req.method === 'GET') {
    try {
      const { role, department, search } = req.query;

      let query = supabase.from('users').select('*');

      // Filter by role(s)
      if (role) {
        if (typeof role === 'string' && role.includes(',')) {
          query = query.in('role', role.split(','));
        } else {
          query = query.eq('role', role);
        }
      }

      // Filter by department
      if (department) {
        query = query.eq('department', department);
      }

      // Search by name or email
      if (search && typeof search === 'string') {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
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
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user');
      }

      // Create user profile in the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name,
          email,
          role: role as UserRole || 'student',
          department: department || '',
        }])
        .select()
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      return res.status(201).json({
        success: true,
        data: userData
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
