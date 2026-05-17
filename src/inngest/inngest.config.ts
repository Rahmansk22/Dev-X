/**
 * INNGEST TIMEOUT CONFIGURATION
 * Fix deadline_exceeded errors for complex code generation
 */

// For your dev-x-code-agent function, use:
export const INNGEST_CONFIG = {
  // Increase from default (which appears to be ~5 min) to 15 minutes for complex generation
  functionTimeoutSeconds: 900, // 15 minutes
  
  // Sandbox dev server startup timeout
  sandboxStartupTimeoutMs: 300000, // 5 minutes
  
  // Preview health check timeout
  previewHealthCheckTimeoutMs: 5000, // 5 seconds per check
  
  // Step timeout for long-running operations
  stepTimeoutSeconds: 600, // 10 minutes per step
};

/**
 * Apply in your inngest.ts event definition:
 */
export const codeAgentExample = `
import { inngest } from './client';

export const devXCodeAgent = inngest.createFunction(
  {
    id: 'dev-x-code-agent',
    retryPolicy: {
      maxAttempts: 2,
      multiplier: 2,
    },
    // ✅ ADD THESE:
    concurrency: [
      {
        limit: 1,
        key: 'event.data.projectId', // One at a time per project
      },
    ],
    timeoutMs: 900000, // 15 minutes ← KEY FIX
  },
  { event: 'code-generation/start' },
  async ({ event, step }) => {
    // Your code generation logic
    
    // For long steps, increase timeout:
    const result = await step.run(
      'generate-code',
      async () => {
        // Your agent code here
      },
      {
        timeout: '10m', // ← Allow 10 minutes for this step
      }
    );
    
    return result;
  }
);
`;
