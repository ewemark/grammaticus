/**
 * 安装 better-sqlite3 预编译二进制文件(Windows 一键启动用)
 *
 * npm install --ignore-scripts 不会下载原生模块的二进制文件,
 * 本脚本从 npmmirror 国内镜像下载与当前 Node ABI 匹配的预编译文件并放置到位。
 * 已存在时跳过。
 *
 * 运行: node scripts/install-better-sqlite3.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projRoot = path.resolve(__dirname, '..')
const bsDir = path.join(projRoot, 'node_modules', 'better-sqlite3')
const target = path.join(bsDir, 'build', 'Release', 'better_sqlite3.node')

if (fs.existsSync(target)) {
  // Verify it actually loads
  try {
    const mod = await import('better-sqlite3')
    const db = new mod.default(':memory:')
    db.close()
    console.log('[install-better-sqlite3] 已安装且可加载,跳过。')
    process.exit(0)
  } catch {
    console.log('[install-better-sqlite3] 现有文件无法加载,重新下载…')
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(bsDir, 'package.json'), 'utf-8'))
const version = pkg.version
const abi = process.versions.modules // e.g. '137' for Node 24
const platform = process.platform === 'win32' ? 'win32' : process.platform
const arch = process.arch

const filename = `better-sqlite3-v${version}-node-v${abi}-${platform}-${arch}.tar.gz`
const mirrors = [
  `https://registry.npmmirror.com/-/binary/better-sqlite3/v${version}/${filename}`,
  `https://github.com/WiseLibs/better-sqlite3/releases/download/v${version}/${filename}`,
]

const tmpDir = path.join(projRoot, 'node_modules', '.bs3-install')
fs.mkdirSync(tmpDir, { recursive: true })
const tmpFile = path.join(tmpDir, filename)

let downloaded = false
for (const url of mirrors) {
  try {
    console.log(`[install-better-sqlite3] 下载: ${url}`)
    execSync(`curl.exe -sL --connect-timeout 30 --retry 2 -o "${tmpFile}" "${url}"`, { stdio: 'inherit' })
    if (fs.existsSync(tmpFile) && fs.statSync(tmpFile).size > 100_000) {
      downloaded = true
      break
    }
  } catch (err) {
    console.warn(`[install-better-sqlite3] 镜像失败: ${err.message}`)
  }
}

if (!downloaded) {
  console.error('[install-better-sqlite3] 所有镜像下载失败。请检查网络后重试。')
  process.exit(1)
}

// Extract (tar is built into Windows 10+)
execSync(`tar -xzf "${tmpFile}" -C "${tmpDir}"`, { stdio: 'inherit' })
const extracted = path.join(tmpDir, 'build', 'Release', 'better_sqlite3.node')
if (!fs.existsSync(extracted)) {
  console.error('[install-better-sqlite3] 解压后未找到 better_sqlite3.node')
  process.exit(1)
}

fs.mkdirSync(path.dirname(target), { recursive: true })
fs.copyFileSync(extracted, target)
fs.rmSync(tmpDir, { recursive: true, force: true })

// Final verification
try {
  const mod = await import('better-sqlite3')
  const db = new mod.default(':memory:')
  const r = db.prepare('SELECT 1 AS ok').get()
  db.close()
  console.log(`[install-better-sqlite3] ✓ 安装成功 (验证: ${JSON.stringify(r)})`)
} catch (err) {
  console.error(`[install-better-sqlite3] 安装后验证失败: ${err.message}`)
  process.exit(1)
}
