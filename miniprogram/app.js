// 华电保定·校园通 · 微信小程序
const content = require('./data/content.js');

App({
  globalData: {
    content: content,
    // 资源直链前缀（GitHub Pages）——图片、PDF、压缩包都从这里取
    cdnBase: content.__cdnBase || 'https://wangaijun001.github.io/ncepu-bd-campus/',
    repoUrl: 'https://github.com/wangaijun001/ncepu-bd-campus',
    siteUrl: 'https://wangaijun001.github.io/ncepu-bd-campus/'
  },

  onLaunch() {
    // 记录启动时间，用于「关于」页展示数据版本
    this.globalData.launchAt = Date.now();
  },

  /**
   * 复制文本到剪贴板（用于文件下载链接、邮箱等）
   */
  copy(text, tip) {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: tip || '已复制', icon: 'none', duration: 1800 });
      }
    });
  }
});
