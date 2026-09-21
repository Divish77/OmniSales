$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY"
$baseUrl = "https://bnmfhmsidqfqhkvcaqpp.supabase.co"

# ---- Login ----
$loginBody = @{ email = "divishbansal77@gmail.com"; password = "123456" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } `
    -Body $loginBody
$userToken = $loginResponse.access_token
$userId    = $loginResponse.user.id
Write-Host "Logged in as $userId"

# ---- Reference data ----
$countries = @(
    @{ name="India";          regions=@("Maharashtra","Karnataka","Delhi","Tamil Nadu","Gujarat","Rajasthan","West Bengal","Uttar Pradesh") },
    @{ name="United States";  regions=@("California","Texas","New York","Florida","Illinois","Washington","Georgia","Arizona") },
    @{ name="United Kingdom"; regions=@("England","Scotland","Wales","Northern Ireland","London","Manchester","Birmingham","Leeds") },
    @{ name="Germany";        regions=@("Bavaria","Berlin","Hamburg","Baden-Württemberg","Saxony","Hesse","Thuringia","Bremen") },
    @{ name="Canada";         regions=@("Ontario","Quebec","British Columbia","Alberta","Manitoba","Nova Scotia","Saskatchewan","New Brunswick") },
    @{ name="Australia";      regions=@("New South Wales","Victoria","Queensland","Western Australia","South Australia","Tasmania","ACT","Northern Territory") },
    @{ name="Japan";          regions=@("Tokyo","Osaka","Kanagawa","Aichi","Fukuoka","Hokkaido","Hyogo","Kyoto") },
    @{ name="Brazil";         regions=@("São Paulo","Rio de Janeiro","Minas Gerais","Bahia","Paraná","Rio Grande do Sul","Pernambuco","Ceará") },
    @{ name="France";         regions=@("Île-de-France","Auvergne-Rhône-Alpes","Nouvelle-Aquitaine","Occitanie","Hauts-de-France","Provence-Alpes-Côte d'Azur","Normandy","Brittany") },
    @{ name="Singapore";      regions=@("Central Region","East Region","North Region","North-East Region","West Region","Jurong","Tampines","Woodlands") }
)

$products = @(
    @{ name="Laptop";       normalized="laptop";       category="Electronics"; minPrice=35000; maxPrice=150000 },
    @{ name="Smartphone";   normalized="smartphone";   category="Electronics"; minPrice=15000; maxPrice=80000 },
    @{ name="Camera";       normalized="camera";       category="Electronics"; minPrice=12000; maxPrice=60000 },
    @{ name="Headphones";   normalized="headphones";   category="Electronics"; minPrice=2000;  maxPrice=20000 },
    @{ name="Tablet";       normalized="tablet";       category="Electronics"; minPrice=18000; maxPrice=70000 },
    @{ name="Smart Watch";  normalized="smart watch";  category="Electronics"; minPrice=5000;  maxPrice=30000 },
    @{ name="TV";           normalized="tv";           category="Electronics"; minPrice=20000; maxPrice=100000 },
    @{ name="T-Shirt";      normalized="t-shirt";      category="Clothing";    minPrice=500;   maxPrice=3000 },
    @{ name="Jeans";        normalized="jeans";        category="Clothing";    minPrice=800;   maxPrice=5000 },
    @{ name="Jacket";       normalized="jacket";       category="Clothing";    minPrice=2000;  maxPrice=15000 },
    @{ name="Dress";        normalized="dress";        category="Clothing";    minPrice=1000;  maxPrice=8000 },
    @{ name="Shoes";        normalized="shoes";        category="Clothing";    minPrice=1500;  maxPrice=10000 },
    @{ name="Sneakers";     normalized="sneakers";     category="Clothing";    minPrice=2000;  maxPrice=12000 },
    @{ name="Novel";        normalized="novel";        category="Books";       minPrice=200;   maxPrice=800 },
    @{ name="Textbook";     normalized="textbook";     category="Books";       minPrice=500;   maxPrice=2500 },
    @{ name="Comic";        normalized="comic";        category="Books";       minPrice=100;   maxPrice=500 },
    @{ name="Self Help";    normalized="self help";    category="Books";       minPrice=300;   maxPrice=1000 },
    @{ name="Blender";      normalized="blender";      category="Home";        minPrice=2000;  maxPrice=10000 },
    @{ name="Sofa";         normalized="sofa";         category="Home";        minPrice=15000; maxPrice=60000 },
    @{ name="Table";        normalized="table";        category="Home";        minPrice=5000;  maxPrice=25000 },
    @{ name="Chair";        normalized="chair";        category="Home";        minPrice=3000;  maxPrice=15000 },
    @{ name="Lamp";         normalized="lamp";         category="Home";        minPrice=500;   maxPrice=5000 },
    @{ name="Protein Powder"; normalized="protein powder"; category="Sports"; minPrice=2000; maxPrice=8000 },
    @{ name="Yoga Mat";     normalized="yoga mat";     category="Sports";      minPrice=500;   maxPrice=3000 },
    @{ name="Dumbbells";    normalized="dumbbells";    category="Sports";      minPrice=1000;  maxPrice=8000 },
    @{ name="Running Shoes"; normalized="running shoes"; category="Sports";   minPrice=3000;  maxPrice=15000 },
    @{ name="Lipstick";     normalized="lipstick";     category="Beauty";      minPrice=300;   maxPrice=2000 },
    @{ name="Perfume";      normalized="perfume";      category="Beauty";      minPrice=1500;  maxPrice=10000 },
    @{ name="Face Cream";   normalized="face cream";   category="Beauty";      minPrice=500;   maxPrice=5000 },
    @{ name="Shampoo";      normalized="shampoo";      category="Beauty";      minPrice=200;   maxPrice=1500 }
)

$channels   = @("online", "store")
$storeNames = @("Store A","Store B","Store C","Store D","Store E","Store F","Store G","Store H","Store Premium","Store Plus")

# ---- Generate rows ----
$rows   = @()
$random = New-Object System.Random

# Date range: last 24 months
$endDate   = [datetime]::Today
$startDate = $endDate.AddMonths(-24)

$totalRows = 3000
Write-Host "Generating $totalRows rows..."

for ($i = 0; $i -lt $totalRows; $i++) {
    # Random date
    $span = ($endDate - $startDate).Days
    $date = $startDate.AddDays($random.Next(0, $span)).ToString("yyyy-MM-dd")

    # Random country / region
    $countryObj = $countries[$random.Next(0, $countries.Count)]
    $region     = $countryObj.regions[$random.Next(0, $countryObj.regions.Count)]

    # Random product
    $prod     = $products[$random.Next(0, $products.Count)]
    $price    = $random.Next($prod.minPrice, $prod.maxPrice + 1)
    $quantity = $random.Next(1, 15)
    $revenue  = $price * $quantity
    $channel  = $channels[$random.Next(0, 2)]
    $store    = $storeNames[$random.Next(0, $storeNames.Count)]

    $rows += @{
        sale_date          = $date
        product_name       = $prod.name
        normalized_product = $prod.normalized
        category           = $prod.category
        quantity           = $quantity
        price              = $price
        revenue            = $revenue
        region             = $region
        channel            = $channel
        country            = $countryObj.name
        store_name         = $store
        user_id            = $userId
    }
}

Write-Host "Inserting in batches of 200..."
$batchSize  = 200
$batchCount = [math]::Ceiling($rows.Count / $batchSize)
$headers    = @{
    "apikey"        = $anonKey
    "Authorization" = "Bearer $userToken"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

$insertUrl = "$baseUrl/rest/v1/harmonized_sales"
$success   = 0
$failed    = 0

for ($b = 0; $b -lt $batchCount; $b++) {
    $start = $b * $batchSize
    $end   = [math]::Min($start + $batchSize, $rows.Count) - 1
    $batch = $rows[$start..$end]
    $body  = $batch | ConvertTo-Json -Compress

    try {
        Invoke-RestMethod -Uri $insertUrl -Method POST -Headers $headers -Body $body | Out-Null
        $success += $batch.Count
        Write-Host "Batch $($b+1)/$batchCount inserted ($($batch.Count) rows). Total: $success"
    } catch {
        $failed += $batch.Count
        Write-Host "Batch $($b+1) FAILED: $_"
    }
}

Write-Host ""
Write-Host "Done! Inserted: $success rows. Failed: $failed rows."
