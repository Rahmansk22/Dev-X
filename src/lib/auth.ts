/**
 * AUTH HOOKS & UTILITIES
 */

import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Get current user ID (server-side)
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized - no user found');
  }
  return userId;
}

/**
 * Get current user (server-side)
 */
export async function getCurrentUserData() {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized - no user found');
  }
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}
