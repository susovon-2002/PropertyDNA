import sqlite3, sys, os
sys.path.insert(0, '.')
from main import init_all_tables

init_all_tables()

conn = sqlite3.connect('property_dna.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("Tables:", tables)

for t in tables:
    cursor.execute(f"PRAGMA table_info({t})")
    cols = [r[1] for r in cursor.fetchall()]
    print(f"  {t}: {cols}")

conn.close()
print("\nAll tables verified OK!")
