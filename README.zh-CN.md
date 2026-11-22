<h1 align="center">Cockpit Glass</h1>

<h3 align="center">独立的浅色 / 深色毛玻璃主题，为 <a href="https://obsidian.md">Obsidian</a> 打造</h3>

<p align="center">
  <a href="https://github.com/ZephyrHaven/cockpit-glass/releases/latest"><img alt="下载" src="https://img.shields.io/badge/download-latest-111?style=for-the-badge&logo=obsidian"></a>
  <img alt="版本" src="https://img.shields.io/badge/version-1.4.1-111?style=for-the-badge">
  <img alt="最低版本" src="https://img.shields.io/badge/app-1.14.0%2B-111?style=for-the-badge">
  <img alt="许可" src="https://img.shields.io/badge/license-MIT-111?style=for-the-badge">
</p>

[English](./README.md) · **简体中文** · [工程结构](./docs/ARCHITECTURE.md) · [验收记录](./docs/AUDIT.md)

整个窗口延续同一块毛玻璃，提供轻透导航、细腻的按钮反馈与舒适的阅读排版，跟随用户强调色。**无需任何插件、远程字体、图片或网络请求。**

## 主题预览

<p align="center"><img src="./screenshots/cockpit-glass-light.png" width="900" alt="Cockpit Glass 浅色模式"></p>
<p align="center"><em>浅色模式 — 跟随系统强调色</em></p>

<p align="center"><img src="./screenshots/cockpit-glass-dark.png" width="900" alt="Cockpit Glass 深色模式"></p>
<p align="center"><em>深色模式</em></p>

> 取自 macOS 实际界面，使用合成内容。图中的 Cockpit 标签与 AI 入口来自可选的 Cockpit Dashboard 插件——主题本身可完全独立使用。

## 主要特性

<details>
<summary><b>1. 一体式毛玻璃外观</b></summary>

整个窗口共享一块连续的毛玻璃，导航栏、标签、控件与弹窗都落在其上，配以柔和的细线与悬停反馈。玻璃底场绘制在静止图层上，因此滚动长笔记、悬停图片时都不会逐帧重绘背景——原生 macOS 半透明下没有拖影、重影或色块。
</details>

<details>
<summary><b>2. 跟随你的强调色</b></summary>

浅色与深色模式都读取「设置 → 外观 → 强调色」。主题不写死任何颜色，高亮、选中、链接、分隔线都用你选的颜色。
</details>

<details>
<summary><b>3. 舒适排版，内嵌 Figtree 字体</b></summary>

Figtree（SIL OFL，已内嵌，离线可用）负责界面与阅读文字的拉丁字形；中文自动回退到系统黑体（macOS 为苹方），中英文混排观感统一。你在「外观」里自选的字体仍然优先生效。
</details>

<details>
<summary><b>4. 阅读面选项（Style Settings）</b></summary>

安装可选的 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 插件后：**设置 → Style Settings → Cockpit Glass → 阅读面**。

- **薄雾**（默认）——顶层笔记下垫一层半透明底，墙纸再花正文也清楚。
- **清透**——直接露出窗口玻璃。
- **实色**——完全不透明。

未安装插件时默认薄雾；开启系统「降低透明度」时始终为实色。
</details>

<details>
<summary><b>5. 更清楚的辅助文字与组件</b></summary>

列表标记、占位符、未勾选复选框等弱文字在实色底上约 5.7:1、玻璃上不低于 3:1，次要文字 7:1 以上。代码块与表头有独立底面；Callout、标签、属性、嵌入、关系图谱、Canvas、PDF 跟随主题配色与圆角。
</details>

<details>
<summary><b>6. 菜单、标签与无障碍</b></summary>

菜单、命令面板、候选列表与悬浮预览共用一套浮层样式，选中项为强调色淡底；主区与侧栏标签使用同一种活动样式。「降低透明度」时所有玻璃层改为实色；强制颜色模式保留选中、焦点与浮层边框；移动端触控目标 44px，输入框 16px，避免 iOS 聚焦放大。
</details>

## 安装使用

1. 从 [Releases](https://github.com/ZephyrHaven/cockpit-glass/releases/latest) 下载 ZIP。
2. 将解压后的 `Cockpit Glass` 文件夹放入库配置目录的 `.obsidian/themes/` 下。
3. 在「设置 → 外观 → 主题」选择 **Cockpit Glass**。

也可单独下载 `theme.css` 与 `manifest.json`，放入 `.obsidian/themes/Cockpit Glass/`。普通用户无需 Node.js、构建步骤或插件。

macOS 可选开启「半透明窗口」——笔记在原生窗口玻璃上垫一层浅雾，正文不受墙纸影响。Windows、Linux、全屏与独立设置窗口使用实色兜底（CSS 无法在这些平台透视桌面壁纸）。切换其他主题即可恢复原外观，删除主题目录即可卸载；主题不存储任何用户数据。

## 支持开发

<p align="center">
  <a href="https://afdian.com/a/zephyrhaven"><img src="./assets/afdian-badge-zh.svg" alt="爱发电支持"></a>
</p>

如果 Cockpit Glass 对你有帮助，欢迎通过[爱发电](https://afdian.com/a/zephyrhaven)支持后续开发与维护。感谢支持！

## 源码维护

本工程是源码项目，安装结果只有两个文件：

```text
src/*.css → build.js → theme.css + dist/
                              ├── theme.css
                              ├── manifest.json
                              ├── Cockpit-Glass-<版本>.zip
                              └── SHA256SUMS.txt
```

只改 `src/` 下的模块，拼接顺序在 `theme.config.json` 中声明。根目录 `theme.css` 自动生成并提交（供社区目录读取），请勿手改。

```sh
npm ci
npm test            # 构建 + 校验 + 工程测试
npm run release:check
npm run test:ui     # 浏览器检查（需本地宿主 CSS 与 Chromium）
```

macOS / Linux 一键部署会构建、校验、备份旧主题，然后只复制两个运行时文件：

```sh
bash deploy.sh --vault /path/to/vault
```

自定义配置目录加 `--config-dir custom-config`；也可复制 `deploy.local.example.json` 为 `deploy.local.json` 后直接运行 `bash deploy.sh`。Windows 先 `npm ci`，再 `npm run deploy -- --vault C:/path/to/vault`。旧文件备份到 `.cockpit-backups/`。详见[工程结构](./docs/ARCHITECTURE.md)与[发布流程](./docs/RELEASING.md)。

MIT 许可，保留原项目版权声明，见 [LICENSE](./LICENSE)。
