import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ api: 'unreachable', ollama: 'unreachable' }, { status: 503 });
  }
}
