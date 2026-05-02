# Deploy / update Trohub lên Ubuntu qua SSH + Docker.
# Yêu cầu: OpenSSH Client, ssh key tới server.
#
# Cập nhật code giữ nguyên .env (và mật khẩu DB):
#   .\deploy\push-to-server.ps1 -KeepEnv
#
# Đổi host/domain công khai (ảnh hưởng CORS + build Vite):
#   .\deploy\push-to-server.ps1 -PublicHost "your.domain.com" -KeepEnv
#   (Với -KeepEnv bạn phải tự sửa VITE_SERVER_URL / CLIENT_URL trong .env.docker trên server rồi build lại web.)
#
# Domain + HTTPS (Cloudflare Tunnel, không có cổng trong URL):
#   .\deploy\push-to-server.ps1 -Server "your.vps.ip" -PublicHost "trohub.online" -UseHttps
#   → VITE_SERVER_URL=https://api.trohub.online/api/v1, CLIENT_URL=https://trohub.online
#   Ghi đè subdomain API:  -ApiPublicHost "api.trohub.online"

param(
    [string] $Server = "10.0.150.63",
    [string] $User = "ubuntu",
    [string] $RemoteDir = "/home/ubuntu/trohub",
    [string] $PublicHost = "10.0.150.63",
    [string] $ApiPublicHost = "",
    [int] $ApiPort = 5001,
    [int] $WebPort = 8080,
    [switch] $KeepEnv,
    [switch] $UseHttps
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$tgz = Join-Path $env:TEMP "trohub-deploy.tgz"

Push-Location $ProjectRoot
try {
    if (Test-Path $tgz) { Remove-Item $tgz -Force }
    tar -czf $tgz --exclude=node_modules --exclude=.git --exclude=.env.docker --exclude=client/node_modules --exclude=server/node_modules --exclude=client/dist --exclude=*.tgz .
}
finally {
    Pop-Location
}

$envTmp = $null
if (-not $KeepEnv) {
    $pgPass = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
    $jwtBytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
    $jwtSecret = [Convert]::ToBase64String($jwtBytes)
    if ($UseHttps) {
        $apiHost = if ($ApiPublicHost) { $ApiPublicHost } else { "api.$PublicHost" }
        $viteUrl = "https://${apiHost}/api/v1"
        $clientUrl = "https://${PublicHost}"
        $payReturn = "https://${PublicHost}/thanh-toan/"
        $vnpReturn = "https://${apiHost}/api/v1/payment/vnpay-return"
        $momoRedirect = $payReturn
        $momoIpn = "https://${apiHost}/api/v1/payment/momo-ipn"
    } else {
        $viteUrl = "http://${PublicHost}:${ApiPort}/api/v1"
        $clientUrl = "http://${PublicHost}:${WebPort}"
        $payReturn = "http://${PublicHost}:${WebPort}/thanh-toan/"
        $vnpReturn = ""
        $momoRedirect = ""
        $momoIpn = ""
    }
    $lines = @(
        "POSTGRES_DB=phongtroxanh",
        "POSTGRES_USER=postgres",
        "POSTGRES_PASSWORD=$pgPass",
        "",
        "API_PORT=$ApiPort",
        "WEB_PORT=$WebPort",
        "",
        "VITE_SERVER_URL=$viteUrl",
        "VITE_CLIENT_GG_ID=",
        "VITE_DROPBOX_API=",
        "VITE_EXCHANGERATE_API=",
        "VITE_PAYPAL_CLIENT_ID=",
        "VITE_PRICE_OF_POST_PER_DAY=",
        "",
        "PORT=$ApiPort",
        "NODE_ENV=production",
        "CLIENT_URL=$clientUrl",
        "CLIENT_PAYMENT_RETURN_URL=$payReturn",
        "JWT_SECRET=$jwtSecret",
        "",
        "DB_DIALECT=postgres",
        "DB_SSL=false",
        "",
        "SMTP_HOST=", "SMTP_PORT=", "SMTP_USER=", "SMTP_PASS=",
        "",
        "VNP_TMNCODE=", "VNP_HASHSECRET=", "VNP_URL=", "VNP_BANKCODE=",
        $(if ($UseHttps) { "VNP_RETURN_URL=$vnpReturn" } else { "VNP_RETURN_URL=" }),
        "",
        "MOMO_PARTNER_CODE=", "MOMO_ACCESS_KEY=", "MOMO_SECRET_KEY=", "MOMO_PARTNER_NAME=",
        "MOMO_STORE_ID=", "MOMO_ENDPOINT=",
        $(if ($UseHttps) { "MOMO_REDIRECT_URL=$momoRedirect" } else { "MOMO_REDIRECT_URL=" }),
        $(if ($UseHttps) { "MOMO_IPN_URL=$momoIpn" } else { "MOMO_IPN_URL=" }),
        "",
        "TWILLO_ACCOUNT_SSD=", "TWILLO_AUTH_TOKEN=", "TWILLO_SERVICE_SID="
    )
    $envTmp = Join-Path $env:TEMP "phong-tro-xanh.env.docker"
    [System.IO.File]::WriteAllText($envTmp, ($lines -join "`n"), [System.Text.UTF8Encoding]::new($false))
}

$remoteSh = Join-Path $env:TEMP "phong-tro-xanh-remote.sh"
$remoteBody = @"
set -e
mkdir -p '$RemoteDir'
cd '$RemoteDir'
if [ -f docker-compose.yml ]; then
  docker compose --env-file .env.docker down 2>/dev/null || true
fi
tar -xzf /tmp/phong-tro-xanh-deploy.tgz
if [ -f /tmp/phong-tro-xanh.env.docker ]; then
  mv /tmp/phong-tro-xanh.env.docker .env.docker
  chmod 600 .env.docker
fi
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
"@
[System.IO.File]::WriteAllText($remoteSh, $remoteBody.Replace("`r`n", "`n"), [System.Text.UTF8Encoding]::new($false))

Write-Host "Uploading..."
scp -q $tgz "${User}@${Server}:/tmp/phong-tro-xanh-deploy.tgz"
scp -q $remoteSh "${User}@${Server}:/tmp/phong-tro-xanh-remote.sh"
if ($envTmp) {
    scp -q $envTmp "${User}@${Server}:/tmp/phong-tro-xanh.env.docker"
}

ssh "${User}@${Server}" "bash -lc 'bash /tmp/phong-tro-xanh-remote.sh'"

if ($UseHttps) {
    $ah = if ($ApiPublicHost) { $ApiPublicHost } else { "api.$PublicHost" }
    Write-Host "Done. Web: https://${PublicHost}  API: https://${ah}"
} else {
    Write-Host "Done. Web: http://${PublicHost}:${WebPort}  API: http://${PublicHost}:${ApiPort}"
}
if (-not $KeepEnv) {
    Write-Host "New secrets on server: $RemoteDir/.env.docker - back up this file."
}
