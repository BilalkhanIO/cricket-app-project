import { NextRequest, NextResponse } from "next/server";

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function jsonWithCors(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const existingHeaders = (init?.headers as Record<string, string>) || {};
  return NextResponse.json(body, {
    ...init,
    headers: { ...existingHeaders, ...corsHeaders },
  });
}

export function optionsWithCors(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
