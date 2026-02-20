document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://faculdadenew.onrender.com'; 
    let currentUser = null;

    // --- ELEMENTOS UI ---
    const viewAuth = document.getElementById('view-auth');
    const viewDashboard = document.getElementById('view-dashboard');
    const sections = document.querySelectorAll('.page-section');

    // --- FUNÇÕES AUXILIARES DE API (O segredo do sucesso!) ---
    // Wrapper para fetch que sempre inclui credenciais (cookies)
    async function apiFetch(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // <--- ESSENCIAL PARA O SESSION FUNCIONAR
        };
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na requisição');
        return data;
    }

    // --- 1. LOGIN / CADASTRO / LOGOUT ---

    const formCadastro = document.getElementById('form-cadastro');
    
    if (formCadastro) {
        formCadastro.onsubmit = async (e) => {
            e.preventDefault(); // 1. Impede recarregar a página
            console.log("Iniciando tentativa de cadastro..."); // Debug no console

            const f = e.target;
            const senha = document.getElementById('reg-senha').value;
            const confirmacao = document.getElementById('reg-conf-senha').value;

            // 2. Validação de Senha no Frontend
            if (senha !== confirmacao) {
                alert("As senhas não coincidem!");
                return; // Para tudo se a senha estiver errada
            }

            // 3. Montagem do Objeto (Payload) conforme o Backend espera
            // IMPORTANTE: Converter 'numero' para Inteiro com parseInt()
            const payload = {
                nome: f.nome.value,
                sobrenome: f.sobrenome.value,
                email: f.email.value,
                senha: senha,
                endereco: {
                    cep: f.cep.value,
                    rua: f.rua.value,
                    numero: parseInt(f.numero.value) || 0 // Converte para int, ou 0 se vazio
                }
            };

            console.log("Payload enviado:", payload); // Mostra o que está sendo enviado

            try {
                // Usa a função apiFetch que criamos (ou fetch padrão com headers)
                const res = await fetch(`${API_BASE_URL}/usuarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Erro desconhecido no servidor");
                }

                // Sucesso!
                alert("Conta criada com sucesso! Faça login.");
                f.reset(); // Limpa o formulário
                
                // Troca para a tela de login automaticamente
                document.querySelector('.sign-up').classList.add('hidden');
                document.querySelector('.sign-in').classList.remove('hidden');

            } catch (err) {
                console.error("Erro no cadastro:", err);
                alert("Erro ao cadastrar: " + err.message);
            }
        };
    }
    
    document.getElementById('form-login').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = Object.fromEntries(new FormData(e.target));
            const user = await apiFetch('/login', 'POST', formData);
            loginSuccess(user);
        } catch (err) { alert(err.message); }
    };

    document.getElementById('btn-logout').onclick = async () => {
        await apiFetch('/logout', 'POST');
        location.reload();
    };

    document.getElementById('btn-deletar-conta').onclick = async () => {
        if(!confirm("Tem certeza que deseja apagar sua conta?")) return;
        try {
            await apiFetch('/deletar/conta', 'DELETE');
            alert("Conta excluída.");
            location.reload();
        } catch (err) { alert("Erro ao excluir: " + err.message); }
    };

    // --- 2. LOGICA DO DASHBOARD ---

    function loginSuccess(user) {
        currentUser = user;
        viewAuth.classList.add('hidden');
        viewDashboard.classList.remove('hidden');

        // UI Header
        document.getElementById('display-name').textContent = user.is_admin ? "Administrador" : `${user.nome} ${user.sobrenome}`;
        document.getElementById('display-role').textContent = user.is_admin ? "Gestão Acadêmica" : "Estudante";
        
        // Menu Toggle
        document.querySelectorAll('.menu-item').forEach(m => m.classList.add('hidden'));
        const role = user.is_admin ? 'admin' : 'aluno';
        const menus = user.is_admin 
            ? ['menu-admin-cursos', 'menu-admin-polos'] 
            : ['menu-aluno-home', 'menu-aluno-perfil'];
        
        menus.forEach(id => document.getElementById(id).classList.remove('hidden'));
        
        // Navegar para primeira tela
        navigateTo(user.is_admin ? 'admin-cursos' : 'aluno-home');
    }

    // Navegação Sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.target);
        });
    });

    function navigateTo(targetId) {
        sections.forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.remove('hidden');
            carregarDadosSecao(targetId);
        }
    }

    // --- 3. CARREGAMENTO DE DADOS ---

    async function carregarDadosSecao(id) {
        try {
            if(id === 'aluno-home') {
                const cursos = await apiFetch('/cursos'); // GET público
                renderVitrine(cursos);
            }
            if(id === 'aluno-perfil') {
                const perfil = await apiFetch('/perfil');
                renderPerfil(perfil);
            }
            if(id === 'admin-cursos') {
                const cursos = await apiFetch('/cursos');
                renderTabelaAdminCursos(cursos);
            }
            if(id === 'admin-polos') {
                const polos = await apiFetch('/polos');
                renderTabelaAdminPolos(polos);
            }
        } catch (err) { console.error(err); }
    }

    // --- RENDERIZADORES ALUNO ---

    function renderVitrine(cursos) {
        const grid = document.getElementById('grid-cursos');
        grid.innerHTML = cursos.map(c => `
            <div class="card-curso">
                <h3>${c.nome}</h3>
                <p>${c.area} - ${c.carga_horaria}h (${c.modalidade})</p>
                <button onclick="fazerMatricula(${c.id})" class="btn-primary">Matricular-se</button>
            </div>
        `).join('');
    }

    window.fazerMatricula = async (id) => {
        if(!confirm("Confirmar matrícula?")) return;
        try {
            await apiFetch('/matricula', 'POST', { id_curso: id });
            alert("Matrícula realizada!");
            navigateTo('aluno-perfil');
        } catch(e) { alert(e.message); }
    };

    function renderPerfil(perfil) {
        const tbody = document.getElementById('tabela-minhas-matriculas');
        if(!perfil.cursos.length) {
            tbody.innerHTML = '<tr><td colspan="4">Nenhuma matrícula.</td></tr>';
            return;
        }
        tbody.innerHTML = perfil.cursos.map(c => `
            <tr>
                <td>${c.curso_nome}</td>
                <td>${c.modalidade}</td>
                <td>${c.status}</td>
                <td>${new Date(c.data).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // --- RENDERIZADORES ADMIN (COM EDIT/DELETE/ALUNOS) ---

    function renderTabelaAdminCursos(cursos) {
        const tbody = document.getElementById('tabela-gestao-cursos').querySelector('tbody');
        tbody.innerHTML = cursos.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.modalidade}</td>
                <td>
                    <button class="btn-secondary" onclick="verAlunosCurso(${c.id}, '${c.nome}')">Ver Alunos</button>
                    <button class="btn-danger-sm" onclick="deletarItem('cursos', ${c.id})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    function renderTabelaAdminPolos(polos) {
        const tbody = document.getElementById('tabela-gestao-polos').querySelector('tbody');
        tbody.innerHTML = polos.map(p => `
            <tr>
                <td>${p.nome}</td>
                <td>${p.endereco.cidade}</td>
                <td>
                    <button class="btn-danger-sm" onclick="deletarItem('polos', ${p.id})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    // --- AÇÕES DO ADMIN ---

    window.deletarItem = async (tipo, id) => {
        if(!confirm("Tem certeza? Isso pode afetar dados vinculados!")) return;
        try {
            await apiFetch(`/${tipo}/${id}`, 'DELETE');
            alert("Item deletado.");
            carregarDadosSecao(`admin-${tipo}`); // Recarrega a tabela
        } catch(e) { alert(e.message); }
    };

    window.verAlunosCurso = async (idCurso, nomeCurso) => {
        try {
            const alunos = await apiFetch(`/admin/curso/${idCurso}/alunos`);
            let msg = `Alunos em ${nomeCurso}:\n\n`;
            if(alunos.length === 0) msg += "Nenhum aluno matriculado.";
            
        
            alert(msg + alunos.map(a => `- ${a.nome_aluno} (${a.email})`).join('\n'));
            
            
        } catch(e) { alert(e.message); }
    };

    // Cadastro de Polo
    const formPolo = document.getElementById('form-novo-polo');
    if(formPolo) {
        formPolo.onsubmit = async (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            const f = e.target;
            
            const payload = {
                nome: f.nome.value,
                telefone: f.telefone.value,
                endereco: {
                    cep: f.cep.value, 
                    rua: f.rua.value, 
                    numero: parseInt(f.numero.value), // Convertendo para número
                    cidade: f.cidade.value, 
                    estado: f.estado.value
                }
            };

            console.log("Enviando Polo:", payload); // Para debug

            try { 
                await apiFetch('/polos', 'POST', payload); 
                alert("Polo salvo com sucesso!");
                
                // Limpa o form e fecha o modal SEM recarregar a página
                f.reset();
                document.getElementById('modal-novo-polo').classList.remove('active');
                
                // Atualiza apenas a tabela na tela
                carregarDadosSecao('admin-polos');
            }
            catch(err) { 
                console.error(err);
                alert("Erro ao salvar polo: " + err.message); 
            }
        };
    }

    // Cadastro de Curso
    const formCurso = document.getElementById('form-novo-curso');
    if(formCurso) {
        formCurso.onsubmit = async (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            const f = e.target;
            
            // Lógica para tratar o Polo ID (se estiver vazio, manda lista vazia)
            let polosIds = [];
            if (f.polo_id && f.polo_id.value.trim() !== "") {
                polosIds.push(parseInt(f.polo_id.value));
            }

            const payload = {
                nome: f.nome.value,
                carga_horaria: parseInt(f.carga_horaria.value), // Importante: Converter para Int
                modalidade: f.modalidade.value,
                area: f.area.value, // Deve bater com o Enum do Python
                polos_ids: polosIds
            };

            console.log("Enviando Curso:", payload); // OLHE NO CONSOLE SE DER ERRO

            try {
                await apiFetch('/cursos', 'POST', payload);
                alert("Curso salvo com sucesso!");
                
                f.reset();
                document.getElementById('modal-novo-curso').classList.remove('active');
                carregarDadosSecao('admin-cursos');
            } 
            catch(err) { 
                console.error(err);
                alert("Erro ao salvar curso: " + err.message); 
            }
        };
    }
    
    // Configurações iniciais
    document.getElementById('btn-ir-cadastro').onclick = () => {
        document.querySelector('.sign-in').classList.add('hidden');
        document.querySelector('.sign-up').classList.remove('hidden');
    };
    document.getElementById('btn-ir-login').onclick = () => {
        document.querySelector('.sign-up').classList.add('hidden');
        document.querySelector('.sign-in').classList.remove('hidden');
    };
});