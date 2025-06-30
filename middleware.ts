import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get('sessionCartId')) {
    const sessionCartId = crypto.randomUUID(); // ✅ Web API version

    response.cookies.set('sessionCartId', sessionCartId)
  }

  return response;
}
