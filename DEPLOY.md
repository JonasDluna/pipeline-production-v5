# Deploy na Vercel - Pipeline Production v5

## Como fazer deploy na Vercel

### 1. Acesse a Vercel
- Vá para https://vercel.com
- Faça login com sua conta GitHub

### 2. Importe o repositório
- Clique em "New Project"
- Selecione "Import Git Repository"
- Escolha `pipeline-production-v5`

### 3. Configurações do deploy
- **Framework Preset**: Vite
- **Root Directory**: deixe vazio (.)
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/dist`

### 4. Variáveis de ambiente (se necessário)
- Não precisamos configurar nenhuma para este projeto básico

### 5. Deploy
- Clique em "Deploy"
- Aguarde alguns minutos
- Seu projeto estará disponível em uma URL como: `https://pipeline-production-v5.vercel.app`

## Alternativas de Deploy

### Netlify
1. Acesse https://netlify.com
2. Conecte com GitHub
3. Selecione o repositório
4. Configure:
   - Build command: `cd client && npm run build`
   - Publish directory: `client/dist`

### Railway (para fullstack)
1. Acesse https://railway.app
2. Conecte GitHub
3. Deploy automático do repositório completo

### Render
1. Acesse https://render.com
2. Conecte GitHub
3. Crie um "Static Site" para o frontend
4. Crie um "Web Service" para o backend

## Notas importantes

- **Dados em memória**: O servidor atual armazena dados em memória, então eles serão perdidos a cada restart
- **Uploads**: Os arquivos PDF precisarão de um storage persistente em produção
- **Banco de dados**: Para produção real, considere adicionar um banco como PostgreSQL ou MongoDB

## URL do projeto

Após o deploy, compartilhe a URL gerada (ex: https://pipeline-production-v5.vercel.app) com outros usuários!