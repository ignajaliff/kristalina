
-- Add datos_contrato JSONB column
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS datos_contrato jsonb;

-- Remove legacy columns
ALTER TABLE public.contratos DROP COLUMN IF EXISTS legalrepresentative;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS legalrepresentativerut;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS communityrut;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS communityemail;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS legalrepresentativephone;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS communityformationdate;
