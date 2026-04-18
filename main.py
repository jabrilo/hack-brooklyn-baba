from services.pubmed import search_pubmed, fetch_abstracts

def get_abstracts_for_claim(claim: str) -> list:
    ids = search_pubmed(claim)
    return fetch_abstracts(ids)
