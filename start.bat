@echo off
chcp 65001 >nul
title Grammaticus 启动器
cd /d "%~dp0"

echo ============================================
echo   Grammaticus - 英语学习助手 一键启动
echo ============================================
echo.

REM 使用项目自带的 Node.js 运行时(无需安装任何东西)
set "PATH=%~dp0.runtime\node;%PATH%"

REM 检查依赖是否已安装
if not exist "node_modules\better-sqlite3" (
    echo [1/3] 首次运行,正在安装依赖(需要联网,约 1-3 分钟^) ...
    call "%~dp0.runtime\node\npm.cmd" install --ignore-scripts --no-audit --no-fund --registry=https://registry.npmmirror.com
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败,请检查网络后重新运行本脚本。
        pause
        exit /b 1
    )
    REM 放置 better-sqlite3 预编译文件(避免本地编译)
    echo [1/3] 正在准备数据库组件 ...
    call "%~dp0.runtime\node\node.exe" "%~dp0scripts\install-better-sqlite3.mjs"
) else (
    echo [1/3] 依赖已安装,跳过。
)

REM 检查数据库是否已初始化
if not exist "data\grammaticus.db" (
    echo [2/3] 首次运行,正在导入单词和课文数据 ...
    call "%~dp0.runtime\node\npm.cmd" run seed
    call "%~dp0.runtime\node\npm.cmd" run seed-nce
) else (
    echo [2/3] 数据库已存在,跳过。
)

echo [3/3] 正在启动服务 ...
echo.
echo --------------------------------------------
echo   启动后浏览器会自动打开 http://localhost:5173
echo   关闭弹出的黑色命令行窗口即可停止服务
echo --------------------------------------------
echo.

REM 新窗口启动 dev 服务器,然后打开浏览器
start "Grammaticus 服务(关闭此窗口即停止)" cmd /k "cd /d %~dp0 && set PATH=%~dp0.runtime\node;%%PATH%% && %~dp0.runtime\node\npm.cmd run dev"
timeout /t 6 /nobreak >nul
start http://localhost:5173

echo 已启动!浏览器即将打开。
echo 如果页面打不开,请等待几秒后手动访问 http://localhost:5173
pause
