// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = [
  "/dashboard",
  "/create",
  "/profile",
  "/edit",
  "/manageSite",
  "/companies",
  "/profileSetting",
];
const authRoutes = ["/", "/register"];

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(pathname);

  // For protected routes, verify the token
  if (isProtectedRoute) {
    if (!token) {
      // No token found, redirect to login
      return NextResponse.redirect(new URL("/", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      // Invalid token, clear it and redirect to login
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  // For auth routes, redirect if token is valid
  if (isAuthRoute) {
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
