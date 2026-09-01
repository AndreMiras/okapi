import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { LoginPayload } from "@/lib/mykids/types";

const COOKIE = "mykids_session";
function key(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}
export function encodeSession(payload: LoginPayload, secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function decodeSession(
  value: string,
  secret: string,
): LoginPayload | null {
  try {
    const [iv, tag, data] = value.split(".");
    if (!iv || !tag || !data) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key(secret),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(data, "base64url")),
        decipher.final(),
      ]).toString("utf8"),
    ) as LoginPayload;
  } catch {
    return null;
  }
}
export async function getSession() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const secret = process.env.SESSION_SECRET;
  return secret ? decodeSession(value, secret) : null;
}
export function sessionCookie(value: string) {
  return {
    name: COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}
export { COOKIE };
