<#
.SYNOPSIS
    MicroFMT multi-screen launcher -- one click, always opens all 5 screen
    windows, and links them together.

.DESCRIPTION
    Always opens 5 browser windows -- one per platform screen slot -- no matter
    how many monitors are attached. Only the placement adapts: with 5 or more
    monitors each window gets its own monitor, fullscreen; with 2-4 the windows
    are shared out across the monitors by width; on a single monitor they are
    tiled on it.

    All windows share ONE browser profile and ONE session id, so the platform's
    cross-screen sync works: switching the recipient case on any screen updates
    every other screen, and the Home Console idle counter is a global truth
    rather than a per-window guess.

    WHY ONE SHARED PROFILE
    BroadcastChannel and localStorage are scoped to "same origin + same browser
    profile". Separate profiles are separate browser instances that cannot hear
    each other -- the linkage would silently do nothing (no error, just no sync).
    So every window must share a profile.

    WHY CDP FOR WINDOW PLACEMENT
    Sharing a profile means Chromium treats every launch after the first as a
    second instance and hands the command line to the running one, silently
    IGNORING --window-position / --window-size. Window placement is therefore done
    over the Chrome DevTools Protocol by launch.mjs (Browser.setWindowBounds),
    which can position each window of a single instance independently.

    WHAT IT DOES, IN ORDER
      1. Finds a Chromium browser (Chrome, then Edge).
      2. Enumerates the attached monitors and their positions.
      3. Checks whether the Vite dev server is reachable; starts it if not.
      4. Computes 5 window rectangles, one per screen slot, shared out across
         the attached monitors.
      5. Launches the browser with remote debugging on a shared profile.
      6. Hands the rectangles to launch.mjs, which creates and places the windows.

    NOTE ON ENCODING
    All text in this file is intentionally ASCII. Windows PowerShell 5.1 decodes
    .ps1 files as ANSI unless they carry a UTF-8 BOM, so any non-ASCII character
    here would be mangled at parse time.

.PARAMETER Port
    Vite dev server port. Default 3000 (matches package.json "dev" script).

.PARAMETER Url
    Full URL override. Takes precedence over -Port. The ?wall= parameter is
    appended automatically.

.PARAMETER ProjectDir
    MicroFMT project root, used only to start the dev server when it is not
    already running. Auto-detected from the script location when omitted: the
    script ships at <repo>/tools/multiscreen, so the repo root is two levels up.

.PARAMETER Mode
    auto | perScreen | tile5 | spread
      auto      : always 5 windows. Uses perScreen when there are at least 5
                  monitors, spread when there are 2-4, and tile5 on a single
                  monitor. This is the default, and the only mode that keeps all
                  5 slots on screen whatever the monitor count.
      perScreen : one window per monitor, filled to that monitor. Cannot exceed
                  the monitor count -- use spread to share monitors instead.
      tile5     : all 5 windows tiled on one monitor (3 on top, 2 below).
      spread    : 5 windows distributed across all monitors by monitor width,
                  each monitor taking at least one while windows last.

.PARAMETER BrowserPath
    Full path to chrome.exe / msedge.exe. Auto-detected when omitted.

.PARAMETER WindowCount
    Upper bound on the number of windows. Default 5. The platform has exactly
    5 screen slots, so values above 5 are clamped.

.PARAMETER CdpPort
    DevTools Protocol port used to place the windows. Default 9222.

.PARAMETER Windowed
    Do not go fullscreen. Windows are still sized to fill their rectangle, but
    keep the browser title bar and address bar. Note that tile5 and spread
    already force a normal window: a fullscreen window covers its entire monitor,
    so two windows sharing a monitor would overlap exactly.

.PARAMETER NoServe
    Do not start the dev server automatically. Fail instead if it is not up.

.PARAMETER Stop
    Close every simulated screen window and exit.

.PARAMETER CleanProfile
    Delete the browser profile before starting.

.EXAMPLE
    .\Start-MicroFMT-MultiScreen.ps1
    All 5 windows, linked. Fullscreen one-per-monitor on a 5+ monitor rig,
    shared across the monitors on 2-4, tiled on a single one.

.EXAMPLE
    .\Start-MicroFMT-MultiScreen.ps1 -Mode tile5
    Tile all 5 windows on one monitor (concurrency / stress test).

.EXAMPLE
    .\Start-MicroFMT-MultiScreen.ps1 -Stop
    Close all simulated screens.
