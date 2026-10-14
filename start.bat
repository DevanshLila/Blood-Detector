@echo off
echo ========================================================
echo   BloodTrace -- Optical Contamination Screening Simulator
echo   College-Level Medical Device Engineering Project
echo ========================================================
echo.
echo Starting local web server on port 8000...
start "" "http://localhost:8000"
python -m http.server 8000
