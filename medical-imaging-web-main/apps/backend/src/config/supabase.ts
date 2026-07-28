import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { logger } from '../utils/logger';

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SECRET_KEY are required when DATA_BACKEND or STORAGE_BACKEND is supabase'
    );
  }

  client = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  return client;
}

export async function testSupabaseConnection(): Promise<void> {
  const { error } = await getSupabaseClient().from('patients').select('id').limit(1);
  if (error) throw new Error(`Supabase connection failed: ${error.message}`);
  logger.info('Connected to Supabase');
}
