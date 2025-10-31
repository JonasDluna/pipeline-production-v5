# 🚀 Múltiplas Opções de Deploy - Vercel

## 📋 **OPÇÕES DE DEPLOYMENT:**

### **1. Deploy Principal (Produção)**
[![Deploy Principal](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-production&repository-name=pipeline-production-main)

**Configuração:**
- **Nome**: `pipeline-production`
- **Ambiente**: Production
- **Branch**: main
- **Domínio**: `pipeline-production.vercel.app`

---

### **2. Deploy de Desenvolvimento (Staging)**
[![Deploy Staging](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-dev&repository-name=pipeline-production-dev)

**Configuração:**
- **Nome**: `pipeline-dev`
- **Ambiente**: Preview
- **Branch**: main
- **Domínio**: `pipeline-dev.vercel.app`

---

### **3. Deploy Demo (Apresentação)**
[![Deploy Demo](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-demo&repository-name=pipeline-production-demo)

**Configuração:**
- **Nome**: `pipeline-demo`
- **Ambiente**: Development
- **Branch**: main
- **Domínio**: `pipeline-demo.vercel.app`

---

## ⚙️ **CONFIGURAÇÃO PARA CADA DEPLOY:**

### **Environment Variables (Todas as versões):**
```
VITE_SUPABASE_URL = https://zoadjmecfrnqutaplowj.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU
```

### **Build Settings (Automático):**
```
Framework: Vite
Build Command: cd client && npm run build
Output Directory: client/dist
Install Command: cd client && npm install
```

---

## 🎯 **USOS RECOMENDADOS:**

### **🌐 Deploy Principal (Produção)**
- **Uso**: Equipe de produção diária
- **Acesso**: Usuários finais
- **Estabilidade**: Máxima
- **URL**: Compartilhar com clientes

### **🔧 Deploy Staging (Desenvolvimento)** 
- **Uso**: Testes antes de produção
- **Acesso**: Desenvolvedores e QA
- **Estabilidade**: Teste de novas features
- **URL**: Testes internos

### **🎨 Deploy Demo (Apresentação)**
- **Uso**: Demonstrações e apresentações
- **Acesso**: Vendas e marketing
- **Estabilidade**: Versão limpa para demos
- **URL**: Mostrar para prospects

---

## 🔄 **DEPLOY VIA CLI (Alternativo):**

### **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

### **Deploy Multiple Projects:**
```bash
# Deploy Principal
vercel --prod --name pipeline-production

# Deploy Staging  
vercel --name pipeline-dev

# Deploy Demo
vercel --name pipeline-demo
```

---

## 📊 **VANTAGENS DE MÚLTIPLOS DEPLOYS:**

### **✅ Benefícios:**
- **Separação de ambientes** - Prod/Dev/Demo
- **Testes seguros** - Não afeta produção
- **URLs específicas** - Para diferentes propósitos
- **Rollback fácil** - Entre versões
- **Demonstrações** - Versão sempre limpa

### **🎯 Casos de Uso:**
- **Produção**: Trabalho diário da equipe
- **Staging**: Testar novas funcionalidades
- **Demo**: Apresentações comerciais
- **Backup**: Versão de emergência

---

## 🚀 **DEPLOY RÁPIDO - ESCOLHA SUA OPÇÃO:**

1. **Para uso diário**: [Deploy Principal](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-production)
2. **Para testes**: [Deploy Staging](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-dev)
3. **Para demos**: [Deploy Demo](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5&project-name=pipeline-demo)

**Todas as versões terão a mesma funcionalidade multi-usuários em tempo real!** 🌐