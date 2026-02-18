
-- Add payment configuration columns to gestion table
ALTER TABLE public.gestion
  ADD COLUMN IF NOT EXISTS dia_pago integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fecha_primera_factura date,
  ADD COLUMN IF NOT EXISTS monto_renting numeric,
  ADD COLUMN IF NOT EXISTS pagos_json jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.gestion.dia_pago IS 'Day of month billing occurs: 1 or 30';
COMMENT ON COLUMN public.gestion.fecha_primera_factura IS 'Date of first invoice/billing';
COMMENT ON COLUMN public.gestion.monto_renting IS 'Monthly renting amount from presupuesto with discount applied';
COMMENT ON COLUMN public.gestion.pagos_json IS 'Array of all monthly payment records with status and invoice links';
