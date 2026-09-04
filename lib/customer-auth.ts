import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const ACCESS_COOKIE = "myshopbd_customer_access";
const REFRESH_COOKIE = "myshopbd_customer_refresh";
const DEVICE_COOKIE = "myshopbd_customer_device";

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const { data } = await supabaseAdmin().auth.getUser(token);
  if (!data.user) return null;
  const deviceId = store.get(DEVICE_COOKIE)?.value;
  if (deviceId) {
    const { data: device } = await supabaseAdmin().from("customer_devices").select("id").eq("id", deviceId).eq("user_id", data.user.id).is("revoked_at", null).maybeSingle();
    if (!device) return null;
  }
  return { user: data.user, deviceId };
}

export function setCustomerCookies(response: Response, accessToken: string, refreshToken: string, expiresIn: number, deviceId?: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `HttpOnly; Path=/; SameSite=Lax${secure}`;
  response.headers.append("Set-Cookie", `${ACCESS_COOKIE}=${accessToken}; Max-Age=${expiresIn}; ${base}`);
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=${refreshToken}; Max-Age=2592000; ${base}`);
  if (deviceId) response.headers.append("Set-Cookie", `${DEVICE_COOKIE}=${deviceId}; Max-Age=2592000; ${base}`);
}

export function clearCustomerCookies(response: Response) {
  response.headers.append("Set-Cookie", `${ACCESS_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  response.headers.append("Set-Cookie", `${REFRESH_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  response.headers.append("Set-Cookie", `${DEVICE_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

export const customerCookieNames = { DEVICE_COOKIE };
