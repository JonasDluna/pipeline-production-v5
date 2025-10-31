# 🚀 CONFIGURAÇÃO VERCEL - Pipeline Production v5

## ✅ **SUAS CREDENCIAIS SUPABASE:**
```
VITE_SUPABASE_URL=https://zoadjmecfrnqutaplowj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU
```

---

## 🌐 **DEPLOY IMEDIATO NA VERCEL:**

### **Método 1: Deploy Automático**
[![Deploy com Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JonasDluna/pipeline-production-v5)

1. **Clique no botão acima**
2. **Faça login na Vercel** (conecte com GitHub)
3. **Na tela "Configure Project":**
   - Repository Name: `pipeline-production-v5`
   - Framework Preset: `Vite`
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`

4. **IMPORTANTE - Adicione Environment Variables:**
   ```
   VITE_SUPABASE_URL = https://zoadjmecfrnqutaplowj.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU
   ```

5. **Clique "Deploy"**

### **Método 2: Manual**
1. Acesse [vercel.com](https://vercel.com)
2. Login → "New Project"
3. Import Git Repository: `https://github.com/JonasDluna/pipeline-production-v5`
4. Configure as variáveis de ambiente (mesmo valores acima)
5. Deploy

---

## 🔧 **CONFIGURAÇÃO CORRETA VERCEL:**

### **Build Settings:**
```
Build Command: cd client && npm run build
Output Directory: client/dist
Install Command: cd client && npm install
```

### **Environment Variables:**
```
Name: VITE_SUPABASE_URL
Value: https://zoadjmecfrnqutaplowj.supabase.co

Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU
```

---

## 🎯 **RESULTADO ESPERADO:**

### **Após Deploy na Vercel:**
- ✅ **URL**: `https://pipeline-production-v5-seu-usuario.vercel.app`
- ✅ **Status**: 🌐 Multi-usuários (verde)
- ✅ **Funcionalidade**: Colaboração em tempo real
- ✅ **Acesso**: Global via internet

### **Teste Multi-usuários:**
1. Abra a URL da Vercel em 2+ abas/dispositivos
2. Crie uma OP em uma aba
3. Veja aparecer instantaneamente nas outras
4. Arraste OPs entre etapas → sincronização em tempo real

---

## 🚨 **TROUBLESHOOTING:**

### **Se ainda aparecer erro 404:**
1. **Verificar** se as variáveis foram adicionadas corretamente
2. **Rebuild** o projeto na Vercel
3. **Conferir** se a URL do Supabase está certa

### **Se aparecer "Demo Mode":**
- Problema nas variáveis de ambiente
- Redeploy com as credenciais corretas

### **Build Errors:**
- Verificar se `client/` tem todas as dependências
- Confirmar estrutura de pastas no repositório

---

## ⚡ **DEPLOY RÁPIDO - COMANDOS:**

Se quiser fazer via CLI da Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
cd pipeline-production-v5
vercel

# Adicionar variáveis (quando solicitado)
# VITE_SUPABASE_URL=https://zoadjmecfrnqutaplowj.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 🎉 **SEUS DADOS ESTÃO SEGUROS:**

- ✅ **Chave anon**: Segura para frontend público
- ✅ **URL pública**: Normal ser exposta
- ✅ **RLS habilitado**: Proteção no Supabase
- ✅ **Sem service_role**: Chave secreta não exposta

**Agora é só fazer o deploy e compartilhar com a equipe!** 🚀