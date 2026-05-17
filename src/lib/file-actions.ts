import prisma from "@/lib/db";

export interface FileAction {
  type: 'add' | 'modify' | 'delete';
  file: string;
  content?: string;
  details: string;
  timestamp: number;
}

/**
 * Updates a message with real-time file actions
 * Used by Inngest functions to emit file creation/modification events
 */
export async function updateMessageFileActions(
  messageId: string,
  newActions: FileAction[]
) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      console.error(`Message ${messageId} not found`);
      return;
    }

    const existingActions = Array.isArray(message.fileActions) ? (message.fileActions as unknown as FileAction[]) : [];
    
    // Upsert logic: replace existing actions for the same file, or append if new
    const actionMap = new Map<string, FileAction>();
    for (const action of existingActions) {
      actionMap.set(action.file, action);
    }
    for (const action of newActions) {
      actionMap.set(action.file, action);
    }
    const allActions = Array.from(actionMap.values());

    await prisma.message.update({
      where: { id: messageId },
      data: {
        fileActions: allActions as any,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated message ${messageId} with ${newActions.length} new file actions`);
  } catch (error) {
    console.error(`Error updating file actions for message ${messageId}:`, error);
  }
}

/**
 * Emits a single file action to a message
 */
export async function emitFileAction(
  messageId: string,
  action: FileAction
) {
  await updateMessageFileActions(messageId, [action]);
}

/**
 * Simulates file creation during code generation
 * Used for demo/testing purposes
 */
export async function simulateFileCreation(
  messageId: string,
  files: { name: string; lines: number }[]
) {
  for (const file of files) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Stagger file creation

    const action: FileAction = {
      type: 'add',
      file: file.name,
      details: `+${file.lines}`,
      timestamp: Date.now(),
    };

    await emitFileAction(messageId, action);
  }
}
