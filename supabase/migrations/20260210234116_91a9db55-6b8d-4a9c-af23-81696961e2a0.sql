
-- 1. Rename presupuestos to prospectos
ALTER TABLE public.presupuestos RENAME TO prospectos;

-- 2. Remove columns that no longer belong in prospectos
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS equipos_instalados;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS terminos_contrato;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS fecha_instalacion_equipos;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS fecha_firma_contrato;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS fecha_aprobacion_presupuesto;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS presupuesto_aceptado;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS communityformationdate;

-- Remove columns moving to new presupuestos table
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS monto;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS por_unidad;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS inversion;

-- Remove columns moving to contratos table
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS legalrepresentative;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS legalrepresentativerut;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS communityrut;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS communityemail;
ALTER TABLE public.prospectos DROP COLUMN IF EXISTS legalrepresentativephone;

-- 3. Create new presupuestos table
CREATE TABLE public.presupuestos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id UUID NOT NULL REFERENCES public.prospectos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'Enviado',
  fecha_aprobacion DATE,
  doc_presupuesto TEXT,
  monto NUMERIC DEFAULT 0,
  por_unidad NUMERIC DEFAULT 0,
  inversion NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read presupuestos" ON public.presupuestos FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert presupuestos" ON public.presupuestos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update presupuestos" ON public.presupuestos FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete presupuestos" ON public.presupuestos FOR DELETE USING (true);

-- 4. Create contratos table
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id UUID NOT NULL REFERENCES public.prospectos(id) ON DELETE CASCADE,
  estado_contrato TEXT NOT NULL DEFAULT 'Contrato no firmado',
  estado_equipos TEXT NOT NULL DEFAULT 'Equipos sin instalar',
  fecha_instalacion_equipos DATE,
  fecha_contrato_firmado DATE,
  doc_contrato TEXT,
  legalrepresentative TEXT,
  legalrepresentativerut TEXT,
  communityrut TEXT,
  communityemail TEXT,
  legalrepresentativephone TEXT,
  communityformationdate TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read contratos" ON public.contratos FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert contratos" ON public.contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update contratos" ON public.contratos FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete contratos" ON public.contratos FOR DELETE USING (true);

-- 5. Indices for performance
CREATE INDEX idx_presupuestos_prospecto_id ON public.presupuestos(prospecto_id);
CREATE INDEX idx_contratos_prospecto_id ON public.contratos(prospecto_id);
