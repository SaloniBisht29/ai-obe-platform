import sys
# Force stdout and stderr to use UTF-8 to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import requests
import os

from app.schemas.models import OutcomeRequest, OutcomeResponse, SyllabusRequest, SyllabusResponse
from app.schemas.review_models import ReviewRequest, ReviewSummary
from app.schemas.programme_models import (
    PEORequest, PEOResponse, PORequest, POResponse,
    PSORequest, PSOResponse, ProgrammeRequest, ProgrammeResponse
)
from app.generator.llm_client import generate_outcomes
from app.generator.syllabus_generator import generate_syllabus, generate_syllabus_streaming
from app.generator.review_manager import process_reviews, get_all_reviews, get_training_labels
from app.generator.programme_generator import generate_peos, generate_pos, generate_psos, generate_programme
from app.exporter.docx_exporter import export_syllabus_to_docx
from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL

app = FastAPI(
    title       = "Group 1 - Curriculum AI",
    description = "AI-Driven Platform for Outcome-Based Curriculum Design",
    version     = "2.1.0"
)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Health ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Group 1 API is running", "version": "2.1.0"}

@app.get("/health")
def health():
    try:
        r      = requests.get(f"{OLLAMA_BASE_URL}", timeout=5)
        ollama = "connected" if r.status_code == 200 else "unreachable"
    except Exception:
        ollama = "unreachable"
    return {
        "api": "running", "version": "2.1.0",
        "ollama": ollama, "model": OLLAMA_MODEL,
        "endpoints": [
            "GET  /",
            "GET  /health",
            "POST /generate/outcomes",
            "POST /generate/syllabus",
            "POST /generate/syllabus/stream  (SSE — real-time step progress)",
            "POST /export/docx",
            "POST /review/submit",
            "GET  /review/all",
            "GET  /review/training-labels",
            "POST /programme/peos",
            "POST /programme/pos",
            "POST /programme/psos",
            "POST /programme/generate-all",
        ]
    }

# ── Outcomes ──────────────────────────────────────────────────────────

@app.post("/generate/outcomes", response_model=OutcomeResponse)
def generate(request: OutcomeRequest):
    outcomes = generate_outcomes(request)
    return OutcomeResponse(
        course_name=request.course_name,
        education_level=request.education_level or "undergraduate",
        programme=request.programme or "btech",
        year_of_study=request.year_of_study,
        outcomes=outcomes
    )

# ── Syllabus (blocking) ───────────────────────────────────────────────

@app.post("/generate/syllabus", response_model=SyllabusResponse)
def syllabus(request: SyllabusRequest):
    return generate_syllabus(request)

# ── Syllabus (streaming SSE) ──────────────────────────────────────────

@app.post("/generate/syllabus/stream")
def syllabus_stream(request: SyllabusRequest):
    """
    Server-Sent Events endpoint.
    Streams progress events as the 4 LLM calls complete, then sends the
    final syllabus JSON as the last event.

    Event format (newline-delimited JSON):
      data: {"step": 1, "total": 4, "label": "Course Objectives + COs", "done": false}
      data: {"step": 2, "total": 4, "label": "Units", "done": false}
      data: {"step": 3, "total": 4, "label": "CO-PO Matrix", "done": false}
      data: {"step": 4, "total": 4, "label": "Textbooks + Resources", "done": false}
      data: {"done": true, "syllabus": { ... full SyllabusResponse ... }}
    """
    def event_generator():
        for event in generate_syllabus_streaming(request):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable Nginx buffering if behind proxy
        }
    )

# ── Export ────────────────────────────────────────────────────────────

@app.post("/export/docx")
def export_docx(request: SyllabusRequest):
    syllabus_data = generate_syllabus(request)
    if not syllabus_data.units:
        raise HTTPException(status_code=500, detail="Syllabus generation failed")
    file_path = export_syllabus_to_docx(syllabus_data)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="DOCX export failed")
    safe  = request.course_name.replace(" ", "_")
    code  = f"_{request.course_code}"        if request.course_code   else ""
    prog  = request.programme.upper()        if request.programme     else "general"
    yr    = f"_Year{request.year_of_study}"  if request.year_of_study else ""
    sem   = f"_S{request.semester}"          if request.semester      else ""
    fname = f"{safe}{code}_{prog}{yr}{sem}_syllabus.docx"
    return FileResponse(
        path=file_path, filename=fname,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# ── Reviews ───────────────────────────────────────────────────────────

@app.post("/review/submit", response_model=ReviewSummary)
def submit_review(request: ReviewRequest):
    return process_reviews(request)

@app.get("/review/all")
def all_reviews():
    return get_all_reviews()

@app.get("/review/training-labels")
def training_labels():
    return get_training_labels()

# ── Programme ─────────────────────────────────────────────────────────

@app.post("/programme/peos", response_model=PEOResponse)
def peos(request: PEORequest):
    return generate_peos(request)

@app.post("/programme/pos", response_model=POResponse)
def pos(request: PORequest):
    return generate_pos(request)

@app.post("/programme/psos", response_model=PSOResponse)
def psos(request: PSORequest):
    return generate_psos(request)

@app.post("/programme/generate-all", response_model=ProgrammeResponse)
def programme_all(request: ProgrammeRequest):
    return generate_programme(request)