@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."

echo メモ帳が開きます。文章を書き換えて、保存してから閉じてください。
echo (閉じると自動でブラウザが開いて入力が始まります)
notepad "scripts\hotpepper-autofill\my-blog.json"

call npx --yes playwright install chromium
node scripts\hotpepper-autofill\fill-blog.mjs --file scripts\hotpepper-autofill\my-blog.json

echo.
echo 終了しました。このウィンドウは自動で閉じます。
timeout /t 8 /nobreak >nul
