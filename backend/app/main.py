from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from services.pubmed import search_pubmed, fetch_abstracts
#from services.researcher import search_health_trends
#from services.expert import analyze_claim

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

# Pydantic model for incoming health claims
class HealthClaim(BaseModel):
    claim: str

class ClaimResponse(BaseModel):
    response: list[dict]

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Health Claim Verification API is running"}

@app.post("/verify", response_model=ClaimResponse)
async def verify_claim(health_claim: HealthClaim):
    try:
        claim = health_claim.claim
        pubmed_ids = search_pubmed(claim)
        pubmed_data = []

        if pubmed_ids:
            pubmed_data = fetch_abstracts(pubmed_ids)

        return ClaimResponse(response=pubmed_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying claim: {str(e)}")

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
