import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename

from main import ler_dados, atualizar_nota, deletar_usuario, criar_novo_usuario_e_nota

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
ALLOWED_EXT = {"pdf", "png", "jpg", "jpeg", "txt", "doc", "docx"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB limite (ajuste se quiser)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

@app.route("/", methods=["GET"])
def index():
    # Rendering da landing page (templates/index.html)
    return render_template("index.html")

@app.route("/api/users", methods=["GET"])
def api_users():
    try:
        data = ler_dados()  # espera lista serializável
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/create", methods=["POST"])
def api_create():
    try:
        # suporte multipart/form-data (file) ou JSON
        if request.content_type and "multipart/form-data" in request.content_type:
            usuario = request.form.get("usuario")
            nota = request.form.get("nota")
            conteudo = request.form.get("conteudo")
            file = request.files.get("document")
        else:
            payload = request.get_json(force=True)
            usuario = payload.get("usuario")
            nota = payload.get("nota")
            conteudo = payload.get("conteudo")
            file = None

        if not usuario:
            return jsonify({"success": False, "error": "Campo 'usuario' obrigatório"}), 400

        filename_saved = None
        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({"success": False, "error": "Tipo de arquivo não permitido"}), 400
            filename = secure_filename(file.filename)
            # garantir nome único simples
            base, ext = os.path.splitext(filename)
            filename_saved = f"{base}_{os.urandom(6).hex()}{ext}"
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename_saved))

        result = criar_novo_usuario_e_nota(usuario_name=usuario, nota_titulo=nota, conteudo=conteudo, documento=filename_saved)
        return jsonify({"success": True, "uploaded": filename_saved, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/update", methods=["PUT"])
def api_update():
    try:
        payload = request.get_json(force=True)
        usuario = payload.get("usuario")
        nova_titulo = payload.get("nota")
        conteudo = payload.get("conteudo")
        if not usuario:
            return jsonify({"success": False, "error": "Campo 'usuario' obrigatório"}), 400
        result = atualizar_nota(usuario=usuario, nova_titulo=nova_titulo, novo_conteudo=conteudo)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/delete", methods=["DELETE"])
def api_delete():
    try:
        payload = request.get_json(force=True)
        usuario = payload.get("usuario") or payload.get("id")
        if not usuario:
            return jsonify({"success": False, "error": "Campo 'usuario' ou 'id' obrigatório"}), 400
        deletar_usuario(usuario)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == "__main__":
    app.run(debug=True)
