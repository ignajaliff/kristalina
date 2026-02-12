
-- Remove old columns from gestion
ALTER TABLE public.gestion DROP COLUMN IF EXISTS buildingaddress;
ALTER TABLE public.gestion DROP COLUMN IF EXISTS buildingtype;
ALTER TABLE public.gestion DROP COLUMN IF EXISTS legalrepresentative;

-- Add new JSON columns
ALTER TABLE public.gestion ADD COLUMN IF NOT EXISTS cliente jsonb;
ALTER TABLE public.gestion ADD COLUMN IF NOT EXISTS data_presupuesto jsonb;
ALTER TABLE public.gestion ADD COLUMN IF NOT EXISTS data_contrato jsonb;
