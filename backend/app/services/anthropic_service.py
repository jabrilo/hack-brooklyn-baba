import os
import json
import anthropic
from dotenv import load_dotenv
from typing import Any

load_dotenv()

MODEL = "claude-sonnet-4-6"
MAX_TRANSCRIPT_CLAIMS = 3


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
        max_tokens=150,
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"""You are writing a compact PubMed query for a health-claim fact checker.

Claim or research focus:
{claim}

Rules:
- Keep the subject specific.
- Prefer 2 to 4 terms total.
- Include the medical outcome or condition.
- Use plain PubMed-friendly words only.
- Do not use parentheses or quotation marks.
- Connect terms with ` & `.
- Return ONLY valid JSON.

JSON format:
{{
  "keywords": "<term 1 & term 2 & term 3>"
}}"""
        }]
    )
    payload = _extract_json_object(_response_text(response))
    return payload["keywords"].strip()


def extract_claims_from_transcript(
    transcript: str,
    max_claims: int = 3,
    platform: str | None = None,
    video_url: str | None = None,
    transcript_source: str | None = None,
    transcript_status: str | None = None,
) -> dict:
    capped_max_claims = max(1, min(max_claims, MAX_TRANSCRIPT_CLAIMS))
    metadata_warning = ""
    if transcript_source == "metadata_only":
        metadata_warning = (
            "- This text comes from public video text like the title, description, or page metadata.\n"
            "- Do not infer spoken words that are not explicitly present in the text.\n"
        )

    response = _anthropic_client().messages.create(
        model=MODEL,
        max_tokens=1200,
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"""You are helping a health fact-checking app analyze social-media videos and posts.

Treat the provided text as evidence about what the creator posted, not as medical truth.

Your task is to extract the strongest checkable health claims.

Instructions:
1. Read the content closely.
2. Ignore filler, jokes, hooks, storytelling, sponsorships, self-promotion, and calls to action.
3. Extract only factual claims about health, medicine, nutrition, supplements, disease, prevention, treatment, hormones, or body function.
4. Prefer 1 to {capped_max_claims} strong claims over a larger number of weak ones.
5. Keep only claims that can realistically be checked against medical or public health research.
6. Rewrite each claim as a clean standalone sentence without changing its meaning.
7. Do not invent details that are missing.
8. Keep claims in the same order they appear in the source when possible.

Rules:
- Skip vague wellness language that cannot be tested.
- Skip pure opinions.
- Skip personal anecdotes unless they imply a broader factual claim.
- Keep `speaker_text` close to the source wording.
- Use `reason` to explain why the claim is checkable.
- Use `search_focus` to describe the core PubMed question to investigate.
- Merge duplicates or near-duplicates.
- Treat transcript text only as evidence of what was said or posted.
- Do not fill in missing context or missing words.
- Return ONLY valid JSON.

Special handling:
{metadata_warning if metadata_warning else "- Rely only on the provided words and do not fill in missing details."}

JSON format:
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
Transcript source: {transcript_source or "unknown"}
Transcript status: {transcript_status or "unknown"}

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
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"""You are a health research analyst reviewing a checkable claim that came from a social-media transcript.

Claim:
"{claim}"

Use only the PubMed abstracts below.

Your job:
1. Score how directly the abstracts address the claim on a 0-100 scale.
   - 0-20: unrelated or effectively no evidence for this exact claim
   - 21-40: same broad topic, but not the same question
   - 41-60: partly relevant, but indirect or incomplete
   - 61-80: fairly relevant evidence with meaningful gaps
   - 81-95: directly relevant evidence that strongly addresses the claim
   - 96-100: overwhelming direct evidence for the exact claim
2. Write a concise 3-5 sentence summary at a high school biology level.
3. Return the most relevant PubMed citations.
4. Give a verdict in the format `True: ...`, `False: ...`, or `Uncertain: ...`.

Important rules:
- Treat the claim as something said in a video, not as established truth.
- Confidence must reflect evidence relevance and strength, not model certainty.
- Penalize papers that are adjacent but not directly on the claim.
- Explain what the abstracts do cover when they are imperfect matches.
- Score this claim independently, even if other claims from the same video were weaker or stronger.
- Do not default to the same low score across different claims unless the evidence quality is truly similar.
- Return ONLY valid JSON.

JSON format:
{{
  "confidence_score": <number>,
  "summary": "<text>",
  "verdict": "<True/False/Uncertain>: <one sentence explanation>",
  "citations": [
    {{"url": "<pubmed_url>", "title": "<brief title or finding>"}}
  ]
}}

Abstracts:
{abstracts_text}"""
        }]
    )
    return _extract_json_object(_response_text(response))
