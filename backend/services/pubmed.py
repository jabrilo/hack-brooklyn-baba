import requests
import os
from dotenv import load_dotenv

load_dotenv()

PUB_MED_API_KEY = os.getenv("NCBI_API_KEY")
PROJECT_EMAIL = os.getenv("PROJECT_EMAIL")

HEADERS = {
    "User-Agent": f"HealthClaimVerifier/1.0 (hackathon project; contact: {PROJECT_EMAIL})"
}

def search_pubmed(claim: str) -> list:
    params = {"db": "pubmed", "term": claim, "retmax": 5, "retmode": "json", "sort": "relevance", "tool": "hackathon-project", "email": PROJECT_EMAIL, "api_key": PUB_MED_API_KEY}
    r = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params, headers=HEADERS)
    
    if r.status_code == 200:
        return r.json()["esearchresult"]["idlist"]
    raise Exception("something went wrong")

def fetch_abstracts(ids: list) -> list[dict]:
    params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "rettype": "abstract",
        "retmode": "text",
        "tool": "hackathon-project",
        "email": PROJECT_EMAIL,
        "api_key": PUB_MED_API_KEY
    }
    r = requests.get(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
        params=params,
        headers=HEADERS
    )
    if r.status_code != 200:
        raise Exception(f"Fetch abstracts failed with status {r.status_code}")

    # efetch returns one blob of text — split by the separator NCBI uses between records
    raw = r.text
    records = [rec.strip() for rec in raw.split("\n\n\n") if rec.strip()]

    return [
        {"abstract": record, "url": f"https://pubmed.ncbi.nlm.nih.gov/{id}/"}
        for record, id in zip(records, ids)
    ]
