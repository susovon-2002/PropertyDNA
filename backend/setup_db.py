import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "property_dna.db")
SQL_PATH = os.path.join(os.path.dirname(__file__), "database.sql")

def setup_database():
    print(f"Setting up SQLite database at: {DB_PATH}")
    
    # Read the SQL seed file
    if not os.path.exists(SQL_PATH):
        print(f"Error: {SQL_PATH} not found!")
        return

    with open(SQL_PATH, "r", encoding="utf-8") as f:
        sql_script = f.read()

    # Connect and run SQL
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.executescript(sql_script)
        conn.commit()
        print("Database initialized and seeded successfully!")
        
        # Verify row count
        cursor.execute("SELECT COUNT(*) FROM properties")
        count = cursor.fetchone()[0]
        print(f"Total rows seeded: {count}")
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_database()