#>
[CmdletBinding()]
param(
    [int]      $Port         = 3000,
    [string]   $Url          = '',
    [string]   $ProjectDir   = '',
    [ValidateSet('auto', 'perScreen', 'tile5', 'spread')]
    [string]   $Mode         = 'auto',
    [string]   $BrowserPath  = '',
    [int]      $WindowCount  = 5,
    [int]      $CdpPort      = 9222,
    [switch]   $Windowed,
    [switch]   $NoServe,
    [switch]   $Stop,
    [switch]   $CleanProfile
)

$ErrorActionPreference = 'Stop'

# The platform has exactly 5 screen slots (src/data/screenSlots.ts). A sixth
# window would have no module to host.
$MAX_SLOTS = 5

# Chromium draws a title bar and a resize border around the client area that
# --window-size describes. Subtract a typical allowance so a filled window does
# not spill past the monitor edge.
$FRAME_W = 16
$FRAME_H = 40
$MARGIN  = 4

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
function Write-Step { param($m) Write-Host "[*] $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "[+] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Fail { param($m) Write-Host "[x] $m" -ForegroundColor Red }
function Write-Dim  { param($m) Write-Host "    $m" -ForegroundColor DarkGray }

$ProfileRoot = Join-Path $PSScriptRoot 'profiles'
# One shared profile for every window -- required for cross-screen sync.
$WallProfile = Join-Path $ProfileRoot 'wall'
$LaunchScript = Join-Path $PSScriptRoot 'launch.mjs'

# ---------------------------------------------------------------------------
# Project root resolution
# ---------------------------------------------------------------------------
function Resolve-ProjectDir {
    param([string] $Explicit, [string] $ScriptRoot)

    if ($Explicit) { return $Explicit }

    # The script ships at <repo>/tools/multiscreen/, so the repo root is two
    # levels up. Fall back to the script's own folder (flat checkout) and only
    # then to a hard-coded path.
    $candidates = @(
        (Split-Path (Split-Path $ScriptRoot -Parent) -Parent)
        $ScriptRoot
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path (Join-Path $candidate 'package.json'))) {
            return $candidate
        }
    }
    return 'D:\vscode_code\microbiota'
}

# ---------------------------------------------------------------------------
# Browser discovery
# ---------------------------------------------------------------------------
function Find-Browser {
    param([string] $Explicit)

    if ($Explicit) {
        if (Test-Path $Explicit) { return $Explicit }
        throw "BrowserPath not found: $Explicit"
    }

    $candidates = @(
        (Join-Path $env:ProgramFiles       'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA       'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:ProgramFiles       'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe')
    )

    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) { return $c }
    }
    throw 'No Chromium based browser found. Pass -BrowserPath "<full path to chrome.exe or msedge.exe>".'
}

# ---------------------------------------------------------------------------
# Stop mode: kill every process that uses our profile directory
# ---------------------------------------------------------------------------
function Stop-SimulatedScreens {
    Write-Step 'Looking for simulated screen windows ...'
    $procs = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -like "*$ProfileRoot*" })

    if ($procs.Count -eq 0) {
        Write-Warn 'Nothing to close.'
        return
    }
    foreach ($p in $procs) {
        try {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
            Write-Ok "Closed PID $($p.ProcessId)"
        } catch {
            Write-Warn "Could not close PID $($p.ProcessId): $($_.Exception.Message)"
        }
    }
    Write-Ok "Closed $($procs.Count) process(es)."
}

if ($Stop) {
    Stop-SimulatedScreens
    return
}

# ---------------------------------------------------------------------------
# Monitor discovery
# ---------------------------------------------------------------------------
function Get-Screens {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    # Left-to-right physical order, which is what a user sees on the desk.
    return @([System.Windows.Forms.Screen]::AllScreens | Sort-Object { $_.Bounds.X }, { $_.Bounds.Y })
}

# ---------------------------------------------------------------------------
# Layout solvers. Each returns an array of @{ X; Y; W; H } client rectangles.
# ---------------------------------------------------------------------------

# One window per monitor, each filled to that monitor.
function Get-PerScreenLayout {
    param($Screens, [int] $Count)

    $out = @()
    for ($i = 0; $i -lt $Count; $i++) {
        # Guard: never wrap around onto an already occupied monitor, which would
        # stack two windows on the exact same rectangle. The caller clamps Count
        # to the monitor count; this is belt and braces.
        if ($i -ge $Screens.Count) { break }

        $s = $Screens[$i]
        $out += @{
            X = $s.Bounds.X + $MARGIN
            Y = $s.Bounds.Y + $MARGIN
            W = [Math]::Max(320, $s.Bounds.Width  - $FRAME_W - ($MARGIN * 2))
            H = [Math]::Max(240, $s.Bounds.Height - $FRAME_H - ($MARGIN * 2))
        }
    }
    return $out
}

