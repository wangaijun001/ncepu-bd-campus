/**
 * 公共交互动作
 * 小程序内无法直接打开外部网页，统一采用「复制链接 + 提示到浏览器打开」方案。
 */

/** 复制文本 */
function copy(text, tip) {
  wx.setClipboardData({
    data: String(text || ''),
    success: () => {
      wx.showToast({ title: tip || '已复制', icon: 'none', duration: 1600 });
    }
  });
}

/**
 * 处理链接点击
 * @param {string} url  原始地址（可能是 tel: / mailto: / https:）
 * @param {string} kind web | tel | mail | file
 * @param {string} name 链接名称
 */
function openLink(url, kind, name) {
  const u = String(url || '');
  if (!u) return;

  // 电话：直接唤起拨号
  if (kind === 'tel' || /^tel:/i.test(u)) {
    const num = u.replace(/^tel:/i, '').replace(/[^\d+]/g, '');
    if (!num) return;
    wx.makePhoneCall({
      phoneNumber: num,
      fail: () => {
        copy(num, '号码已复制');
      }
    });
    return;
  }

  // 邮箱
  if (kind === 'mail' || /^mailto:/i.test(u)) {
    const mail = u.replace(/^mailto:/i, '');
    wx.setClipboardData({
      data: mail,
      success: () => {
        wx.showModal({
          title: '邮箱已复制',
          content: mail + '\n\n请到邮箱客户端粘贴发送。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
    return;
  }

  // 网页 / 文件：复制链接
  const label = kind === 'file' ? '下载链接已复制' : '链接已复制';
  wx.setClipboardData({
    data: u,
    success: () => {
      wx.showModal({
        title: label,
        content: (name ? name + '\n' : '') + u + '\n\n小程序内无法直接打开外部网页，请复制后到浏览器访问。',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  });
}

/** 预览图片 */
function previewImages(urls, current) {
  if (!urls || !urls.length) return;
  wx.previewImage({
    urls: urls,
    current: current || urls[0]
  });
}

/** 轻提示 */
function toast(title) {
  wx.showToast({ title, icon: 'none', duration: 1600 });
}

module.exports = { copy, openLink, previewImages, toast };
