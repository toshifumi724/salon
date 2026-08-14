@echo off
cd /d "%~dp0..\.."
node scripts\hotpepper-autofill\fill-blog.mjs --file scripts\hotpepper-autofill\my-blog.json
echo.
echo 終了しました。このウィンドウは閉じて構いません。
pause