# All windows tiled on one monitor: 3 across the top, the rest centered below.
function Get-TileLayout {
    param($Screen, [int] $Count)

    $bx = $Screen.Bounds.X
    $by = $Screen.Bounds.Y
    $bw = $Screen.Bounds.Width  - $FRAME_W
    $bh = $Screen.Bounds.Height - $FRAME_H

    $cols  = [Math]::Min(3, $Count)
    $rows  = [Math]::Ceiling($Count / $cols)
    $cellW = [int][Math]::Floor($bw / $cols)
    $cellH = [int][Math]::Floor($bh / $rows)

    $out = @()
    for ($i = 0; $i -lt $Count; $i++) {
        $row = [int][Math]::Floor($i / $cols)
        $col = $i % $cols
        # Center the last row so the block reads as a tidy grid.
        $inRow    = [Math]::Min($cols, $Count - ($row * $cols))
        $rowWidth = $inRow * $cellW
        $gx = [int][Math]::Floor(($bw - $rowWidth) / 2) + $col * $cellW
        $gy = $row * $cellH

        $out += @{
            X = $bx + $gx + $MARGIN
            Y = $by + $gy + $MARGIN
            W = $cellW - ($MARGIN * 2)
            H = $cellH - ($MARGIN * 2)
        }
    }
    return $out
}

# Distribute windows across monitors, split contiguously and proportionally to
# monitor width.
#
# Contiguous rather than round-robin, so slot numbering still reads left to
# right. A greedy "give the extra window to the widest monitor" loop is wrong
# here -- with two equally wide monitors Sort-Object always returns the same one,
# so every extra window piles onto the first monitor and the second ends up empty.
function Get-SpreadLayout {
    param($Screens, [int] $Count)

    $totalW = ($Screens | ForEach-Object { $_.Bounds.Width } | Measure-Object -Sum).Sum
    if (-not $totalW -or $totalW -le 0) { $totalW = $Screens.Count }

    $left  = $Count
    $quota = @()
    for ($gi = 0; $gi -lt $Screens.Count; $gi++) {
        $screensLeft = $Screens.Count - $gi
        if ($screensLeft -le 1) {
            $q = $left
        } else {
            $ideal = [int][Math]::Round($Count * $Screens[$gi].Bounds.Width / $totalW)
            # Leave at least one slot for every monitor still to be served.
            $q = [Math]::Max(1, [Math]::Min($ideal, $left - ($screensLeft - 1)))
        }
        $quota += $q
        $left  -= $q
    }

    $out  = @()
    $slot = 0
    for ($gi = 0; $gi -lt $Screens.Count; $gi++) {
        $n = $quota[$gi]
        if ($n -le 0) { continue }
        $s     = $Screens[$gi]
        $cellW = [int][Math]::Floor(($s.Bounds.Width - $FRAME_W) / $n)
        for ($k = 0; $k -lt $n; $k++) {
            if ($slot -ge $Count) { break }
            $out += @{
                X = $s.Bounds.X + ($k * $cellW) + $MARGIN
                Y = $s.Bounds.Y + $MARGIN
                W = $cellW - ($MARGIN * 2)
                H = $s.Bounds.Height - $FRAME_H - ($MARGIN * 2)
            }
            $slot++
        }
    }
    return $out
}

# ---------------------------------------------------------------------------
# Dev server
# ---------------------------------------------------------------------------
function Test-DevServer {
    param([string] $Target)
    try {
        $r = Invoke-WebRequest -Uri $Target -UseBasicParsing -TimeoutSec 4
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
    } catch {
        return $false
    }
}

function Start-DevServer {
    param([string] $Dir, [string] $Target, [int] $TimeoutSec = 150)

    if (-not (Test-Path $Dir)) { throw "ProjectDir not found: $Dir" }
    if (-not (Test-Path (Join-Path $Dir 'package.json'))) {
        throw "package.json not found in $Dir -- is this the MicroFMT project root?"
    }

    Write-Step 'Starting the dev server ...'
    Write-Dim '(a console window will open; keep it running while you demo)'

    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k npm run dev' -WorkingDirectory $Dir | Out-Null

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    Write-Host '    waiting for the server ' -NoNewline -ForegroundColor DarkGray
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        Write-Host '.' -NoNewline -ForegroundColor DarkGray
        if (Test-DevServer -Target $Target) {
            Write-Host ''
            return $true
        }
    }
    Write-Host ''
    return $false
}

