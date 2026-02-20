import pytest

def test_api_cadastro_retorna_201_criado(client):
    
    payload = {
        "nome": "Pedro",
        "sobrenome": "Dev",
        "email": "pedro.dev@email.com",
        "senha": "senhaforte",
        "endereco": {
            "rua": "Rua TDD",
            "numero": 10,
            "cep": "123456"
        }
    }
    
    
    resposta = client.post('/usuarios', json=payload)
    
    
    assert resposta.status_code == 201
    

    dados_resposta = resposta.get_json()
    assert dados_resposta["email"] == "pedro.dev@email.com"

def test_api_login_retorna_200(client):
  
    client.post('/usuarios', json={
        "nome": "Pedro", "sobrenome": "Dev", "email": "pedro.login@email.com", "senha": "senhaforte",
        "endereco": {"rua": "R", "numero": 1, "cep": "0"}
    })
    
   
    resposta = client.post('/login', json={
        "email": "pedro.login@email.com",
        "senha": "senhaforte"
    })
    
   
    assert resposta.status_code == 200
    assert "id" in resposta.get_json()
    