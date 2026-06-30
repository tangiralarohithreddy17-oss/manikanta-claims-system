$apiUrl = "https://manikanta-backend-api.onrender.com/api/view-tables"
Write-Host "Connecting to live database at Render..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 20
} catch {
    Write-Host "Error connecting to the database server. Check your internet connection." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

$markdown = @"
# PostgreSQL Database Data Snapshot (Live Update)

*Last Refreshed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

---

## 📋 Claims Registry Table (`claims`)

| Return ID | Dealer Shop | Contact No. | Product Name | Qty | Invoice No. | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
"@

foreach ($claim in $response.claims) {
    $markdown += "`r`n| $($claim.id) | $($claim.dealer_shop_name) | $($claim.contact_number) | $($claim.product_name) | $($claim.quantity_returned) | $($claim.invoice_number) | **$($claim.status)** |"
}

$markdown += @"


---

## 👥 Users Table (`users`)

| Username | Role | Full Name |
| :--- | :--- | :--- |
"@

foreach ($user in $response.users) {
    $markdown += "`r`n| $($user.username) | $($user.role) | $($user.name) |"
}

$markdown += @"


---

## 📝 Recent Audit Logs Table (`audit_logs`)

| Action ID | Return ID | Performed By | Action Taken | Log Details |
| :--- | :--- | :--- | :--- | :--- |
"@

foreach ($log in $response.audit_logs) {
    $markdown += "`r`n| $($log.id) | $($log.claim_id) | $($log.user_name) | $($log.action) | $($log.details) |"
}

$markdown | Out-File -FilePath "database_data.md" -Encoding utf8
Write-Host "Data updated successfully in database_data.md!" -ForegroundColor Green
Start-Sleep -Seconds 1
