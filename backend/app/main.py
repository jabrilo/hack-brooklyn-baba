from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse

import asyncio
import json

from pydantic import BaseModel
import time
from dotenv import load_dotenv

from services.pubmed import search_pubmed, fetch_abstracts
from services.anthropic_service import extract_keywords, analyze_abstracts

from elevenlabs.client import ElevenLabs
import os


load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "7EzWGsX10sAS4c9m9cPf"


app = FastAPI(
    title="Health Claim Verification API",
    description="AI-powered health claim fact-checker using PubMed, and Anthropic",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthClaim(BaseModel):
    claim: str

class ClaimResponse(BaseModel):
    response: list[dict]
    
class AnalyzeRequest(BaseModel):
    claim: str
    abstracts: list[dict]

class AnalyzeResponse(BaseModel):
    research_support: int
    summary: str
    verdict: str
    verdict_explanation: str
    citations: list[dict]
    
class SpeakRequest(BaseModel):
    text: str
    
@app.get("/")
async def root():
    return {
        "message": "Welcome to Health Claim Verification API",
        "endpoints": {
            "health": "/health",
            "verify": "/verify (POST)",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Health Claim Verification API is running"}

@app.post("/verify", response_model=AnalyzeRequest)
async def post_verify_claim(health_claim: HealthClaim):
    try:
        t0 = time.time()
        keywords = extract_keywords(health_claim.claim)
        t1 = time.time()
        print(f"extract_keywords: {t1-t0:.2f}s | result: {keywords}")
        
        pubmed_ids = search_pubmed(keywords)
        t2 = time.time()
        print(f"search_pubmed: {t2-t1:.2f}s | ids: {pubmed_ids}")
        
        pubmed_data = []
        if pubmed_ids:
            pubmed_data = fetch_abstracts(pubmed_ids)
        t3 = time.time()
        print(f"fetch_abstracts: {t3-t2:.2f}s | count: {len(pubmed_data)}")
        print(f"verify total: {t3-t0:.2f}s")

        return AnalyzeRequest(abstracts=pubmed_data, claim=health_claim.claim)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error verifying claim: {str(e)}")
    
@app.post("/analyze", response_model=AnalyzeResponse)
async def post_analyze_abstracts(request: AnalyzeRequest):
    try:
        t0 = time.time()
        result = analyze_abstracts(request.abstracts, request.claim)
        t1 = time.time()
        print(f"analyze_abstracts: {t1-t0:.2f}s")
        return result
        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error analyzing abstracts: {str(e)}")

def sse(payload: dict) -> str:
    """Format a dict as a Server-Sent Event line."""
    return f"data: {json.dumps(payload)}\n\n"
 
 
async def stream_pipeline(claim: str):
    """
    Async generator that runs the full verification pipeline and yields
    SSE events at each step. Existing sync service functions are offloaded
    to a thread so they don't block the event loop.
    """
    try:
        # Step 1 — extract keywords
        yield sse({"event": "extracting", "message": "Extracting keywords..."})
        keywords = await asyncio.to_thread(extract_keywords, claim)
 
        # Step 2 — search PubMed
        yield sse({"event": "searching", "message": "Searching PubMed..."})
        pubmed_ids = await asyncio.to_thread(search_pubmed, keywords)
 
        # Step 3 — fetch abstracts
        pubmed_data = []
        if pubmed_ids:
            yield sse({"event": "fetching", "message": f"Fetching {len(pubmed_ids)} studies..."})
            pubmed_data = await asyncio.to_thread(fetch_abstracts, pubmed_ids)
 
        count = len(pubmed_data)
        if count == 0:
            yield sse({"event": "found", "message": "No studies found — analyzing with general knowledge..."})
        else:
            yield sse({"event": "found", "message": f"Found {count} relevant {'study' if count == 1 else 'studies'}..."})
 
        # Step 4 — Claude analysis
        yield sse({"event": "analyzing", "message": "Analyzing evidence with Claude..."})
        result = await asyncio.to_thread(analyze_abstracts, pubmed_data, claim)
 
        # Step 5 — done
        yield sse({"event": "complete", "result": result})
 
    except Exception as e:
        import traceback
        traceback.print_exc()
        yield sse({"event": "error", "message": str(e)})
 
  
@app.post("/stream")
async def stream_claim(health_claim: HealthClaim):
    return StreamingResponse(
        stream_pipeline(health_claim.claim),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disables nginx buffering if behind a proxy
        }
    )
    
@app.post("/speak")
async def speak(request: SpeakRequest):
    def generate_audio():
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        audio = client.text_to_speech.convert(
            voice_id=VOICE_ID,
            text=request.text,
            model_id="eleven_turbo_v2",
        )
        for chunk in audio:
            yield chunk
            
    return StreamingResponse(
        generate_audio(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-cache"}
    )