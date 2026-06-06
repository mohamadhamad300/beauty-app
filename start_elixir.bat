@echo off
title Elixir AR Backend (Port 4001)
cd /d "G:\elixir\proj3_makup\beauty-app\ml_backend"
set PATH=H:\Elixir\bin;%PATH%
echo Starting Elixir AR Backend...
echo WebSocket: ws://10.0.0.23:4001/ws
echo.
mix run --no-halt
pause
