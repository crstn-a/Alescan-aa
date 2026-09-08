import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("backend/.env")

sql_file = "backend/migrations/migration_location_monitoring.sql"
with open(sql_file, "r") as f:
    sql_script = f.read()

print("Migration SQL script read successfully.")

# Try connecting via direct database host or poolers
candidates = [
    {"host": os.getenv("SUPABASE_URL"), "port": os.getenv("PORT"), "user": os.getenv("USER"), "pw": os.getenv("PASSWORD")}
]

success = False
for c in candidates:
    print(f"Connecting to {c['host']}:{c['port']}...")
    try:
        conn = psycopg2.connect(
            host=c["host"],
            port=c["port"],
            dbname="postgres",
            user=c["user"],
            password=c["pw"],
            connect_timeout=15
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("Executing migration SQL...")
        cur.execute(sql_script)
        print("Migration executed successfully!")
        cur.close()
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"Failed connection to {c['host']}: {e}")

if not success:
    print("Could not connect directly via psycopg2. Please run migration_location_monitoring.sql in Supabase SQL Editor.")
