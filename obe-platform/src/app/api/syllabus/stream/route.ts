import { NextRequest, NextResponse } from 'next/server';

// Allow up to 15 minutes for the 4-call NBA streaming engine
export const maxDuration = 900;
export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

/**
 * POST /api/syllabus/stream
 *
 * Proxies the SSE stream from FastAPI /generate/syllabus/stream
 * back to the browser. Each line is a JSON event.
 *
 * Event format:
 *   data: {"step":1,"total":4,"label":"Course Objectives + COs","done":false}
 *   data: {"done":true,"syllabus":{...}}
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${BACKEND}/generate/syllabus/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(840_000), // 14 minutes
      // @ts-expect-error — Node 18+ supports duplex
      duplex: 'half',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: `Backend error ${upstream.status}`, detail: text.slice(0, 300) },
        { status: upstream.status }
      );
    }

    // Pipe the upstream SSE stream directly to the browser
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/syllabus/stream] Error:', msg);
    return NextResponse.json(
      { error: 'Failed to connect to AI engine', detail: msg },
      { status: 502 }
    );
  }
}
