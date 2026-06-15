import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAPPER = process.env.NEXT_PUBLIC_MAPPER_URL || 'http://localhost:8002';

/**
 * POST /api/mapping
 * Proxies to Mapping Sequencer: POST /map/matrix
 * Body: { cos, pos, psos?, peos?, top_k? }
 * Returns: CO-PO matrix with levels (0-3) and explanations.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAPPER}/map/matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/mapping] Error:', msg);
    return NextResponse.json(
      { error: 'Mapping Sequencer unreachable', detail: msg },
      { status: 502 }
    );
  }
}
