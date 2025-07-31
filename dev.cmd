@echo off
echo Starting WeatherProof Development Server (Windows)...
echo.
echo Using optimized settings for Windows file watching
echo.

REM Set environment variables for better hot reload on Windows
set WATCHPACK_POLLING=true
set CHOKIDAR_USEPOLLING=true
set NODE_ENV=development

REM Clear Next.js cache for fresh start (optional)
REM if exist .next (
REM     echo Clearing Next.js cache...
REM     rmdir /s /q .next 2>nul
REM )

echo Starting development server...
echo Press Ctrl+C to stop
echo.

npm run dev:windows