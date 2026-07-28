-- Enforce the existing application patient_id relationship without changing
-- the frontend/API contract. This migration intentionally fails when legacy
-- diagnosis rows reference a patient that does not exist.
do $$
begin
  if exists (
    select 1
    from public.diagnoses d
    left join public.patients p on p.patient_id = d.patient_id
    where p.patient_id is null
  ) then
    raise exception
      'Cannot add diagnoses patient foreign key: orphan diagnosis rows exist';
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_catalog = tc.constraint_catalog
      and kcu.constraint_schema = tc.constraint_schema
      and kcu.constraint_name = tc.constraint_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_catalog = tc.constraint_catalog
      and ccu.constraint_schema = tc.constraint_schema
      and ccu.constraint_name = tc.constraint_name
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'diagnoses'
      and kcu.column_name = 'patient_id'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'patients'
      and ccu.column_name = 'patient_id'
  ) then
    alter table public.diagnoses
      add constraint diagnoses_patient_id_fkey
      foreign key (patient_id)
      references public.patients(patient_id)
      on update cascade
      on delete restrict;
  end if;
end
$$;
