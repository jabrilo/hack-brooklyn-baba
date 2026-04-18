import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def extract_keywords(claim: str) -> str:
    """Extract medical/health terms from claim for PubMed search"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": f"Extract the key medical/health terms from this claim and connect them with & for a PubMed search. Return ONLY the search string, nothing else:\n\n{claim}"
        }]
    )
    return response.choices[0].message.content.strip()


def analyze_abstracts(abstracts: list[dict]) -> dict:
    """Analyze PubMed abstracts and provide confidence score"""
    abstracts_text = "\n\n".join(
        [f"Abstract: {a['abstract']}\nURL: {a['url']}" for a in abstracts]
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": f"""You are a medical research analyst. Based on these PubMed abstracts, provide:
1. A confidence score (0-100) of how well the research supports the claim
2. A brief summary of the findings
3. The most relevant citations with their URLs

Respond ONLY in this JSON format:
{{
    "confidence_score": <number>,
    "summary": "<text>",
    "citations": [
        {{"url": "<pubmed_url>", "title": "<brief title or finding>"}}
    ]
}}

Abstracts:
{abstracts_text}"""
        }]
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)