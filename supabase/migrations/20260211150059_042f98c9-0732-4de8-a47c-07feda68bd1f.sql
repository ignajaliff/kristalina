
-- Add datos_presupuesto jsonb column
ALTER TABLE public.presupuestos ADD COLUMN datos_presupuesto jsonb NULL;

-- Remove old columns
ALTER TABLE public.presupuestos DROP COLUMN IF EXISTS monto;
ALTER TABLE public.presupuestos DROP COLUMN IF EXISTS por_unidad;
ALTER TABLE public.presupuestos DROP COLUMN IF EXISTS inversion;

-- Create storage bucket for presupuesto PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('presupuestos-pdf', 'presupuestos-pdf', true);

-- Storage policies for presupuestos-pdf bucket
CREATE POLICY "Anyone can read presupuesto PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'presupuestos-pdf');

CREATE POLICY "Authenticated users can upload presupuesto PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'presupuestos-pdf' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update presupuesto PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'presupuestos-pdf' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete presupuesto PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'presupuestos-pdf' AND auth.role() = 'authenticated');
