@echo off
rem Obre el joc amb Microsoft Edge (que sol tenir veu catalana). Ruta relativa: funciona a qualsevol ordinador.
set "JOC=%~dp0src\index.html"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%JOC%"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%JOC%"
) else (
  start "" "%JOC%"
)
