/**
 * CLERK AUTHENTICATION SETUP
 * 
 * Install: npm install @clerk/nextjs
 * 
 * Required env vars:
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
 * CLERK_SECRET_KEY=sk_...
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/features',
  '/pricing',
  '/auth(.*)',
  '/api/public(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
