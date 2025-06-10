
-- Agregar columna vendedor a la tabla presupuestos
ALTER TABLE public.presupuestos 
ADD COLUMN vendedor text;

-- Crear tabla vendedores
CREATE TABLE public.vendedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Agregar algunos vendedores de ejemplo
INSERT INTO public.vendedores (nombre, email, telefono) VALUES
('Pablo Ruiz', 'pablo.ruiz@empresa.com', '+56912345678'),
('Ana García', 'ana.garcia@empresa.com', '+56987654321'),
('Carlos López', 'carlos.lopez@empresa.com', '+56956789012');

-- Habilitar RLS en la tabla vendedores
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios autenticados puedan ver los vendedores
CREATE POLICY "Usuarios autenticados pueden ver vendedores" 
  ON public.vendedores 
  FOR SELECT 
  TO authenticated 
  USING (true);
