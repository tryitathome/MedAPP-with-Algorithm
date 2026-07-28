// src/services/api/usePatientService.tsx
import type { CreatePatientRequest, Patient } from '@shared/types';

export interface PatientResponse {
  success: boolean;
  data: Patient;
}

interface PatientsResponse {
  success: boolean;
  data: Patient[];
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const errorData = await response.json().catch(() => ({})) as {
    error?: string;
    message?: string;
  };
  return new Error(errorData.error ?? errorData.message ?? fallback);
}

export class PatientService {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    fetcher: typeof fetch = fetch
  ) {
    this.baseUrl = baseUrl;
    // Window.fetch is context-sensitive in browsers. Binding it once prevents
    // `this.fetcher(...)` from invoking the native function with PatientService
    // as its receiver (Chrome reports that as "Illegal invocation").
    this.fetcher = fetcher.bind(globalThis);
  }

  /**
   * Get patient by ID
   */
  async getPatientById(id: string): Promise<PatientResponse | null> {
    const url = `${this.baseUrl}/patients/${encodeURIComponent(id)}`;
    console.log('Fetching patient from:', url); // Debug log

    const response = await this.fetcher(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw await responseError(response, `Failed to fetch patient: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Patient fetch result:', result); // Debug log
    return result;
  }

  /**
   * Get all patients
   */
  async getAllPatients(): Promise<PatientsResponse> {
    const url = `${this.baseUrl}/patients`;
    console.log('Fetching all patients from:', url); // Debug log
    
    try {
      const response = await this.fetcher(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await responseError(response, `Failed to fetch patients: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('All patients fetch result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Patients fetch error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patients');
    }
  }

  /**
   * Create a new patient
   */
  async createPatient(patientData: CreatePatientRequest): Promise<PatientResponse> {
    const url = `${this.baseUrl}/patients`;
    console.log('Creating patient at:', url); // Debug log
    
    try {
      const response = await this.fetcher(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        throw await responseError(response, `Failed to create patient: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Patient create result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Patient create error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create patient');
    }
  }

  /**
   * Update patient
   */
  async updatePatient(id: string, patientData: any): Promise<PatientResponse> {
    const url = `${this.baseUrl}/patients/${encodeURIComponent(id)}`;
    console.log('Updating patient at:', url); // Debug log
    
    try {
      const response = await this.fetcher(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        throw await responseError(response, `Failed to update patient: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Patient update result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Patient update error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update patient');
    }
  }

  /**
   * Delete patient
   */
  async deletePatient(id: string): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/patients/${encodeURIComponent(id)}`;
    console.log('Deleting patient at:', url); // Debug log
    
    try {
      const response = await this.fetcher(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await responseError(response, `Failed to delete patient: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Patient delete result:', result); // Debug log

      return result;
    } catch (error) {
      console.error('Patient delete error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete patient');
    }
  }
}

// Create singleton instance
export const patientService = new PatientService();
