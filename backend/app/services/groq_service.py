import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant" # ran out of tokens. using a smaller model(it sucks)


def extract_keywords(claim: str) -> str:
    """Extract medical/health terms from claim for PubMed search"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": f"Extract 2-4 PubMed search terms from this health claim. Rules: no parentheses, connect all terms with &, keep the specific subject (food, substance, demographic), pair with broad medical terms. Return ONLY the search string, nothing else:\n\n{claim}"
        }]
    )
    return (response.choices[0].message.content or "").strip()


def analyze_abstracts(abstracts: list[dict], claim: str) -> dict:
    abstracts_text = "\n\n".join(
        [f"Abstract: {a['abstract']}\nURL: {a['url']}" for a in abstracts]
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "user",
            "content": f"""You are a health research analyst explaining findings to someone with basic biology knowledge.

            The user's claim is: "{claim}"

            Based on these PubMed abstracts, provide:
            1. A confidence score (0-100) that answers ONLY this question: do these abstracts directly answer the claim?
               - 0-20: abstracts are completely unrelated to the claim
               - 21-40: abstracts are only tangentially related (e.g. same general topic but different question)
               - 41-60: abstracts are somewhat related but don't directly test or address the claim
               - 61-80: abstracts are related and partially support or refute the claim but have gaps
               - 81-95: abstracts directly and specifically address the claim with clear evidence
               - 96-100: ONLY if abstracts provide overwhelming, direct, causal evidence for the exact claim
               - IMPORTANT: penalize heavily if the abstracts address a related but different question (e.g. claim is about prevention but papers are about treatment, or claim is about coffee but papers are about caffeine)
               - IMPORTANT: do not hesitate to use the full range. A claim like "smoking causes lung cancer" with papers directly about smoking and lung cancer should score 90+. A claim like "eating rocks strengthens teeth" with no relevant papers should score 0-10.
            2. A plain-language summary written at a high school biology level. Rules:
               - Explain what the research actually found and how it relates to the claim
               - If the papers are not a perfect match, explain what they do tell us and why there's a gap
               - Never say "this study isn't about X" — instead explain what the study IS about and how it connects
               - Be honest about limitations without being dismissive
               - Write 3-5 sentences minimum
               - Tone: clear, informative, like a knowledgeable friend explaining something — not too casual, not too clinical
            3. The most relevant citations with their URLs
            
            4. A verdict: either "True", "False", or "Uncertain" followed by a one sentence explanation based on the confidence score and the evidence found.
                Respond ONLY in this JSON format:
            {{
                "confidence_score": <number>,
                "summary": "<text>",
                "verdict": "<True/False/Uncertain>: <one sentence explanation>",
                "citations": [
                    {{"url": "<pubmed_url>", "title": "<brief title or finding>"}}
                ]
            }}

            Abstracts:
            {abstracts_text}
            """
        }]
    )
    raw = (response.choices[0].message.content or "").strip()
    print(raw)
    raw = raw.replace("```json", "").replace("```", "").strip()
    raw = raw[raw.index("{"):raw.rindex("}")+1]
    return json.loads(raw)