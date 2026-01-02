param(
    [string]$Path = "."
)

Write-Host "Arborescence du projet : $(Resolve-Path $Path)`n"

Get-ChildItem -Recurse $Path |
    ForEach-Object {
        $level = $_.FullName.Replace((Resolve-Path $Path), "").Split("\").Count - 1
        $indent = " " * ($level * 4)
        Write-Host "$indent- $($_.Name)"
    }
