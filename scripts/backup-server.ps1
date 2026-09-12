# Server Backup Script for VideoQuiz
# Usage: .\scripts\backup-server.ps1

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "D:\videoquiz_main\backups\server_$TIMESTAMP"
$SSH_KEY = "C:\Users\Administrator\Downloads\AOPL.pem"
$SERVER = "ubuntu@3.111.242.151"
$REMOTE_PATH = "/var/www/videoquiz/htdocs/www.videoquiz.ayurcentral.in"

Write-Host "=== VideoQuiz Server Backup ===" -ForegroundColor Green
Write-Host "Timestamp: $TIMESTAMP"
Write-Host ""

# Create backup directory
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Cyan

# 1. Backup application files
Write-Host ""
Write-Host "Step 1: Backing up application files..." -ForegroundColor Yellow
$APP_BACKUP = "$BACKUP_DIR\app_files"
New-Item -ItemType Directory -Force -Path $APP_BACKUP | Out-Null

scp -i $SSH_KEY -r "${SERVER}:${REMOTE_PATH}/*" $APP_BACKUP
if ($LASTEXITCODE -eq 0) {
    Write-Host "Application files backed up successfully" -ForegroundColor Green
} else {
    Write-Host "Application files backup failed" -ForegroundColor Red
}

# 2. Backup .env file
Write-Host ""
Write-Host "Step 2: Backing up .env configuration..." -ForegroundColor Yellow
scp -i $SSH_KEY "${SERVER}:${REMOTE_PATH}/.env.local" "$BACKUP_DIR\.env.local.backup"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Environment file backed up successfully" -ForegroundColor Green
} else {
    Write-Host "Environment file backup failed (may not exist)" -ForegroundColor Yellow
}

# 3. Backup database
Write-Host ""
Write-Host "Step 3: Backing up MySQL database..." -ForegroundColor Yellow
$DB_BACKUP_FILE = "videoquiz_db_backup_$TIMESTAMP.sql"

# Create backup on server first
# Assumes MySQL credentials are configured server-side in ~/.my.cnf so no password is passed on the command line
ssh -i $SSH_KEY $SERVER "mysqldump -u itsupport videoquiz > /tmp/$DB_BACKUP_FILE"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database dump created on server" -ForegroundColor Green
    
    # Download to local
    scp -i $SSH_KEY "${SERVER}:/tmp/$DB_BACKUP_FILE" "$BACKUP_DIR\$DB_BACKUP_FILE"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database backup downloaded successfully" -ForegroundColor Green
        
        # Cleanup remote temp file
        ssh -i $SSH_KEY $SERVER "rm /tmp/$DB_BACKUP_FILE"
        Write-Host "Cleaned up temporary file on server" -ForegroundColor Green
    } else {
        Write-Host "Database backup download failed" -ForegroundColor Red
    }
} else {
    Write-Host "Database backup failed" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=== Backup Complete ===" -ForegroundColor Green
Write-Host "Backup location: $BACKUP_DIR"
Write-Host ""
Write-Host "Contents:" -ForegroundColor Cyan
Get-ChildItem -Path $BACKUP_DIR -Recurse | Select-Object FullName, Length | Format-Table -AutoSize
