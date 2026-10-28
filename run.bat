@echo off
title Smash Club - Luxury Badminton Splitter & MongoDB Atlas
echo ===================================================================
echo     SMASH CLUB - LUXURY BADMINTON SPLITTER & MONGODB ATLAS
echo ===================================================================
echo.
echo Starting MongoDB Atlas API (Port 5000) and Angular Web App (Port 4200)...
echo.
start "Smash Club API" cmd /k "node server.js"
start "Smash Club Angular" cmd /k "npx ng serve --port 4200 --open"
echo.
echo Services launched! Angular will open at http://localhost:4200
echo.
pause
