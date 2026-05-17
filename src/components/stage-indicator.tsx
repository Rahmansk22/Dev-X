"use client";

import { useEffect, useState } from "react";

export type StageStatus = "idle" | "running" | "success" | "error";

interface StageIndicatorProps {
  stage1Status: StageStatus;
  stage2Status: StageStatus;
  stage3Status: StageStatus;
  compact?: boolean;
}

const getDotColor = (status: StageStatus) => {
  switch (status) {
    case "idle":
      return "bg-gray-400";
    case "running":
      return "bg-yellow-500 animate-pulse";
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
};

const getStageLabel = (index: number) => {
  const labels = ["Code Gen", "Fragment", "Preview"];
  return labels[index];
};

const getTooltip = (status: StageStatus) => {
  switch (status) {
    case "idle":
      return "Waiting...";
    case "running":
      return "Processing...";
    case "success":
      return "Complete ✓";
    case "error":
      return "Failed ✗";
    default:
      return "";
  }
};

export function StageIndicator({
  stage1Status,
  stage2Status,
  stage3Status,
  compact = true,
}: StageIndicatorProps) {
  const stages = [stage1Status, stage2Status, stage3Status];

  if (compact) {
    // Minimal 3-dot version for inline display
    return (
      <div className="inline-flex items-center gap-1">
        {stages.map((status, idx) => (
          <div key={idx} className="group relative">
            <div
              className={`w-2 h-2 rounded-full transition-all ${getDotColor(status)}`}
              title={getTooltip(status)}
            />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {getStageLabel(idx)}: {getTooltip(status)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full version (if needed later)
  return (
    <div className="flex items-center gap-3">
      {stages.map((status, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full transition-all ${getDotColor(status)}`} />
          <span className="text-xs text-gray-400">{getStageLabel(idx)}</span>
        </div>
      ))}
    </div>
  );
}
