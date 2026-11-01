# Cockpit Glass

独立的浅色 / 深色玻璃主题，提供轻透导航栏、细腻的按钮反馈和清晰的笔记阅读面，跟随用户强调色。无需驾驶舱插件、远程字体、图片或网络请求。

当前 **1.3.0**，最低宿主版本 **1.14.0**。从驾驶舱内置的 1.2.0 独立发展；社区目录尚未提交。

## 安装使用

从 [GitHub Releases](https://github.com/ZephyrHaven/cockpit-glass/releases/latest) 下载 ZIP，将解压后的 `Cockpit Glass` 文件夹放入库配置目录的 `themes/` 下（默认 `.obsidian/themes/`）。也可单独下载 `theme.css` 和 `manifest.json`，放入 `themes/Cockpit Glass/`。

在「设置 → 外观 → 主题」选择 **Cockpit Glass** 即可。普通用户无需安装 Node.js 或构建项目。

macOS 可选开启「外观 → 半透明窗口」，获得系统原生窗口玻璃。笔记阅读面、搜索面板与弹窗保持清晰底色；Windows、Linux、移动端、全屏和独立设置窗口使用实色兜底。CSS 无法在这些平台提供桌面壁纸原生透视；跨平台真机视觉验收待完成。切换其他主题即可恢复原外观，删除主题目录即可卸载。

## 源码维护

项目的安装结果只有两个文件，但维护工程包含完整工具链：

| 文件 / 目录 | 用途 |
| --- | --- |
| `src/*.css` | 按设计变量、窗口、标签、导航、控件、弹窗与状态拆分的可读源码 |
| `theme.config.json` | 样式拼接顺序，新增模块必须登记 |
| `build.js` | 严格解析、压缩、ZIP 打包和 SHA-256 校验和 |
| 根目录 `theme.css` | 自动生成并提交，供社区目录读取，不要手改 |
| `dist/` | CSS、清单、安装 ZIP、校验和；用于部署与 Release，不入库 |
| `scripts/`、`tests/` | 校验、部署、备份恢复及交互回归 |
| `releases/` | 按版本维护的发布说明 |

开发环境要求 Node.js 22+：

```sh
npm ci
npm test
npm run release:check
```

只改 `src/`，`npm test` 会先重新构建，再检查版本与源码/产物一致性并执行部署回归测试。单独构建用 `npm run build`，检查已有产物用 `npm run build:check`。版本修改时同步 `manifest.json`、`package.json`、`versions.json`，新增 `releases/<版本>.md`。

## 一键部署

macOS / Linux 首次指定库：

```sh
bash deploy.sh --vault /path/to/vault
```

脚本安装缺失构建依赖，然后构建、校验、备份旧主题并部署。自定义配置目录可加 `--config-dir custom-config`。也可以复制 `deploy.local.example.json` 为 `deploy.local.json`，填写自己的主题目录；配置一次后，直接运行：

```sh
bash deploy.sh
```

`deploy.local.json` 不入 Git。目标也可通过 `COCKPIT_THEME_DIR` 环境变量或 `--theme-dir` 指定。Windows 先执行 `npm ci`，再执行 `npm run deploy -- --vault C:/path/to/vault`，使用相同的 Node 部署实现。

仅替换 `theme.css` 和 `manifest.json`；旧文件备份到主题目录的 `.cockpit-backups/`。不修改主题选择、窗口偏好、插件数据或其他文件。遇到更高版本、其他主题、并发部署或外部编辑时停止；部署错误会尝试恢复旧文件。中断和恢复说明见[工程文档](./docs/ARCHITECTURE.md)。

## 验证与发布

- [交互修复、测试结果与待验收项](./docs/AUDIT.md)
- [工程结构与维护边界](./docs/ARCHITECTURE.md)
- [构建、GitHub Release 与社区提交步骤](./docs/RELEASING.md)
- [拆分来源](./docs/EXTRACTION.md)

`npm run release:check` 验证 GitHub 发布包；`npm run community:check` 额外要求真实应用演示截图。浏览器验证使用本地宿主 CSS 与虚构页面，不代表所有真机交互已验收。主题不包含驾驶舱的仪表盘功能，驾驶舱仍可作为可选插件搭配。

MIT 许可，保留原项目版权声明。
