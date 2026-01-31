import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory before anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Lazy initialization - only create client when actually needed
let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NO_DB === 'true') {
      // Return a dummy client that won't be used
      logger.warn('Supabase credentials not found, but NO_DB=true so continuing without DB');
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
      return _supabase;
    }
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required. Set NO_DB=true to skip database.');
  }

  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
};

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = getSupabase();
    const { error } = await client.from('patients').select('id').limit(1);
    if (error) {
      logger.error('Supabase connection test failed:', error.message);
      return false;
    }
    logger.info('Connected to Supabase');
    return true;
  } catch (error) {
    logger.error('Supabase connection error:', error);
    return false;
  }
};
