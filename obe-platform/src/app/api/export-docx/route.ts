import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(`${BACKEND}/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json({ error: `Backend error ${response.status}`, detail: text }, { status: response.status });
    }

    const blob = await response.blob();
    const cd = response.headers.get('Content-Disposition') || '';
    const match = cd.match(/filename[^;=\n]*=["']?([^"'\n;]+)/i);
    const filename = match?.[1] || 'syllabus.docx';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Export failed', detail: msg }, { status: 500 });
  }
}
