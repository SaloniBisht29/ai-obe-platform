/**
 * api.ts — Frontend API layer
 *
 * All browser calls go through Next.js proxy routes (/api/*):
 *   • /api/syllabus     → AI-Syllabus-Generator-main  (localhost:8001)
 *   • /api/mapping      → CO-PO Mapping Sequencer     (localhost:8002)
 *
 * This avoids browser CORS issues and the 60s browser timeout for the 4-call engine.
 */

// Proxy routes (same-origin — no CORS, no browser timeout)
const PROXY_SYLLABUS    = '/api/syllabus';
const PROXY_OUTCOMES    = '/api/outcomes';
const PROXY_EXPORT      = '/api/export-docx';
const PROXY_HEALTH      = '/api/health';

// Mapping Sequencer proxy routes
const PROXY_MAPPING     = '/api/mapping';
const PROXY_SEQUENCER   = '/api/sequencer';
const PROXY_PROJECTS    = '/api/projects';
const PROXY_ATTAINMENT  = '/api/attainment';

// Direct backend URL (AI Syllabus Generator — used by server-side routes only)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';


// ── Shared helper ──────────────────────────────────────────────────
async function safeFetch<T>(url: string, body?: unknown, method = 'POST', timeoutMs = 30_000): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      detail = j.detail || j.error || detail;
    } catch { /* ignore */ }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** Long-timeout variant for LLM operations (15 min — Ollama 4-call can take 12+ min on CPU) */
function safeFetchLong<T>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  return safeFetch<T>(url, body, method, 900_000);
}

// ═══════════════════════════════════════════════════════════════════
// TYPES — mirror AI-Syllabus-Generator-main/app/schemas/models.py
// ═══════════════════════════════════════════════════════════════════

export interface OutcomeRequest {
  course_name: string;
  course_description: string;
  target_bloom_levels?: string[];   // ["remember","understand","apply",...]
  n_candidates?: number;            // 1–10, default 3
  education_level?: string;         // "undergraduate"
  programme?: string;               // "btech" | "bsc" | ...
  year_of_study?: number;
  custom_prompt?: string;
}

export interface OutcomeObject {
  text: string;
  bloom_level: string;
  assessment_suggestion: string;
  confidence_est: number;
  flags: string[];
  domain_tags: string[];
}

export interface OutcomeResponse {
  course_name: string;
  education_level: string;
  programme: string;
  year_of_study?: number;
  outcomes: OutcomeObject[];
}

export interface COObject {
  co_id: string;
  text: string;
  bloom_level: string;
  bloom_verb: string;
  bloom_level_number: string;
  mapped_pos: string[];
  po_correlation: Record<string, number>;
  mapped_psos: string[];
  pso_correlation: Record<string, number>;
  attainment_target: string;
  attainment_level: number;
  direct_assessment: string[];
  indirect_assessment: string[];
  unit_test_marks: number;
  assignment_marks: number;
  end_sem_marks: number;
}

export interface UnitObject {
  unit_id: string;
  unit_title: string;
  topics_paragraph: string;
  topics: string[];
  unit_objectives: string[];
  unit_outcomes: string[];
  satisfied_cos: string[];
  assessments: string[];
  readings: string[];
  hours?: number;
  lecture_plan?: string;
}

export interface SyllabusRequest {
  course_name: string;
  course_description: string;
  num_units?: number;            // 1–10, default 5
  education_level?: string;
  programme?: string;
  year_of_study?: number;
  semester?: number;
  branch?: string;
  course_code?: string;
  credits?: number;
  ltp?: string;                  // "3:1:0"
  university_name?: string;
  custom_prompt?: string;
  regenerate?: boolean;
  rejection_reason?: string;
}

export interface SyllabusResponse {
  course_name: string;
  course_code?: string;
  education_level: string;
  programme: string;
  year_of_study?: number;
  semester?: number;
  branch?: string;
  credits?: number;
  ltp?: string;
  university_name?: string;
  standards?: string;
  total_hours?: number;
  total_lectures?: number;
  units: UnitObject[];
  course_objectives: string[];
  course_outcomes: COObject[];
  course_outcomes_text: string[];
  co_po_matrix: Record<string, Record<string, number>>;
  co_pso_matrix: Record<string, Record<string, number>>;
  exam_pattern?: Record<string, unknown>;
  attainment_formula?: string;
  attainment_levels?: Record<string, string>;
  po_attainment_formula?: string;
  cqi_plan?: string;
  lesson_plan_note?: string;
  naac_iqac_note?: string;
  textbooks: string[];
  youtube_resources: string[];
  open_source_resources: string[];
}

