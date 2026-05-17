"use client";

import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export function useKeyboardShortcuts() {
  const router = useRouter();

  // Command/Ctrl + K - Command palette (placeholder for now)
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    toast.info('Command Palette', 'Coming soon!');
  });

  // Command/Ctrl + S - Save (placeholder)
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    toast.info('Save', 'Auto-save is enabled');
  });

  // Command/Ctrl + / - Toggle theme
  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark');
    toast.success(`Theme changed to ${theme} mode`);
  });

  // Command/Ctrl + B - Back to dashboard
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    router.push('/');
  });

  // Command/Ctrl + N - New project
  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    router.push('/');
    toast.info('New Project', 'Navigate to home to create a new project');
  });

  // Escape - Close modals/dialogs
  useHotkeys('escape', (e) => {
    e.preventDefault();
    // This will be handled by individual components
  });
}

export const KeyboardShortcutsHelper = () => {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
      <div className="flex justify-between"><span>⌘/Ctrl + K</span><span>Command Palette</span></div>
      <div className="flex justify-between"><span>⌘/Ctrl + S</span><span>Save</span></div>
      <div className="flex justify-between"><span>⌘/Ctrl + /</span><span>Toggle Theme</span></div>
      <div className="flex justify-between"><span>⌘/Ctrl + B</span><span>Back to Dashboard</span></div>
      <div className="flex justify-between"><span>⌘/Ctrl + N</span><span>New Project</span></div>
      <div className="flex justify-between"><span>ESC</span><span>Close</span></div>
    </div>
  );
};
