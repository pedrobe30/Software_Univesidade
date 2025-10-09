document.addEventListener('DOMContentLoaded', () => {
    // =================================
    // CONFIGURAÇÃO DA API
    // =================================
    const API_BASE_URL = 'http://127.0.0.1:5000';

    // =================================
    // SELETORES E ESTADO DA APLICAÇÃO
    // =================================
    const paginaAutenticacao = document.getElementById('pagina-autenticacao');
    const authWrapper = document.getElementById('auth-wrapper');
    const paginaListagem = document.getElementById('pagina-listagem');

    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    const corpoTabelaUsuarios = document.getElementById('corpo-tabela-usuarios');
    const listaVaziaMsg = document.getElementById('lista-vazia-mensagem');
    const inputBusca = document.getElementById('input-busca');

    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    
    let usuarios = [];
    let currentUser = null;
    let usuarioParaExcluirId = null;

    // =================================
    // FUNÇÕES DE UTILIDADE E FORMATAÇÃO
    // =================================
    function formatarInputNumerico(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    // =================================
    // FUNÇÕES DE VALIDAÇÃO
    // =================================
    function mostrarErro(input, mensagem) {
        const formGrupo = input.closest('.form-grupo');
        const errorDiv = formGrupo.querySelector('.error-message');
        errorDiv.textContent = mensagem;
        errorDiv.style.display = 'block';
        input.setAttribute('aria-invalid', 'true');
    }

    function limparErro(input) {
        const formGrupo = input.closest('.form-grupo');
        const errorDiv = formGrupo.querySelector('.error-message');
        errorDiv.style.display = 'none';
        input.removeAttribute('aria-invalid');
    }

     function limparTodosErros(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(limparErro);
        const generalError = form.querySelector('.general-error');
        if (generalError) generalError.style.display = 'none';
    }
    
    function validarFormulario(form) {
        let ehValido = true;
        const inputs = form.querySelectorAll('input[required]');
        
        limparTodosErros(form);

        inputs.forEach(input => {
            if (!input.value.trim()) {
                mostrarErro(input, `O campo ${input.placeholder.replace(' *', '')} é obrigatório.`);
                ehValido = false;
            } else if (input.type === 'email' && !/\S+@\S+\.\S+/.test(input.value)) {
                mostrarErro(input, 'Por favor, insira um email válido.');
                ehValido = false;
            }
        });
        
        if (form.id === 'form-cadastro') {
            const senha = form.querySelector('#senha');
            const confirmarSenha = form.querySelector('#confirmar-senha');
            if (senha.value && confirmarSenha.value && senha.value !== confirmarSenha.value) {
                mostrarErro(confirmarSenha, 'As senhas não coincidem.');
                ehValido = false;
            }
        }
        
        return ehValido;
    }

    // =================================
    // FUNÇÕES DE NAVEGAÇÃO, MODAIS E SLIDE
    // =================================
    function navegarPara(pagina) {
        if (pagina === 'autenticacao') {
            paginaAutenticacao.classList.remove('hidden');
            paginaListagem.classList.add('hidden');
            currentUser = null;
        } else { // 'listagem'
            paginaAutenticacao.classList.add('hidden');
            paginaListagem.classList.remove('hidden');
            fetchErenderizarUsuarios();
        }
    }
    
    function controlarModal(modalSeletor, abrir = true) {
        const modal = document.querySelector(modalSeletor);
        if (abrir) {
            modal.classList.add('ativo');
        } else {
            modal.classList.remove('ativo');
        }
    }

    // =================================
    // FUNÇÕES DE API
    // =================================
    async function realizarLogin(e) {
        e.preventDefault();
        if (!validarFormulario(formLogin)) return;

        const formData = new FormData(formLogin);
        const email = formData.get('email');
        const senha = formData.get('senha');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
                credentials: 'include' // IMPORTANTE: Envia os cookies da sessão
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }
            
            currentUser = data;
            navegarPara('listagem');

        } catch (error) {
            const generalError = formLogin.querySelector('.general-error');
            generalError.textContent = error.message;
            generalError.style.display = 'block';
        }
    }

    async function cadastrarUsuario(e) {
        e.preventDefault();
        if (!validarFormulario(formCadastro)) return;
        
        const formData = new FormData(formCadastro);
        
        const novoUsuario = {
            nome: formData.get('nome'),
            sobrenome: formData.get('sobrenome'),
            email: formData.get('email'),
            senha: formData.get('senha'),
            endereco: {
                rua: formData.get('rua'),
                numero: formData.get('numero'),
                cep: formData.get('cep')
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario),
                credentials: 'include' // IMPORTANTE: Envia os cookies da sessão
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao cadastrar usuário');
            }

            formCadastro.reset();
            alert('Cadastro realizado com sucesso! Por favor, faça o login.');
            signInButton.click(); // Muda para a tela de login

        } catch (error) {
            const emailInput = formCadastro.querySelector('#email');
            mostrarErro(emailInput, error.message);
        }
    }
    
    async function fetchErenderizarUsuarios() {
        try {
            const response = await fetch(`${API_BASE_URL}/cadastrados`, {
                credentials: 'include' // IMPORTANTE: Envia os cookies da sessão
            });
            if (!response.ok) {
                throw new Error('Não foi possível carregar os usuários.');
            }
            usuarios = await response.json();
            renderizarListaUsuarios();
        } catch (error) {
            console.error(error);
            listaVaziaMsg.querySelector('h3').textContent = 'Erro ao carregar usuários';
            listaVaziaMsg.querySelector('p').textContent = 'Tente novamente mais tarde.';
            listaVaziaMsg.classList.remove('hidden');
            corpoTabelaUsuarios.parentElement.classList.add('hidden');
        }
    }
    
    async function excluirUsuario() {
        if (!usuarioParaExcluirId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/deletar/${usuarioParaExcluirId}`, {
                method: 'DELETE',
                credentials: 'include' // IMPORTANTE: Envia os cookies da sessão
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erro ao excluir conta.");
            }
            
            alert(data.mensagem || "Usuário deletado com sucesso.");
            controlarModal('#modal-confirmacao', false);
            navegarPara('autenticacao'); // Desloga o usuário

        } catch(error) {
            alert(error.message);
            controlarModal('#modal-confirmacao', false);
        }
    }


    // =================================
    // FUNÇÕES DE RENDERIZAÇÃO
    // =================================
    function renderizarListaUsuarios() {
        corpoTabelaUsuarios.innerHTML = '';
        const termoBusca = inputBusca.value.toLowerCase();
        
        const usuariosFiltrados = usuarios.filter(u => 
            (u.nome && u.nome.toLowerCase().includes(termoBusca)) || 
            (u.email && u.email.toLowerCase().includes(termoBusca))
        );

        listaVaziaMsg.classList.toggle('hidden', usuariosFiltrados.length > 0);
        corpoTabelaUsuarios.parentElement.classList.toggle('hidden', usuariosFiltrados.length === 0);

        usuariosFiltrados.forEach(usuario => {
            const tr = document.createElement('tr');
            const isCurrentUser = currentUser && currentUser.id === usuario.id;
            
            const endereco = usuario.endereco && usuario.endereco.rua ? `${usuario.endereco.rua}, ${usuario.endereco.numero}` : 'Não informado';

            tr.innerHTML = `
                <td>${usuario.nome} ${usuario.sobrenome}</td>
                <td>${usuario.email}</td>
                <td>${endereco}</td>
                <td class="acoes-usuario">
                    ${isCurrentUser ? `<button class="btn btn-excluir" data-id="${usuario.id}">Excluir</button>` : ''}
                </td>
            `;
            corpoTabelaUsuarios.appendChild(tr);
        });
    }
    
    // =================================
    // EVENT LISTENERS
    // =================================
    signUpButton.addEventListener('click', () => {
        authWrapper.classList.add('right-panel-active');
        limparTodosErros(formLogin);
    });

    signInButton.addEventListener('click', () => {
        authWrapper.classList.remove('right-panel-active');
        limparTodosErros(formCadastro);
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        navegarPara('autenticacao');
        if(authWrapper.classList.contains('right-panel-active')) {
            authWrapper.classList.remove('right-panel-active');
        }
    });
    
    formCadastro.querySelector('#numero').addEventListener('input', formatarInputNumerico);
    formCadastro.querySelector('#cep').addEventListener('input', formatarInputNumerico);
    
    formLogin.addEventListener('submit', realizarLogin);
    formCadastro.addEventListener('submit', cadastrarUsuario);
    inputBusca.addEventListener('input', renderizarListaUsuarios);
    
    corpoTabelaUsuarios.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target || !target.classList.contains('btn-excluir')) return;

        usuarioParaExcluirId = target.dataset.id;
        controlarModal('#modal-confirmacao', true);
    });
    
    btnConfirmarExclusao.addEventListener('click', excluirUsuario);

    document.querySelectorAll('.btn-fechar-modal, #btn-cancelar-exclusao').forEach(el => {
        el.addEventListener('click', () => controlarModal('#modal-confirmacao', false));
    });
    
    // =================================
    // INICIALIZAÇÃO
    // =================================
    navegarPara('autenticacao');
});

