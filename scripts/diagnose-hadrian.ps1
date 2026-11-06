param([string]$OutFile = 'hadrian-diagnostic.json')
$ErrorActionPreference = 'Stop'

# Read-only. Chain metadata comes from the installed, pinned Rome registry.
$chainJson = node -e "import('@rome-protocol/registry').then(m=>console.log(JSON.stringify(m.getChain(200010))))"
if ($LASTEXITCODE -ne 0 -or -not $chainJson) { throw 'Cannot load pinned Rome registry' }
$chain = $chainJson | ConvertFrom-Json
if (-not $chain -or $chain.chainId -ne 200010) { throw 'Hadrian missing or chain ID mismatch' }

function Invoke-RomeRead([string]$Method) {
  $payload = @{ jsonrpc = '2.0'; id = 1; method = $Method; params = @() } | ConvertTo-Json -Compress
  $reply = Invoke-RestMethod -Uri $chain.rpcUrl -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 10
  if ($reply.error) { throw "RPC error for $Method" }
  return $reply.result
}

$result = [ordered]@{
  checkedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  source = 'installed @rome-protocol/registry v0.1.0; compare with upstream v0.3.0 before deployment'
  rpcUrl = $chain.rpcUrl
  expectedChainId = 200010
  explorerUrl = $chain.explorerUrl
  chainId = $null
  blockNumber = $null
  explorerHttpStatus = $null
  cpiInterface = 'DOCUMENTED_ONLY; no CPI transaction sent'
  errors = @()
}
try { $hex = Invoke-RomeRead 'eth_chainId'; $result.chainId = [Convert]::ToInt64($hex.Substring(2), 16) } catch { $result.errors += 'eth_chainId unavailable' }
try { $hex = Invoke-RomeRead 'eth_blockNumber'; $result.blockNumber = [Convert]::ToInt64($hex.Substring(2), 16) } catch { $result.errors += 'eth_blockNumber unavailable' }
try { $response = Invoke-WebRequest -Uri $chain.explorerUrl -Method Head -MaximumRedirection 0 -TimeoutSec 10 -UseBasicParsing; $result.explorerHttpStatus = [int]$response.StatusCode } catch { $result.errors += 'explorer unavailable' }
if ($result.chainId -ne 200010) { $result.errors += 'chain ID not verified as 200010' }
$result | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 -LiteralPath $OutFile
$result | ConvertTo-Json -Depth 5
if ($result.errors.Count -gt 0) { exit 2 }
