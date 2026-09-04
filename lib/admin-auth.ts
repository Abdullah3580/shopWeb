import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const ACCESS_COOKIE = "myshopbd_admin_access";
const REFRESH_COOKIE = "myshopbd_admin_refresh";
export type AdminRole = "owner" | "manager" | "catalog" | "fulfillment" | "finance";

export async function getAdminSession() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  const supabase = supabaseAdmin();
  const { data } = await supabase.auth.getUser(accessToken);
  if (!data.user) return null;
  const { data: roleRows } = await supabase.from("admin_user_roles").select("admin_roles(name)").eq("user_id", data.user.id);
  const roles = (roleRows || []).map((row) => (row.admin_roles as unknown as { name: AdminRole } | null)?.name).filter((role): role is AdminRole => Boolean(role));
  return { user: data.user, roles };
}

export async function requireAdminRole(allowedRoles?: AdminRole[]) {
  const session = await getAdminSession();
  if (!session) return null;
  if (allowedRoles?.length && !session.roles.some((role) => role === "owner" || allowedRoles.includes(role))) return null;
  return session;
}

export const adminCookieNames = { ACCESS_COOKIE, REFRESH_COOKIE };

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string, expiresIn: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `HttpOnly; Path=/; SameSite=Lax${secure}`;
  response.headers.append("Set-Cookie", `${ACCESS_COOKIE}=${accessToken}; Max-Age=${expiresIn}; ${base}`);
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=${refreshToken}; Max-Age=2592000; ${base}`);
}
