import os
from sqlite3 import IntegrityError
from flask import Flask, request, jsonify, make_response, session
from flask_cors import CORS
from configurar_conexao import *
from main import *

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")


CORS(app, origins=["http://127.0.0.1:3000", "http://127.0.0.1:5500", "http://localhost:5500"], supports_credentials=True)


@app.route("/login", methods=["POST"])
def route_login():
    data = request.get_json()
    try:
        with SessionLocal1() as db:
            user = login(db, email=data.get("email"), senha=data.get("senha"))
            if "error" in user:
                return make_response(jsonify(user), 401)
            
           
            session['user_id'] = user['id']
            session['is_admin'] = user.get('is_admin', False)
            
            return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/logout", methods=["POST"])
def route_logout():
    session.clear()
    return jsonify({"msg": "Deslogado"}), 200


@app.route("/usuarios", methods=["POST"])
def route_criar_usuario():
    data = request.get_json()
    try:
        with SessionLocal1() as db:
            novo = criar_usuario(db, **data) 
            return jsonify(novo), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/perfil", methods=["GET"])
def route_perfil():
    if 'user_id' not in session: return jsonify({"error": "Não logado"}), 401
    try:
        with SessionLocal1() as db:
            dados = get_perfil_aluno(db, session['user_id'])
            return jsonify(dados)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/matricula", methods=["POST"])
def route_matricular():
    if 'user_id' not in session: 
        return jsonify({"error": "Faça login"}), 401
    if session.get('is_admin'): 
        return jsonify({"error": "Admins não se matriculam"}), 403

    data = request.get_json()
    try:
        with SessionLocal1() as db:
            res = criar_matricula(db, session['user_id'], data['id_curso'])
            return jsonify(res), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/deletar/conta", methods=["DELETE"])
def route_deletar_conta():
    if 'user_id' not in session: return jsonify({"error": "Não logado"}), 401
    try:
        with SessionLocal1() as db:
            deletar_usuario(db, session['user_id'], session['user_id'])
            session.clear()
            return jsonify({"msg": "Conta deletada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/cursos", methods=["GET", "POST"])
def route_cursos():
    with SessionLocal1() as db:
        if request.method == "GET":
            cursos = get_cursos(db)
            return jsonify([
                {"id": c.id, "nome": c.nome, "area": c.area.value, 
                 "carga_horaria": c.carga_horaria, "modalidade": c.modalidade.value} 
                for c in cursos
            ])
        
        if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
        data = request.get_json()
        try:
            res = add_curso(db, 
                nome=data['nome'], carga_horaria=data['carga_horaria'], 
                modalidade=data['modalidade'], area=data['area'], 
                polos_ids=data.get('polos_ids')
            )
            return jsonify(res), 201
        except Exception as e: return jsonify({"error": str(e)}), 400

@app.route("/cursos/<int:id_curso>", methods=["DELETE"])
def route_delete_curso(id_curso):
    if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
    try:
        with SessionLocal1() as db:
            deletar_curso_db(db, id_curso)
            return jsonify({"msg": "Curso deletado"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 400

@app.route("/polos", methods=["GET", "POST"])
def route_polos():
    with SessionLocal1() as db:
        if request.method == "GET":
            polos = get_polos(db)
            return jsonify([
                {"id": p.id, "nome": p.nome, "endereco": {
                    "cidade": p.endereco.cidade, "estado": p.endereco.estado, 
                    "rua": p.endereco.rua, "numero": p.endereco.numero
                }} for p in polos
            ])
        
        if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
        data = request.get_json()
        try:
            res = add_polo(db, data['nome'], data['telefone'], data['endereco'])
            return jsonify(res), 201
        except Exception as e: return jsonify({"error": str(e)}), 400

@app.route("/polos/<int:id_polo>", methods=["DELETE"])
def route_delete_polo(id_polo):
    if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
    try:
        with SessionLocal1() as db:
            deletar_polo_db(db, id_polo)
            return jsonify({"msg": "Polo deletado"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 400


@app.route("/admin/alunos", methods=["GET"])
def route_admin_alunos():
    if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
    with SessionLocal1() as db:
        alunos = get_usuarios(db)
        return jsonify([{"id": a.id, "nome": a.nome, "email": a.email} for a in alunos])

@app.route("/admin/curso/<int:id_curso>/alunos", methods=["GET"])
def route_alunos_do_curso(id_curso):
    if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
    try:
        with SessionLocal1() as db:
            lista = get_alunos_matriculados(db, id_curso)
            return jsonify(lista)
    except Exception as e: return jsonify({"error": str(e)}), 400

@app.route("/admin/matricula/<int:id_matricula>", methods=["DELETE"])
def route_cancelar_matricula(id_matricula):
    if not session.get('is_admin'): return jsonify({"error": "Acesso negado"}), 403
    try:
        with SessionLocal1() as db:
            cancelar_matricula_admin(db, id_matricula)
            return jsonify({"msg": "Matrícula cancelada"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)