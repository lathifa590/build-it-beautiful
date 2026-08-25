$f = 'e:\3. PRODUK DIGITAL\05 - Aplikasi dan Pengembangan\App\5. modul ajar generator\LOVABLE\Fase 4B.1\src\components\workspace\planning\StepCpTp.tsx'
$lines = Get-Content $f
$lines[0..438] | Set-Content $f
Write-Host "Done. Lines: $($lines[0..438].Count)"
