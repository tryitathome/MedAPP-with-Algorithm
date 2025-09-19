import { UploadImageResponse, OralDiagnosisRequest, OralDiagnosisResponse } from '@/types/oral';

// src/services/api/oralDiagnosisService.ts
class OralDiagnosisService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload image for oral diagnosis
   */
  async uploadImage(file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseUrl}/upload/image`;
    console.log('Uploading to:', url); // Debug log
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  /**
   * Analyze oral image for diagnosis
   */
  async analyzeOralImage(patientId: string, imageFile: File): Promise<OralDiagnosisResponse> {
    try {
      // First upload the image
      const uploadResult = await this.uploadImage(imageFile);
      // const uploadResult = {imageUrl: 'https://picsum.photos/200/300', filename: imageFile.name}; // Mocked upload result for testing

      // Then send for analysis
      const analysisRequest: OralDiagnosisRequest = {
        patientId: patientId,
        imageUrl: uploadResult.imageUrl,
        filename: uploadResult.filename
      };

      console.log('Analysis request:', analysisRequest); // Debug log

      const response = await fetch(`${this.baseUrl}/diagnosis/oral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Oral diagnosis error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze oral image');
    }
  }

  /**
   * Analyze oral image for deep detection (3-class classification)
   */
  async analyzeOralImageDeep(analysisRequest: OralDiagnosisRequest): Promise<OralDiagnosisResponse> {
    try {
      console.log('Deep analysis request:', analysisRequest); // Debug log

      const response = await fetch(`${this.baseUrl}/diagnosis/oral/deep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Deep analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Deep analysis result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Deep oral diagnosis error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze oral image (deep detection)');
    }
  }
}

// Create singleton instance
export const oralDiagnosisService = new OralDiagnosisService();