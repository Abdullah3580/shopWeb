import { createClient } from "@supabase/supabase-js";

// Public client — safe to use in the browser. Only reads categories/active products (RLS enforced).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client — uses the service role key, bypasses RLS.
// NEVER import this in a "use client" component or expose it to the browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
