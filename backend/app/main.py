from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from dotenv import load_dotenv

from services.pubmed import search_pubmed, fetch_abstracts
from services.anthropic_service import (
    extract_keywords,
    analyze_abstracts,
    extract_claims_from_transcript,
    ServiceConfigError,
)
from services.video_transcript_service import retrieve_video_transcript


load_dotenv()

app = FastAPI(
    title="Health Claim Verification API",
    description="AI-powered health claim fact-checker using PubMed, Tavily, and OpenAI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    confidence_score: int
    summary: str
    verdict: str
    citations: list[dict]


class ContentAnalysisRequest(BaseModel):
    content: str | None = None
    transcript: str | None = None
    platform: str | None = None
    video_url: str | None = None
    max_claims: int = 3


class VideoAnalysisRequest(BaseModel):
    video_url: str
    platform: str | None = None
    max_claims: int = 3


class ContentClaimResult(BaseModel):
    claim: str
    speaker_text: str
    reason: str
    search_focus: str
    keywords: str
    pubmed_results_found: int
    analysis: AnalyzeResponse


class ContentAnalysisResponse(BaseModel):
    transcript_status: str
    platform: str | None = None
    video_url: str | None = None
    transcript: str | None = None
    transcript_source: str | None = None
    transcript_quality: str | None = None
    notes: str
    results: list[ContentClaimResult]


def _empty_claim_analysis() -> dict:
    return {
        "confidence_score": 0,
        "summary": (
            "No directly relevant PubMed abstracts were found for this claim, so there is "
            "not enough evidence here to say the statement is valid or not valid."
        ),
        "verdict": (
            "Uncertain: No directly relevant PubMed abstracts were found for this claim."
        ),
        "citations": [],
    }


def _combine_notes(*parts: str | None) -> str:
    seen: set[str] = set()
    combined: list[str] = []

    for part in parts:
        value = (part or "").strip()
        if not value:
            continue
        normalized = value.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        combined.append(value)

    return " ".join(combined)


def _build_content_results(extracted_claims: list[dict]) -> list[ContentClaimResult]:
    results: list[ContentClaimResult] = []

    for item in extracted_claims:
        claim = item.get("claim", "").strip()
        if not claim:
            continue

        search_focus = item.get("search_focus", "").strip()
        keyword_seed = claim
        if search_focus:
            keyword_seed = f"{claim}\nResearch focus: {search_focus}"

        keywords = extract_keywords(keyword_seed)
        pubmed_ids = search_pubmed(keywords)
        abstracts = fetch_abstracts(pubmed_ids) if pubmed_ids else []
        analysis_data = analyze_abstracts(abstracts, claim) if abstracts else _empty_claim_analysis()

        results.append(
            ContentClaimResult(
                claim=claim,
                speaker_text=item.get("speaker_text", ""),
                reason=item.get("reason", ""),
                search_focus=search_focus,
                keywords=keywords,
                pubmed_results_found=len(abstracts),
                analysis=AnalyzeResponse(**analysis_data),
            )
        )

    return results

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

    except ServiceConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))
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
        
    except ServiceConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error analyzing abstracts: {str(e)}")


@app.post("/analyze-content", response_model=ContentAnalysisResponse)
async def post_analyze_content(request: ContentAnalysisRequest):
    try:
        raw_content = (request.content or request.transcript or "").strip()
        if not raw_content:
            raise HTTPException(
                status_code=400,
                detail="Provide `content` or `transcript` to analyze.",
            )

        extracted = extract_claims_from_transcript(
            transcript=raw_content,
            max_claims=request.max_claims,
            platform=request.platform,
            video_url=request.video_url,
            transcript_source="manual_input",
            transcript_status="manual_input",
        )
        results = _build_content_results(extracted.get("claims", []))

        return ContentAnalysisResponse(
            transcript_status="manual_input",
            platform=request.platform,
            video_url=request.video_url,
            transcript=raw_content,
            transcript_source="manual_input",
            transcript_quality="manual_input",
            notes=extracted.get("notes", ""),
            results=results,
        )

    except HTTPException:
        raise
    except ServiceConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error analyzing content: {str(e)}")


@app.post("/analyze-video", response_model=ContentAnalysisResponse)
async def post_analyze_video(request: VideoAnalysisRequest):
    try:
        normalized_url = request.video_url.strip()
        if not normalized_url:
            raise HTTPException(status_code=400, detail="Provide `video_url` to analyze.")

        transcript_payload = retrieve_video_transcript(
            video_url=normalized_url,
            platform=request.platform,
        )

        if not transcript_payload.transcript:
            return ContentAnalysisResponse(
                transcript_status=transcript_payload.status,
                platform=transcript_payload.platform,
                video_url=normalized_url,
                transcript=None,
                transcript_source=transcript_payload.transcript_source,
                transcript_quality=transcript_payload.transcript_quality,
                notes=transcript_payload.notes,
                results=[],
            )

        extracted = extract_claims_from_transcript(
            transcript=transcript_payload.transcript,
            max_claims=request.max_claims,
            platform=transcript_payload.platform,
            video_url=normalized_url,
            transcript_source=transcript_payload.transcript_source,
            transcript_status=transcript_payload.status,
        )
        results = _build_content_results(extracted.get("claims", []))

        return ContentAnalysisResponse(
            transcript_status=transcript_payload.status,
            platform=transcript_payload.platform,
            video_url=normalized_url,
            transcript=transcript_payload.transcript,
            transcript_source=transcript_payload.transcript_source,
            transcript_quality=transcript_payload.transcript_quality,
            notes=_combine_notes(transcript_payload.notes, extracted.get("notes", "")),
            results=results,
        )

    except HTTPException:
        raise
    except ServiceConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error analyzing video: {str(e)}")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Health Claim Verification API",
        "endpoints": {
            "health": "/health",
            "verify": "/verify (POST)",
            "analyze": "/analyze (POST)",
            "analyze_content": "/analyze-content (POST)",
            "analyze_video": "/analyze-video (POST)",
            "docs": "/docs"
        }
    }
