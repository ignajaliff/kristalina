
-- Create reportes table
CREATE TABLE public.reportes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestion_id UUID NOT NULL REFERENCES public.gestion(id) ON DELETE CASCADE,
  datos_reporte JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow authenticated users to read reportes"
ON public.reportes FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert reportes"
ON public.reportes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reportes"
ON public.reportes FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete reportes"
ON public.reportes FOR DELETE USING (true);
