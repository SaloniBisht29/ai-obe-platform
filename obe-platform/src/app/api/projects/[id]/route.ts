import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MAPPER = process.env.NEXT_PUBLIC_MAPPER_URL || 'http://localhost:8002';

/**
 * GET    /api/projects/[id]  → GET    /projects/{id}
 * PUT    /api/projects/[id]  → PUT    /projects/{id}
 * DELETE /api/projects/[id]  → DELETE /projects/{id}
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await fetch(`${MAPPER}/projects/${id}`, {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAPPER}/projects/${id}`, {
      method: 'PUT',
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await fetch(`${MAPPER}/projects/${id}`, {
      method: 'DELETE',
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
