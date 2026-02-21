# 🎓 Faculdade New - Portal Acadêmico

![Status](https://img.shields.io/badge/Status-Concluído-success?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-API_REST-black?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Selenium](https://img.shields.io/badge/Selenium-E2E_Testing-43B02A?style=for-the-badge&logo=selenium&logoColor=white)

## 📌 Sobre o Projeto
O **Faculdade New** é um sistema web Full-Stack desenvolvido para simular o ambiente de gestão acadêmica de uma instituição de ensino. O projeto contempla tanto a jornada do aluno (cadastro, vitrine de cursos, matrícula e gestão de perfil) quanto um painel administrativo (gestão de cursos, polos e visualização de alunos matriculados).

O grande diferencial deste projeto não é apenas a sua construção, mas a **cultura de Qualidade de Software (QA) e DevOps** aplicada em toda a sua fundação. O sistema conta com cobertura de testes unitários e testes de interface de ponta a ponta (E2E), integrados a uma pipeline de CI/CD.

🔗 **[Acesse o Frontend (Live Demo) aqui](https://pedrobe30.github.io/Software_Univesidade/)**
*(O backend está hospedado no Render (Free Tier), a primeira requisição pode levar ~30s para o Cold Start).*

---

## 🚀 Funcionalidades

### 👤 Painel do Aluno
- **Autenticação Segura:** Cadastro e Login com senhas hasheadas (Bcrypt) e controle de sessão via Cookies Seguros (`SameSite=None`, `Secure=True`).
- **Vitrine de Cursos:** Listagem dinâmica de cursos disponíveis por área e modalidade.
- **Sistema de Matrícula:** Fluxo intuitivo para se matricular em novos cursos.
- **Gestão de Perfil:** Tabela interativa com o histórico de matrículas e botão de exclusão de conta (LGPD/TearDown).

### 🛡️ Painel do Administrador (Gestão Acadêmica)
- **Cursos:** Adicionar e excluir cursos da grade curricular.
- **Polos:** Cadastro e gestão de polos físicos para cursos presenciais.
- **Alunos:** Visualização em tempo real de alunos matriculados por curso.

---

## 🛠️ Tecnologias e Arquitetura

### Frontend (Single Page Application)
- **HTML5 & CSS3:** Layout responsivo, moderno e construído 100% do zero (sem frameworks CSS), utilizando CSS Grid e Flexbox.
- **JavaScript (Vanilla):** Lógica assíncrona (`fetch` API), manipulação da DOM e consumo de API REST de forma nativa.

### Backend (API RESTful)
- **Python / Flask:** Roteamento e lógica de negócios.
- **SQLAlchemy:** ORM para modelagem de banco de dados, configurado com `pool_pre_ping` para resiliência contra quedas de conexão em bancos serverless.
- **PostgreSQL (Neon):** Banco de dados relacional em nuvem.

### QA & CI/CD
- **Pytest:** Testes unitários utilizando um banco de dados in-memory (SQLite) gerado via *Fixtures* para não sujar o ambiente de produção.
- **Selenium WebDriver:** Testes E2E simulando a jornada real do usuário no navegador (Cadastro -> Login -> Matrícula -> Exclusão de Conta), com uso de Explicit Waits inteligentes.
- **GitHub Actions:** Pipeline configurada para rodar todos os testes unitários a cada novo *push*.
- **Render & GitHub Pages:** Deploy automatizado contínuo.

---

## 🧠 Em geral
Este projeto foi construído sob uma forte perspectiva de **Engenharia de Software e Qualidade**:

1. **Testabilidade:** O código foi projetado para ser testável. A injeção de dependência do `db_session` permite que os testes simulem o banco de dados localmente sem tocar na nuvem.
2. **Prevenção de Falsos Positivos:** Os scripts E2E (Selenium) foram desenvolvidos com validação de texto de `alerts` e componentes visuais para garantir que o teste só passe se a ação real ocorrer no backend.
3. **Segurança Avançada:** Configurações explícitas de CORS para separar o Frontend estático do Backend, proteção rigorosa de variáveis de ambiente (`.env`), e gerenciamento de Cookies de Terceiros.
4. **TearDown:** O script final de automação de testes garante a limpeza do banco de dados (exclusão da conta recém-criada), mantendo a saúde da base de dados.

---

