import { createClient } from '@supabase/supabase-js';

/**
 * Get environment variables based on the current environment
 * In production (Vercel), uses environment variables configured on Vercel
 * In development, uses variables from .env file
 */
function getSupabaseConfig() {
  const isProduction = import.meta.env.PROD;
  
  const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const environment = isProduction ? 'production (Vercel)' : 'development (.env)';
    throw new Error(
      `Supabase configuration is missing for ${environment}. ` +
      `Please ensure VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY are set.`
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // Se o banco recusar a sessão (401, ex.: "JWT expired"), avisa o app para
    // voltar ao login, em vez de as telas mostrarem tudo zerado.
    fetch: async (input, init) => {
      const res = await fetch(input, init);
      if (res.status === 401 && !String(input).includes('/auth/v1/')) {
        window.dispatchEvent(new Event('auth:expired'));
      }
      return res;
    },
  },
});