// ── Programme types ──────────────────────────────────────────────
export interface ProgrammeRequest {
  programme_name: string;
  programme_description: string;
  course_list?: string[];
  n_peos?: number;
  n_psos?: number;
}

export interface PEOObject  { peo_id: string; text: string; focus_area: string; }
export interface POObject   { po_id: string; title: string; text: string; }
export interface PSOObject  { pso_id: string; text: string; domain: string; }

export interface ProgrammeResponse {
  programme_name: string;
  peos: PEOObject[];
  pos: POObject[];
  psos: PSOObject[];
}

// ── Review types ─────────────────────────────────────────────────
export interface ReviewRequest {
  course_name: string;
  reviews: Array<{ co_text: string; rating: number; comment?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY types (kept so existing components don't break during migration)
// ═══════════════════════════════════════════════════════════════════

/** @deprecated Use OutcomeRequest directly */
export interface SyllabusInfo {
  level: string;
  programme: string;
  course: string;
  course_description?: string;
  num_units?: number;
  year_of_study?: number;
  semester?: number;
  branch?: string;
  credits?: number;
  ltp?: string;
}

/** @deprecated Use the new workflow functions */
export interface SyllabusResult {
  result: string;
  source: 'ollama' | 'mock';
}

/** @deprecated */
export interface GenerateSectionPayload {
  info: SyllabusInfo;
  context?: string;
  unit_num?: number;
  unit_title?: string;
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════

export async function checkHealth(): Promise<{
  api: string; version: string; ollama: string; model: string;
}> {
  try {
    const res = await fetch(PROXY_HEALTH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { api: 'unreachable', version: '-', ollama: 'unreachable', model: '-' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CORE GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate candidate Course Outcomes.
 * Routes via /api/outcomes proxy (Node.js → FastAPI)
 */
export async function generateOutcomes(req: OutcomeRequest): Promise<OutcomeResponse> {
  return safeFetchLong<OutcomeResponse>(PROXY_OUTCOMES, req);
}

/**
 * Generate a complete syllabus in one call.
 *
 * Strategy: call the FastAPI backend DIRECTLY from the browser (CORS * is
 * enabled). This avoids the Next.js proxy middleman whose idle TCP connection
 * dies after ~5 min of no data during Ollama inference.
 * Falls back to proxy if direct call fails (e.g. production deployment).
 */
export async function generateSyllabus(req: SyllabusRequest): Promise<SyllabusResponse> {
  // Direct call to FastAPI backend (no proxy)
  const DIRECT_BACKEND = 'http://localhost:8001';
  try {
    console.log('[api] Trying DIRECT call to FastAPI backend...');
    const result = await safeFetch<SyllabusResponse>(
      `${DIRECT_BACKEND}/generate/syllabus`, req, 'POST', 900_000
    );
    console.log('[api] Direct call succeeded');
    return result;
  } catch (directErr) {
    console.warn('[api] Direct call failed, falling back to proxy:', directErr);
  }
  // Fallback to Next.js proxy
  return safeFetchLong<SyllabusResponse>(PROXY_SYLLABUS, req);
}

// ── Progress event types for streaming ─────────────────────────────
export interface SyllabusProgressEvent {
  step: number;
  total: number;
  label: string;
  detail: string;
  done: false;
}
export interface SyllabusDoneEvent {
  done: true;
  syllabus: SyllabusResponse;
}
export type SyllabusStreamEvent = SyllabusProgressEvent | SyllabusDoneEvent;

/**
 * Streaming variant — yields real-time step progress via SSE.
 * Uses /api/syllabus/stream → FastAPI /generate/syllabus/stream.
 *
 * @example
 * for await (const event of generateSyllabusStreaming(req)) {
 *   if (event.done) { result = event.syllabus; }
 *   else { setStep(event.step); }
 * }
 */
export async function* generateSyllabusStreaming(
  req: SyllabusRequest
): AsyncGenerator<SyllabusStreamEvent> {
  // Try DIRECT call to FastAPI first (avoids proxy connection drop),
  // then fallback to Next.js proxy route
  const urls = [
    'http://localhost:8001/generate/syllabus/stream',  // direct
    '/api/syllabus/stream',                             // proxy fallback
  ];

  let res: Response | null = null;
  for (const url of urls) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(900_000),
      });
      if (res.ok) {
        console.log(`[api] SSE connected via: ${url}`);
        break;
      }
      // Non-OK (e.g. 404 if streaming endpoint doesn't exist) — try next URL
      res = null;
    } catch {
      res = null; // connection failed — try next URL
    }
  }

  if (!res || !res.ok) {
    if (!res) throw new Error('Streaming endpoint unreachable (both direct and proxy failed)');
    const text = await res.text().catch(() => '');
    let detail = text.slice(0, 300);
    try { const j = JSON.parse(text); detail = j.detail || j.error || detail; } catch { /* ignore */ }
    throw new Error(`API ${res.status}: ${detail}`);
  }

  if (!res.body) throw new Error('No response body from streaming endpoint');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE lines look like: "data: {...}\n\n"
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';   // keep incomplete last line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const event = JSON.parse(jsonStr) as SyllabusStreamEvent;
        yield event;
      } catch { /* malformed line — skip */ }
    }
  }
}


/**
 * Full pipeline: Generate syllabus → Auto-map COs to POs via Mapping Sequencer
 * Returns combined result with LLM syllabus data + proper semantic similarity matrix.
 */
export async function generateAndMap(req: SyllabusRequest): Promise<{
  syllabus: SyllabusResponse;
  mapping: MappingMatrixResponse | null;
}> {
  // Step 1: Generate syllabus (COs, units, textbooks) via LLM
  const syllabus = await generateSyllabus(req);

  // Step 2: Auto-map COs to POs via Mapping Sequencer (semantic similarity)
  let mapping: MappingMatrixResponse | null = null;
  try {
    if (syllabus.course_outcomes.length > 0) {
      const cos: MappingItem[] = syllabus.course_outcomes.map(co => ({
        id: co.co_id,
        text: co.text,
      }));

      // Use the standard NBA PO list
      const pos: MappingItem[] = [
        { id: 'PO1', text: 'Engineering Knowledge' },
        { id: 'PO2', text: 'Problem Analysis' },
        { id: 'PO3', text: 'Design/Development of Solutions' },
        { id: 'PO4', text: 'Investigation of Problems' },
        { id: 'PO5', text: 'Modern Tool Usage' },
        { id: 'PO6', text: 'The Engineer and Society' },
        { id: 'PO7', text: 'Environment and Sustainability' },
        { id: 'PO8', text: 'Ethics' },
        { id: 'PO9', text: 'Individual and Team Work' },
        { id: 'PO10', text: 'Communication' },
        { id: 'PO11', text: 'Project Management and Finance' },
        { id: 'PO12', text: 'Life-long Learning' },
      ];

      // PSOs from the LLM syllabus (mapped_psos fields)
      const psoIds = new Set<string>();
      syllabus.course_outcomes.forEach(co => co.mapped_psos?.forEach(p => psoIds.add(p)));
      const psos: MappingItem[] = Array.from(psoIds).map(id => ({ id, text: id }));

      mapping = await autoMapCOPO({ cos, pos, psos, top_k: 3, subject: req.course_name });
    }
  } catch (e) {
    console.warn('[generateAndMap] Mapping Sequencer call failed (falling back to LLM matrix):', e);
    // Mapping Sequencer might be offline — we still have the LLM-generated matrix as fallback
  }

  return { syllabus, mapping };
}

/**
 * Export a syllabus to .docx — triggers a browser file download.
 * POST /export/docx
 */
export async function exportDocx(req: SyllabusRequest): Promise<void> {
  const res = await fetch(PROXY_EXPORT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const cd   = res.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename[^;=\n]*=["']?([^"'\n;]+)/i);
  a.href     = url;
  a.download = match?.[1] || `${req.course_name.replace(/ /g, '_')}_syllabus.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// PROGRAMME ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

export async function generateProgramme(req: ProgrammeRequest): Promise<ProgrammeResponse> {
  return safeFetch<ProgrammeResponse>(`${API_BASE}/programme/generate-all`, req);
}

// ═══════════════════════════════════════════════════════════════════
// AI ASSISTANT CHAT — /generate/outcomes for structured answers
// ═══════════════════════════════════════════════════════════════════

/** Parse a course name from a natural-language message */
function parseCourseName(message: string): string | null {
  // "Generate COs for Data Mining" → "Data Mining"
  const m1 = message.match(/(?:for|of|about|on)\s+([A-Z][A-Za-z\s&]+?)(?:\s*$|[,.])/i);
  if (m1) return m1[1].trim();
  // "CS301 course outcomes" → "CS301"
  const m2 = message.match(/\b([A-Z]{2,5}\d{3,4})\b/);
  if (m2) return m2[1];
  return null;
}

const MOCK_RESPONSES: Record<string, string> = {
  co: `**AI-Generated Course Outcomes:**\n\n**CO1:** Define fundamental concepts and principles of the course domain.\n**CO2:** Explain working mechanisms using standard terminology.\n**CO3:** Apply core techniques to solve domain-specific problems.\n**CO4:** Analyze systems and evaluate different approaches.\n**CO5:** Design and evaluate solutions for real-world applications.\n\nWould you like me to map these to Programme Outcomes?`,
  bloom: `**Bloom's Taxonomy Distribution (NBA Norms):**\n\n🔵 Remember (L1): 15%\n🔵 Understand (L2): 20%\n🟣 Apply (L3): 25%\n🟠 Analyze (L4): 20%\n🔴 Evaluate (L5): 10%\n🟢 Create (L6): 10%\n\n**Recommendation:** Increase higher-order COs (L4–L6) to at least 40% for NBA compliance.`,
  map: `**CO-PO Mapping Summary:**\n\n| | PO1 | PO2 | PO3 | PO4 | PO5 | PO12 |\n|---|---|---|---|---|---|---|\n| CO1 | 3 | 2 | 0 | 0 | 0 | 1 |\n| CO2 | 2 | 0 | 3 | 0 | 0 | 1 |\n| CO3 | 0 | 3 | 2 | 0 | 1 | 0 |\n| CO4 | 0 | 2 | 0 | 3 | 0 | 0 |\n| CO5 | 0 | 0 | 2 | 0 | 0 | 3 |\n\n**Coverage:** 83% of POs addressed. Strong mapping overall.`,
  default: `I can help with:\n\n• **Generate COs** — e.g. "Generate COs for Computer Networks"\n• **Create Syllabus** — click ✨ Create New Syllabus\n• **Bloom's analysis** — e.g. "Analyze Bloom's distribution"\n• **CO-PO mapping** — e.g. "Map COs to POs"\n\nHow can I help?`,
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('co') || lower.includes('outcome')) return MOCK_RESPONSES.co;
  if (lower.includes('bloom')) return MOCK_RESPONSES.bloom;
  if (lower.includes('map') || lower.includes('po')) return MOCK_RESPONSES.map;
  return MOCK_RESPONSES.default;
}

/**
 * AI chat — tries /generate/outcomes for CO-related queries, falls back to mock.
 * Returns { type: 'outcomes', data: OutcomeResponse } or { type: 'text', data: string }
 */
export async function askAI(
  message: string
): Promise<{ type: 'outcomes'; data: OutcomeResponse } | { type: 'text'; data: string }> {
  const lower = message.toLowerCase();
  const isCoQuery = lower.includes('generate') || lower.includes('co') || lower.includes('outcome');

  if (isCoQuery) {
    const courseName = parseCourseName(message);
    if (courseName) {
      try {
        const data = await generateOutcomes({
          course_name: courseName,
          course_description: `${courseName} — standard Indian university course`,
          target_bloom_levels: ['remember', 'understand', 'apply', 'analyze', 'evaluate'],
          n_candidates: 5,
          programme: 'btech',
          education_level: 'undergraduate',
        });
        return { type: 'outcomes', data };
      } catch {
        // fall through to mock
      }
    }
  }

  return { type: 'text', data: getMockResponse(message) };
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY WRAPPERS — keep AIAssistant / FloatingAIButton working
// during transition. These split the SyllabusResponse into sections.
// ═══════════════════════════════════════════════════════════════════

// Cached syllabus for the step-by-step workflow
let _cachedSyllabus: SyllabusResponse | null = null;
let _cachedKey: string = '';

async function getOrGenerateSyllabus(info: SyllabusInfo): Promise<SyllabusResponse> {
  const key = `${info.course}|${info.level}|${info.programme}`;
  if (_cachedSyllabus && _cachedKey === key) return _cachedSyllabus;

  const req: SyllabusRequest = {
    course_name: info.course,
    course_description: info.course_description || `${info.course} — standard university course`,
    num_units: info.num_units ?? 5,
    education_level: info.level,
    programme: info.programme,
    year_of_study: info.year_of_study,
    semester: info.semester,
    branch: info.branch,
    credits: info.credits ?? 4,
    ltp: info.ltp ?? '3:1:0',
  };
  _cachedSyllabus = await generateSyllabus(req);
  _cachedKey = key;
  return _cachedSyllabus;
}

function syllabusToObjectivesText(s: SyllabusResponse): string {
  return `Course Objectives:\n${s.course_objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
}

function syllabusToUnitTitlesText(s: SyllabusResponse): string {
  return s.units.map(u => `${u.unit_id}: ${u.unit_title}`).join('\n');
}

function syllabusUnitToText(s: SyllabusResponse, idx: number): string {
  const u = s.units[idx];
  if (!u) return '';
  return `${u.unit_id}: ${u.unit_title}\n\n${u.topics_paragraph}\n\nTopics:\n${u.topics.map(t => `• ${t}`).join('\n')}\n\nObjectives:\n${u.unit_objectives.join('\n')}\n\nOutcomes:\n${u.unit_outcomes.join('\n')}${u.lecture_plan ? `\n\nLecture Plan: ${u.lecture_plan}` : ''}`;
}

function syllabusToOutcomesText(s: SyllabusResponse): string {
  return `Course Outcomes:\n${s.course_outcomes.map(co => `${co.co_id} (${co.bloom_level}): ${co.text}`).join('\n')}`;
}

function syllabusToTextbooksText(s: SyllabusResponse): string {
  return `Suggested Textbooks:\n${s.textbooks.join('\n')}`;
}

function syllabusToYoutubeText(s: SyllabusResponse): string {
  const res = [...(s.youtube_resources || []), ...(s.open_source_resources || [])];
  return `Online Resources:\n${res.join('\n')}`;
}

export async function syllabusGenerateObjectives(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    return { result: syllabusToObjectivesText(s), source: 'ollama' };
  } catch {
    return { result: 'Course Objectives:\n1. To understand fundamental principles.\n2. To apply core concepts.\n3. To analyze and evaluate methodologies.\n4. To design practical solutions.\n5. To develop problem-solving skills.', source: 'mock' };
  }
}

export async function syllabusGenerateUnitTitles(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    return { result: syllabusToUnitTitlesText(s), source: 'ollama' };
  } catch {
    return { result: 'UNIT I: Introduction and Fundamentals\nUNIT II: Core Concepts\nUNIT III: Advanced Methods\nUNIT IV: Applications\nUNIT V: Emerging Trends', source: 'mock' };
  }
}

export async function syllabusGenerateUnit(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s  = await getOrGenerateSyllabus(payload.info);
    const idx = (payload.unit_num ?? 1) - 1;
    return { result: syllabusUnitToText(s, idx), source: 'ollama' };
  } catch {
    const num = payload.unit_num ?? 1;
    const roman = ['I','II','III','IV','V'];
    const r = num <= 5 ? roman[num - 1] : String(num);
    const title = payload.unit_title ?? 'Introduction';
    return { result: `UNIT – ${r}: ${title}:\n  Overview and Scope, Basic Definitions, Key Terminology, Historical Background, Classification and Types, Underlying Principles, Mathematical Foundations.`, source: 'mock' };
  }
}

export async function syllabusGenerateOutcomes(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    return { result: syllabusToOutcomesText(s), source: 'ollama' };
  } catch {
    return { result: 'Course Outcomes:\nCO1: Apply fundamental concepts.\nCO2: Analyze system architectures.\nCO3: Design solutions.\nCO4: Evaluate performance.\nCO5: Create innovative prototypes.', source: 'mock' };
  }
}

export async function syllabusGenerateTextbooks(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    return { result: syllabusToTextbooksText(s), source: 'ollama' };
  } catch {
    return { result: 'Suggested Textbooks:\n1. Standard Textbook — Publisher, Edition, Year\n2. Reference Book — Publisher, Edition, Year', source: 'mock' };
  }
}

export async function syllabusGenerateRefBooks(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    const refs = s.open_source_resources?.length
      ? `Reference Resources:\n${s.open_source_resources.join('\n')}`
      : syllabusToTextbooksText(s);
    return { result: refs, source: 'ollama' };
  } catch {
    return { result: 'Reference Books:\n1. Comprehensive Handbook — Author, Publisher\n2. Research Perspectives — Author, Publisher', source: 'mock' };
  }
}

export async function syllabusGenerateYoutube(payload: GenerateSectionPayload): Promise<SyllabusResult> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    return { result: syllabusToYoutubeText(s), source: 'ollama' };
  } catch {
    return { result: 'Online Resources:\n1. NPTEL — https://nptel.ac.in\n2. MIT OpenCourseWare — https://ocw.mit.edu', source: 'mock' };
  }
}

export async function syllabusExport(payload: {
  info: SyllabusInfo;
  sections: {
    objectives: string; unitTitlesRaw: string; units: string[];
    outcomes: string; textbooks: string; ref_books: string; youtube: string;
  };
}): Promise<{ file_path: string; filename: string }> {
  try {
    const s = await getOrGenerateSyllabus(payload.info);
    await exportDocx({
      course_name: payload.info.course,
      course_description: payload.info.course_description || payload.info.course,
      num_units: payload.info.num_units ?? 5,
      education_level: payload.info.level,
      programme: payload.info.programme,
    });
    const safe = payload.info.course.replace(/ /g, '_');
    return { file_path: `exports/${safe}_syllabus.docx`, filename: `${safe}_syllabus.docx` };
  } catch (e) {
    throw new Error(`Export failed: ${String(e)}`);
  }
}

// ── sendChatMessage kept for any remaining references ──────────────
export async function sendChatMessage(payload: { message: string; context?: string }): Promise<{ response: string; source: 'ollama' | 'mock' }> {
  const result = await askAI(payload.message);
  if (result.type === 'text') return { response: result.data, source: 'mock' };
  const text = result.data.outcomes.map((o, i) => `**CO${i + 1} (${o.bloom_level}):** ${o.text}`).join('\n');
  return { response: text, source: 'ollama' };
}


// ═══════════════════════════════════════════════════════════════════
// MAPPING SEQUENCER — Types & API Functions
// ═══════════════════════════════════════════════════════════════════

// ── Mapping Types ──────────────────────────────────────────────────

export interface MappingItem {
  id: string;
  text: string;
}

export interface MappingRequest {
  cos: MappingItem[];
  pos: MappingItem[];
  psos?: MappingItem[];
  peos?: MappingItem[];
  top_k?: number;
  subject?: string;
  semester?: string;
}

export interface MappingCandidate {
  po_id: string;
  level: number;       // 0, 1, 2, or 3
  explanation: string;
}

export interface MappingMatrixResponse {
  co_ids: string[];
  po_ids: string[];
  pso_ids: string[];
  peo_ids: string[];
  matrix: Record<string, Record<string, number>>;        // co_id → { po_id → level }
  table: Array<Record<string, string | number>>;
  explanations: Record<string, string>;                  // "CO1_PO2" → explanation text
  peo_matrix: Record<string, Record<string, number>> | null;
  peo_table: Array<Record<string, string | number>>;
  peo_explanations: Record<string, string>;
}

/**
 * Auto-map COs to POs using semantic similarity.
 * Calls POST /api/mapping → Mapping Sequencer /map/matrix
 */
export async function autoMapCOPO(req: MappingRequest): Promise<MappingMatrixResponse> {
  return safeFetch<MappingMatrixResponse>(PROXY_MAPPING, req);
}

// ── Sequencer Types ────────────────────────────────────────────────

export interface CourseInput {
  id: string;
  credits: number;
  prerequisites: string[];
}

export interface SequencerRequest {
  courses: CourseInput[];
  max_credits_per_sem?: number;
}

export interface SemesterBlock {
  semester: number;
  courses: string[];
  credits: number;
}

export interface SequencerResponse {
  total_semesters: number;
  total_courses: number;
  plan: SemesterBlock[];
}

/**
 * Generate a semester-wise curriculum plan based on prerequisites and credit limits.
 * Calls POST /api/sequencer → Mapping Sequencer /sequencer/plan
 */
export async function generateSequencerPlan(req: SequencerRequest): Promise<SequencerResponse> {
  return safeFetch<SequencerResponse>(PROXY_SEQUENCER, req);
}

// ── Project CRUD Types ─────────────────────────────────────────────

export interface ProjectSummary {
  id: number;
  name: string;
  created_at: string;
}

export interface ProjectData extends ProjectSummary {
  pos_json: string | null;
  psos_json: string | null;
  peos_json: string | null;
  matrix_json: string | null;
  peo_matrix_json: string | null;
  courses_json: string | null;
  sequencer_plan_json: string | null;
  attainment_settings_json: string | null;
  student_marks_json: string | null;
  co_attainment_json: string | null;
  po_attainment_json: string | null;
}

export interface ProjectUpdatePayload {
  name?: string;
  pos_json?: string;
  psos_json?: string;
  peos_json?: string;
  matrix_json?: string;
  peo_matrix_json?: string;
  courses_json?: string;
  sequencer_plan_json?: string;
  attainment_settings_json?: string;
  student_marks_json?: string;
  co_attainment_json?: string;
  po_attainment_json?: string;
}

/** List all projects from the Mapping Sequencer DB. */
export async function listProjects(): Promise<ProjectSummary[]> {
  return safeFetch<ProjectSummary[]>(PROXY_PROJECTS, undefined, 'GET');
}

/** Create a new project. Returns { id, name }. */
export async function createProject(name: string): Promise<{ id: number; name: string }> {
  return safeFetch<{ id: number; name: string }>(PROXY_PROJECTS, { name });
}

/** Get full project data by ID. */
export async function getProject(id: number): Promise<ProjectData> {
  return safeFetch<ProjectData>(`${PROXY_PROJECTS}/${id}`, undefined, 'GET');
}

/** Update project fields (partial update — only send what changed). */
export async function updateProject(id: number, data: ProjectUpdatePayload): Promise<void> {
  await safeFetch<{ message: string }>(`${PROXY_PROJECTS}/${id}`, data, 'PUT');
}

/** Delete a project by ID. */
export async function deleteProject(id: number): Promise<void> {
  await safeFetch<{ message: string }>(`${PROXY_PROJECTS}/${id}`, undefined, 'DELETE');
}

// ── Attainment Types ───────────────────────────────────────────────

export interface AttainmentQuestion {
  id: string;
  name: string;
  max_marks: number;
  co_id: string;
}

export interface StudentMark {
  student_id: string;
  student_name: string;
  marks: Record<string, number | string>;
}

export interface AttainmentRequest {
  cos: string[];
  pos: string[];
  psos?: string[];
  matrix: Record<string, Record<string, number>>;
  questions: AttainmentQuestion[];
  students: StudentMark[];
  target_score_percent?: number;
  threshold_l1?: number;
  threshold_l2?: number;
  threshold_l3?: number;
}

export interface AttainmentResponse {
  question_stats: Record<string, { id: string; name: string; co_id: string; max_marks: number; achieved_count: number; total_count: number; percentage: number }>;
  co_stats: Record<string, { co_id: string; percentage: number; level: number; questions: string[] }>;
  po_stats: Record<string, { po_id: string; attainment: number; weight_sum: number; mapped_cos: string[] }>;
  pso_stats: Record<string, { pso_id: string; attainment: number; weight_sum: number; mapped_cos: string[] }>;
}

/**
 * Calculate CO and PO attainment from student marks.
 * Calls POST /api/attainment → Mapping Sequencer /attainment/calculate
 */
export async function calculateAttainment(req: AttainmentRequest): Promise<AttainmentResponse> {
  return safeFetch<AttainmentResponse>(PROXY_ATTAINMENT, req);
}
