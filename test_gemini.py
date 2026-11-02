from pathlib import Path
from dotenv import load_dotenv
from google import genai
import os

env_path = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=env_path, override=True)

API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY)

try:
    print("Testing Gemini text generation...")

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents="Explain Python OOP in three simple points."
    )

    print("\nGemini Response:")
    print(response.text)

except Exception as e:
    print("\nError:", e)