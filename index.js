import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer as createNetServer } from 'node:net'
import { homedir } from 'node:os'
import { join } from 'node:path'

const requireFromHere = createRequire(import.meta.url)

export const name = 'dsh-trae-solo'
export const inject = ['webServer', 'sessions', 'connection']

let rebuildTimer = null
let cachedNodePty = null

function loadNodePty() {
  if (cachedNodePty) return cachedNodePty
  const candidates = [
    join(homedir(), '.dsh', 'cache', 'openvscode-server-v1.109.5', 'node_modules', 'node-pty'),
    'node-pty',
  ]
  for (const cand of candidates) {
    try {
      cachedNodePty = requireFromHere(cand)
      if (cachedNodePty) return cachedNodePty
    } catch {}
  }
  return null
}

function detectAvailableShells() {
  const candidates = [
    { name: 'zsh', paths: ['/bin/zsh', '/usr/bin/zsh', '/usr/local/bin/zsh'], args: ['-i'] },
    { name: 'bash', paths: ['/bin/bash', '/usr/bin/bash'], args: ['-i'] },
    { name: 'fish', paths: ['/usr/bin/fish', '/bin/fish', '/usr/local/bin/fish'], args: ['-i'] },
    { name: 'sh', paths: ['/bin/sh', '/usr/bin/sh'], args: ['-i'] },
  ]
  const found = []
  for (const c of candidates) {
    for (const p of c.paths) {
      if (existsSync(p)) {
        found.push({ name: c.name, path: p, args: c.args })
        break
      }
    }
  }
  const envShell = process.env.SHELL
  if (envShell && existsSync(envShell)) {
    const base = envShell.split('/').pop() || 'sh'
    const idx = found.findIndex((s) => s.path === envShell || s.name === base)
    if (idx > 0) {
      const [pref] = found.splice(idx, 1)
      found.unshift(pref)
    } else if (idx < 0) {
      found.unshift({ name: base, path: envShell, args: ['-i'] })
    }
  }
  return found.length > 0 ? found : [{ name: 'sh', path: '/bin/sh', args: ['-i'] }]
}

const SERVER_DIR = join(homedir(), '.dsh', 'cache', 'openvscode-server-v1.109.5')
const DATA_ROOT = join(homedir(), '.dsh', 'cache', 'trae-solo-data')
const USER_DATA_DIR = join(DATA_ROOT, 'user-data')
const EXTENSIONS_DIR = join(DATA_ROOT, 'extensions')
const SETTINGS_PATH = join(USER_DATA_DIR, 'Machine', 'settings.json')
const USER_SETTINGS_PATH = join(USER_DATA_DIR, 'User', 'settings.json')

/**
 * Default VS Code settings to replicate the exact Trae SOLO Mode layout and behavior:
 * - Editor on the left, Explorer/Search/SCM/Extensions sidebar on the right
 * - Activity bar icons horizontally at the top of the right sidebar
 * - Auto-save enabled (afterDelay, 500ms)
 * - Clean chrome (no menu bar, no layout controls, no command center, no minimap)
 */
const TRAE_DEFAULT_SETTINGS = {
  'files.autoSave': 'afterDelay',
  'files.autoSaveDelay': 500,
  // Append-style tabs: every opened file gets its own tab instead of replacing the italic "preview" tab
  'workbench.editor.enablePreview': false,
  'workbench.editor.enablePreviewFromQuickOpen': false,
  'workbench.editor.enablePreviewFromCodeNavigation': false,
  'workbench.sideBar.location': 'right',
  'workbench.secondarySideBar.defaultVisibility': 'hidden',
  'workbench.activityBar.location': 'top',
  'window.menuBarVisibility': 'hidden',
  'workbench.layoutControl.enabled': false,
  'window.commandCenter': false,
  'chat.disableAIFeatures': true,
  'chat.commandCenter.enabled': false,
  'chat.agent.enabled': false,
  'workbench.startupEditor': 'none',
  'workbench.tips.enabled': false,
  'workbench.welcomePage.walkthroughs.openOnInstall': false,
  'security.workspace.trust.enabled': false,
  'editor.minimap.enabled': false,
  'editor.renderWhitespace': 'selection',
  'editor.bracketPairColorization.enabled': true,
  'editor.guides.bracketPairs': 'active',
  'editor.smoothScrolling': true,
  'editor.stickyScroll.enabled': false,
  'editor.fontSize': 13,
  'editor.lineHeight': 20,
  'editor.fontFamily': "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  'breadcrumbs.enabled': true,
  'explorer.compactFolders': false,
  'explorer.confirmDelete': false,
  'explorer.confirmDragAndDrop': false,
  'git.enableSmartCommit': true,
  'git.confirmSync': false,
  'git.autofetch': true,
  'extensions.ignoreRecommendations': true,
  'telemetry.telemetryLevel': 'off',
  'update.mode': 'none',
  'workbench.colorCustomizations': {
    'statusBar.background': '#f3f4f6',
    'statusBar.foreground': '#4b5563',
    'statusBar.noFolderBackground': '#f3f4f6',
    'statusBar.border': '#e5e7eb',
    'sideBar.background': '#f9fafb',
    'sideBar.border': '#e5e7eb',
    'sideBarSectionHeader.background': '#f3f4f6',
    'sideBarSectionHeader.foreground': '#374151',
    'editorGroupHeader.tabsBackground': '#f9fafb',
    'tab.activeBackground': '#ffffff',
    'tab.inactiveBackground': '#f3f4f6',
    'tab.activeBorderTop': '#10b981',
    'focusBorder': '#10b981',
    'activityBarBadge.background': '#3b82f6',
    'activityBarBadge.foreground': '#ffffff',
  },
}

