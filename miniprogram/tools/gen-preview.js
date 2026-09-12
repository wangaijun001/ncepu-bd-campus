#!/usr/bin/env node
/**
 * 小程序界面预览生成器
 * 把 WXSS + 真实数据渲染成浏览器可看的 HTML（手机壳样式），
 * 方便在未安装微信开发者工具时查看界面效果。
 *
 * 用法：node tools/gen-preview.js
 * 输出：docs/preview.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'preview.html');
const C = require(path.join(ROOT, 'data/content.js'));

// ── 工具 ─────────────────────────────────────────────────────
/** rpx → px（750rpx = 375px，即 ÷2） */
const rpx2px = (css) => css.replace(/(-?\d*\.?\d+)rpx/g, (m, n) => parseFloat(n) / 2 + 'px');

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** rich-text nodes → HTML */
function nodesToHtml(nodes) {
  if (!nodes) return '';
  return nodes
    .map((n) => {
      if (n.type === 'text') return esc(n.text);
      if (n.name === 'br') return '<br>';
      const st = n.attrs && n.attrs.style ? ' style="' + rpx2px(n.attrs.style) + '"' : '';
      return '<' + n.name + st + '>' + nodesToHtml(n.children) + '</' + n.name + '>';
    })
    .join('');
}

/** 读取并转换 WXSS */
function css(rel) {
  let s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  s = s.replace(/^\s*page\s*\{/m, '.screen {');
  s = s.replace(/view,\s*text,\s*scroll-view\s*\{/, '.screen, .screen * {');
  return rpx2px(s);
}

const BASE_CSS = css('app.wxss');
const INDEX_CSS = css('pages/index/index.wxss');
const CONTEST_CSS = css('pages/contest/contest.wxss');
const ABOUT_CSS = css('pages/about/about.wxss');
const SECTION_CSS = css('pages/section/section.wxss');
const SEARCH_CSS = css('pages/search/search.wxss');
const CARD_CSS = css('components/info-card/index.wxss');

// ── 片段渲染 ─────────────────────────────────────────────────
const ICON = { web: '↗', tel: '☎', mail: '✉', file: '↓' };

function linkBtns(links) {
  if (!links || !links.length) return '';
  return (
    '<div class="link-row">' +
    links
      .map(
        (l) =>
          `<span class="link-btn ${l.kind}"><span class="lb-name">${esc(l.name)}</span><span class="lb-arrow">${ICON[l.kind] || '↗'}</span></span>`
      )
      .join('') +
    '</div>'
  );
}

function card(item) {
  return `<div class="panel marked card">
    <div class="card-title"><span class="ct-t">${esc(item.t)}</span>${
    item.badge ? `<span class="badge ${item.badgeCls}">${esc(item.badge)}</span>` : ''
  }</div>
    <div class="rows">${(item.rows || [])
      .map((r) => `<div class="kv"><div class="k">${esc(r.k)}</div><div class="v"><div class="rich">${nodesToHtml(r.v)}</div></div></div>`)
      .join('')}</div>
    ${item.note ? `<div class="note"><div class="rich">${nodesToHtml(item.note)}</div></div>` : ''}
    ${linkBtns(item.links)}
    ${item.src ? `<div class="src-line"><span class="src-k">来源 · </span>${esc(item.src)}</div>` : ''}
  </div>`;
}

function tabbar(active) {
  const tabs = [
    ['home', '首页'],
    ['contest', '竞赛'],
    ['search', '检索'],
    ['about', '关于']
  ];
  return `<div class="tabbar">${tabs
    .map(
      ([k, t]) =>
        `<div class="tab ${k === active ? 'on' : ''}"><img src="../assets/icons/${k}${k === active ? '-on' : ''}.png" alt=""><span>${t}</span></div>`
    )
    .join('')}</div>`;
}

// ── 页面 1：首页 ─────────────────────────────────────────────
function pageIndex() {
  const q = C.quickLinks
    .map((x) => `<div class="quick-item"><div class="qi-name">${esc(x.name)}</div><div class="qi-desc">${esc(x.desc)}</div></div>`)
    .join('');

  const nav = (arr) =>
    arr
      .map(
        (s) =>
          `<div class="nav-item"><div class="ni-idx">${s.idx}</div><div class="ni-body"><div class="ni-name">${esc(s.name)}${
            s.anchor === 'contest' ? `<span class="count">${C.contest.items.length}</span>` : ''
          }</div><div class="ni-desc">${esc(s.desc)}</div></div><div class="ni-arrow">›</div></div>`
      )
      .join('');

  return `<div class="navbar">并网计划 · 华电保定校园通</div>
  <div class="screen"><div class="wrap">
    <div class="hero">
      <div class="hero-top"><span class="eyebrow">BAODING // NODE-07</span><span class="eyebrow">GRID-IN</span></div>
      <div class="hero-main"><div class="bolt"></div><div class="hero-text"><div class="hero-title">并网计划</div><div class="hero-en">GRID-IN PROJECT</div></div></div>
      <div class="hero-sub">华电保定 · 校园通</div>
      <div class="brand-rule"></div>
      <div class="hero-meta"><span>${C.sections.length} 板块</span><span class="dot">·</span><span>${
    C.contest.items.length
  } 项竞赛</span><span class="dot">·</span><span>核实至 ${C.__builtAt}</span></div>
    </div>

    <div class="panel">
      <div class="card-title">${esc(C.intro.title)}</div>
      <div class="intro-sub">${esc(C.intro.sub)}</div>
      <div class="intro-text clamp"><div class="rich">${nodesToHtml(C.intro.text)}</div></div>
      <div class="expand">展开全文 ▼</div>
    </div>

    <div class="sec-head"><div class="sec-tag">QUICK ACCESS</div><div class="sec-name">常用入口</div></div>
    <div class="quick-grid">${q}</div>

    <div class="sec-head"><div class="sec-tag">STUDY // ${C.study.length} SECTIONS</div><div class="sec-name">学习指南</div></div>
    ${nav(C.study.map((s, i) => ({ ...s, idx: String(i + 1).padStart(2, '0') })))}

    <div class="sec-head"><div class="sec-tag">LIFE // ${C.life.length} SECTIONS</div><div class="sec-name">生活指南</div></div>
    ${nav(C.life.map((s, i) => ({ ...s, idx: String(i + 1).padStart(2, '0') })))}
  </div></div>
  ${tabbar('index')}`;
}

// ── 页面 2：竞赛 ─────────────────────────────────────────────
function pageContest() {
  const lv = C.contest.levels
    .map((x, i) => `<span class="chip ${i === 0 ? 'on' : ''}">${{ A: 'A类', B: 'B类', C: 'C类', X: '校内四级' }[x]}</span>`)
    .join('');
  const dp = C.contest.depts.slice(0, 10).map((d) => `<span class="chip">${esc(d)}</span>`).join('');

  return `<div class="navbar">学科竞赛</div>
  <div class="screen"><div class="wrap">
    <div class="sec-hero">
      <div class="eyebrow">CONTEST // ${C.contest.items.length} ITEMS</div>
      <div class="sh-name">学科竞赛</div>
      <div class="sh-desc">A类 / B类 / C类 / 校内四级 · 可按承办院系筛选</div>
      <div class="brand-rule"></div>
    </div>

    <div class="search-bar"><span class="sb-icon">⌕</span><span class="sb-input ph">搜索竞赛名称、主办单位…</span></div>

    <div class="filter-row"><span class="chip on">全部</span>${lv}</div>
    <div class="hscroll"><div class="hscroll-inner"><span class="chip on">全部院系</span>${dp}</div></div>

    <div class="result-bar"><div>共 <span class="count">${C.contest.items.length}</span> 项<span class="rb-hint"> · 已显示 3</span></div><div class="rb-reset">重置筛选</div></div>

    ${C.contest.items.slice(0, 3).map(card).join('')}
  </div></div>
  ${tabbar('contest')}`;
}

// ── 页面 3：关于 ─────────────────────────────────────────────
function pageAbout() {
  return `<div class="navbar">关于</div>
  <div class="screen"><div class="wrap">
    <div class="brand">
      <img class="logo" src="../assets/logo.png" alt="">
      <div class="brand-text"><div class="bt-name">并网计划</div><div class="bt-en">GRID-IN PROJECT</div><div class="bt-sub">华电保定 · 校园通</div></div>
    </div>
    <div class="brand-rule"></div>
    <div class="stat-grid">
      <div class="stat"><div class="st-n">${C.sections.length}</div><div class="st-l">板块</div></div>
      <div class="stat"><div class="st-n">${C.contest.items.length}</div><div class="st-l">竞赛</div></div>
      <div class="stat"><div class="st-n">${C.dev.sources.length}</div><div class="st-l">来源</div></div>
      <div class="stat"><div class="st-n">${C.searchIndex.length}</div><div class="st-l">条目</div></div>
    </div>
    <div class="build-line">数据版本 · 核实至 ${C.__builtAt}</div>

    <div class="sec-head"><div class="sec-tag">ABOUT</div><div class="sec-name">关于本小程序</div></div>
    <div class="panel marked"><div class="rich">${nodesToHtml(C.dev.msg)}</div></div>

    <div class="sec-head"><div class="sec-tag">SOURCES // ${C.dev.sources.length}</div><div class="sec-name">数据来源</div><div class="sec-desc">每条内容均标注来源，点击可复制原始链接</div></div>
    <div class="panel src-group">
      <div class="sg-cat">学校门户</div>
      ${C.dev.sources
        .filter((s) => s.cat === '学校门户')
        .map((s) => `<div class="sg-item"><span class="sg-name">${esc(s.name)}</span><span class="sg-arrow">↗</span></div>`)
        .join('')}
    </div>
  </div></div>
  ${tabbar('about')}`;
}

// ── 内容块渲染（对应 section.wxml 的 6 种块） ────────────────
function blockHtml(blk) {
  if (blk.type === 'cards') return blk.items.map(card).join('');

  if (blk.type === 'note')
    return `<div class="note"><div class="rich">${nodesToHtml(blk.text)}</div></div>`;

  if (blk.type === 'table') {
    const head = blk.headers.length
      ? `<div class="tbl-row head">${blk.headers.map((h) => `<div class="tbl-cell">${esc(h.t)}</div>`).join('')}</div>`
      : '';
    const rows = blk.rows
      .map(
        (r) =>
          `<div class="tbl-row">${r.cells
            .map((c) => `<div class="tbl-cell"><div class="rich">${nodesToHtml(c.nodes)}</div></div>`)
            .join('')}</div>`
      )
      .join('');
    return `<div class="tbl-block">${blk.t ? `<div class="tbl-cap">${esc(blk.t)}</div>` : ''}<div class="tbl">${head}${rows}</div>${
      blk.src ? `<div class="src-line"><span class="src-k">来源 · </span>${esc(blk.src)}</div>` : ''
    }</div>`;
  }

  if (blk.type === 'steps')
    return `<div class="panel steps">${blk.items
      .map(
        (st, i) =>
          `<div class="step"><div class="num">${i + 1}</div><div class="st-body"><div class="st-t"><div class="rich">${nodesToHtml(
            st.t
          )}</div></div>${st.d ? `<div class="st-d"><div class="rich">${nodesToHtml(st.d)}</div></div>` : ''}</div></div>`
      )
      .join('')}</div>`;

  if (blk.type === 'imgs')
    return blk.items
      .map(
        (im) =>
          `<div class="fig"><img class="fig-img" src="${esc(im.src)}" alt="">${
            im.cap ? `<div class="fig-cap">${esc(im.cap)}</div>` : ''
          }</div>`
      )
      .join('');

  if (blk.type === 'links')
    return `<div class="panel"><div class="link-row">${blk.items
      .map(
        (lk) =>
          `<span class="link-btn ${lk.kind}"><span class="lb-name">${esc(lk.name)}</span><span class="lb-arrow">${
            ICON[lk.kind] || '↗'
          }</span></span>`
      )
      .join('')}</div></div>`;

  return '';
}

// ── 页面 4：板块页（默认密码表） ─────────────────────────────
function pageSection(anchor) {
  const sec = C.study.find((s) => s.anchor === anchor) || C.study[0];
  return `<div class="navbar">${esc(sec.name)}</div>
  <div class="screen"><div class="wrap">
    <div class="sec-hero">
      <div class="eyebrow">STUDY // 学习指南</div>
      <div class="sh-name">${esc(sec.name)}</div>
      <div class="sh-desc">${esc(sec.desc)}</div>
      <div class="brand-rule"></div>
    </div>
    ${sec.blocks.map(blockHtml).join('')}
    <div class="foot"><div class="brand-rule"></div><div class="rich">${nodesToHtml(C.footer)}</div></div>
  </div></div>
  ${tabbar('index')}`;
}

// ── 页面 5：检索页（复刻 search.js 的检索 + 高亮逻辑） ───────
const BADGE_CLS = { A类: 'bA', B类: 'bB', C类: 'bC', 校内四级: 'bX' };

function pageSearch(kw) {
  const words = kw.toLowerCase().split(/\s+/).filter(Boolean);
  const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hl = (text) =>
    text
      .split(new RegExp('(' + words.map(escRe).join('|') + ')', 'gi'))
      .map((p, i) => (i % 2 === 1 ? `<span style="color:#1e7a4f;font-weight:700">${esc(p)}</span>` : esc(p)))
      .join('');

  const hits = [];
  C.searchIndex.forEach((item) => {
    const title = (item.title || '').toLowerCase();
    const hay = (title + ' ' + (item.text || '') + ' ' + (item.secName || '')).toLowerCase();
    let score = 0;
    for (const w of words) {
      const count = hay.split(w).length - 1;
      if (count === 0) return;
      score += count;
      if (title.indexOf(w) >= 0) score += 8;
    }
    hits.push(Object.assign({}, item, { score }));
  });
  hits.sort((a, b) => b.score - a.score);

  return `<div class="navbar">检索</div>
  <div class="screen"><div class="wrap">
    <div class="sec-hero">
      <div class="eyebrow">SEARCH // ${C.searchIndex.length} ENTRIES</div>
      <div class="sh-name">检索</div>
      <div class="sh-desc">系统 · 竞赛 · 电话 · 缴费 · 宿舍 · 网络 …</div>
      <div class="brand-rule"></div>
    </div>
    <div class="search-bar"><span class="sb-icon">⌕</span><span class="sb-input">${esc(kw)}</span><span class="sb-clear">✕</span></div>
    <div class="go-btn">检 索</div>
    <div class="result-bar"><div>找到 <span class="count">${hits.length}</span> 条<span class="rb-hint"> · 显示前 ${Math.min(
    60,
    hits.length
  )}</span></div><div class="rb-reset">清空</div></div>
    ${hits
      .slice(0, 3)
      .map(
        (r) =>
          `<div class="res-item"><div class="ri-head"><span class="ri-sec">${esc(r.secName)}</span>${
            r.badge ? `<span class="badge ${BADGE_CLS[r.badge] || ''}">${esc(r.badge)}</span>` : ''
          }</div><div class="ri-title">${esc(r.title)}</div><div class="ri-text"><div class="rich">${hl(
            (r.text || '').slice(0, 170)
          )}</div></div></div>`
      )
      .join('')}
  </div></div>
  ${tabbar('search')}`;
}

// ── 组装 ─────────────────────────────────────────────────────
const PHONE_CSS = `
* { box-sizing: border-box; }
body { margin:0; background:#eef1ef; color:#1f2733;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif; padding:36px 20px 60px; }
h1 { text-align:center; font-size:22px; letter-spacing:3px; margin:0 0 6px; color:#124a30; }
.sub { text-align:center; font-family:monospace; font-size:12px; color:#68788e; letter-spacing:2px; margin-bottom:34px; }
.stage { display:flex; gap:34px; justify-content:center; flex-wrap:wrap; align-items:flex-start; }
.frame { display:flex; flex-direction:column; align-items:center; }
.phone { width:375px; height:780px; background:#f4f7f5; border:9px solid #2b333a; border-radius:38px;
  overflow:hidden; display:flex; flex-direction:column; box-shadow:0 18px 44px rgba(18,74,48,.22); }
.label { font-family:monospace; font-size:11px; color:#68788e; letter-spacing:2px; margin-top:12px; }
.navbar { height:46px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
  font-size:15px; font-weight:600; background:#ffffff; color:#1f2733; border-bottom:1px solid #dde6e0; }
.screen { flex:1; overflow-y:auto; background:#f4f7f5; }
.screen::-webkit-scrollbar { width:0; }
.tabbar { height:52px; flex-shrink:0; display:flex; background:#ffffff; border-top:1px solid #dde6e0; }
.tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  font-size:10px; color:#68788e; }
.tab.on { color:#1e7a4f; font-weight:600; }
.tab img { width:19px; height:19px; }
.foot-note { max-width:900px; margin:44px auto 0; font-size:12.5px; line-height:2; color:#68788e; text-align:center; }
.foot-note code { color:#1e7a4f; font-family:monospace; }
`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>并网计划 · 小程序界面预览</title>
<style>
${PHONE_CSS}
/* ═══ app.wxss（已转 px）═══ */
${BASE_CSS}
/* ═══ index.wxss ═══ */
${INDEX_CSS}
/* ═══ contest.wxss ═══ */
${CONTEST_CSS}
/* ═══ about.wxss ═══ */
${ABOUT_CSS}
/* ═══ section.wxss ═══ */
${SECTION_CSS}
/* ═══ search.wxss ═══ */
${SEARCH_CSS}
/* ═══ info-card/index.wxss ═══ */
${CARD_CSS}
</style>
</head>
<body>
  <h1>并网计划 GRID-IN PROJECT</h1>
  <div class="sub">华电保定校园通 · 微信小程序界面预览（真实数据渲染）</div>

  <div class="stage">
    <div class="frame"><div class="phone">${pageIndex()}</div><div class="label">01 · 首页</div></div>
    <div class="frame"><div class="phone">${pageContest()}</div><div class="label">02 · 学科竞赛（可筛选）</div></div>
    <div class="frame"><div class="phone">${pageAbout()}</div><div class="label">03 · 关于 / 数据来源</div></div>
    <div class="frame"><div class="phone">${pageSection('pwd')}</div><div class="label">04 · 板块页（常用账号与默认密码）</div></div>
    <div class="frame"><div class="phone">${pageSearch('选课')}</div><div class="label">05 · 检索页（关键词「选课」）</div></div>
  </div>

  <div class="foot-note">
    以上为小程序真实样式与数据的静态预览，实际交互需用<b>微信开发者工具</b>导入 <code>miniprogram/</code> 目录查看。<br>
    内容源与网页版共用同一份 <code>data.js</code>，改一处两边同步。
  </div>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('✓ 预览已生成：' + OUT);
console.log('  体积：' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
