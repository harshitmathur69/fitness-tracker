import os
from groq import Groq

def get_groq_client():
    """
    Creates and returns a Groq client instance
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    
    return Groq(api_key=api_key)
