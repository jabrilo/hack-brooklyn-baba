from pydantic import BaseModel

class ClaimRequest(BaseModel):
    claim: str
    
class ClaimResponse(BaseModel):
    result: list[dict]