@echo off
set PATH=C:\Users\lenovo\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd;%PATH%
cd /d "C:\Users\lenovo\Downloads\virtual 5"
git add api\generate-plan.ts api\chat.ts src\lib\ai\providerAdapter.ts src\lib\schemas.ts
git commit -m "fix: live AI - fix Zod schema dueOffsetDays sign, markdown fence stripping, real chat AI, error logging"
git push origin main
echo PUSH_DONE

