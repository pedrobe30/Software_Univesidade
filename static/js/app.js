/* Neo Academia — app.js
   Compatível com:
     GET  /api/users
     POST /api/create
     PUT  /api/update
     DELETE /api/delete
   Funcionalidades UX adicionadas:
     - skeleton loading
     - toast notifications
     - drag & drop file zone
     - melhor seleção / preview / modal
     - validação simples
*/

document.addEventListener('DOMContentLoaded', () => {
  // elements
  const usersList = document.getElementById('usersList');
  const countUsers = document.getElementById('countUsers');
  const countNotas = document.getElementById('countNotas');
  const searchInput = document.getElementById('search');

  const form = document.getElementById('userForm');
  const usuarioInput = document.getElementById('usuario');
  const notaInput = document.getElementById('nota');
  const conteudoInput = document.getElementById('conteudo');
  const documentInput = document.getElementById('document');
  const dropzone = document.getElementById('dropzone');
  const fileName = document.getElementById('fileName');
  const clearFile = document.getElementById('clearFile');
  const formMsg = document.getElementById('formMsg');
  const btnUpdate = document.getElementById('btnUpdate');
  const btnDelete = document.getElementById('btnDelete');

  const toastWrap = document.getElementById('toast');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');
  const modalClose = document.getElementById('modalClose');

  let state = { users: [], selected: null };

  // small helpers
  function toast(msg, time = 3500) {
    const el = document.createElement('div');
    el.className = 't';
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(() => el.style.opacity = '0.0', time - 300);
    setTimeout(() => el.remove(), time);
  }

  function setFormMsg(text, tone) {
    formMsg.textContent = text || '';
    if (tone === 'error') formMsg.style.color = '#ff9b9b';
    else if (tone === 'success') formMsg.style.color = '#baf3d6';
    else formMsg.style.color = '';
  }

  function showSkeletons(n = 3) {
    usersList.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton';
      s.style.height = '86px';
      usersList.appendChild(s);
    }
  }

  // fetch users
  async function fetchUsers() {
    showSkeletons(4);
    try {
      const res = await fetch('/api/users');
      const j = await res.json();
      if (j.success) {
        state.users = Array.isArray(j.data) ? j.data : j.data || [];
        renderUsers();
      } else {
        usersList.innerHTML = `<div class="card muted">Erro: ${j.error}</div>`;
        toast('Erro ao buscar usuários', 2500);
      }
    } catch (e) {
      usersList.innerHTML = `<div class="card muted">Erro de conexão</div>`;
      toast('Erro de conexão', 2500);
      console.error(e);
    }
  }

  // render list
  function renderUsers() {
    usersList.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase().trim();
    const filtered = state.users.filter(u => {
      if (!q) return true;
      if ((u.usuario || '').toLowerCase().includes(q)) return true;
      if (u.notas && u.notas.some(n => (n.titulo || '').toLowerCase().includes(q) || (n.conteudo || '').toLowerCase().includes(q))) return true;
      return false;
    });

    countUsers.textContent = filtered.length;
    let nTotal = 0;
    filtered.forEach(u => nTotal += (u.notas || []).length);
    countNotas.textContent = nTotal;

    if (filtered.length === 0) {
      usersList.innerHTML = `<div class="card muted">Nenhum usuário encontrado</div>`;
      return;
    }

    filtered.forEach(u => {
      const card = document.createElement('div');
      card.className = 'user-card';

      const left = document.createElement('div'); left.className = 'u-left';
      const avatar = document.createElement('div'); avatar.className = 'avatar';
      avatar.textContent = (u.usuario || 'U').split(' ').map(t => t[0]).slice(0,2).join('').toUpperCase();
      const meta = document.createElement('div'); meta.className = 'u-meta';
      const name = document.createElement('div'); name.className = 'name'; name.textContent = u.usuario || '—';
      const sub = document.createElement('div'); sub.className = 'meta';
      const latest = (u.notas && u.notas.length) ? u.notas[u.notas.length - 1] : null;
      sub.textContent = latest ? `${latest.titulo} · ${u.notas.length} nota(s)` : `Sem notas · ${u.notas.length || 0}`;
      meta.appendChild(name); meta.appendChild(sub);
      left.appendChild(avatar); left.appendChild(meta);

      const actions = document.createElement('div'); actions.className = 'u-actions';
      const btnView = document.createElement('button'); btnView.className = 'btn ghost tiny'; btnView.textContent = 'Ver';
      btnView.onclick = () => openNoteModal(u);
      const btnSelect = document.createElement('button'); btnSelect.className = 'btn primary tiny'; btnSelect.textContent = 'Selecionar';
      btnSelect.onclick = () => {
        state.selected = u;
        usuarioInput.value = u.usuario || '';
        notaInput.value = latest ? (latest.titulo || '') : '';
        conteudoInput.value = latest ? (latest.conteudo || '') : '';
        fileName.textContent = extractDocument(latest ? latest.conteudo : '') || 'Nenhum arquivo';
        setFormMsg(`Selecionado: ${u.usuario}`, 'success');
        location.hash = '#form';
      };
      const btnDelete = document.createElement('button'); btnDelete.className = 'btn danger tiny'; btnDelete.textContent = 'Excluir';
      btnDelete.onclick = () => {
        if (confirm(`Excluir usuário "${u.usuario}" e todas as notas?`)) handleDelete(u);
      };

      actions.appendChild(btnView); actions.appendChild(btnSelect); actions.appendChild(btnDelete);

      card.appendChild(left); card.appendChild(actions);
      usersList.appendChild(card);
    });
  }

  // parse document pattern if stored in content as "Documento: filename"
  function extractDocument(text){
    if (!text) return null;
    const m = text.match(/Documento:\s*([^\s]+)/i);
    return m ? m[1] : null;
  }

  // modal
  function openNoteModal(user) {
    const latest = (user.notas && user.notas.length) ? user.notas[user.notas.length - 1] : null;
    modalTitle.textContent = user.usuario + (latest ? ` — ${latest.titulo}` : '');
    modalBody.innerHTML = '';
    if (!latest) {
      modalBody.innerHTML = `<div class="muted">Nenhuma nota.</div>`;
      modalFooter.innerHTML = `<div class="muted">Criado em: ${user.criado_em || '—'}</div>`;
    } else {
      const p = document.createElement('pre'); p.style.whiteSpace='pre-wrap'; p.textContent = latest.conteudo || '';
      modalBody.appendChild(p);
      const doc = extractDocument(latest.conteudo);
      modalFooter.innerHTML = '';
      if (doc) {
        const a = document.createElement('a'); a.href = `/uploads/${doc}`; a.target='_blank'; a.className='btn ghost'; a.textContent='Abrir documento';
        modalFooter.appendChild(a);
      } else {
        modalFooter.innerHTML = `<div class="muted small">Sem documento</div>`;
      }
    }
    modal.setAttribute('aria-hidden','false');
  }
  modalClose && modalClose.addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.setAttribute('aria-hidden','true'); });

  // create
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setFormMsg('Enviando...');
    const usuario = usuarioInput.value.trim();
    const titulo = notaInput.value.trim();
    const conteudo = conteudoInput.value.trim();

    if (!usuario) { setFormMsg('Nome é obrigatório', 'error'); return; }

    try {
      let res;
      if (documentInput.files && documentInput.files.length > 0) {
        const fd = new FormData();
        fd.append('usuario', usuario);
        fd.append('nota', titulo);
        fd.append('conteudo', conteudo);
        fd.append('document', documentInput.files[0]);
        res = await fetch('/api/create', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/create', {
          method:'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, nota: titulo, conteudo })
        });
      }
      const j = await res.json();
      if (j.success) {
        setFormMsg('Salvo com sucesso', 'success');
        toast('Salvo ✔');
        form.reset(); fileName.textContent = 'Nenhum arquivo'; state.selected = null;
        await fetchUsers();
      } else {
        setFormMsg(`Erro: ${j.error}`, 'error'); toast('Erro ao salvar', 2500);
      }
    } catch (e) {
      setFormMsg('Erro de conexão', 'error'); toast('Erro de conexão', 2200);
      console.error(e);
    }
  });

  // update: atualiza nota mais recente do usuário
  btnUpdate.addEventListener('click', async () => {
    const usuario = usuarioInput.value.trim();
    if (!usuario) return alert('Preencha o nome do usuário para atualizar.');
    const titulo = notaInput.value.trim();
    const conteudo = conteudoInput.value.trim();
    try {
      const res = await fetch('/api/update', {
        method:'PUT',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ usuario, nota: titulo, conteudo })
      });
      const j = await res.json();
      if (j.success) { toast('Atualizado'); setFormMsg('Atualizado', 'success'); await fetchUsers(); }
      else { setFormMsg(`Erro: ${j.error}`, 'error'); toast('Erro ao atualizar'); }
    } catch (e) { setFormMsg('Erro', 'error'); toast('Erro de conexão'); }
  });

  // delete
  async function handleDelete(user) {
    try {
      const payload = { usuario: user.usuario || null, id: user.id || null };
      const res = await fetch('/api/delete', {
        method:'DELETE',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (j.success) { toast('Deletado'); setFormMsg('Usuário deletado', 'success'); await fetchUsers(); }
      else { setFormMsg(`Erro: ${j.error}`, 'error'); toast('Erro ao deletar'); }
    } catch (e) { setFormMsg('Erro ao deletar', 'error'); toast('Erro de conexão'); console.error(e); }
  }

  btnDelete.addEventListener('click', async () => {
    const usuario = usuarioInput.value.trim();
    if (!usuario) return alert('Preencha o nome do usuário para excluir.');
    if (!confirm(`Confirmar exclusão de: ${usuario}?`)) return;
    const user = state.users.find(u => (u.usuario||'') === usuario);
    if (user) await handleDelete(user); else await handleDelete({ usuario });
  });

  // dropzone and file handling
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('drag');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      documentInput.files = e.dataTransfer.files;
      fileName.textContent = documentInput.files[0].name;
    }
  });
  documentInput.addEventListener('change', () => {
    fileName.textContent = (documentInput.files && documentInput.files[0]) ? documentInput.files[0].name : 'Nenhum arquivo';
  });
  clearFile.addEventListener('click', () => { documentInput.value = ''; fileName.textContent = 'Nenhum arquivo'; });

  // search input
  searchInput.addEventListener('input', () => renderUsers());

  // initial load
  fetchUsers();
});
