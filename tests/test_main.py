import pytest
from main import criar_usuario, login, add_curso, criar_matricula
from tabelas import Usuario


def test_criar_usuario_caminho_feliz(db_session):
    # Arrange 
    endereco_falso = {
        "rua": "Rua dos Testes",
        "numero": 404,
        "cep": "12345-678"
    }
    
    # Act 
    resultado = criar_usuario(
        db_session=db_session,
        nome="Bernardo",
        sobrenome="Lazio",
        email="bernardo@la.com",
        senha="senha_forte_123",
        endereco=endereco_falso
    )
    
    # Assert 
    assert resultado["nome"] == "Bernardo"
    assert resultado["email"] == "bernardo@la.com"
    assert "id" in resultado
    
    # Assert
    usuario_no_bd = db_session.query(Usuario).filter(Usuario.email == "bernardo@la.com").first()
    assert usuario_no_bd is not None
    assert usuario_no_bd.enderecos.rua == "Rua dos Testes"

def test_criar_usuario_bloqueia_senha_curta(db_session):
    # Arrange
    endereco_falso = {"rua": "X", "numero": 1, "cep": "000"}
    
  
    with pytest.raises(ValueError, match="SENHA DEVE TER PELO MENOS 6 CARACTERES"):
        criar_usuario(
            db_session=db_session,
            nome="Ana",
            sobrenome="Silva",
            email="ana@teste.com",
            senha="123", 
            endereco=endereco_falso
        )

def test_login_com_sucesso(db_session):
    # Arrange
    endereco_falso = {"rua": "X", "numero": 1, "cep": "000"}
    criar_usuario(db_session, "Carlos", "Santos", "carlos@teste.com", "senha123", endereco_falso)
    
    # Act
    resultado = login(db_session, "carlos@teste.com", "senha123")
    
    # Assert
    assert "error" not in resultado
    assert resultado["nome"] == "Carlos"

def test_add_curso_com_sucesso(db_session):
    # Act
    resultado = add_curso(
        db_session, 
        nome="Engenharia de Software", 
        carga_horaria=1200, 
        modalidade="online", 
        area="exatas_tech"
    )
    
    # Assert
    assert resultado["nome"] == "Engenharia de Software"
    assert resultado["carga_horaria"] == 1200

def test_criar_matricula_com_sucesso(db_session):
    # Arrange
    endereco = {"rua": "X", "numero": 1, "cep": "000"}
    user = criar_usuario(db_session, "Maria", "Silva", "maria@teste.com", "senha123", endereco)
    curso = add_curso(db_session, "Python Pro", 100, "online", "exatas_tech")
    
    # Act
    matricula = criar_matricula(db_session, user_id=user["id"], id_curso=curso["id"])
    
    # Assert
    assert matricula["id_curso"] == curso["id"]
    assert matricula["status"] == "ativa"