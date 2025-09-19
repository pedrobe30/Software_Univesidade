from tabelas import SessionLocal, Usuario, Nota

db = SessionLocal()

def criar_novo_usuario_e_nota():
    novo_usuario = Usuario(
        nome="Bill Gates",
        email="bill.gates.outlook.com",
        senha_hash = "hash_super_seguro"
    )

    db.add(novo_usuario)
    db.commit()
    print(f"Usuario '{novo_usuario.nome}' criado com ID: {novo_usuario.id}")

    nova_nota = Nota(
        titulo="Minha Primeira nota com SQLAlchemy",
        conteudo="É muito mais facil do que escrever SQL na mão!",
        autor=novo_usuario
    )

    db.add(nova_nota)
    db.commit()

def atualizar_nota(id_nota):
    nota_para_editar = db.query(Nota).filter(Nota.id == id_nota).first()

    if nota_para_editar:
        print(f"Titulo original: '{nota_para_editar.titulo}'")

        nota_para_editar.titulo = "Lista de anotações ATUALIZADA!"

        db.commit()
        print(f"Titulo Novo: '{nota_para_editar.titulo}'")
    else:
        print("Nota com ID %d não encontrada. " % id_nota)

def ler_dados(nome):
    user = db.query(Usuario).filter(Usuario.nome == nome).first()

    if user:
        print(f"Encontrei o(a): {user.nome} (Email: {user.email})")

        print("Notas do User: ")
        for nota in user.notas:
            print(f" - Título: {nota.titulo} (ID: {nota.id})")
    
    else:
        print("Usuario(a) não encontrado")


criar_novo_usuario_e_nota(Usuario.nome)