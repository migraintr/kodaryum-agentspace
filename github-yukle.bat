@echo off
setlocal EnableExtensions
title Kodaryum AgentSpace - GitHub Yukleme

:: =========================================================
:: AYARLAR
:: =========================================================

set "REPO=https://github.com/migraintr/kodaryum-agentspace.git"
set "BRANCH=main"

:: =========================================================
:: BASLANGIC
:: =========================================================

cls
echo.
echo ========================================================
echo        KODARYUM AGENTSPACE - GITHUB YUKLEME
echo ========================================================
echo.
echo Proje:
echo %CD%
echo.
echo GitHub:
echo %REPO%
echo.
echo ========================================================
echo.

:: Git kontrolu
where git >nul 2>&1

if errorlevel 1 (
    echo [HATA] Git bilgisayarda bulunamadi!
    echo.
    echo Git'i kurman gerekiyor:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [OK] Git bulundu.
echo.

:: =========================================================
:: .git KONTROL
:: =========================================================

if not exist ".git\" (
    echo [1/6] Git deposu olusturuluyor...
    git init

    if errorlevel 1 (
        echo.
        echo [HATA] Git deposu olusturulamadi.
        pause
        exit /b 1
    )
) else (
    echo [1/6] Git deposu zaten mevcut.
)

echo.

:: =========================================================
:: .gitignore KONTROL
:: =========================================================

if not exist ".gitignore" (
    echo [2/6] .gitignore olusturuluyor...

    (
        echo node_modules/
        echo .env
        echo .env.*
        echo !.env.example
        echo dist/
        echo build/
        echo .DS_Store
        echo Thumbs.db
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
        echo .firebase/
    ) > .gitignore

    echo [OK] .gitignore olusturuldu.
) else (
    echo [2/6] .gitignore zaten mevcut.
)

echo.

:: =========================================================
:: DOSYALARI EKLE
:: =========================================================

echo [3/6] Dosyalar Git'e ekleniyor...
git add .

if errorlevel 1 (
    echo.
    echo [HATA] Dosyalar eklenemedi.
    pause
    exit /b 1
)

echo [OK] Dosyalar eklendi.
echo.

:: =========================================================
:: DEGISIKLIK KONTROLU
:: =========================================================

git diff --cached --quiet

if errorlevel 1 (
    echo [4/6] Commit olusturuluyor...

    for /f "tokens=1-3 delims=." %%a in ("%date%") do set "TARIH=%%a-%%b-%%c"

    git commit -m "Guncelleme %date% %time%"

    if errorlevel 1 (
        echo.
        echo [HATA] Commit olusturulamadi.
        pause
        exit /b 1
    )

    echo [OK] Commit olusturuldu.
) else (
    echo [4/6] Yeni degisiklik yok.
)

echo.

:: =========================================================
:: BRANCH
:: =========================================================

echo [5/6] Branch kontrol ediliyor...

git branch -M %BRANCH%

echo [OK] Branch: %BRANCH%
echo.

:: =========================================================
:: REMOTE
:: =========================================================

git remote get-url origin >nul 2>&1

if errorlevel 1 (
    echo GitHub remote ekleniyor...
    git remote add origin %REPO%
) else (
    echo Mevcut GitHub remote kontrol ediliyor...
    git remote set-url origin %REPO%
)

echo [OK] GitHub remote:
echo %REPO%
echo.

:: =========================================================
:: PUSH
:: =========================================================

echo [6/6] GitHub'a yukleniyor...
echo.
echo --------------------------------------------------------
echo.

git push -u origin %BRANCH%

if errorlevel 1 (
    echo.
    echo ========================================================
    echo [HATA] GitHub'a yukleme basarisiz!
    echo ========================================================
    echo.
    echo Olası nedenler:
    echo.
    echo 1. GitHub girisi yapilmamis olabilir.
    echo 2. GitHub yetkilendirmesi gerekiyor olabilir.
    echo 3. Internet baglantisi olmayabilir.
    echo 4. GitHub reposunda farkli bir commit olabilir.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo                 BASARILI!
echo ========================================================
echo.
echo Proje GitHub'a yuklendi.
echo.
echo Repo:
echo %REPO%
echo.
echo Branch:
echo %BRANCH%
echo.
echo ========================================================
echo.
pause