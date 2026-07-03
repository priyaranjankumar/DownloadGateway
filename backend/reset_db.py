import asyncio
import os
import sqlite3
import bcrypt

DB_PATH = "/opt/download-gateway/data/gateway.db"

async def main():
    print(f"Connecting to database at: {DB_PATH}")
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        hashed_password TEXT,
        created_at TEXT
    )
    """)
    
    # Delete existing user ranjan
    cursor.execute("DELETE FROM users WHERE username = ?", ("ranjan",))
    
    # Hash password "password123"
    password = "password123"
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    # Insert ranjan
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO users (username, hashed_password, created_at) VALUES (?, ?, ?)",
        ("ranjan", hashed, now)
    )
    
    conn.commit()
    conn.close()
    print("Successfully reset DB. User 'ranjan' has been created/reset with password: 'password123'")

if __name__ == "__main__":
    asyncio.run(main())
