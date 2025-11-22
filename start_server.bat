@echo off
chcp 65001 >nul
setlocal ENABLEDELAYEDEXPANSION
set PYTHONUTF8=1

title JsonFlow – API Flask Starter

echo =====================================================
echo 🚀 Lancement du serveur Flask
echo =====================================================
echo.

REM === Vérifie la présence de Python ===
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo ❌ Python n'est pas installé ou non trouvé dans le PATH.
    pause
    exit /b
)

REM === Vérifie si l'environnement virtuel existe ===
IF NOT EXIST ".venv\" (
    echo 🔧 Création de l'environnement virtuel...
    python -m venv .venv
    IF ERRORLEVEL 1 (
        echo ❌ Erreur lors de la création du venv.
        pause
        exit /b
    )

    echo 📦 Installation des dépendances...
    call .venv\Scripts\activate
    python -m pip install --upgrade pip setuptools wheel
    IF EXIST requirements.txt (
        pip install -r requirements.txt
    )
) ELSE (
    echo ✅ Environnement virtuel détecté.
)

REM === Active l'environnement virtuel ===
echo 🟢 Activation de l'environnement virtuel...
call .venv\Scripts\activate

REM === Démarre le serveur Flask dans la même fenêtre ===
echo 🚀 Démarrage du serveur Flask...
python main.py

pause