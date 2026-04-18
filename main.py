from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import ClaimRequest, ClaimResponse

from services.pubmed import get_abstracts_for_claim


app = FastAPI()

origins = [
    "http://localhost:5173", # if we use Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/", response_model=ClaimResponse)
async def get_claim_abstracts(claim_request: ClaimRequest):
    response = ClaimResponse(result=get_abstracts_for_claim(claim_request.claim))
    return response

