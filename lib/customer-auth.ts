import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const ACCESS_COOKIE = "myshopbd_customer_access";
const REFRESH_COOKIE = "myshopbd_customer_refresh";

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const { data } = await supabaseAdmin().auth.getUser(token);
  return data.user ? { user: data.user } : null;
}

export function setCustomerCookies(response: Response, accessToken: string, refreshToken: string, expiresIn: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `HttpOnly; Path=/; SameSite=Lax${secure}`;
  response.headers.append("Set-Cookie", `${ACCESS_COOKIE}=${accessToken}; Max-Age=${expiresIn}; ${base}`);
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=${refreshToken}; Max-Age=2592000; ${base}`);
}

export function clearCustomerCookies(response: Response) {
  response.headers.append("Set-Cookie", `${ACCESS_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}
