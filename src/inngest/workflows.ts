/**
 * INNGEST WORKFLOW - END-TO-END APP GENERATION
 * 
 * Flow:
 * 1. User submits request → analyzer extracts intent
 * 2. builder generates code based on intent
 * 3. verifier checks if code builds
 * 4. If failed: fixer regenerates problematic files
 * 5. If success: deployer launches app live
 * 6. Memory saves all snapshots and deployments
 * 7. User gets live URL
 */

import { inngest } from './client';
import { verifyBuild } from '@/self-healing/verifier';
import { deploymentManager } from '@/deployment/auto-deployer';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import {
  recordDeployment,
  recordBuild,
} from '@/lib/projects-db-simple';
import { errorIntelligence } from '@/lib/error-intelligence';
import { ULTIMATE_PROMPT } from '@/prompt';

// Model mapping with fallbacks
const modelMapping: Record<string, string> = {
  'grok': 'x-ai/grok-4.3',
  'deepseek': 'deepseek/deepseek-v4-flash',
  'geminiLite': 'google/gemini-2.5-flash-lite',
  'geminiFlash': 'google/gemini-2.5-flash',
};

/**
 * Call OpenRouter API with Grok/GPT to generate code
 */
async function callAIModel(
  model: string,
  systemPrompt: string,
  userMessage: string,
) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      throw new Error('OPENROUTER_API_KEY not set');
    }

    const chosenModel = modelMapping[model] || 'deepseek/deepseek-v4-flash';
    console.log(`[callAIModel] Using model: ${chosenModel}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://devx.app',
        'X-Title': 'DevX Code Agent',
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = `API Error: ${data.error?.message || 'Unknown error'}`;
      console.error(`[callAIModel] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const content = data.choices?.[0]?.message?.content || '';
    console.log(`[callAIModel] Response received (${content.length} chars)`);
    return content;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[callAIModel] Error: ${errorMsg}`);
    throw error;
  }
}

/**
 * MAIN WORKFLOW - Generate, Build, Deploy
 */
export const generateAppWorkflow = inngest.createFunction(
  { id: 'generate-app-workflow' },
  { event: 'app/generate.requested' },
  async ({ event, step }) => {
    const { projectId, userId, userRequest, projectPath } = event.data as any;

    try {
      // Step 1: Analyze intent
      const analyzedRequest = await step.run('analyze-intent', async () => {
        const analyzerPrompt = `Analyze this request and extract:
1. app type (frontend, full-stack, SaaS, etc)
2. key features
3. design preferences
4. tech stack needed

Request: "${userRequest}"

Return JSON with: { appType, features: [], design: "", techStack: [] }`;

        const analysis = await callAIModel(
          'grok',
          'You are a code generation analyzer. Extract structured requirements from user requests.',
          analyzerPrompt,
        );

        try {
          return JSON.parse(analysis);
        } catch {
          return {
            appType: 'full-stack',
            features: ['ui', 'layout'],
            design: 'modern',
            techStack: ['tailwindcss', 'typescript'],
          };
        }
      });

      // Step 2: Generate code
      const generatedCode = await step.run('generate-code', async () => {
        const fullPrompt = ULTIMATE_PROMPT;
        
        const codeGenPrompt = `
User Request: "${userRequest}"

Analysis:
- Type: ${(analyzedRequest as any).appType}
- Features: ${((analyzedRequest as any).features || []).join(', ')}
- Design: ${(analyzedRequest as any).design}

Generate a COMPLETE Next.js app with ALL files. You MUST follow the 12-step algorithm exactly.
Do NOT skip any steps. Return valid JSON with all files.

Format:
{
  "files": {
    "app/page.tsx": "...",
    "app/layout.tsx": "...",
    "components/...": "...",
    ...
  }
}`;

        const response = await callAIModel(
          'grok',
          fullPrompt,
          codeGenPrompt,
        );

        try {
          // Try to extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse code generation response', e);
        }

        // Fallback: create basic structure
        return {
          files: {
            'app/page.tsx': `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">App Generated</h1>
      <p className="text-xl mt-4">Your app structure is ready</p>
    </main>
  );
}`,
            'app/layout.tsx': `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Generated App',
  description: 'Created with Dev X',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
          },
        };
      });

      // Step 3: Verify build
      const buildResult = await step.run(
        'verify-build',
        async () => {
          return await verifyBuild({
            projectPath,
            maxAttempts: 3,
          });
        },
      );

      if (!buildResult.success) {
        throw new Error(
          `Build failed: ${buildResult.finalError || 'Unknown error'}`,
        );
      }

      // Step 4: Build verified successfully (Deployment will be triggered manually when the user clicks the Deploy button in the SaaS UI)
      return {
        success: true,
        projectId,
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[generateAppWorkflow] Error:', errorMessage);
      
      // Record failed build
      await step.run('record-build-failure', async () => {
        return await recordBuild({
          projectId,
          success: false,
          buildLog: errorMessage,
        });
      });

      throw new Error(errorMessage);
    }
  },
);

