$APP_PATH = "D:\PKDMR\GTG\WEB\GoTradeGoWebApp"
$ZIP_PATH = "D:\PKDMR\GTG\WEB\PUBLISH\ZIP\app.zip"

Write-Host "Stopping PM2..."
pm2 stop my-next

Write-Host "Extracting zip..."
Remove-Item "$APP_PATH\*" -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $ZIP_PATH -DestinationPath $APP_PATH -Force

cd $APP_PATH

Write-Host "Installing packages..."
npm ci
if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed. Deployment stopped."
}

Write-Host "Building Next.js..."
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "Next.js build failed. Skipping static file copy."
}

Write-Host "Copying static files..."
xcopy /E /I /Y .next\static .next\standalone\.next\static
if ($LASTEXITCODE -gt 1) {
    throw "Failed to copy .next\\static."
}
xcopy /E /I /Y public .next\standalone\public
if ($LASTEXITCODE -gt 1) {
    throw "Failed to copy public."
}

Write-Host "Restarting PM2..."
pm2 restart my-next --update-env

Write-Host "Deploy finished!"
