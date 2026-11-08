const icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 4v16"/></svg>';
export function fixture() {
  // Reading-view inline dimensions mirror the host's runtime constructor.
  return `<!doctype html><html><head><meta charset="utf-8"><title>Cockpit Glass — synthetic regression fixture</title></head>
  <body class="theme-light mod-macos is-focused is-hidden-frameless is-frameless">
  <div class="app-container"><div class="horizontal-main-container"><div class="workspace">
    <div class="workspace-split mod-horizontal mod-left-split mod-primary-split" style="width:248px; flex:0 0 248px">
      <div class="workspace-leaf-resize-handle" id="left-divider"></div>
      <div class="workspace-tabs mod-sidedock"><div class="workspace-tab-container"><div class="workspace-leaf"><div class="workspace-leaf-content" data-type="file-explorer">
        <div class="nav-header"><div class="nav-buttons-container">
          <div class="clickable-icon nav-action-button" tabindex="0" role="button" aria-label="New note">${icon}</div>
          <div class="clickable-icon nav-action-button" tabindex="0" role="button" aria-label="New folder">${icon}</div>
          <div class="clickable-icon nav-action-button is-disabled" aria-disabled="true" role="button" aria-label="Disabled action">${icon}</div>
        </div></div>
        <div class="search-input-container"><input aria-label="Search files" type="search" placeholder="Search your notes…"></div>
        <div class="nav-files-container"><div class="nav-folder mod-root"><div class="nav-folder-children">
          <div class="nav-folder"><div class="tree-item-self nav-folder-title" tabindex="0" id="folder"><div class="tree-item-inner">Field notes</div></div><div class="nav-folder-children tree-item-children">
            <div class="nav-file"><div class="tree-item-self nav-file-title is-active" tabindex="0"><div class="tree-item-inner">A quieter workspace</div></div></div>
            <div class="nav-file"><div class="tree-item-self nav-file-title" tabindex="0"><div class="tree-item-inner">Reading list</div></div></div>
          </div></div>
          <div class="nav-folder"><div class="tree-item-self nav-folder-title" tabindex="0"><div class="tree-item-inner">Projects</div></div></div>
        </div></div></div>
      </div></div></div></div>
    </div>
    <div class="workspace-split mod-vertical mod-root" style="flex:1; min-width:0">
      <div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space mod-active">
        <div class="workspace-tab-header-container" id="bar">
          <div class="sidebar-toggle-button mod-left mod-primary"><div class="clickable-icon" tabindex="0" role="button" aria-label="Toggle left sidebar">${icon}</div></div>
          <div class="workspace-tab-header-container-inner" id="tabs"></div>
          <div class="workspace-tab-header-new-tab"><div class="clickable-icon" tabindex="0" role="button" aria-label="New tab">+</div></div>
          <div class="workspace-tab-header-spacer"></div>
          <div class="workspace-tab-header-tab-list"><div class="clickable-icon" tabindex="0" role="button" aria-label="List tabs">⌄</div></div>
          <div class="sidebar-toggle-button mod-right"><div class="clickable-icon" tabindex="0" role="button" aria-label="Toggle right sidebar">${icon}</div></div>
        </div>
        <div class="workspace-tab-container"><div class="workspace-leaf"><div class="workspace-leaf-content is-read-mode" data-type="markdown">
          <div class="view-header"><div class="view-header-title-container"><div class="view-header-title">A quieter workspace</div></div></div>
          <div class="view-content"><div class="markdown-reading-view" style="width:100%;height:100%"><div class="markdown-preview-view markdown-rendered is-readable-line-width"><div class="markdown-preview-sizer"><h1>留一点空间，安静地阅读</h1><p>Make room for the things worth noticing.</p><h2>让思绪自然展开</h2><p>这是一篇用于版式验证的示例笔记。阅读时，适度的行宽、清楚的标题层级和自然的段落间距，让目光沿着内容缓缓向下。背景保持完整通透，为文字留出安静的位置。</p><p>Soft surfaces, clear text, and a familiar place to think. Cockpit Glass follows your accent color while keeping your notes at the center.</p><blockquote><p>Small details make everyday tools feel considered.<br>细节让日常阅读更加从容。</p></blockquote><h2>今天的小计划</h2><ul><li>读完一个章节，记下值得回看的内容</li><li>Collect a few ideas</li><li>给明天留一点空间</li></ul><hr><h2>阅读记录</h2><table><thead><tr><th>内容</th><th>进度</th><th>下一步</th></tr></thead><tbody><tr><td>Field notes</td><td>已整理</td><td>补充例子</td></tr><tr><td>Reading list</td><td>进行中</td><td>继续阅读</td></tr></tbody></table><pre><code>const note = { title: 'A quieter workspace', tags: ['reading', 'ideas'], updated: '2026-11-08' };</code></pre><p><a href="#">Reading list</a> · <code>local notes</code></p></div></div></div></div>
        </div></div></div>
      </div>
    </div>
    <div class="workspace-split mod-horizontal mod-right-split mod-secondary-split" style="display:none; width:200px; flex:0 0 200px" id="right-dock">
      <div class="workspace-leaf-resize-handle" id="right-divider"></div>
      <div class="workspace-tabs mod-sidedock"><div class="workspace-tab-container"><div class="workspace-leaf"><div class="workspace-leaf-content" data-type="backlink"><div class="view-content"><p>No linked mentions</p></div></div></div></div></div>
    </div>
  </div></div></div>
  <div class="modal-container mod-dim" id="dialog" style="display:none"><div class="modal-bg"></div><div class="modal"><div class="modal-title">A clear surface</div><div class="modal-content"><p>This is a synthetic dialog used to check opacity.</p><button>Continue</button></div></div></div>
  <div class="modal-container mod-dim" id="settings" style="display:none"><div class="modal-bg"></div><div class="modal mod-settings mod-sidebar-layout"><div class="modal-content vertical-tabs-container"><div class="vertical-tab-header"><div class="vertical-tab-header-group"><div class="vertical-tab-nav-item is-active">Appearance</div></div></div><div class="vertical-tab-content setting-page"><div class="setting-page-titlebar"><div class="setting-page-title">Appearance</div></div><div class="setting-page-content">${'<div class="setting-item"><div class="setting-item-info"><div class="setting-item-name">Example setting</div><div class="setting-item-description">Synthetic content for scrolling checks</div></div><div class="setting-item-control"><button>Choose</button></div></div>'.repeat(24)}</div></div></div></div></div>
  </body></html>`;
}

