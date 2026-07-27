/**
 * Import grammar videos from source folder into data/videos/
 * Categorizes and renames for clean display in Grammar page.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(process.env.USERPROFILE || '', 'Desktop', '半个月搭建你的英语语法体系')
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
  let dst = ''

  if (f.startsWith('01')) dst = '词性 - 名词 形容词 副词 这就是一切.mp4'
  else if (f.startsWith('02')) dst = '词性 - 词性之间的修饰关系.mp4'
  else if (f.startsWith('03')) dst = '词性 - 介词等于形容词或副词.mp4'
  else if (f.startsWith('04')) dst = '简单句 - 主谓宾定状补.mp4'
  else if (f.startsWith('05')) dst = '简单句 - 补语详解.mp4'
  else if (f.startsWith('06')) dst = '简单句 - 简单句的构成与语法分析实践.mp4'
  else if (f.startsWith('07')) dst = '从句 - 简单句加简单句必须有连词.mp4'
  else if (f.startsWith('08')) dst = '从句 - 名词性从句.mp4'
  else if (f.startsWith('09')) dst = '从句 - 名词性从句补充.mp4'
  else if (f.startsWith('10')) dst = '从句 - 形容词性从句 上.mp4'
  else if (f.startsWith('11')) dst = '从句 - 形容词性从句 中.mp4'
  else if (f.startsWith('12')) dst = '从句 - 形容词性从句 下.mp4'
  else if (f.startsWith('13')) dst = '从句 - 副词性从句.mp4'
  else if (f.startsWith('14')) dst = '非谓语动词 - 不定式.mp4'
  else if (f.startsWith('15')) dst = '非谓语动词 - 动名词.mp4'
  else if (f.startsWith('16')) dst = '非谓语动词 - 分词.mp4'
  else if (f.startsWith('17')) dst = '非谓语动词 - 从句和非谓语动词的转换.mp4'
  else if (f.startsWith('18')) dst = '导学 - Larry的语法系列课程你该怎么学.mp4'
  else if (f.startsWith('19')) dst = '时态 - 动词的时体貌 上.mp4'
  else if (f.startsWith('20')) dst = '时态 - 动词的时体貌 中.mp4'
  else if (f.startsWith('21')) dst = '时态 - 动词的时体貌 下.mp4'
  else if (f.startsWith('22')) dst = '时态 - 英语时态详解.mp4'
  else if (f.startsWith('23')) dst = '导学 - 英语语法回炉指南.mp4'
  else if (f.startsWith('24')) dst = '虚拟语气 - 虚拟语气 1.mp4'
  else if (f.startsWith('25')) dst = '虚拟语气 - 虚拟语气 2.mp4'
  else if (f.startsWith('26')) dst = '虚拟语气 - 虚拟语气 3.mp4'
  else if (f.startsWith('27')) dst = '词法 - 可数名词单数不可裸露原则.mp4'
  else if (f.startsWith('28')) dst = '词法 - 冠词的用法.mp4'
  else continue

  map.push({ src: f, dst })
}

for (const { src, dst } of map) {
  fs.copyFileSync(path.join(SRC, src), path.join(DST, dst))
  console.log(`  ${dst}`)
}

console.log(`\n✓ Imported ${map.length} videos into data/videos/`)
