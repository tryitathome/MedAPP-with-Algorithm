export type DataBackend = 'memory' | 'mongodb' | 'supabase';
export type StorageBackend = 'local' | 'supabase';

function parseDataBackend(value: string): DataBackend {
  if (value === 'memory' || value === 'mongodb' || value === 'supabase') {
    return value;
  }
  throw new Error(`Unsupported DATA_BACKEND value: ${value}`);
}

export function getDataBackend(): DataBackend {
  // Preserve the existing development switch.
  if (process.env.NO_DB === 'true') return 'memory';
  return parseDataBackend((process.env.DATA_BACKEND ?? 'mongodb').toLowerCase());
}

export function getStorageBackend(): StorageBackend {
  const configured = process.env.STORAGE_BACKEND?.toLowerCase();
  if (configured === 'local' || configured === 'supabase') return configured;
  if (configured) throw new Error(`Unsupported STORAGE_BACKEND value: ${configured}`);

  return getDataBackend() === 'supabase' ? 'supabase' : 'local';
}
