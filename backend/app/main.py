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

# Enable CORS for frontend connection
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

class ClaimRespone(BaseModel):
    response: list[dict]

# class VerificationResponse(BaseModel):
#     claim: str
#     verdict: str
#     confidence_score: int
#     analysis_summary: str
#     pubmed_sources: list
#     web_sources: list

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Health Claim Verification API is running"}

@app.post("/verify", response_model=ClaimRespone)
async def verify_claim(health_claim: HealthClaim):
    """
    Verify a health claim using PubMed research, web context, and AI analysis.
    
    Args:
        health_claim: Object containing the claim string
    
    Returns:
        VerificationResponse: Analysis results with verdict, confidence, and sources
    """
    try:
        claim = health_claim.claim
        
        # Step 1: Fetch PubMed abstracts
        pubmed_ids = search_pubmed(claim)
        pubmed_abstracts = []
        
        if pubmed_ids:
            pubmed_data = fetch_abstracts(pubmed_ids)
            for item in pubmed_data:
                pubmed_abstracts.append(item)
                # pubmed_sources.append(item["url"])
        #     pubmed_context = "\n\n".join(pubmed_abstracts)
        # else:
        #     pubmed_context = ""
        print(pubmed_data)
        return ClaimRespone(response=pubmed_data)
        
        # Step 2: Fetch general web context using Tavily
        # web_result = search_health_trends(claim)
        # general_context = ""
        # web_sources = []
        
        # if "results" in web_results:
        #     for result in web_results["results"]:
        #         general_context += f"Title: {result.get('title', 'N/A')}\n"
        #         general_context += f"Content: {result.get('content', 'N/A')}\n\n"
        #         if "url" in result:
        #             web_sources.append(result["url"])
        
        # # Step 3: Analyze using the Expert AI
        # analysis = analyze_claim(claim, pubmed_context, general_context)
        
        # # Step 4: Combine and return results
        # return VerificationResponse(
        #     claim=claim,
        #     verdict=analysis.get("verdict", "Inconclusive"),
        #     confidence_score=analysis.get("confidence_score", 0),
        #     analysis_summary=analysis.get("analysis_summary", ""),
        #     pubmed_sources=pubmed_sources,
        #     web_sources=web_sources
        # )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying claim: {str(e)}"
        )

@app.get("/")
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Health Claim Verification API",
        "endpoints": {
            "health": "/health",
            "verify": "/verify (POST)",
            "docs": "/docs"
        }
    }
