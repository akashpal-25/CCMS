from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print("✅ Connection Successful!")
        print(result.fetchone())
except Exception as e:
    print("❌ Connection Failed:")
    print(e)