import os
import json
import anthropic
from dotenv import load_dotenv
from typing import Any

load_dotenv()

MODEL = "claude-sonnet-4-6"
MAX_TRANSCRIPT_CLAIMS = 5


class ServiceConfigError(RuntimeError):
    pass


def _response_text(response: Any) -> str:
    return "".join(
        block.text for block in response.content if hasattr(block, "text")
    ).strip()


def _extract_json_object(raw_text: str) -> dict:
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError(f"Claude response did not contain JSON: {cleaned}")

    return json.loads(cleaned[start:end + 1])


def _anthropic_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ServiceConfigError(
            "ANTHROPIC_API_KEY is missing. Add it to backend/app/.env and restart the backend."
        )

    return anthropic.Anthropic(api_key=api_key)


def extract_keywords(claim: str) -> str:
    response = _anthropic_client().messages.create(
        model=MODEL,
        max_tokens=100,
        messages=[{
            "role": "user",
            "content": f"Extract 2-4 PubMed search terms from this health claim. Rules: no parentheses, connect all terms with &, keep the specific subject (food, substance, demographic), pair with broad medical terms. Return ONLY the search string, nothing else:\n\n{claim}"
        }]
    )
    return response.content[0].text.strip()


def extract_claims_from_transcript(
    transcript: str,
    max_claims: int = 3,
    platform: str | None = None,
    video_url: str | None = None,
) -> dict:
    capped_max_claims = max(1, min(max_claims, MAX_TRANSCRIPT_CLAIMS))
    response = _anthropic_client().messages.create(
        model=MODEL,
        max_tokens=1200,
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"""You are helping a health fact-checking app analyze short-form videos and text posts.

Your task is to convert a transcript or post into a short list of clean, checkable health claims.

Follow these steps:
1. Read the content closely.
2. Ignore filler, jokes, hooks, storytelling, self-promotion, and calls to action.
3. Find statements that make factual claims about health, nutrition, medicine, disease, prevention, treatment, supplements, hormones, or body function.
4. Keep only claims that can realistically be checked with medical or public health evidence.
5. Rewrite each claim as a clear standalone sentence.
6. Keep the strongest {capped_max_claims} claims at most.
7. Do not invent details that are missing from the original content.

Rules:
- Skip opinions and vague wellness language that cannot be tested.
- Skip claims that are just personal experience unless they imply a broader factual claim.
- Keep speaker_text short and close to the original wording.
- Merge duplicates.

Return ONLY valid JSON in this format:
{{
  "claims": [
    {{
      "claim": "<clean standalone claim>",
      "speaker_text": "<short supporting quote>",
      "reason": "<why this claim should be checked>",
      "search_focus": "<short research direction>"
    }}
  ],
  "notes": "<brief note about ambiguity, missing context, or why no claims were found>"
}}

If there are no checkable claims, return:
{{
  "claims": [],
  "notes": "No checkable health claims found."
}}

Platform: {platform or "unknown"}
Video URL: {video_url or "not provided"}

Content:
{transcript}"""
        }]
    )
    return _extract_json_object(_response_text(response))


def analyze_abstracts(abstracts: list[dict], claim: str) -> dict:
    if not abstracts:
        return {
            "confidence_score": 0,
            "summary": (
                "No directly relevant PubMed abstracts were found for this claim, so "
                "there is not enough evidence here to say the statement is valid or not valid."
            ),
            "verdict": "Uncertain: No directly relevant PubMed abstracts were found for this claim.",
            "citations": [],
        }

    abstracts_text = "\n\n".join(
        [f"Abstract: {a['abstract']}\nURL: {a['url']}" for a in abstracts]
    )
    response = _anthropic_client().messages.create(
        model=MODEL,
        max_tokens=1000,
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
               - Write exactly 3-5 sentences. Be concise.
               - Tone: clear, informative, like a knowledgeable friend explaining something — not too casual, not too clinical
            3. The most relevant citations with their URLs
            4. A verdict: either "True", "False", or "Uncertain" followed by a one sentence explanation based on the confidence score and the evidence found.
                - If confidence is below 20 and no abstracts support the claim, verdict should be "False" unless the claim is about something genuinely unknown to science
                - "Uncertain" should only be used when evidence exists but is mixed or incomplete

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
    raw = response.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    raw = raw[raw.index("{"):raw.rindex("}")+1]
    return json.loads(raw)
