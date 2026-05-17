import { NextRequest } from 'next/server';
import { getBuildLogs } from '@/lib/build-logs';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Missing projectId' }), { status: 400 });
  }
  const logs = getBuildLogs(projectId);
  return new Response(JSON.stringify({ logs }), { status: 200 });
}
