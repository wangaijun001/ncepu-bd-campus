#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 *  并网计划 GRID-IN PROJECT · 数据构建脚本
 * ═══════════════════════════════════════════════════════════
 *
 *  作用：把网页站点的 data.js（含 HTML 标签）转换为
 *        微信小程序可直接 require 的数据模块 data/content.js
 *
 *  转换内容：
 *   1. HTML 片段 → rich-text nodes 数组（保留 <b> <br> 等）
 *   2. 正文里的裸网址 / 电话 → 自动收集为可点击链接
 *   3. 图片相对路径 → GitHub Pages 绝对 URL
 *   4. 生成板块索引、竞赛索引、全站检索索引
 *
 *  用法：
 *    node tools/build-data.js [data.js 路径]
 *    不带参数时自动探测源文件位置。
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ──────────────────────────────────────────────────────
const CDN = 'https://wangaijun001.github.io/ncepu-bd-campus/';
const REPO = 'https://github.com/wangaijun001/ncepu-bd-campus';
const SITE = 'https://wangaijun001.github.io/ncepu-bd-campus/';

const OUT_FILE = path.resolve(__dirname, '../data/content.js');

// 源文件探测顺序
const CANDIDATES = [
  process.argv[2],
  path.resolve(__dirname, '../../data.js'), // site/miniprogram/tools/ → site/data.js
  path.resolve(__dirname, '../data.js'),
  'C:/Users/Administrator/.zcode/workspace/default/jing_sai/site/data.js'
].filter(Boolean);

