# MythMD
### Hackathon project developed by Bezhan, Ashley, Briand, and Abdullah (BABA)

MythMD is an AI-powered health claim fact-checker that verifies claims against real peer-reviewed research. Enter any health claim and get a verdict backed by PubMed studies, a plain-language summary, a research support score, and text-to-speech readout via ElevenLabs.

---

## Stack

- **Frontend**: React + Vite (port 5173)
- **Backend**: FastAPI (port 8000)
- **AI**: Anthropic Claude (claude-sonnet-4-6)
- **Research**: PubMed API (NCBI)
- **Text-to-Speech**: ElevenLabs

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/jabrilo/hack-brooklyn-baba.git
cd hack-brooklyn-baba
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
NCBI_API_KEY=your_ncbi_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
PROJECT_EMAIL=your_email@example.com
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```
VITE_BASE_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

### 4. Open the app
Go to `http://localhost:5173`

---

## How it works

1. Enter a health claim (e.g. *"Sugar causes hyperactivity in children"*)
2. Claude extracts keywords and searches PubMed for relevant studies
3. Abstracts are fetched and analyzed by Claude
4. You get a verdict (Supported / Unsupported / Uncertain), a research support score, a plain-language summary, and cited sources
5. Hit the speaker button to hear the summary read aloud
