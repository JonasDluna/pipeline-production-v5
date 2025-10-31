# 🔧 CORRIGIR VARIÁVEIS DE AMBIENTE - VERCEL

## 🚨 **PROBLEMA ATUAL:**
```
seu-projeto.supabase.co/rest/v1/jobs → ERR_NAME_NOT_RESOLVED
🚀 Modo demonstração ativo - Dados salvos localmente
```

**Causa**: Variáveis de ambiente não configuradas na Vercel

---

## ✅ **SOLUÇÃO PASSO-A-PASSO:**

### **1. Acessar Dashboard Vercel**
- 🔗 [vercel.com/dashboard](https://vercel.com/dashboard)
- 🔍 Encontrar projeto: `pipeline-production-v5`
- 👆 **Clicar** no projeto

### **2. Configurar Environment Variables**
- 📂 **Settings** (menu lateral)
- ⚙️ **Environment Variables** 
- ➕ **Add New**

**Adicionar 2 variáveis:**

#### **Variável 1:**
```
Name: VITE_SUPABASE_URL
Value: https://zoadjmecfrnqutaplowj.supabase.co
Environment: Production, Preview, Development (todos)
```

#### **Variável 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU
Environment: Production, Preview, Development (todos)
```

### **3. Redeploy o Projeto**
- 📦 **Deployments** (menu lateral)
- 🔄 Último deploy → **3 pontos** → **Redeploy**
- ✅ **Use existing Build Cache** → **Redeploy**

### **4. Aguardar Build (~2 minutos)**
```
🔄 Building...
📦 Installing dependencies...
⚡ Building project...
✅ Deployment Ready
```

---

## 🎯 **RESULTADO ESPERADO:**

### **Antes (atual):**
```
❌ seu-projeto.supabase.co → ERR_NAME_NOT_RESOLVED
🚀 Modo demonstração ativo
```

### **Depois (corrigido):**
```
✅ https://zoadjmecfrnqutaplowj.supabase.co → Connected
🌐 Multi-usuários (verde)
```

---

## 🚀 **TESTE FINAL:**

1. **Abrir** URL da Vercel após redeploy
2. **Verificar** indicador: deve ser **🌐 Multi-usuários** (verde)
3. **Criar** uma OP → deve salvar no Supabase
4. **Abrir** 2ª aba → deve sincronizar em tempo real

---

## ⚡ **COMANDOS ALTERNATIVOS:**

Se preferir usar Vercel CLI:

```bash
# Instalar CLI
npm i -g vercel

# Configurar variáveis
vercel env add VITE_SUPABASE_URL
# Cole: https://zoadjmecfrnqutaplowj.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY  
# Cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU

# Redeploy
vercel --prod
```

---

## 🔍 **TROUBLESHOOTING:**

### **Se ainda aparecer modo demo:**
- ❓ Variáveis foram salvas? (Check no dashboard)
- ❓ Redeploy foi feito? (Necessário após adicionar vars)
- ❓ Supabase está online? (Teste no dashboard do Supabase)

### **Se build falhar:**
- 🔍 Verificar logs de build na Vercel
- 📋 Confirmar se variáveis não têm espaços extras
- 🔄 Tentar deploy limpo (clear build cache)

**Após seguir estes passos, o sistema deve conectar corretamente ao Supabase!** 🎉