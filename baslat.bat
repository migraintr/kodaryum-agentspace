@echo off
chcp 65001 >nul
rem Kodaryum AgentSpace - tek tikla baslat (Windows). Cift tiklayin; klasor yoksa indirir, varsa gunceller.
setlocal
set REPO=https://github.com/migraintr/kodaryum-agentspace.git
set BRANCH=claude/magical-meitner-08pyrq
set DIR=%~dp0kodaryum-agentspace

rem Bu dosya zaten proje klasorunun icindeyse onu kullan
if exist "%~dp0package.json" set DIR=%~dp0

where git >nul 2>nul || (echo Git bulunamadi. https://git-scm.com adresinden kurun. & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js bulunamadi. https://nodejs.org adresinden kurun. & pause & exit /b 1)

if not exist "%DIR%\package.json" (
  echo Proje indiriliyor...
  git clone %REPO% "%DIR%" || (pause & exit /b 1)
)
cd /d "%DIR%"
git fetch origin %BRANCH% && git checkout %BRANCH% && git pull origin %BRANCH%
call npm install || (pause & exit /b 1)

rem Sunucu acildiktan sonra tarayiciyi ac
start "" cmd /c "timeout /t 4 >nul & start http://localhost:5173"
call npm run dev
pause
