import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { createMobileAccessToken } from "@/lib/mobile-auth";
import { ROLE, canSelfRegister } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password) {
      return jsonWithCors(
        req,
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    const requestedRole = role || ROLE.FAN;
    if (!canSelfRegister(requestedRole)) {
      return jsonWithCors(
        req,
        { error: "This role cannot be created through mobile registration" },
        { status: 403 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonWithCors(req, { error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        role: requestedRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.profileImage,
    };

    return jsonWithCors(
      req,
      {
        token: createMobileAccessToken(authUser),
        user: authUser,
      },
      { status: 201 },
    );
  } catch {
    return jsonWithCors(req, { error: "Registration failed" }, { status: 500 });
  }
}
