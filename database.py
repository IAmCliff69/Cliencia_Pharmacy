import os

from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    database_user = os.getenv("DB_USERNAME")
    database_password = os.getenv("DB_PASSWORD")
    database_host = os.getenv("DB_HOST")
    database_name = os.getenv("DB_NAME")

    if not all((database_user, database_password, database_host, database_name)):
        raise RuntimeError(
            "Set DATABASE_URL or DB_USERNAME, DB_PASSWORD, DB_HOST, and DB_NAME."
        )

    DATABASE_URL = URL.create(
        drivername="mysql+pymysql",
        username=database_user,
        password=database_password,
        host=database_host,
        port=int(os.getenv("DB_PORT", "3306")),
        database=database_name,
    )

if isinstance(DATABASE_URL, str):
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
    elif DATABASE_URL.startswith("mysql+mysqlconnector://"):
        DATABASE_URL = DATABASE_URL.replace(
            "mysql+mysqlconnector://", "mysql+pymysql://", 1
        )

engine = create_engine(
    DATABASE_URL,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()