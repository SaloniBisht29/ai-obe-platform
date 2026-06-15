import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MAPPER = process.env.NEXT_PUBLIC_MAPPER_URL || 'http://localhost:8002';

/**
 * GET  /api/projects        → GET  /projects  (list all)
 * POST /api/projects        → POST /projects  (create new)
 */
export async function GET() {
  try {
    const response = await fetch(`${MAPPER}/projects`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Mapping Sequencer unreachable', detail: msg }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAPPER}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Mapping Sequencer unreachable', detail: msg }, { status: 502 });
  }
}
