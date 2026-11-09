# Serviço local de impressão automática — Açougue Bom Jardim / Elgin i8
# Escuta somente em 127.0.0.1 e aceita chamadas do domínio do cardápio.
$ErrorActionPreference = "Stop"
$PrinterIp = "192.168.1.5"
$PrinterPort = 9100
$ListenUrl = "http://127.0.0.1:17891/"
$DataDir = Join-Path $env:ProgramData "BomJardimPrint"
$PrintedFile = Join-Path $DataDir "printed-orders.json"
$LogFile = Join-Path $DataDir "service.log"

New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
if (!(Test-Path $PrintedFile)) { "[]" | Set-Content -Path $PrintedFile -Encoding UTF8 }

function Write-Log([string]$Message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Send-Json($Response, [int]$Status, $Body, [string]$Origin) {
  $Response.StatusCode = $Status
  $Response.ContentType = "application/json; charset=utf-8"
  if ($Origin) { $Response.Headers["Access-Control-Allow-Origin"] = $Origin }
  $Response.Headers["Vary"] = "Origin"
  $Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
  $Response.Headers["Access-Control-Allow-Headers"] = "content-type"
  $Response.Headers["Access-Control-Allow-Private-Network"] = "true"
  $bytes = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 12 -Compress))
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.Close()
}

function Is-AllowedOrigin([string]$Origin) {
  if ([string]::IsNullOrWhiteSpace($Origin)) { return $false }
  try {
    $uri = [Uri]$Origin
    if ($uri.Scheme -eq "http" -and $uri.Host -in @("localhost", "127.0.0.1") -and $uri.Port -eq 5173) { return $true }
    return $uri.Scheme -eq "https" -and $uri.Host -match '^acougue-bom-jardim.*\.vercel\.app$'
  } catch { return $false }
}

function Add-ReceiptLine($Builder, [string]$Value = "") {
  [void]$Builder.AppendLine($Value)
}
function Wrap-Text([string]$Value, [int]$Width = 48) {
  $result = @()
  $remaining = ([string]$Value).Trim()
  while ($remaining.Length -gt $Width) {
    $cut = $remaining.LastIndexOf(" ", $Width)
    if ($cut -lt 1) { $cut = $Width }
    $result += $remaining.Substring(0, $cut).Trim()
    $remaining = $remaining.Substring($cut).Trim()
  }
  if ($remaining.Length -gt 0) { $result += $remaining }
  return $result
}
function Money([object]$Value) {
  return ("R$ {0:N2}" -f [decimal]$Value).Replace(".", "#").Replace(",", ".").Replace("#", ",")
}
function Build-Receipt($Order) {
  $b = New-Object System.Text.StringBuilder
  $width = 48
  Add-ReceiptLine $b ("=" * $width)
  Add-ReceiptLine $b "           ACOUGUE BOM JARDIM"
  Add-ReceiptLine $b ("=" * $width)
  $number = if ($Order.displayId) { $Order.displayId } else { "PEDIDO" }
  Add-ReceiptLine $b ("PEDIDO: " + $number)
  Add-ReceiptLine $b ("DATA: " + (Get-Date -Date $Order.createdAt -Format "dd/MM/yyyy HH:mm"))
  Add-ReceiptLine $b ("-" * $width)
  Add-ReceiptLine $b "CLIENTE"
  Add-ReceiptLine $b ([string]$Order.customer.name)
  Add-ReceiptLine $b ("Tel: " + [string]$Order.customer.phone)
  foreach ($line in (Wrap-Text ([string]$Order.customer.address) $width)) { Add-ReceiptLine $b $line }
  if ($Order.customer.reference) {
    Add-ReceiptLine $b "Referencia:"
    foreach ($line in (Wrap-Text ([string]$Order.customer.reference) $width)) { Add-ReceiptLine $b $line }
  }
  Add-ReceiptLine $b ("-" * $width)
  Add-ReceiptLine $b "PRODUTOS"
  foreach ($item in $Order.items) {
    foreach ($line in (Wrap-Text ([string]$item.name) $width)) { Add-ReceiptLine $b $line }
    $qty = [decimal]$item.qty
    $unit = [string]$item.unit
    $price = Money $item.price
    $lineTotal = Money $item.total
    $detail = ("{0} {1} x {2}" -f $qty.ToString("0.###"), $unit, $price)
    Add-ReceiptLine $b $detail
    Add-ReceiptLine $b ("  " + $lineTotal)
  }
  Add-ReceiptLine $b ("-" * $width)
  Add-ReceiptLine $b ("Produtos: " + (Money $Order.subtotal))
  Add-ReceiptLine $b ("Entrega:  " + (Money $Order.fee))
  Add-ReceiptLine $b ("=" * $width)
  Add-ReceiptLine $b ("TOTAL:    " + (Money $Order.total))
  Add-ReceiptLine $b ("-" * $width)
  Add-ReceiptLine $b ("PAGAMENTO: " + [string]$Order.payment)
  if ($Order.payment -eq "Dinheiro" -and $Order.customer.cashReceived -ne "") {
    Add-ReceiptLine $b ("Recebido: " + (Money $Order.customer.cashReceived))
    Add-ReceiptLine $b ("TROCO:    " + (Money $Order.customer.changeDue))
  }
  if ($Order.customer.notes) {
    Add-ReceiptLine $b ("-" * $width)
    Add-ReceiptLine $b "OBSERVACOES:"
    foreach ($line in (Wrap-Text ([string]$Order.customer.notes) $width)) { Add-ReceiptLine $b $line }
  }
  Add-ReceiptLine $b ("-" * $width)
  Add-ReceiptLine $b "       Documento interno da loja"
  Add-ReceiptLine $b ""
  Add-ReceiptLine $b ""
  return $b.ToString()
}

