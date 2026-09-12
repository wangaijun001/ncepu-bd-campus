#!/usr/bin/env node
/**
 * 小程序项目自检
 * 检查页面文件完整性、组件引用、图标路径、包体积。
 * 用法：node tools/check-project.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warns = 0;

const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { errors++; console.log('  ✗ ' + m); };
const warn = (m) => { warns++; console.log('  ! ' + m); };

const exists = (p) => fs.existsSync(path.join(ROOT, p));
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

console.log('◆ 项目自检：' + ROOT + '\n');

// ── 1. app.json 与页面文件 ──────────────────────────────────
console.log('[1] 页面与入口');
const app = readJSON('app.json');
['app.js', 'app.json', 'app.wxss', 'sitemap.json', 'project.config.json'].forEach((f) => {
  exists(f) ? ok(f) : bad('缺少 ' + f);
});

app.pages.forEach((p) => {
  const miss = ['.js', '.json', '.wxml', '.wxss'].filter((ext) => !exists(p + ext));
  if (miss.length) bad(p + ' 缺少 ' + miss.join(' '));
  else ok(p + ' （4 文件齐全）');
});

// ── 2. tabBar 图标 ─────────────────────────────────────────
console.log('\n[2] tabBar 图标');
(app.tabBar.list || []).forEach((t) => {
  [t.iconPath, t.selectedIconPath].forEach((p) => {
    if (!p) return;
    const full = path.join(ROOT, p);
    if (!fs.existsSync(full)) bad('缺少图标 ' + p);
    else {
      const kb = fs.statSync(full).size / 1024;
      if (kb > 40) warn(p + ' 体积 ' + kb.toFixed(1) + 'KB（建议 <40KB）');
    }
  });
});
ok('图标检查完成');

// ── 3. usingComponents 引用 ────────────────────────────────
console.log('\n[3] 组件引用');
app.pages.forEach((p) => {
  const cfg = readJSON(p + '.json');
  Object.keys(cfg.usingComponents || {}).forEach((name) => {
    let ref = cfg.usingComponents[name];
    const base = ref.startsWith('/') ? ref.slice(1) : path.join(path.dirname(p), ref);
    const miss = ['.js', '.json', '.wxml'].filter((ext) => !exists(base + ext));
    if (miss.length) bad(p + ' → ' + name + ' 缺少 ' + miss.join(' '));
    else ok(p + ' → ' + name);
  });
});

// ── 4. 静态资源引用 ────────────────────────────────────────
console.log('\n[4] 静态资源引用');
const assetRefs = new Set();
function scan(dir) {
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['tools', 'docs', 'node_modules', '.git'].includes(e.name)) return;
      scan(rel);
    } else if (/\.(wxml|wxss|js)$/.test(e.name)) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const re = /["'`](\/assets\/[^"'`]+)["'`]/g;
      let m;
      while ((m = re.exec(src))) assetRefs.add(m[1]);
    }
  });
}
scan('.');
assetRefs.forEach((a) => {
  const p = a.replace(/^\//, '');
  if (!exists(p)) bad('引用了不存在的资源 ' + a);
  else ok(a);
});

// ── 5. 数据模块 ────────────────────────────────────────────
console.log('\n[5] 数据模块');
if (!exists('data/content.js')) {
  bad('缺少 data/content.js，请先运行 node tools/build-data.js');
} else {
  const C = require(path.join(ROOT, 'data/content.js'));
  ok('content.js 加载成功（' + (fs.statSync(path.join(ROOT, 'data/content.js')).size / 1024).toFixed(1) + ' KB）');
  const expect = ['intro', 'quickLinks', 'study', 'life', 'contest', 'searchIndex', 'sections'];
  expect.forEach((k) => {
    if (!C[k]) bad('数据缺少字段 ' + k);
  });
  ok('板块 ' + C.sections.length + ' · 竞赛 ' + C.contest.items.length + ' · 检索 ' + C.searchIndex.length);

  // 竞赛 tags 完整性
  const badTags = C.contest.items.filter((i) => !i.tags || !i.tags.length).length;
  if (badTags) warn(badTags + ' 条竞赛缺少 tags（筛选会漏）');
  else ok('竞赛 tags 完整');
}

// ── 6. 包体积 ──────────────────────────────────────────────
console.log('\n[6] 包体积估算（排除 tools / docs / *.md）');
const IGNORE = new Set(['tools', 'docs', 'node_modules', '.git']);
let total = 0;
const byDir = {};
function size(dir) {
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((e) => {
    if (IGNORE.has(e.name)) return;
    if (/\.md$/.test(e.name)) return;
    const rel = dir === '.' ? e.name : path.join(dir, e.name);
    const full = path.join(ROOT, rel);
    if (e.isDirectory()) return size(rel);
    const s = fs.statSync(full).size;
    total += s;
    const top = rel.split(path.sep)[0];
    byDir[top] = (byDir[top] || 0) + s;
  });
}
size('.');
Object.keys(byDir)
  .sort((a, b) => byDir[b] - byDir[a])
  .forEach((k) => console.log('     ' + k.padEnd(14) + (byDir[k] / 1024).toFixed(1) + ' KB'));
const mb = total / 1024 / 1024;
console.log('  合计 ' + (total / 1024).toFixed(1) + ' KB (' + mb.toFixed(2) + ' MB)');
if (mb > 2) bad('超过主包 2MB 上限！需要分包或改为网络资源');
else ok('在主包 2MB 限制内，余量 ' + (2 - mb).toFixed(2) + ' MB');

// ── 汇总 ───────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (errors === 0) console.log('✓ 自检通过' + (warns ? '（' + warns + ' 个提醒）' : ''));
else console.log('✗ 发现 ' + errors + ' 个错误，' + warns + ' 个提醒');
process.exit(errors ? 1 : 0);
