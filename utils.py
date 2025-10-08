import bcrypt

def hash_password(plain_password: str) -> str:
    # recebe senha em texto e retorna a senha hasheada como string (utf-8)

    plain_bytes = plain_password.encode("utf-8")

    salt = bcrypt.gensalt()

    hashed = bcrypt.hashpw(plain_bytes, salt)

    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto puro bate com o hash armazenado.
    Deve retornar True se confere, False caso contrário.
    """

    plain_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


if __name__ == "__main__":
    senha = "minhasenha123"
    h = hash_password(senha)
    print("HASH:", h)
    print("Verifica (correta):", verify_password("minhasenha123", h))
    print("Verifica (errada):", verify_password("outrasenha", h))