# ===========================================================================
# Main
# ===========================================================================
Write-Host ''
Write-Host '  MicroFMT - multi-screen launcher' -ForegroundColor Magenta
Write-Host '  --------------------------------' -ForegroundColor DarkGray
Write-Host ''

$ProjectDir = Resolve-ProjectDir -Explicit $ProjectDir -ScriptRoot $PSScriptRoot

$browser = Find-Browser -Explicit $BrowserPath
Write-Ok "Browser  : $browser"

$screens = Get-Screens
if ($screens.Count -eq 0) { throw 'No monitor detected.' }
Write-Ok "Monitors : $($screens.Count) detected"
foreach ($s in $screens) {
    $tag = if ($s.Primary) { ' [primary]' } else { '' }
    Write-Dim ("{0}  {1}x{2} at {3},{4}{5}" -f $s.DeviceName, $s.Bounds.Width, $s.Bounds.Height, $s.Bounds.X, $s.Bounds.Y, $tag)
}

# ---- resolve mode and window count -----------------------------------------
$effectiveMode  = $Mode
$effectiveCount = [Math]::Min($WindowCount, $MAX_SLOTS)

if ($Mode -eq 'auto') {
    # Always all 5 screen slots. The demo exists to show every module at once, so
    # the window count must NOT follow the monitor count -- only the placement
    # adapts. Capping the count to the monitor count was the old behaviour, and
    # it left 3 of the 5 modules off the desk on a 2-monitor rig.
    $effectiveCount = [Math]::Min($WindowCount, $MAX_SLOTS)

    if ($screens.Count -ge $effectiveCount) {
        # Enough monitors to give every window its own, fullscreen.
        $effectiveMode = 'perScreen'
    } elseif ($screens.Count -ge 2) {
        # Fewer monitors than windows. Sharing monitors is still the right
        # answer -- the windows just cannot be fullscreen (see $wantFullscreen).
        $effectiveMode = 'spread'
    } else {
        # A single monitor cannot host a multi-screen demo, so tile all slots on
        # it -- the user still sees every module at once.
        $effectiveMode = 'tile5'
    }
    Write-Step "auto -> '$effectiveMode', $effectiveCount window(s) for $($screens.Count) monitor(s)"
}
elseif ($effectiveMode -eq 'perScreen') {
    $capped = [Math]::Min($effectiveCount, $screens.Count)
    if ($capped -lt $effectiveCount) {
        Write-Warn "perScreen capped from $effectiveCount to $capped window(s) -- only $($screens.Count) monitor(s) attached"
        Write-Dim "Use -Mode spread to keep all $effectiveCount windows and share monitors."
    }
    $effectiveCount = $capped
}

# ---- resolve target URL -----------------------------------------------------
$target = if ($Url) { $Url } else { "http://localhost:$Port/" }

# Every window carries the same session id. The app only enables cross-screen
# sync when ?wall= is present, so ordinary single-window use is unaffected.
$session = -join (1..8 | ForEach-Object { '0123456789abcdefghijklmnopqrstuvwxyz'[(Get-Random -Maximum 36)] })
$wallUrl = "${target}?wall=$session"
Write-Ok "Target   : $target"
Write-Ok "Session  : $session  (cross-screen sync ON)"

# ---- dependencies -----------------------------------------------------------
# A fresh clone has no node_modules, and `npm run dev` would fail immediately.
# Installing here is what makes "clone, double-click, it works" actually hold.
$nodeModules = Join-Path $ProjectDir 'node_modules'
$viteMarker  = Join-Path $nodeModules 'vite\package.json'

if (-not (Test-Path $viteMarker)) {
    $pkgMgr = if (Get-Command bun -ErrorAction SilentlyContinue) { 'bun' } else { 'npm' }
    Write-Warn "Dependencies are not installed in $ProjectDir"
    Write-Step "Running '$pkgMgr install' (first run only, may take a few minutes) ..."

    Start-Process -FilePath 'cmd.exe' -ArgumentList "/k $pkgMgr install" -WorkingDirectory $ProjectDir | Out-Null

    $installDeadline = (Get-Date).AddMinutes(15)
    Write-Host '    installing ' -NoNewline -ForegroundColor DarkGray
    while ((Get-Date) -lt $installDeadline) {
        Start-Sleep -Seconds 3
        Write-Host '.' -NoNewline -ForegroundColor DarkGray
        if (Test-Path $viteMarker) { break }
    }
    Write-Host ''

    if (-not (Test-Path $viteMarker)) {
        Write-Fail 'Dependency installation did not finish in time.'
        Write-Dim "Run '$pkgMgr install' manually in $ProjectDir, then try again."
        return
    }
    Write-Ok 'Dependencies installed.'
}

