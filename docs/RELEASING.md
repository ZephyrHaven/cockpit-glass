# 发布准备

本地独立项目已经就绪；用户将自行在 GitHub 创建新仓库。建议仓库名 `cockpit-glass`，名称可自行决定。尚未绑定远端、推送、打 tag、发布 Release 或提交社区审核。

## 首次发布前

1. 在真实宿主的空白演示库安装本项目，关闭所有社区插件，确认浅色与深色模式独立可用。
2. 完成 `AUDIT.md` 中的真机验收，使用虚构笔记，在真实应用里截取截图，保存为 `screenshots/store.png`。官方推荐 512×288；更大的同宽高比截图也可以。不要将本项目的浏览器模拟图冒充真实截图。
3. 将截图链接加入 README，例如 `![Cockpit Glass](./screenshots/store.png)`，确认截图不含私人笔记、账户或桌面通知。
4. 执行 `npm ci && npm test && npm run test:ui && npm run release:check`；浏览器检查需要先按 README 准备本地宿主 CSS 与 Chromium。
5. 更新审计文档记录真机结果。保持 manifest、package、versions 三处版本一致。

## 连接用户创建的空仓库

在项目目录执行（将地址替换成实际新仓库）：

```sh
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

仓库建议创建为空仓库，不预建 README / License，避免不相关的远程提交。若已创建，请先合并远程历史，不要强制覆盖。

## GitHub Release

主题与插件不同：本项目不产出 `main.js` 或 `styles.css`，只分发根目录的 `manifest.json` 与 `theme.css`。

```sh
git tag 1.3.0
git push origin 1.3.0
GH_FORCE_TTY=0 gh release create 1.3.0 --title 'Cockpit Glass 1.3.0' --notes-file CHANGELOG.md manifest.json theme.css
```

Tag 必须和 manifest 的 `version` 完全一致，使用 `x.y.z`。确认 Release 正式发布并包含两个独立附件，不能只上传 ZIP。默认分支的 manifest 也必须提交并同步。

## 社区提交

截至 2026-11-01，官方流程为 **Obsidian Community directory**，不再按旧教程修改主题列表 JSON 提 PR：

1. 登录 [community.obsidian.md](https://community.obsidian.md)，连接 GitHub 账户。
2. 通过 Add a plugin or theme 提交新仓库地址。
3. 填写截图路径 `screenshots/store.png`，选择 Light 和 Dark 模式。
4. 按自动检查反馈修复、递增版本并发布新 Release。

主题提交后的显示名称不能修改，提交前确认使用 **Cockpit Glass**。2026-11-01 检查旧公开主题列表没有同名条目，但该列表不能证明新目录名称实时可用，提交表单仍需确认。

## 官方依据

- [Submit your theme](https://docs.obsidian.md/themes/app-themes/submit-theme)
- [Set up and claim](https://docs.obsidian.md/community-directory/set-up-and-claim)
- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Theme guidelines](https://docs.obsidian.md/Themes/App%20themes/Theme%20guidelines)

保持离线可用，优先 CSS 变量，避免复杂结构覆盖和 `!important`。不发布本地提取的宿主 CSS；它只用于兼容验证。
