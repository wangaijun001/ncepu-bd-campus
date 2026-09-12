# 并网计划 GRID-IN PROJECT

> 华电保定校园通 · 微信小程序
> 面向华北电力大学（保定校区）学生的「竞赛 + 生活」知识小程序

内容源自本仓库网页版（根目录 `data.js`），由构建脚本转换为小程序数据模块，
**与网页版共用同一份内容源**——改一处，两边同步。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss     小程序入口与全局样式（浅绿底 + 华电绿，与网页版一致）
├── project.config.json              开发者工具项目配置（appid 需自行填写）
├── sitemap.json
├── data/
│   └── content.js                   ← 构建产物，由 tools/build-data.js 生成
├── pages/
│   ├── index/      首页：品牌头 + 学校简介 + 常用入口 + 21 板块导航 + 地图
│   ├── section/    板块页：通用渲染器，支持 6 种内容块
│   ├── contest/    竞赛页：79 项，按级别 + 承办院系筛选
│   ├── search/     检索页：162 条全站索引
│   └── about/      关于页：数据来源 44 条 + 开源仓库 + 反馈
├── components/
│   └── info-card/  信息卡片组件（标题 / 键值 / 链接 / 来源）
├── utils/
│   ├── actions.js  外链、拨号、复制、图片预览
│   └── nodes.js    rich-text nodes 工具
├── assets/         品牌头像 + tabBar 图标
└── tools/
    ├── build-data.js    内容构建：data.js → data/content.js
    ├── gen-icons.py     tabBar 图标生成（需 Pillow）
    ├── gen-preview.js   生成 docs/preview.html 浏览器预览
    └── check-project.js 项目自检
```

## 快速开始

### 1. 导入开发者工具

用**微信开发者工具**打开本目录（`miniprogram/`）。

`project.config.json` 里的 `appid` 已填写为本项目的小程序 AppID；
若你要另建小程序，请替换成自己的 AppID。

### 2. 更新内容

内容源是仓库根目录的 `data.js`（与网页版共用）：

```bash
# 在 miniprogram/ 目录下
node tools/build-data.js
```

脚本会自动定位 `../data.js`，把 HTML 片段转成小程序 rich-text nodes，
把正文里的裸网址 / 电话收集成可点击链接，并输出 `data/content.js`。
保存后开发者工具会自动热重载。

### 3. 重新生成图标

```bash
python tools/gen-icons.py     # 需要 Pillow
```

### 4. 自检

```bash
node tools/check-project.js
```

检查页面文件完整性、组件引用、资源路径、数据字段，并估算主包体积。

## 技术说明

| 事项 | 方案 |
| --- | --- |
| 内容存储 | 本地打包（`data/content.js`，约 323 KB），秒开、离线可用 |
| 图片 / PDF / 安装包 | **不打包**，走 GitHub Pages 直链（`wangaijun001.github.io/ncepu-bd-campus/`） |
| 外部网页 | 小程序内无法直接打开，采用「复制链接 → 浏览器访问」 |
| 电话 | `tel:` 链接直接唤起拨号 |
| 主包体积 | 约 0.44 MB（上限 2 MB） |

> 图片走 `image` 组件加载网络图，无需配置服务器域名白名单；
> 文件下载用复制链接方案，绕开个人主体无法配置未备案域名的问题。

## 设计

品牌方案见 `../../ziliao/bd-mini-brand/设计说明书.md`。

- 色板（与网页版共用）：华电绿 `#1e7a4f` / 深绿 `#124a30` / 浅绿底 `#e8f4ee` / 链接蓝 `#0b62c4` /
  次要灰 `#68788e` / 边线 `#dde6e0` / 琥珀提示 `#d99a2b` + `#fdf6ec` / 页面底 `#f4f7f5`
- 头像：`assets/logo.png`（品牌 V4 · 近景双塔）
- 图标：六边形闪电（首页）/ 五角星（竞赛）/ 放大镜（检索）/ 信息圆（关于）
  两态配色：未选中 `#68788e` / 选中 `#1e7a4f`

## 内容声明

内容由开发者网络搜集与个人整理，每条均标注来源，**仅供参考**，
以学校官方最新通知为准。详见小程序「关于」页。
