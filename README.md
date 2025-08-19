# NexusAPI ⚡
Uma API construída com **NestJS**, **JWT**, **TypeORM (PostgreSQL)** e **Docker**, focada em fornecer uma base sólida para **autenticação**, **gerenciamento de usuários** e **troca de mensagens**.

![CI Status](https://github.com/GustavoMartin2002/NexusAPI/actions/workflows/ci.yml/badge.svg)

### Informações do Projeto 📌
- **Nome:** `nexus-api`
- **Versão:** `0.0.1`
- **Autor:** Gustavo Martin
- **Licença:** MIT

### Tecnologias Utilizadas 🛠️
- [TypeScript](https://www.typescriptlang.org/) - Linguagem tipada para JavaScript, facilita manutenção e escalabilidade.
- [NestJS](https://nestjs.com/) - Framework Node.js para construção de APIs robustas e escaláveis.
- [JWT](https://jwt.io/) - Padrão para autenticação baseada em tokens.
- [TypeORM](https://typeorm.io/) - ORM para trabalhar com bancos de dados relacionais no TypeScript.
- [Swagger](https://swagger.io/) - Ferramenta para documentação e teste de APIs REST.
- [Bcrypt](https://www.npmjs.com/package/bcrypt) - Biblioteca para hash seguro de senhas.
- [Helmet](https://helmetjs.github.io/) - Middleware para aumentar a segurança das aplicações Express/NestJS.
- [Docker](https://www.docker.com/) - Containerização para facilitar deploy e isolamento de ambiente.
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional de código aberto, conhecido por sua robustez e confiabilidade.

### Estrutura de Endpoints 📂
#### 🔑 Auth
- `POST /auth/login` – Realiza login e retorna token JWT (`accessToken`, `refreshToken`)
- `POST /auth/refresh` – Gera um novo token de acesso (`accessToken`, `refreshToken`)

#### 👥 Person
- `GET /person` – Lista todas as pessoas
- `GET /person/?limit=10&offset=0` – Lista pessoas com paginação
- `GET /person/:id` – Busca uma pessoa pelo ID
- `POST /person` – Cria uma nova pessoa
- `POST /person/upload-picture` – Faz upload da foto da pessoa
- `PATCH /person/:id` – Atualiza dados da pessoa
- `DELETE /person/:id` – Remove uma pessoa

#### 💬 Messages
- `GET /messages` – Lista todas as mensagens
- `GET /messages/?limit=10&offset=0` – Lista mensagens com paginação
- `GET /messages/:id` – Busca mensagem pelo ID
- `POST /messages` – Cria uma nova mensagem
- `PATCH /messages/:id` – Atualiza uma mensagem
- `DELETE /messages/:id` – Remove uma mensagem

----
### Fluxo da Aplicação 🔄

#### ⚠️ Funcionalidades sem login
*Mesmo sem autenticação, a aplicação permite algumas ações restritas:*

**PERSON**
- `Create:` Cadastrar uma nova pessoa.
- **Regras de validação:**
  - E-mail Deve ser válido.
  - Senha não pode estar vazia e deve ter no mínimo 5 caracteres.
  - Nome não pode estar vazio, deve ter entre 3 e 100 caracteres.

**AUTH**
- `Login:` Realizar login apenas com pessoas cadastradas (email e senha).
- **Regras de validação:**
  - E-mail deve ser válido.
  - Senha não pode estar vazia. 
- **Resposta:** Ao logar, o usuário recebe um `accessToken` e `refreshToken`.

#### ✅ Funcionalidades após login
*Após autenticação, o usuário passa a ter acesso às rotas protegidas:*

**PERSON**
- `GetALL:` Listar todas as pessoas.
- `GetByID:` Buscar pessoa pelo ID.
- `Update:` Alterar apenas os próprios dados.
- `Delete:` Remover apenas o próprio registro.
- `UploadPicture:` Enviar foto apenas para o próprio perfil.

**MESSAGES**
- `GetALL:` Listar todas as mensagens.
- `GetByID:` Buscar mensagem pelo ID.
- `Create:` Criar mensagem apenas se a pessoa destinatária existir.
- `Update:` Alterar apenas mensagens próprias.
- `Delete:` Remover apenas mensagens próprias.

**AUTH**
- `RefreshToken:` Gerar novos tokens de acesso quando necessário.
----

### Como Rodar o Projeto ⚙️
#### ✅ Opção 1 – Localmente
Pré-requisitos:
- [Node.js](https://nodejs.org/) >= 20
- [PostgreSQL](https://www.postgresql.org/)

```bash
# Clone o repositório
git clone https://github.com/GustavoMartin2002/NexusAPI.git

# Acesse a pasta
cd NexusAPI/nexus-api

# Instale as dependências
npm install
```

📄 Crie um arquivo `.env` na pasta `nexus-api` com as variáveis (ajuste conforme seu banco local).
```bash
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_DATABASE=postgres
DATABASE_AUTO_LOAD_ENTITIES=1
DATABASE_SYNCHRONIZE=0

JWT_SECRET=supersecret
JWT_TOKEN_AUDIENCE=http://localhost:3000
JWT_TOKEN_ISSUER=http://localhost:3000
JWT_TTL=3600
JWT_REFRESH_TTL=86400

NODE_ENV=development
PORT=3000
ORIGIN=http://localhost:3000
```
Obs: `DATABASE_SYNCHRONIZE=0` você pode alterar este campo para 1 (somente em ambiente de testes).

🚀 Inicie o servidor:
```bash
npm run start:dev
```

#### ✅ Opção 2 – Com Docker
Pré-requisitos:
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

```bash
# Clone o repositório
git clone https://github.com/GustavoMartin2002/NexusAPI.git

# Acesse a pasta principal
cd NexusAPI
```

📄 Crie um arquivo `.env` na raiz do projeto com:
```bash
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_DATABASE=nexus_db
DATABASE_AUTO_LOAD_ENTITIES=1
DATABASE_SYNCHRONIZE=0

JWT_SECRET=supersecret
JWT_TOKEN_AUDIENCE=http://localhost:3000
JWT_TOKEN_ISSUER=http://localhost:3000
JWT_TTL=3600
JWT_REFRESH_TTL=86400

NODE_ENV=development
PORT=3000
ORIGIN=http://localhost:3000
```
Obs: `DATABASE_SYNCHRONIZE=0` você pode alterar este campo para 1 (somente em ambiente de testes).

📦 Suba os containers:
```bash
docker-compose up --build -d
```
Isso irá iniciar os serviços:
- **Backend (NestJS)** na porta `3000`
- **PostgreSQL** na porta `5432`

📌 Ver logs do banco:
```bash
docker logs -f postgres_db
```

📌 Ver logs do backend:
```bash
docker logs -f backend_api
```

📌 Derrubar os containers:
``` bash
docker-compose down
```

----

### A API estará disponível em:
➡️ `http://localhost:3000`

### Swagger disponível em:
➡️ `http://localhost:3000/docs`

----

### Testes 🧪
O projeto utiliza Jest para testes unitários e de integração.

Rodando os testes:
```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:e2e
```
📂 Por padrão, os testes estão na pasta `test`, nos arquivos `*.spec.ts` dentro de `src/`, ou próximos aos módulos, serviços e DTOs.

----

### CI/CD 🔄
O projeto utiliza **GitHub Actions** para integração contínua, garantindo que cada commit ou PR na branch `main` seja validado com **build** e **testes automáticos**. 

📂 Arquivo: `.github/workflows/ci.yml`
```bash
name: NexusAPI - CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: ./nexus-api
    
    strategy:
      matrix:
        node-version: [20.x, 22.x]

    env:
      DATABASE_TYPE: postgres
      DATABASE_HOST: localhost
      DATABASE_PORT: 5432
      DATABASE_USERNAME: user
      DATABASE_PASSWORD: password
      DATABASE_DATABASE: mydatabase
      DATABASE_AUTO_LOAD_ENTITIES: 1
      DATABASE_SYNCHRONIZE: 1
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
      JWT_TOKEN_AUDIENCE: ${{ secrets.JWT_TOKEN_AUDIENCE }}
      JWT_TOKEN_ISSUER: ${{ secrets.JWT_TOKEN_ISSUER }}
      JWT_TTL: ${{ secrets.JWT_TTL }}
      JWT_REFRESH_TTL: ${{ secrets.JWT_REFRESH_TTL }}
      PORT: 3000

    services:
      # Database config
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: ${{ env.DATABASE_USERNAME }}
          POSTGRES_PASSWORD: ${{ env.DATABASE_PASSWORD }}
          POSTGRES_DB: ${{ env.DATABASE_DATABASE }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -d mydatabase -U user"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    #Step 1 - Job Configuration
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}

    # Step 2 - Install Dependencies
    - name: Install Dependencies
      run: npm ci

    # Step 3 - Wait for PostgreSQL
    - name: Wait for PostgreSQL
      run: |
        echo "Wait for database..."
        sleep 10

    # Step 4 - Unit Tests
    - name: Run all tests
      run: |
        npm run test
        npm run test:e2e
```
Obs: `DATABASE_SYNCHRONIZE=1` somente em ambiente de testes.

✅ O que esse pipeline faz?
- Testa a aplicação em múltiplas versões do **Node.js (20 e 22)**
- Sobe um container **PostgreSQL 17** para testes de integração
- Executa **testes unitários** e **e2e**
- Garante que cada PR/commit na branch `main` seja validado antes do merge
</br>

**Agora sua NexusAPI está pronta para uso, com testes e CI/CD automatizados!** ⚡

[NexusAPI](https://nexusapi-apuw.onrender.com/docs)
