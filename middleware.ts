 import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  hrRoutes,
} from "./routes";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

   console.log('\n=== Middleware Triggered ===');
  console.log('Path:', pathname);
  console.log('Session:', session?.user ? 'Authenticated' : 'Not authenticated');
  console.log('User Role:', session?.user?.role || 'No role');

  const isLoggedIn = !!session?.user;
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isHRRoute = hrRoutes.some(route => pathname.startsWith(route));

  console.log('Route Checks:', {
    isApiAuthRoute,
    isPublicRoute,
    isAuthRoute,
    isHRRoute
  });

  if (isApiAuthRoute) {
    console.log('API Auth Route - Skipping middleware');
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      console.log('Auth Route: Logged in user - Redirecting to default');
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    console.log('Auth Route: Allowing access');
    return NextResponse.next();
  }

  if (isHRRoute) {
    console.log('HR Route Detected');

    if (!isLoggedIn) {
      console.log('HR Route: Not logged in - Redirecting to login');
      return NextResponse.redirect(new URL("/auth/login", nextUrl));
    }

    if (session.user.role !== "HR") {
      console.log(`HR Route: Access Denied (Role: ${session.user.role})`);
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    console.log('HR Route: Access Granted');
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    console.log('Protected Route: Not logged in - Redirecting to login');
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  console.log('No restrictions - Allowing access');
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};