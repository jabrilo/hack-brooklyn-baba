# import os
# from dotenv import load_dotenv
# from tavily import TavilyClient

# load_dotenv()

# TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
# client = TavilyClient(api_key=TAVILY_API_KEY)

# def search_health_trends(claim: str) -> dict:
#     """
#     Search health-related information using Tavily with focus on reputable sources.
#     Restricts search to WHO, CDC, and Healthline domains for general context and misconceptions.
    
#     Args:
#         claim (str): The health claim to research
    
#     Returns:
#         dict: Search results containing relevant articles and context
#     """
#     domains = ["who.int", "cdc.gov", "healthline.com"]
#     domain_filter = " OR ".join([f"site:{domain}" for domain in domains])
    
#     search_query = f"{claim} ({domain_filter})"
    
#     response = client.search(
#         query=search_query,
#         search_depth="advanced",
#         topic="general"
#     )
    
#     return response
