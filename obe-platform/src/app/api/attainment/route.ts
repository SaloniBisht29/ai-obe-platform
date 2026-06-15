import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAPPER = process.env.NEXT_PUBLIC_MAPPER_URL || 'http://localhost:8002';

/**
 * POST /api/attainment
 * Proxies to Mapping Sequencer: POST /attainment/calculate
 * Body: { cos, pos, psos, matrix, questions, students, target_score_percent, thresholds }
 * Returns: CO attainment %, PO attainment levels propagated via mapping matrix.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAPPER}/attainment/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/attainment] Error:', msg);
    return NextResponse.json(
      { error: 'Mapping Sequencer unreachable', detail: msg },
      { status: 502 }
    );
  }
}
