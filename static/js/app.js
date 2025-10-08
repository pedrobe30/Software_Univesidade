// app.js — integração frontend ↔ backend
// Mantém o layout e estilos já existentes no seu HTML.
// Atenção: ajuste BASE_URL se seu backend não estiver em http://127.0.0.1:5000
document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = "http://127.0.0.1:5000";

    // SELETORES PRINCIPAIS (devem existir no seu index.html)
    const paginaAutenticacao = document.getElementById('pagina-autenticacao');
    const authWrapper = document.getElementById('auth-wrapper'); // overlay wrapper
    const paginaListagem = document.getElementById('pagina-listagem');

    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');

    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    const btnVoltarLogin = document.getElementById('btn-voltar-login');

    const corpoTabelaUsuarios = document.getElementById('corpo-tabela-usuarios');
    const listaVaziaMsg = document.getElementById('lista-vazia-mensagem');
    const inputBusca = document.getElementById('input-busca');

    const modalEdicao = document.getElementById('modal-edicao');
    const formEdicaoContainer = document.getElementById('form-edicao');

    // estado
    let usuarios = [];
    let usuarioParaExcluirId = null;
    let usuarioParaEditarId = null;

    // ===========================
    // utilitários / validação
    // ===========================
    function formatarInputNumerico(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    function mostrarErro(input, mensagem) {
        if (!input) return;
        const formGrupo = input.closest('.form-grupo') || input.parentElement;
        const errorDiv = formGrupo && formGrupo.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = mensagem;
            errorDiv.style.display = 'block';
        } else {
            // fallback: console
            console.warn('Error element not found for', input);
        }
        input.setAttribute('aria-invalid', 'true');
    }

    function limparErro(input) {
        if (!input) return;
        const formGrupo = input.closest('.form-grupo') || input.parentElement;
        const errorDiv = formGrupo && formGrupo.querySelector('.error-message');
        if (errorDiv) errorDiv.style.display = 'none';
        input.removeAttribute('aria-invalid');
    }

    function limparTodosErros(form) {
        if (!form) return;
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(limparErro);
        const general = form.querySelector('.general-error');
        if (general) {
            general.style.display = 'none';
            general.textContent = '';
        }
    }

    function validarFormulario(form) {
        let valido = true;
        if (!form) return false;
        limparTodosErros(form);
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            const val = (input.value || '').trim();
            if (!val) {
                const label = input.getAttribute('placeholder') || input.name || input.id;
                mostrarErro(input, `O campo ${label.replace('*','').trim()} é obrigatório.`);
                valido = false;
            } else if (input.type === 'email' && !/\S+@\S+\.\S+/.test(val)) {
                mostrarErro(input, 'Por favor, insira um email válido.');
                valido = false;
            }
        });

        // validação de senhas no cadastro
        if (form.id === 'form-cadastro') {
            const senha = form.querySelector('#senha');
            const confirmar = form.querySelector('#confirmar-senha');
            if (senha && confirmar && senha.value && confirmar.value && senha.value !== confirmar.value) {
                mostrarErro(confirmar, 'As senhas não coincidem.');
                valido = false;
            }
            if (senha && senha.value && senha.value.length < 6) {
                mostrarErro(senha, 'A senha deve ter pelo menos 6 caracteres.');
                valido = false;
            }
        }

        return valido;
    }

    // ===========================
    // navegação (mostrar/ocultar telas)
    // ===========================
    function navegarPara(pagina) {
        if (pagina === 'autenticacao') {
            paginaAutenticacao.classList.remove('hidden');
            paginaListagem.classList.add('hidden');
        } else { // 'listagem'
            paginaAutenticacao.classList.add('hidden');
            paginaListagem.classList.remove('hidden');
            // atualiza lista toda vez que mostra a listagem
            fetchErenderizarUsuarios();
        }
    }

    function mostrarFormCadastro(show = true) {
        if (!authWrapper) return;
        if (show) authWrapper.classList.add('right-panel-active');
        else authWrapper.classList.remove('right-panel-active');
    }

    function controlarModal(selector, abrir = true) {
        const modal = document.querySelector(selector);
        if (!modal) return;
        if (abrir) modal.classList.add('ativo'); else modal.classList.remove('ativo');
    }

    // ===========================
    // chamadas API (com envio de cookies)
    // todas as requisições que dependem de sessão usam credentials: 'include'
    // ===========================
    async function loginBackend(email, senha) {
        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
                credentials: 'include' // garante recebimento / armazenamento do cookie de sessão
            });

            if (!res.ok) {
                const clone = res.clone();
                try {
                    const errJson = await clone.json();
                    throw new Error(errJson.error || JSON.stringify(errJson));
                } catch (_) {
                    const txt = await res.text();
                    throw new Error(txt || `Erro ${res.status}`);
                }
            }
            return await res.json();
        } catch (err) {
            console.error('loginBackend:', err);
            throw err;
        }
    }

    async function criarUsuarioBackend(payload) {
        try {
            const res = await fetch(`${BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include' // inclui cookie caso backend dependa dele
            });

            if (!res.ok) {
                const clone = res.clone();
                try {
                    const errJson = await clone.json();
                    throw new Error(errJson.error || JSON.stringify(errJson));
                } catch (_) {
                    const txt = await res.text();
                    throw new Error(txt || `Erro ${res.status}`);
                }
            }
            return await res.json();
        } catch (err) {
            console.error('criarUsuarioBackend:', err);
            throw err;
        }
    }

    async function fetchErenderizarUsuarios() {
        try {
            const res = await fetch(`${BASE_URL}/cadastrados`, {
                method: 'GET',
                credentials: 'include' // envia cookie para ver se está logado
            });
            if (!res.ok) {
                throw new Error('Falha ao carregar usuários (status ' + res.status + ')');
            }
            const data = await res.json();
            usuarios = Array.isArray(data) ? data : [];
            renderizarListaUsuarios();
        } catch (err) {
            console.error('fetchErenderizarUsuarios:', err);
            // mostra mensagem amigável na UI
            listaVaziaMsg.classList.remove('hidden');
            listaVaziaMsg.querySelector('h3').textContent = 'Erro ao carregar usuários';
            listaVaziaMsg.querySelector('p').textContent = 'Verifique se está autenticado e tente novamente.';
            corpoTabelaUsuarios.parentElement.classList.add('hidden');
        }
    }

    // DELETE -> chama sua rota DELETE /deletar/<id>
    async function deletarUsuarioBackend(userId) {
        try {
            const res = await fetch(`${BASE_URL}/deletar/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // essencial para enviar cookie de sessão
            });

            let data = null;
            try { data = await res.json(); } catch(_) { data = null; }

            if (!res.ok) {
                const msg = data && (data.error || data.mensagem) ? (data.error || data.mensagem) : `Erro ${res.status}`;
                throw new Error(msg);
            }

            // sucesso: backend pode ter invalidado a sessão por design
            const mensagem = data && (data.mensagem || data.msg) ? (data.mensagem || data.msg) : 'Usuário deletado com sucesso.';
            alert(mensagem);

            // dependendo de como backend está implementado, pode limpar sessão — forçamos retorno à tela de login
            navegarPara('autenticacao');
        } catch (err) {
            console.error('deletarUsuarioBackend:', err);
            alert('Falha ao deletar usuário: ' + (err.message || err));
        }
    }

    // ===========================
    // ações ligadas a formulários
    // ===========================
    async function handleLogin(e) {
        e.preventDefault();
        if (!validarFormulario(formLogin)) return;

        limparTodosErros(formLogin);
        const email = (formLogin.querySelector('#login-email') || {}).value || '';
        const senha = (formLogin.querySelector('#login-senha') || {}).value || '';

        try {
            await loginBackend(email, senha);
            // sucesso
            alert('Login efetuado com sucesso!');
            // solicita a lista (enviando cookie)
            await fetchErenderizarUsuarios();
            navegarPara('listagem');
        } catch (err) {
            console.error('handleLogin error:', err);
            const gen = formLogin.querySelector('.general-error');
            if (gen) {
                gen.textContent = err.message || 'Erro no login';
                gen.style.display = 'block';
            } else {
                alert('Erro no login: ' + (err.message || err));
            }
        }
    }

    async function handleCadastro(e) {
        e.preventDefault();
        if (!validarFormulario(formCadastro)) return;

        limparTodosErros(formCadastro);

        const fd = new FormData(formCadastro);
        const payload = {
            nome: fd.get('nome'),
            sobrenome: fd.get('sobrenome'),
            email: fd.get('email'),
            senha: fd.get('senha'),
            endereco: {
                rua: fd.get('rua'),
                numero: fd.get('numero'),
                cep: fd.get('cep')
            }
        };

        try {
            const novo = await criarUsuarioBackend(payload);
            alert(`Usuário ${novo.nome || novo.email || ''} cadastrado com sucesso!`);
            formCadastro.reset();
            // tentar exibir lista após criar:
            await fetchErenderizarUsuarios();
            navegarPara('listagem');
        } catch (err) {
            console.error('handleCadastro error:', err);
            // provável email duplicado: mostra no campo email
            const emailInput = formCadastro.querySelector('#email');
            mostrarErro(emailInput, err.message || 'Erro ao cadastrar');
        }
    }

    // ===========================
    // renderização da tabela
    // ===========================
    function renderizarListaUsuarios() {
        corpoTabelaUsuarios.innerHTML = '';
        const termo = (inputBusca.value || '').toLowerCase();

        const filtrados = usuarios.filter(u =>
            (u.nome || '').toLowerCase().includes(termo) ||
            (u.email || '').toLowerCase().includes(termo)
        );

        listaVaziaMsg.classList.toggle('hidden', filtrados.length > 0);
        corpoTabelaUsuarios.parentElement.classList.toggle('hidden', filtrados.length === 0);

        filtrados.forEach(usuario => {
            const tr = document.createElement('tr');
            const rua = usuario.endereco && usuario.endereco.rua ? usuario.endereco.rua : '';
            const numero = usuario.endereco && usuario.endereco.numero ? usuario.endereco.numero : '';
            tr.innerHTML = `
                <td>${usuario.nome || ''} ${usuario.sobrenome || ''}</td>
                <td>${usuario.email || ''}</td>
                <td>${rua}${numero ? ', ' + numero : ''}</td>
                <td class="acoes-usuario">
                    <button class="btn btn-perigo btn-excluir" data-id="${usuario.id}" title="Excluir">
                        <svg width="16" height="16"><use xlink:href="#trash" /></svg>
                    </button>
                </td>
            `;
            corpoTabelaUsuarios.appendChild(tr);
        });
    }

    // ===========================
    // listeners / eventos
    // ===========================
    signUpButton?.addEventListener('click', () => {
        authWrapper.classList.add('right-panel-active');
        limparTodosErros(formLogin);
    });
    signInButton?.addEventListener('click', () => {
        authWrapper.classList.remove('right-panel-active');
        limparTodosErros(formCadastro);
    });

    btnVoltarLogin?.addEventListener('click', () => {
        navegarPara('autenticacao');
        authWrapper.classList.remove('right-panel-active');
    });

    formLogin?.addEventListener('submit', handleLogin);
    formCadastro?.querySelector('#numero')?.addEventListener('input', formatarInputNumerico);
    formCadastro?.querySelector('#cep')?.addEventListener('input', formatarInputNumerico);
    formCadastro?.addEventListener('submit', handleCadastro);
    inputBusca?.addEventListener('input', renderizarListaUsuarios);

    // clique em botões da tabela (delegation) — captura a lixeira e chama delete
    corpoTabelaUsuarios?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('btn-excluir')) {
            const ok = confirm('Confirma a exclusão deste usuário?');
            if (!ok) return;
            await deletarUsuarioBackend(id);
        } else if (btn.classList.contains('btn-editar')) {
            // edição não implementada no backend, mantemos o modal (se houver)
            abrirModalEdicao && abrirModalEdicao(id);
        }
    });

    // ===========================
    // inicialização
    // ===========================
    // inicia na tela de autenticação; tenta carregar lista (será bloqueado se não logado)
    navegarPara('autenticacao');
});
