import { jwtVerify } from "jose";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { NextRequest } from "next/server";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not defined");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const authHeader = req.cookies.get("auth_token");

  if (!authHeader) {
    console.log("Middleware Error : No beare found")
    return NextResponse.json({ error: "No beare found" }, { status: 401 });
  }

  const token = authHeader.value;

  try {
    const { payload } = await jwtVerify(token, secret);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user", JSON.stringify(payload));

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    console.log("Error : verification failed")
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
