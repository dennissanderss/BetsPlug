$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNjQ0NThmYS1mNTk1LTQ1ZmMtOWExNi05NWIzYzBmZmI0MTYiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzc3OTk3NTM0fQ.a1EBfFSFOw7KTnvjnGpdGK4_omi5IZUm7t79Ncjkn0s"

$body = '{"start":"2022-08-01","end":"2024-07-31","limit":100}'

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

$uri = "https://betsplug-production.up.railway.app/api/admin/regenerate-v81-historical"

for ($i = 1; $i -le 200; $i++) {
    try {
        $r = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body
        Write-Host ("[{0}] generated={1} failed={2} finished={3} elapsed={4}s" -f $i, $r.generated, $r.failed, $r.finished, $r.elapsed_seconds)
        if ($r.finished) {
            Write-Host "DONE"
            break
        }
    }
    catch {
        Write-Host ("[{0}] ERROR: {1}" -f $i, $_.Exception.Message)
        if ($_.Exception.Message -match "401") {
            Write-Host ""
            Write-Host "===> TOKEN VERLOPEN <==="
            Write-Host "Log opnieuw in op http://localhost:3001 als admin,"
            Write-Host "kopieer de nieuwe betsplug_token uit Local Storage,"
            Write-Host "vervang de token in regel 1 van regen.ps1, save, run opnieuw."
            break
        }
    }
    Start-Sleep -Seconds 5
}
