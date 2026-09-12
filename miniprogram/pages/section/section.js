const C = require('../../data/content.js');
const actions = require('../../utils/actions.js');

// 建立 anchor → section 的索引
const ALL = {};
[...C.study, ...C.life, ...C.res].forEach((s) => {
  ALL[s.anchor] = s;
});

const GROUP_LABEL = {
  study: 'STUDY // 学习指南',
  life: 'LIFE // 生活指南',
  res: 'RESOURCES // 资料与工具'
};

Page({
  data: {
    sec: null,
    groupLabel: '',
    footer: C.footer,
    icons: { web: '↗', tel: '☎', mail: '✉', file: '↓' }
  },

  onLoad(q) {
    const sec = ALL[q.anchor];
    if (!sec) {
      wx.showToast({ title: '板块不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    // 收集本板块全部图片，供预览用
    const imgs = [];
    sec.blocks.forEach((b) => {
      if (b.type === 'imgs') b.items.forEach((i) => imgs.push(i.src));
    });

    this.setData({
      sec,
      groupLabel: GROUP_LABEL[sec.group] || '',
      allImgs: imgs
    });

    wx.setNavigationBarTitle({ title: sec.name });
  },

  onLink(e) {
    const d = e.currentTarget.dataset;
    actions.openLink(d.url, d.kind, d.name);
  },

  onSrc(e) {
    actions.openLink(e.currentTarget.dataset.url, 'web', '来源原文');
  },

  /** 预览图片 */
  onPreviewImg(e) {
    const src = e.currentTarget.dataset.src;
    actions.previewImages(this.data.allImgs, src);
  },

  /** 长按复制（正文内容方便转发） */
  onLongPress(e) {
    const text = e.currentTarget.dataset.text;
    if (text) actions.copy(text, '内容已复制');
  }
});
