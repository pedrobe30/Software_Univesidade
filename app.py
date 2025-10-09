import os
from sqlite3 import IntegrityError
from flask import Flask, request, jsonify, render_template, make_response, session
from werkzeug.utils import secure_filename
from configurar_conexao import *
from flask_cors import CORS
from main import *

app = Flask(__name__)
app.secret_key = "chave-secreta-22121979"
CORS(app, origins=["http://127.0.0.1:3000", "http://127.0.0.1:5500", "http://localhost:3000"], supports_credentials=True)


@app.route("/usuarios", methods=["POST", "GET"])
def usuario_post():
    data = request.get_json()

    campos_obrigatorios = ["nome", "sobrenome", "email", "senha", "endereco"]
    for campo in campos_obrigatorios:
        if campo not in data:
            return make_response(jsonify({"error": f"campo '{campo}' faltando"}), 400)
        
    endereco = data["endereco"]
    for campo in ["rua", "numero", "cep"]:
        if campo not in endereco:
            return make_response(jsonify({"error": f"campo '{campo}' do endereço faltando"}), 400)
    # app.logger("Cadastrando Usuario")

    try:
        with SessionLocal1() as db_session:
            novo_usuario_dict = criar_usuario(
                db_session,
                nome=data["nome"],
                sobrenome=data["sobrenome"],
                email=data["email"],
                senha=data["senha"],
                endereco=data["endereco"] 
            )

            return jsonify(novo_usuario_dict), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    except IntegrityError as e:
        db_session.rollback()
        return jsonify({"error": "Violação de integridade no banco: " + str(e.orig)}), 400
    
    except Exception as e:
         app.logger.exception(e)
         return jsonify({"error": "Erro interno no servidor"}), 500
    

@app.route("/login", methods=["POST", "GET"])
def usuario_logado():
    data = request.get_json()

    if "email" not in data:
        return make_response(jsonify({"error": "campo 'email' faltando"}), 400)
    if "senha" not in data:
        return make_response(jsonify({"error": "campo 'email' faltando"}), 400)
    
    try:
        with SessionLocal1() as db_session:
            resultado = login(db_session, email=data["email"], senha=data["senha"])

            if "error" in resultado:
                return make_response(jsonify(resultado), 401)
            
            session['user_id'] = resultado['id']
            session['user_email'] = resultado['email']
            
            return jsonify(resultado), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    except IntegrityError as e:
        db_session.rollback()
        return jsonify({"error": "Violação de integridade no banco: " + str(e.orig)}), 400
    
    except Exception as e:
         app.logger.exception(e)
         return jsonify({"error": "Erro interno no servidor"}), 500
        


@app.route("/verificar-session", methods=["GET"])
def verificar_session():
    if 'user_id' in session:
        return jsonify({
            "logado": True,
            "user_id": session['user_id'],
            "user_email": session['user_email']
        }), 200
    else:
        return jsonify({"logado": False, "mensagem": "Nenhum usuário logado"}), 401
    

@app.route("/cadastrados", methods=["GET"])
def listar_usuarios():
    with SessionLocal1() as db_session:
        usuarios = get_usuarios(db_session)

        resultado = []
        for u in usuarios:
            resultado.append({
                "id": u.id,
                "nome": u.nome,
                "sobrenome": u.sobrenome,
                "email": u.email,
                "endereco": {
                    "rua": u.enderecos.rua if u.enderecos else None,
                    "numero": u.enderecos.numero if u.enderecos else None,
                    "cep": u.enderecos.cep if u.enderecos else None
                }
            })

    return jsonify(resultado)

@app.route("/deletar/<int:user_id>", methods=["DELETE"])
def deletar_user(user_id):
    if 'user_id' not in session:
        return make_response(jsonify({"error": "Você precisa estar logado"}), 401)
    
    user_id_logado = session['user_id']

    try:
        with SessionLocal1() as db_session:
            resultado = deletar_usuario(db_session, user_id_logado, user_id)
           
            if "error" in resultado:
                
                if "permissão" in resultado["error"]:
                    return make_response(jsonify(resultado), 403)
                elif "não encontrado" in resultado["error"]:
                    return make_response(jsonify(resultado), 404)
                else:
                    return make_response(jsonify(resultado), 400)
            
            session.clear()
          
            return jsonify(resultado), 200
    
    except Exception as e:
        app.logger.exception(e)
        return jsonify({"error": "Erro interno no servidor"}), 500

