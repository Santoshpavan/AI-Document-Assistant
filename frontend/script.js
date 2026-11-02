console.log("JavaScript connected successfully!");

// HTML elements
const pdfFile = document.getElementById("pdfFile");
const uploadBtn = document.getElementById("uploadBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const uploadStatus = document.getElementById("uploadStatus");

const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const chatBox = document.getElementById("chatBox");

const historyBtn = document.getElementById("historyBtn");
const sessionSelect = document.getElementById("sessionSelect");
const newChatBtn = document.getElementById("newChatBtn");
const deleteChatBtn = document.getElementById("deleteChatBtn");

const downloadTxtBtn = document.getElementById("downloadTxtBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

let selectedPDF = null;
let sessionId = sessionSelect.value;


// Save sessions in localStorage
function saveSessions() {
    const sessions = Array.from(sessionSelect.options).map(option => ({
        id: option.value,
        name: option.textContent
    }));

    localStorage.setItem("chatSessions", JSON.stringify(sessions));
}


// Load saved sessions
function loadSessions() {
    const savedSessions = JSON.parse(
        localStorage.getItem("chatSessions") || "[]"
    );

    savedSessions.forEach(function(session) {
        const exists = Array.from(sessionSelect.options).some(
            option => option.value === session.id
        );

        if (!exists) {
            const option = document.createElement("option");
            option.value = session.id;
            option.textContent = session.name;
            sessionSelect.appendChild(option);
        }
    });
}

loadSessions();


// Restore last selected session
const lastSession = localStorage.getItem("lastSelectedSession");

if (lastSession && Array.from(sessionSelect.options).some(
        option => option.value === lastSession
    )) {
    sessionSelect.value = lastSession;
}

sessionId = sessionSelect.value;


// Update selected session
sessionSelect.addEventListener("change", function() {
    sessionId = sessionSelect.value;

    localStorage.setItem("lastSelectedSession", sessionId);

    chatBox.innerHTML = "";
    historyBtn.click();
});


// Upload PDF
uploadBtn.addEventListener("click", function() {
    selectedPDF = pdfFile.files[0];

    if (!selectedPDF) {
        uploadStatus.textContent = "Please select a PDF first.";
        return;
    }

    if (!selectedPDF.name.toLowerCase().endsWith(".pdf")) {
        uploadStatus.textContent = "Please select a valid PDF file.";
        selectedPDF = null;
        return;
    }

    uploadStatus.textContent = "Selected: " + selectedPDF.name;
});


// Ask question
askBtn.addEventListener("click", async function() {

    const question = questionInput.value.trim();

    // Validate PDF
    if (!selectedPDF) {
        alert("Please select a PDF first.");
        return;
    }

    // Validate question
    if (!question) {
        alert("Please enter a question.");
        return;
    }

    const welcome = chatBox.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }

    // Display user question
    const userMessage = document.createElement("div");
    userMessage.className = "message user-message";

    const userBubble = document.createElement("div");
    userBubble.className = "message-bubble";
    userBubble.textContent = question;

    userMessage.appendChild(userBubble);
    chatBox.appendChild(userMessage);

    // Show loading indicator
    const loadingMessage = document.createElement("p");
    loadingMessage.id = "loadingMessage";
    loadingMessage.textContent = "AI is thinking...";

    chatBox.appendChild(loadingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    askBtn.disabled = true;
    askBtn.textContent = "Thinking...";

    try {
        const formData = new FormData();

        formData.append("file", selectedPDF);
        formData.append("question", question);
        formData.append("session_id", sessionId);

        const response = await fetch(
            "http://127.0.0.1:8000/ask-question", {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }

        // Display AI answer
        const aiMessage = document.createElement("div");
        aiMessage.className = "message ai-message";

        const aiBubble = document.createElement("div");
        aiBubble.className = "message-bubble";
        aiBubble.textContent = data.answer;

        aiMessage.appendChild(aiBubble);
        chatBox.appendChild(aiMessage);

        questionInput.value = "";

    } catch (error) {

        let message = "Something went wrong. Please try again.";

        if (
            error.message.includes("429") ||
            error.message.includes("RESOURCE_EXHAUSTED")
        ) {
            message = "Daily AI usage limit reached. Please try later.";

        } else if (
            error.message.includes("503") ||
            error.message.includes("UNAVAILABLE")
        ) {
            message = "AI service is temporarily busy. Please try again later.";

        } else if (error.message.includes("Failed to fetch")) {
            message = "Cannot connect to the backend server.";
        }

        const errorMessage = document.createElement("div");
        errorMessage.className = "message ai-message error-message";

        const errorBubble = document.createElement("div");
        errorBubble.className = "message-bubble";
        errorBubble.textContent = message;

        errorMessage.appendChild(errorBubble);
        chatBox.appendChild(errorMessage);

    } finally {

        // Remove loading indicator
        const loadingMessage = document.getElementById("loadingMessage");

        if (loadingMessage) {
            loadingMessage.remove();
        }

        askBtn.disabled = false;
        askBtn.textContent = "Ask";

        chatBox.scrollTop = chatBox.scrollHeight;
    }
});


// View chat history
historyBtn.addEventListener("click", async function() {
    historyBtn.disabled = true;
    historyBtn.textContent = "Loading...";

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/chat-history/${encodeURIComponent(sessionId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Unable to load chat history.");
        }

        chatBox.innerHTML = "";

        if (data.history.length === 0) {
            chatBox.textContent = "No previous conversations found.";
            return;
        }

        data.history.forEach(function(item) {

            const userMessage = document.createElement("div");
            userMessage.className = "message user-message";

            const userBubble = document.createElement("div");
            userBubble.className = "message-bubble";
            userBubble.textContent = item.question;

            userMessage.appendChild(userBubble);
            chatBox.appendChild(userMessage);

            const aiMessage = document.createElement("div");
            aiMessage.className = "message ai-message";

            const aiBubble = document.createElement("div");
            aiBubble.className = "message-bubble";
            aiBubble.textContent = item.answer;

            aiMessage.appendChild(aiBubble);
            chatBox.appendChild(aiMessage);
        });

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        alert("Could not load chat history: " + error.message);

    } finally {
        historyBtn.disabled = false;
        historyBtn.textContent = "View Chat History";
    }
});


// Create a new chat
newChatBtn.addEventListener("click", function() {
    const chatName = prompt("Enter a name for your new chat:");

    if (!chatName || !chatName.trim()) {
        return;
    }

    const newSessionId = "chat_" + Date.now();

    const option = document.createElement("option");
    option.value = newSessionId;
    option.textContent = chatName.trim();

    sessionSelect.appendChild(option);
    sessionSelect.value = newSessionId;

    sessionId = newSessionId;

    saveSessions();
    localStorage.setItem("lastSelectedSession", sessionId);

    chatBox.innerHTML = "";

    console.log("New session created:", chatName);
});


// Delete current chat
deleteChatBtn.addEventListener("click", async function() {

    if (
        sessionId === "frontend_chat" ||
        sessionId === "python_notes" ||
        sessionId === "default"
    ) {
        alert("You cannot delete the default sessions.");
        return;
    }

    const confirmDelete = confirm(
        "Are you sure? This will permanently delete this chat and its history."
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/delete-chat/${encodeURIComponent(sessionId)}`, {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not delete chat.");
        }

        const selectedOption = sessionSelect.options[
            sessionSelect.selectedIndex
        ];

        if (selectedOption) {
            sessionSelect.removeChild(selectedOption);
        }

        saveSessions();

        // Select the first remaining session
        sessionSelect.selectedIndex = 0;
        sessionId = sessionSelect.value;

        localStorage.setItem("lastSelectedSession", sessionId);

        chatBox.innerHTML = "";
        historyBtn.click();

        alert("Chat and its database history deleted successfully!");

    } catch (error) {
        alert("Deletion failed: " + error.message);
    }
});


// Summarize PDF
summarizeBtn.addEventListener("click", async function() {

    if (!selectedPDF) {
        alert("Please select and upload a PDF first.");
        return;
    }

    summarizeBtn.disabled = true;
    summarizeBtn.textContent = "Summarizing...";

    try {
        const formData = new FormData();

        formData.append("file", selectedPDF);

        const response = await fetch(
            "http://127.0.0.1:8000/summarize-pdf", {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Summary generation failed.");
        }

        // Display summary in chat box
        chatBox.innerHTML = "";

        const summaryMessage = document.createElement("div");
        summaryMessage.className = "message ai-message";

        const summaryBubble = document.createElement("div");
        summaryBubble.className = "message-bubble";

        summaryBubble.textContent =
            data.summary || data.answer || JSON.stringify(data);

        summaryMessage.appendChild(summaryBubble);
        chatBox.appendChild(summaryMessage);

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        alert("Summarization failed: " + error.message);

    } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = "Summarize PDF";
    }
});


// Download AI answers as TXT
downloadTxtBtn.addEventListener("click", function() {

    const messages = chatBox.querySelectorAll(".message-bubble");

    if (messages.length === 0) {
        alert("No answers available to download.");
        return;
    }

    let content = "";

    messages.forEach(function(message) {
        content += message.innerText + "\n\n";
    });

    const blob = new Blob([content], {
        type: "text/plain"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "AI-Document-Assistant-Answers.txt";

    link.click();

    URL.revokeObjectURL(link.href);
});


// Download AI answers as PDF
downloadPdfBtn.addEventListener("click", function() {

    const messages = chatBox.querySelectorAll(".message-bubble");

    if (messages.length === 0) {
        alert("No answers available to download.");
        return;
    }

    if (!window.jspdf) {
        alert("PDF download library is not loaded. Please refresh the page.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("AI Document Assistant", 15, y);

    y += 15;
    doc.setFontSize(11);

    messages.forEach(function(message) {

        const lines = doc.splitTextToSize(
            message.innerText,
            180
        );

        if (y + lines.length * 6 > 280) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, 15, y);
        y += lines.length * 6 + 10;
    });

    doc.save("AI-Document-Assistant-Answers.pdf");
});