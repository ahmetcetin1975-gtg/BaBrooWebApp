param(
    [string]$Branch = "main",
    [string]$Remote = "origin",
    [string]$Pm2AppName = "babroo"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Title,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Action

    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Title (exit code: $LASTEXITCODE)"
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path ".git")) {
    throw "This folder is not a git repository: $scriptDir"
}

Invoke-Step "Git fetch ($Remote)" { git fetch $Remote }
Invoke-Step "Git pull ($Remote/$Branch)" { git pull $Remote $Branch }
Invoke-Step "Install dependencies (npm ci)" { npm ci }
Invoke-Step "Build app (npm run build)" { npm run build }

Write-Host ""
Write-Host "==> PM2 restart/start ($Pm2AppName)" -ForegroundColor Cyan
pm2 describe $Pm2AppName | Out-Null

if ($LASTEXITCODE -eq 0) {
    pm2 restart $Pm2AppName --update-env
    if ($LASTEXITCODE -ne 0) {
        throw "PM2 restart failed for '$Pm2AppName'"
    }
}
else {
    pm2 start npm --name $Pm2AppName -- start
    if ($LASTEXITCODE -ne 0) {
        throw "PM2 start failed for '$Pm2AppName'"
    }
}

Invoke-Step "Persist PM2 process list (pm2 save)" { pm2 save }

Write-Host ""
Write-Host "Deployment completed successfully." -ForegroundColor Green
