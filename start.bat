@echo off
echo Starting Febri Store Development Server...
echo.
echo Make sure you have:
echo 1. Node.js installed
echo 2. Expo CLI installed (npm install -g @expo/cli)
echo 3. Firebase project configured
echo.
pause
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting Expo development server...
call npx expo start
pause