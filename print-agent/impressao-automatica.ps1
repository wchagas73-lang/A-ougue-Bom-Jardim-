# Serviço local de impressão automática — Açougue Bom Jardim / Elgin i8
# Escuta somente em 127.0.0.1 e aceita chamadas do domínio do cardápio.
$ErrorActionPreference = "Stop"
$PrinterName = "Elgin i8"
$ListenUrl = "http://127.0.0.1:17891/"
$DataDir = Join-Path $env:ProgramData "BomJardimPrint"
$PrintedFile = Join-Path $DataDir "printed-orders.json"
$LogFile = Join-Path $DataDir "service.log"

New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
if (!(Test-Path $PrintedFile)) { "[]" | Set-Content -Path $PrintedFile -Encoding UTF8 }

# Registra o serviço para iniciar junto com o Windows, sem exigir nova configuração.
try {
  $startup = [Environment]::GetFolderPath("Startup")
  $shortcutPath = Join-Path $startup "Impressao automatica - Acougue Bom Jardim.lnk"
  if (!(Test-Path $shortcutPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $PSScriptRoot "iniciar-impressao.bat"
    $shortcut.WorkingDirectory = $PSScriptRoot
    $shortcut.WindowStyle = 7
    $shortcut.Description = "Impressao automatica dos pedidos do Acougue Bom Jardim"
    $shortcut.Save()
  }
} catch { Add-Content -Path $LogFile -Value ("Aviso: nao foi possivel criar atalho de inicializacao: " + $_.Exception.Message) -Encoding UTF8 }

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
  $amount = [decimal]0
  if ($Value -is [string]) {
    $parsed = [decimal]::TryParse([string]$Value, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$amount)
    if (!$parsed) { throw "Valor monetario invalido." }
  } else {
    $amount = [decimal]$Value
  }
  return ("R$ " + $amount.ToString("N2", [Globalization.CultureInfo]::GetCultureInfo("pt-BR")))
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

function Print-Order($Order, [string]$Html) {
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


  if (![string]::IsNullOrWhiteSpace($Html)) {
    # Usa o HTML produzido pelo mesmo construtor do botão manual no painel.
    $programFiles = [Environment]::GetFolderPath("ProgramFiles")
    $programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
    $edgeCandidates = @(
      (Join-Path $programFiles "Microsoft\Edge\Application\msedge.exe"),
      (Join-Path $programFilesX86 "Microsoft\Edge\Application\msedge.exe")
    ) | Where-Object { $_ -and (Test-Path $_) }
    $edgeCommand = Get-Command msedge.exe -ErrorAction SilentlyContinue
    $edgePath = if ($edgeCandidates.Count -gt 0) { $edgeCandidates[0] } elseif ($edgeCommand) { $edgeCommand.Source } else { $null }
    if (!$edgePath) { throw "Microsoft Edge nao encontrado. A impressao automatica com o layout completo precisa do Edge instalado." }
    $jobToken = [Guid]::NewGuid().ToString("N")
    $htmlPath = Join-Path $env:TEMP ("BomJardim-" + $jobToken + ".html")
    $profilePath = Join-Path $env:TEMP ("BomJardimEdge-" + $jobToken)
    try {
      [IO.File]::WriteAllText($htmlPath, $Html, ([System.Text.UTF8Encoding]::new($false)))
      $fileUri = ([Uri]$htmlPath).AbsoluteUri
      # Perfil isolado impede que uma janela Edge ja aberta capture o comando de impressao.
      $arguments = '--headless --disable-gpu --no-first-run --no-default-browser-check --disable-extensions --no-pdf-header-footer --user-data-dir="' + $profilePath + '" --print-to-printer="' + $PrinterName + '" "' + $fileUri + '"'
      $process = Start-Process -FilePath $edgePath -ArgumentList $arguments -PassThru -WindowStyle Hidden
      if (!$process.WaitForExit(60000)) {
        try { $process.Kill() } catch {}
        throw "O Edge demorou mais de 60 segundos para preparar a impressao."
      }
      if ($process.ExitCode -ne 0) { throw "O Edge retornou erro ao imprimir o comprovante (codigo $($process.ExitCode))." }
      Write-Log ("HTML do pedido enviado para " + $PrinterName + " usando o layout do painel.")
    } finally {
      if (Test-Path $htmlPath) { Remove-Item $htmlPath -Force -ErrorAction SilentlyContinue }
      if (Test-Path $profilePath) { Remove-Item $profilePath -Recurse -Force -ErrorAction SilentlyContinue }
    }
  } else {
  $text = Build-Receipt $Order
  $encoding = [Text.Encoding]::GetEncoding(860)
  $payload = New-Object System.Collections.Generic.List[byte]
  # ESC @: inicializa; ESC t 3: tabela PC860 para acentos em portugues.
  $payload.AddRange([byte[]](0x1B, 0x40, 0x1B, 0x74, 0x03))
  $payload.AddRange($encoding.GetBytes($text))
  # Avanca o papel e executa corte parcial.
  $payload.AddRange([byte[]](0x0A, 0x0A, 0x1D, 0x56, 0x42, 0x00))

  # Envia os bytes ESC/POS pela fila do Windows, usando a porta USB001 da impressora instalada.
  if (-not ("BomJardimPrintNative" -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct BomJardimDocInfo1 {
    public string pDocName;
    public string pOutputFile;
    public string pDatatype;
}

public static class BomJardimPrintNative {
    [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern int StartDocPrinter(IntPtr hPrinter, int level, ref BomJardimDocInfo1 docInfo);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr bytes, int count, out int written);
}
"@
  }

  $printerHandle = [IntPtr]::Zero
  if (-not [BomJardimPrintNative]::OpenPrinter($PrinterName, [ref]$printerHandle, [IntPtr]::Zero)) {
    throw "O Windows nao conseguiu abrir a fila da impressora '$PrinterName'. Verifique o nome e se ela esta pronta."
  }
  $jobStarted = $false
  $pageStarted = $false
  $buffer = [IntPtr]::Zero
  try {
    $docInfo = New-Object BomJardimDocInfo1
    $docInfo.pDocName = "Pedido Açougue Bom Jardim"
    $docInfo.pOutputFile = $null
    $docInfo.pDatatype = "RAW"
    $jobId = [BomJardimPrintNative]::StartDocPrinter($printerHandle, 1, [ref]$docInfo)
    if ($jobId -le 0) { throw "O Windows nao iniciou o trabalho de impressao (erro $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))." }
    $jobStarted = $true
    if (-not [BomJardimPrintNative]::StartPagePrinter($printerHandle)) {
      throw "O Windows nao conseguiu iniciar a pagina (erro $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
    }
    $pageStarted = $true
    $bytes = $payload.ToArray()
    $buffer = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
    [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $buffer, $bytes.Length)
    $written = 0
    if (-not [BomJardimPrintNative]::WritePrinter($printerHandle, $buffer, $bytes.Length, [ref]$written) -or $written -ne $bytes.Length) {
      throw "Falha ao enviar os dados para a fila USB da Elgin i8 (erro $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
    }
    if (-not [BomJardimPrintNative]::EndPagePrinter($printerHandle)) {
      throw "Falha ao finalizar a pagina de impressao."
    }
    $pageStarted = $false
    if (-not [BomJardimPrintNative]::EndDocPrinter($printerHandle)) {
      throw "Falha ao finalizar o trabalho de impressao."
    }
    $jobStarted = $false
  } finally {
    if ($buffer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::FreeHGlobal($buffer) }
    if ($pageStarted) { [void][BomJardimPrintNative]::EndPagePrinter($printerHandle) }
    if ($jobStarted) { [void][BomJardimPrintNative]::EndDocPrinter($printerHandle) }
    [void][BomJardimPrintNative]::ClosePrinter($printerHandle)
  }

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
  Write-Log "Servico iniciado em 127.0.0.1:17891; fila do Windows: $PrinterName."
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
      Send-Json $response 200 @{ ok = $true; printer = $PrinterName; transport = "edge-html-silent" } $origin
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
      $result = Print-Order $body.order $body.html
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
