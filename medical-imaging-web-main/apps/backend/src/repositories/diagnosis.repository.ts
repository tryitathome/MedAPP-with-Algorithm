import { DiagnosisResponse, DiagnosisResult } from '@shared/types';
import path from 'path';
import { getDataBackend, getStorageBackend } from '../config/data-backend';
import { getSupabaseClient } from '../config/supabase';
import { createError } from '../middleware/error.middleware';
import { DiagnosisModel } from '../models/Diagnosis';
import { DiagnosisInsert, DiagnosisRow, DiagnosisType, Json } from '../types/database.types';

interface ExtendedDiagnosisResponse extends DiagnosisResponse {
  OSF?: number;
  annotatedImage?: string;
  annotatedImageObjectPath?: string;
  segmentationImage?: string;
  segmentationImageObjectPath?: string;
  detections?: unknown[];
}

export interface StoredDiagnosisResult extends DiagnosisResult {
  imageObjectPath?: string;
  results: ExtendedDiagnosisResponse;
}

export interface DiagnosisRepository {
  create(diagnosis: StoredDiagnosisResult): Promise<StoredDiagnosisResult>;
  findById(id: string): Promise<StoredDiagnosisResult | null>;
  findByPatient(patientId: string): Promise<StoredDiagnosisResult[]>;
  updateSegmentationImagePath(
    id: string,
    patientId: string,
    objectPath: string
  ): Promise<StoredDiagnosisResult | null>;
  delete(id: string): Promise<boolean>;
}

function inferInputObjectPath(imageUrl: string): string | undefined {
  if (!imageUrl.startsWith('/api/upload/') && !imageUrl.startsWith('/uploads/')) return undefined;
  const filename = path.basename(imageUrl.split('?')[0]);
  if (!filename || filename === 'temp-image.jpg') return undefined;
  return `inputs/${filename}`;
}

function toSupabaseInsert(diagnosis: StoredDiagnosisResult): DiagnosisInsert {
  const results = diagnosis.results;
  const inferredObjectPath = getStorageBackend() === 'supabase'
    ? inferInputObjectPath(diagnosis.imageUrl)
    : undefined;
  return {
    patient_id: diagnosis.patientId,
    type: diagnosis.type as DiagnosisType,
    image_object_path: diagnosis.imageObjectPath ?? inferredObjectPath ?? null,
    confidence: results.confidence,
    finding: results.finding ?? results.findings[0] ?? '',
    findings: results.findings as Json,
    recommendation: results.recommendation,
    severity: results.severity ?? null,
    report_recommendation: results.reportRecommendation ?? null,
    status_code: results.statusCode ?? null,
    olp_score: results.OLP ?? null,
    olk_score: results.OLK ?? null,
    ooml_score: results.OOML ?? null,
    opmd_score: results.OPMD ?? null,
    osf_score: results.OSF ?? null,
    knowledge: results.knowledge ?? null,
    annotated_image_object_path: results.annotatedImageObjectPath ?? null,
    segmentation_image_object_path: results.segmentationImageObjectPath ?? null,
    detections: (results.detections ?? null) as Json | null
  };
}

function stringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function fromSupabaseRow(row: DiagnosisRow): StoredDiagnosisResult {
  const findings = stringArray(row.findings);
  return {
    _id: row.id,
    id: row.id,
    patientId: row.patient_id,
    type: row.type as DiagnosisResult['type'],
    imageUrl: '',
    imageObjectPath: row.image_object_path ?? undefined,
    results: {
      confidence: row.confidence,
      finding: row.finding,
      findings: findings.length > 0 ? findings : [row.finding],
      recommendation: row.recommendation,
      severity: row.severity ?? undefined,
      reportRecommendation: row.report_recommendation ?? undefined,
      statusCode: (row.status_code ?? undefined) as DiagnosisResponse['statusCode'],
      OLP: row.olp_score ?? undefined,
      OLK: row.olk_score ?? undefined,
      OOML: row.ooml_score ?? undefined,
      OPMD: row.opmd_score ?? undefined,
      OSF: row.osf_score ?? undefined,
      knowledge: row.knowledge ?? undefined,
      annotatedImageObjectPath: row.annotated_image_object_path ?? undefined,
      segmentationImageObjectPath: row.segmentation_image_object_path ?? undefined,
      detections: Array.isArray(row.detections) ? row.detections as unknown[] : undefined
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

class MemoryDiagnosisRepository implements DiagnosisRepository {
  private readonly diagnoses: StoredDiagnosisResult[] = [];

  async create(diagnosis: StoredDiagnosisResult): Promise<StoredDiagnosisResult> {
    this.diagnoses.push(diagnosis);
    return diagnosis;
  }

  async findById(id: string): Promise<StoredDiagnosisResult | null> {
    return this.diagnoses.find(item => item._id === id || item.id === id) ?? null;
  }

  async findByPatient(patientId: string): Promise<StoredDiagnosisResult[]> {
    return this.diagnoses.filter(item => item.patientId === patientId).reverse();
  }

  async updateSegmentationImagePath(
    id: string,
    patientId: string,
    objectPath: string
  ): Promise<StoredDiagnosisResult | null> {
    const diagnosis = this.diagnoses.find(
      item => (item._id === id || item.id === id) && item.patientId === patientId
    );
    if (!diagnosis) return null;
    diagnosis.results.segmentationImageObjectPath = objectPath;
    diagnosis.updatedAt = new Date();
    return diagnosis;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.diagnoses.findIndex(item => item._id === id || item.id === id);
    if (index < 0) return false;
    this.diagnoses.splice(index, 1);
    return true;
  }
}

class MongoDiagnosisRepository implements DiagnosisRepository {
  async create(diagnosis: StoredDiagnosisResult): Promise<StoredDiagnosisResult> {
    const row = await new DiagnosisModel(diagnosis).save();
    return row.toObject() as unknown as StoredDiagnosisResult;
  }

  async findById(id: string): Promise<StoredDiagnosisResult | null> {
    const row = await DiagnosisModel.findById(id);
    return row ? row.toObject() as unknown as StoredDiagnosisResult : null;
  }

  async findByPatient(patientId: string): Promise<StoredDiagnosisResult[]> {
    const rows = await DiagnosisModel.find({ patientId }).sort({ createdAt: -1 });
    return rows.map(row => row.toObject() as unknown as StoredDiagnosisResult);
  }

  async updateSegmentationImagePath(
    id: string,
    patientId: string,
    objectPath: string
  ): Promise<StoredDiagnosisResult | null> {
    const row = await DiagnosisModel.findOneAndUpdate(
      { _id: id, patientId },
      { $set: { 'results.segmentationImageObjectPath': objectPath } },
      { new: true }
    );
    return row ? row.toObject() as unknown as StoredDiagnosisResult : null;
  }

  async delete(id: string): Promise<boolean> {
    return Boolean(await DiagnosisModel.findByIdAndDelete(id));
  }
}

class SupabaseDiagnosisRepository implements DiagnosisRepository {
  private readonly client = getSupabaseClient();

  async create(diagnosis: StoredDiagnosisResult): Promise<StoredDiagnosisResult> {
    const { data, error } = await this.client
      .from('diagnoses')
      .insert(toSupabaseInsert(diagnosis))
      .select('*')
      .single();
    if (error) throw createError(`Failed to save diagnosis: ${error.message}`, 500);

    // Preserve local URLs in the immediate inference response. They are needed by
    // the next local Python stage; persisted reads are resolved to signed URLs.
    const stored = fromSupabaseRow(data as DiagnosisRow);
    stored.imageUrl = diagnosis.imageUrl;
    stored.results.annotatedImage = diagnosis.results.annotatedImage;
    return stored;
  }

  async findById(id: string): Promise<StoredDiagnosisResult | null> {
    const { data, error } = await this.client.from('diagnoses').select('*').eq('id', id).maybeSingle();
    if (error) throw createError(`Failed to fetch diagnosis: ${error.message}`, 500);
    return data ? fromSupabaseRow(data as DiagnosisRow) : null;
  }

  async findByPatient(patientId: string): Promise<StoredDiagnosisResult[]> {
    const { data, error } = await this.client
      .from('diagnoses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw createError(`Failed to fetch diagnoses: ${error.message}`, 500);
    return ((data ?? []) as DiagnosisRow[]).map(fromSupabaseRow);
  }

  async updateSegmentationImagePath(
    id: string,
    patientId: string,
    objectPath: string
  ): Promise<StoredDiagnosisResult | null> {
    const { data, error } = await this.client
      .from('diagnoses')
      .update({ segmentation_image_object_path: objectPath })
      .eq('id', id)
      .eq('patient_id', patientId)
      .select('*')
      .maybeSingle();
    if (error) throw createError(`Failed to attach segmentation result: ${error.message}`, 500);
    return data ? fromSupabaseRow(data as DiagnosisRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('diagnoses')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw createError(`Failed to delete diagnosis: ${error.message}`, 500);
    return Boolean(data);
  }
}

let memoryRepository: DiagnosisRepository | undefined;

export function createDiagnosisRepository(): DiagnosisRepository {
  switch (getDataBackend()) {
    case 'memory':
      memoryRepository ??= new MemoryDiagnosisRepository();
      return memoryRepository;
    case 'mongodb':
      return new MongoDiagnosisRepository();
    case 'supabase':
      return new SupabaseDiagnosisRepository();
  }
}
