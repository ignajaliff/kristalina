-- Remove dia_pago column (no longer needed, all payments are on the 1st)
ALTER TABLE public.gestion DROP COLUMN IF EXISTS dia_pago;

-- Add metodo_cobro column to track payment method
ALTER TABLE public.gestion ADD COLUMN metodo_cobro text NOT NULL DEFAULT 'Inmediato';
