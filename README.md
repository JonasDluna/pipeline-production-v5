# Pipeline Production v5

Sistema de gestão de produção industrial com pipeline de etapas, dashboard interativo e **colaboração multi-usuários em tempo real**.

## 🌟 **NOVIDADE: Modo Multi-usuários** 

🌐 **Sistema totalmente colaborativo**: Múltiplos usuários podem trabalhar simultaneamente e ver as mudanças em tempo real!

### ✨ Funcionalidades Colaborativas
- **Sincronização instantânea** - Mudanças aparecem para todos os usuários conectados
- **Sistema de fallback inteligente** - Supabase → API Local → Modo Demo
- **Indicadores visuais** - Status de conectividade sempre visível
- **Preservação total** - Todas as funcionalidades existentes mantidas

## 🚀 Funcionalidades Completas

### 🔄 **Colaboração em Tempo Real** (NOVO)
- **Multi-usuários simultâneos** - Trabalho colaborativo sem conflitos
- **Sincronização instantânea** - Mudanças aparecem em tempo real
- **3 modos de operação** - Máxima confiabilidade em qualquer situação

### 📊 **Gestão Completa de Produção**
- **Upload de OPs via PDF** - Extração automática de dados
- **Pipeline interativo** - Drag & drop entre etapas
- **Dashboard completo** - Visão geral da produção
- **Busca avançada** - Por OP, cliente, produto com debounce
- **Filtros dinâmicos** - Por tipo (Venda/Reposição) e etapa
- **Calendário de entregas** - Agenda de prazos
- **Relatórios Excel** - Exportação formatada
- **Tipos de pedido** - Venda e Reposição de estoque
- **Cards interativos** - Com highlight de busca e badges coloridos

## 🛠️ Tecnologias

### Stack Principal
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Banco Multi-usuários**: Supabase (PostgreSQL + Realtime)
- **PDF Parser**: Extração automática de dados
- **Proxy**: Configurado para desenvolvimento

### Arquitetura Colaborativa
- **Supabase**: Banco em nuvem com sincronização em tempo real
- **Row Level Security**: Segurança por usuário (configurável)
- **Realtime Subscriptions**: WebSocket para mudanças instantâneas
- **Progressive Enhancement**: Sistema funciona mesmo se Supabase estiver indisponível

## 📦 Instalação

### Pré-requisitos
- Node.js 14+
- NPM

### 1. Clone o repositório
```bash
git clone https://github.com/JonasDluna/pipeline-production-v5.git
cd pipeline-production-v5
```

### 2. Instale as dependências

**Cliente:**
```bash
cd client
npm install
```

**Servidor:**
```bash
cd server
npm install
```

### 3. Configure Modo Multi-usuários (OPCIONAL)

Para ativar a **colaboração em tempo real**, configure o Supabase:

**📋 Setup Rápido:**
1. Crie projeto em [supabase.com](https://supabase.com)
2. Execute o SQL do arquivo `SUPABASE_SETUP.md`
3. Copie URL e chave anon
4. Crie `client/.env`:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

**🔗 Documentação completa**: Ver arquivo [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)

### 4. Execute o sistema

**Terminal 1 - Servidor:**
```bash
cd server
npm run dev
```

**Terminal 2 - Cliente:**
```bash
cd client
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:5173
- API: http://localhost:3001

## � Modos de Operação

O sistema possui **3 modos automáticos** com fallback inteligente:

### 🌐 **Modo Supabase** (Multi-usuários - PREFERIDO)
- **Indicador**: 🌐 Multi-usuários (verde)  
- **Quando**: Supabase configurado e conectado
- **Funcionalidades**: 
  - ✅ Colaboração em tempo real
  - ✅ Múltiplos usuários simultâneos
  - ✅ Sincronização instantânea
  - ✅ Dados persistentes na nuvem

### 🖥️ **Modo API Local** (Servidor local)
- **Indicador**: 🖥️ API Local (azul)
- **Quando**: Supabase indisponível mas servidor rodando
- **Funcionalidades**:
  - ✅ Todas as funcionalidades básicas
  - ✅ Upload de PDFs com processamento
  - ❌ Sem colaboração multi-usuários

### 🚀 **Modo Demo** (Offline)
- **Indicador**: 🚀 Demo (amarelo)
- **Quando**: Nem Supabase nem servidor disponíveis  
- **Funcionalidades**:
  - ✅ Interface completa
  - ✅ Dados salvos localmente (localStorage)
  - ✅ Simulação de upload de PDFs
  - ❌ Sem persistência entre sessões
  - ❌ Sem colaboração

## �📱 Como usar

### 🎯 **Colaboração Multi-usuários** (Modo Supabase)
1. **Configure** o Supabase (ver `SUPABASE_SETUP.md`)
2. **Abra** múltiplas abas/navegadores
3. **Crie** uma OP em uma aba - **apareça instantaneamente** nas outras
4. **Mova** cards entre etapas - **sincronize** em tempo real
5. **Edite** dados - **atualize** para todos simultaneamente

### 🔧 **Operação Geral**
1. **Nova OP**: Faça upload de PDFs para criar ordens de produção
2. **Pipeline**: Arraste cards entre etapas (Novo Pedido → Fundição → Banho → Pintura → Embalagem → Finalizado)
3. **Busca**: Digite OP, cliente ou produto para filtrar
4. **Filtros**: Selecione tipo de pedido e etapa
5. **Edição**: Clique em cards para editar dados
6. **Relatórios**: Exporte dados em Excel
7. **Calendário**: Visualize prazos de entrega

## 🎨 Interface

- Layout responsivo (max-width: 1700px)
- Cards com badges coloridos por tipo
- Highlight de texto encontrado na busca
- Debounce de 300ms na busca
- Modal de edição com dropdowns e date picker

## 🗃️ Estrutura

```
client/          # Frontend React
├── src/
│   ├── pages/
│   │   ├── ProductionDashboard.jsx
│   │   └── Finalizados.jsx
│   └── ...
server/          # Backend Node.js
├── server.js    # API principal
├── pdfParser.js # Extração de PDF
└── uploads/     # Arquivos enviados
```

## 🔧 Configuração

### Proxy (client/vite.config.js)
```js
proxy: {
  '/api': 'http://localhost:3001'
}
```

### Produtos suportados
- Chaveiro Relevo Com/Sem Pintura
- Chaveiro Resinado  
- Pin Relevo Com/Sem Pintura
- Pin Gaveta Personalizada/Padrão

## 📊 Estados dos Jobs

- **NOVO_PEDIDO** - Novo pedido
- **FUNDICAO** - Em fundição
- **BANHO** - Processo de banho
- **PINTURA** - Em pintura
- **EMBALAGEM** - Embalagem
- **FINALIZADO** - Concluído

## 🌐 Deploy Web

### Para acessar via web (sem instalação local):

**🎯 Demo online**: https://pipeline-production-v5.vercel.app

1. **Deploy na Vercel** (recomendado):
   - Acesse https://vercel.com
   - Faça login com GitHub
   - Importe este repositório
   - Configure:
     - Framework: Vite
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Deploy no Netlify**:
   - Acesse https://netlify.com
   - Conecte GitHub
   - Build command: `cd client && npm run build`
   - Publish directory: `client/dist`

📖 **Guia completo**: Veja `DEPLOY.md` para instruções detalhadas

## 🐛 Troubleshooting

**Erro de porta em uso:**
```bash
netstat -an | findstr :3001
taskkill /F /PID [PID_NUMBER]
```

**API não responde:**
- Verifique se o servidor está rodando
- Teste: http://localhost:3001/api/jobs

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request
