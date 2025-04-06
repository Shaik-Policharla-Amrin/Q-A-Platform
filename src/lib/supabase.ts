import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in the environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Video upload allowed only between 2 PM - 7 PM
export const checkUploadTime = () => {
  const hours = new Date().getHours();
  return hours >= 14 && hours < 19;
};

// Mobile access allowed only between 10 AM - 1 PM
export const checkMobileAccessTime = () => {
  const hours = new Date().getHours();
  return hours >= 10 && hours < 13;
};

// Generate a secure password without numbers or special characters
export const generatePassword = () => {
  const length = 12;
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const allChars = upperCase + lowerCase;

  let password = '';
  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];

  for (let i = 2; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password;
};

// Limit password reset to once per day
export const canRequestPasswordReset = async (userId: string) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('password_reset_count, password_reset_timestamp')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn("User fetch error:", error.message);
    return true; // allow if user fetch fails (fallback)
  }

  const now = new Date();
  const lastReset = user.password_reset_timestamp ? new Date(user.password_reset_timestamp) : null;

  if (!lastReset) return true;

  const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastReset >= 24) {
    // Reset count after 24 hours
    await supabase
      .from('users')
      .update({ password_reset_count: 0 })
      .eq('id', userId);
    return true;
  }

  return user.password_reset_count < 1;
};
export default supabase;