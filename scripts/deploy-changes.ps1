# Deploy Yesterday's Changes to Server
# Date: February 17, 2026
# Deploying changes from February 16, 2026

$SSH_KEY = "C:\Users\Administrator\Downloads\AOPL.pem"
$SERVER = "ubuntu@3.111.242.151"
$REMOTE_PATH = "/var/www/videoquiz/htdocs/www.videoquiz.ayurcentral.in"
$LOCAL_ROOT = "D:\videoquiz_main"

Write-Host "=== Deploying Feb 16, 2026 Changes ===" -ForegroundColor Green
Write-Host ""

# Files changed yesterday (Feb 16, 2026)
$FILES_TO_DEPLOY = @(
    "app/page.tsx",
    "app/UserSidebar.tsx",
    "app/globals.css",
    "app/main-module/[id]/page.tsx",
    "src/components/HoverVideoPreview.tsx",
    "next.config.ts",
    "src/lib/cert.ts",
    "assets/Training Certificate.pdf"
)

Write-Host "Files to deploy:" -ForegroundColor Cyan
$FILES_TO_DEPLOY | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

# Upload each file
$SUCCESS_COUNT = 0
$FAIL_COUNT = 0

foreach ($file in $FILES_TO_DEPLOY) {
    $localFile = Join-Path $LOCAL_ROOT $file
    $remoteDir = Split-Path $file -Parent
    $fileName = Split-Path $file -Leaf
    
    if (Test-Path $localFile) {
        Write-Host "Uploading: $file" -ForegroundColor Yellow
        
        # Create remote directory if needed
        if ($remoteDir) {
            ssh -i $SSH_KEY $SERVER "mkdir -p $REMOTE_PATH/$remoteDir"
        }
        
        # Upload file
        scp -i $SSH_KEY $localFile "${SERVER}:${REMOTE_PATH}/$file"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: $file uploaded" -ForegroundColor Green
            $SUCCESS_COUNT++
        } else {
            Write-Host "  FAILED: $file upload failed" -ForegroundColor Red
            $FAIL_COUNT++
        }
    } else {
        Write-Host "  SKIPPED: $file not found locally" -ForegroundColor Yellow
        $FAIL_COUNT++
    }
    Write-Host ""
}

# Summary
Write-Host "=== Deployment Summary ===" -ForegroundColor Green
Write-Host "Successfully deployed: $SUCCESS_COUNT files" -ForegroundColor Green
Write-Host "Failed/Skipped: $FAIL_COUNT files" -ForegroundColor $(if ($FAIL_COUNT -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into server: ssh -i `"$SSH_KEY`" $SERVER"
Write-Host "2. Navigate to app: cd $REMOTE_PATH"
Write-Host "3. Install dependencies (if needed): npm install"
Write-Host "4. Build application: npm run build"
Write-Host "5. Restart PM2: pm2 restart videoquiz"