// CodeMirror's document structure; content and dimensions stand in for app JS.
export function editor(livePreview = false) {
  return `<div class="markdown-source-view mod-cm6 is-readable-line-width ${livePreview ? 'is-live-preview' : ''}"><div class="cm-editor"><div class="cm-scroller"><div class="cm-gutters"><div class="cm-gutter cm-lineNumbers"><div class="cm-gutterElement">1</div></div></div><div class="cm-sizer"><div class="cm-contentContainer"><div class="cm-content" contenteditable="true" role="textbox" aria-label="Note editor"><div class="cm-line"># A quieter workspace</div><div class="cm-line">Keep a little room for new ideas.</div></div></div></div></div></div></div>`;
}

export function tabs(count) {
  return Array.from({ length: count }, (_, i) => `<div class="workspace-tab-header ${i === 0 ? 'is-active' : ''}" data-type="markdown" tabindex="0" role="tab" aria-selected="${i === 0}"><div class="workspace-tab-header-inner"><div class="workspace-tab-header-inner-title">${i === 0 ? 'A quieter workspace' : 'Notes ' + (i + 1)}</div><div class="workspace-tab-header-inner-close-button" role="button" tabindex="0" aria-label="Close tab">×</div></div></div>`).join('');
}

// Only dimensions/content normally supplied by app JS. No theme/layout repairs.
export const fixtureStyles = `
  .app-container { position:relative; height:100vh; }
  .workspace { width:100%; height:100%; }
  .workspace-tabs { height:100%; }
  .workspace-tab-header-container-inner { width:600px; }
  .workspace-tab-container { flex:1; min-height:0; }
  .workspace-leaf { height:100%; }
  .workspace-leaf-content { height:100%; display:flex; flex-direction:column; }
  .search-input-container { margin:8px 12px; }
  .search-input-container input { width:100%; }
  /* Geometry normally injected by CodeMirror's runtime stylesheet. */
  .cm-editor { display:flex; flex-direction:column; }
  .cm-scroller { display:flex; align-items:flex-start; height:100%; overflow:auto; position:relative; }
  .cm-content { flex-grow:2; flex-shrink:0; }
`;
