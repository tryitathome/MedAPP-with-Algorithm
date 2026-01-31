-- Supabase PostgreSQL Schema
-- Migrated from MongoDB (medical-imaging database)
-- Generated for MedAPP-with-Algorithm

-- Enable UUID extension (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Diagnosis type enum
CREATE TYPE diagnosis_type AS ENUM ('gastritis', 'oral');

-- Severity level enum
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');

-- ============================================
-- PATIENTS TABLE
-- ============================================

CREATE TABLE patients (
    -- Primary key (UUID for Supabase best practice)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Patient identifier (maps to MongoDB 'id' field)
    patient_id VARCHAR(255) NOT NULL UNIQUE,

    -- Basic info
    name VARCHAR(255) NOT NULL,
    history TEXT NOT NULL,
    date VARCHAR(100) NOT NULL,
    index VARCHAR(255) NOT NULL,

    -- Optional fields
    biopsy_confirmed BOOLEAN DEFAULT NULL,
    doctor VARCHAR(255) DEFAULT NULL,

    -- Timestamps (auto-managed)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_name ON patients(name);

-- ============================================
-- DIAGNOSES TABLE
-- ============================================

CREATE TABLE diagnoses (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to patients (optional, for flexibility)
    patient_id VARCHAR(255) NOT NULL,

    -- Diagnosis metadata
    type diagnosis_type NOT NULL,
    image_url TEXT NOT NULL,

    -- Result fields (flattened from MongoDB nested 'results' object)
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    finding TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    severity severity_level DEFAULT NULL,
    report_recommendation TEXT DEFAULT NULL,
    status_code VARCHAR(100) DEFAULT NULL,

    -- Oral-specific scores (0-1 range)
    olp_score DECIMAL(5,4) DEFAULT NULL CHECK (olp_score IS NULL OR (olp_score >= 0 AND olp_score <= 1)),
    olk_score DECIMAL(5,4) DEFAULT NULL CHECK (olk_score IS NULL OR (olk_score >= 0 AND olk_score <= 1)),
    ooml_score DECIMAL(5,4) DEFAULT NULL CHECK (ooml_score IS NULL OR (ooml_score >= 0 AND ooml_score <= 1)),
    opmd_score DECIMAL(5,4) DEFAULT NULL CHECK (opmd_score IS NULL OR (opmd_score >= 0 AND opmd_score <= 1)),

    -- Knowledge content (markdown)
    knowledge TEXT DEFAULT NULL,

    -- Deep detection fields
    annotated_image_url TEXT DEFAULT NULL,
    detections JSONB DEFAULT NULL,

    -- Timestamps (auto-managed)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (matching MongoDB indexes)
CREATE INDEX idx_diagnoses_patient_id_created ON diagnoses(patient_id, created_at DESC);
CREATE INDEX idx_diagnoses_type ON diagnoses(type);
CREATE INDEX idx_diagnoses_created_at ON diagnoses(created_at DESC);

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to patients table
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to diagnoses table
CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Supabase Best Practice
-- ============================================

-- Enable RLS on tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth needs)
-- For now, allow all operations (you should restrict this in production)

-- Patients policies
CREATE POLICY "Allow all access to patients" ON patients
    FOR ALL USING (true) WITH CHECK (true);

-- Diagnoses policies
CREATE POLICY "Allow all access to diagnoses" ON diagnoses
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- OPTIONAL: Foreign Key Constraint
-- ============================================
-- Uncomment if you want strict referential integrity
-- (requires all diagnoses to have a valid patient)

-- ALTER TABLE diagnoses
--     ADD CONSTRAINT fk_diagnoses_patient
--     FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
--     ON DELETE CASCADE;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE patients IS 'Patient records for medical imaging system';
COMMENT ON TABLE diagnoses IS 'AI diagnosis results for oral/gastritis screening';

COMMENT ON COLUMN diagnoses.olp_score IS 'Oral Lichen Planus score (0-1)';
COMMENT ON COLUMN diagnoses.olk_score IS 'Oral Leukoplakia score (0-1)';
COMMENT ON COLUMN diagnoses.ooml_score IS 'Legacy OOML score (0-1)';
COMMENT ON COLUMN diagnoses.opmd_score IS 'Overall OPMD score (0-1)';
COMMENT ON COLUMN diagnoses.detections IS 'YOLO detection results as JSON array';
COMMENT ON COLUMN diagnoses.status_code IS 'Diagnosis status: OPMD_POSITIVE, OPMD_SUSPECTED, OPMD_NEGATIVE, OLK_POSITIVE, OLP_POSITIVE, OSF_POSITIVE';
