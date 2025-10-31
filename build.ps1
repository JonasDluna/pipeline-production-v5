# Script PowerShell para criar build de produção

Write-Host "🚀 Iniciando build do Pipeline Production v5 Beta..." -ForegroundColor Cyan

# Criar pasta temporária para o build
$buildDir = ".\pipeline-beta-dist"
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

Write-Host "📦 Preparando cliente..." -ForegroundColor Yellow
Set-Location .\client
npm install
npm run build
Copy-Item .\dist\* ..\$buildDir\client -Recurse -Force
Set-Location ..

Write-Host "🔧 Preparando servidor..." -ForegroundColor Yellow
Set-Location .\server
npm install
Copy-Item .\*.js ..\$buildDir\server -Force
Copy-Item .\package.json ..\$buildDir\server -Force
Copy-Item .\uploads ..\$buildDir\server -Recurse -Force
Set-Location ..

# Copiar README
Copy-Item .\README.md $buildDir -Force

# Criar arquivo ZIP
Write-Host "📎 Criando arquivo ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$buildDir\*" -DestinationPath "pipeline-beta.zip" -Force

# Limpar pasta temporária
Remove-Item -Path $buildDir -Recurse -Force

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host "📁 Arquivo gerado: pipeline-beta.zip" -ForegroundColor Cyan