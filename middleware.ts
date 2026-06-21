import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimit.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + 60000 });
    return { allowed: true, remaining: 99 };
  }

  limit.count++;
  if (limit.count > 100) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: 100 - limit.count };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP Headers
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\n/g, '');
  response.headers.set('Content-Security-Policy', csp);

  // Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || 'unknown';
    const { allowed, remaining } = getRateLimit(ip);

    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    response.headers.set('X-RateLimit-Remaining', remaining.toString());
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