function Print-Order($Order) {
  $id = [string]$Order.id
  if ([string]::IsNullOrWhiteSpace($id) -or $id -notmatch '^[0-9a-fA-F-]{36}$') {
    throw "Identificador de pedido invalido."
  }
  $printed = @()
  try {
    $loaded = Get-Content -Path $PrintedFile -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($loaded) { $printed = @($loaded) }
  } catch { $printed = @() }
  if ($printed -contains $id) { return @{ success = $true; alreadyPrinted = $true } }
  if (!$Order.customer -or !$Order.items -or @($Order.items).Count -lt 1) {
    throw "Pedido sem dados completos para impressao."
  }

  $text = Build-Receipt $Order
  $encoding = [Text.Encoding]::GetEncoding(860)
  $payload = New-Object System.Collections.Generic.List[byte]
  # ESC @: inicializa; ESC t 3: tabela PC860 para acentos em portugues.
  $payload.AddRange([byte[]](0x1B, 0x40, 0x1B, 0x74, 0x03))
  $payload.AddRange($encoding.GetBytes($text))
  # Avanca o papel e executa corte parcial.
  $payload.AddRange([byte[]](0x0A, 0x0A, 0x1D, 0x56, 0x42, 0x00))

  $client = New-Object System.Net.Sockets.TcpClient
  $client.SendTimeout = 7000
  $client.ReceiveTimeout = 7000
  try {
    $async = $client.BeginConnect($PrinterIp, $PrinterPort, $null, $null)
    if (!$async.AsyncWaitHandle.WaitOne(7000, $false)) { throw "Tempo esgotado ao conectar na Elgin i8." }
    $client.EndConnect($async)
    $stream = $client.GetStream()
    $bytes = $payload.ToArray()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } finally {
    $client.Close()
  }

  # Grava o ID somente depois que os dados foram enviados; evita impressao duplicada em novas tentativas.
  $printed += $id
  $temp = $PrintedFile + ".tmp"
  ConvertTo-Json -InputObject @($printed) -Depth 3 | Set-Content -Path $temp -Encoding UTF8
  Move-Item -Path $temp -Destination $PrintedFile -Force
  Write-Log ("Impresso " + $id)
  return @{ success = $true; alreadyPrinted = $false }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($ListenUrl)
try {
  $listener.Start()
  Write-Log "Servico iniciado em 127.0.0.1:17891; impressora 192.168.1.5:9100."
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $origin = $request.Headers["Origin"]
    if (!(Is-AllowedOrigin $origin)) {
      Send-Json $response 403 @{ error = "Origem nao autorizada." } ""
      continue
    }
    if ($request.HttpMethod -eq "OPTIONS") {
      $response.StatusCode = 204
      $response.Headers["Access-Control-Allow-Origin"] = $origin
      $response.Headers["Vary"] = "Origin"
      $response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
      $response.Headers["Access-Control-Allow-Headers"] = "content-type"
      $response.Headers["Access-Control-Allow-Private-Network"] = "true"
      $response.Close()
      continue
    }
    if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/health") {
      Send-Json $response 200 @{ ok = $true; printer = $PrinterIp } $origin
      continue
    }
    if ($request.HttpMethod -ne "POST" -or $request.Url.AbsolutePath -ne "/print") {
      Send-Json $response 404 @{ error = "Rota nao encontrada." } $origin
      continue
    }
    try {
      $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
      $raw = $reader.ReadToEnd()
      $reader.Close()
      $body = $raw | ConvertFrom-Json
      $result = Print-Order $body.order
      Send-Json $response 200 $result $origin
    } catch {
      Write-Log ("Falha na impressao: " + $_.Exception.Message)
      Send-Json $response 500 @{ success = $false; error = $_.Exception.Message } $origin
    }
  }
} catch {
  Write-Log ("Servico encerrado: " + $_.Exception.Message)
  throw
} finally {
  if ($listener.IsListening) { $listener.Stop() }
  $listener.Close()
}
