import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export type MobileAuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
};

type MobileAuthTokenPayload = MobileAuthUser & {
  type: "mobile-access";
};

function getMobileAuthSecret() {
  return process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-mobile-secret";
}

export function createMobileAccessToken(user: MobileAuthUser) {
  return jwt.sign(
    {
      ...user,
      type: "mobile-access",
    },
    getMobileAuthSecret(),
    { expiresIn: "30d" },
  );
}

export function verifyMobileAccessToken(token: string) {
  return jwt.verify(token, getMobileAuthSecret()) as MobileAuthTokenPayload;
}

export function getBearerToken(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function getMobileUserFromRequest(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    return verifyMobileAccessToken(token);
  } catch {
    return null;
  }
}
