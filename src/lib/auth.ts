import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export async function validateCredentials(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!userData) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: userData.name,
    role: userData.role
  };
}
