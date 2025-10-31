# Configuração do Supabase - Sistema Multi-usuários

## 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha uma organização
5. Preencha:
   - **Name**: `pipeline-production-v5`
   - **Database Password**: (escolha uma senha forte)
   - **Region**: `South America (São Paulo)` ou mais próxima
6. Clique em "Create new project"

## 2. Configurar Banco de Dados

### 2.1. Criar Tabela `jobs`

No painel do Supabase, vá para **SQL Editor** e execute:

```sql
-- Criar tabela jobs
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_op VARCHAR(50) NOT NULL,
  cliente TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  prazo DATE,
  tipo_pedido VARCHAR(20) DEFAULT 'VENDA',
  etapa_atual VARCHAR(50) DEFAULT 'NOVO_PEDIDO',
  historico_etapas JSONB DEFAULT '[]',
  pdf_data TEXT,
  pdf_name VARCHAR(255),
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_jobs_etapa_atual ON jobs(etapa_atual);
CREATE INDEX idx_jobs_numero_op ON jobs(numero_op);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Habilitar RLS (Row Level Security) para segurança básica
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (pode ser refinada posteriormente)
CREATE POLICY "Permitir todas operações em jobs" ON jobs
  FOR ALL USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2. Habilitar Realtime

1. Vá para **Database** → **Replication**
2. Encontre a tabela `jobs` na lista
3. Clique no toggle para habilitar **Realtime**

## 3. Configurar Variáveis de Ambiente

### 3.1. Obter Credenciais

No painel do Supabase:
1. Vá para **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** key (chave pública)

### 3.2. Criar arquivo `.env`

Na pasta `client/`, crie o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**⚠️ IMPORTANTE**: 
- Substitua `xxxxxxxxxxx` pela URL real do seu projeto
- Substitua `sua_chave_anonima_aqui` pela chave anon real
- Nunca commite o arquivo `.env` para o git

## 4. Testar Conexão

1. Inicie o sistema:
   ```bash
   cd client
   npm run dev
   ```

2. Verifique no console do navegador:
   - ✅ "🌐 Conectado ao Supabase - Modo colaborativo ativo!"
   - ❌ Se aparecer erro, verifique as credenciais

## 5. Funcionalidades Multi-usuários

### 5.1. Sincronização em Tempo Real
- Mudanças feitas por um usuário aparecem instantaneamente para outros
- Criação, edição, exclusão e movimentação de OPs são sincronizadas

### 5.2. Modo Fallback
O sistema funciona em 3 níveis:
1. **Supabase** (preferido): Colaborativo em tempo real
2. **API Local**: Modo servidor local 
3. **Demo**: Modo offline com localStorage

### 5.3. Indicadores de Status
- 🌐 **Verde**: Conectado ao Supabase (multi-usuários)
- 🖥️ **Azul**: API Local (single-user)
- 🚀 **Amarelo**: Modo Demo (offline)

## 6. Estrutura de Dados

### Mapeamento de Campos:
- `numeroOP` ↔ `numero_op`
- `etapaAtual` ↔ `etapa_atual`
- `tipoPedido` ↔ `tipo_pedido`
- `historicoEtapas` ↔ `historico_etapas`
- `pdfData` ↔ `pdf_data`
- `pdfName` ↔ `pdf_name`
- `createdBy` ↔ `created_by`

### Etapas Disponíveis:
- `NOVO_PEDIDO`
- `ANALISE_TECNICA`
- `ORCAMENTO`
- `AGUARDANDO_APROVACAO`
- `EM_PRODUCAO`
- `CONTROLE_QUALIDADE`
- `FINALIZADO`

## 7. Segurança

### 7.1. Row Level Security (RLS)
- Habilitado na tabela `jobs`
- Política atual permite todas as operações
- Pode ser refinada para controle por usuário

### 7.2. Chaves de API
- Use apenas a chave `anon` no frontend
- Nunca exponha a chave `service_role`

## 8. Troubleshooting

### Erro "Failed to fetch"
- Verifique se a URL do Supabase está correta
- Confirme se a chave anon está correta
- Verifique conexão com internet

### Dados não sincronizam
- Confirme se Realtime está habilitado na tabela `jobs`
- Verifique se RLS não está bloqueando operações
- Abra o console do navegador para logs de erro

### Modo Demo ativo
- Sistema não conseguiu conectar com Supabase
- Verifique credenciais no arquivo `.env`
- Confirme se o projeto Supabase está ativo

## 9. Próximos Passos

### Melhorias Recomendadas:
1. **Autenticação**: Implementar login de usuários
2. **Permissões**: Refinar políticas RLS por perfil
3. **Auditoria**: Rastrear quem fez cada alteração
4. **Notificações**: Push notifications para mudanças importantes
5. **Backup**: Configurar backups automáticos

### Performance:
1. **Índices**: Adicionar índices conforme uso
2. **Paginação**: Implementar para grandes volumes
3. **Cache**: Cache local para dados frequentes
4. **Compressão**: Otimizar armazenamento de PDFs