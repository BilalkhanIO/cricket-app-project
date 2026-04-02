import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { createMobileAccessToken } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return jsonWithCors(
        req,
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        password: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return jsonWithCors(req, { error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return jsonWithCors(req, { error: "Invalid credentials" }, { status: 401 });
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.profileImage,
    };

    return jsonWithCors(req, {
      token: createMobileAccessToken(authUser),
      user: authUser,
    });
  } catch {
    return jsonWithCors(req, { error: "Login failed" }, { status: 500 });
  }
}
