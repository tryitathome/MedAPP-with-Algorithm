import { StoredDiagnosisResult } from '../repositories/diagnosis.repository';
import { objectStorageService } from './object-storage.service';

export interface DiagnosisApiResponse extends Omit<StoredDiagnosisResult, 'imageObjectPath' | 'results'> {
  storageImageUrl?: string;
  results: Omit<
    StoredDiagnosisResult['results'],
    'annotatedImageObjectPath' | 'segmentationImageObjectPath'
  > & {
    storageAnnotatedImageUrl?: string;
    storageSegmentationImageUrl?: string;
  };
}

export async function diagnosisForApi(
  diagnosis: StoredDiagnosisResult,
  preserveLocalUrls = false
): Promise<DiagnosisApiResponse> {
  const { imageObjectPath, ...base } = diagnosis;
  const {
    annotatedImageObjectPath,
    segmentationImageObjectPath,
    ...results
  } = diagnosis.results;
  const response: DiagnosisApiResponse = { ...base, results };

  if (imageObjectPath) {
    const signedUrl = await objectStorageService.createSignedUrl(imageObjectPath);
    if (signedUrl) {
      if (preserveLocalUrls && response.imageUrl) response.storageImageUrl = signedUrl;
      else response.imageUrl = signedUrl;
    }
  }

  if (annotatedImageObjectPath) {
    const signedUrl = await objectStorageService.createSignedUrl(annotatedImageObjectPath);
    if (signedUrl) {
      if (preserveLocalUrls && response.results.annotatedImage) {
        response.results.storageAnnotatedImageUrl = signedUrl;
      } else {
        response.results.annotatedImage = signedUrl;
      }
    }
  }

  if (segmentationImageObjectPath) {
    const signedUrl = await objectStorageService.createSignedUrl(segmentationImageObjectPath);
    if (signedUrl) {
      if (preserveLocalUrls && response.results.segmentationImage) {
        response.results.storageSegmentationImageUrl = signedUrl;
      } else {
        response.results.segmentationImage = signedUrl;
      }
    }
  }

  return response;
}

export async function diagnosesForApi(diagnoses: StoredDiagnosisResult[]): Promise<DiagnosisApiResponse[]> {
  return Promise.all(diagnoses.map(diagnosis => diagnosisForApi(diagnosis)));
}
