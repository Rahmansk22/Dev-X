import React, { useEffect, useState } from "react";
import { BuildLogViewer } from "@/components/BuildLogViewer";

export default function BuildLogsViewer({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const res = await fetch(`/api/build-logs?projectId=${projectId}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLoading(false);
    }
    fetchLogs();
  }, [projectId]);

  if (loading) return null;
  return <BuildLogViewer logs={logs} />;
}
