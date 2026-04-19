import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def extract_keywords(claim: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=100,
        messages=[{
            "role": "user",
            "content": f"Extract 2-4 PubMed search terms from this health claim. Rules: no parentheses, connect all terms with &, keep the specific subject (food, substance, demographic), pair with broad medical terms. Return ONLY the search string, nothing else:\n\n{claim}"
        }]
    )
    return response.content[0].text.strip()


def analyze_abstracts(abstracts: list[dict], claim: str) -> dict:
    abstracts_text = "\n\n".join(
        [f"Abstract: {a['abstract']}\nURL: {a['url']}" for a in abstracts]
    )
    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": f"""You are a health research analyst explaining findings to someone with basic biology knowledge.

            The user's claim is: "{claim}"

            Based on these PubMed abstracts, provide:
            1. A Research Support score (0-100) representing how strongly the evidence supports the claim being true:
                - 0-20:  evidence directly contradicts the claim, or no relevant papers were found
                - 21-40: evidence leans against the claim, or papers only address a tangentially related question
                - 41-60: evidence is mixed, inconclusive, or tests a related but meaningfully different question
                - 61-80: evidence supports the claim but is indirect, has notable gaps, or lacks causal proof
                - 81-95: multiple studies directly and consistently support the claim with clear evidence
                - 96-100: multiple studies provide strong, direct, causal proof of the exact claim
                            (e.g. smoking → lung cancer with mechanistic + epidemiological evidence across studies = 95+)
                - Do not hesitate to use the full range in both directions.
                - Penalize if papers address a related but different question (e.g. claim is about prevention, papers are about treatment).
            2. A plain-language summary written at a high school biology level. Rules:
               - Explain what the research actually found and how it relates to the claim
               - If the papers are not a perfect match, explain what they do tell us and why there's a gap
               - Never say "this study isn't about X" — instead explain what the study IS about and how it connects
               - Be honest about limitations without being dismissive
               - Write exactly 3-5 sentences. Be concise.
               - Tone: clear, informative, like a knowledgeable friend explaining something — not too casual, not too clinical
            3. The most relevant citations with their URLs
            4. A verdict of "True", "False", or "Uncertain" in a separate field, plus a one-sentence explanation:
                - "True"      → Research Support 75+, evidence consistently supports the claim
                - "False"     → Research Support below 40 AND papers actively contradict the claim
                - "Uncertain" → everything else: mixed evidence, indirect support, or insufficient data

            Respond ONLY in this JSON format:
            {{
                "research_support": <number>,
                "summary": "<text>",
                "verdict": "<True/False/Uncertain>",
                "verdict_explanation": "<one sentence>",
                "citations": [...]
            }}

            Abstracts:
            {abstracts_text}
            """
        }]
    )
    raw = response.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    raw = raw[raw.index("{"):raw.rindex("}")+1]
    return json.loads(raw)