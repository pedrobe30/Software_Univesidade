from utils import *
from sqlalchemy import *
from tabelas import *
from configurar_conexao import *

def criar_usuario(db_session, nome, sobrenome, email, senha, endereco):
    if not nome or not sobrenome or not email or not senha:
        raise ValueError("nome, sobrenome, email e senha são obrigatorios")
    
    if len(senha) < 6:
        raise  ValueError("SENHA DEVE TER PELO MENOS 6 CARACTERES")
    
    existing = db_session.query(Usuario).filter(Usuario.email == email).first()
    if existing:
        raise ValueError("Email já cadastrado")
    if not isinstance(endereco, dict) or any(k not in endereco for k in ("rua", "numero", "cep")):
        raise ValueError("endereco deve ser dict com rua, numero, cep")
    
    senha_hash = hash_password(senha)

    novo_usuario = Usuario(
        nome = nome, 
        sobrenome = sobrenome,
        email = email,
        senha_hash = senha_hash
    )

    novo_endereco = EnderecoUsuario(
        rua = endereco["rua"],
        numero = endereco["numero"],
        cep = endereco["cep"]
    )

    novo_usuario = novo_endereco
    try:

        db_session.add(novo_usuario)
        db_session.commit()
        db_session.refresh(novo_usuario)

    except Exception as e:
        db_session.rollback()
        raise

    return {
        "id": novo_usuario.id,
        "nome": novo_usuario.nome,
        "sobrenome": novo_usuario.sobrenome,
        "email": novo_usuario.email,
        "endereco": {
            "rua": novo_endereco.rua,
            "numero": novo_endereco.numero,
            "cep": novo_endereco.cep
        }
    }

def login(db_session, email, senha):
    usuario = db_session.query(Usuario).filter(Usuario.email == email).first()

    if not usuario:
        return {"error": "Email ou Senha Invalidas"}
    
    senha_correta = verify_password(plain_password=senha, hashed_password=usuario.senha_hash)

    if not senha_correta:
        return {"error": "Email ou Senha Invalidas"}
    
    else:
         return {
        "id": usuario.id,
        "nome": usuario.nome,
        "sobrenome": usuario.sobrenome,
        "email": usuario.email,
        "endereco": {
            "rua": usuario.enderecos.rua if usuario.enderecos else None,
            "numero": usuario.enderecos.numero if usuario.enderecos else None,
            "cep": usuario.enderecos.cep if usuario.enderecos else None,
        }
    }


def deletar_usuario(db_session, user_id_logado, user_id_para_deletar):
    
    if user_id_logado != user_id_para_deletar:
        return {"error": "Você não tem permissão para deletar este usuario"}
    
    usuario = db_session.query(Usuario).filter(Usuario.id == user_id_para_deletar).first()

    if not usuario:
        return {"erro": "Usuario não encontrado"}
    
    try:
        db_session.delete(usuario)
        db_session.commit()
        return {"mensagem": "Usuario deletado com sucesso"}
    
    except Exception as e:
        db_session.rollback()
        raise


def add_polo(db_session, nome, telefone, polo_endereco):
    if not nome or telefone or polo_endereco:
        raise ValueError("erro:" "Está faltando preencher campos")
    
    if not isinstance(polo_endereco, dict) or any(k not in polo_endereco for k in ("rua", "numero", "cep", "cidade", "estado")):
        raise ValueError("endereco deve ser dict com rua, numero, cep")
    
    novo_polo = Polo(
        nome = nome,
        telefone = telefone
    )

    novo_endereco_polo = EnderecoPolo(
        rua = polo_endereco["rua"],
        numero = polo_endereco["numero"],
        cep = polo_endereco["cep"],
        cidade = polo_endereco["cidade"],
        estado = polo_endereco["estado"]
    )

    novo_polo.polo = novo_endereco_polo


def get_usuarios(db_session):
    return db_session.query(Usuario).all()




