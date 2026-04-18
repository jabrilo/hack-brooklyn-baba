from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os 
from dotenv import load_dotenv

from services.pubmed import search_pubmed, fetch_abstracts
from services.groq_service import extract_keywords, analyze_abstracts


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
    abstracts: list[dict]

class AnalyzeResponse(BaseModel):
    confidence_score: int
    summary: str
    citations: list[dict]

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Health Claim Verification API is running"}

@app.post("/verify", response_model=AnalyzeRequest)
async def post_verify_claim(health_claim: HealthClaim):
    try:
        print("Health Claim: ", health_claim.claim)
        keywords = extract_keywords(health_claim.claim)
        pubmed_ids = search_pubmed(keywords)
        pubmed_data = []

        if pubmed_ids:
            pubmed_data = fetch_abstracts(pubmed_ids)

        return AnalyzeRequest(abstracts=pubmed_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying claim: {str(e)}")
    
@app.post("/analyze", response_model=AnalyzeResponse)
async def post_analyze_abstracts(request: AnalyzeRequest):
    try:
        result = analyze_abstracts(request.abstracts)
        return result
        
    except Exception as e:
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