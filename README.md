# AI Document Assistant

An AI-powered PDF assistant that allows users to upload PDF documents, generate summaries, and ask questions about their documents using Google's Gemini AI.

## Features

- Upload PDF documents.
- Extract text from PDF files.
- Generate AI-powered PDF summaries.
- Ask questions about uploaded documents.
- Receive answers based on document content.
- Maintain chat history using SQLite.
- Create and delete chat sessions.
- Download conversations as TXT and PDF files.
- Handle API errors and service interruptions.

## Technologies Used

**Backend**
- Python
- FastAPI
- SQLite
- PyPDF

**AI Integration**
- Google Gemini API
- Google Gen AI SDK

**Frontend**
- HTML
- CSS
- JavaScript

**Other Tools**
- VS Code
- Git and GitHub

## Project Structure

```text
AI-Document-Assistant/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── main.py
├── database.py
├── test_gemini.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the project folder

```bash
cd AI-Document-Assistant
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

### 4. Activate the virtual environment

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure the Gemini API key

Create a `.env` file in the project root directory.

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder with your own Gemini API key.

**Important:** Never share or upload your API key.

### 7. Run the application

```bash
python -m uvicorn main:app --reload
```

### 8. Open the application

Backend API documentation:

http://127.0.0.1:8000/docs

Open `frontend/index.html` using VS Code Live Server to access the frontend.

## How It Works

1. Upload a PDF document.
2. The backend extracts text from the PDF.
3. Gemini AI processes the document content.
4. Ask questions or request a summary.
5. View and download your conversations.
6. Chat history is stored in an SQLite database.

## Future Improvements

- Support multiple document formats.
- Improve document search and retrieval.
- Add user authentication.
- Deploy the application online.
- Improve AI response accuracy for large documents.

## Author

**Santosh Pavan Dandugala**

B.Tech – Electronics and Communication Engineering

