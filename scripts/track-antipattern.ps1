# track-antipattern.ps1
# 반복 실수를 추적하고, 3회 이상이면 commit-msg hook에 경고 키워드 추가.
#
# 사용법:
#   .\scripts\track-antipattern.ps1 -Pattern "any 타입 사용" -File "src/foo.ts"

param(
  [Parameter(Mandatory)][string]$Pattern,
  [string]$File = "",
  [string]$LogPath = ".claude/antipattern-log.json"
)

# 로그 읽기
$log = @{}
if (Test-Path $LogPath) {
  $log = Get-Content $LogPath -Raw | ConvertFrom-Json -AsHashtable
}

$key = $Pattern.ToLower().Trim()
$count = ($log[$key] ?? 0) + 1
$log[$key] = $count

# 저장
$log | ConvertTo-Json -Depth 3 | Out-File $LogPath -Encoding utf8

Write-Host "패턴 '$Pattern' — 누적 $count 회"

if ($count -ge 3) {
  Write-Host "⚠️  3회 이상 반복됨. commit-msg hook에 경고 키워드를 추가해야 해요."
  Write-Host "   CLAUDE.md §Anti-Patterns 섹션에도 추가를 고려하세요."
  Write-Host ""
  Write-Host "   예시 추가 구문 (commit-msg hook):"
  Write-Host "   if echo `"`$MSG`" | grep -qiE `"$key`"; then"
  Write-Host "     echo `"⚠️  Anti-Pattern 감지: $Pattern`""
  Write-Host "   fi"
}
