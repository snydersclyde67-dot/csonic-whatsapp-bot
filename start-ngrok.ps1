# ngrok Setup Script for CSonic
# This script helps you start ngrok for webhook testing

Write-Host "🚀 CSonic ngrok Setup`n"
Write-Host "=" * 50
Write-Host ""

# Check if ngrok is in PATH
if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Write-Host "✅ ngrok found in PATH`n"
    Write-Host "Starting ngrok tunnel on port 3000...`n"
    Write-Host "📋 IMPORTANT: Copy the HTTPS URL from the ngrok window`n"
    Write-Host "   It will look like: https://abc123.ngrok.io`n"
    Write-Host "   Use this URL for your webhook: https://abc123.ngrok.io/webhook/whatsapp`n"
    Write-Host "Press any key to start ngrok..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Start-Process ngrok -ArgumentList "http", "3000"
    Write-Host "`n✅ ngrok started! Check the new window for your HTTPS URL.`n"
} else {
    Write-Host "❌ ngrok not found in PATH`n"
    Write-Host "Please provide the full path to ngrok.exe`n"
    Write-Host "Common locations:"
    Write-Host "  - C:\Users\$env:USERNAME\Downloads\ngrok.exe"
    Write-Host "  - C:\Users\$env:USERNAME\Desktop\ngrok.exe"
    Write-Host "  - C:\ngrok\ngrok.exe`n"
    
    $ngrokPath = Read-Host "Enter full path to ngrok.exe (or press Enter to skip)"
    
    if ($ngrokPath -and (Test-Path $ngrokPath)) {
        Write-Host "`nStarting ngrok tunnel on port 3000...`n"
        Write-Host "📋 IMPORTANT: Copy the HTTPS URL from the ngrok window`n"
        Start-Process $ngrokPath -ArgumentList "http", "3000"
        Write-Host "✅ ngrok started! Check the new window for your HTTPS URL.`n"
    } else {
        Write-Host "`n⚠️ Please start ngrok manually:`n"
        Write-Host "1. Open a new terminal"
        Write-Host "2. Navigate to where ngrok.exe is located"
        Write-Host "3. Run: .\ngrok.exe http 3000"
        Write-Host "4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)`n"
    }
}

Write-Host "=" * 50
Write-Host "`n📝 Next Steps:`n"
Write-Host "1. Make sure CSonic server is running (npm start)"
Write-Host "2. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)"
Write-Host "3. Go to Meta Business Suite → Your App → WhatsApp → Configuration"
Write-Host "4. Set webhook URL to: https://YOUR-NGROK-URL.ngrok.io/webhook/whatsapp"
Write-Host "5. Set verify token to: csonic_verify_token_12345"
Write-Host "6. Click 'Verify and Save'`n"


