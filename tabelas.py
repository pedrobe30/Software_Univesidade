import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from configurar_conexao import engine, Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    sobrenome = Column(String(255), nullable=False)

    notas = relationship("Nota", back_populates="autor")
    # one-to-one com Enderecos
    enderecos = relationship(
        "Enderecos",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # cursos = relationship("Cursos", back_populates="")

# class Cursos(Base):
#     __tablename__ = "cursos"

#     id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#     nome = Column(Text)

#     alunos = relationship("Usuario", back_populates="cursos")

class Enderecos(Base):
    __tablename__ = "enderecos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rua = Column(String(400), nullable=False)
    numero = Column(Integer, nullable=False)
    cep = Column(String(20), nullable=False)

    # FK para usuarios.id; unique garante one-to-one no nível do DB
    id_usuario_endereco = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=True)
    usuario = relationship("Usuario", back_populates="enderecos")

class Nota(Base):
    __tablename__ = "notas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    conteudo = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    modificado_em = Column(DateTime(timezone=True), server_default=func.now())

    autor = relationship("Usuario", back_populates="notas")


if __name__ == "__main__":
   print("Criando Tabelas")
   
