import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  email: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET in environment variables.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminSession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const email = verified.payload.email;
    if (typeof email !== "string" || email.length === 0) {
      return null;
    }
    return { email };
  } catch {
    return null;
  }
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}
