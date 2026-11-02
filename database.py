
import sqlite3
from pathlib import Path

# Database file location
DB_PATH = Path(__file__).with_name("assistant.db")


# Create database connection
def get_connection():
    return sqlite3.connect(DB_PATH)


# Create chat history table
def create_tables():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# Create the table when this file runs
create_tables()

print("Database created successfully!")

# Save a chat message
def save_chat(session_id, filename, question, answer):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO chat_history
        (session_id, filename, question, answer)
        VALUES (?, ?, ?, ?)
    """, (session_id, filename, question, answer))

    connection.commit()
    connection.close()


# Get previous chat messages
def get_chat_history(session_id):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT question, answer, created_at
        FROM chat_history
        WHERE session_id = ?
        ORDER BY id ASC
    """, (session_id,))

    history = cursor.fetchall()
    connection.close()

    return history
def delete_chat_session(session_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM chat_history
        WHERE session_id = ?
    """, (session_id,))

    connection.commit()
    connection.close()  
