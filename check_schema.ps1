$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"
$baseUrl = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"

# Step 1: Sign in to get a JWT
$loginBody = @{ email = "divishbansal77@gmail.com"; password = "123456" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } `
    -Body $loginBody

$userToken = $loginResponse.access_token
Write-Host "Logged in. Token: $($userToken.Substring(0, 30))..."

# Step 2: Check existing columns
$cols = Invoke-RestMethod -Uri "$baseUrl/rest/v1/harmonized_sales?select=*&limit=1" `
    -Headers @{ "apikey" = $anonKey; "Authorization" = "Bearer $userToken" }

Write-Host "Sample row:"
$cols | ConvertTo-Json -Depth 3
