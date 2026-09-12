const C = require('../../data/content.js');
const actions = require('../../utils/actions.js');

const pad = (n) => (n < 10 ? '0' + n : '' + n);

Page({
  data: {
    intro: C.intro,
    quickLinks: C.quickLinks,
    study: [],
    life: [],
    mapImg: C.mapImg,
    mapCap: C.mapCap,
    footer: C.footer,
    builtAt: C.__builtAt,
    introOpen: false,
    contestCount: C.contest.items.length,
    totalSections: C.sections.length
  },

  onLoad() {
    const mark = (arr) => arr.map((s, i) => Object.assign({}, s, { idx: pad(i + 1) }));
    this.setData({
      study: mark(C.study),
      life: mark(C.life)
    });
  },

  /** 展开/收起学校简介 */
  toggleIntro() {
    this.setData({ introOpen: !this.data.introOpen });
  },

  /** 快捷入口 */
  onQuick(e) {
    const d = e.currentTarget.dataset;
    actions.openLink(d.url, d.kind, d.name);
  },

  /** 进入板块 */
  goSection(e) {
    const anchor = e.currentTarget.dataset.anchor;
    // 竞赛板块有独立的筛选页，直接切到 tab
    if (anchor === 'contest') {
      wx.switchTab({ url: '/pages/contest/contest' });
      return;
    }
    wx.navigateTo({ url: '/pages/section/section?anchor=' + anchor });
  },

  /** 预览校园地图 */
  previewMap() {
    actions.previewImages([this.data.mapImg], this.data.mapImg);
  },

  /** 跳转检索 */
  goSearch() {
    wx.switchTab({ url: '/pages/search/search' });
  },

  /** 来源原文 */
  onSrc(e) {
    actions.openLink(e.currentTarget.dataset.url, 'web', '来源原文');
  }
});
