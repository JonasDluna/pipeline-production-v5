#!/bin/bash

# 🚀 Script de Deploy Múltiplo para Vercel
# Pipeline Production v5 - Sistema Multi-usuários

echo "🚀 Pipeline Production v5 - Deploy Múltiplo"
echo "=========================================="

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para deploy
deploy_project() {
    local name=$1
    local env_type=$2
    local description=$3
    
    echo -e "\n${BLUE}🔄 Deploying: ${name}${NC}"
    echo -e "${YELLOW}📝 Description: ${description}${NC}"
    echo -e "${YELLOW}🌍 Environment: ${env_type}${NC}"
    
    # Set environment variables
    echo "⚙️  Configurando variáveis de ambiente..."
    vercel env add VITE_SUPABASE_URL production development preview --value="https://zoadjmecfrnqutaplowj.supabase.co" --yes || true
    vercel env add VITE_SUPABASE_ANON_KEY production development preview --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU" --yes || true
    
    # Deploy
    if [ "$env_type" = "production" ]; then
        vercel --prod --name="$name"
    else
        vercel --name="$name"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deploy successful: ${name}${NC}"
        echo -e "${GREEN}🌐 URL: https://${name}.vercel.app${NC}"
    else
        echo -e "${RED}❌ Deploy failed: ${name}${NC}"
    fi
}

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Vercel CLI...${NC}"
    npm install -g vercel
fi

# Login na Vercel
echo -e "${BLUE}🔐 Fazendo login na Vercel...${NC}"
vercel login

# Menu de opções
echo -e "\n${BLUE}📋 Opções de Deploy:${NC}"
echo "1. 🌐 Deploy Produção (pipeline-production)"
echo "2. 🔧 Deploy Staging (pipeline-dev)"  
echo "3. 🎨 Deploy Demo (pipeline-demo)"
echo "4. 🚀 Deploy Todos"
echo "5. ❌ Cancelar"

read -p "Escolha uma opção (1-5): " choice

case $choice in
    1)
        deploy_project "pipeline-production" "production" "Versão de produção para uso diário da equipe"
        ;;
    2)
        deploy_project "pipeline-dev" "preview" "Versão de desenvolvimento para testes"
        ;;
    3)
        deploy_project "pipeline-demo" "development" "Versão para demonstrações e apresentações"
        ;;
    4)
        echo -e "\n${BLUE}🚀 Fazendo deploy de todos os ambientes...${NC}"
        deploy_project "pipeline-production" "production" "Versão de produção"
        deploy_project "pipeline-dev" "preview" "Versão de desenvolvimento"  
        deploy_project "pipeline-demo" "development" "Versão demo"
        ;;
    5)
        echo -e "${YELLOW}❌ Deploy cancelado${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deploy(s) concluído(s)!${NC}"
echo -e "${BLUE}📱 Teste as funcionalidades multi-usuários:${NC}"
echo -e "   • Abra múltiplas abas"
echo -e "   • Crie OPs em uma aba"
echo -e "   • Veja sincronização em tempo real"
echo -e "   • Compartilhe URLs com a equipe"