@echo off
rem filepath: c:\Users\donko\Music\HOSPITALFLASK\run.bat
echo Starting Hospital Management System...
echo.
echo 1. Activating virtual environment...
call venv\Scripts\activate
echo.

echo 2. Checking required packages...
python -m pip install -r requirements.txt
echo.

echo 3. Starting Flask server...
python app.py
echo.

rem If the server crashes, keep the window open
pause