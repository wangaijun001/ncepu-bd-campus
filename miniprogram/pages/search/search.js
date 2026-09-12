const C = require('../../data/content.js');

/** badge 文本 → 样式类 */
const BADGE_CLS = { A类: 'bA', B类: 'bB', C类: 'bC', 校内四级: 'bX' };

/** 转义正则元字符 */
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 把命中词高亮成 nodes */
function buildNodes(text, words) {
  if (!text) return [];
  if (!words.length) return [{ type: 'text', text }];

  const re = new RegExp('(' + words.map(esc).join('|') + ')', 'gi');
  const parts = text.split(re);
  const nodes = [];
  parts.forEach((p, i) => {
    if (!p) return;
    if (i % 2 === 1) {
      nodes.push({
        name: 'span',
        attrs: { style: 'color:#1e7a4f;font-weight:700;' },
        children: [{ type: 'text', text: p }]
      });
    } else {
      nodes.push({ type: 'text', text: p });
    }
  });
  return nodes;
}

Page({
  data: {
    kw: '',
    results: [],
    total: 0,
    searched: false,
    searchIndexTotal: C.searchIndex.length,
    hot: ['选课', '成绩', '快递', '宿舍', '校园网', '四六级', '医保', '图书馆', '一卡通', '空调', '社团', '奖学金']
  },

  onKw(e) {
    this.setData({ kw: e.detail.value });
  },

  onHot(e) {
    this.setData({ kw: e.currentTarget.dataset.k }, () => this.doSearch());
  },

  clear() {
    this.setData({ kw: '', results: [], searched: false, total: 0 });
  },

  /** 执行检索 */
  doSearch() {
    const raw = String(this.data.kw || '').trim();
    if (!raw) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }

    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = [];

    C.searchIndex.forEach((item) => {
      const title = (item.title || '').toLowerCase();
      const hay = (title + ' ' + (item.text || '') + ' ' + (item.secName || '')).toLowerCase();

      let score = 0;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const count = hay.split(w).length - 1;
        if (count === 0) return; // 有词未命中 → 整条丢弃
        score += count;
        if (title.indexOf(w) >= 0) score += 8; // 标题命中加权
      }

      hits.push({
        _i: item._i,
        anchor: item.anchor,
        secName: item.secName,
        title: item.title,
        badge: item.badge,
        badgeCls: BADGE_CLS[item.badge] || '',
        score,
        nodes: buildNodes((item.text || '').slice(0, 170), words)
      });
    });

    hits.sort((a, b) => b.score - a.score);

    this.setData({
      results: hits.slice(0, 60),
      total: hits.length,
      searched: true
    });
  },

  /** 跳转到对应板块 */
  goResult(e) {
    const anchor = e.currentTarget.dataset.anchor;
    wx.navigateTo({ url: '/pages/section/section?anchor=' + anchor });
  }
});
