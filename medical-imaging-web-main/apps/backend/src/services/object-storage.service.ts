import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getStorageBackend } from '../config/data-backend';
import { getSupabaseClient } from '../config/supabase';

export class ObjectStorageService {
  private get bucket(): string {
    return process.env.SUPABASE_STORAGE_BUCKET ?? 'oral-images';
  }

  isEnabled(): boolean {
    return getStorageBackend() === 'supabase';
  }

  inputObjectPath(filename: string): string {
    return `inputs/${path.basename(filename)}`;
  }

  resultObjectPath(filename: string): string {
    return `results/${randomUUID()}-${path.basename(filename)}`;
  }

  private contentType(filename: string): string {
    switch (path.extname(filename).toLowerCase()) {
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  async uploadBuffer(buffer: Buffer, objectPath: string): Promise<string | undefined> {
    if (!this.isEnabled()) return undefined;

    const { error } = await getSupabaseClient().storage
      .from(this.bucket)
      .upload(objectPath, buffer, {
        contentType: this.contentType(objectPath),
        upsert: false
      });
    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    return objectPath;
  }

  async uploadLocalFile(filePath: string, objectPath: string): Promise<string | undefined> {
    if (!this.isEnabled()) return undefined;
    const buffer = await fs.promises.readFile(filePath);
    return this.uploadBuffer(buffer, objectPath);
  }

  async remove(objectPath: string): Promise<void> {
    if (!this.isEnabled()) return;
    const { error } = await getSupabaseClient().storage.from(this.bucket).remove([objectPath]);
    if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }

  async createSignedUrl(objectPath: string): Promise<string | undefined> {
    if (!this.isEnabled()) return undefined;
    const ttl = Number(process.env.SUPABASE_SIGNED_URL_TTL_SECONDS ?? 300);
    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('SUPABASE_SIGNED_URL_TTL_SECONDS must be a positive number');
    }

    const { data, error } = await getSupabaseClient().storage
      .from(this.bucket)
      .createSignedUrl(objectPath, ttl);
    if (error) throw new Error(`Supabase signed URL creation failed: ${error.message}`);
    return data.signedUrl;
  }
}

export const objectStorageService = new ObjectStorageService();
