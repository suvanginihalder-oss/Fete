@echo off
set PATH=C:\Users\lenovo\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd;%PATH%
del /f /q commit.bat push_repo.bat 2>nul
git add -A
git commit -m "chore: clean build scripts and normalize line endings"
git push origin main
git status
del /f /q sync.bat 2>nul
