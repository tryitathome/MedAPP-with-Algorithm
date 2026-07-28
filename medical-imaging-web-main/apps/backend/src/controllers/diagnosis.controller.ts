// src/controllers/diagnosis.controller.ts
import { Request, Response } from 'express';
import { DiagnosisService } from '../services/diagnosis.service';
import { CreateDiagnosisRequest } from '@shared/types';
import { StoredDiagnosisResult } from '../repositories/diagnosis.repository';
import { diagnosesForApi, diagnosisForApi } from '../services/api-response.service';

export class DiagnosisController {
  private diagnosisService: DiagnosisService;

  constructor() {
    this.diagnosisService = new DiagnosisService();
  }

  analyzeGastritis = async (req: Request, res: Response): Promise<void> => {
    try {
      const diagnosisData: CreateDiagnosisRequest = req.body;
      const result = await this.diagnosisService.analyzeGastritis(diagnosisData);
      const responseData = await diagnosisForApi(result as StoredDiagnosisResult, true);
      
      res.status(200).json({
        success: true,
        data: responseData,
        message: 'Gastritis analysis completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze gastritis image'
      });
    }
  };

  analyzeOral = async (req: Request, res: Response): Promise<void> => {
    try {
      const diagnosisData: CreateDiagnosisRequest = req.body;
      const result = await this.diagnosisService.analyzeOral(diagnosisData);
      const responseData = await diagnosisForApi(result as StoredDiagnosisResult, true);

      console.log('Oral diagnosis result:', result); // Debug log
      
      res.status(200).json({
        success: true,
        data: responseData,
        message: 'Oral analysis completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze oral image'
      });
    }
  };

  analyzeOralDeep = async (req: Request, res: Response): Promise<void> => {
    try {
      const diagnosisData: CreateDiagnosisRequest = req.body;
      const result = await this.diagnosisService.analyzeOralDeep(diagnosisData);
      const responseData = await diagnosisForApi(result as StoredDiagnosisResult, true);
      res.status(200).json({ success: true, data: responseData, message: 'Oral deep analysis completed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to analyze oral image (deep)' });
    }
  };

  getDiagnosisById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.diagnosisService.getDiagnosisById(id);
      const responseData = await diagnosisForApi(result as StoredDiagnosisResult);
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch diagnosis'
      });
    }
  };

  getDiagnosisByPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;
      const results = await this.diagnosisService.getDiagnosisByPatient(patientId);
      const responseData = await diagnosesForApi(results as StoredDiagnosisResult[]);
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch patient diagnoses'
      });
    }
  };

  deleteDiagnosis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.diagnosisService.deleteDiagnosis(id);
      
      res.status(200).json({
        success: true,
        message: 'Diagnosis deleted successfully'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete diagnosis'
      });
    }
  };
}
