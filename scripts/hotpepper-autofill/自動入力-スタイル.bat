@echo off
cd /d "%~dp0..\.."
node scripts\hotpepper-autofill\fill-style.mjs --file scripts\hotpepper-autofill\my-style.json
echo.
echo 終了しました。このウィンドウは閉じて構いません。
pause
