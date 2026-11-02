from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from io import BytesIO
from pypdf import PdfReader
from dotenv import load_dotenv
from pathlib import Path
from google import genai
import os
import re
from database import save_chat, get_chat_history, delete_chat_session
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException

# Load environment variables
env_path = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=env_path, override=True)

API_KEY = os.getenv("GEMINI_API_KEY")

print("ENV file found:", env_path.exists())
print("API key loaded:", bool(API_KEY))


# Connect Gemini
client = genai.Client(api_key=API_KEY) if API_KEY else None


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to AI Document Assistant"
    }


# About API
@app.get("/about")
def about():
    return {
        "project": "AI Document Assistant",
        "developer": "Python Backend Developer"
    }


# PDF Upload API
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    pdf_content = await file.read()

    if not pdf_content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    return {
        "message": "PDF uploaded successfully!",
        "filename": file.filename,
        "file_size": len(pdf_content)
    }


# PDF Text Extraction API
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):

    # Read uploaded PDF
    pdf_content = await file.read()

    # Open PDF
    reader = PdfReader(BytesIO(pdf_content))

    # Extract text from all pages
    extracted_text = ""

    for page in reader.pages:
        extracted_text += page.extract_text() or ""

    # Clean extracted text
    cleaned_text = re.sub(r"[ \t]+", " ", extracted_text)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)
    cleaned_text = cleaned_text.strip()

    # Return the result
    return {
        "filename": file.filename,
        "total_pages": len(reader.pages),
        "total_characters": len(cleaned_text),
        "total_words": len(cleaned_text.split()),
        "extracted_text": cleaned_text
    }

# Ask Questions About PDF

# Ask Questions About PDF
@app.post("/ask-question")
async def ask_question(
    file: UploadFile = File(...),
    question: str = Form(...),
    session_id: str = Form("default")
):

    # Check API key
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is missing."
        )

    # Check PDF file
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    # Read PDF
    pdf_content = await file.read()

    try:
        reader = PdfReader(BytesIO(pdf_content))

        extracted_text = ""

        for page in reader.pages:
            extracted_text += page.extract_text() or ""

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF."
            )

        # Prepare prompt for Gemini
        prompt = f"""
        You are a helpful AI Document Assistant.

        Answer the user's question using only the
        information available in the PDF below.

        If the answer is not available in the PDF,
        clearly say that the document does not contain
        that information.

        PDF CONTENT:
        {extracted_text}

        USER QUESTION:
        {question}
        """

        # Send question to Gemini
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        answer = response.text or "No answer was generated."

        # Save question and answer in database
        save_chat(
            session_id,
            file.filename,
            question,
            answer
        )

        return {
            "filename": file.filename,
            "session_id": session_id,
            "question": question,
            "answer": answer
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )



# Summarize PDF
@app.post("/summarize-pdf")
async def summarize_pdf(file: UploadFile = File(...)):

    try:
        pdf_content = await file.read()
        reader = PdfReader(BytesIO(pdf_content))

        extracted_text = ""

        for page in reader.pages:
            extracted_text += page.extract_text() or ""

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in this PDF."
            )

        prompt = f"""
        Summarize this document in simple English.

        Include:
        1. Short summary
        2. Main points
        3. Important topics

        Document:
        {extracted_text}
        """

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        return {
            "filename": file.filename,
            "summary": response.text
        }

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)

        if "503" in error_message:
            raise HTTPException(
                status_code=503,
                detail="Gemini is temporarily busy. Please try again later."
            )

        raise HTTPException(
            status_code=500,
            detail="Something went wrong while summarizing the PDF."
        )


# Get Chat History
@app.get("/chat-history/{session_id}")
def chat_history(session_id: str):

    history = get_chat_history(session_id)

    return {
        "session_id": session_id,
        "total_messages": len(history),
        "history": [
            {
                "question": item[0],
                "answer": item[1],
                "created_at": item[2]
            }
            for item in history
        ]
    }
@app.delete("/delete-chat/{session_id}")
def delete_chat(session_id: str):

    delete_chat_session(session_id)

    return {
        "message": "Chat session deleted successfully",
        "session_id": session_id
    }   
