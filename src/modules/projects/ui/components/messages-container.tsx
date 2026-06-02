"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { StageIndicator } from "@/components/stage-indicator";
import { useStageStatus } from "@/hooks/use-stage-status";
import { useStageSyncFromMessages } from "@/hooks/use-stage-sync";
import React, { useRef, useEffect, useMemo, useState } from "react";
import { Fragment, Message } from "@prisma/client";
import { MessageLoading } from "./message-loading";

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
  onFileClick?: (path: string) => void;
  onFilesUpdate?: (files: Record<string, string>) => void;
}

export const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
  onFileClick,
  onFilesUpdate,
}: Props) => {
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const trpc = useTRPC();
  const { stage1Status, stage2Status, stage3Status } = useStageStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Robust fragment selection: get latest fragment from any message
  // Helper to get latest fragment from messages
  function getLatestFragment(msgs: (Message & { fragment: Fragment | null })[] | undefined): Fragment | null {
    if (!msgs) return null;
    return (
      msgs
        .flatMap((m: Message & { fragment: Fragment | null }) => (m.fragment ? [m.fragment] : []))
        .sort((a: Fragment, b: Fragment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
    );
  }

  const { data: messagesRaw } = useQuery(
    // @ts-ignore - TRPC tanstack-react-query decorators not properly applied
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      {
        refetchInterval: (query: any) => {
          const data = query.state.data as any[];
          const lastMessage = data?.[data.length - 1];
          const isGenerating = data?.some((m: any) => m.role === "ASSISTANT" && m.type === "ANALYSIS");
          const isWaiting = lastMessage?.role === "USER";

          if (isGenerating || isWaiting) return 2000; // Poll every 2 seconds when generating/waiting
          return 4000; // Poll every 4 seconds when idle
        },
      }
    )
  );

  // Always treat messages as array for downstream logic
  const messages = (messagesRaw ?? []) as (Message & { fragment: Fragment | null } & { fileActions?: any[] })[];

  // Sync stage status with message state
  useStageSyncFromMessages(messages);

  // Derive active fragment deterministically (latest by createdAt)
  const latestFragment = useMemo<Fragment | null>(() => getLatestFragment(messages), [messages]);

  // Extract emergent files from ANALYSIS messages for real-time inspection
  const emergentFiles = useMemo(() => {
    const files: Record<string, string> = {};
    messages.forEach(msg => {
      if (msg.role === 'ASSISTANT' && Array.isArray(msg.fileActions)) {
        msg.fileActions.forEach((action: any) => {
          if (action.file && action.content) {
            files[action.file] = action.content;
          }
        });
      }
    });
    return files;
  }, [messages]);

  // Auto-set active fragment to latest fragment
  useEffect(() => {
    if (latestFragment && latestFragment.id !== activeFragment?.id) {
      setActiveFragment(latestFragment);
    }
  }, [latestFragment, setActiveFragment, activeFragment]);

  // Pass emergent files up to ProjectView
  useEffect(() => {
    if (onFilesUpdate && Object.keys(emergentFiles).length > 0) {
      onFilesUpdate(emergentFiles);
    }
  }, [emergentFiles, onFilesUpdate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Detect if we're currently generating
  // ANALYSIS messages only exist during active generation — they become RESULT when done.
  // So simply checking for any ANALYSIS message is the correct signal.
  // The old logic (hasAnalysis && !hasResult) broke on 2nd+ generations because
  // old RESULT messages from previous runs made hasResult permanently true.
  const isCurrentlyGenerating = messages.some(m => m.role === 'ASSISTANT' && m.type === 'ANALYSIS');

  // Find the last ANALYSIS message id to mark it as generating
  const lastAnalysisId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'ASSISTANT' && messages[i].type === 'ANALYSIS') return messages[i].id;
    }
    return null;
  }, [messages]);

  if (!mounted) {
    return <div className="flex-1 bg-[#080808]" />;
  }

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
  const isLastMessageUser = lastMessage?.role === "USER";

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full h-full" style={{ backgroundColor: '#080808' }}>
      {/* Chat scroll area - use inline style to scope the no-scrollbar only to this element */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6 chat-scroll-area"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {messages.map((message: any) => (
          <MessageCard
            key={message.id}
            content={message.content}
            role={message.role}
            fragment={message.fragment}
            createdAt={message.createdAt}
            isActiveFragment={
              activeFragment?.id === message.fragment?.id
            }
            onFragmentClick={() =>
              message.fragment && setActiveFragment(message.fragment)
            }
            onFileClick={onFileClick}
            type={message.type}
            fileActions={message.fileActions}
            isGenerating={isCurrentlyGenerating && message.id === lastAnalysisId}
          />
        ))}
        {isLastMessageUser && !isCurrentlyGenerating && <MessageLoading />}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 pb-4 pt-1 relative">
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
        <div className="mb-3 flex justify-center">
          <StageIndicator 
            stage1Status={stage1Status}
            stage2Status={stage2Status}
            stage3Status={stage3Status}
            compact={true}
          />
        </div>
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export default MessagesContainer;
