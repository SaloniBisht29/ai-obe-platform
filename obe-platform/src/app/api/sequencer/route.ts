import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MAPPER = process.env.NEXT_PUBLIC_MAPPER_URL || 'http://localhost:8002';

/**
 * POST /api/sequencer
 * Proxies to Mapping Sequencer: POST /sequencer/plan
 * Body: { courses: [{ id, credits, prerequisites }], max_credits_per_sem? }
 * Returns: Semester-wise curriculum plan.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAPPER}/sequencer/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/sequencer] Error:', msg);
    return NextResponse.json(
      { error: 'Mapping Sequencer unreachable', detail: msg },
      { status: 502 }
    );
  }
}
