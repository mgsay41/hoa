import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin auth without a user table: the only credentials are ADMIN_USERNAME / ADMIN_PASSWORD
 * in the environment. A successful login gets a signed cookie "<expiry>.<signature>".
 *
 * The signing key is derived from AUTH_SECRET + the current username + password, so changing
 * any of them in the env instantly invalidates every existing session.
 */
export const SESSION_COOKIE = "hoa_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function config() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!username || !password || !secret) return null;
  return { username, password, secret };
}

function signingKey(c: { username: string; password: string; secret: string }) {
  return createHmac("sha256", c.secret).update(`${c.username}\n${c.password}`).digest();
}

function sign(expiresAt: number, c: NonNullable<ReturnType<typeof config>>) {
  return createHmac("sha256", signingKey(c)).update(`${c.username}.${expiresAt}`).digest("base64url");
}

/** Constant-time string comparison (hashing first so lengths always match). */
function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string) {
  const c = config();
  if (!c) return false;
  // Evaluate both so timing doesn't reveal which one was wrong
  const userOk = safeEqual(username, c.username);
  const passOk = safeEqual(password, c.password);
  return userOk && passOk;
}

export function createSessionToken() {
  const c = config();
  if (!c) throw new Error("ADMIN_USERNAME, ADMIN_PASSWORD and AUTH_SECRET must be set");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${expiresAt}.${sign(expiresAt, c)}`;
}

/** Returns the admin username when the token is valid and not expired, otherwise null. */
export function verifySessionToken(token: string | undefined | null) {
  const c = config();
  if (!c || !token) return null;
  const [expPart, signature] = token.split(".");
  const expiresAt = Number(expPart);
  if (!signature || !Number.isInteger(expiresAt) || expiresAt < Date.now() / 1000) return null;
  return safeEqual(signature, sign(expiresAt, c)) ? c.username : null;
}

export function readCookie(headers: Headers, name: string) {
  const header = headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
