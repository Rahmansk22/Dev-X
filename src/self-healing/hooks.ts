// src/self-healing/hooks.ts
// Custom React hooks for self-healing agent integration in components

import { useState, useCallback, useRef, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { detectErrors, getErrorSeverity } from "./integration";

interface UseBuildOptions {
  appId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

/**
 * Hook for managing build state with self-healing
 */
export function useBuild(options: UseBuildOptions) {
  const trpc = useTRPC();
  const trpcAny = trpc as any;
  const {
    appId,
    onSuccess,
    onError,
    autoRetry = true,
    maxRetries = 3,
  } = options;

  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [detectedErrors, setDetectedErrors] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const triggerBuildMutation = useMutation(
    trpcAny.builds.triggerBuild.mutationOptions() as any
  );

  const build = useCallback(
    async (code: string) => {
      setIsBuilding(true);
      setError(null);
      setSuccess(false);

      try {
        const result: any = await (triggerBuildMutation as any).mutateAsync({
          appId,
          code,
        });

        if (result.success) {
          setSuccess(true);
          setRetryCount(0);
          onSuccess?.();
        } else {
          setError(result.error || "Build failed");
          setDetectedErrors(result.detectedErrors || []);

          // Auto-retry if enabled and within retry limit
          if (
            autoRetry &&
            retryCount < maxRetries &&
            result.severity === "warning"
          ) {
            setTimeout(() => {
              setRetryCount((count) => count + 1);
              build(code); // Recursive retry
            }, 2000 * (retryCount + 1)); // Exponential backoff
          } else {
            onError?.(result.error || "Build failed");
          }
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsBuilding(false);
      }
    },
    [appId, autoRetry, maxRetries, retryCount, onSuccess, onError]
  );

  const retry = useCallback(
    async (code: string) => {
      setRetryCount(0);
      await build(code);
    },
    [build]
  );

  return {
    isBuilding,
    error,
    success,
    detectedErrors,
    retryCount,
    build,
    retry,
  };
}

interface UseErrorSeverityOptions {
  log: string;
}

/**
 * Hook for detecting error severity in build logs
 */
export function useErrorSeverity({ log }: UseErrorSeverityOptions) {
  const [errors, setErrors] = useState<any[]>([]);
  const [severity, setSeverity] = useState<"critical" | "warning" | "info">(
    "info"
  );

  useEffect(() => {
    if (log) {
      const detected = detectErrors(log);
      const sev = getErrorSeverity(log);
      setErrors(detected);
      setSeverity(sev);
    }
  }, [log]);

  return { errors, severity };
}

/**
 * Hook for managing build retry logic with exponential backoff
 */
export function useRetryWithBackoff(options: {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = (attempt: number): number => {
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  };

  const retry = useCallback(
    (callback: () => Promise<void>) => {
      if (retryCount >= maxRetries) {
        return;
      }

      const delay = calculateDelay(retryCount);
      timeoutRef.current = setTimeout(async () => {
        try {
          await callback();
          setRetryCount(0);
        } catch (error) {
          setRetryCount((count) => count + 1);
        }
      }, delay);
    },
    [retryCount, maxRetries, baseDelay]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { retryCount, retry, reset, canRetry: retryCount < maxRetries };
}
