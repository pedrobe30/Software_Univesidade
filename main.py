# main.py
import re
import random
from werkzeug.security import generate_password_hash
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError

from tabelas import SessionLocal, Usuario, Nota

def _gera_email_unico(nome):
    base = re.sub(r'\s+', '_', nome.strip().lower())
    suffix = random.randint(1000, 9999)
    return f"{base}{suffix}@example.com"

def criar_novo_usuario_e_nota(usuario_name: str, nota_titulo: str = None, conteudo: str = None, documento: str = None):
    """
    Cria usuário (se não existir por nome) e cria uma nota associada.
    Usa uma sessão local (não mantém sessão global).
    Retorna dict com info criada.
    """
    if not usuario_name:
        raise ValueError("nome de usuário obrigatório")

    session = SessionLocal()
    try:
        usuario = session.query(Usuario).filter(Usuario.nome == usuario_name).first()

        if not usuario:
            email = _gera_email_unico(usuario_name)
            senha_hash = generate_password_hash("alterar123")
            usuario = Usuario(nome=usuario_name, email=email, senha_hash=senha_hash)
            session.add(usuario)
            session.flush()   # garante que usuario.id seja gerado

        titulo = nota_titulo if nota_titulo is not None else "Sem título"
        conteudo_final = (conteudo or "")
        if documento:
            conteudo_final = (conteudo_final + "\nDocumento: " + documento).strip()

        nota = Nota(id_usuario=usuario.id, titulo=titulo, conteudo=conteudo_final)
        session.add(nota)
        session.commit()
        session.refresh(usuario)
        session.refresh(nota)

        return {"usuario": usuario.nome, "usuario_id": usuario.id, "nota_id": nota.id, "titulo": nota.titulo}
    except SQLAlchemyError as e:
        session.rollback()
        raise
    finally:
        session.close()


def atualizar_nota(usuario: str, nova_titulo: str = None, novo_conteudo: str = None):
    """
    Atualiza a nota mais recente do usuário (por nome). 
    Se não existir nota, cria uma nova.
    """
    session = SessionLocal()
    try:
        usuario_obj = session.query(Usuario).filter(Usuario.nome == usuario).first()
        if not usuario_obj:
            raise ValueError("Usuário não encontrado")

        nota = session.query(Nota).filter(Nota.id_usuario == usuario_obj.id).order_by(Nota.modificado_em.desc()).first()
        if not nota:
            nota = Nota(id_usuario=usuario_obj.id, titulo=nova_titulo or "Sem título", conteudo=novo_conteudo or "")
            session.add(nota)
        else:
            if nova_titulo is not None:
                nota.titulo = nova_titulo
            if novo_conteudo is not None:
                nota.conteudo = novo_conteudo
        session.commit()
        session.refresh(nota)
        return {"nota_id": nota.id, "titulo": nota.titulo}
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()


def ler_dados():
    """
    Retorna lista de usuários com suas notas em formato serializável.
    """
    session = SessionLocal()
    try:
        users = session.query(Usuario).options(joinedload(Usuario.notas)).all()
        result = []
        for u in users:
            notas = []
            for n in u.notas:
                notas.append({
                    "id": n.id,
                    "titulo": n.titulo,
                    "conteudo": n.conteudo,
                    "criado_em": n.criado_em.isoformat() if n.criado_em else None,
                    "modificado_em": n.modificado_em.isoformat() if n.modificado_em else None
                })
            result.append({
                "id": u.id,
                "usuario": u.nome,
                "email": u.email,
                "criado_em": u.criado_em.isoformat() if u.criado_em else None,
                "notas": notas
            })
        return result
    finally:
        session.close()


def deletar_usuario(usuario_or_id):
    """
    Deleta usuário por id (int) ou por nome (string).
    Primeiro deleta notas associadas (para evitar setar FK a NULL).
    """
    session = SessionLocal()
    try:
        usuario_obj = None
        # tenta usar id
        try:
            id_check = int(usuario_or_id)
            usuario_obj = session.query(Usuario).filter(Usuario.id == id_check).first()
        except Exception:
            usuario_obj = session.query(Usuario).filter(Usuario.nome == usuario_or_id).first()

        if not usuario_obj:
            raise ValueError("Usuário não encontrado")

        # Apaga notas associadas explicitamente (evita ON DELETE SET NULL / constraints)
        session.query(Nota).filter(Nota.id_usuario == usuario_obj.id).delete(synchronize_session=False)

        # Apaga o usuário
        session.delete(usuario_obj)
        session.commit()
        return True
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()
