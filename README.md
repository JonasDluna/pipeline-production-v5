# Pipeline Production v5

Sistema de gestão de produção industrial com pipeline de etapas e dashboard interativo.

## 🚀 Funcionalidades

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

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **PDF Parser**: Extração automática de dados
- **Proxy**: Configurado para desenvolvimento

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

### 3. Execute o sistema

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

## 📱 Como usar

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
