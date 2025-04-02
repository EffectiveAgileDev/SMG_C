@echo off
REM Test Supabase Configuration Script

echo Testing Supabase Configuration...

REM Test 1: No environment variables (should fail)
echo.
echo Test 1: Missing environment variables
set VITE_SUPABASE_URL=
set VITE_SUPABASE_ANON_KEY=
call npm test

REM Test 2: Only URL set (should fail)
echo.
echo Test 2: Only URL set
set VITE_SUPABASE_URL=https://[SMG_C]supabase.co
set VITE_SUPABASE_ANON_KEY=
call npm test

REM Test 3: Only ANON_KEY set (should fail)
echo.
echo Test 3: Only ANON_KEY set
set VITE_SUPABASE_URL=
set VITE_SUPABASE_ANON_KEY=[eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubWdmaG5zbWtjZ3lzYmNteWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTQwMjMsImV4cCI6MjA1OTE5MDAyM30.ghINEpHxRqiTypvfMA59qjKVU9HUrtU6zmouDzljaE8]
call npm test

REM Test 4: Both variables set (should succeed)
echo.
echo Test 4: All variables set
set VITE_SUPABASE_URL=https://[SMG_C]supabase.co
set VITE_SUPABASE_ANON_KEY=[eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubWdmaG5zbWtjZ3lzYmNteWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTQwMjMsImV4cCI6MjA1OTE5MDAyM30.ghINEpHxRqiTypvfMA59qjKVU9HUrtU6zmouDzljaE8]
call npm test

echo.
echo Note: Replace [YOUR-PROJECT-ID] with your actual Supabase project ID
echo       Replace [YOUR-ANON-KEY] with your actual anon key
echo       Both can be found in your Supabase dashboard under Project Settings > API
pause 