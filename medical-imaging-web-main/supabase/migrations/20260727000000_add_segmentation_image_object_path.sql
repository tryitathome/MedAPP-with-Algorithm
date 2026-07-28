-- Keep the YOLO detection visualization and MMDetection segmentation output
-- as separate private Storage object references.
alter table public.diagnoses
  add column if not exists segmentation_image_object_path text;
