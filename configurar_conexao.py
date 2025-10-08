import datetime 
from sqlalchemy import *
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from dotenv import load_dotenv, dotenv_values
import os

load_dotenv()

variaveis_de_ambiente = dotenv_values()
DATABASE_URL = variaveis_de_ambiente["DATABASE_URL"]

DATABASE_URL = 'postgresql://neondb_owner:npg_Gw6tFExfcL4l@ep-sweet-brook-ac9j1zlo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

engine = create_engine(DATABASE_URL)

SessionLocal1 = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

