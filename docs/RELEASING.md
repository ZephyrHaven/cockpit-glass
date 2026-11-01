# 发布与社区提交

独立仓库：[ZephyrHaven/cockpit-glass](https://github.com/ZephyrHaven/cockpit-glass)。源码在 `src/`，维护规则见 `ARCHITECTURE.md`。首个独立版本为 1.3.0；当前修复版本为 1.3.1。

## 每次发布

1. 完成相关回归与必要的真实宿主验收，结果记入 `AUDIT.md`。
2. 同步 `manifest.json`、`package.json`、`versions.json`，添加 `releases/<版本>.md`，按用户可感知的结果撰写说明。
3. 执行以下命令：

```sh
npm ci
npm test
npm run build:check
npm run release:check
bash deploy.sh
```

一键部署需要先按 README 配置本机目标；没有配置默认目标时可使用 `bash deploy.sh --vault /path/to/vault`。只构建、不部署时显式跳过最后一步。修改视觉样式时还需执行 `npm run test:ui`，按 README 先准备本地宿主 CSS 和 Chromium。

4. 审查并提交源码、根目录生成的 `theme.css`、版本与说明。`dist/`、`deploy.local.json`、本地宿主 CSS 和测试截图不提交。推送并等待 CI 通过。
5. 确认 tag 与 manifest 完全一致。首次发布示例：

```sh
git tag 1.3.0
git push origin main
git push origin 1.3.0
GH_FORCE_TTY=0 gh release create 1.3.0 --verify-tag --title 'Cockpit Glass 1.3.0' --notes-file releases/1.3.0.md dist/theme.css dist/manifest.json dist/Cockpit-Glass-1.3.0.zip dist/SHA256SUMS.txt
```

Release 的 **theme.css 与 manifest.json 两个独立附件必需**；ZIP 供手动安装，校验和用于验证下载。不要只上传 ZIP，不需要插件的 `main.js` / `styles.css`。发布后下载附件比对校验和，确认 Release 正式发布且为所需版本。版本与标签都用 `x.y.z`，不加 `v`。

## 社区目录提交：独立于 GitHub Release

GitHub Release 可以先发布；社区提交还需要真实应用截图与实际验收。首次提交前：

1. 在空白演示库中安装发布包，关闭所有社区插件，验证主题独立可用。完成审计中适用的真机验收。
2. 使用虚构笔记在真实应用中截图，保存到 `theme.config.json` 的 `communityScreenshot` 所指定的路径，当前为 `screenshots/cockpit-glass-dark.png`，与社区表单一致。官方推荐 512×288 或更大同宽高比图片。不要用浏览器模拟图冒充真实应用截图。
3. 在 README 引用截图并检查隐私，然后运行 `npm run community:check`。
4. 在 [community.obsidian.md](https://community.obsidian.md) 登录并连接 GitHub 账户，通过 Add a plugin or theme 提交仓库地址，填写截图路径并选择 Light / Dark 模式。
5. 按自动审核反馈修改、递增版本并发布新 Release。社区主题显示名称提交后不能更改，提交前确认使用 **Cockpit Glass**。

社区目录读取默认分支 HEAD 的清单，审核还会核对该发布版本所指向的提交。截图必须包含在发布标签对应的提交中；只在标签创建后补交到 main，旧版本审核仍会找不到截图，此时需要发布递增版本。安装文件来自与清单版本一致的 GitHub Release。主题名是否实时可用，以社区提交表单为准。审核结果以登录后的社区管理页面为准。

## 官方依据（2026-11-01 核对）

- [Submit your theme](https://docs.obsidian.md/themes/app-themes/submit-theme)
- [Set up and claim](https://docs.obsidian.md/community-directory/set-up-and-claim)
- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Theme guidelines](https://docs.obsidian.md/Themes/App%20themes/Theme%20guidelines)

主题保持离线可用，优先 CSS 变量，尊重用户 snippet 覆盖。不要提交从已安装应用中提取的宿主 CSS。
