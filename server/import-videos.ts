/**
 * Import grammar videos from a source folder into data/videos/
 * Categorizes and renames for clean display in Grammar page.
 * Run: npx tsx server/import-videos.ts <视频源文件夹>
 *   or set VIDEOS_SRC_DIR=<视频源文件夹>
 */
import fs from 'node:fs'
import path from 'node:path'

const srcArg = process.argv[2] || process.env.VIDEOS_SRC_DIR
if (!srcArg) {
  console.error('用法: npx tsx server/import-videos.ts <视频源文件夹路径>')
  console.error('      或设置环境变量 VIDEOS_SRC_DIR=<视频源文件夹路径>')
  process.exit(1)
}
const SRC = path.resolve(srcArg)
const DST = path.resolve('data', 'videos')

// Clear existing videos
if (fs.existsSync(DST)) {
  for (const f of fs.readdirSync(DST)) {
    if (f.endsWith('.mp4')) fs.unlinkSync(path.join(DST, f))
  }
}
fs.mkdirSync(DST, { recursive: true })

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.mp4'))

const map: { src: string; dst: string }[] = []

for (const f of files) {
  let dst: string

  if (f.startsWith('01')) dst = '词性 - 01 名词 形容词 副词 这就是一切.mp4'
  else if (f.startsWith('02')) dst = '词性 - 02 词性之间的修饰关系.mp4'
  else if (f.startsWith('03')) dst = '词性 - 03 介词等于形容词或副词.mp4'
  else if (f.startsWith('04')) dst = '简单句 - 01 主谓宾定状补.mp4'
  else if (f.startsWith('05')) dst = '简单句 - 02 补语详解.mp4'
  else if (f.startsWith('06')) dst = '简单句 - 03 简单句的构成与语法分析实践.mp4'
  else if (f.startsWith('07')) dst = '从句 - 01 简单句加简单句必须有连词.mp4'
  else if (f.startsWith('08')) dst = '从句 - 02 名词性从句.mp4'
  else if (f.startsWith('09')) dst = '从句 - 03 名词性从句补充.mp4'
  else if (f.startsWith('10')) dst = '从句 - 04 形容词性从句 上.mp4'
  else if (f.startsWith('11')) dst = '从句 - 05 形容词性从句 中.mp4'
  else if (f.startsWith('12')) dst = '从句 - 06 形容词性从句 下.mp4'
  else if (f.startsWith('13')) dst = '从句 - 07 副词性从句.mp4'
  else if (f.startsWith('14')) dst = '非谓语动词 - 01 不定式.mp4'
  else if (f.startsWith('15')) dst = '非谓语动词 - 02 动名词.mp4'
  else if (f.startsWith('16')) dst = '非谓语动词 - 03 分词.mp4'
  else if (f.startsWith('17')) dst = '非谓语动词 - 04 从句和非谓语动词的转换.mp4'
  else if (f.startsWith('18')) dst = '导学 - 01 Larry的语法系列课程你该怎么学.mp4'
  else if (f.startsWith('19')) dst = '时态 - 01 动词的时体貌 上.mp4'
  else if (f.startsWith('20')) dst = '时态 - 02 动词的时体貌 中.mp4'
  else if (f.startsWith('21')) dst = '时态 - 03 动词的时体貌 下.mp4'
  else if (f.startsWith('22')) dst = '时态 - 04 英语时态详解.mp4'
  else if (f.startsWith('23')) dst = '导学 - 02 英语语法回炉指南.mp4'
  else if (f.startsWith('24')) dst = '虚拟语气 - 01 虚拟语气 1.mp4'
  else if (f.startsWith('25')) dst = '虚拟语气 - 02 虚拟语气 2.mp4'
  else if (f.startsWith('26')) dst = '虚拟语气 - 03 虚拟语气 3.mp4'
  else if (f.startsWith('27')) dst = '词法 - 01 可数名词单数不可裸露原则.mp4'
  else if (f.startsWith('28')) dst = '词法 - 02 冠词的用法.mp4'
  else continue

  map.push({ src: f, dst })
}

for (const { src, dst } of map) {
  fs.copyFileSync(path.join(SRC, src), path.join(DST, dst))
  console.log(`  ${dst}`)
}

console.log(`\n✓ Imported ${map.length} videos into data/videos/`)
