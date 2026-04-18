from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from dotenv import load_dotenv

from services.pubmed import search_pubmed, fetch_abstracts
from services.anthropic_service import extract_keywords, analyze_abstracts


load_dotenv()

app = FastAPI(
    title="Health Claim Verification API",
    description="AI-powered health claim fact-checker using PubMed, Tavily, and OpenAI",
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
    confidence_score: int
    summary: str
    verdict: str
    citations: list[dict]

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