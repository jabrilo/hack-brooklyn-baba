# Backend Notes

## Transcript Retrieval

The new `POST /analyze-video` route accepts:

```json
{
  "video_url": "https://www.youtube.com/watch?v=...",
  "platform": "youtube",
  "max_claims": 3
}
```

The backend now tries to retrieve text in this order:

1. An optional external transcript provider configured through environment variables.
2. Built-in YouTube caption parsing for public YouTube caption tracks.
3. Public caption or metadata fallback text when no transcript is available.

The response includes:

- `platform`
- `video_url`
- `transcript_status`
- `transcript`
- `transcript_source`
- `notes`
- `results`

## Environment Variables

Add these to `backend/app/.env` if you want to call an external transcript provider:

```bash
VIDEO_TRANSCRIPT_PROVIDER=generic_http
VIDEO_TRANSCRIPT_PROVIDER_URL=https://your-transcript-service.example.com/transcripts
VIDEO_TRANSCRIPT_PROVIDER_API_KEY=your_api_key_here
VIDEO_TRANSCRIPT_PROVIDER_AUTH_HEADER=Authorization
VIDEO_TRANSCRIPT_PROVIDER_AUTH_SCHEME=Bearer
```

Provider request shape:

```json
{
  "video_url": "https://www.tiktok.com/@user/video/123",
  "platform": "tiktok"
}
```

Expected provider response shape:

```json
{
  "transcript": "Full transcript text when available",
  "transcript_source": "provider_name_or_mode",
  "caption_text": "Optional fallback caption or metadata text",
  "notes": ["Optional note about what was or was not available"]
}
```

## Graceful Failure Behavior

- Unsupported URLs return `transcript_status: "unsupported_url"` with `results: []`.
- Missing or blocked transcripts return `transcript_status: "transcript_failed"` with helpful notes.
- Metadata fallback returns `transcript_status: "metadata_only"` so the UI can explain that the analysis did not use spoken audio.