if (Test-DevServer -Target $target) {
    Write-Ok 'Dev server is already running.'
}
elseif ($NoServe) {
    Write-Fail "Nothing is serving $target, and -NoServe was given."
    Write-Dim "Start it yourself:  cd $ProjectDir; npm run dev"
    return
}
else {
    Write-Warn "Nothing is serving $target yet."
    if (-not (Start-DevServer -Dir $ProjectDir -Target $target)) {
        Write-Fail 'The dev server did not come up within the time limit.'
        Write-Dim 'Check the dev server console window for errors, then run this again.'
        return
    }
    Write-Ok 'Dev server is up.'
}

# ---- profile housekeeping ---------------------------------------------------
if ($CleanProfile -and (Test-Path $ProfileRoot)) {
    Write-Step 'Removing the browser profile ...'
    Remove-Item -Path $ProfileRoot -Recurse -Force -ErrorAction SilentlyContinue
}
if (-not (Test-Path $WallProfile)) {
    New-Item -ItemType Directory -Path $WallProfile -Force | Out-Null
}

# ---- solve layout -----------------------------------------------------------
switch ($effectiveMode) {
    'perScreen' { $layout = Get-PerScreenLayout -Screens $screens   -Count $effectiveCount }
    'tile5'     { $layout = Get-TileLayout      -Screen  $screens[0] -Count $effectiveCount }
    'spread'    { $layout = Get-SpreadLayout    -Screens $screens   -Count $effectiveCount }
    default     { throw "Unsupported mode: $effectiveMode" }
}

# A fullscreen window covers its entire monitor, so two windows sharing one
# monitor would overlap exactly -- the later one simply hides the earlier. Only
# perScreen guarantees exactly one window per monitor and can therefore go
# fullscreen. tile5 and spread depend on their rectangles surviving, which means
# a normal window. Without this, `auto` on 2-4 monitors would open all 5 windows
# and show the user only as many as there are monitors.
$wantFullscreen = (-not $Windowed) -and ($effectiveMode -eq 'perScreen')

