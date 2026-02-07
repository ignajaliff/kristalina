-- Agregar columna vendedor_id a presupuestos (nuevo campo UUID)
ALTER TABLE public.presupuestos 
ADD COLUMN vendedor_id UUID REFERENCES public.user_roles(id) ON DELETE SET NULL;

-- Agregar columna vendedor_id a gestion
ALTER TABLE public.gestion 
ADD COLUMN vendedor_id UUID REFERENCES public.user_roles(id) ON DELETE SET NULL;

-- Crear índices para mejor rendimiento en consultas
CREATE INDEX idx_presupuestos_vendedor_id ON public.presupuestos(vendedor_id);
CREATE INDEX idx_gestion_vendedor_id ON public.gestion(vendedor_id);