import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tabelas import Base
import app as meu_app 

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} 
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db 
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def client(db_session):
    meu_app.app.config['TESTING'] = True
    
    
    class DummySession:
        def __enter__(self): return db_session
        def __exit__(self, exc_type, exc_val, exc_tb): pass
        
    meu_app.SessionLocal1 = lambda: DummySession()

    with meu_app.app.test_client() as client:
        yield client