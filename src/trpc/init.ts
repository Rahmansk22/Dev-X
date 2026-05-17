import { auth } from '@clerk/nextjs/server';
import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { TRPCError } from '@trpc/server';

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  try {
    const authSession = await auth();
    return { auth: authSession || { userId: null, sessionId: null } };
  } catch (error) {
    console.error('[TRPC] Auth error:', error);
    return { auth: { userId: null, sessionId: null } };
  }
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;


const t = initTRPC.context().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

const isAuthed = t.middleware(({ next, ctx }: { next: any; ctx: Context }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'User not authenticated. Please sign in.',
     });
  }

  return next({
    ctx: {
      auth: ctx.auth,
    }
  });
});

// const publicProcedure = t.procedure;

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