/** Ensure Trae SOLO default settings and product.json Chinese NLS patch are in place. */
function ensureTraeConfiguration() {
  mkdirSync(join(USER_DATA_DIR, 'Machine'), { recursive: true })
  mkdirSync(join(USER_DATA_DIR, 'User'), { recursive: true })
  mkdirSync(EXTENSIONS_DIR, { recursive: true })

  for (const target of [SETTINGS_PATH, USER_SETTINGS_PATH]) {
    let existing = {}
    if (existsSync(target)) {
      try {
        existing = JSON.parse(readFileSync(target, 'utf-8'))
      } catch {
        existing = {}
      }
    }
    const merged = {
      ...TRAE_DEFAULT_SETTINGS,
      ...existing,
      'files.autoSave': existing['files.autoSave'] ?? 'afterDelay',
      'workbench.editor.enablePreview': false,
      'workbench.editor.enablePreviewFromQuickOpen': false,
      'workbench.editor.enablePreviewFromCodeNavigation': false,
      'workbench.sideBar.location': 'right',
      'workbench.secondarySideBar.defaultVisibility': 'hidden',
      'workbench.activityBar.location': 'top',
      'window.menuBarVisibility': 'hidden',
      'workbench.layoutControl.enabled': false,
      'window.commandCenter': false,
      'chat.disableAIFeatures': true,
      'chat.commandCenter.enabled': false,
      'chat.agent.enabled': false,
      'workbench.startupEditor': 'none',
      'security.workspace.trust.enabled': false,
    }
    writeFileSync(target, JSON.stringify(merged, null, 2), 'utf-8')
  }

  // Ensure workbench.html loads our pre-generated Chinese NLS messages and bridge script
  const zhNlsPath = join(SERVER_DIR, 'out', 'nls.messages.zh-cn.js')
  const bundledZhNls = join(new URL('.', import.meta.url).pathname, 'resources', 'nls.messages.zh-cn.js')
  if (!existsSync(zhNlsPath) && existsSync(bundledZhNls) && existsSync(join(SERVER_DIR, 'out'))) {
    try {
      copyFileSync(bundledZhNls, zhNlsPath)
    } catch {}
  }
  const workbenchHtmlPath = join(SERVER_DIR, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html')
  if (existsSync(workbenchHtmlPath)) {
    try {
      let html = readFileSync(workbenchHtmlPath, 'utf-8')
      let changed = false
      if (existsSync(zhNlsPath) && !html.includes('nls.messages.zh-cn.js')) {
        html = html.replace(
          '<script type="module" src="{{WORKBENCH_NLS_FALLBACK_URL}}"></script>',
          '<script type="module" src="{{WORKBENCH_NLS_FALLBACK_URL}}"></script>\n\t<script type="module" src="{{WORKBENCH_WEB_BASE_URL}}/out/nls.messages.zh-cn.js"></script>',
        )
        changed = true
      }
      if (!html.includes('trae-solo-layout-fix')) {
        const inlineLayoutFix = `<script nonce="1nline-m4p" id="trae-solo-layout-fix">try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;if(k.includes('auxiliaryBar.hidden'))localStorage.setItem(k,'true');if(k.includes('sideBar.position'))localStorage.setItem(k,'1');if(k.includes('sideBar.hidden'))localStorage.setItem(k,'false');}}catch(e){}</script>`
        html = html.replace('</head>', `\t${inlineLayoutFix}\n\t</head>`)
        changed = true
      }
      if (!html.includes('trae-solo-bridge')) {
        const bridgeScript = `<script nonce="1nline-m4p" id="trae-solo-bridge">
(function() {
  try {
    const meta = document.getElementById('vscode-workbench-web-configuration');
    if (meta) {
      const cfg = JSON.parse(meta.getAttribute('data-settings') || '{}');
      const params = new URL(window.location.href).searchParams;
      const themeParam = params.get('theme');
      const isDark = themeParam === 'dark' || (!themeParam && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      cfg.configurationDefaults = cfg.configurationDefaults || {};
      cfg.configurationDefaults['workbench.colorTheme'] = isDark ? 'Default Dark Modern' : 'Default Light Modern';
      meta.setAttribute('data-settings', JSON.stringify(cfg));
    }
  } catch(e) {}
  window.addEventListener('dragstart', (e) => {
    try {
      setTimeout(() => {
        let p = '';
        if (e.dataTransfer) p = e.dataTransfer.getData('text/plain') || '';
        if (!p && e.target && e.target.closest) {
          const row = e.target.closest('[data-resource-name], [title], .monaco-list-row');
          if (row) p = row.getAttribute('title') || row.getAttribute('data-resource-name') || '';
        }
        if (p && window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'trae-solo:drag-file', path: p }, '*');
        }
      }, 0);
    } catch(err) {}
  }, true);
  window.addEventListener('dragend', () => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'trae-solo:drag-end' }, '*');
      }
    } catch(err) {}
  }, true);
})();
</script>`
        html = html.replace('</head>', `\t${bridgeScript}\n\t</head>`)
        changed = true
      }
      if (changed) {
        writeFileSync(workbenchHtmlPath, html, 'utf-8')
      }
    } catch {
      // Ignore read-only or race errors
    }
  }

  // Ensure server-main.js hashes all script tags including ones with attributes for CSP
  const serverMainPath = join(SERVER_DIR, 'out', 'server-main.js')
  if (existsSync(serverMainPath)) {
    try {
      let serverJs = readFileSync(serverMainPath, 'utf-8')
      const oldRegex = 'const s=/<script>([\\s\\S]+?)<\\/script>/img'
      const newRegex = 'const s=/<script\\b[^>]*>([\\s\\S]+?)<\\/script>/img'
      if (serverJs.includes(oldRegex)) {
        serverJs = serverJs.replace(oldRegex, newRegex)
        writeFileSync(serverMainPath, serverJs, 'utf-8')
      }
    } catch {
      // Ignore
    }
  }

  // Ensure workbench.js has setTraeTheme, auxiliarybar hidden, and traeSolo.addToChat context menus
  const workbenchJsPath = join(SERVER_DIR, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.js')
  if (existsSync(workbenchJsPath)) {
    try {
      let js = readFileSync(workbenchJsPath, 'utf-8')
      let jsChanged = false
      const targetTheme = 't.invokeFunction(i=>{const n=i.get(De)'
      if (js.includes(targetTheme)) {
        const patchTheme = `t.invokeFunction(i=>{try{const cfg=i.get(z);window.setTraeTheme=(d)=>{cfg.updateValue('workbench.colorTheme',d?'Default Dark Modern':'Default Light Modern',2);cfg.updateValue('workbench.colorCustomizations',d?{'statusBar.background':'#18181b','statusBar.foreground':'#a1a1aa','statusBar.noFolderBackground':'#18181b','statusBar.border':'#27272a','sideBar.background':'#18181b','sideBar.border':'#27272a','sideBarSectionHeader.background':'#202024','sideBarSectionHeader.foreground':'#e4e4e7','editor.background':'#121215','editorGroupHeader.tabsBackground':'#18181b','tab.activeBackground':'#121215','tab.inactiveBackground':'#18181b','tab.activeBorderTop':'#10b981','focusBorder':'#10b981','activityBarBadge.background':'#3b82f6','activityBarBadge.foreground':'#ffffff'}:{'statusBar.background':'#f3f4f6','statusBar.foreground':'#4b5563','statusBar.noFolderBackground':'#f3f4f6','statusBar.border':'#e5e7eb','sideBar.background':'#f9fafb','sideBar.border':'#e5e7eb','sideBarSectionHeader.background':'#f3f4f6','sideBarSectionHeader.foreground':'#374151','editorGroupHeader.tabsBackground':'#f9fafb','tab.activeBackground':'#ffffff','tab.inactiveBackground':'#f3f4f6','tab.activeBorderTop':'#10b981','focusBorder':'#10b981','activityBarBadge.background':'#3b82f6','activityBarBadge.foreground':'#ffffff'},2)};window.addEventListener('message',m=>{if(m.data?.type==='trae-solo:set-theme'){window.setTraeTheme(m.data.mode==='dark')}});try{const ls=i.get(Zh);if(ls?.setPartHidden)ls.setPartHidden(true,'workbench.parts.auxiliarybar')}catch(e){}}catch(e){};const n=i.get(De)`
        js = js.replace(targetTheme, patchTheme)
        jsChanged = true
      }
      const openFileMarker = "window.addEventListener('message',m=>{if(m.data?.type==='trae-solo:set-theme'){window.setTraeTheme(m.data.mode==='dark')}});"
      if (js.includes(openFileMarker) && !js.includes('trae-solo:open-file')) {
        const openFilePatch = `window.addEventListener('message',m=>{try{const d=m.data;if(d&&d.type==='trae-solo:open-file'&&typeof d.path==='string'){const uri='vscode-remote://'+window.location.host+encodeURI(d.path)+(d.line?'#L'+d.line:'');t.invokeFunction(a=>a.get(Ct).open(uri,{fromUserGesture:true})).then(()=>{try{window.parent.postMessage({type:'trae-solo:open-file-ack',path:d.path},'*')}catch(e){}},e=>console.error('trae-solo open-file failed',e))}}catch(e){console.error(e)}});setTimeout(()=>{try{window.parent.postMessage({type:'trae-solo:ready'},'*')}catch(e){}},0);window.addEventListener('load',()=>{try{window.parent.postMessage({type:'trae-solo:ready'},'*')}catch(e){}});`
        js = js.replace(openFileMarker, openFileMarker + openFilePatch)
        jsChanged = true
      }
      const targetLayoutLoad = 'for(t in Qt){const r=Qt[t];this.b.get(r.name)===void 0&&this.b.set(r.name,r.defaultValue)}'
      if (js.includes(targetLayoutLoad) && !js.includes('this.b.set(Qt.SIDEBAR_POSITON.name,1)')) {
        js = js.replace(
          targetLayoutLoad,
          `${targetLayoutLoad};this.b.set(Qt.SIDEBAR_POSITON.name,1);this.b.set(Qt.SIDEBAR_HIDDEN.name,!1);this.b.set(Qt.AUXILIARYBAR_HIDDEN.name,!0);`,
        )
        jsChanged = true
      }
      const targetSidebarDefault = 'SIDEBAR_POSITON:new Yg("sideBar.position",1,1,0)'
      if (js.includes(targetSidebarDefault)) {
        js = js.replace(targetSidebarDefault, 'SIDEBAR_POSITON:new Yg("sideBar.position",1,1,1)')
        jsChanged = true
      }
      const targetMenu = 'ae.appendMenuItem(I.ExplorerContext,{submenu:I.ExplorerContextShare,title:L(992,"Share"),group:"11_share",order:-1});'
      if (js.includes(targetMenu) && !js.includes('traeSolo.addToChat')) {
        const patchMenu = `Fe.registerCommand("traeSolo.addToChat",(acc,...args)=>{try{let filePath="",selectedText="",lines=null,uri=null;if(args&&args.length>0&&args[0]){if(args[0].uri)uri=args[0].uri;else if(args[0].resource)uri=args[0].resource;else if(args[0].scheme)uri=args[0];else if(Array.isArray(args[0])&&args[0][0])uri=args[0][0].uri||args[0][0].resource||args[0][0]}try{const ce=acc.get(ii)?.getFocusedCodeEditor?.(),es=acc.get(ne),ctrl=ce||es?.activeTextEditorControl;if(ctrl){const m=ctrl.getModel?.(),sel=ctrl.getSelection?.();if(m){if(!uri)uri=m.uri;if(sel&&!sel.isEmpty()){selectedText=m.getValueInRange(sel);lines={start:sel.startLineNumber,end:sel.endLineNumber}}}}}catch(e){}if(uri)filePath=uri.path||uri.fsPath||"";if(filePath&&window.parent&&window.parent!==window){window.parent.postMessage({type:"trae-solo:insert-reference",path:filePath,lines:lines,text:selectedText||null},"*")}}catch(err){console.error("traeSolo.addToChat error:",err)}});ae.appendMenuItem(I.ExplorerContext,{command:{id:"traeSolo.addToChat",title:"添加到会话"},group:"navigation",order:-100});ae.appendMenuItem(I.EditorTitleContext,{command:{id:"traeSolo.addToChat",title:"添加到会话"},group:"navigation",order:-100});ae.appendMenuItem(I.EditorContext,{command:{id:"traeSolo.addToChat",title:"添加到会话"},group:"navigation",order:-100});`
        js = js.replace(targetMenu, patchMenu + targetMenu)
        jsChanged = true
      }
      if (jsChanged) {
        writeFileSync(workbenchJsPath, js, 'utf-8')
      }
    } catch {
      // Ignore
    }
  }
}

/** Pick an available localhost TCP port. */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createNetServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

/** Resolve the authoritative working directory of a DSH session. */
async function resolveSessionCwd(ctx, sessionId) {
  if (sessionId) {
    const session = ctx.sessions?.get?.(sessionId)
    if (session) {
      const cwd = ctx.get('workingDirectory')?.get?.(session) ?? session.header?.cwd
      if (cwd) return cwd
    }
    const persistence = ctx.get('sessionPersistence')
    if (persistence?.stat) {
      try {
        const snap = await persistence.stat(sessionId)
        if (snap?.header?.cwd) return snap.header.cwd
      } catch {
        // Fallback below
      }
    }
  }
  const workspaces = ctx.get('workspaceRegistry')?.list?.() ?? []
  if (workspaces.length > 0 && workspaces[0]?.path) {
    return workspaces[0].path
  }
  return ctx.get('workingDirectory')?.defaultDirectory || process.cwd()
}

/**
 * In-page Inspector & Live Editor script injected into every page loaded in SOLO Browser.
 * Capabilities:
 * 1. Green element highlight box + semantic label badge (Button, Input, Image, Text, Link, Item...)
 * 2. Floating toolbar on selected element: [✨ 添加到对话] and [快捷编辑文案]
 * 3. React Fiber (_debugSource) and Vue (__vueParentComponent) source file + line locator
 * 4. Real-time inline style editing & text editing with diff tracking
 * 5. Console error/warn/log + unhandled error interception and forwarding to parent DSH
 */
function buildInspectorScript(targetUrl) {
  return `<script id="__trae_solo_inspector__">
(function() {
  if (window.__TRAE_SOLO_INSPECTOR_ACTIVE__) return;
  window.__TRAE_SOLO_INSPECTOR_ACTIVE__ = true;
  const TARGET_URL = ${JSON.stringify(targetUrl)};

  function postToHost(payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(Object.assign({ source: 'trae-solo-browser', pageUrl: TARGET_URL }, payload), '*');
      }
    } catch (e) {}
  }

  // 1. Console & Runtime Error Interception
  function formatArg(a) {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (a instanceof Error) return (a.stack || a.message || String(a));
    if (typeof a === 'object') {
      try { return JSON.stringify(a); } catch (e) { return String(a); }
    }
    return String(a);
  }

  ['error', 'warn', 'log', 'info'].forEach((level) => {
    const orig = console[level];
    console[level] = function(...args) {
      try {
        const text = args.map(formatArg).join(' ');
        let stack = '';
        if (level === 'error') {
          const errObj = args.find(x => x instanceof Error);
          stack = errObj ? (errObj.stack || '') : (new Error().stack || '').split('\\n').slice(2, 6).join('\\n');
        }
        postToHost({
          type: 'trae-browser:console',
          level,
          text: text.slice(0, 2000),
          stack: stack.slice(0, 1500),
          ts: Date.now()
        });
      } catch (e) {}
      if (orig) return orig.apply(this, args);
    };
  });

  window.addEventListener('error', (ev) => {
    postToHost({
      type: 'trae-browser:console',
      level: 'error',
      text: ev.message || 'Uncaught Error',
      stack: (ev.filename ? ev.filename + ':' + ev.lineno + ':' + ev.colno : '') + (ev.error && ev.error.stack ? '\\n' + ev.error.stack : ''),
      ts: Date.now()
    });
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    postToHost({
      type: 'trae-browser:console',
      level: 'error',
      text: 'Unhandled Promise Rejection: ' + formatArg(r),
      stack: r && r.stack ? String(r.stack) : '',
      ts: Date.now()
    });
  });

  // Notify title & URL on load
  function reportPageMeta() {
    postToHost({
      type: 'trae-browser:page-meta',
      title: document.title || TARGET_URL,
      url: TARGET_URL
    });
  }
  window.addEventListener('DOMContentLoaded', () => {
    reportPageMeta();
    postToHost({ type: 'trae-browser:inspector-ready' });
  });
  window.addEventListener('load', () => {
    reportPageMeta();
    postToHost({ type: 'trae-browser:inspector-ready' });
  });
  setTimeout(() => {
    reportPageMeta();
    postToHost({ type: 'trae-browser:inspector-ready' });
  }, 200);

  // Intercept link clicks so navigation stays inside the proxy
  document.addEventListener('click', (e) => {
    if (inspectMode) return;
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const rawHref = a.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
    try {
      const resolved = new URL(rawHref, TARGET_URL).href;
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        e.preventDefault();
        postToHost({ type: 'trae-browser:navigate', url: resolved });
      }
    } catch (err) {}
  }, true);

  // 2. Semantic Tag Name & CSS Selector Builder
  function getSemanticLabel(el) {
    if (!el || !el.tagName) return 'Element';
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || el.getAttribute('role') === 'button' || (tag === 'input' && ['button', 'submit'].includes(el.type))) return 'Button';
    if (tag === 'a') return 'Link';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'Input';
    if (tag === 'img' || tag === 'svg' || tag === 'canvas' || tag === 'video') return 'Image';
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'strong', 'em'].includes(tag)) return 'Text';
    if (['li', 'tr', 'td', 'dd', 'dt'].includes(tag)) return 'Item';
    if (['ul', 'ol', 'table', 'dl'].includes(tag)) return 'List';
    if (['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'form'].includes(tag)) return tag.charAt(0).toUpperCase() + tag.slice(1);
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/)[0] : '';
    return tag + (cls.length < 18 ? cls : '');
  }

  function getCssSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && cur !== document.body && cur !== document.documentElement && depth < 5) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        parts.unshift('#' + CSS.escape(cur.id));
        break;
      }
      if (typeof cur.className === 'string' && cur.className.trim()) {
        const classes = cur.className.trim().split(/\\s+/).filter(c => c && !c.startsWith('__trae')).slice(0, 2);
        if (classes.length) part += '.' + classes.map(c => CSS.escape(c)).join('.');
      }
      const parent = cur.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(cur) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(part);
      cur = parent;
      depth++;
    }
    return parts.join(' > ');
  }

  // 3. React Fiber / Vue / DOM Source Location Extraction
  function getSourceLocation(el) {
    let cur = el;
    while (cur && cur !== document.body) {
      // Explicit data attributes (Vite/Babel plugins)
      const dataSource = cur.getAttribute?.('data-source') || cur.getAttribute?.('data-inspector-line') || cur.getAttribute?.('data-v-inspector');
      if (dataSource) return { file: dataSource, framework: 'DOM' };

      // React Fiber _debugSource
      const keys = Object.keys(cur);
      const fiberKey = keys.find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (fiberKey) {
        let fiber = cur[fiberKey];
        while (fiber) {
          const src = fiber._debugSource;
          if (src && src.fileName) {
            return {
              file: src.fileName,
              line: src.lineNumber || 1,
              column: src.columnNumber || 1,
              component: (fiber.type && (fiber.type.displayName || fiber.type.name)) || null,
              framework: 'React'
            };
          }
          fiber = fiber._debugOwner || fiber.return;
        }
      }

      // Vue 3 __vueParentComponent
      if (cur.__vueParentComponent) {
        let comp = cur.__vueParentComponent;
        while (comp) {
          const file = comp.type && comp.type.__file;
          if (file) {
            return {
              file,
              line: 1,
              component: comp.type.name || comp.type.__name || null,
              framework: 'Vue'
            };
          }
          comp = comp.parent;
        }
      }
      cur = cur.parentElement;
    }
    return null;
  }

  function extractElementInfo(el) {
    if (!el || el.nodeType !== 1) return null;
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const selector = getCssSelector(el);
    const semantic = getSemanticLabel(el);
    const source = getSourceLocation(el);
    const textContent = (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 200);
    const clone = el.cloneNode(true);
    const outerHTML = (clone.outerHTML || '').slice(0, 800);

    const styles = {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      textAlign: cs.textAlign,
      padding: cs.padding,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      margin: cs.margin,
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      marginLeft: cs.marginLeft,
      width: Math.round(rect.width) + 'px',
      height: Math.round(rect.height) + 'px',
      display: cs.display,
      flexDirection: cs.flexDirection,
      justifyContent: cs.justifyContent,
      alignItems: cs.alignItems,
      gap: cs.gap,
      borderRadius: cs.borderRadius,
      border: cs.border,
      opacity: cs.opacity,
    };

    const modifiedInline = el.getAttribute('data-trae-modified-styles')
      ? JSON.parse(el.getAttribute('data-trae-modified-styles'))
      : {};
    const modifiedText = el.getAttribute('data-trae-modified-text') || null;

    return {
      tagName: el.tagName.toLowerCase(),
      semantic,
      selector,
      textContent,
      outerHTML,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      styles,
      modifiedInline,
      modifiedText,
      source,
      pageUrl: TARGET_URL,
      pageTitle: document.title || TARGET_URL,
    };
  }

  // 4. Visual Overlay UI inside the Page (Green Highlight Box + Action Pill)
  let inspectMode = false;
  let hoveredEl = null;
  let selectedEl = null;
  let overlayRoot = null;
  let hoverBox = null;
  let hoverBadge = null;
  let selectBox = null;
  let selectBadge = null;
  let actionBar = null;

  function ensureOverlay() {
    if (overlayRoot && document.body && document.body.contains(overlayRoot)) return;
    if (!document.body) return;

    overlayRoot = document.createElement('div');
    overlayRoot.id = '__trae_solo_overlay_root__';
    overlayRoot.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    // Hover highlight box
    hoverBox = document.createElement('div');
    hoverBox.style.cssText = 'position:fixed;pointer-events:none;border:1.5px solid #10b981;background:rgba(16,185,129,0.06);border-radius:2px;display:none;transition:all 0.04s ease-out;';
    hoverBadge = document.createElement('div');
    hoverBadge.style.cssText = 'position:absolute;bottom:-22px;left:-1.5px;background:#10b981;color:#fff;font-size:11px;font-weight:600;padding:1px 6px;border-radius:3px;white-space:nowrap;line-height:16px;';
    hoverBox.appendChild(hoverBadge);

    // Selected highlight box (solid green border, matching Screenshot 2)
    selectBox = document.createElement('div');
    selectBox.style.cssText = 'position:fixed;pointer-events:none;border:1.5px solid #10b981;background:rgba(16,185,129,0.03);border-radius:2px;display:none;';

    // Floating compact action bar matching Screenshot 2: [div] [✦ 添加到对话]
    actionBar = document.createElement('div');
    actionBar.style.cssText = 'position:fixed;pointer-events:auto;display:none;align-items:center;gap:4px;z-index:2147483647;';

    selectBadge = document.createElement('span');
    selectBadge.style.cssText = 'display:inline-flex;align-items:center;background:#10b981;color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;line-height:16px;box-shadow:0 2px 6px rgba(0,0,0,0.12);';

    const btnAddChat = document.createElement('button');
    btnAddChat.type = 'button';
    btnAddChat.innerHTML = '<span style="color:#10b981;font-size:12px;margin-right:3px;">✦</span>添加到对话';
    btnAddChat.style.cssText = 'all:unset;cursor:pointer;display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;background:#ffffff;color:#1f2937;border:1px solid #e5e7eb;font-weight:500;font-size:11.5px;line-height:16px;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.12s;';
    btnAddChat.onmouseenter = () => { btnAddChat.style.borderColor = '#10b981'; btnAddChat.style.color = '#10b981'; };
    btnAddChat.onmouseleave = () => { btnAddChat.style.borderColor = '#e5e7eb'; btnAddChat.style.color = '#1f2937'; };
    btnAddChat.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedEl) {
        const info = extractElementInfo(selectedEl);
        postToHost({ type: 'trae-browser:add-element-to-chat', element: info });
      }
    };

    actionBar.appendChild(selectBadge);
    actionBar.appendChild(btnAddChat);

    overlayRoot.appendChild(hoverBox);
    overlayRoot.appendChild(selectBox);
    overlayRoot.appendChild(actionBar);
    document.body.appendChild(overlayRoot);
  }

  function positionBox(box, badge, el) {
    if (!box || !el) return;
    const r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = Math.max(r.width, 4) + 'px';
    box.style.height = Math.max(r.height, 4) + 'px';
    if (badge) {
      badge.textContent = el.tagName.toLowerCase();
      badge.style.bottom = r.bottom + 24 > window.innerHeight ? 'auto' : '-22px';
      badge.style.top = r.bottom + 24 > window.innerHeight ? '-22px' : 'auto';
    }
  }

  function positionActionBar(el) {
    if (!actionBar || !el) return;
    const r = el.getBoundingClientRect();
    if (selectBadge) {
      selectBadge.textContent = el.tagName.toLowerCase();
    }
    actionBar.style.display = 'inline-flex';
    const topPos = r.bottom + 6 + 26 < window.innerHeight ? r.bottom + 4 : Math.max(4, r.top - 28);
    const leftPos = Math.min(Math.max(4, r.left), Math.max(4, window.innerWidth - 150));
    actionBar.style.top = topPos + 'px';
    actionBar.style.left = leftPos + 'px';
  }

  function refreshBoxes() {
    if (hoveredEl && inspectMode && hoveredEl !== selectedEl) {
      positionBox(hoverBox, hoverBadge, hoveredEl);
    } else if (hoverBox) {
      hoverBox.style.display = 'none';
    }
    if (selectedEl && document.body.contains(selectedEl)) {
      positionBox(selectBox, null, selectedEl);
      positionActionBar(selectedEl);
    } else if (selectBox) {
      selectBox.style.display = 'none';
      if (actionBar) actionBar.style.display = 'none';
    }
  }

  window.addEventListener('scroll', refreshBoxes, true);
  window.addEventListener('resize', refreshBoxes);

  function enableInlineTextEdit(el) {
    if (!el) return;
    const origText = (el.innerText || '').trim();
    el.setAttribute('contenteditable', 'true');
    el.style.outline = '2px solid #10b981';
    el.focus();
    const onBlur = () => {
      el.removeAttribute('contenteditable');
      el.style.outline = '';
      const newText = (el.innerText || '').trim();
      if (newText !== origText) {
        el.setAttribute('data-trae-modified-text', newText);
        postToHost({
          type: 'trae-browser:element-selected',
          element: extractElementInfo(el)
        });
      }
      el.removeEventListener('blur', onBlur);
      refreshBoxes();
    };
    el.addEventListener('blur', onBlur);
  }

  // Mouse handlers in Inspect Mode (capture phase on window to beat page stopPropagation)
  function getTargetElementAtPoint(clientX, clientY) {
    if (overlayRoot) overlayRoot.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY);
    if (overlayRoot) overlayRoot.style.display = 'block';
    return el;
  }

  window.addEventListener('mousemove', (e) => {
    if (!inspectMode) return;
    ensureOverlay();
    if (actionBar && actionBar.contains(e.target)) return;
    const el = getTargetElementAtPoint(e.clientX, e.clientY);
    if (!el || el === document.body || el === document.documentElement || (overlayRoot && overlayRoot.contains(el))) {
      hoveredEl = null;
      if (hoverBox) hoverBox.style.display = 'none';
      return;
    }
    hoveredEl = el;
    refreshBoxes();
  }, true);

  window.addEventListener('mousedown', (e) => {
    if (!inspectMode) return;
    if (actionBar && actionBar.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);

  window.addEventListener('mouseup', (e) => {
    if (!inspectMode) return;
    if (actionBar && actionBar.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, true);

  window.addEventListener('click', (e) => {
    if (!inspectMode) return;
    ensureOverlay();
    if (actionBar && actionBar.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const el = getTargetElementAtPoint(e.clientX, e.clientY);
    if (!el || (overlayRoot && overlayRoot.contains(el))) return;
    selectedEl = el;
    hoveredEl = null;
    refreshBoxes();

    const info = extractElementInfo(selectedEl);
    postToHost({
      type: 'trae-browser:element-selected',
      element: info
    });
  }, true);

  // Double-click in inspect mode directly activates inline text editing
  document.addEventListener('dblclick', (e) => {
    if (!inspectMode) return;
    if (overlayRoot && overlayRoot.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (selectedEl) enableInlineTextEdit(selectedEl);
  }, true);

  // Press Escape to exit Inspect Mode or clear selection
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (inspectMode || selectedEl)) {
      e.preventDefault();
      e.stopPropagation();
      inspectMode = false;
      selectedEl = null;
      hoveredEl = null;
      document.documentElement.style.cursor = '';
      refreshBoxes();
      postToHost({ type: 'trae-browser:exit-inspect-mode' });
    }
  }, true);

  // Listen to commands from Parent DSH SOLO Browser
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if (!d || typeof d !== 'object') return;

    if (d.type === 'trae-browser:set-inspect-mode') {
      inspectMode = !!d.enabled;
      ensureOverlay();
      document.documentElement.style.cursor = inspectMode ? 'crosshair' : '';
      if (!inspectMode) {
        hoveredEl = null;
        if (hoverBox) hoverBox.style.display = 'none';
      }
      refreshBoxes();
    } else if (d.type === 'trae-browser:clear-selection') {
      selectedEl = null;
      hoveredEl = null;
      refreshBoxes();
    } else if (d.type === 'trae-browser:apply-style') {
      if (selectedEl && d.property) {
        selectedEl.style[d.property] = d.value;
        const prev = selectedEl.getAttribute('data-trae-modified-styles')
          ? JSON.parse(selectedEl.getAttribute('data-trae-modified-styles'))
          : {};
        prev[d.property] = d.value;
        selectedEl.setAttribute('data-trae-modified-styles', JSON.stringify(prev));
        refreshBoxes();
        postToHost({
          type: 'trae-browser:element-selected',
          element: extractElementInfo(selectedEl)
        });
      }
    } else if (d.type === 'trae-browser:apply-css-text') {
      if (selectedEl && typeof d.cssText === 'string') {
        selectedEl.style.cssText += ';' + d.cssText;
        const prev = selectedEl.getAttribute('data-trae-modified-styles')
          ? JSON.parse(selectedEl.getAttribute('data-trae-modified-styles'))
          : {};
        prev['cssText'] = d.cssText;
        selectedEl.setAttribute('data-trae-modified-styles', JSON.stringify(prev));
        refreshBoxes();
        postToHost({
          type: 'trae-browser:element-selected',
          element: extractElementInfo(selectedEl)
        });
      }
    } else if (d.type === 'trae-browser:apply-text') {
      if (selectedEl && typeof d.text === 'string') {
        selectedEl.innerText = d.text;
        selectedEl.setAttribute('data-trae-modified-text', d.text);
        refreshBoxes();
        postToHost({
          type: 'trae-browser:element-selected',
          element: extractElementInfo(selectedEl)
        });
      }
    } else if (d.type === 'trae-browser:request-selected-element') {
      if (selectedEl) {
        postToHost({
          type: 'trae-browser:element-selected',
          element: extractElementInfo(selectedEl)
        });
      }
    }
  });
})();
</script>`
}

/** Detect active local frontend dev ports (3000, 5173, 5174, 8080, 8000, 4200, 4321) */
async function detectLocalDevPorts() {
  const candidates = [5173, 3000, 5174, 8080, 8000, 4200, 4321]
  const active = []
  await Promise.all(
    candidates.map(async (p) => {
      try {
        const res = await fetch(`http://127.0.0.1:${p}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(350),
        })
        if (res.status < 500) active.push(`http://localhost:${p}`)
      } catch {}
    }),
  )
  return active
}

export function apply(ctx) {
  const fence = (req) => ctx.connection.requestRejection(req) === undefined

  let serverProc = null
  let serverPort = null
  let startingPromise = null
  const pendingOpenRequests = new Map() // sessionId -> { path, line, ts }

  /**
   * Standalone SOLO Terminal PTY Registry (100% self-contained inside dsh-trae-solo)
   * Keyed by terminalId -> { id, sessionId, title, shellName, shellPath, cwd, cols, rows, state, exitCode, scrollback, clients, write, resize, kill }
   */
  const soloTerminals = new Map()
  let soloTermSeq = 0

  async function spawnSoloTerminal(sessionId, opts = {}) {
    const cwd = opts.cwd || (await resolveSessionCwd(ctx, sessionId))
    const shells = detectAvailableShells()
    const chosen =
      shells.find((s) => s.path === opts.shellPath || s.name === opts.shellName) || shells[0]
    const cols = Math.max(20, Math.min(400, Number(opts.cols) || 100))
    const rows = Math.max(5, Math.min(160, Number(opts.rows) || 28))

    soloTermSeq += 1
    const id = opts.id || `solo-term-${Date.now()}-${soloTermSeq}`
    const title = opts.title || chosen.name

    const record = {
      id,
      sessionId: sessionId || 'default',
      title,
      shellName: chosen.name,
      shellPath: chosen.path,
      cwd,
      cols,
      rows,
      state: 'running',
      exitCode: null,
      scrollback: '',
      clients: new Set(),
      write: () => {},
      resize: () => {},
      kill: () => {},
    }

    function broadcast(payload) {
      const msg = `data: ${JSON.stringify(payload)}\n\n`
      for (const clientRes of record.clients) {
        try {
          clientRes.write(msg)
        } catch {
          record.clients.delete(clientRes)
        }
      }
    }

    function appendOutput(dataStr) {
      if (!dataStr) return
      record.scrollback += dataStr
      if (record.scrollback.length > 260_000) {
        record.scrollback = record.scrollback.slice(-200_000)
      }
      broadcast({ type: 'output', data: dataStr })
    }

    function handleExit(code) {
      if (record.state === 'exited') return
      record.state = 'exited'
      record.exitCode = typeof code === 'number' ? code : 0
      broadcast({ type: 'exit', exitCode: record.exitCode })
    }

    const env = {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: process.env.LANG || 'en_US.UTF-8',
    }

    let spawned = false

    // Strategy 1: DSH Host `ctx.get('subprocess')?.spawnTerminal` if available
    const subproc = ctx.get?.('subprocess')
    if (!spawned && subproc && typeof subproc.spawnTerminal === 'function') {
      try {
        const handle = await subproc.spawnTerminal({
          argv: [chosen.path, ...chosen.args],
          cwd,
          cols,
          rows,
          terminalType: 'xterm-256color',
          env,
          shellActivity: false,
          graceMs: 1000,
        })
        handle.output.on('data', (chunk) => {
          appendOutput(typeof chunk === 'string' ? chunk : chunk.toString('utf-8'))
        })
        handle.done
          .then((outcome) => handleExit(outcome?.exitCode ?? 0))
          .catch(() => handleExit(1))

        record.write = (data) => {
          void handle.write(data).catch(() => {})
        }
        record.resize = (c, r) => {
          record.cols = c
          record.rows = r
          void handle.resize(c, r).catch(() => {})
        }
        record.kill = () => {
          void handle.terminate().catch(() => {})
          handleExit(0)
        }
        spawned = true
      } catch {}
    }

    // Strategy 2: Direct `node-pty`
    if (!spawned) {
      const pty = loadNodePty()
      if (pty && typeof pty.spawn === 'function') {
        try {
          const ptyProc = pty.spawn(chosen.path, chosen.args, {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env,
          })
          ptyProc.onData((data) => appendOutput(data))
          ptyProc.onExit(({ exitCode }) => handleExit(exitCode))

          record.write = (data) => {
            try {
              ptyProc.write(data)
            } catch {}
          }
          record.resize = (c, r) => {
            record.cols = c
            record.rows = r
            try {
              ptyProc.resize(c, r)
            } catch {}
          }
          record.kill = () => {
            try {
              ptyProc.kill()
            } catch {}
            handleExit(0)
          }
          spawned = true
        } catch {}
      }
    }

    // Strategy 3: POSIX `script -qfc` fallback
    if (!spawned) {
      const child = spawn('script', ['-qfc', `${chosen.path} -i`, '/dev/null'], {
        cwd,
        env: { ...env, COLUMNS: String(cols), LINES: String(rows) },
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      child.stdout?.on('data', (chunk) => appendOutput(chunk.toString('utf-8')))
      child.stderr?.on('data', (chunk) => appendOutput(chunk.toString('utf-8')))
      child.on('exit', (code) => handleExit(code ?? 0))

      record.write = (data) => {
        try {
          child.stdin?.write(data)
        } catch {}
      }
      record.resize = (c, r) => {
        record.cols = c
        record.rows = r
      }
      record.kill = () => {
        try {
          child.kill('SIGTERM')
        } catch {}
        handleExit(0)
      }
    }

    soloTerminals.set(id, record)
    return record
  }

  function serializeTermInfo(rec) {
    return {
      id: rec.id,
      sessionId: rec.sessionId,
      title: rec.title,
      shellName: rec.shellName,
      shellPath: rec.shellPath,
      cwd: rec.cwd,
      cols: rec.cols,
      rows: rec.rows,
      state: rec.state,
      exitCode: rec.exitCode,
    }
  }

  async function ensureServerRunning() {
    if (serverProc && serverPort) return { port: serverPort, status: 'running' }
    if (startingPromise) return startingPromise

    startingPromise = (async () => {
      const nodeBin = join(SERVER_DIR, 'node')
      const serverMain = join(SERVER_DIR, 'out', 'server-main.js')
      if (!existsSync(nodeBin) || !existsSync(serverMain)) {
        startingPromise = null
        return { port: null, status: 'missing-binary', serverDir: SERVER_DIR }
      }

      ensureTraeConfiguration()
      const port = await findFreePort()

      const child = spawn(
        nodeBin,
        [
          serverMain,
          '--host', '127.0.0.1',
          '--port', String(port),
          '--without-connection-token',
          '--accept-server-license-terms',
          '--telemetry-level', 'off',
          '--disable-workspace-trust',
          '--user-data-dir', USER_DATA_DIR,
          '--extensions-dir', EXTENSIONS_DIR,
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            VSCODE_AGENT_FOLDER: DATA_ROOT,
          },
        },
      )

      serverProc = child
      serverPort = port

      child.on('exit', () => {
        if (serverProc === child) {
          serverProc = null
          serverPort = null
          startingPromise = null
        }
      })

      // Wait until the server is ready to accept connections (up to 12s)
      const deadline = Date.now() + 12_000
      while (Date.now() < deadline) {
        try {
          const res = await fetch(`http://127.0.0.1:${port}/version`, {
            signal: AbortSignal.timeout(800),
          })
          if (res.ok) break
        } catch {
          // Wait and retry
        }
        await new Promise((r) => setTimeout(r, 200))
      }

      startingPromise = null
      return { port: serverPort, status: 'running' }
    })()

    return startingPromise
  }

  // Pre-warm openvscode-server on plugin activation so opening the tab is instant
  void ensureServerRunning().catch((err) => {
    ctx.logger?.warn?.('dsh-trae-solo: background pre-warm failed', err)
  })

  // Trigger clientModules rebuild so HMR reloads client.js when modified
  if (rebuildTimer) clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => {
    try {
      const clientPath = new URL('./client.js', import.meta.url).pathname
      const content = readFileSync(clientPath, 'utf-8')
      writeFileSync(clientPath, content, 'utf-8')
      ctx.get('clientModules')?.rebuilt?.('dsh-trae-solo')
    } catch {
      // Ignore
    }
  }, 150)

  // Cleanup child process when plugin is unloaded or restarted
  ctx.effect(() => () => {
    if (serverProc) {
      try {
        serverProc.kill('SIGTERM')
      } catch {
        // Ignore
      }
      serverProc = null
      serverPort = null
    }
    for (const term of soloTerminals.values()) {
      try {
        term.kill()
      } catch {}
      for (const clientRes of term.clients) {
        try {
          clientRes.end()
        } catch {}
      }
      term.clients.clear()
    }
    soloTerminals.clear()
  }, 'dsh-trae-solo: process cleanup')

  // 0. Static xterm.js & xterm.css asset routes for standalone SOLO Terminal
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/trae-solo/assets',
    handler: async (req, res) => {
      try {
        const reqUrl = new URL(req.url ?? '/', 'http://dsh.internal')
        if (reqUrl.pathname === '/trae-solo/assets/xterm.js') {
          const p = join(SERVER_DIR, 'node_modules', '@xterm', 'xterm', 'lib', 'xterm.js')
          if (existsSync(p)) {
            const content = readFileSync(p, 'utf-8')
            res.writeHead(200, {
              'content-type': 'application/javascript; charset=utf-8',
              'cache-control': 'public, max-age=3600',
            })
            res.end(content)
            return
          }
        }
        if (reqUrl.pathname === '/trae-solo/assets/xterm.css') {
          const p = join(SERVER_DIR, 'node_modules', '@xterm', 'xterm', 'css', 'xterm.css')
          if (existsSync(p)) {
            const content = readFileSync(p, 'utf-8')
            res.writeHead(200, {
              'content-type': 'text/css; charset=utf-8',
              'cache-control': 'public, max-age=3600',
            })
            res.end(content)
            return
          }
        }
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('Not found')
      } catch (err) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(String(err))
      }
    },
  }), 'dsh-trae-solo: /trae-solo/assets route')

  // 1. SOLO Browser Inspector Proxy Route (/trae-solo/proxy?url=...)
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/trae-solo/proxy',
    handler: async (req, res) => {
      try {
        const reqUrl = new URL(req.url ?? '/', 'http://dsh.internal')
        const rawTarget = reqUrl.searchParams.get('url') ?? ''
        if (!rawTarget) {
          res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('Missing ?url= parameter')
          return
        }

        let target
        try {
          target = new URL(rawTarget)
        } catch {
          target = new URL(`https://${rawTarget}`)
        }

        const upstreamRes = await fetch(target.href, {
          method: req.method || 'GET',
          headers: {
            'user-agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            accept: req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': req.headers['accept-language'] || 'zh-CN,zh;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        })

        const contentType = upstreamRes.headers.get('content-type') || 'text/html; charset=utf-8'
        const finalUrl = upstreamRes.url || target.href
        const finalOrigin = new URL(finalUrl).origin
        const baseHref = finalUrl.replace(/[^/]*([?#].*)?$/, '')

        if (contentType.includes('text/html')) {
          let html = await upstreamRes.text()
          const baseTag = `<base href="${baseHref}">`
          const inspectorScript = buildInspectorScript(finalUrl)

          // Strip meta CSP tags that might block our inline inspector script
          html = html.replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '')

          if (/<head[^>]*>/i.test(html)) {
            html = html.replace(/<head([^>]*)>/i, (_match, attrs) => `<head${attrs}>\n${baseTag}\n${inspectorScript}`)
          } else if (/<html[^>]*>/i.test(html)) {
            html = html.replace(/<html([^>]*)>/i, (_match, attrs) => `<html${attrs}><head>${baseTag}${inspectorScript}</head>`)
          } else {
            html = `${baseTag}\n${inspectorScript}\n${html}`
          }

          res.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store',
            'access-control-allow-origin': '*',
          })
          res.end(html)
          return
        }

        // Non-HTML assets: stream bytes directly without X-Frame-Options/CSP
        const arrayBuf = await upstreamRes.arrayBuffer()
        res.writeHead(upstreamRes.status, {
          'content-type': contentType,
          'access-control-allow-origin': finalOrigin || '*',
          'cache-control': 'public, max-age=300',
        })
        res.end(Buffer.from(arrayBuf))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        res.writeHead(502, { 'content-type': 'text/html; charset=utf-8' })
        res.end(`<!doctype html><html><head><meta charset="utf-8"><style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display:flex; align-items:center; justify-content:center; height:90vh; margin:0; background:#f9fafb; color:#374151; }
          .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px 32px; max-width:460px; box-shadow:0 4px 12px rgba(0,0,0,0.04); text-align:center; }
          h3 { margin:0 0 8px; color:#111827; font-size:15px; }
          p { margin:0; font-size:13px; color:#6b7280; word-break:break-all; line-height:1.5; }
        </style></head><body><div class="card"><h3>页面无法连接或加载超时</h3><p>${msg}</p></div></body></html>`)
      }
    },
  }), 'dsh-trae-solo: /trae-solo/proxy route')

  // 2. Fenced JSON API route for client half
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/trae-solo/api',
    handler: async (req, res) => {
      if (!fence(req)) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'forbidden' }))
        return
      }
      try {
        const url = new URL(req.url ?? '/', 'http://dsh.internal')
        const pathname = url.pathname

        if (pathname === '/trae-solo/api/status' && req.method === 'GET') {
          const sessionId = url.searchParams.get('sessionId') ?? ''
          const [serverInfo, cwd, devPorts] = await Promise.all([
            ensureServerRunning(),
            resolveSessionCwd(ctx, sessionId),
            detectLocalDevPorts(),
          ])
          const pendingOpen = pendingOpenRequests.get(sessionId) ?? null
          if (pendingOpen) pendingOpenRequests.delete(sessionId)

          res.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
          })
          res.end(JSON.stringify({
            ok: true,
            status: serverInfo.status,
            port: serverInfo.port,
            cwd,
            devPorts,
            pendingOpen,
          }))
          return
        }

        if (pathname === '/trae-solo/api/theme' && req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const isDark = body.mode === 'dark'

          for (const target of [SETTINGS_PATH, USER_SETTINGS_PATH]) {
            let current = {}
            if (existsSync(target)) {
              try {
                current = JSON.parse(readFileSync(target, 'utf-8'))
              } catch {
                current = {}
              }
            }
            current['workbench.colorTheme'] = isDark ? 'Default Dark Modern' : 'Default Light Modern'
            current['workbench.colorCustomizations'] = isDark
              ? {
                  'statusBar.background': '#18181b',
                  'statusBar.foreground': '#a1a1aa',
                  'statusBar.noFolderBackground': '#18181b',
                  'statusBar.border': '#27272a',
                  'sideBar.background': '#18181b',
                  'sideBar.border': '#27272a',
                  'sideBarSectionHeader.background': '#202024',
                  'sideBarSectionHeader.foreground': '#e4e4e7',
                  'editor.background': '#121215',
                  'editorGroupHeader.tabsBackground': '#18181b',
                  'tab.activeBackground': '#121215',
                  'tab.inactiveBackground': '#18181b',
                  'tab.activeBorderTop': '#10b981',
                  'focusBorder': '#10b981',
                  'activityBarBadge.background': '#3b82f6',
                  'activityBarBadge.foreground': '#ffffff',
                }
              : TRAE_DEFAULT_SETTINGS['workbench.colorCustomizations']
            writeFileSync(target, JSON.stringify(current, null, 2), 'utf-8')
          }

          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true }))
          return
        }

        // ── Standalone SOLO Terminal API Endpoints ──

        if (pathname === '/trae-solo/api/terminal/list' && req.method === 'GET') {
          const sessionId = url.searchParams.get('sessionId') || 'default'
          const shells = detectAvailableShells()
          const list = []
          for (const rec of soloTerminals.values()) {
            if (rec.sessionId === sessionId) {
              list.push(serializeTermInfo(rec))
            }
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(JSON.stringify({ ok: true, terminals: list, shells }))
          return
        }

        if (pathname === '/trae-solo/api/terminal/create' && req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const sessionId = body.sessionId || 'default'
          const rec = await spawnSoloTerminal(sessionId, {
            shellPath: body.shellPath,
            shellName: body.shellName,
            title: body.title,
            cols: body.cols,
            rows: body.rows,
          })
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true, terminal: serializeTermInfo(rec), shells: detectAvailableShells() }))
          return
        }

        if (pathname === '/trae-solo/api/terminal/stream' && req.method === 'GET') {
          const id = url.searchParams.get('id') || ''
          const rec = soloTerminals.get(id)
          if (!rec) {
            res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: false, error: 'terminal not found' }))
            return
          }
          res.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache, no-transform',
            connection: 'keep-alive',
          })
          // Send initial snapshot + scrollback
          res.write(
            `data: ${JSON.stringify({
              type: 'snapshot',
              data: rec.scrollback,
              info: serializeTermInfo(rec),
            })}\n\n`,
          )
          rec.clients.add(res)
          req.on('close', () => {
            rec.clients.delete(res)
          })
          return
        }

        if (pathname === '/trae-solo/api/terminal/input' && req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const rec = soloTerminals.get(body.id || '')
          if (!rec) {
            res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: false, error: 'terminal not found' }))
            return
          }
          if (typeof body.data === 'string' && body.data.length > 0) {
            rec.write(body.data)
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true }))
          return
        }

        if (pathname === '/trae-solo/api/terminal/resize' && req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const rec = soloTerminals.get(body.id || '')
          if (rec && body.cols && body.rows) {
            const c = Math.max(20, Math.min(400, Number(body.cols) || 80))
            const r = Math.max(5, Math.min(160, Number(body.rows) || 24))
            rec.resize(c, r)
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true }))
          return
        }

        if (pathname === '/trae-solo/api/terminal/kill' && req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const id = body.id || ''
          const rec = soloTerminals.get(id)
          if (rec) {
            try {
              rec.kill()
            } catch {}
            for (const c of rec.clients) {
              try {
                c.end()
              } catch {}
            }
            rec.clients.clear()
            soloTerminals.delete(id)
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true }))
          return
        }

        res.writeHead(404, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'not found' }))
      } catch (err) {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      }
    },
  }), 'dsh-trae-solo: /trae-solo/api route')
}
