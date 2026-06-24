$files = @('index.html', 'activities.html', 'activity.html', 'admin.html', 'data/activities.json', 'js/activities.js')

foreach ($file in $files) {
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $iso = [System.Text.Encoding]::GetEncoding('iso-8859-1')
        $utf8 = [System.Text.Encoding]::UTF8
        
        $text = $iso.GetString($bytes)
        $newBytes = $utf8.GetBytes($text)
        [System.IO.File]::WriteAllBytes($file, $newBytes)
        
        Write-Host "✓ $file"
    }
}
