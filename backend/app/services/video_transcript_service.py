import json
import re
from dataclasses import dataclass, field
from html import unescape
from typing import Any
from urllib.parse import urlparse

import requests


SUPPORTED_PLATFORMS = {"youtube", "tiktok", "instagram"}
DEFAULT_MIN_TEXT_WORDS = 12
DEFAULT_MIN_TEXT_CHARS = 80


@dataclass
class TranscriptQualityResult:
    is_usable: bool
    quality: str
    word_count: int
    char_count: int
    reasons: list[str] = field(default_factory=list)


@dataclass
class TranscriptFetchResult:
    status: str
    platform: str | None
    video_url: str
    transcript: str | None
    transcript_source: str
    notes: str
    transcript_quality: str | None = None
    transcript_quality_reasons: list[str] = field(default_factory=list)


def detect_platform(video_url: str, platform: str | None = None) -> str | None:
    explicit = (platform or "").strip().lower()
    if explicit in SUPPORTED_PLATFORMS:
        return explicit

    host = urlparse(video_url).netloc.lower()
    if any(domain in host for domain in ("youtube.com", "youtu.be")):
        return "youtube"
    if "tiktok.com" in host:
        return "tiktok"
    if "instagram.com" in host:
        return "instagram"
    return None


def retrieve_video_transcript(
    video_url: str,
    platform: str | None = None,
) -> TranscriptFetchResult:
    normalized_url = (video_url or "").strip()
    detected_platform = detect_platform(normalized_url, platform)

    if not normalized_url:
        return TranscriptFetchResult(
            status="transcript_failed",
            platform=platform,
            video_url=normalized_url,
            transcript=None,
            transcript_source="unavailable",
            notes="A video URL is required.",
        )

    if not detected_platform:
        return TranscriptFetchResult(
            status="unsupported_url",
            platform=platform,
            video_url=normalized_url,
            transcript=None,
            transcript_source="unavailable",
            notes="Unsupported URL. Provide a public TikTok, Instagram, or YouTube link.",
        )

    notes: list[str] = []
    text_parts: list[str] = []

    if detected_platform == "youtube":
        youtube_text, youtube_notes = _fetch_youtube_metadata_text(normalized_url)
        if youtube_text:
            text_parts.append(youtube_text)
        notes.extend(youtube_notes)

    page_text, page_notes = _fetch_page_metadata_text(
        video_url=normalized_url,
        platform=detected_platform,
    )
    if page_text:
        text_parts.append(page_text)
    notes.extend(page_notes)

    metadata_text = _combine_text_parts(text_parts)
    if not metadata_text:
        if not notes:
            notes.append("No public video text was available for this URL.")
        return TranscriptFetchResult(
            status="transcript_failed",
            platform=detected_platform,
            video_url=normalized_url,
            transcript=None,
            transcript_source="unavailable",
            notes=_combine_notes(notes),
        )

    quality = _evaluate_transcript_quality(metadata_text)
    notes.extend(_quality_notes(quality))
    notes.append(
        "Analysis is based on public video text like the title, description, and page metadata, not spoken audio."
    )

    return TranscriptFetchResult(
        status="metadata_only",
        platform=detected_platform,
        video_url=normalized_url,
        transcript=metadata_text,
        transcript_source="metadata_only",
        notes=_combine_notes(notes),
        transcript_quality=quality.quality,
        transcript_quality_reasons=quality.reasons,
    )


