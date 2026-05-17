import { emitFileAction, FileAction } from "@/lib/file-actions";
import prisma from "@/lib/db";

/**
 * Parses build output to extract file changes and emit them in real-time
 * This is called during code generation to track which files are being created
 */
export async function trackFilesInRealtime(
  messageId: string,
  generatedCode: { [filename: string]: string }
) {
  const fileActions: FileAction[] = [];

  for (const [filename, content] of Object.entries(generatedCode)) {
    // Count lines in the file
    const lineCount = content.split('\n').length;
    
    const action: FileAction = {
      type: 'add',
      file: filename,
      details: `+${lineCount}`,
      timestamp: Date.now(),
    };

    fileActions.push(action);

    // Emit each file action with a slight delay for real-time effect
    await emitFileAction(messageId, action);
    
    // Small delay between file emissions to create visual progress
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return fileActions;
}

/**
 * Extracts file information from a Fragment to populate initial file actions
 * Called when displaying generated fragments in the UI
 */
export function extractFileActionsFromFragment(files: { [key: string]: string }) {
  const actions: FileAction[] = [];

  for (const [filename, content] of Object.entries(files)) {
    const lineCount = (content as string).split('\n').length;
    actions.push({
      type: 'add',
      file: filename,
      details: `+${lineCount}`,
      timestamp: Date.now(),
    });
  }

  return actions;
}

/**
 * Merges and deduplicates file actions, keeping the latest version of each file
 */
export function mergeFileActions(actions: FileAction[]): FileAction[] {
  const fileMap = new Map<string, FileAction>();

  // Keep the last (most recent) action for each file
  for (const action of actions) {
    fileMap.set(action.file, action);
  }

  return Array.from(fileMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}
