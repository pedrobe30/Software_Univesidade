import datetime 
from sqlalchemy import *
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "postgresql://postgres:minhasenha_forte@localhost:1234/postgres"

engine = create_engine(DATABASE_URL)

SessionLocal1 = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

