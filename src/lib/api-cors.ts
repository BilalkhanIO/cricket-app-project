import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");

  response.headers.set("Access-Control-Allow-Origin", origin || "*");
  response.headers.set("Vary", "Origin");

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export function jsonWithCors(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
) {
  return withCors(request, NextResponse.json(body, init));
}

export function optionsWithCors(request: NextRequest) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