# ---- launch the browser -----------------------------------------------------
$browserArgs = @(
    "--user-data-dir=`"$WallProfile`""
    "--remote-debugging-port=$CdpPort"
    # Chromium 111+ rejects DevTools websocket clients whose Origin header it does
    # not recognise. launch.mjs is a plain Node client, so allow all origins.
    '--remote-allow-origins=*'
    '--no-first-run'
    '--no-default-browser-check'
    '--disable-infobars'
    '--disable-session-crashed-bubble'
    # A tiled window is partially covered by its neighbours. Chromium treats a
    # covered window as occluded and throttles requestAnimationFrame, which would
    # freeze the three.js digital twin and the knowledge graph animations.
    '--disable-features=CalculateNativeWinOcclusion'
    '--disable-backgrounding-occluded-windows'
    '--disable-renderer-backgrounding'
    '--disable-background-timer-throttling'
    "--window-position=$($layout[0].X),$($layout[0].Y)"
    "--window-size=$($layout[0].W),$($layout[0].H)"
    $wallUrl
)

Write-Step 'Launching the browser ...'
Start-Process -FilePath $browser -ArgumentList ($browserArgs -join ' ') | Out-Null

# ---- place the windows over CDP ---------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
$nodeMajor = 0
if ($node) {
    try {
        $nodeMajor = [int]((((& node --version) 2>$null) -replace '^v', '') -split '\.')[0]
    } catch {
        $nodeMajor = 0
    }
}

$configPath = Join-Path ([System.IO.Path]::GetTempPath()) "microfmt-launch-$session.json"
$placedOk = $false

if (-not $node) {
    Write-Warn 'Node.js not found on PATH -- falling back to command-line placement.'
    Write-Dim 'Only the first window will be positioned; drag the rest by hand.'
    Write-Dim 'Cross-screen sync still works: all windows share one profile.'
    $placedOk = $true
}
elseif ($nodeMajor -lt 22) {
    # launch.mjs drives the DevTools Protocol over a WebSocket. Node only ships a
    # global WebSocket from v22 onwards; older releases die with
    # "WebSocket is not defined".
    Write-Warn "Node $nodeMajor detected -- automatic window placement needs Node 22 or newer."
    Write-Dim 'Falling back: only the first window is positioned, drag the rest by hand.'
    Write-Dim 'Cross-screen sync still works. Install Node 22+ for automatic placement.'
    $placedOk = $true
}
elseif (-not (Test-Path $LaunchScript)) {
    Write-Warn "launch.mjs not found at $LaunchScript -- falling back to command-line placement."
    $placedOk = $true
}
else {
    $config = @{
        cdpPort    = $CdpPort
        url        = $wallUrl
        fullscreen = $wantFullscreen
        rects      = @($layout | ForEach-Object { @{ x = $_.X; y = $_.Y; w = $_.W; h = $_.H } })
    }
    # Write WITHOUT a BOM: Node's JSON.parse chokes on a leading U+FEFF.
    $json = $config | ConvertTo-Json -Depth 6 -Compress
    [System.IO.File]::WriteAllText($configPath, $json, (New-Object System.Text.UTF8Encoding($false)))

    Write-Step 'Placing the windows over the DevTools Protocol ...'
    $nodeOut = & node $LaunchScript $configPath 2>&1
    $nodeExit = $LASTEXITCODE

    if ($nodeExit -eq 0) {
        $placedOk = $true
        foreach ($line in @($nodeOut)) {
            $text = "$line".Trim()
            if (-not $text) { continue }
            try {
                $parsed = $text | ConvertFrom-Json
                foreach ($w in @($parsed.windows)) {
                    Write-Ok ("Window {0}  {1}x{2} at {3},{4}{5}" -f `
                        $w.screen, $w.w, $w.h, $w.x, $w.y, $(if ($wantFullscreen) { '  fullscreen' } else { '' }))
                }
            } catch {
                Write-Dim $text
            }
        }
    } else {
        Write-Warn 'Window placement over CDP failed. Windows are open but not positioned.'
        foreach ($line in @($nodeOut)) {
            $text = "$line".Trim()
            if ($text) { Write-Dim $text }
        }
    }
    Remove-Item -Path $configPath -Force -ErrorAction SilentlyContinue
}

# ---- next steps -------------------------------------------------------------
Write-Host ''
if ($placedOk) {
    Write-Ok "$effectiveCount window(s) ready."
} else {
    Write-Warn 'Windows are open but may need manual positioning.'
}
Write-Host ''

if ($effectiveCount -lt $MAX_SLOTS) {
    Write-Warn "Only $effectiveCount of $MAX_SLOTS screen slots are on screen."
    Write-Dim 'The remaining modules stay reachable from the Home Console entry cards.'
    Write-Dim "To see all $MAX_SLOTS at once, re-run with -Mode spread (shares the monitors)."
    Write-Host ''
}

Write-Host '  NEXT STEP' -ForegroundColor Magenta
Write-Host '  Every window shows the Home Console. Inside each window click ONE' -ForegroundColor Gray
Write-Host '  dispatch entry card -- that module loads onto that window.' -ForegroundColor Gray
Write-Host ''
Write-Host '      Screen 1  ->  Workbench Cockpit      (3D digital twin)'      -ForegroundColor White
Write-Host '      Screen 2  ->  Patient Precision      (microbiome graph)'     -ForegroundColor White
Write-Host '      Screen 3  ->  Donor Matching         (six-axis radar)'       -ForegroundColor White
Write-Host '      Screen 4  ->  Efficacy Tracker       (four-track timeline)'  -ForegroundColor White
Write-Host '      Screen 5  ->  Historical Library     (similar case search)'  -ForegroundColor White
Write-Host ''
Write-Host '  LINKED ACROSS SCREENS' -ForegroundColor Magenta
Write-Host '  Changing the recipient case in the top bar updates every screen,' -ForegroundColor Gray
Write-Host '  and the Home Console idle counter reflects all screens at once.' -ForegroundColor Gray
Write-Host '  Which module each screen shows stays local -- that is by design.' -ForegroundColor Gray
Write-Host ''
Write-Host '  Close everything :  .\Start-MicroFMT-MultiScreen.ps1 -Stop' -ForegroundColor DarkGray
Write-Host '  Profile lives in :  ' -NoNewline -ForegroundColor DarkGray
Write-Host $WallProfile -ForegroundColor DarkGray
Write-Host ''
