const C = require('../../data/content.js');
const actions = require('../../utils/actions.js');
const { nodesToText } = require('../../utils/nodes.js');

const LEVEL_NAME = { A: 'A类', B: 'B类', C: 'C类', X: '校内四级' };
const PAGE_SIZE = 15;

Page({
  data: {
    levels: C.contest.levels,
    levelNames: LEVEL_NAME,
    depts: C.contest.depts,
    levelIdx: 0,
    deptIdx: 0,
    kw: '',
    list: [],
    total: 0,
    allTotal: C.contest.items.length,
    tail: C.contest.tail,
    notes: C.contest.notes,
    page: 1,
    hasMore: false,
    icons: { web: '↗', tel: '☎', mail: '✉', file: '↓' }
  },

  onLoad() {
    // 预计算检索文本，避免每次筛选重复遍历 nodes
    this._pool = C.contest.items.map((it) => ({
      it,
      hay: (
        it.t +
        ' ' +
        it.rows
          .map((r) => r.k + ' ' + nodesToText(r.v))
          .join(' ')
      ).toLowerCase()
    }));
    this._filtered = C.contest.items;
    this.apply();
  },

  /** 应用筛选 */
  apply() {
    const { levelIdx, deptIdx, kw } = this.data;
    const lv = levelIdx === 0 ? '' : this.data.levels[levelIdx - 1];
    const dp = deptIdx === 0 ? '' : this.data.depts[deptIdx - 1];
    const k = String(kw || '').trim().toLowerCase();

    const filtered = this._pool
      .filter((p) => {
        if (lv && p.it.tags[0] !== lv) return false;
        if (dp && p.it.tags[1] !== dp) return false;
        if (k && p.hay.indexOf(k) < 0) return false;
        return true;
      })
      .map((p) => p.it);

    this._filtered = filtered;
    this.setData({
      page: 1,
      total: filtered.length,
      list: filtered.slice(0, PAGE_SIZE),
      hasMore: filtered.length > PAGE_SIZE
    });
  },

  onKw(e) {
    this.setData({ kw: e.detail.value }, () => this.apply());
  },

  clearKw() {
    this.setData({ kw: '' }, () => this.apply());
  },

  onLevel(e) {
    this.setData({ levelIdx: Number(e.currentTarget.dataset.i) }, () => this.apply());
  },

  onDept(e) {
    this.setData({ deptIdx: Number(e.currentTarget.dataset.i) }, () => this.apply());
  },

  reset() {
    this.setData({ levelIdx: 0, deptIdx: 0, kw: '' }, () => this.apply());
  },

  /** 触底加载更多（79 项一次性渲染会卡） */
  onReachBottom() {
    if (!this.data.hasMore) return;
    const next = this.data.page + 1;
    this.setData({
      page: next,
      list: this._filtered.slice(0, next * PAGE_SIZE),
      hasMore: this._filtered.length > next * PAGE_SIZE
    });
  },

  onLink(e) {
    const d = e.currentTarget.dataset;
    actions.openLink(d.url, d.kind, d.name);
  },

  onSrc(e) {
    actions.openLink(e.currentTarget.dataset.url, 'web', '来源原文');
  }
});
