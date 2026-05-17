"use client";

import { createContext, useContext, useState, useCallback, createElement, type ReactNode } from "react";
import type { StageStatus } from "@/components/stage-indicator";

interface StageContextType {
  stage1Status: StageStatus;
  stage2Status: StageStatus;
  stage3Status: StageStatus;
  setStage1Status: (status: StageStatus) => void;
  setStage2Status: (status: StageStatus) => void;
  setStage3Status: (status: StageStatus) => void;
  resetStages: () => void;
  startGeneration: () => void;
}

const StageContext = createContext<StageContextType | undefined>(undefined);

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage1Status, setStage1Status] = useState<StageStatus>("idle");
  const [stage2Status, setStage2Status] = useState<StageStatus>("idle");
  const [stage3Status, setStage3Status] = useState<StageStatus>("idle");

  const resetStages = useCallback(() => {
    setStage1Status("idle");
    setStage2Status("idle");
    setStage3Status("idle");
  }, []);

  const startGeneration = useCallback(() => {
    setStage1Status("running");
    setStage2Status("idle");
    setStage3Status("idle");
  }, []);

  return createElement(
    StageContext.Provider,
    {
      value: {
        stage1Status,
        stage2Status,
        stage3Status,
        setStage1Status,
        setStage2Status,
        setStage3Status,
        resetStages,
        startGeneration,
      },
    },
    children
  );
}

export function useStageStatus() {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error("useStageStatus must be used within StageProvider");
  }
  return context;
}
