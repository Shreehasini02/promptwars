@echo off
echo.
echo  ✈  TravelCopilot - Full Stack Setup
echo  =====================================
echo.

echo [1/4] Installing Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 ( echo ERROR: Backend install failed & pause & exit /b 1 )
echo  Backend ready!
echo.

echo [2/4] Installing Frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 ( echo ERROR: Frontend install failed & pause & exit /b 1 )
echo  Frontend ready!
echo.

echo [3/4] Starting Backend (port 5000)...
cd ..\backend
start "TravelCopilot Backend" cmd /k "npm run dev"
timeout /t 2 /nobreak > nul

echo [4/4] Starting Frontend (port 5173)...
cd ..\frontend
start "TravelCopilot Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo  All done! Open your browser at:
echo  http://localhost:5173
echo.
pause