def _fetch_youtube_metadata_text(video_url: str) -> tuple[str | None, list[str]]:
    watch_url = _normalize_youtube_watch_url(video_url)
    if not watch_url:
        return None, ["Could not determine the YouTube watch URL from this link."]

    try:
        response = requests.get(
            watch_url,
            headers={"User-Agent": _browser_user_agent()},
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        return None, [f"Could not load the YouTube watch page: {exc}"]

    player_response = _extract_youtube_player_response(response.text)
    if not player_response:
        return None, ["Could not parse the YouTube watch page for title or description text."]

    metadata_text = _build_text_from_video_metadata(player_response)
    if not metadata_text:
        return None, ["The YouTube page loaded, but no useful title or description text was found."]

    return metadata_text, []


def _normalize_youtube_watch_url(video_url: str) -> str | None:
    parsed = urlparse(video_url)
    host = parsed.netloc.lower()

    if "youtu.be" in host:
        video_id = parsed.path.strip("/")
        if video_id:
            return f"https://www.youtube.com/watch?v={video_id}"

    if "youtube.com" in host:
        return video_url

    return None


def _fetch_page_metadata_text(video_url: str, platform: str) -> tuple[str | None, list[str]]:
    oembed_text = _fetch_oembed_text(video_url, platform)
    if oembed_text:
        return oembed_text, []

    try:
        response = requests.get(
            video_url,
            headers={"User-Agent": _browser_user_agent()},
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        return None, [f"Could not load page metadata for this URL: {exc}"]

    text_parts: list[str] = []
    for pattern in (
        r'<meta\s+property="og:title"\s+content="([^"]+)"',
        r'<meta\s+name="description"\s+content="([^"]+)"',
        r'<meta\s+property="og:description"\s+content="([^"]+)"',
        r"<title>([^<]+)</title>",
    ):
        match = re.search(pattern, response.text, re.IGNORECASE)
        if match:
            cleaned = _clean_text(unescape(match.group(1)))
            if cleaned:
                text_parts.append(cleaned)

    combined = _combine_text_parts(text_parts)
    if combined:
        return combined, []

    return None, ["No public title or description text was available on the page."]


def _fetch_oembed_text(video_url: str, platform: str) -> str | None:
    endpoint = None
    if platform == "youtube":
        endpoint = "https://www.youtube.com/oembed"
    elif platform == "tiktok":
        endpoint = "https://www.tiktok.com/oembed"

    if not endpoint:
        return None

    try:
        response = requests.get(
            endpoint,
            params={"url": video_url, "format": "json"},
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError):
        return None

    return _combine_text_parts(
        [
            _clean_text(payload.get("title")),
            _clean_text(payload.get("author_name")),
        ]
    )


def _evaluate_transcript_quality(text: str | None) -> TranscriptQualityResult:
    cleaned = _clean_text(text) or ""
    word_count = len(re.findall(r"\b[\w'-]+\b", cleaned))
    char_count = len(cleaned)
    reasons: list[str] = []

    if not cleaned:
        return TranscriptQualityResult(
            is_usable=False,
            quality="unusable",
            word_count=0,
            char_count=0,
            reasons=["No public video text was available."],
        )

    if word_count < DEFAULT_MIN_TEXT_WORDS:
        reasons.append(f"Short text snippet ({word_count} words).")
    if char_count < DEFAULT_MIN_TEXT_CHARS:
        reasons.append(f"Limited text length ({char_count} characters).")

    quality = "high"
    if reasons:
        quality = "medium" if word_count >= 8 else "low"

    return TranscriptQualityResult(
        is_usable=True,
        quality=quality,
        word_count=word_count,
        char_count=char_count,
        reasons=reasons,
    )


def _quality_notes(quality: TranscriptQualityResult) -> list[str]:
    if not quality.reasons:
        return []
    return [f"Video text quality: {quality.quality}. {'; '.join(quality.reasons)}"]


def _extract_youtube_player_response(html_text: str) -> dict[str, Any] | None:
    for token in ("ytInitialPlayerResponse = ", "var ytInitialPlayerResponse = "):
        start = html_text.find(token)
        if start == -1:
            continue

        json_start = html_text.find("{", start)
        if json_start == -1:
            continue

        payload = _balanced_json_slice(html_text, json_start)
        if not payload:
            continue

        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            continue

    return None


def _balanced_json_slice(text: str, start_index: int) -> str | None:
    depth = 0
    in_string = False
    escaped = False

    for index in range(start_index, len(text)):
        char = text[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start_index:index + 1]

    return None


def _build_text_from_video_metadata(player_response: dict[str, Any]) -> str | None:
    video_details = player_response.get("videoDetails", {})
    microformat = (
        player_response.get("microformat", {})
        .get("playerMicroformatRenderer", {})
    )

    return _combine_text_parts(
        [
            _clean_text(video_details.get("title")),
            _clean_text(video_details.get("shortDescription")),
            _clean_text(microformat.get("description", {}).get("simpleText")),
        ]
    )


def _combine_text_parts(parts: list[str | None]) -> str | None:
    cleaned_parts: list[str] = []
    seen: set[str] = set()

    for part in parts:
        text = _clean_text(part)
        if not text:
            continue
        normalized = text.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        cleaned_parts.append(text)

    if not cleaned_parts:
        return None

    return "\n\n".join(cleaned_parts)


def _browser_user_agent() -> str:
    return (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    return re.sub(r"\s+", " ", text).strip()


def _combine_notes(parts: list[str] | tuple[str, ...] | str, *extra_parts: str) -> str:
    if isinstance(parts, str):
        values = [parts, *extra_parts]
    else:
        values = [*parts, *extra_parts]

    seen: set[str] = set()
    combined: list[str] = []

    for part in values:
        value = (part or "").strip()
        if not value:
            continue
        normalized = value.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        combined.append(value)

    return " ".join(combined)
