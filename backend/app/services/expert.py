# import os
# import json
# from dotenv import load_dotenv
# from grok import 

# load_dotenv()

# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# client = OpenAI(api_key=OPENAI_API_KEY)

# def analyze_claim(claim: str, pubmed_context: str, general_context: str) -> dict:
#     """
#     Analyze a health claim using OpenAI as a Medical Fact-Checker.
#     Prioritizes scientific PubMed studies over general web context.
    
#     Args:
#         claim (str): The health claim to analyze
#         pubmed_context (str): Scientific abstracts and references from PubMed
#         general_context (str): General web search results for context
    
#     Returns:
#         dict: JSON response with verdict, confidence_score, and analysis_summary
#     """
    
#     # Handle empty PubMed results
#     pubmed_note = ""
#     if not pubmed_context or pubmed_context.strip() == "":
#         pubmed_note = "\n⚠️ NOTE: No clinical trials or peer-reviewed studies were found in PubMed for this claim."
    
#     system_prompt = """You are a Medical Fact-Checker expert. Your role is to analyze health claims based on scientific evidence.

# PRIORITY RULES:
# 1. PRIORITIZE peer-reviewed scientific studies (PubMed context) over general web information
# 2. If PubMed results are empty, note that no clinical trials were found and rely on general medical consensus
# 3. Be evidence-based and objective

# RESPONSE FORMAT:
# Return ONLY valid JSON with these exact fields:
# {
#     "verdict": "Busted|Confirmed|Inconclusive",
#     "confidence_score": <1-100>,
#     "analysis_summary": "<detailed explanation>"
# }

# Verdict definitions:
# - Confirmed: Strong scientific evidence supports the claim
# - Busted: Scientific evidence contradicts the claim
# - Inconclusive: Insufficient or conflicting evidence"""

#     user_message = f"""Analyze this health claim: "{claim}"

# SCIENTIFIC EVIDENCE (PubMed/Clinical Studies):
# {pubmed_context if pubmed_context.strip() else "No PubMed results found."}{pubmed_note}

# GENERAL CONTEXT (Web Research):
# {general_context if general_context.strip() else "No general web context available."}

# Provide your analysis in the required JSON format."""

#     response = client.chat.completions.create(
#         model="gpt-4",
#         messages=[
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_message}
#         ],
#         temperature=0.3,
#         response_format={"type": "json_object"}
#     )
    
#     # Extract and parse the JSON response
#     result = json.loads(response.choices[0].message.content)
    
#     return result
