import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from configurar_conexao import engine, Base
import enum

class ModalidadeEnum(enum.Enum):
    presencial = "presencial"
    online = "online"

class AreaEnum(enum.Enum):
    biologicas_saude = "Ciências Biologicas e Saúde"
    exatas_tech = "Ciências Exatas e Tecnologia"
    humanas_arte = "Ciências Humanas e Arte"

class StatusMatriculaEnum(enum.Enum):
    ativa = "ativa"
    trancada = "trancada"
    concluida = "concluida"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    sobrenome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
   
    enderecos = relationship(
        "EnderecoUsuario",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan"
    )
 
    matriculas = relationship("Matricula", back_populates="usuario", cascade="all, delete-orphan")
    notas = relationship("Nota", back_populates="usuario")


class EnderecoUsuario(Base):
    __tablename__ = "enderecos_usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rua = Column(String(400), nullable=False)
    numero = Column(Integer, nullable=False)
    cep = Column(String(20), nullable=False)

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=True)
    
    usuario = relationship("Usuario", back_populates="enderecos")


class Polo(Base):
    __tablename__ = "polos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)

    endereco = relationship(
        "EnderecoPolo",
        back_populates="polo",
        uselist=False,
        cascade="all, delete-orphan"
    )
    cursos = relationship("CursoPolo", back_populates="polo", cascade="all, delete-orphan")


class EnderecoPolo(Base):
    __tablename__ = "enderecos_polos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rua = Column(String(400), nullable=False)
    numero = Column(Integer, nullable=False)
    cep = Column(String(20), nullable=False)
    cidade = Column(String(100), nullable=False)
    estado = Column(String(2), nullable=False)  
    
    id_polo = Column(Integer, ForeignKey("polos.id"), unique=True, nullable=False)
    polo = relationship("Polo", back_populates="endereco")


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    carga_horaria = Column(Integer, nullable=False)  
    modalidade = Column(Enum(ModalidadeEnum), nullable=False)
    area = Column(Enum(AreaEnum), nullable=False)

    polos = relationship("CursoPolo", back_populates="curso", cascade="all, delete-orphan")
    matriculas = relationship("Matricula", back_populates="curso", cascade="all, delete-orphan")


class CursoPolo(Base):
    __tablename__ = "cursos_polos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_curso = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    id_polo = Column(Integer, ForeignKey("polos.id"), nullable=False)

    curso = relationship("Curso", back_populates="polos")
    polo = relationship("Polo", back_populates="cursos")


class Matricula(Base):
    __tablename__ = "matricula"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_curso = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    data_matricula = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(StatusMatriculaEnum), default=StatusMatriculaEnum.ativa, nullable=False)

 
    usuario = relationship("Usuario", back_populates="matriculas")
    curso = relationship("Curso", back_populates="matriculas")


class Nota(Base):
    __tablename__ = "notas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(255), nullable=False)
    conteudo = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    modificado_em = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="notas")


if __name__ == "__main__":
   print("Criando Tabelas...")
   Base.metadata.create_all(bind=engine)
   print("Tabelas criadas")