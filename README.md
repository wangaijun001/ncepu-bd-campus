# 华电保定 · 校园通

面向华北电力大学（保定校区）新生的学习生活指南网页：学习（账号密码/查成绩/选课/79项竞赛/毕业要求/考证等）+ 生活（缴费/电话/社团/宿舍/快递/网络等）。

**在线访问**：https://wangaijun001.github.io/ncepu-bd-campus/

## AI 接入指南（ai-kit 子站）

本仓库 `ai-kit/` 目录收录了[原 ncepu-ai-kit 仓库](https://github.com/wangaijun001/ncepu-ai-kit)的全部内容：校内大模型（qwen3.8-27b）的接入文档、自检脚本和本地反代工具。主站顶部导航「AI 接入」即为该指南页面，也可直接访问 https://wangaijun001.github.io/ncepu-bd-campus/ai-kit/ 。

## 如何更新内容

1. 所有文字内容都在 `data.js` 里，直接用记事本改（字段含义见文件头部注释），保存刷新网页即可生效（本地双击 index.html）。
2. 更新线上：
   ```
   python ../build_site.py
   git add -A && git commit -m "update" && git push
   ```
3. 重新生成PDF：`node ../render_portal_pdf.js`

每条信息均标注来源；以学校官方最新通知为准。
