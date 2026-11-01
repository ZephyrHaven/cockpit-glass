# 工程结构与维护约定

项目只把 `theme.css` 和 `manifest.json` 安装进主题目录，但维护工程包含分模块源码、确定性构建、回归验证、部署和发布记录。

```text
src/
  00-tokens.css       深浅色与公共设计变量
  10-window.css       原生透明窗口与实色兜底
  20-tabs.css         标签栏、活动标签与原生布局兼容
  30-navigation.css   文件树与侧栏
  40-controls.css     按钮、搜索、焦点和减少动态效果
  50-dialogs.css      弹窗、设置窗口与减少透明度
  60-states.css       状态、RTL、触控、强制颜色、打印
theme.config.json    显式拼接顺序与社区截图路径
manifest.json        主题名称与版本
build.js             严格解析、压缩、打包、校验和
theme.css            生成并提交的社区主题文件
dist/                忽略的本地发布产物
scripts/             校验与部署实现
deploy.sh            macOS / Linux 一键安装工具链并部署
deploy.local.json    忽略的本机部署目标
tests/               部署故障回归 + 浏览器交互检查
releases/            按版本维护的发布说明
```

## 源码与产物

所有视觉修改都落在 `src/`。构建按 `theme.config.json` 顺序拼接，使用 Lightning CSS 严格解析与压缩，不重写源码。新增模块必须登记在顺序表中，层叠顺序是兼容性的一部分。

`npm run build` 同时生成根目录 `theme.css` 与 `dist/theme.css`，两者逐字节一致。根目录版本跟随源码提交，供社区目录读取；`dist/` 不提交，只用于部署和 Release。清单从根目录复制到 `dist/manifest.json`。ZIP 只包含 `Cockpit Glass/theme.css` 与 `Cockpit Glass/manifest.json`，固定时间戳以保证可复现；校验和涵盖 CSS、清单与 ZIP。

`npm test` 会先构建，再检查清单、CSS 约束、产物同步与部署回归。CI 在 Linux / macOS / Windows 上运行相同检查，并确认生成文件没有未提交差异。主题视觉的跨平台真机验收与这些工具链检查分开记录。

## 部署边界

优先级：命令行 `--theme-dir` 或 `--vault`，其次环境变量 `COCKPIT_THEME_DIR`，最后本机 `deploy.local.json`。第一次配置后，只需 `bash deploy.sh`；Node 部署入口也可用于 Windows。

部署先构建并校验，只替换两个运行文件。不同主题、更高版本主题、符号链接、源码目录目标和非普通文件会被拒绝。目录锁阻止同时部署；旧文件保存在主题目录的 `.cockpit-backups/`，文件用同目录临时文件与原子 rename 替换，清单最后提交。失败时恢复已替换文件；检测到外部修改时保留外部数据并报告备份位置。重复部署相同内容不会增加备份。

两个文件的替换不是操作系统级的整体事务；进程被强行终止或断电时，仍可能需要从备份恢复。锁目录若因中断残留，确认没有部署进程运行后手动移除 `<主题目录>.deploy-lock` 再重试。

脚本不会切换当前主题、修改半透明窗口偏好或写插件配置。验证源码与部署产物相同不代表真实宿主的视觉交互已全部验收。