const SRC_FILE = CANDIDATES.find((p) => fs.existsSync(p));
if (!SRC_FILE) {
  console.error('✗ 找不到源数据 data.js，尝试过：\n  ' + CANDIDATES.join('\n  '));
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
//  1. 读取源数据
// ══════════════════════════════════════════════════════════════
const rawCode = fs.readFileSync(SRC_FILE, 'utf8');
let DATA;
try {
  DATA = eval('(function(){ ' + rawCode + '\n return DATA; })()');
} catch (e) {
  console.error('✗ 解析 data.js 失败：' + e.message);
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
//  2. HTML → rich-text nodes
// ══════════════════════════════════════════════════════════════

/** 允许保留的标签（其余标签被剥掉，但保留内部文字） */
const ALLOWED = new Set(['b', 'strong', 'i', 'em', 'u', 'span', 'br', 'sub', 'sup']);

/** 网址 / 电话识别 */
const URL_RE = new RegExp(
  [
    'https?://[^\\s<>"\'，。；、）)】」》]+', // 完整 URL
    '(?:[a-zA-Z0-9][a-zA-Z0-9-]*\\.)+(?:edu\\.cn|com\\.cn|gov\\.cn|org\\.cn|net\\.cn|cn|com|org|net|io|edu|top|xyz)(?:/[^\\s<>"\'，。；、）)】」》]*)?', // 裸域名
    '(?<![\\d-])\\d{3,4}-\\d{7,8}(?:-\\d{1,6})?(?![\\d-])' // 固话
  ].join('|'),
  'g'
);

/** 链接样式（rich-text 内部 class 不生效，必须用 inline style；
 *  注意：rich-text 是 WebView 渲染，这里不能用 rpx，要用 px） */
const LINK_STYLE = 'color:#0b62c4;border-bottom:1px solid rgba(11,98,196,.4);';

/** 严格判定：只有「区号-号码」形态才算电话，避免把 2026.xxx.net 这类域名误判 */
function isTel(s) {
  return /^\d{3,4}-\d{7,8}(-\d{1,6})?$/.test(s);
}

/**
 * 把一段文本拆成 nodes，同时把网址/电话收集进 linkBag
 */
function pushText(children, text, linkBag) {
  let last = 0;
  URL_RE.lastIndex = 0;
  let m;
  while ((m = URL_RE.exec(text))) {
    if (m.index > last) {
      children.push({ type: 'text', text: text.slice(last, m.index) });
    }
    const raw = m[0];
    const tel = isTel(raw);
    const href = tel ? 'tel:' + raw.replace(/-/g, '') : /^https?:/.test(raw) ? raw : 'http://' + raw;

    // 正文中的链接仅做高亮（点击统一走卡片底部的链接按钮，稳定可靠）
    children.push({
      name: 'span',
      attrs: { style: LINK_STYLE },
      children: [{ type: 'text', text: raw }]
    });

    if (linkBag) {
      linkBag.push({ name: raw, url: href, kind: tel ? 'tel' : 'web', auto: true });
    }
    last = m.index + raw.length;
  }
  if (last < text.length) {
    children.push({ type: 'text', text: text.slice(last) });
  }
}

/**
 * HTML 片段 → rich-text nodes 数组
 * @returns {Array} nodes
 */
function htmlToNodes(html, linkBag) {
  if (html === undefined || html === null) return [];
  const s = String(html);
  if (!s) return [];

  const out = [];
  const stack = [out];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g;
  let i = 0;
  let m;

  while ((m = re.exec(s))) {
    const text = s.slice(i, m.index);
    if (text) pushText(stack[stack.length - 1], text, linkBag);
    i = m.index + m[0].length;

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();

    if (name === 'br') {
      stack[stack.length - 1].push({ name: 'br' });
      continue;
    }
    if (!ALLOWED.has(name)) continue; // 丢弃不支持的标签，保留文字

    if (closing) {
      if (stack.length > 1) stack.pop();
    } else {
      const node = { name, children: [] };
      stack[stack.length - 1].push(node);
      stack.push(node.children);
    }
  }

  const tail = s.slice(i);
  if (tail) pushText(stack[stack.length - 1], tail, linkBag);

  // 去掉空元素节点
  return out.filter((n) => !(n.name && n.children && n.children.length === 0));
}

/** nodes → 纯文本（用于检索索引） */
function nodesToText(nodes) {
  if (!nodes) return '';
  if (typeof nodes === 'string') return nodes;
  let s = '';
  for (const n of nodes) {
    if (n.type === 'text') s += n.text;
    else if (n.name === 'br') s += ' ';
    else if (n.children) s += nodesToText(n.children);
  }
  return s;
}

// ══════════════════════════════════════════════════════════════
//  3. 链接与图片处理
// ══════════════════════════════════════════════════════════════

const FILE_EXT = /\.(pdf|zip|rar|apk|docx?|xlsx?|pptx?|txt|csv|7z)$/i;

/** 判断链接类型：web | tel | mail | file */
function linkKind(url) {
  const u = String(url || '');
  if (/^tel:/i.test(u)) return 'tel';
  if (/^mailto:/i.test(u)) return 'mail';
  const clean = u.split('?')[0].split('#')[0];
  if (FILE_EXT.test(clean)) return 'file';
  return 'web';
}

/** [name, url, desc?] → {name, url, kind, desc} */
function toLink(arr) {
  if (!Array.isArray(arr)) return null;
  const name = String(arr[0] || '').trim();
  const url = String(arr[1] || '').trim();
  if (!url) return null;
  return { name, url, kind: linkKind(url), desc: arr[2] ? String(arr[2]) : '' };
}

/** 图片路径 → 绝对 URL */
function fixImg(src) {
  const s = String(src || '').trim();
  if (!s) return '';
  if (/^https?:/i.test(s)) return s;
  return CDN + s.replace(/^\.?\//, '');
}

/** 合并「原有链接」+「正文里自动发现的链接」，按 url 去重 */
function mergeLinks(links, bag) {
  const out = [];
  const seen = new Set();
  (links || []).forEach((l) => {
    if (!l) return;
    if (seen.has(l.url)) return;
    seen.add(l.url);
    out.push(l);
  });
  (bag || []).forEach((l) => {
    if (seen.has(l.url)) return;
    seen.add(l.url);
    out.push(l);
  });
  return out;
}

// ══════════════════════════════════════════════════════════════
//  4. 结构转换
// ══════════════════════════════════════════════════════════════

function convCardItem(it) {
  const bag = [];
  const rows = (it.rows || []).map((r) => ({
    k: String(r[0] || ''),
    v: htmlToNodes(r[1], bag)
  }));
  return {
    t: String(it.t || ''),
    badge: String(it.badge || ''),
    badgeCls: String(it.badgeCls || ''),
    rows,
    links: mergeLinks((it.links || []).map(toLink), bag),
    note: it.note ? htmlToNodes(it.note) : null,
    src: String(it.src || ''),
    srcUrl: String(it.srcUrl || ''),
    tags: Array.isArray(it.tags) ? it.tags : []
  };
}

/** 给列表项补稳定索引 _i（WXML wx:key 用） */
function withIdx(arr) {
  return arr.map((x, i) => Object.assign({ _i: i }, x));
}

function convBlock(b) {
  if (!b || !b.type) return null;
  switch (b.type) {
    case 'cards':
      return { type: 'cards', items: withIdx((b.items || []).map(convCardItem)) };

    case 'note':
      return { type: 'note', text: htmlToNodes(b.text) };

    case 'table':
      return {
        type: 'table',
        t: String(b.t || ''),
        headers: withIdx((b.headers || []).map((h) => ({ t: String(h) }))),
        rows: withIdx(
          (b.rows || []).map((r) => ({
            cells: withIdx(r.map((c) => ({ nodes: htmlToNodes(c) })))
          }))
        ),
        src: String(b.src || '')
      };

    case 'steps':
      return {
        type: 'steps',
        items: withIdx(
          (b.items || []).map((s) => ({
            t: htmlToNodes(s.t),
            d: s.d ? htmlToNodes(s.d) : null
          }))
        )
      };

    case 'imgs':
      return {
        type: 'imgs',
        items: withIdx(
          (b.items || []).map((i) => ({
            src: fixImg(i.src),
            cap: String(i.cap || '')
          }))
        )
      };

    case 'links':
      return { type: 'links', items: withIdx((b.items || []).map(toLink).filter(Boolean)) };

    default:
      console.warn('  ! 未知 block 类型：' + b.type);
      return null;
  }
}

function convSection(sec, group) {
  return {
    anchor: String(sec.anchor || ''),
    name: String(sec.name || ''),
    desc: String(sec.desc || ''),
    group,
    blocks: withIdx((sec.blocks || []).map(convBlock).filter(Boolean))
  };
}

// ══════════════════════════════════════════════════════════════
//  5. 主流程
// ══════════════════════════════════════════════════════════════
console.log('◆ 源文件：' + SRC_FILE);

const study = (DATA.study || []).map((s) => convSection(s, 'study'));
const life = (DATA.life || []).map((s) => convSection(s, 'life'));

// 竞赛专用数据集：把 contest 板块里带 tags 的卡片抽出来
const contestSec = study.find((s) => s.anchor === 'contest');
let contest = { items: [], levels: [], depts: [], notes: [], tail: [] };
if (contestSec) {
  const cardBlocks = contestSec.blocks.filter((b) => b.type === 'cards');
  // 第一个 cards 是 79 项主体，后面的 cards 是补充说明
  const main = cardBlocks.find((b) => b.items.some((i) => i.tags.length)) || cardBlocks[0];
  if (main) contest.items = main.items.filter((i) => i.tags.length);
  cardBlocks.forEach((b) => {
    if (b !== main) contest.tail.push(...b.items);
  });
  contest.notes = contestSec.blocks.filter((b) => b.type === 'note');
  const lv = new Set();
  const dp = new Set();
  contest.items.forEach((i) => {
    if (i.tags[0]) lv.add(i.tags[0]);
    if (i.tags[1]) dp.add(i.tags[1]);
  });
  contest.levels = ['A', 'B', 'C', 'X'].filter((x) => lv.has(x));
  contest.depts = [...dp].sort();
}

// 板块索引（首页导航 + 检索页用）
const sections = withIdx(
  [...study, ...life].map((s) => ({
    anchor: s.anchor,
    name: s.name,
    desc: s.desc,
    group: s.group
  }))
);

// 全站检索索引
const searchIndex = [];
function addIndex(sec, title, nodes, extra) {
  const text = nodesToText(nodes);
  if (!text.trim()) return;
  searchIndex.push({
    anchor: sec.anchor,
    secName: sec.name,
    group: sec.group,
    title: title || sec.name,
    text: text.replace(/\s+/g, ' ').trim().slice(0, 400),
    badge: (extra && extra.badge) || ''
  });
}
[...study, ...life].forEach((sec) => {
  sec.blocks.forEach((b) => {
    if (b.type === 'cards') {
      b.items.forEach((it) => {
        addIndex(sec, it.t, [{ type: 'text', text: it.rows.map((r) => r.k + ' ' + nodesToText(r.v)).join(' ') }], { badge: it.badge });
      });
    } else if (b.type === 'table') {
      const headText = b.headers.map((h) => h.t).join(' ');
      const bodyText = b.rows.map((r) => r.cells.map((c) => nodesToText(c.nodes)).join(' ')).join(' ');
      addIndex(sec, b.t, [{ type: 'text', text: headText + ' ' + bodyText }]);
    } else if (b.type === 'steps') {
      addIndex(sec, '操作步骤', [{ type: 'text', text: b.items.map((s) => nodesToText(s.t) + ' ' + nodesToText(s.d)).join(' ') }]);
    } else if (b.type === 'note') {
      addIndex(sec, '提示', b.text);
    }
  });
});

// 输出
const out = {
  __cdnBase: CDN,
  __repo: REPO,
  __site: SITE,
  __builtAt: new Date().toISOString().slice(0, 10),
  __source: '华电保定·校园通（网页版 data.js）',

  intro: {
    title: String(DATA.intro.title || ''),
    sub: String(DATA.intro.sub || ''),
    text: htmlToNodes(DATA.intro.text),
    src: String(DATA.intro.src || ''),
    srcUrl: String(DATA.intro.srcUrl || '')
  },
  quickLinks: withIdx(
    (DATA.quickLinks || []).map((q) => ({
      name: String(q[0] || ''),
      url: String(q[1] || ''),
      desc: String(q[2] || ''),
      kind: linkKind(q[1])
    }))
  ),
  mapImg: fixImg(DATA.mapImg),
  mapCap: String(DATA.mapCap || ''),
  mapNotes: withIdx((DATA.mapNotes || []).map((n) => ({ nodes: htmlToNodes(n) }))),
  dev: {
    msg: htmlToNodes(DATA.dev.msg),
    pdfName: String(DATA.dev.pdfName || ''),
    pdfUrl: String(DATA.dev.pdfUrl || ''),
    sources: withIdx(
      (DATA.dev.sources || []).map((s) => ({
        cat: String(s[0] || ''),
        name: String(s[1] || ''),
        url: String(s[2] || '')
      }))
    )
  },
  footer: htmlToNodes(DATA.footer),

  study,
  life,
  sections,
  contest: {
    items: withIdx(contest.items),
    tail: withIdx(contest.tail),
    notes: withIdx(contest.notes),
    levels: contest.levels,
    depts: contest.depts
  },
  searchIndex: withIdx(searchIndex)
};

const banner =
  '/* 自动生成，请勿直接修改 —— 由 tools/build-data.js 从网页站 data.js 转换而来。\n' +
  '   修改内容请改源文件 data.js 后重新运行：node tools/build-data.js\n' +
  '   生成时间：' + out.__builtAt + ' */\n';

const js = banner + 'module.exports = ' + JSON.stringify(out) + ';\n';

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, js, 'utf8');

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('✓ 输出：' + OUT_FILE);
console.log('  体积：' + kb(Buffer.byteLength(js)));
console.log('  板块：学习 ' + study.length + ' · 生活 ' + life.length);
console.log('  竞赛：' + contest.items.length + ' 项（' + contest.levels.join('/') + '，' + contest.depts.length + ' 个院系）');
console.log('  检索条目：' + searchIndex.length);
