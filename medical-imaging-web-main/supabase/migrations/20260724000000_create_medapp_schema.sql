-- Server-only MedAPP schema. The application uses a Supabase secret/service-role
-- key from Express. No anon/authenticated RLS policies are created here.

create extension if not exists pgcrypto;

do $$ begin
  create type public.diagnosis_type as enum ('gastritis', 'oral', 'oral-deep');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.severity_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null unique,
  name text not null,
  history text not null default '',
  date text not null,
  "index" text not null,
  biopsy_confirmed boolean,
  doctor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null
    constraint diagnoses_patient_id_fkey
    references public.patients(patient_id)
    on update cascade
    on delete restrict,
  type public.diagnosis_type not null,
  image_object_path text,
  confidence double precision not null check (confidence between 0 and 1),
  finding text not null,
  findings jsonb not null default '[]'::jsonb,
  recommendation text not null,
  severity public.severity_level,
  report_recommendation text,
  status_code text,
  olp_score double precision check (olp_score is null or olp_score between 0 and 1),
  olk_score double precision check (olk_score is null or olk_score between 0 and 1),
  ooml_score double precision check (ooml_score is null or ooml_score between 0 and 1),
  opmd_score double precision check (opmd_score is null or opmd_score between 0 and 1),
  osf_score double precision check (osf_score is null or osf_score between 0 and 1),
  knowledge text,
  annotated_image_object_path text,
  segmentation_image_object_path text,
  detections jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diagnoses_patient_created
  on public.diagnoses (patient_id, created_at desc);
create index if not exists idx_diagnoses_type on public.diagnoses (type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists diagnoses_set_updated_at on public.diagnoses;
create trigger diagnoses_set_updated_at before update on public.diagnoses
for each row execute function public.set_updated_at();

alter table public.patients enable row level security;
alter table public.diagnoses enable row level security;

revoke all on table public.patients from anon, authenticated;
revoke all on table public.diagnoses from anon, authenticated;
grant all on table public.patients to service_role;
grant all on table public.diagnoses to service_role;

-- Private bucket. Object access is performed only by the server secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'oral-images',
  'oral-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
