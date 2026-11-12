@echo off
chcp 65001 >nul
echo.
echo   Grammaticus 公网隧道 — 免费, 不用买服务器
echo   ────────────────────────────────────────────
echo.
echo   确保本地开发服务器已启动 (http://localhost:5173)
echo   如果没启动, 先双击项目里的 start.bat
echo.
echo   正在连接 pinggy.link ...
echo.
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 0:localhost:5173 -p 443 a.pinggy.link
echo.
echo   隧道已断开。按任意键退出。
pause >nul