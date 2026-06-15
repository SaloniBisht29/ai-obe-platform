import { NextRequest, NextResponse } from 'next/server';

// Allow up to 15 minutes for the 4-call NBA syllabus engine
export const maxDuration = 900;
export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

/**
 * POST /api/syllabus
 *
 * Proxies to FastAPI /generate/syllabus (blocking call).
 * Single attempt, no retries — the backend handles its own Ollama warm-up.
 * Timeout: 14 minutes (Ollama 4-call engine can take 5-12 minutes on CPU).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    console.log('[/api/syllabus] Calling backend...');

    const response = await fetch(`${BACKEND}/generate/syllabus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(840_000), // 14 minutes
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[/api/syllabus] Success');
      return NextResponse.json(data);
    }

    const text = await response.text().catch(() => '');
    console.error(`[/api/syllabus] Backend error ${response.status}: ${text.slice(0, 300)}`);
    return NextResponse.json(
      { error: `Backend error ${response.status}`, detail: text.slice(0, 300) },
      { status: response.status }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/syllabus] Exception:', msg);

    // Distinguish timeout from connection errors
    const isTimeout = msg.includes('timeout') || msg.includes('aborted');
    const isConnRefused = msg.includes('ECONNREFUSED') || msg.includes('fetch failed');

    let hint: string;
    if (isConnRefused) {
      hint = 'FastAPI backend is not running. Start it with: uvicorn app.main:app --reload --port 8001';
    } else if (isTimeout) {
      hint = 'The Ollama model took too long. Check if Ollama is running and responsive: ollama run curriculum-ai';
    } else {
      hint = 'Unexpected error. Check the uvicorn terminal for the full traceback.';
    }

    return NextResponse.json(
      { error: msg, hint, detail: msg },
      { status: isConnRefused ? 503 : 504 }
    );
  }
}