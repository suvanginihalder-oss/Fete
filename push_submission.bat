@echo off
set PATH=C:\Users\lenovo\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd;%PATH%
cd /d "C:\Users\lenovo\Downloads\virtual 5"
git add DEPLOYMENT_AND_GENAI_SUBMISSION.txt
git commit -m "docs: expand submission answers to 1000 words each"
git push origin main
echo DONE

