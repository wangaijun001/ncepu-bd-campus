const C = require('../../data/content.js');
const actions = require('../../utils/actions.js');

Page({
  data: {
    dev: C.dev,
    repo: C.__repo,
    site: C.__site,
    builtAt: C.__builtAt,
    footer: C.footer,
    srcGroups: [],
    stats: {
      sections: C.sections.length,
      contest: C.contest.items.length,
      sources: C.dev.sources.length,
      entries: C.searchIndex.length
    }
  },

  onLoad() {
    // 数据来源按分类分组
    const map = {};
    const order = [];
    C.dev.sources.forEach((s) => {
      if (!map[s.cat]) {
        map[s.cat] = [];
        order.push(s.cat);
      }
      map[s.cat].push(s);
    });
    this.setData({
      srcGroups: order.map((cat) => ({ cat, items: map[cat] }))
    });
  },

  onLink(e) {
    const d = e.currentTarget.dataset;
    actions.openLink(d.url, d.kind, d.name);
  },

  onSrcItem(e) {
    const d = e.currentTarget.dataset;
    actions.openLink(d.url, 'web', d.name);
  },

  /** 复制邮箱 */
  copyMail() {
    actions.copy('2045296004@qq.com', '邮箱已复制');
  }
});
