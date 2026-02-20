import pytest
from utils import hash_password, verify_password

def test_hash_password_cria_hash_diferente_da_senha():
    senha_plana = "senha123"

    senha_hasheada = hash_password(senha_plana)

    assert senha_hasheada != senha_plana
    assert isinstance(senha_hasheada, str)
    assert len(senha_hasheada) > 20

def test_verify_password_com_senha_errada():
    senha_correta = "senhaSegura123"
    senha_errada = "senhaFalsa321"
    hash_salvo = hash_password(senha_correta)

    resultado = verify_password(senha_errada, hash_salvo)

    assert resultado is False