npm install
//npm install -g npm@11.10.1
npm audit fix --force
npm install next@latest react@latest react-dom@latest
npm run dev --webpack
npm ci
npm run build
xcopy /E /I /Y .next\static .next\standalone\.next\static
xcopy /E /I /Y public .next\standalone\public

Temiz Kurulum Yapmak İstersen
pm2 delete all
pm2 start .next/standalone/server.js --name gtg_next_pm

C:\GTG\WEB\BabrooWebApp>pm2 start "cmd.exe" --name gtg_next_pm -- /c "node .
ext/standalone/server.js"

pm2 restart gtg_next_pm
pm2 restart gtg_next_pm --update-env

pm2 stop gtg_next_pm
pm2 delete gtg_next_pm
pm2 list
pm2 start npm --name gtg_next_pm -- start
pm2 save
pm2 startup
pm2 restart gtg_next_pm
pm2 restart gtg_next_pm --update-env
C:\GTG\WEB\BabrooWebApp>pm2 start "cmd.exe" --name gtg_next_pm -- /c "node .
ext/standalone/server.js"
[PM2] Starting C:\WINDOWS\SYSTEM32\CMD.EXE in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ?    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ gtg_next_pm        │ fork     │ 45   │ errored   │ 0%       │ 0b       │
│ 1  │ gtg_next_pm        │ fork     │ 0    │ online    │ 0%       │ 2.1mb    │

pm2 delete 0
pm2 restart all
pm2 reload gtg_next_pm

Temiz Kurulum Yapmak İstersen
pm2 delete all
pm2 start .next/standalone/server.js --name gtg_next_pm


$APP_PATH = "D:\PKDMR\GTG\WEB\BabrooWebApp"
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
