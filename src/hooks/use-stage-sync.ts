"use client";

import { useEffect } from "react";
import { useStageStatus } from "./use-stage-status";
import type { Message, Fragment } from "@prisma/client";

interface ExtendedMessage {
  id: string;
  role: string;
  type?: string;
  fragment?: Fragment | null;
}

export function useStageSyncFromMessages(messages: ExtendedMessage[] = []) {
  const { 
    setStage1Status,
    setStage2Status,
    setStage3Status,
    resetStages 
  } = useStageStatus();

  useEffect(() => {
    if (messages.length === 0) {
      resetStages();
      return;
    }

    // Find the last user message and any subsequent assistant messages
    let lastUserMessageIdx = -1;
    let lastAnalysisIdx = -1;
    let lastResultWithFragmentIdx = -1;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "USER" && lastUserMessageIdx === -1) {
        lastUserMessageIdx = i;
      }
      if (messages[i].role === "ASSISTANT" && messages[i].type === "ANALYSIS" && lastAnalysisIdx === -1) {
        lastAnalysisIdx = i;
      }
      if (messages[i].role === "ASSISTANT" && messages[i].type === "RESULT" && messages[i].fragment && lastResultWithFragmentIdx === -1) {
        lastResultWithFragmentIdx = i;
      }
    }

    // Check if we're currently generating
    const isGenerating = lastAnalysisIdx > lastUserMessageIdx && lastAnalysisIdx !== -1;

    if (isGenerating) {
      // Stage 1: Generating (Code Gen + E2B)
      setStage1Status("running");
      // Stage 2: Fragment creation in progress
      setStage2Status("running");
      // Stage 3: Not started yet
      setStage3Status("idle");
    } else if (lastUserMessageIdx !== -1) {
      // Not currently generating, check if there's a fragment
      if (lastResultWithFragmentIdx !== -1) {
        // Fragment exists, so stages 1 and 2 are done
        setStage1Status("success");
        setStage2Status("success");
        
        // Stage 3 depends on if the fragment iframe has loaded
        // For now, assume it's in progress when we have a fragment
        const fragment = messages[lastResultWithFragmentIdx].fragment;
        if (fragment?.sandboxUrl) {
          setStage3Status("running");
        } else {
          setStage3Status("idle");
        }
      } else {
        // We have a user message but no fragment yet
        setStage1Status("success");
        setStage2Status("idle");
        setStage3Status("idle");
      }
    }
  }, [messages, setStage1Status, setStage2Status, setStage3Status, resetStages]);
}
