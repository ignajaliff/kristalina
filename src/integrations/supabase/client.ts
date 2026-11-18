import { createClient } from '@supabase/supabase-js';
import { type Database } from './types';

// Único punto de acceso a Supabase en todo el proyecto.
// Las variables se inyectan al buildear: en local desde .env y en Cloudflare
// desde las Build Variables del Worker. vite.config.ts frena el build si faltan.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