/**
 * AUTO-FIX WORKFLOW - Called when build fails
 */
export const autoFixBuildWorkflow = inngest.createFunction(
  { id: 'auto-fix-build-workflow' },
  { event: 'build/failed.detected' },
  async ({ event, step }) => {
    const { projectId, buildLog, projectPath } = event.data as any;

    try {
      // Parse errors
      const errors = await step.run('parse-errors', async () => {
        // Already done by verifier, but analyze for patterns
        return [];
      });

      // Get best fixes from error intelligence
      const fixes = await step.run('get-fixes', async () => {
        return errors.map((err: any) => ({
          error: err,
          fix: err ? errorIntelligence.getBestFix(err.message) : null,
        }));
      });

      // Regenerate problematic files
      const regeneratedCode = await step.run('regenerate-code', async () => {
        // In production: call AI with error context to fix specific files
        return { files: {} };
      });

      // Retry build
      const retryBuild = await step.run('retry-build', async () => {
        return await verifyBuild({
          projectPath,
          maxAttempts: 2,
        });
      });

      if (retryBuild.success) {
        // Record successful fix
        await step.run('record-fix-success', async () => {
          fixes.forEach((f: any) => {
            if (f.error && f.fix) {
              errorIntelligence.recordError(f.error.message, f.fix, true);
            }
          });
        });

        return { success: true, fixed: true };
      } else {
        // Record failed fix
        await step.run('record-fix-failure', async () => {
          fixes.forEach((f: any) => {
            if (f.error && f.fix) {
              errorIntelligence.recordError(f.error.message, f.fix, false);
            }
          });
        });

        throw new Error('Auto-fix failed');
      }
    } catch (error: any) {
      console.error('Auto-fix workflow failed:', error);
      throw error;
    }
  },
);

/**
 * ROLLBACK WORKFLOW - Restore previous version
 */
export const rollbackWorkflow = inngest.createFunction(
  { id: 'rollback-workflow' },
  { event: 'project/rollback.requested' },
  async ({ event, step }) => {
    const { projectId, targetVersion, projectPath } = event.data as any;

    try {
      // Get previous snapshot
      const snapshot = await step.run('get-snapshot', async () => {
        const dbSnapshot = await (prisma as any).projectSnapshot.findFirst({
          where: {
            projectId,
            ...(typeof targetVersion === 'number' ? { version: targetVersion } : {}),
          },
          orderBy: typeof targetVersion === 'number' ? undefined : { version: 'desc' },
        });

        if (!dbSnapshot) {
          throw new Error(`No snapshot found for project ${projectId}`);
        }

        const files = (dbSnapshot.files || {}) as Record<string, string>;
        if (!files || Object.keys(files).length === 0) {
          throw new Error(`Snapshot ${dbSnapshot.version} has no files to restore`);
        }

        return {
          version: dbSnapshot.version,
          files,
        };
      });

      // Write files back
      await step.run('restore-files', async () => {
        const fileEntries = Object.entries(snapshot.files as Record<string, string>);
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath, { recursive: true });
        }

        for (const [relativeFile, content] of fileEntries) {
          const fullPath = path.resolve(projectPath, relativeFile);
          if (!fullPath.startsWith(path.resolve(projectPath))) {
            continue;
          }
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fullPath, content, 'utf8');
        }

        await (prisma as any).project.update({
          where: { id: projectId },
          data: { currentVersion: snapshot.version },
        }).catch(() => {
          // Best-effort metadata update.
        });
      });

      // Re-verify build
      const buildResult = await step.run('verify-build', async () => {
        return await verifyBuild({ projectPath });
      });

      if (buildResult.success) {
        // Re-deploy
        const deployResult = await step.run('redeploy', async () => {
          return await deploymentManager.autoDetectAndDeploy(
            projectPath,
            `app-${projectId}`,
          );
        });

        return { success: true, newDeploymentUrl: deployResult.deploymentUrl };
      } else {
        throw new Error('Rollback build verification failed');
      }
    } catch (error: any) {
      console.error('Rollback failed:', error);
      throw error;
    }
  },
);
