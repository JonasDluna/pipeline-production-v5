# 🚀 Script de Deploy Múltiplo para Vercel (PowerShell)
# Pipeline Production v5 - Sistema Multi-usuários

Write-Host "🚀 Pipeline Production v5 - Deploy Múltiplo" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Função para deploy
function Deploy-Project {
    param(
        [string]$Name,
        [string]$EnvType,
        [string]$Description
    )
    
    Write-Host ""
    Write-Host "🔄 Deploying: $Name" -ForegroundColor Blue
    Write-Host "📝 Description: $Description" -ForegroundColor Yellow
    Write-Host "🌍 Environment: $EnvType" -ForegroundColor Yellow
    
    # Configurar variáveis de ambiente
    Write-Host "⚙️  Configurando variáveis de ambiente..." -ForegroundColor White
    
    try {
        vercel env add VITE_SUPABASE_URL production development preview --value="https://zoadjmecfrnqutaplowj.supabase.co" --yes
        vercel env add VITE_SUPABASE_ANON_KEY production development preview --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWRqbWVjZnJucXV0YXBsb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTIyNzksImV4cCI6MjA3NzQ4ODI3OX0.qngho4OVH2I3_kSwk3OiNWyA3Z9cJ1VFkZuX5Sc1xbU" --yes
    }
    catch {
        Write-Host "⚠️  Variáveis podem já existir" -ForegroundColor Yellow
    }
    
    # Deploy
    try {
        if ($EnvType -eq "production") {
            vercel --prod --name=$Name
        } else {
            vercel --name=$Name
        }
        
        Write-Host "✅ Deploy successful: $Name" -ForegroundColor Green
        Write-Host "🌐 URL: https://$Name.vercel.app" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Deploy failed: $Name" -ForegroundColor Red
    }
}

# Verificar se Vercel CLI está instalado
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login na Vercel
Write-Host "🔐 Fazendo login na Vercel..." -ForegroundColor Blue
vercel login

# Menu de opções
Write-Host ""
Write-Host "📋 Opções de Deploy:" -ForegroundColor Blue
Write-Host "1. 🌐 Deploy Produção (pipeline-production)"
Write-Host "2. 🔧 Deploy Staging (pipeline-dev)"
Write-Host "3. 🎨 Deploy Demo (pipeline-demo)"
Write-Host "4. 🚀 Deploy Todos"
Write-Host "5. ❌ Cancelar"

$choice = Read-Host "Escolha uma opção (1-5)"

switch ($choice) {
    "1" {
        Deploy-Project "pipeline-production" "production" "Versão de produção para uso diário da equipe"
    }
    "2" {
        Deploy-Project "pipeline-dev" "preview" "Versão de desenvolvimento para testes"
    }
    "3" {
        Deploy-Project "pipeline-demo" "development" "Versão para demonstrações e apresentações"
    }
    "4" {
        Write-Host ""
        Write-Host "🚀 Fazendo deploy de todos os ambientes..." -ForegroundColor Blue
        Deploy-Project "pipeline-production" "production" "Versão de produção"
        Deploy-Project "pipeline-dev" "preview" "Versão de desenvolvimento"
        Deploy-Project "pipeline-demo" "development" "Versão demo"
    }
    "5" {
        Write-Host "❌ Deploy cancelado" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deploy(s) concluído(s)!" -ForegroundColor Green
Write-Host "📱 Teste as funcionalidades multi-usuários:" -ForegroundColor Blue
Write-Host "   • Abra múltiplas abas"
Write-Host "   • Crie OPs em uma aba" 
Write-Host "   • Veja sincronização em tempo real"
Write-Host "   • Compartilhe URLs com a equipe"