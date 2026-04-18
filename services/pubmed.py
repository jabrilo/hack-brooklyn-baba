import requests
import os
from dotenv import load_dotenv

load_dotenv()

PUB_MED_API_KEY = os.getenv("NCBI_API_KEY")

def search_pubmed(claim: str) -> list:
    params = {"db": "pubmed", "term": claim, "retmax": 5, "retmode": "json", "api_key": PUB_MED_API_KEY}
    r = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params)
    
    if r.status_code == 200:
        return r.json()["esearchresult"]["idlist"]
    raise Exception("something went wrong")

def fetch_abstracts(ids: list) -> list:
    res = []
    for id in ids:
        params = {"db": "pubmed", "id": id, "rettype": "abstract", "retmode": "text", "api_key": PUB_MED_API_KEY}
        r = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", params=params)
        if r.status_code == 200:
            res.append({"abstract": r.text, "url": f"https://pubmed.ncbi.nlm.nih.gov/{id}/"})
        else:
            raise Exception({"Status Code": r.status_code}, "Fetch Abstract Failed")
    return res
    
