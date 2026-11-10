window.__ModuleLoader__.load({
  // Trae SOLO Mode Client Workbench v1.3.0 (Editor + Interactive Inspector Browser)
  id: 'dsh-trae-solo',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React

    let UiPrimitives = null
    try {
      UiPrimitives = require('@deepseek-ai/dsh-client-ui-primitives')
    } catch {}
    let ReactDOM = null
    try {
      ReactDOM = require('react-dom')
    } catch {}

    const TAB_ID = 'dsh-trae-solo:editor'
    const TAB_KIND = 'trae-solo-editor'
    const BROWSER_TAB_ID = 'dsh-trae-solo:browser'
    const BROWSER_TAB_KIND = 'trae-solo-browser'
    const TERMINAL_TAB_ID = 'dsh-trae-solo:terminal'
    const TERMINAL_TAB_KIND = 'trae-solo-terminal'
    const LOCALE_NS = 'traeSolo'

    const zhDict = {
      editorTitle: '编辑器',
      editorDescription: 'Trae SOLO 完整代码编辑器、右侧资源管理器、搜索、Git 与扩展市场',
      browserTitle: '浏览器',
      browserDescription: 'Trae SOLO 交互式预览浏览器：选择元素、实时修改样式文案、控制台日志与一键添加到对话',
      terminalTitle: '终端',
      terminalDescription: 'Trae SOLO 交互式终端：多 Shell 标签页、划选输出一键添加到对话 (Ctrl+U)',
      loading: '正在启动 Trae SOLO 编辑器工作台…',
      missingBinary: '未找到 openvscode-server，请检查 ~/.dsh/cache/openvscode-server-v1.109.5',
      openSolo: '打开 SOLO 编辑器',
      openBrowser: '打开 SOLO 浏览器',
      openTerminal: '打开 SOLO 终端',
      addToChat: '添加到对话',
      dropFileReference: '拖放到此引用文件',
    }

    const enDict = {
      editorTitle: 'Editor',
      editorDescription: 'Trae SOLO full code editor, right Explorer, Search, Git & Extensions',
      browserTitle: 'Browser',
      browserDescription: 'Trae SOLO interactive preview browser: inspect elements, live edit styles & text, console logs & add to chat',
      terminalTitle: 'Terminal',
      terminalDescription: 'Trae SOLO interactive terminal: multi-shell tabs & add selection to chat (Ctrl+U)',
      loading: 'Starting Trae SOLO editor workbench…',
      missingBinary: 'openvscode-server not found under ~/.dsh/cache/openvscode-server-v1.109.5',
      openSolo: 'Open SOLO editor',
      openBrowser: 'Open SOLO browser',
      openTerminal: 'Open SOLO terminal',
      addToChat: 'Add to Chat',
      dropFileReference: 'Drop here to reference file',
    }

    function isZhLocale(ctx) {
      try {
        const snap = ctx.locale?.getSnapshot?.() ?? ctx.locale?.getLocale?.()
        const id = typeof snap === 'string' ? snap : (snap?.locale ?? snap?.id ?? 'zh')
        return String(id).toLowerCase().startsWith('zh')
      } catch {
        return true
      }
    }

    function tr(ctx, key) {
      return (isZhLocale(ctx) ? zhDict : enDict)[key] ?? zhDict[key] ?? key
    }

    /** Accurate dark scheme detection in DSH desktop */
    function isDarkScheme(ctx) {
      if (typeof document !== 'undefined') {
        if (document.body.hasAttribute('data-ds-dark-theme')) return true
        if (document.documentElement.style.colorScheme === 'dark') return true
        if (document.documentElement.style.colorScheme === 'light') return false
      }
      try {
        const snap = ctx.get('theme')?.getTheme?.()
        if (snap?.active?.colorScheme) return snap.active.colorScheme === 'dark'
      } catch {}
      return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
    }

    /** Trae SOLO '</>' green code icon */
    function IconTraeCode(props) {
      const size = props?.size ?? 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
        },
        h('path', {
          d: 'M5.2 4.2L1.8 8l3.4 3.8M10.8 4.2L14.2 8l-3.4 3.8M9.1 2.8L6.9 13.2',
          stroke: '#10b981',
          strokeWidth: '1.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    /** Trae SOLO '🧭' blue compass browser icon (matches screenshot) */
    function IconTraeBrowser(props) {
      const size = props?.size ?? 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
        },
        h('circle', {
          cx: '8',
          cy: '8',
          r: '6.2',
          stroke: '#3b82f6',
          strokeWidth: '1.4',
        }),
        h('polygon', {
          points: '10.6,5.4 8.9,8.9 5.4,10.6 7.1,7.1',
          fill: '#3b82f6',
        }),
      )
    }

    /** Trae SOLO '>_ ' boxed terminal icon (matches Screenshot `[ ▫_ Terminal 1-1 ]` & `[ ▫_ 终端 ]`) */
    function IconTraeTerminal(props) {
      const size = props?.size ?? 14
      const color = props?.color ?? 'currentColor'
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
        },
        h('rect', {
          x: '1.75',
          y: '2.5',
          width: '12.5',
          height: '11',
          rx: '2.2',
          stroke: color,
          strokeWidth: '1.35',
        }),
        h('path', {
          d: 'M4.5 6L6.8 8L4.5 10',
          stroke: color,
          strokeWidth: '1.35',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M8.2 10H11.2',
          stroke: color,
          strokeWidth: '1.35',
          strokeLinecap: 'round',
        }),
      )
    }

    /** Official DSH Whale Logo Path & ViewBox (rendered in Trae SOLO Emerald Green) */
    const FISH_LOGO_VIEWBOX = { width: 23.16, height: 17.04 }
    const FISH_LOGO_PATH =
      'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z'

    /** DSH SOLO Brand Mark (Green-styled Whale Icon) */
    function SoloBrandMark(props) {
      const size = props?.size ?? 24
      const gradId = 'dsh-solo-whale-grad'
      return h(
        'svg',
        {
          viewBox: `0 0 ${FISH_LOGO_VIEWBOX.width} ${FISH_LOGO_VIEWBOX.height}`,
          width: size,
          height: (size * FISH_LOGO_VIEWBOX.height) / FISH_LOGO_VIEWBOX.width,
          fill: 'none',
          className: props?.className,
          'aria-hidden': 'true',
          style: {
            display: 'block',
            flexShrink: 0,
            filter: 'drop-shadow(0 1px 4px rgba(16, 185, 129, 0.22))',
          },
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: gradId, x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            h('stop', { offset: '0%', stopColor: '#34d399' }),
            h('stop', { offset: '55%', stopColor: '#10b981' }),
            h('stop', { offset: '100%', stopColor: '#059669' }),
          ),
        ),
        h('path', {
          d: FISH_LOGO_PATH,
          fill: `url(#${gradId})`,
        }),
      )
    }

    /** DSH SOLO Brand Name ("DSH SOLO") */
    function SoloBrandName() {
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.03em',
            color: 'var(--dsw-alias-label-primary)',
            userSelect: 'none',
          },
        },
        h('span', null, 'DSH'),
        h(
          'span',
          {
            style: {
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            },
          },
          'SOLO',
        ),
      )
    }

    /** Center Hero Brand Mark (Green-styled Whale Icon) */
    function HeroBrandMark(props) {
      const size = props?.size ?? 34
      return h(SoloBrandMark, { size, className: props?.className })
    }

    /**
     * Singleton persistent iframe state across all session tabs and docked/floating switches.
     */
    const workbenchHolder = {
      iframe: null,
      parkingLot: null,
      currentUrl: '',
      currentCwd: '',
      currentPort: null,
    }

    /** Active session input state manager captured from slot props (keyed by sessionId + current active) */
    const activeInputManager = {
      inputActions: null,
      useInput: null,
      sessionId: null,
      bySession: new Map(),
    }

    function recordSessionInputProps(sessionId, inputActions, useInput) {
      if (inputActions) activeInputManager.inputActions = inputActions
      if (useInput) activeInputManager.useInput = useInput
      if (sessionId) {
        activeInputManager.sessionId = sessionId
        const prev = activeInputManager.bySession.get(sessionId) || {}
        activeInputManager.bySession.set(sessionId, {
          inputActions: inputActions || prev.inputActions || null,
          useInput: useInput || prev.useInput || null,
        })
      }
    }

    function ensureParkingLot() {
      if (!workbenchHolder.parkingLot) {
        const div = document.createElement('div')
        div.setAttribute('data-trae-solo-parking', 'true')
        div.style.cssText =
          'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;'
        document.body.appendChild(div)
        workbenchHolder.parkingLot = div
      }
      return workbenchHolder.parkingLot
    }

    function ensureIframe(targetUrl, cwd, port) {
      if (!workbenchHolder.iframe) {
        const iframe = document.createElement('iframe')
        iframe.setAttribute('data-trae-solo-iframe', 'true')
        iframe.setAttribute('allow', 'clipboard-read; clipboard-write; usb; serial; hid')
        iframe.style.cssText =
          'width:100%;height:100%;border:0;display:block;background:var(--dsw-alias-bg-base);'
        iframe.src = targetUrl
        workbenchHolder.iframe = iframe
        workbenchHolder.currentUrl = targetUrl
        workbenchHolder.currentCwd = cwd
        workbenchHolder.currentPort = port
      } else if (workbenchHolder.currentCwd !== cwd || workbenchHolder.currentPort !== port) {
        workbenchHolder.currentUrl = targetUrl
        workbenchHolder.currentCwd = cwd
        workbenchHolder.currentPort = port
        workbenchHolder.iframe.src = targetUrl
      }
      return workbenchHolder.iframe
    }

    function attachIframeToHost(iframe, hostEl) {
      if (!hostEl || !iframe) return
      if (iframe.parentNode === hostEl) return
      try {
        if (typeof hostEl.moveBefore === 'function' && iframe.isConnected) {
          hostEl.moveBefore(iframe, null)
          return
        }
      } catch {}
      hostEl.appendChild(iframe)
    }

    function parkIframe() {
      const { iframe } = workbenchHolder
      if (!iframe) return
      const lot = ensureParkingLot()
      attachIframeToHost(iframe, lot)
    }

    function cleanupWorkbenchHolder() {
      if (workbenchHolder.iframe) {
        workbenchHolder.iframe.remove()
        workbenchHolder.iframe = null
      }
      if (workbenchHolder.parkingLot) {
        workbenchHolder.parkingLot.remove()
        workbenchHolder.parkingLot = null
      }
      workbenchHolder.currentUrl = ''
      workbenchHolder.currentCwd = ''
      workbenchHolder.currentPort = null
    }

    function extractFileFromAddress(address) {
      if (typeof address !== 'string' || !address.startsWith('dsh-resource://file/')) return null
      try {
        const url = new URL(address)
        const rawPath = decodeURIComponent(url.pathname)
        return rawPath || null
      } catch {
        return null
      }
    }

    /* ── Workspace & Browser Reference Helpers for Composer Injection ── */

    function workspaceRelativePath(root, path) {
      if (!root || !path) return undefined
      const norm = (v) => v.replace(/\\/g, '/').replace(/\/+$/, '')
      const base = norm(root)
      const target = norm(path)
      if (target === base) return '.'
      if (target.startsWith(base + '/')) return target.slice(base.length + 1)
      return undefined
    }

    /**
     * Persistent + In-memory store mapping short reference IDs to their full model payload
     * (DOM outerHTML, CSS selector, computed styles, React/Vue source location, or selected code).
     * When the user presses Enter in the DSH conversation composer, our registered
     * `trae-solo` inputTrigger source (or the built-in `reference` source) expands
     * the compact chip (`[✦ div]`) into its full payload!
     */
    const TRAE_REF_STORE_KEY = 'dsh-trae-solo:ref-payloads'
    const traePayloadStore = new Map()
    let traePayloadSeq = 0
    let traeSourceRegistered = false

    function loadTraePayloadStore() {
      try {
        const raw = localStorage.getItem(TRAE_REF_STORE_KEY)
        if (!raw) return
        const entries = JSON.parse(raw)
        if (Array.isArray(entries)) {
          for (const [k, v] of entries) {
            if (typeof k === 'string' && typeof v === 'string') {
              traePayloadStore.set(k, v)
            }
          }
        }
      } catch {}
    }

    function saveTraePayloadStore() {
      try {
        const all = [...traePayloadStore.entries()].slice(-150)
        localStorage.setItem(TRAE_REF_STORE_KEY, JSON.stringify(all))
      } catch {}
    }

    function resolveTraePayload(refId) {
      if (!traePayloadStore.has(refId)) {
        loadTraePayloadStore()
      }
      return traePayloadStore.get(refId) || refId
    }

    function registerTraePayload(fullPayload) {
      loadTraePayloadStore()
      traePayloadSeq += 1
      const id = `trae-ref-${Date.now()}-${traePayloadSeq}`
      traePayloadStore.set(id, fullPayload)
      saveTraePayloadStore()
      return id
    }

    function ensureTraeTriggerSource(ctx) {
      if (traeSourceRegistered) return true
      try {
        const triggers = ctx.get?.('inputTriggers') || ctx.inputTriggers
        if (!triggers?.registerSource) return false
        triggers.registerSource({
          trigger: '@',
          name: 'trae-solo',
          order: 99,
          showGroupTitle: false,
          candidates: async () => [],
          onPick: () => 'handled',
          codec: {
            clipboardText: (ref) => ref,
            serialize: async (ref) => resolveTraePayload(ref),
          },
        })
        traeSourceRegistered = true
        return true
      } catch (err) {
        if (err instanceof Error && /already registered|duplicate/i.test(err.message)) {
          traeSourceRegistered = true
          return true
        }
        return false
      }
    }

    function readCurrentInputSnapshot(ctx, sessionId, useInputFn) {
      // 1. Try reading from the session-scoped `useInput` selector hook (Note: DSH's `useInput` is `(selector) => selector(state)`!)
      if (typeof useInputFn === 'function') {
        try {
          const snap = useInputFn((s) => s)
          if (snap && typeof snap === 'object' && typeof snap.draft === 'string') {
            return snap
          }
        } catch {}
        try {
          const snap2 = useInputFn()
          if (snap2 && typeof snap2 === 'object' && typeof snap2.draft === 'string') {
            return snap2
          }
        } catch {}
      }
      // 2. Fallback: read persisted draft from DSH's localStorage key `dsh.conversation.<sessionId>`
      try {
        if (sessionId && typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(`dsh.conversation.${sessionId}`)
          if (raw) {
            const parsed = JSON.parse(raw)
            const d = parsed?.draft
            if (typeof d === 'string') {
              return { draft: d, occurrences: [] }
            }
            if (d && typeof d === 'object' && typeof d.text === 'string') {
              return {
                draft: d.text,
                occurrences: Array.isArray(d.references) ? d.references : [],
                command: d.command,
                quotes: d.quotes,
              }
            }
          }
        }
      } catch {}
      return { draft: '', occurrences: [] }
    }

    /**
     * Universal helper to insert a genuine compact ReferenceChipNode into the DSH Conversation Composer.
     * Supports:
     * 1. Code file or line-range chips (from VS Code Editor): e.g. `[ gemini-ttft-check.sh 24-31 ]`
     * 2. DOM Element chips (from SOLO Browser): e.g. `[ ✦ div ]`, `[ ✦ img ]` (matching Screenshot 2!)
     * 3. Console Error log chips (from SOLO Browser Console): e.g. `[ ✦ 控制台日志 (1) ]`
     */
    function insertComposerChip(ctx, targetSessionId, { chipLabel, mentionToken, modelPayload, appearance, clipboardText }) {
      try {
        const sessionId =
          targetSessionId ||
          ctx.get('sidebarRight')?.mounted?.getSnapshot?.() ||
          activeInputManager.sessionId ||
          ctx.sessions?.list?.getSnapshot?.()?.ids?.[0]

        const sessionEntry = sessionId ? activeInputManager.bySession.get(sessionId) : null
        const act = sessionEntry?.inputActions || activeInputManager.inputActions
        const useInputFn = sessionEntry?.useInput || activeInputManager.useInput

        const fullPayload = modelPayload || mentionToken || chipLabel
        const hasCustomSource = ensureTraeTriggerSource(ctx)
        // Use our custom `trae-solo` source when available, or DSH's built-in `reference` source (whose codec.serialize returns `ref` directly!)
        const chipSource = hasCustomSource ? 'trae-solo' : 'reference'
        const chipRef = hasCustomSource ? registerTraePayload(fullPayload) : fullPayload
        const shortClipboard = (clipboardText || `@${chipLabel.replace(/\s+/g, '')}`).replace(/[\r\n]+/g, ' ')
        const validAppearance =
          appearance === 'file' || appearance === 'folder' || appearance === 'session'
            ? appearance
            : undefined

        let applied = false

        // 1. Primary path: Emit `slash/input-insert-reference` on the session scope using `captureInsertion()`
        // Note: In Cordis, `actx.emit` returns `undefined` (not boolean), so we check if `draft` or `occurrences` updated!
        if (act && typeof act.captureInsertion === 'function') {
          try {
            const actx = ctx.sessions?.scope?.(sessionId)
            if (actx && typeof actx.emit === 'function') {
              const beforeSnap = readCurrentInputSnapshot(ctx, sessionId, useInputFn)
              const beforeCount = (beforeSnap.occurrences || []).length
              const beforeText = beforeSnap.draft || ''

              // If existing draft does not end with whitespace, insert a leading space first
              let span = act.captureInsertion()
              if (beforeText.length > 0 && !/\s$/.test(beforeText) && span.start === span.end && span.start > 0) {
                actx.emit('slash/input-insert-text', {
                  text: ' ',
                  span,
                })
                span = act.captureInsertion()
              }

              const refObj = {
                source: chipSource,
                ref: chipRef,
                label: chipLabel,
                clipboardText: shortClipboard,
              }
              if (validAppearance) refObj.appearance = validAppearance

              actx.emit('slash/input-insert-reference', {
                span,
                reference: refObj,
              })

              const afterSnap = readCurrentInputSnapshot(ctx, sessionId, useInputFn)
              if (
                (afterSnap.occurrences || []).length > beforeCount ||
                (afterSnap.draft || '') !== beforeText
              ) {
                applied = true
              }
            }
          } catch (err) {
            console.warn('[dsh-trae-solo] slash/input-insert-reference error:', err)
          }
        }

        // 2. Guaranteed path: `act.setDraft({ text, references })` with exact `offset` and `length`
        // `SessionInputShell.setDraft` calls `DraftEditorRuntime.restoreDraft(text, references)` which creates real `ReferenceChipNode`s!
        if (!applied && act && typeof act.setDraft === 'function') {
          try {
            const currentInput = readCurrentInputSnapshot(ctx, sessionId, useInputFn)
            const currentDraft = currentInput?.draft || ''
            const existingRefs = (currentInput?.occurrences || []).map((o) => {
              const r = {
                source: o.source || 'reference',
                ref: o.ref || o.text || o.label,
                offset: o.offset,
                length: o.length,
                label: o.label,
                clipboardText: o.clipboardText,
              }
              if (o.appearance === 'file' || o.appearance === 'folder' || o.appearance === 'session') {
                r.appearance = o.appearance
              }
              return r
            })
            const lead = currentDraft.length > 0 && !/\s$/.test(currentDraft) ? ' ' : ''
            const offset = currentDraft.length + lead.length
            const nextText = `${currentDraft}${lead}${shortClipboard} `

            const newRef = {
              source: chipSource,
              ref: chipRef,
              offset,
              length: shortClipboard.length,
              label: chipLabel,
              clipboardText: shortClipboard,
            }
            if (validAppearance) newRef.appearance = validAppearance

            act.setDraft({
              text: nextText,
              references: [...existingRefs, newRef],
            })
            applied = true
          } catch (err) {
            console.warn('[dsh-trae-solo] structured setDraft fallback:', err)
          }
        }

        // 3. Final fallback: short mention token only (never dump long source code into the input box!)
        if (!applied && act && typeof act.setDraft === 'function') {
          try {
            const currentInput = readCurrentInputSnapshot(ctx, sessionId, useInputFn)
            const currentDraft = currentInput?.draft || ''
            const lead = currentDraft.trim() !== '' && !/\s$/.test(currentDraft) ? ' ' : ''
            act.setDraft(`${currentDraft}${lead}${shortClipboard} `)
            applied = true
          } catch {}
        }

        setTimeout(() => {
          try {
            const el = document.querySelector(
              '[class*="composer"] [contenteditable="true"], [data-dsh-composer-input], textarea, [contenteditable="true"]',
            )
            el?.focus?.()
          } catch {}
        }, 40)

        return applied
      } catch (err) {
        console.error('[dsh-trae-solo] insertComposerChip error:', err)
        return false
      }
    }

    function insertWorkspaceReference(ctx, targetSessionId, fullPath, isDir, lines, selectedText) {
      const sessionId =
        targetSessionId ||
        activeInputManager.sessionId ||
        ctx.get('sidebarRight')?.mounted?.getSnapshot?.() ||
        ctx.sessions?.list?.getSnapshot?.()?.ids?.[0]

      const snapshot = ctx.get('workspaces')?.list?.getSnapshot?.()
      const workspace = snapshot?.items?.find((w) => w.sessionIds?.includes?.(sessionId))
      const root = workspace?.path || ctx.get('workingDirectory')?.defaultDirectory || ''
      const rel = workspaceRelativePath(root, fullPath) || fullPath

      let lineSpec = ''
      if (lines && typeof lines.start === 'number' && typeof lines.end === 'number') {
        lineSpec = lines.start === lines.end ? String(lines.start) : `${lines.start}-${lines.end}`
      }

      const baseFileName = fullPath.slice(
        Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\')) + 1,
      )
      const label = lineSpec
        ? `${baseFileName} ${lineSpec}`
        : isDir
          ? `${baseFileName}/`
          : baseFileName
      const header = lineSpec ? `${rel}:${lineSpec}` : rel
      const mention = /\s/.test(header) ? `@"${header}"` : `@${header}`
      const modelPayload = selectedText ? `\`\`\`${header}\n${selectedText}\n\`\`\`` : mention

      return insertComposerChip(ctx, sessionId, {
        chipLabel: label,
        mentionToken: header,
        modelPayload,
        appearance: isDir ? 'folder' : 'file',
        clipboardText: header,
      })
    }

    /**
     * Format a selected DOM element (and any live edits) into a compact Trae SOLO chip
     * matching Screenshot 2 (`[ ✦ div ]`, `[ ✦ img ]`, `[ ✦ button ]`).
     * The detailed HTML/CSS/Source payload is stored in `traePayloadStore` and sent to the LLM on submit.
     */
    function insertBrowserElementReference(ctx, sessionId, elInfo) {
      if (!elInfo) return
      const tag = (elInfo.tagName || 'element').toLowerCase()
      const hasEdits =
        (elInfo.modifiedInline && Object.keys(elInfo.modifiedInline).length > 0) ||
        elInfo.modifiedText
      const chipLabel = `✦ ${tag}${hasEdits ? '*' : ''}`
      const shortClip = `@${tag}`

      const lines = [
        `[Trae SOLO 浏览器选中元素 <${tag}>]`,
        `- 页面地址: ${elInfo.pageUrl || ''}`,
        `- CSS 选择器: \`${elInfo.selector}\``,
        `- 尺寸位置: ${elInfo.rect?.width}×${elInfo.rect?.height}px (x:${elInfo.rect?.x}, y:${elInfo.rect?.y})`,
      ]
      if (elInfo.source && elInfo.source.file) {
        lines.push(
          `- 源码定位 (${elInfo.source.framework || 'DOM'}): \`${elInfo.source.file}${elInfo.source.line ? ':' + elInfo.source.line : ''}\`${elInfo.source.component ? ' (组件: ' + elInfo.source.component + ')' : ''}`,
        )
      }
      if (elInfo.textContent) {
        lines.push(`- 文本内容: "${elInfo.textContent}"`)
      }
      if (elInfo.modifiedText) {
        lines.push(`- [用户在页面实时修改后的新文案]: "${elInfo.modifiedText}" (请同步更新到源码)`)
      }
      if (elInfo.modifiedInline && Object.keys(elInfo.modifiedInline).length > 0) {
        lines.push(
          `- [用户在页面实时调整后的目标 CSS 样式 (请同步更新到对应源码)]:`,
          `  \`\`\`css`,
          ...Object.entries(elInfo.modifiedInline).map(([k, v]) =>
            k === 'cssText' ? `  ${v}` : `  ${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v};`,
          ),
          `  \`\`\``,
        )
      }
      if (elInfo.styles) {
        lines.push(
          `- 当前计算样式快照: color=${elInfo.styles.color}, bg=${elInfo.styles.backgroundColor}, font=${elInfo.styles.fontSize}/${elInfo.styles.fontWeight}, display=${elInfo.styles.display}, padding=${elInfo.styles.padding}, margin=${elInfo.styles.margin}, radius=${elInfo.styles.borderRadius}`,
        )
      }
      if (elInfo.outerHTML) {
        lines.push(`- DOM HTML 结构:\n\`\`\`html\n${elInfo.outerHTML}\n\`\`\``)
      }

      insertComposerChip(ctx, sessionId, {
        chipLabel,
        mentionToken: shortClip,
        modelPayload: lines.join('\n'),
        appearance: undefined,
        clipboardText: shortClip,
      })
    }

    /** Format browser console errors/warnings into a compact AI reference chip (`[ ✦ console (1) ]`) */
    function insertBrowserConsoleReference(ctx, sessionId, logs, pageUrl) {
      if (!logs || logs.length === 0) return
      const errCount = logs.filter((l) => l.level === 'error').length
      const chipLabel = `✦ 控制台日志 (${errCount > 0 ? errCount : logs.length})`
      const shortClip = `@console:${errCount || logs.length}`
      const payloadLines = [
        `[Trae SOLO 浏览器控制台日志 (${pageUrl || ''})]`,
        '```text',
        ...logs.slice(-25).map((l) => {
          const time = new Date(l.ts).toLocaleTimeString()
          return `[${time}] [${l.level.toUpperCase()}] ${l.text}${l.stack ? '\n' + l.stack : ''}`
        }),
        '```',
      ]
      insertComposerChip(ctx, sessionId, {
        chipLabel,
        mentionToken: shortClip,
        modelPayload: payloadLines.join('\n'),
        appearance: undefined,
        clipboardText: shortClip,
      })
    }

    /**
     * Format selected terminal output into a compact Trae SOLO terminal chip
     * matching the screenshot (`[ ▫_ Terminal 1-1 ]` / `[ ▫_ Terminal 1-18 ]`).
     * On submit, expands to `[Trae SOLO 终端选中内容 (Terminal 1-18, zsh)]` + fenced block.
     */
    function insertTerminalSelectionReference(ctx, targetSessionId, { selectedText, startLine, endLine, shellName }) {
      const cleaned = typeof selectedText === 'string' ? selectedText.replace(/\r\n/g, '\n').replace(/\n+$/, '') : ''
      if (!cleaned.trim()) return false

      const lineCount = Math.max(1, cleaned.split('\n').length)
      const sLine = typeof startLine === 'number' && startLine >= 1 ? startLine : 1
      const eLine = typeof endLine === 'number' && endLine >= sLine ? endLine : sLine + lineCount - 1
      const lineRange = `${sLine}-${eLine}`
      const shell = (shellName || '').trim()

      const chipLabel = `>_ Terminal ${lineRange}`
      const shortClip = `@Terminal:${lineRange}`
      const metaInner = shell ? `Terminal ${lineRange}, ${shell}` : `Terminal ${lineRange}`
      const payloadLines = [
        `[Trae SOLO 终端选中内容 (${metaInner})]`,
        '```text',
        cleaned,
        '```',
      ]

      return insertComposerChip(ctx, targetSessionId, {
        chipLabel,
        mentionToken: shortClip,
        modelPayload: payloadLines.join('\n'),
        appearance: undefined,
        clipboardText: shortClip,
      })
    }

    /* ── Sent Message Bubble Collapsible Chip Rules & Renderers (uiConversation.userText) ── */

    function findClosingFence(text, fromPos) {
      let pos = fromPos
      while (pos <= text.length) {
        const nl = text.indexOf('\n', pos)
        if (nl < 0) break
        const afterNl = nl + 1
        if (text.startsWith('```', afterNl)) {
          const afterFence = afterNl + 3
          const nextCh = text[afterFence]
          if (nextCh === undefined || !/[a-zA-Z0-9_-]/.test(nextCh)) {
            return afterFence
          }
        }
        pos = afterNl
      }
      return -1
    }

    function parseTraeElementAt(text, from) {
      const PREFIX = '[Trae SOLO 浏览器选中元素 <'
      let searchFrom = from
      while (searchFrom < text.length) {
        const idx = text.indexOf(PREFIX, searchFrom)
        if (idx < 0) return undefined
        const firstNl = text.indexOf('\n', idx)
        if (firstNl < 0) return undefined
        const firstLine = text.slice(idx, firstNl).replace(/\r$/, '')
        const headMatch = /^\[Trae SOLO 浏览器选中元素 <([a-zA-Z0-9_-]+)>\]$/.exec(firstLine)
        if (!headMatch) {
          searchFrom = idx + PREFIX.length
          continue
        }

        const tag = headMatch[1]
        let pageUrl = ''
        let selector = ''
        let rect = ''
        let sourceLoc = ''
        let textContent = ''
        let modifiedText = ''
        let modifiedCss = ''
        let computedStyles = ''
        let html = ''

        let pos = firstNl + 1
        let lastValidEnd = -1
        let matchedFields = 0

        while (pos < text.length) {
          const nl = text.indexOf('\n', pos)
          const rawLine = nl < 0 ? text.slice(pos) : text.slice(pos, nl)
          const line = rawLine.replace(/\r$/, '')

          if (line === '- DOM HTML 结构:') {
            const fenceStart = nl < 0 ? -1 : nl + 1
            if (fenceStart >= 0 && /^```html\r?\n/.test(text.slice(fenceStart))) {
              const bodyStart = text.indexOf('\n', fenceStart) + 1
              const closeEnd = findClosingFence(text, bodyStart - 1)
              if (closeEnd > bodyStart) {
                html = text.slice(bodyStart, closeEnd - 3).replace(/\r?\n$/, '')
                lastValidEnd = closeEnd
                matchedFields += 1
              }
            }
            break
          }

          if (line === '- [用户在页面实时调整后的目标 CSS 样式 (请同步更新到对应源码)]:') {
            const cssFenceStart = nl < 0 ? -1 : nl + 1
            if (cssFenceStart >= 0 && /^  ```css\r?\n/.test(text.slice(cssFenceStart))) {
              const cssBodyStart = text.indexOf('\n', cssFenceStart) + 1
              let scan = cssBodyStart
              let cssCloseEnd = -1
              while (scan < text.length) {
                const lEnd = text.indexOf('\n', scan)
                const lRaw = lEnd < 0 ? text.slice(scan) : text.slice(scan, lEnd)
                if (lRaw.replace(/\r$/, '') === '  ```') {
                  cssCloseEnd = lEnd < 0 ? text.length : lEnd
                  break
                }
                if (lEnd < 0) break
                scan = lEnd + 1
              }
              if (cssCloseEnd >= cssBodyStart) {
                modifiedCss = text
                  .slice(cssBodyStart, cssCloseEnd)
                  .replace(/\r?\n  ```$/, '')
                  .replace(/^  /gm, '')
                  .trim()
                lastValidEnd = cssCloseEnd
                matchedFields += 1
                pos = cssCloseEnd + 1
                if (text[cssCloseEnd] === '\r' && text[cssCloseEnd + 1] === '\n') pos = cssCloseEnd + 2
                continue
              }
            }
            break
          }

          if (!line.startsWith('- ')) break

          matchedFields += 1
          lastValidEnd = nl < 0 ? text.length : nl

          if (line.startsWith('- 页面地址: ')) {
            pageUrl = line.slice('- 页面地址: '.length).trim()
          } else if (line.startsWith('- CSS 选择器: ')) {
            selector = line.slice('- CSS 选择器: '.length).trim().replace(/^`|`$/g, '')
          } else if (line.startsWith('- 尺寸位置: ')) {
            rect = line.slice('- 尺寸位置: '.length).trim()
          } else if (line.startsWith('- 源码定位 ')) {
            sourceLoc = line.slice(2).trim()
          } else if (line.startsWith('- 文本内容: ')) {
            textContent = line.slice('- 文本内容: '.length).trim().replace(/^"|"$/g, '')
          } else if (line.startsWith('- [用户在页面实时修改后的新文案]: ')) {
            modifiedText = line.slice('- [用户在页面实时修改后的新文案]: '.length).trim()
          } else if (line.startsWith('- 当前计算样式快照: ')) {
            computedStyles = line.slice('- 当前计算样式快照: '.length).trim()
          }

          if (nl < 0) break
          pos = nl + 1
        }

        if (matchedFields >= 1 && lastValidEnd > idx && (pageUrl || selector || rect || html)) {
          return {
            id: 'trae-element',
            start: idx,
            end: lastValidEnd,
            data: {
              tag,
              pageUrl,
              selector,
              rect,
              sourceLoc,
              textContent,
              modifiedText,
              modifiedCss,
              computedStyles,
              html,
              hasEdits: Boolean(modifiedText || modifiedCss),
            },
          }
        }

        searchFrom = idx + PREFIX.length
      }
      return undefined
    }

    function parseTraeConsoleAt(text, from) {
      const PREFIX = '[Trae SOLO 浏览器控制台日志 ('
      let searchFrom = from
      while (searchFrom < text.length) {
        const idx = text.indexOf(PREFIX, searchFrom)
        if (idx < 0) return undefined
        const firstNl = text.indexOf('\n', idx)
        if (firstNl < 0) return undefined
        const firstLine = text.slice(idx, firstNl).replace(/\r$/, '')
        const m = /^\[Trae SOLO 浏览器控制台日志 \(([^)]*)\)\]$/.exec(firstLine)
        if (!m) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const fenceStart = firstNl + 1
        if (!/^```text\r?\n/.test(text.slice(fenceStart))) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const bodyStart = text.indexOf('\n', fenceStart) + 1
        const closeEnd = findClosingFence(text, bodyStart - 1)
        if (closeEnd <= bodyStart) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const logsText = text.slice(bodyStart, closeEnd - 3).replace(/\r?\n$/, '')
        const lines = logsText ? logsText.split('\n').filter(Boolean) : []
        const errCount = lines.filter((l) => /\[ERROR\]/.test(l)).length
        return {
          id: 'trae-console',
          start: idx,
          end: closeEnd,
          data: {
            pageUrl: m[1] || '',
            count: lines.length,
            errCount,
            logsText,
          },
        }
      }
      return undefined
    }

    function parseTraeTerminalAt(text, from) {
      const PREFIX = '[Trae SOLO 终端选中内容 ('
      let searchFrom = from
      while (searchFrom < text.length) {
        const idx = text.indexOf(PREFIX, searchFrom)
        if (idx < 0) return undefined
        const firstNl = text.indexOf('\n', idx)
        if (firstNl < 0) return undefined
        const firstLine = text.slice(idx, firstNl).replace(/\r$/, '')
        const m = /^\[Trae SOLO 终端选中内容 \(([^)]*)\)\]$/.exec(firstLine)
        if (!m) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const fenceStart = firstNl + 1
        if (!/^```(?:text|sh|bash|zsh)?\r?\n/.test(text.slice(fenceStart))) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const bodyStart = text.indexOf('\n', fenceStart) + 1
        const closeEnd = findClosingFence(text, bodyStart - 1)
        if (closeEnd <= bodyStart) {
          searchFrom = idx + PREFIX.length
          continue
        }
        const content = text.slice(bodyStart, closeEnd - 3).replace(/\r?\n$/, '')
        const metaRaw = (m[1] || '').trim()
        // e.g. "Terminal 1-1, zsh" or "Terminal 1-18"
        const parts = metaRaw.split(',').map((s) => s.trim()).filter(Boolean)
        const label = parts[0] || 'Terminal 1-1'
        const shell = parts.slice(1).join(', ')
        const rangeMatch = /(\d+(?:-\d+)?)$/.exec(label)
        const lineRange = rangeMatch ? rangeMatch[1] : '1-1'
        const lineCount = content ? content.split('\n').length : 1

        return {
          id: 'trae-terminal',
          start: idx,
          end: closeEnd,
          data: {
            label,
            lineRange,
            shell,
            lineCount,
            content,
          },
        }
      }
      return undefined
    }

    function parseTraeCodeSelectionAt(text, from) {
      let searchFrom = from
      while (searchFrom < text.length) {
        const idx = text.indexOf('```', searchFrom)
        if (idx < 0) return undefined
        if (idx > 0 && !/\s/.test(text[idx - 1])) {
          searchFrom = idx + 3
          continue
        }
        const firstNl = text.indexOf('\n', idx)
        if (firstNl < 0) return undefined
        const infoLine = text.slice(idx + 3, firstNl).replace(/\r$/, '')
        const m = /^([^\n`]+:\d+(?:-\d+)?)$/.exec(infoLine)
        if (!m || /\s{2,}/.test(infoLine) || infoLine.startsWith('http://') || infoLine.startsWith('https://')) {
          searchFrom = idx + 3
          continue
        }
        const bodyStart = firstNl + 1
        const closeEnd = findClosingFence(text, bodyStart - 1)
        if (closeEnd <= bodyStart) {
          searchFrom = idx + 3
          continue
        }
        const header = m[1]
        const colonIdx = header.lastIndexOf(':')
        const filePart = colonIdx >= 0 ? header.slice(0, colonIdx) : header
        const linePart = colonIdx >= 0 ? header.slice(colonIdx + 1) : ''
        const baseName = filePart.slice(Math.max(filePart.lastIndexOf('/'), filePart.lastIndexOf('\\')) + 1)
        const label = linePart ? `${baseName} ${linePart}` : baseName
        const code = text.slice(bodyStart, closeEnd - 3).replace(/\r?\n$/, '')
        return {
          id: 'trae-code-selection',
          start: idx,
          end: closeEnd,
          data: {
            header,
            label,
            code,
          },
        }
      }
      return undefined
    }

    const traeElementUserTextRule = {
      id: 'trae-element',
      order: -20,
      match(text, from) {
        try {
          return parseTraeElementAt(text, from)
        } catch {
          return undefined
        }
      },
    }

    const traeConsoleUserTextRule = {
      id: 'trae-console',
      order: -20,
      match(text, from) {
        try {
          return parseTraeConsoleAt(text, from)
        } catch {
          return undefined
        }
      },
    }

    const traeTerminalUserTextRule = {
      id: 'trae-terminal',
      order: -20,
      match(text, from) {
        try {
          return parseTraeTerminalAt(text, from)
        } catch {
          return undefined
        }
      },
    }

    const traeCodeSelectionUserTextRule = {
      id: 'trae-code-selection',
      order: -15,
      match(text, from) {
        try {
          return parseTraeCodeSelectionAt(text, from)
        } catch {
          return undefined
        }
      },
    }

    function SentDetailModal({ open, onClose, title, subtitle, children, raw, onReinsert }) {
      const [copied, setCopied] = useState(false)

      useEffect(() => {
        if (!open) setCopied(false)
      }, [open])

      const copyRaw = () => {
        try {
          navigator.clipboard?.writeText?.(raw)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        } catch {}
      }

      if (!open) return null

      const footerEl = h(
        'div',
        { className: 'trae-sent-modal-footer' },
        onReinsert
          ? h(
              'button',
              {
                type: 'button',
                className: 'trae-sent-modal-btn',
                onClick: () => {
                  onReinsert()
                  onClose()
                },
              },
              '✦ 重新引用到输入框',
            )
          : null,
        h(
          'button',
          {
            type: 'button',
            className: 'trae-sent-modal-btn',
            onClick: copyRaw,
          },
          copied ? '✓ 已复制' : '复制完整内容',
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'trae-sent-modal-btn is-primary',
            onClick: onClose,
          },
          '关闭',
        ),
      )

      if (UiPrimitives?.Modal) {
        return h(
          UiPrimitives.Modal,
          {
            open,
            onClose,
            title,
            description: subtitle || undefined,
            closeLabel: '关闭',
            className: 'trae-sent-modal-dialog',
            footer: footerEl,
          },
          children,
        )
      }

      if (!ReactDOM?.createPortal || typeof document === 'undefined') return null
      return ReactDOM.createPortal(
        h(
          'div',
          {
            className: 'trae-sent-fallback-mask',
            onClick: onClose,
          },
          h(
            'div',
            {
              className: 'trae-sent-fallback-dialog',
              onClick: (e) => e.stopPropagation(),
            },
            h(
              'div',
              { className: 'trae-sent-fallback-header' },
              h('div', { style: { fontWeight: 600, fontSize: '15px' } }, title),
              h(
                'button',
                { type: 'button', className: 'trae-sent-modal-close', onClick: onClose },
                '×',
              ),
            ),
            subtitle ? h('div', { className: 'trae-sent-fallback-sub' }, subtitle) : null,
            h('div', { className: 'trae-sent-fallback-body' }, children),
            footerEl,
          ),
        ),
        document.body,
      )
    }

    function SentChipWithPreview({ interactive, chipClass, iconNode, iconChar, iconColor, label, title, hoverContent, modalTitle, modalSubtitle, modalBody, raw, onReinsert }) {
      const [modalOpen, setModalOpen] = useState(false)

      const leadingIcon = iconNode
        ? h('span', { className: 'trae-sent-chip-icon', style: iconColor ? { color: iconColor } : undefined }, iconNode)
        : h('span', { className: 'trae-sent-chip-icon', style: iconColor ? { color: iconColor } : undefined }, iconChar)

      const chipNode = interactive
        ? h(
            'button',
            {
              type: 'button',
              className: `trae-sent-chip is-interactive ${chipClass || ''}`,
              title: title || label,
              onClick: (e) => {
                if (e.detail > 1) return
                const sel = window.getSelection?.()
                if (sel && !sel.isCollapsed) return
                e.preventDefault()
                e.stopPropagation()
                setModalOpen(true)
              },
            },
            leadingIcon,
            h('span', { className: 'trae-sent-chip-label' }, label),
          )
        : h(
            'span',
            {
              className: `trae-sent-chip ${chipClass || ''}`,
              title: title || label,
            },
            leadingIcon,
            h('span', { className: 'trae-sent-chip-label' }, label),
          )

      const wrapped =
        interactive && UiPrimitives?.HoverCard
          ? h(UiPrimitives.HoverCard, {
              inline: true,
              grouped: true,
              openDelayMs: 140,
              disabled: !interactive,
              anchor: chipNode,
              content: hoverContent,
            })
          : chipNode

      return h(
        React.Fragment,
        null,
        wrapped,
        interactive
          ? h(
              SentDetailModal,
              {
                open: modalOpen,
                onClose: () => setModalOpen(false),
                title: modalTitle,
                subtitle: modalSubtitle,
                raw,
                onReinsert,
              },
              modalBody,
            )
          : null,
      )
    }

    function SentTraeElementNode({ ctx, sessionId, node, raw, interactive }) {
      const d = node?.data || {}
      const label = `${d.tag || 'element'}${d.hasEdits ? '*' : ''}`

      const hoverContent = h(
        'div',
        { className: 'trae-sent-hover' },
        h(
          'div',
          { className: 'trae-sent-hover-head' },
          h('span', { className: 'trae-sent-hover-badge' }, `✦ <${d.tag}>`),
          d.rect ? h('span', { className: 'trae-sent-hover-dim' }, d.rect) : null,
        ),
        d.selector
          ? h('div', { className: 'trae-sent-hover-code' }, d.selector)
          : null,
        d.pageUrl
          ? h('div', { className: 'trae-sent-hover-url' }, d.pageUrl)
          : null,
        d.sourceLoc
          ? h('div', { className: 'trae-sent-hover-source' }, d.sourceLoc)
          : null,
        d.textContent
          ? h('div', { className: 'trae-sent-hover-text' }, `"${d.textContent}"`)
          : null,
        d.hasEdits
          ? h('div', { className: 'trae-sent-hover-edit' }, '包含实时样式 / 文案修改')
          : null,
        h('div', { className: 'trae-sent-hover-hint' }, '点击查看完整 DOM 与样式详情'),
      )

      const modalBody = h(
        'div',
        { className: 'trae-sent-modal-body' },
        d.pageUrl
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '页面地址'),
              h('div', { className: 'trae-sent-v' }, d.pageUrl),
            )
          : null,
        d.selector
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, 'CSS 选择器'),
              h('code', { className: 'trae-sent-v is-mono' }, d.selector),
            )
          : null,
        d.rect
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '尺寸位置'),
              h('div', { className: 'trae-sent-v' }, d.rect),
            )
          : null,
        d.sourceLoc
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '源码定位'),
              h('div', { className: 'trae-sent-v is-mono' }, d.sourceLoc),
            )
          : null,
        d.textContent
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '文本内容'),
              h('div', { className: 'trae-sent-v' }, d.textContent),
            )
          : null,
        d.modifiedText
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '实时修改文案'),
              h('div', { className: 'trae-sent-v is-accent' }, d.modifiedText),
            )
          : null,
        d.modifiedCss
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '实时修改 CSS'),
              h('pre', { className: 'trae-sent-pre' }, d.modifiedCss),
            )
          : null,
        d.computedStyles
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, '计算样式快照'),
              h('div', { className: 'trae-sent-v is-mono' }, d.computedStyles),
            )
          : null,
        d.html
          ? h(
              'div',
              { className: 'trae-sent-kv' },
              h('div', { className: 'trae-sent-k' }, 'DOM HTML 结构'),
              h('pre', { className: 'trae-sent-pre' }, d.html),
            )
          : null,
      )

      return h(SentChipWithPreview, {
        interactive,
        iconChar: '✦',
        iconColor: '#10b981',
        label,
        title: d.selector ? `<${d.tag}> ${d.selector}` : label,
        hoverContent,
        modalTitle: `DSH SOLO 元素详情 · <${d.tag || 'element'}>`,
        modalSubtitle: d.pageUrl || undefined,
        modalBody,
        raw,
        onReinsert: () => {
          insertComposerChip(ctx, sessionId, {
            chipLabel: `✦ ${label}`,
            mentionToken: `@${d.tag || 'element'}`,
            modelPayload: raw,
            appearance: undefined,
            clipboardText: `@${d.tag || 'element'}`,
          })
        },
      })
    }

    function SentTraeConsoleNode({ ctx, sessionId, node, raw, interactive }) {
      const d = node?.data || {}
      const n = d.errCount > 0 ? d.errCount : d.count || 0
      const label = `控制台日志 (${n})`

      const hoverContent = h(
        'div',
        { className: 'trae-sent-hover' },
        h(
          'div',
          { className: 'trae-sent-hover-head' },
          h('span', { className: 'trae-sent-hover-badge is-err' }, `✦ ${label}`),
        ),
        d.pageUrl ? h('div', { className: 'trae-sent-hover-url' }, d.pageUrl) : null,
        d.logsText
          ? h('pre', { className: 'trae-sent-hover-pre' }, d.logsText.slice(0, 320))
          : null,
        h('div', { className: 'trae-sent-hover-hint' }, '点击查看完整控制台输出'),
      )

      const modalBody = h(
        'div',
        { className: 'trae-sent-modal-body' },
        h('pre', { className: 'trae-sent-pre' }, d.logsText || raw),
      )

      return h(SentChipWithPreview, {
        interactive,
        chipClass: d.errCount > 0 ? 'is-console-error' : '',
        iconChar: '✦',
        iconColor: d.errCount > 0 ? '#ef4444' : '#10b981',
        label,
        hoverContent,
        modalTitle: `DSH SOLO 控制台日志 (${d.count || 0} 条)`,
        modalSubtitle: d.pageUrl || undefined,
        modalBody,
        raw,
        onReinsert: () => {
          insertComposerChip(ctx, sessionId, {
            chipLabel: `✦ ${label}`,
            mentionToken: `@console:${n}`,
            modelPayload: raw,
            appearance: undefined,
            clipboardText: `@console:${n}`,
          })
        },
      })
    }

    function SentTraeCodeSelectionNode({ ctx, sessionId, node, raw, interactive }) {
      const d = node?.data || {}
      const label = d.label || d.header || '代码片段'

      const hoverContent = h(
        'div',
        { className: 'trae-sent-hover' },
        h(
          'div',
          { className: 'trae-sent-hover-head' },
          h('span', { className: 'trae-sent-hover-badge' }, d.header || label),
        ),
        d.code
          ? h('pre', { className: 'trae-sent-hover-pre' }, d.code.slice(0, 320))
          : null,
        h('div', { className: 'trae-sent-hover-hint' }, '点击查看完整代码片段'),
      )

      const modalBody = h(
        'div',
        { className: 'trae-sent-modal-body' },
        h('pre', { className: 'trae-sent-pre' }, d.code || raw),
      )

      return h(SentChipWithPreview, {
        interactive,
        iconChar: '⟨/⟩',
        iconColor: '#10b981',
        label,
        title: d.header || label,
        hoverContent,
        modalTitle: `代码引用 · ${d.header || label}`,
        modalBody,
        raw,
        onReinsert: () => {
          insertComposerChip(ctx, sessionId, {
            chipLabel: label,
            mentionToken: d.header || label,
            modelPayload: raw,
            appearance: 'file',
            clipboardText: d.header || label,
          })
        },
      })
    }

    function SentTraeTerminalNode({ ctx, sessionId, node, raw, interactive }) {
      const d = node?.data || {}
      const label = d.label || `Terminal ${d.lineRange || '1-1'}`
      const lineRange = d.lineRange || '1-1'

      const hoverContent = h(
        'div',
        { className: 'trae-sent-hover' },
        h(
          'div',
          { className: 'trae-sent-hover-head' },
          h(
            'span',
            { className: 'trae-sent-hover-badge is-terminal' },
            h(IconTraeTerminal, { size: 12 }),
            h('span', { style: { marginLeft: '4px' } }, label),
          ),
          d.shell ? h('span', { className: 'trae-sent-hover-dim' }, d.shell) : null,
        ),
        d.content
          ? h('pre', { className: 'trae-sent-hover-pre' }, d.content.slice(0, 320))
          : null,
        h('div', { className: 'trae-sent-hover-hint' }, '点击查看完整终端选中内容'),
      )

      const modalBody = h(
        'div',
        { className: 'trae-sent-modal-body' },
        h('pre', { className: 'trae-sent-pre' }, d.content || raw),
      )

      return h(SentChipWithPreview, {
        interactive,
        chipClass: 'is-terminal',
        iconNode: h(IconTraeTerminal, { size: 13 }),
        label,
        title: d.shell ? `${label} (${d.shell})` : label,
        hoverContent,
        modalTitle: `DSH SOLO 终端引用 · ${label}`,
        modalSubtitle: d.shell ? `Shell: ${d.shell} · 共 ${d.lineCount || 1} 行` : `共 ${d.lineCount || 1} 行`,
        modalBody,
        raw,
        onReinsert: () => {
          insertComposerChip(ctx, sessionId, {
            chipLabel: `>_ ${label}`,
            mentionToken: `@Terminal:${lineRange}`,
            modelPayload: raw,
            appearance: undefined,
            clipboardText: `@Terminal:${lineRange}`,
          })
        },
      })
    }

    /* ── Tab 1: Trae SOLO Editor Tab Components ── */

    function TraeEditorTabTitle(props) {
      const { ctx } = props
      return h(
        'span',
        { className: 'trae-solo-tab-chip' },
        h(IconTraeCode, { size: 14 }),
        h('span', { className: 'trae-solo-tab-chip-text' }, tr(ctx, 'editorTitle')),
      )
    }

    function TraeEditorTabBody(props) {
      const { ctx, sessionId, useTabInfo, inputActions, useInput } = props
      const info = typeof useTabInfo === 'function' ? useTabInfo() : null
      const visible = info?.tab?.visible !== false
      const address = info?.tab?.navigation?.address ?? info?.tab?.contentId ?? ''
      const paramsPath = info?.tab?.navigation?.params?.path ?? extractFileFromAddress(address)

      recordSessionInputProps(sessionId, inputActions, useInput)

      const hostRef = useRef(null)
      const [state, setState] = useState({
        loading: true,
        error: null,
        port: null,
        cwd: '',
      })

      useEffect(() => {
        if (!visible) return
        let cancelled = false

        async function syncSessionWorkspace() {
          try {
            const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
            const res = await fetch(`/trae-solo/api/status${q}`, { cache: 'no-store' })
            const data = await res.json()
            if (cancelled) return
            if (!data.ok || data.status === 'missing-binary' || !data.port) {
              setState({
                loading: false,
                error: tr(ctx, 'missingBinary'),
                port: null,
                cwd: '',
              })
              return
            }
            setState((prev) => {
              if (
                !prev.loading &&
                prev.error === null &&
                prev.port === data.port &&
                prev.cwd === data.cwd
              ) {
                return prev
              }
              return {
                loading: false,
                error: null,
                port: data.port,
                cwd: data.cwd,
              }
            })
          } catch (err) {
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : String(err),
              }))
            }
          }
        }

        void syncSessionWorkspace()
        const timer = setInterval(syncSessionWorkspace, 3000)
        return () => {
          cancelled = true
          clearInterval(timer)
        }
      }, [visible, sessionId])

      useEffect(() => {
        if (!visible || state.loading || state.error || !state.port || !state.cwd) return
        const container = hostRef.current
        if (!container) return

        const folderPath = state.cwd.startsWith('/') ? state.cwd : `/${state.cwd}`
        const isDark = isDarkScheme(ctx)
        let url = `http://127.0.0.1:${state.port}/?folder=${encodeURIComponent(folderPath)}&theme=${isDark ? 'dark' : 'light'}`
        if (paramsPath) {
          const fullFile = paramsPath.startsWith('/')
            ? paramsPath
            : `${folderPath.replace(/\/$/, '')}/${paramsPath}`
          const payload = JSON.stringify([['openFile', `vscode-remote://127.0.0.1:${state.port}${fullFile}`]])
          url += `&payload=${encodeURIComponent(payload)}`
        }

        const iframe = ensureIframe(url, state.cwd, state.port)
        attachIframeToHost(iframe, container)

        return () => {
          if (workbenchHolder.iframe && workbenchHolder.iframe.parentNode === container) {
            parkIframe()
          }
        }
      }, [visible, state.loading, state.error, state.port, state.cwd, paramsPath])

      return h(
        'div',
        { className: 'trae-solo-workbench-host' },
        state.loading
          ? h(
              'div',
              { className: 'trae-solo-status-overlay' },
              h(SoloBrandMark, { size: 32 }),
              h('div', { className: 'trae-solo-status-text' }, tr(ctx, 'loading')),
            )
          : state.error
            ? h(
                'div',
                { className: 'trae-solo-status-overlay trae-solo-status-error' },
                h('div', { className: 'trae-solo-status-text' }, state.error),
              )
            : null,
        h('div', {
          ref: hostRef,
          className: 'trae-solo-iframe-mount',
          style: {
            display: state.loading || state.error ? 'none' : 'block',
          },
        }),
      )
    }

    /* ── Tab 2: Trae SOLO Interactive Browser Tab Components ── */

    function TraeBrowserTabTitle(props) {
      const { ctx } = props
      return h(
        'span',
        { className: 'trae-solo-tab-chip' },
        h(IconTraeBrowser, { size: 14 }),
        h('span', { className: 'trae-solo-tab-chip-text' }, tr(ctx, 'browserTitle')),
      )
    }

    function normalizeUrlInput(raw) {
      const trimmed = (raw || '').trim()
      if (!trimmed) return ''
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(trimmed)) {
        return `http://${trimmed}`
      }
      if (/^:\d+(\/.*)?$/.test(trimmed)) {
        return `http://localhost${trimmed}`
      }
      return `https://${trimmed}`
    }

    function rgbToHex(rgb) {
      if (!rgb || typeof rgb !== 'string') return '#000000'
      if (rgb.startsWith('#')) return rgb.length === 4 ? '#' + rgb[1] + rgb[1] + rgb[2] + rgb[2] + rgb[3] + rgb[3] : rgb.slice(0, 7)
      const m = rgb.match(/\d+/g)
      if (!m || m.length < 3) return '#000000'
      const [r, g, b] = m.map((n) => Math.min(255, Math.max(0, parseInt(n, 10))))
      return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    }

    function TraeBrowserTabBody(props) {
      const { ctx, sessionId, inputActions, useInput } = props
      recordSessionInputProps(sessionId, inputActions, useInput)

      const iframeRef = useRef(null)

      // Multi-tab state inside SOLO Browser (starts empty waiting for user input)
      const [pages, setPages] = useState([
        {
          id: 'tab-1',
          title: '新标签页',
          url: '',
          history: [],
          historyIdx: -1,
        },
      ])
      const [activePageId, setActivePageId] = useState('tab-1')
      const activePage = pages.find((p) => p.id === activePageId) || pages[0]

      const [addressInput, setAddressInput] = useState(activePage.url)
      const [reloadTick, setReloadTick] = useState(0)
      const [devPorts, setDevPorts] = useState([])

      // Toolbar modes
      const [inspectMode, setInspectMode] = useState(false)
      const [viewportMode, setViewportMode] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
      const [styleDrawerOpen, setStyleDrawerOpen] = useState(false)
      const [selectedElement, setSelectedElement] = useState(null)
      const [customCssInput, setCustomCssInput] = useState('')
      const [textEditValue, setTextEditValue] = useState('')

      // Bottom Console Drawer
      const [consoleOpen, setConsoleOpen] = useState(false)
      const [consoleFilter, setConsoleFilter] = useState('all') // 'all' | 'error' | 'warn'
      const [consoleLogs, setConsoleLogs] = useState([])
      const [toastMsg, setToastMsg] = useState(null)

      function showToast(msg) {
        setToastMsg(msg)
        setTimeout(() => {
          setToastMsg((cur) => (cur === msg ? null : cur))
        }, 2400)
      }

      // Sync address bar when switching sub-tabs
      useEffect(() => {
        setAddressInput(activePage.url)
      }, [activePageId, activePage.url])

      // Poll local dev ports (e.g. localhost:5173, localhost:3000) so user can one-click jump
      useEffect(() => {
        let cancelled = false
        async function fetchPorts() {
          try {
            const res = await fetch('/trae-solo/api/status')
            const data = await res.json()
            if (!cancelled && Array.isArray(data.devPorts)) {
              setDevPorts(data.devPorts)
            }
          } catch {}
        }
        void fetchPorts()
        const t = setInterval(fetchPorts, 5000)
        return () => {
          cancelled = true
          clearInterval(t)
        }
      }, [])

      // Send inspectMode state into iframe whenever toggled or loaded
      const syncInspectModeToIframe = (enabled) => {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'trae-browser:set-inspect-mode', enabled },
            '*',
          )
        } catch {}
      }

      // Listen for messages from the injected __trae_solo_inspector__ inside the iframe
      useEffect(() => {
        const onMsg = (ev) => {
          const d = ev.data
          if (!d || d.source !== 'trae-solo-browser') return
          // Only process messages from THIS session's browser iframe so background tabs never intercept!
          if (iframeRef.current && ev.source && ev.source !== iframeRef.current.contentWindow) return

          if (d.type === 'trae-browser:page-meta') {
            setPages((prev) =>
              prev.map((p) =>
                p.id === activePageId
                  ? { ...p, title: (d.title || p.url || '新标签页').slice(0, 36) }
                  : p,
              ),
            )
            syncInspectModeToIframe(inspectMode)
          } else if (d.type === 'trae-browser:inspector-ready') {
            syncInspectModeToIframe(inspectMode)
          } else if (d.type === 'trae-browser:navigate' && d.url) {
            navigateToUrl(d.url)
          } else if (d.type === 'trae-browser:console') {
            setConsoleLogs((prev) => [
              ...prev.slice(-199),
              {
                id: `${Date.now()}-${Math.random()}`,
                level: d.level || 'log',
                text: d.text || '',
                stack: d.stack || '',
                ts: d.ts || Date.now(),
              },
            ])
          } else if (d.type === 'trae-browser:element-selected' && d.element) {
            setSelectedElement(d.element)
            setTextEditValue(d.element.modifiedText ?? d.element.textContent ?? '')
          } else if (d.type === 'trae-browser:open-style-drawer' && d.element) {
            setSelectedElement(d.element)
            setTextEditValue(d.element.modifiedText ?? d.element.textContent ?? '')
            setStyleDrawerOpen(true)
          } else if (d.type === 'trae-browser:add-element-to-chat' && d.element) {
            setSelectedElement(d.element)
            insertBrowserElementReference(ctx, sessionId, d.element)
            showToast(`✦ 已添加 <${d.element.tagName}> 到会话栏`)
          } else if (d.type === 'trae-browser:exit-inspect-mode') {
            setInspectMode(false)
            setSelectedElement(null)
          }
        }
        const onKeyDown = (ev) => {
          if (ev.key === 'Escape' && (inspectMode || selectedElement)) {
            setInspectMode(false)
            setSelectedElement(null)
            syncInspectModeToIframe(false)
            try {
              iframeRef.current?.contentWindow?.postMessage({ type: 'trae-browser:clear-selection' }, '*')
            } catch {}
          }
        }
        window.addEventListener('message', onMsg)
        window.addEventListener('keydown', onKeyDown, true)
        return () => {
          window.removeEventListener('message', onMsg)
          window.removeEventListener('keydown', onKeyDown, true)
        }
      }, [activePageId, inspectMode, selectedElement, sessionId])

      function navigateToUrl(rawInput) {
        const target = normalizeUrlInput(rawInput)
        if (!target) return
        setAddressInput(target)
        setSelectedElement(null)
        setPages((prev) =>
          prev.map((p) => {
            if (p.id !== activePageId) return p
            const nextHist = p.history.slice(0, p.historyIdx + 1)
            nextHist.push(target)
            return {
              ...p,
              url: target,
              title: target.replace(/^https?:\/\//, '').slice(0, 28),
              history: nextHist,
              historyIdx: nextHist.length - 1,
            }
          }),
        )
      }

      function goBack() {
        if (activePage.historyIdx <= 0) return
        const nextIdx = activePage.historyIdx - 1
        const target = activePage.history[nextIdx]
        setAddressInput(target)
        setSelectedElement(null)
        setPages((prev) =>
          prev.map((p) => (p.id === activePageId ? { ...p, url: target, historyIdx: nextIdx } : p)),
        )
      }

      function goForward() {
        if (activePage.historyIdx >= activePage.history.length - 1) return
        const nextIdx = activePage.historyIdx + 1
        const target = activePage.history[nextIdx]
        setAddressInput(target)
        setSelectedElement(null)
        setPages((prev) =>
          prev.map((p) => (p.id === activePageId ? { ...p, url: target, historyIdx: nextIdx } : p)),
        )
      }

      function addNewPageTab() {
        const newId = `tab-${Date.now()}`
        const newTab = {
          id: newId,
          title: '新标签页',
          url: '',
          history: [],
          historyIdx: -1,
        }
        setPages((prev) => [...prev, newTab])
        setActivePageId(newId)
        setAddressInput('')
        setSelectedElement(null)
      }

      function closePageTab(id, e) {
        e.stopPropagation()
        if (pages.length <= 1) return
        const next = pages.filter((p) => p.id !== id)
        setPages(next)
        if (activePageId === id) {
          setActivePageId(next[next.length - 1].id)
        }
      }

      function toggleInspectMode() {
        const next = !inspectMode
        setInspectMode(next)
        syncInspectModeToIframe(next)
        if (!next) {
          try {
            iframeRef.current?.contentWindow?.postMessage({ type: 'trae-browser:clear-selection' }, '*')
          } catch {}
        }
      }

      function applyLiveStyle(property, value) {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'trae-browser:apply-style', property, value },
            '*',
          )
        } catch {}
      }

      function applyLiveText(text) {
        setTextEditValue(text)
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'trae-browser:apply-text', text },
            '*',
          )
        } catch {}
      }

      function applyCustomCss() {
        if (!customCssInput.trim()) return
        try {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'trae-browser:apply-css-text', cssText: customCssInput.trim() },
            '*',
          )
        } catch {}
      }

      const proxySrc = activePage.url
        ? `/trae-solo/proxy?url=${encodeURIComponent(activePage.url)}&_t=${reloadTick}`
        : ''
      const errorCount = consoleLogs.filter((l) => l.level === 'error').length
      const warnCount = consoleLogs.filter((l) => l.level === 'warn').length
      const filteredLogs = consoleLogs.filter((l) =>
        consoleFilter === 'all' ? true : l.level === consoleFilter,
      )

      const viewportWidth =
        viewportMode === 'mobile' ? '375px' : viewportMode === 'tablet' ? '768px' : '100%'

      return h(
        'div',
        { className: 'trae-browser-root' },

        /* 1. Top Inner Browser Tab Strip (matches screenshot: [👁 百度一下，你就知道 ×] [+]) */
        h(
          'div',
          { className: 'trae-browser-tabstrip' },
          pages.map((p) =>
            h(
              'div',
              {
                key: p.id,
                className: `trae-browser-subtab ${p.id === activePageId ? 'is-active' : ''}`,
                onClick: () => setActivePageId(p.id),
              },
              h(
                'span',
                { className: 'trae-browser-subtab-icon' },
                '👁',
              ),
              h('span', { className: 'trae-browser-subtab-title' }, p.title || p.url),
              pages.length > 1
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'trae-browser-subtab-close',
                      onClick: (e) => closePageTab(p.id, e),
                    },
                    '×',
                  )
                : null,
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'trae-browser-subtab-add',
              title: '新建标签页',
              onClick: addNewPageTab,
            },
            '+',
          ),
          devPorts.length > 0
            ? h(
                'div',
                { className: 'trae-browser-devports' },
                devPorts.map((dp) =>
                  h(
                    'button',
                    {
                      key: dp,
                      type: 'button',
                      className: 'trae-browser-port-pill',
                      onClick: () => navigateToUrl(dp),
                      title: `打开本地开发服务 ${dp}`,
                    },
                    `⚡ :${dp.split(':').pop()}`,
                  ),
                ),
              )
            : null,
        ),

        /* 2. Navigation & Inspector Toolbar (← → ↻ [URL] | 🧭 🖱️✨ 📱 <> #) */
        h(
          'div',
          { className: 'trae-browser-navbar' },
          h(
            'button',
            {
              type: 'button',
              className: 'trae-browser-nav-btn',
              disabled: activePage.historyIdx <= 0,
              onClick: goBack,
              title: '后退',
            },
            '←',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'trae-browser-nav-btn',
              disabled: activePage.historyIdx >= activePage.history.length - 1,
              onClick: goForward,
              title: '前进',
            },
            '→',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'trae-browser-nav-btn',
              onClick: () => setReloadTick((n) => n + 1),
              title: '刷新页面',
            },
            '↻',
          ),
          h(
            'form',
            {
              className: 'trae-browser-url-form',
              onSubmit: (e) => {
                e.preventDefault()
                navigateToUrl(addressInput)
              },
            },
            h('input', {
              type: 'text',
              className: 'trae-browser-url-input',
              value: addressInput,
              placeholder: '输入网址或本地端口 (如 localhost:5173 或 https://www.baidu.com)',
              onChange: (e) => setAddressInput(e.target.value),
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'trae-browser-url-copy',
                title: '复制当前地址',
                onClick: () => {
                  navigator.clipboard?.writeText?.(activePage.url)
                  showToast('已复制页面链接')
                },
              },
              '❐',
            ),
          ),

          /* Right-side Trae SOLO feature icons */
          h(
            'div',
            { className: 'trae-browser-actions' },
            // 1. Inspect Element Mode Button
            h(
              'button',
              {
                type: 'button',
                className: `trae-browser-tool-btn ${inspectMode ? 'is-active' : ''}`,
                title: '开启/关闭「选择元素」模式 (点选页面元素修改样式或添加到对话)',
                onClick: toggleInspectMode,
              },
              h(
                'svg',
                { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none' },
                h('path', {
                  d: 'M3 2.5L12.5 7.2L8.2 8.6L11.2 12.8L9.6 13.9L6.6 9.6L4.2 12.5L3 2.5Z',
                  stroke: 'currentColor',
                  strokeWidth: '1.3',
                  strokeLinejoin: 'round',
                }),
                h('path', {
                  d: 'M12.5 2V4.5M11.25 3.25H13.75',
                  stroke: '#10b981',
                  strokeWidth: '1.4',
                  strokeLinecap: 'round',
                }),
              ),
            ),

            // 2. Responsive Viewport Switcher (Desktop / Tablet / Mobile)
            h(
              'button',
              {
                type: 'button',
                className: `trae-browser-tool-btn ${viewportMode !== 'desktop' ? 'is-active' : ''}`,
                title: `切换设备视口 (当前: ${viewportMode === 'desktop' ? '桌面端' : viewportMode === 'tablet' ? '平板 768px' : '手机 375px'})`,
                onClick: () =>
                  setViewportMode((m) =>
                    m === 'desktop' ? 'mobile' : m === 'mobile' ? 'tablet' : 'desktop',
                  ),
              },
              h(
                'svg',
                { viewBox: '0 0 16 16', width: 15, height: 15, fill: 'none' },
                h('rect', {
                  x: '2',
                  y: '3',
                  width: '9',
                  height: '7',
                  rx: '1',
                  stroke: 'currentColor',
                  strokeWidth: '1.3',
                }),
                h('rect', {
                  x: '9.5',
                  y: '6',
                  width: '4.5',
                  height: '7',
                  rx: '1',
                  fill: 'var(--dsw-alias-bg-base)',
                  stroke: 'currentColor',
                  strokeWidth: '1.3',
                }),
              ),
            ),

            // 3. Live Style & DOM Inspector Drawer Toggle (<>)
            h(
              'button',
              {
                type: 'button',
                className: `trae-browser-tool-btn ${styleDrawerOpen ? 'is-active' : ''}`,
                title: '实时样式与文案编辑器 (修改 CSS 样式并一键同步到对话)',
                onClick: () => setStyleDrawerOpen((v) => !v),
              },
              '<>',
            ),

            // 4. Open in External System Browser
            h(
              'button',
              {
                type: 'button',
                className: 'trae-browser-tool-btn',
                disabled: !activePage.url,
                title: '在系统外部浏览器打开',
                onClick: () => activePage.url && window.open(activePage.url, '_blank', 'noopener,noreferrer'),
              },
              '↗',
            ),
          ),
        ),

        /* 3. Main Viewport + Live Style Editor Drawer */
        h(
          'div',
          { className: 'trae-browser-stage' },

          // Toast notification
          toastMsg
            ? h('div', { className: 'trae-browser-toast' }, toastMsg)
            : null,

          // Center Iframe Canvas or Empty Start State
          h(
            'div',
            {
              className: `trae-browser-canvas-wrap ${viewportMode !== 'desktop' && activePage.url ? 'is-device' : ''}`,
            },
            !activePage.url
              ? h(
                  'div',
                  { className: 'trae-browser-empty-start' },
                  h(IconTraeBrowser, { size: 32 }),
                  h(
                    'div',
                    { className: 'trae-browser-empty-title' },
                    '输入 HTTP(S) 地址或本地端口开始浏览',
                  ),
                  h(
                    'div',
                    { className: 'trae-browser-empty-sub' },
                    '支持开启「选择元素」模式点选任意 DOM 元素、实时调试 CSS 样式与文案，并一键添加到对话',
                  ),
                  devPorts.length > 0
                    ? h(
                        'div',
                        { className: 'trae-browser-empty-ports' },
                        h('span', null, '检测到本地运行服务：'),
                        devPorts.map((dp) =>
                          h(
                            'button',
                            {
                              key: dp,
                              type: 'button',
                              className: 'trae-browser-port-pill',
                              onClick: () => navigateToUrl(dp),
                            },
                            dp,
                          ),
                        ),
                      )
                    : null,
                )
              : h('iframe', {
                  ref: iframeRef,
                  className: 'trae-browser-iframe',
                  src: proxySrc,
                  style: { width: viewportWidth },
                  onLoad: () => syncInspectModeToIframe(inspectMode),
                }),
          ),

          // Right-hand Live Style & DOM Editor Drawer
          styleDrawerOpen
            ? h(
                'div',
                { className: 'trae-style-drawer' },
                h(
                  'div',
                  { className: 'trae-style-drawer-header' },
                  h('span', { style: { fontWeight: 600 } }, '🎨 实时样式与元素检视'),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'trae-style-drawer-close',
                      onClick: () => setStyleDrawerOpen(false),
                    },
                    '×',
                  ),
                ),
                !selectedElement
                  ? h(
                      'div',
                      { className: 'trae-style-empty' },
                      h('div', { style: { fontSize: '24px', marginBottom: '8px' } }, '🖱️✨'),
                      h(
                        'div',
                        null,
                        '请点击顶栏的「选择元素」图标，然后在网页中点选任意元素即可实时修改文案与 CSS 样式。',
                      ),
                      !inspectMode
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'trae-style-primary-btn',
                              style: { marginTop: '12px' },
                              onClick: toggleInspectMode,
                            },
                            '立即开启选择元素模式',
                          )
                        : null,
                    )
                  : h(
                      'div',
                      { className: 'trae-style-body' },
                      // Element Identity Badge
                      h(
                        'div',
                        { className: 'trae-style-section' },
                        h(
                          'div',
                          { className: 'trae-style-el-badge' },
                          h('span', { className: 'trae-style-sem-tag' }, selectedElement.semantic),
                          h('code', null, `<${selectedElement.tagName}>`),
                          h(
                            'span',
                            { className: 'trae-style-dim' },
                            `${selectedElement.rect?.width}×${selectedElement.rect?.height}`,
                          ),
                        ),
                        h(
                          'div',
                          { className: 'trae-style-selector-line', title: selectedElement.selector },
                          selectedElement.selector,
                        ),
                        selectedElement.source?.file
                          ? h(
                              'div',
                              { className: 'trae-style-source-line' },
                              `📍 ${selectedElement.source.framework}: ${selectedElement.source.file}:${selectedElement.source.line || 1}`,
                            )
                          : null,
                      ),

                      // Live Text Editing
                      h(
                        'div',
                        { className: 'trae-style-section' },
                        h('label', { className: 'trae-style-label' }, '快捷编辑文案 (实时生效)'),
                        h('input', {
                          type: 'text',
                          className: 'trae-style-input',
                          value: textEditValue,
                          placeholder: '输入新文案实时预览…',
                          onChange: (e) => applyLiveText(e.target.value),
                        }),
                      ),

                      // Typography & Colors
                      h(
                        'div',
                        { className: 'trae-style-section' },
                        h('label', { className: 'trae-style-label' }, '文字与颜色'),
                        h(
                          'div',
                          { className: 'trae-style-grid-2' },
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '文字色'),
                            h(
                              'div',
                              { className: 'trae-color-Input-wrap' },
                              h('input', {
                                type: 'color',
                                value: rgbToHex(selectedElement.styles?.color),
                                onChange: (e) => applyLiveStyle('color', e.target.value),
                              }),
                              h('input', {
                                type: 'text',
                                className: 'trae-style-input-sm',
                                value: selectedElement.styles?.color || '',
                                onChange: (e) => applyLiveStyle('color', e.target.value),
                              }),
                            ),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '背景色'),
                            h(
                              'div',
                              { className: 'trae-color-Input-wrap' },
                              h('input', {
                                type: 'color',
                                value: rgbToHex(selectedElement.styles?.backgroundColor),
                                onChange: (e) => applyLiveStyle('backgroundColor', e.target.value),
                              }),
                              h('input', {
                                type: 'text',
                                className: 'trae-style-input-sm',
                                value: selectedElement.styles?.backgroundColor || '',
                                onChange: (e) => applyLiveStyle('backgroundColor', e.target.value),
                              }),
                            ),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '字号'),
                            h('input', {
                              type: 'text',
                              className: 'trae-style-input-sm',
                              value: selectedElement.styles?.fontSize || '',
                              onChange: (e) => applyLiveStyle('fontSize', e.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '字重'),
                            h(
                              'select',
                              {
                                className: 'trae-style-input-sm',
                                value: selectedElement.styles?.fontWeight || '400',
                                onChange: (e) => applyLiveStyle('fontWeight', e.target.value),
                              },
                              ['300', '400', '500', '600', '700', '800'].map((w) =>
                                h('option', { key: w, value: w }, w),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Spacing & Box Model
                      h(
                        'div',
                        { className: 'trae-style-section' },
                        h('label', { className: 'trae-style-label' }, '尺寸与盒模型 (间距 / 圆角)'),
                        h(
                          'div',
                          { className: 'trae-style-grid-2' },
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '内边距 Padding'),
                            h('input', {
                              type: 'text',
                              className: 'trae-style-input-sm',
                              value: selectedElement.styles?.padding || '',
                              onChange: (e) => applyLiveStyle('padding', e.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '外边距 Margin'),
                            h('input', {
                              type: 'text',
                              className: 'trae-style-input-sm',
                              value: selectedElement.styles?.margin || '',
                              onChange: (e) => applyLiveStyle('margin', e.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '圆角 Radius'),
                            h('input', {
                              type: 'text',
                              className: 'trae-style-input-sm',
                              value: selectedElement.styles?.borderRadius || '',
                              onChange: (e) => applyLiveStyle('borderRadius', e.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'trae-style-field' },
                            h('span', null, '布局 Display'),
                            h(
                              'select',
                              {
                                className: 'trae-style-input-sm',
                                value: selectedElement.styles?.display || 'block',
                                onChange: (e) => applyLiveStyle('display', e.target.value),
                              },
                              ['block', 'flex', 'inline-flex', 'grid', 'inline-block', 'none'].map(
                                (d) => h('option', { key: d, value: d }, d),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Custom Inline CSS Rule
                      h(
                        'div',
                        { className: 'trae-style-section' },
                        h('label', { className: 'trae-style-label' }, '自定义 CSS 样式代码'),
                        h(
                          'div',
                          { style: { display: 'flex', gap: '4px' } },
                          h('input', {
                            type: 'text',
                            className: 'trae-style-input',
                            placeholder: '如: box-shadow: 0 4px 12px rgba(0,0,0,0.1);',
                            value: customCssInput,
                            onChange: (e) => setCustomCssInput(e.target.value),
                            onKeyDown: (e) => {
                              if (e.key === 'Enter') applyCustomCss()
                            },
                          }),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'trae-style-apply-btn',
                              onClick: applyCustomCss,
                            },
                            '应用',
                          ),
                        ),
                      ),

                      // One-click Add Element + Modified Styles to DSH Conversation
                      h(
                        'div',
                        { className: 'trae-style-footer' },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'trae-style-primary-btn',
                            onClick: () => {
                              insertBrowserElementReference(ctx, sessionId, selectedElement)
                              showToast('✦ 已将该元素与修改后的样式添加到会话栏')
                            },
                          },
                          '✦ 添加到对话 (含样式变更与定位)',
                        ),
                      ),
                    ),
              )
            : null,
        ),

        /* 4. Bottom Console Log Drawer (1:1 replica of screenshot bottom bar: `> 控制台日志 (x 1) [过滤] ... 清除 [✦ 添加到对话 · 1]`) */
        h(
          'div',
          { className: `trae-browser-console ${consoleOpen ? 'is-open' : ''}` },
          h(
            'div',
            {
              className: 'trae-console-bar',
              onClick: () => setConsoleOpen((v) => !v),
            },
            h(
              'div',
              { className: 'trae-console-bar-left' },
              h(
                'span',
                { className: 'trae-console-chevron' },
                consoleOpen ? '∨' : '›',
              ),
              h('span', { className: 'trae-console-title' }, '控制台日志'),
              errorCount > 0
                ? h(
                    'span',
                    { className: 'trae-console-err-badge' },
                    `⊗ ${errorCount}`,
                  )
                : null,
              warnCount > 0
                ? h(
                    'span',
                    { className: 'trae-console-warn-badge' },
                    `⚠ ${warnCount}`,
                  )
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: `trae-console-filter-btn ${consoleFilter !== 'all' ? 'is-active' : ''}`,
                  title: '筛选日志级别 (全部 / 仅错误)',
                  onClick: (e) => {
                    e.stopPropagation()
                    setConsoleFilter((f) => (f === 'all' ? 'error' : 'all'))
                    if (!consoleOpen) setConsoleOpen(true)
                  },
                },
                consoleFilter === 'error' ? '仅错误' : '⏷',
              ),
            ),
            h(
              'div',
              {
                className: 'trae-console-bar-right',
                onClick: (e) => e.stopPropagation(),
              },
              selectedElement
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'trae-console-clear-btn',
                      onClick: () => {
                        insertBrowserElementReference(ctx, sessionId, selectedElement)
                        showToast('✦ 已将选中元素添加到对话')
                      },
                    },
                    `🎯 选中: <${selectedElement.tagName}>`,
                  )
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: 'trae-console-clear-btn',
                  onClick: () => setConsoleLogs([]),
                },
                '清除',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'trae-console-add-chat-btn',
                  onClick: () => {
                    const targetLogs =
                      errorCount > 0
                        ? consoleLogs.filter((l) => l.level === 'error')
                        : consoleLogs
                    if (targetLogs.length === 0) {
                      showToast('当前暂无控制台日志可添加')
                      return
                    }
                    insertBrowserConsoleReference(ctx, sessionId, targetLogs, activePage.url)
                    showToast('✦ 已将控制台日志添加到会话栏')
                  },
                },
                h('span', { style: { color: '#10b981', marginRight: '4px' } }, '✦'),
                `添加到对话${errorCount > 0 ? ' · ' + errorCount : consoleLogs.length > 0 ? ' · ' + consoleLogs.length : ''}`,
              ),
            ),
          ),

          consoleOpen
            ? h(
                'div',
                { className: 'trae-console-list' },
                filteredLogs.length === 0
                  ? h('div', { className: 'trae-console-empty' }, '暂无控制台日志输出')
                  : filteredLogs.map((item) =>
                      h(
                        'div',
                        {
                          key: item.id,
                          className: `trae-console-item is-${item.level}`,
                        },
                        h(
                          'span',
                          { className: 'trae-console-item-badge' },
                          item.level === 'error' ? '⊗' : item.level === 'warn' ? '⚠' : '›',
                        ),
                        h(
                          'div',
                          { className: 'trae-console-item-content' },
                          h('div', { className: 'trae-console-item-text' }, item.text),
                          item.stack
                            ? h('pre', { className: 'trae-console-item-stack' }, item.stack)
                            : null,
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'trae-console-item-send',
                            onClick: () => {
                              insertBrowserConsoleReference(ctx, sessionId, [item], activePage.url)
                              showToast('✦ 已将该条报错添加到会话栏')
                            },
                          },
                          '✦ 添加到对话',
                        ),
                      ),
                    ),
              )
            : null,
        ),
      )
    }

    /** Header action buttons in conversation header to one-click open SOLO Editor, SOLO Browser, or Terminal */
    function HeaderOpenSoloButton(props) {
      const { ctx, sessionId, inputActions, useInput } = props
      recordSessionInputProps(sessionId, inputActions, useInput)
      return h(
        'div',
        { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
        h(
          'button',
          {
            type: 'button',
            className: 'trae-solo-header-btn',
            title: tr(ctx, 'openSolo'),
            onClick: () => {
              try {
                ctx.get('layout')?.openRightbar?.(true, false)
                ctx.get('sidebarRight')?.openTab?.(TAB_KIND, { revealIfOpened: true })
              } catch (e) {
                console.error('[dsh-trae-solo] openTab editor failed:', e)
              }
            },
          },
          h(IconTraeCode, { size: 14 }),
          h('span', null, tr(ctx, 'editorTitle')),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'trae-solo-header-btn',
            title: tr(ctx, 'openBrowser'),
            onClick: () => {
              try {
                ctx.get('layout')?.openRightbar?.(true, false)
                ctx.get('sidebarRight')?.openTab?.(BROWSER_TAB_KIND, { revealIfOpened: true })
              } catch (e) {
                console.error('[dsh-trae-solo] openTab browser failed:', e)
              }
            },
          },
          h(IconTraeBrowser, { size: 14 }),
          h('span', null, tr(ctx, 'browserTitle')),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'trae-solo-header-btn',
            title: tr(ctx, 'openTerminal'),
            onClick: () => {
              try {
                ctx.get('layout')?.openRightbar?.(true, false)
                ctx.get('sidebarRight')?.openTab?.(TERMINAL_TAB_KIND, { revealIfOpened: true })
              } catch (e) {
                console.error('[dsh-trae-solo] openTab terminal failed:', e)
              }
            },
          },
          h(IconTraeTerminal, { size: 13.5, color: '#10b981' }),
          h('span', null, tr(ctx, 'terminalTitle')),
        ),
      )
    }

    /* ── Tab 3: Standalone Trae SOLO Interactive Terminal Tab Components ── */

    let xtermLoadPromise = null

    function ensureXtermLoaded() {
      if (typeof window !== 'undefined' && window.Terminal) {
        return Promise.resolve(window.Terminal)
      }
      if (xtermLoadPromise) return xtermLoadPromise
      xtermLoadPromise = new Promise((resolve, reject) => {
        try {
          if (!document.querySelector('link[data-trae-xterm-css="true"]')) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = '/trae-solo/assets/xterm.css'
            link.setAttribute('data-trae-xterm-css', 'true')
            document.head.appendChild(link)
          }
          const script = document.createElement('script')
          script.src = '/trae-solo/assets/xterm.js'
          script.async = true
          script.onload = () => {
            if (window.Terminal) resolve(window.Terminal)
            else reject(new Error('window.Terminal not found after loading xterm.js'))
          }
          script.onerror = () => {
            xtermLoadPromise = null
            reject(new Error('Failed to load /trae-solo/assets/xterm.js'))
          }
          document.head.appendChild(script)
        } catch (err) {
          xtermLoadPromise = null
          reject(err)
        }
      })
      return xtermLoadPromise
    }

    function getSoloTerminalTheme(dark) {
      return dark
        ? {
            background: '#121215',
            foreground: '#e4e4e7',
            cursor: '#10b981',
            cursorAccent: '#121215',
            selectionBackground: 'rgba(59, 130, 246, 0.32)',
            black: '#27272a',
            red: '#ef4444',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#e4e4e7',
            brightBlack: '#71717a',
            brightRed: '#f87171',
            brightGreen: '#34d399',
            brightYellow: '#fbbf24',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#ffffff',
          }
        : {
            background: '#ffffff',
            foreground: '#1f2937',
            cursor: '#10b981',
            cursorAccent: '#ffffff',
            selectionBackground: 'rgba(59, 130, 246, 0.22)',
            black: '#1f2937',
            red: '#dc2626',
            green: '#059669',
            yellow: '#d97706',
            blue: '#2563eb',
            magenta: '#7c3aed',
            cyan: '#0891b2',
            brightBlack: '#6b7280',
            brightRed: '#ef4444',
            brightGreen: '#10b981',
            brightYellow: '#f59e0b',
            brightBlue: '#3b82f6',
            brightMagenta: '#8b5cf6',
            brightCyan: '#06b6d4',
            brightWhite: '#111827',
          }
    }

    function TraeTerminalTabTitle(props) {
      const { ctx } = props
      return h(
        'span',
        { className: 'trae-solo-tab-chip' },
        h(IconTraeTerminal, { size: 14, color: '#10b981' }),
        h('span', { className: 'trae-solo-tab-chip-text' }, tr(ctx, 'terminalTitle')),
      )
    }

    /** Single PTY Instance Screen with xterm.js + floating `[ ✦ 添加到对话 Ctrl+U ]` selection bar */
    function SoloXtermInstance({ ctx, sessionId, termInfo, active, dark, onSelectionAdded }) {
      const wrapRef = useRef(null)
      const mountRef = useRef(null)
      const xtermRef = useRef(null)
      const [selectionState, setSelectionState] = useState(null)

      useEffect(() => {
        let cancelled = false
        let xterm = null
        let es = null
        let resizeObs = null

        ensureXtermLoaded()
          .then((TerminalCtor) => {
            if (cancelled || !mountRef.current) return

            xterm = new TerminalCtor({
              cursorBlink: true,
              fontSize: 13,
              lineHeight: 1.35,
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              scrollback: 3000,
              allowProposedApi: true,
              theme: getSoloTerminalTheme(dark),
            })
            xterm.open(mountRef.current)
            xtermRef.current = xterm

            // Compute and fit dimensions
            const fitTerminal = () => {
              if (!mountRef.current || !xterm) return
              const rect = mountRef.current.getBoundingClientRect()
              if (rect.width < 40 || rect.height < 30) return
              let cellW = 8
              let cellH = 18
              try {
                const dims = xterm._core?._renderService?.dimensions?.css?.cell
                if (dims?.width > 0 && dims?.height > 0) {
                  cellW = dims.width
                  cellH = dims.height
                }
              } catch {}
              const cols = Math.max(20, Math.min(400, Math.floor((rect.width - 20) / cellW)))
              const rows = Math.max(5, Math.min(160, Math.floor((rect.height - 12) / cellH)))
              if (cols !== xterm.cols || rows !== xterm.rows) {
                try {
                  xterm.resize(cols, rows)
                } catch {}
                void fetch('/trae-solo/api/terminal/resize', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ id: termInfo.id, cols, rows }),
                }).catch(() => {})
              }
            }

            setTimeout(fitTerminal, 60)
            resizeObs = new ResizeObserver(() => fitTerminal())
            resizeObs.observe(mountRef.current)

            // Forward user keystrokes to backend PTY
            xterm.onData((data) => {
              void fetch('/trae-solo/api/terminal/input', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id: termInfo.id, data }),
              }).catch(() => {})
            })

            // Update selection state for `[ ✦ 添加到对话 Ctrl+U ]` floating bar
            const updateSelectionBar = () => {
              if (!xterm || !mountRef.current || !wrapRef.current) return
              if (!xterm.hasSelection()) {
                setSelectionState(null)
                return
              }
              const rawText = xterm.getSelection() || ''
              const cleaned = rawText.replace(/\r\n/g, '\n').replace(/\n+$/, '')
              if (!cleaned.trim()) {
                setSelectionState(null)
                return
              }

              let startLine = 1
              let endLine = 1
              try {
                const pos = xterm.getSelectionPosition?.()
                if (pos && pos.start && pos.end) {
                  const sY = Math.min(pos.start.y, pos.end.y)
                  const eY = Math.max(pos.start.y, pos.end.y)
                  const adjustedEY = pos.end.x === 0 && eY > sY ? eY - 1 : eY
                  startLine = sY + 1
                  endLine = Math.max(startLine, adjustedEY + 1)
                }
              } catch {}

              // Compute vertical offset relative to `wrapRef` from `.xterm-selection div` or buffer row
              let topPx = 10
              try {
                const wrapRect = wrapRef.current.getBoundingClientRect()
                const selDiv = mountRef.current.querySelector('.xterm-selection div')
                if (selDiv && selDiv.offsetHeight > 0) {
                  const selRect = selDiv.getBoundingClientRect()
                  topPx = Math.max(6, Math.min(wrapRect.height - 32, Math.round(selRect.top - wrapRect.top + (selRect.height - 24) / 2)))
                } else {
                  const cellH = xterm._core?._renderService?.dimensions?.css?.cell?.height || 18
                  const viewportRow = Math.max(0, startLine - 1 - (xterm.buffer?.active?.viewportY || 0))
                  topPx = Math.max(6, Math.min(wrapRect.height - 32, Math.round(viewportRow * cellH + 6)))
                }
              } catch {}

              setSelectionState({
                selectedText: cleaned,
                startLine,
                endLine,
                topPx,
              })
            }

            xterm.onSelectionChange(() => {
              requestAnimationFrame(updateSelectionBar)
            })
            xterm.onScroll(() => {
              if (xterm.hasSelection()) requestAnimationFrame(updateSelectionBar)
            })

            //Intercept Ctrl+U / Cmd+U inside xterm when selection exists
            xterm.attachCustomKeyEventHandler((ev) => {
              if (
                ev.type === 'keydown' &&
                (ev.ctrlKey || ev.metaKey) &&
                !ev.shiftKey &&
                !ev.altKey &&
                ev.key.toLowerCase() === 'u'
              ) {
                if (xterm.hasSelection() && (xterm.getSelection() || '').trim()) {
                  ev.preventDefault()
                  ev.stopPropagation()
                  const text = xterm.getSelection()
                  let sLine = 1
                  let eLine = 1
                  try {
                    const pos = xterm.getSelectionPosition?.()
                    if (pos && pos.start && pos.end) {
                      const sY = Math.min(pos.start.y, pos.end.y)
                      const eY = Math.max(pos.start.y, pos.end.y)
                      const adjustedEY = pos.end.x === 0 && eY > sY ? eY - 1 : eY
                      sLine = sY + 1
                      eLine = Math.max(sLine, adjustedEY + 1)
                    }
                  } catch {}
                  insertTerminalSelectionReference(ctx, sessionId, {
                    selectedText: text,
                    startLine: sLine,
                    endLine: eLine,
                    shellName: termInfo.shellName || termInfo.title || 'zsh',
                  })
                  onSelectionAdded?.(`Terminal ${sLine}-${eLine}`)
                  xterm.clearSelection()
                  setSelectionState(null)
                  return false
                }
              }
              return true
            })

            // Connect to SSE stream for live PTY output
            es = new EventSource(`/trae-solo/api/terminal/stream?id=${encodeURIComponent(termInfo.id)}`)
            es.onmessage = (ev) => {
              try {
                const msg = JSON.parse(ev.data)
                if (msg.type === 'snapshot') {
                  xterm.reset()
                  if (msg.data) xterm.write(msg.data)
                } else if (msg.type === 'output' && msg.data) {
                  xterm.write(msg.data)
                } else if (msg.type === 'exit') {
                  xterm.writeln(`\r\n\x1b[90m[进程已退出 (退出码: ${msg.exitCode ?? 0})]\x1b[0m`)
                }
              } catch {}
            }
          })
          .catch((err) => {
            console.error('[dsh-trae-solo] xterm init error:', err)
          })

        return () => {
          cancelled = true
          resizeObs?.disconnect()
          es?.close()
          try {
            xterm?.dispose()
          } catch {}
          xtermRef.current = null
        }
      }, [termInfo.id])

      // Live dark/light theme sync for xterm
      useEffect(() => {
        if (xtermRef.current) {
          try {
            xtermRef.current.options.theme = getSoloTerminalTheme(dark)
          } catch {}
        }
      }, [dark])

      // Refocus and refit when becoming active
      useEffect(() => {
        if (active && xtermRef.current) {
          setTimeout(() => {
            try {
              xtermRef.current?.focus()
            } catch {}
          }, 40)
        }
      }, [active])

      const handleAddSelectionClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selectionState) return
        insertTerminalSelectionReference(ctx, sessionId, {
          selectedText: selectionState.selectedText,
          startLine: selectionState.startLine,
          endLine: selectionState.endLine,
          shellName: termInfo.shellName || termInfo.title || 'zsh',
        })
        onSelectionAdded?.(`Terminal ${selectionState.startLine}-${selectionState.endLine}`)
        try {
          xtermRef.current?.clearSelection()
        } catch {}
        setSelectionState(null)
      }

      return h(
        'div',
        {
          ref: wrapRef,
          className: 'trae-terminal-instance-wrap',
          style: { display: active ? 'flex' : 'none' },
        },
        h('div', {
          ref: mountRef,
          className: 'trae-terminal-xterm-mount',
        }),
        selectionState
          ? h(
              'button',
              {
                type: 'button',
                className: 'trae-term-selection-bar is-inline',
                style: {
                  top: `${selectionState.topPx}px`,
                  right: '18px',
                },
                onMouseDown: (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                },
                onClick: handleAddSelectionClick,
              },
              h('span', { className: 'trae-term-selection-sparkle' }, '✦'),
              h('span', null, '添加到对话'),
              h('span', { className: 'trae-term-selection-shortcut' }, 'Ctrl+U'),
            )
          : null,
      )
    }

    function TraeTerminalTabBody(props) {
      const { ctx, sessionId, inputActions, useInput } = props
      recordSessionInputProps(sessionId, inputActions, useInput)

      const [terminals, setTerminals] = useState([])
      const [activeTermId, setActiveTermId] = useState(null)
      const [shells, setShells] = useState([{ name: 'zsh', path: '/bin/zsh' }])
      const [shellMenuOpen, setShellMenuOpen] = useState(false)
      const [loading, setLoading] = useState(true)
      const [toastMsg, setToastMsg] = useState(null)
      const [dark, setDark] = useState(() => isDarkScheme(ctx))

      function showToast(msg) {
        setToastMsg(msg)
        setTimeout(() => {
          setToastMsg((cur) => (cur === msg ? null : cur))
        }, 2200)
      }

      // Observe dark/light theme changes
      useEffect(() => {
        const checkTheme = () => setDark(isDarkScheme(ctx))
        const obs = new MutationObserver(checkTheme)
        obs.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
        const off = ctx.on?.('theme/change', checkTheme)
        return () => {
          obs.disconnect()
          off?.()
        }
      }, [])

      async function createNewTerminal(shellObj) {
        try {
          const res = await fetch('/trae-solo/api/terminal/create', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId || 'default',
              shellPath: shellObj?.path,
              shellName: shellObj?.name,
              title: shellObj?.name,
            }),
          })
          const data = await res.json()
          if (data.ok && data.terminal) {
            if (Array.isArray(data.shells) && data.shells.length > 0) {
              setShells(data.shells)
            }
            setTerminals((prev) => {
              if (prev.some((t) => t.id === data.terminal.id)) return prev
              return [...prev, data.terminal]
            })
            setActiveTermId(data.terminal.id)
          }
        } catch (err) {
          console.error('[dsh-trae-solo] createNewTerminal failed:', err)
        } finally {
          setLoading(false)
        }
      }

      async function closeTerminalTab(id, e) {
        e?.stopPropagation?.()
        try {
          await fetch('/trae-solo/api/terminal/kill', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        } catch {}
        setTerminals((prev) => {
          const next = prev.filter((t) => t.id !== id)
          if (next.length === 0) {
            // Automatically spawn a fresh shell if the user closed the last one
            void createNewTerminal(shells[0])
            return []
          }
          if (activeTermId === id) {
            setActiveTermId(next[next.length - 1].id)
          }
          return next
        })
      }

      // Initial load: fetch existing session terminals or create the first one (`[ >_ zsh × ] [ + v ]`)
      useEffect(() => {
        let cancelled = false
        async function initTerminals() {
          try {
            const sid = sessionId || 'default'
            const res = await fetch(`/trae-solo/api/terminal/list?sessionId=${encodeURIComponent(sid)}`, {
              cache: 'no-store',
            })
            const data = await res.json()
            if (cancelled) return
            if (Array.isArray(data.shells) && data.shells.length > 0) {
              setShells(data.shells)
            }
            if (data.ok && Array.isArray(data.terminals) && data.terminals.length > 0) {
              setTerminals(data.terminals)
              setActiveTermId(data.terminals[data.terminals.length - 1].id)
              setLoading(false)
            } else {
              await createNewTerminal(data.shells?.[0])
            }
          } catch {
            if (!cancelled) await createNewTerminal()
          }
        }
        void initTerminals()
        return () => {
          cancelled = true
        }
      }, [sessionId])

      // Close shell dropdown menu when clicking outside
      useEffect(() => {
        if (!shellMenuOpen) return
        const close = () => setShellMenuOpen(false)
        window.addEventListener('click', close)
        return () => window.removeEventListener('click', close)
      }, [shellMenuOpen])

      return h(
        'div',
        { className: 'trae-terminal-root' },

        /* 1. Top Inner Shell Tab Strip (matches Screenshot 1: `[ >_ zsh × ] [ + ∨ ]`) */
        h(
          'div',
          { className: 'trae-terminal-tabstrip' },
          terminals.map((t) =>
            h(
              'div',
              {
                key: t.id,
                className: `trae-terminal-subtab ${t.id === activeTermId ? 'is-active' : ''}`,
                onClick: () => setActiveTermId(t.id),
              },
              h(IconTraeTerminal, { size: 13 }),
              h('span', { className: 'trae-terminal-subtab-title' }, t.title || t.shellName || 'zsh'),
              h(
                'button',
                {
                  type: 'button',
                  className: 'trae-terminal-subtab-close',
                  title: '关闭此终端',
                  onClick: (e) => closeTerminalTab(t.id, e),
                },
                '×',
              ),
            ),
          ),

          /* `[ + | ∨ ]` New Terminal + Shell Picker button group */
          h(
            'div',
            {
              className: 'trae-terminal-add-group',
              onClick: (e) => e.stopPropagation(),
            },
            h(
              'button',
              {
                type: 'button',
                className: 'trae-terminal-add-btn',
                title: '新建终端',
                onClick: () => createNewTerminal(shells[0]),
              },
              '+',
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'trae-terminal-shell-caret',
                title: '选择 Shell 类型',
                onClick: () => setShellMenuOpen((v) => !v),
              },
              '∨',
            ),
            shellMenuOpen
              ? h(
                  'div',
                  { className: 'trae-terminal-shell-menu' },
                  shells.map((s) =>
                    h(
                      'button',
                      {
                        key: s.path,
                        type: 'button',
                        className: 'trae-terminal-shell-item',
                        onClick: () => {
                          setShellMenuOpen(false)
                          void createNewTerminal(s)
                        },
                      },
                      h(IconTraeTerminal, { size: 12 }),
                      h('span', null, s.name),
                      h('span', { className: 'trae-terminal-shell-path' }, s.path),
                    ),
                  ),
                )
              : null,
          ),

          h(
            'div',
            { className: 'trae-terminal-hint-right' },
            '划选终端文字可一键「✦ 添加到对话 (Ctrl+U)」',
          ),
        ),

        /* 2. Terminal Viewport Stage */
        h(
          'div',
          { className: 'trae-terminal-stage' },
          toastMsg ? h('div', { className: 'trae-browser-toast' }, `✦ 已添加 ${toastMsg} 到会话栏`) : null,
          loading && terminals.length === 0
            ? h(
                'div',
                { className: 'trae-solo-status-overlay' },
                h('div', { className: 'trae-solo-status-text' }, '正在启动 SOLO 终端…'),
              )
            : terminals.map((t) =>
                h(SoloXtermInstance, {
                  key: t.id,
                  ctx,
                  sessionId,
                  termInfo: t,
                  active: t.id === activeTermId,
                  dark,
                  onSelectionAdded: (label) => showToast(label),
                }),
              ),
        ),
      )
    }

    const TRAE_SOLO_CSS = `
      .trae-solo-workbench-host {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        background: var(--dsw-alias-bg-base);
        overflow: hidden;
      }
      .trae-solo-iframe-mount {
        width: 100%;
        height: 100%;
        flex: 1 1 auto;
        min-height: 0;
      }
      .trae-solo-status-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        height: 100%;
        padding: 24px;
        color: var(--dsw-alias-label-secondary);
        font-size: 13px;
      }
      .trae-solo-status-error {
        color: var(--dsw-alias-state-error-primary);
      }
      .trae-solo-tab-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
      .trae-solo-header-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 26px;
        padding: 0 10px;
        border-radius: 6px;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .trae-solo-header-btn:hover {
        background: var(--dsw-alias-bg-layer-2);
        border-color: var(--dsw-alias-brand-primary);
      }
      [data-trae-drop-hover="true"] {
        outline: 2px dashed var(--dsw-alias-brand-primary, #10b981) !important;
        outline-offset: 2px !important;
        transition: outline 0.15s ease;
      }

      /* ── Trae SOLO Interactive Browser Styles ── */
      .trae-browser-root {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        user-select: none;
      }
      .trae-browser-tabstrip {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 34px;
        padding: 4px 8px 0;
        background: var(--dsw-alias-bg-layer-2, #f3f4f6);
        border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        overflow-x: auto;
        flex-shrink: 0;
      }
      .trae-browser-subtab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 29px;
        padding: 0 10px;
        border-radius: 6px 6px 0 0;
        font-size: 12px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        cursor: pointer;
        max-width: 180px;
        flex-shrink: 0;
        transition: background 0.12s;
      }
      .trae-browser-subtab.is-active {
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary);
        font-weight: 500;
        box-shadow: 0 -1px 3px rgba(0,0,0,0.04);
      }
      .trae-browser-subtab-icon {
        font-size: 12px;
        opacity: 0.75;
      }
      .trae-browser-subtab-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trae-browser-subtab-close {
        all: unset;
        cursor: pointer;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 13px;
        opacity: 0.6;
      }
      .trae-browser-subtab-close:hover {
        opacity: 1;
        background: rgba(0,0,0,0.08);
      }
      .trae-browser-subtab-add {
        all: unset;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 5px;
        font-size: 15px;
        color: var(--dsw-alias-label-secondary);
        margin-left: 2px;
      }
      .trae-browser-subtab-add:hover {
        background: var(--dsw-alias-interactive-bg-hover);
        color: var(--dsw-alias-label-primary);
      }
      .trae-browser-devports {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .trae-browser-port-pill {
        all: unset;
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        font-size: 11px;
        font-weight: 600;
      }
      .trae-browser-port-pill:hover {
        background: rgba(16, 185, 129, 0.22);
      }

      /* Navigation bar */
      .trae-browser-navbar {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 40px;
        padding: 0 10px;
        background: var(--dsw-alias-bg-base);
        border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        flex-shrink: 0;
      }
      .trae-browser-nav-btn {
        all: unset;
        cursor: pointer;
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: var(--dsw-alias-label-secondary);
        font-size: 14px;
      }
      .trae-browser-nav-btn:hover:not(:disabled) {
        background: var(--dsw-alias-interactive-bg-hover);
        color: var(--dsw-alias-label-primary);
      }
      .trae-browser-nav-btn:disabled {
        opacity: 0.35;
        cursor: default;
      }
      .trae-browser-url-form {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        position: relative;
        min-width: 0;
      }
      .trae-browser-url-input {
        width: 100%;
        height: 28px;
        padding: 0 30px 0 12px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: var(--dsw-alias-bg-layer-2, #f3f4f6);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        outline: none;
        transition: border-color 0.15s, background 0.15s;
      }
      .trae-browser-url-input:focus {
        background: var(--dsw-alias-bg-base);
        border-color: #10b981;
      }
      .trae-browser-url-copy {
        all: unset;
        cursor: pointer;
        position: absolute;
        right: 6px;
        font-size: 12px;
        color: var(--dsw-alias-label-tertiary);
        padding: 2px 4px;
      }
      .trae-browser-url-copy:hover {
        color: var(--dsw-alias-label-primary);
      }
      .trae-browser-actions {
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      .trae-browser-tool-btn {
        all: unset;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        font-weight: 600;
        transition: all 0.15s;
      }
      .trae-browser-tool-btn:hover {
        background: var(--dsw-alias-interactive-bg-hover);
        color: var(--dsw-alias-label-primary);
      }
      .trae-browser-tool-btn.is-active {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.4);
      }

      /* Stage & Onboarding Popover */
      .trae-browser-stage {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        overflow: hidden;
        background: var(--dsw-alias-bg-layer-1);
      }
      .trae-browser-canvas-wrap {
        flex: 1 1 auto;
        height: 100%;
        min-width: 0;
        display: flex;
        justify-content: center;
        background: var(--dsw-alias-bg-base);
        overflow: auto;
      }
      .trae-browser-canvas-wrap.is-device {
        background: #18181b;
        padding: 16px 0;
      }
      .trae-browser-iframe {
        height: 100%;
        border: 0;
        background: #ffffff;
        box-shadow: 0 0 24px rgba(0,0,0,0.08);
      }
      .trae-browser-empty-start {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 32px 24px;
        text-align: center;
        color: var(--dsw-alias-label-secondary);
      }
      .trae-browser-empty-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary);
      }
      .trae-browser-empty-sub {
        font-size: 12px;
        color: var(--dsw-alias-label-tertiary);
        max-width: 340px;
        line-height: 1.5;
      }
      .trae-browser-empty-ports {
        margin-top: 8px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        color: var(--dsw-alias-label-secondary);
      }

      /* 1:1 Onboarding Card from Screenshot */
      .trae-browser-guide-popover {
        position: absolute;
        top: 10px;
        right: 14px;
        width: 288px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        border-radius: 12px;
        padding: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
        z-index: 40;
        cursor: pointer;
      }
      .trae-guide-header {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--dsw-alias-label-primary);
      }
      .trae-guide-diagram {
        background: rgba(16, 185, 129, 0.08);
        border-radius: 8px;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .trae-guide-row-cards {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }
      .trae-guide-mock-box {
        height: 38px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border-radius: 4px;
        position: relative;
      }
      .trae-guide-mock-box.is-selected {
        border: 1.5px solid #10b981;
        background: rgba(16, 185, 129, 0.06);
      }
      .trae-guide-tag {
        position: absolute;
        top: -18px;
        left: -1.5px;
        background: #10b981;
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 3px 3px 3px 0;
      }
      .trae-guide-cursor {
        position: absolute;
        right: 6px;
        bottom: 2px;
        font-size: 14px;
        font-weight: 700;
        color: #111827;
      }
      .trae-guide-add-pill {
        position: absolute;
        bottom: -24px;
        right: -52px;
        background: #18181b;
        color: #fff;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 5px;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        z-index: 2;
      }
      .trae-guide-text-box {
        position: relative;
        margin-top: 14px;
        border: 1.5px solid #10b981;
        background: var(--dsw-alias-bg-base, #ffffff);
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 12px;
        color: #10b981;
        letter-spacing: 1px;
      }
      .trae-guide-edit-pill {
        background: #18181b;
        color: #fff;
        font-size: 11px;
        padding: 5px 10px;
        border-radius: 5px;
        align-self: flex-start;
      }

      /* Live Style Editor Drawer */
      .trae-style-drawer {
        width: 270px;
        flex-shrink: 0;
        height: 100%;
        background: var(--dsw-alias-bg-base);
        border-left: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        z-index: 20;
      }
      .trae-style-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        font-size: 12px;
      }
      .trae-style-drawer-close {
        all: unset;
        cursor: pointer;
        font-size: 16px;
        color: var(--dsw-alias-label-secondary);
        padding: 0 4px;
      }
      .trae-style-empty {
        padding: 32px 18px;
        text-align: center;
        font-size: 12px;
        color: var(--dsw-alias-label-secondary);
        line-height: 1.6;
      }
      .trae-style-body {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .trae-style-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(0,0,0,0.06));
      }
      .trae-style-el-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .trae-style-sem-tag {
        background: #10b981;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;
      }
      .trae-style-dim {
        margin-left: auto;
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-style-selector-line {
        font-family: monospace;
        font-size: 11px;
        color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-2);
        padding: 4px 6px;
        border-radius: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trae-style-source-line {
        font-size: 11px;
        color: #10b981;
        font-weight: 500;
        word-break: break-all;
      }
      .trae-style-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--dsw-alias-label-secondary);
      }
      .trae-style-input {
        width: 100%;
        box-sizing: border-box;
        height: 28px;
        padding: 0 8px;
        border-radius: 5px;
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
      }
      .trae-style-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .trae-style-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-color-Input-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .trae-color-Input-wrap input[type="color"] {
        width: 22px;
        height: 24px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .trae-style-input-sm {
        width: 100%;
        box-sizing: border-box;
        height: 24px;
        padding: 0 6px;
        border-radius: 4px;
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 11px;
      }
      .trae-style-apply-btn {
        all: unset;
        cursor: pointer;
        padding: 0 10px;
        height: 28px;
        border-radius: 5px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .trae-style-footer {
        padding-top: 4px;
      }
      .trae-style-primary-btn {
        all: unset;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: #10b981;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        transition: background 0.15s;
      }
      .trae-style-primary-btn:hover {
        background: #059669;
      }

      /* Toast */
      .trae-browser-toast {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #18181b;
        color: #ffffff;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        z-index: 50;
        pointer-events: none;
      }

      /* Bottom Console Drawer (matches screenshot bottom bar) */
      .trae-browser-console {
        flex-shrink: 0;
        border-top: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        background: var(--dsw-alias-bg-base);
        display: flex;
        flex-direction: column;
      }
      .trae-console-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 34px;
        padding: 0 10px;
        cursor: pointer;
        font-size: 12px;
      }
      .trae-console-bar:hover {
        background: var(--dsw-alias-bg-layer-1);
      }
      .trae-console-bar-left {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .trae-console-chevron {
        font-size: 13px;
        color: var(--dsw-alias-label-tertiary);
        width: 12px;
      }
      .trae-console-title {
        font-weight: 500;
        color: var(--dsw-alias-label-secondary);
      }
      .trae-console-err-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: #ef4444;
        font-weight: 600;
        font-size: 12px;
      }
      .trae-console-warn-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: #f59e0b;
        font-weight: 600;
        font-size: 12px;
      }
      .trae-console-filter-btn {
        all: unset;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--dsw-alias-label-tertiary);
        font-size: 11px;
      }
      .trae-console-filter-btn:hover, .trae-console-filter-btn.is-active {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .trae-console-bar-right {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .trae-console-clear-btn {
        all: unset;
        cursor: pointer;
        font-size: 12px;
        color: var(--dsw-alias-label-secondary);
        padding: 2px 6px;
        border-radius: 4px;
      }
      .trae-console-clear-btn:hover {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .trae-console-add-chat-btn {
        all: unset;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        height: 24px;
        padding: 0 10px;
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-2, #f3f4f6);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 500;
        transition: background 0.15s;
      }
      .trae-console-add-chat-btn:hover {
        background: rgba(16, 185, 129, 0.15);
      }
      .trae-console-list {
        max-height: 190px;
        overflow-y: auto;
        border-top: 1px solid var(--dsw-alias-border-l3, #f3f4f6);
        background: var(--dsw-alias-bg-layer-1);
        font-family: monospace;
        font-size: 11.5px;
      }
      .trae-console-empty {
        padding: 18px;
        text-align: center;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-console-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(0,0,0,0.05));
      }
      .trae-console-item.is-error {
        background: rgba(239, 68, 68, 0.06);
        color: #ef4444;
      }
      .trae-console-item.is-warn {
        background: rgba(245, 158, 11, 0.06);
        color: #d97706;
      }
      .trae-console-item-content {
        flex: 1 1 auto;
        min-width: 0;
        word-break: break-all;
      }
      .trae-console-item-stack {
        margin: 4px 0 0;
        font-size: 10.5px;
        opacity: 0.75;
        white-space: pre-wrap;
      }
      .trae-console-item-send {
        all: unset;
        cursor: pointer;
        flex-shrink: 0;
        padding: 2px 7px;
        border-radius: 4px;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-family: sans-serif;
        font-size: 11px;
        border: 1px solid var(--dsw-alias-border-l2);
      }
      .trae-console-item-send:hover {
        border-color: #10b981;
        color: #10b981;
      }
      /* Style our DSH SOLO composer chips cleanly like Trae SOLO ([✦ div], [✦ img], [>_ Terminal 1-1]) */
      span[data-composer-chip="trae-solo"] .M7q97W_marker {
        display: none !important;
      }
      span[data-composer-chip="trae-solo"] .zrXFCq_reference {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 1px 7px;
        margin: 0 2px;
        border-radius: 5px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.28);
        color: #10b981;
        font-weight: 500;
        font-size: 12.5px;
        line-height: 18px;
      }
      span[data-composer-chip="trae-solo"] .zrXFCq_reference[title^=">_ Terminal"] {
        background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
        border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.32));
        color: var(--dsw-alias-label-primary);
      }

      /* Collapsed sent-message chips inside UserMessageBubble */
      .trae-sent-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 1px 7px;
        margin: 0 2px;
        border-radius: 6px;
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(16, 185, 129, 0.34);
        color: var(--dsw-alias-label-primary);
        font-size: 12.5px;
        font-weight: 500;
        line-height: 18px;
        vertical-align: baseline;
        font-family: inherit;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .trae-sent-chip.is-interactive {
        cursor: pointer;
        outline: none;
      }
      .trae-sent-chip.is-interactive:hover {
        background: rgba(16, 185, 129, 0.22);
        border-color: rgba(16, 185, 129, 0.6);
      }
      .trae-sent-chip.is-console-error {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.35);
      }
      .trae-sent-chip.is-console-error.is-interactive:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.6);
      }
      .trae-sent-chip.is-terminal {
        background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.14));
        border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.3));
        color: var(--dsw-alias-label-primary);
      }
      .trae-sent-chip.is-terminal.is-interactive:hover {
        background: rgba(16, 185, 129, 0.14);
        border-color: rgba(16, 185, 129, 0.55);
      }
      .trae-sent-chip-icon {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        line-height: 1;
        flex-shrink: 0;
      }
      .trae-sent-chip-label {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Hover preview card */
      .trae-sent-hover {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        line-height: 1.45;
        color: var(--dsw-alias-label-primary);
        min-width: 220px;
        max-width: 280px;
      }
      .trae-sent-hover-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .trae-sent-hover-badge {
        display: inline-flex;
        align-items: center;
        padding: 1px 6px;
        border-radius: 4px;
        background: rgba(16, 185, 129, 0.14);
        color: #10b981;
        font-weight: 600;
        font-size: 11.5px;
      }
      .trae-sent-hover-badge.is-err {
        background: rgba(239, 68, 68, 0.14);
        color: #ef4444;
      }
      .trae-sent-hover-badge.is-terminal {
        background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.16));
        color: var(--dsw-alias-label-primary);
      }
      .trae-sent-hover-dim {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-sent-hover-code {
        font-family: var(--ds-font-family-code, monospace);
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 4px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-secondary);
        word-break: break-all;
        max-height: 44px;
        overflow: hidden;
      }
      .trae-sent-hover-url {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trae-sent-hover-source {
        font-family: var(--ds-font-family-code, monospace);
        font-size: 11px;
        color: #10b981;
        word-break: break-all;
      }
      .trae-sent-hover-text {
        font-size: 11.5px;
        color: var(--dsw-alias-label-secondary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .trae-sent-hover-edit {
        font-size: 11px;
        font-weight: 500;
        color: #10b981;
      }
      .trae-sent-hover-pre {
        margin: 0;
        padding: 6px;
        border-radius: 4px;
        background: var(--dsw-alias-bg-layer-1);
        font-family: var(--ds-font-family-code, monospace);
        font-size: 11px;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 120px;
        overflow: hidden;
      }
      .trae-sent-hover-hint {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
        border-top: 1px solid var(--dsw-alias-border-l3, rgba(128,128,128,0.16));
        padding-top: 4px;
      }

      /* Detail Modal */
      .trae-sent-modal-dialog {
        width: min(640px, 92vw) !important;
        max-width: 92vw !important;
      }
      .trae-sent-modal-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 4px;
      }
      .trae-sent-kv {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .trae-sent-k {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-sent-v {
        font-size: 12.5px;
        color: var(--dsw-alias-label-primary);
        word-break: break-all;
      }
      .trae-sent-v.is-mono {
        font-family: var(--ds-font-family-code, monospace);
        font-size: 12px;
        padding: 5px 8px;
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-1);
      }
      .trae-sent-v.is-accent {
        color: #10b981;
        font-weight: 500;
      }
      .trae-sent-pre {
        margin: 0;
        padding: 8px 10px;
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-1);
        border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.2));
        font-family: var(--ds-font-family-code, monospace);
        font-size: 11.5px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 220px;
        overflow-y: auto;
        color: var(--dsw-alias-label-primary);
      }
      .trae-sent-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        width: 100%;
      }
      .trae-sent-modal-btn {
        cursor: pointer;
        height: 30px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--dsw-alias-border-l2);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 12.5px;
        font-weight: 500;
      }
      .trae-sent-modal-btn:hover {
        border-color: #10b981;
      }
      .trae-sent-modal-btn.is-primary {
        background: #10b981;
        border-color: #10b981;
        color: #fff;
      }
      .trae-sent-fallback-mask {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .trae-sent-fallback-dialog {
        width: min(640px, 92vw);
        background: var(--dsw-alias-bg-base);
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .trae-sent-fallback-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .trae-sent-fallback-sub {
        font-size: 12px;
        color: var(--dsw-alias-label-tertiary);
        word-break: break-all;
      }
      .trae-sent-fallback-body {
        min-height: 0;
      }
      .trae-sent-modal-close {
        all: unset;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        color: var(--dsw-alias-label-tertiary);
        padding: 2px 6px;
      }

      /* ── Standalone Trae SOLO Interactive Terminal Styles ── */
      .trae-terminal-root {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        user-select: none;
      }
      .trae-terminal-tabstrip {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 36px;
        padding: 4px 10px 0;
        background: var(--dsw-alias-bg-layer-2, #f3f4f6);
        border-bottom: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        flex-shrink: 0;
      }
      .trae-terminal-subtab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 31px;
        padding: 0 10px;
        border-radius: 6px 6px 0 0;
        font-size: 12.5px;
        color: var(--dsw-alias-label-secondary);
        background: transparent;
        cursor: pointer;
        max-width: 160px;
        flex-shrink: 0;
        transition: background 0.12s;
      }
      .trae-terminal-subtab.is-active {
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary);
        font-weight: 500;
        box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.04);
      }
      .trae-terminal-subtab-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trae-terminal-subtab-close {
        all: unset;
        cursor: pointer;
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 13px;
        opacity: 0.65;
      }
      .trae-terminal-subtab-close:hover {
        opacity: 1;
        background: rgba(128, 128, 128, 0.15);
      }
      .trae-terminal-add-group {
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        height: 24px;
        border-radius: 5px;
      }
      .trae-terminal-add-btn {
        all: unset;
        cursor: pointer;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px 0 0 4px;
        font-size: 15px;
        color: var(--dsw-alias-label-secondary);
      }
      .trae-terminal-add-btn:hover, .trae-terminal-shell-caret:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
        color: var(--dsw-alias-label-primary);
      }
      .trae-terminal-shell-caret {
        all: unset;
        cursor: pointer;
        width: 16px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0 4px 4px 0;
        font-size: 10px;
        color: var(--dsw-alias-label-tertiary);
      }
      .trae-terminal-shell-menu {
        position: absolute;
        top: 28px;
        left: 0;
        z-index: 120;
        min-width: 170px;
        padding: 4px;
        border-radius: 8px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .trae-terminal-shell-item {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 5px;
        font-size: 12px;
        color: var(--dsw-alias-label-primary);
      }
      .trae-terminal-shell-item:hover {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
      }
      .trae-terminal-shell-path {
        margin-left: auto;
        font-size: 10.5px;
        color: var(--dsw-alias-label-tertiary);
        font-family: monospace;
      }
      .trae-terminal-hint-right {
        margin-left: auto;
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary);
        padding-right: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .trae-terminal-stage {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: var(--dsw-alias-bg-base, #ffffff);
        overflow: hidden;
      }
      .trae-terminal-instance-wrap {
        position: relative;
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 8px 10px;
        box-sizing: border-box;
        overflow: hidden;
      }
      .trae-terminal-xterm-mount {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .trae-terminal-xterm-mount .xterm {
        height: 100%;
        padding: 2px;
      }
      .trae-terminal-xterm-mount .xterm-viewport {
        background-color: transparent !important;
      }

      /* Floating Action Bar ([ ✦ 添加到对话 Ctrl+U ]) inside SOLO Terminal */
      .trae-term-selection-bar {
        position: absolute;
        z-index: 60;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 24px;
        padding: 0 9px;
        border-radius: 6px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
        color: var(--dsw-alias-label-primary, #1f2937);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        transition: border-color 0.14s ease, box-shadow 0.14s ease, transform 0.1s ease;
      }
      .trae-term-selection-bar:hover {
        border-color: #10b981;
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.18);
      }
      .trae-term-selection-bar:active {
        transform: translateY(1px);
      }
      .trae-term-selection-sparkle {
        color: #10b981;
        font-size: 12.5px;
        line-height: 1;
      }
      .trae-term-selection-shortcut {
        color: var(--dsw-alias-label-tertiary, #9ca3af);
        font-size: 11px;
        font-weight: 400;
        margin-left: 2px;
      }
    `

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        // 0. Register `trae-solo` Reference Chip serializer so compact chips (`[✦ div]`, `[✦ img]`)
        // expand to their full DOM/CSS/Source payload when the user submits the prompt!
        ctx.inject(['inputTriggers'], (ictx) => {
          ictx.effect(() => {
            ensureTraeTriggerSource(ictx)
            return () => {
              traeSourceRegistered = false
            }
          }, 'dsh-trae-solo: reference serializer')
        })
        ensureTraeTriggerSource(ctx)

        // 0b. Collapse expanded Trae SOLO payloads inside sent UserMessageBubbles into compact chips
        ctx.inject(['uiConversation'], (uctx) => {
          const uiConv = uctx.get('uiConversation')
          if (!uiConv?.userText?.register) return

          uctx.effect(() => uiConv.userText.register(traeElementUserTextRule), 'dsh-trae-solo: userText element rule')
          uctx.effect(() => uiConv.userText.register(traeConsoleUserTextRule), 'dsh-trae-solo: userText console rule')
          uctx.effect(() => uiConv.userText.register(traeTerminalUserTextRule), 'dsh-trae-solo: userText terminal rule')
          uctx.effect(() => uiConv.userText.register(traeCodeSelectionUserTextRule), 'dsh-trae-solo: userText code selection rule')

          uctx.effect(
            () =>
              uctx.slots.inject('conversation.user.text.node', function* () {
                yield uctx.slots.register(
                  {
                    name: 'conversation.user.text.node',
                    key: 'trae-element',
                    priority: 100,
                    inject: (sessionId) => ({ ctx, sessionId }),
                  },
                  SentTraeElementNode,
                )
                yield uctx.slots.register(
                  {
                    name: 'conversation.user.text.node',
                    key: 'trae-console',
                    priority: 100,
                    inject: (sessionId) => ({ ctx, sessionId }),
                  },
                  SentTraeConsoleNode,
                )
                yield uctx.slots.register(
                  {
                    name: 'conversation.user.text.node',
                    key: 'trae-terminal',
                    priority: 100,
                    inject: (sessionId) => ({ ctx, sessionId }),
                  },
                  SentTraeTerminalNode,
                )
                yield uctx.slots.register(
                  {
                    name: 'conversation.user.text.node',
                    key: 'trae-code-selection',
                    priority: 100,
                    inject: (sessionId) => ({ ctx, sessionId }),
                  },
                  SentTraeCodeSelectionNode,
                )
              }),
            'dsh-trae-solo: user.text.node chip renderers',
          )
        })

        // 1. Inject plugin styles
        ctx.effect(() => {
          const styleEl = document.createElement('style')
          styleEl.dataset.plugin = 'dsh-trae-solo'
          styleEl.textContent = TRAE_SOLO_CSS
          document.head.appendChild(styleEl)
          return () => styleEl.remove()
        }, 'dsh-trae-solo: styles')

        // 2. Register locale dictionaries
        ctx.effect(() => {
          const offZh = ctx.locale.register(LOCALE_NS, 'zh', zhDict)
          const offEn = ctx.locale.register(LOCALE_NS, 'en', enDict)
          return () => {
            offZh()
            offEn()
          }
        }, 'dsh-trae-solo: locale')

        // 3. Live Dark/Light Theme Synchronization
        ctx.inject(['theme'], (tctx) => {
          const theme = tctx.get('theme')
          if (!theme?.overrideTokens) return
          tctx.effect(() => {
            return theme.overrideTokens('dsh-trae-solo', {
              '--dsw-alias-brand-primary': { light: '#10b981', dark: '#10b981' },
              '--dsw-specific-sidebar-fill': { light: '#f4f5f7', dark: '#16161a' },
            })
          }, 'dsh-trae-solo: theme tokens')

          tctx.effect(() => {
            let lastDark = null
            const notifyTheme = () => {
              try {
                const dark = isDarkScheme(ctx)
                if (dark !== lastDark) {
                  lastDark = dark
                  const mode = dark ? 'dark' : 'light'

                  if (workbenchHolder.iframe?.contentWindow) {
                    workbenchHolder.iframe.contentWindow.postMessage(
                      { type: 'trae-solo:set-theme', mode },
                      '*',
                    )
                  }

                  void fetch('/trae-solo/api/theme', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ mode }),
                  }).catch(() => {})
                }
              } catch {}
            }

            notifyTheme()
            const timer = setInterval(notifyTheme, 2000)
            const obs = new MutationObserver(notifyTheme)
            obs.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
            const offTheme = ctx.on('theme/change', notifyTheme)

            return () => {
              clearInterval(timer)
              obs.disconnect()
              offTheme?.()
            }
          }, 'dsh-trae-solo: live theme sync')
        })

        // 4. Message & Drag-Drop Bridge for Reference Insertion
        ctx.effect(() => {
          let activeDraggedPath = null

          const onMessage = (ev) => {
            if (ev.data && ev.data.type === 'trae-solo:drag-file') {
              activeDraggedPath = ev.data.path || null
            } else if (ev.data && ev.data.type === 'trae-solo:drag-end') {
              setTimeout(() => {
                activeDraggedPath = null
              }, 400)
            } else if (ev.data && ev.data.type === 'trae-solo:insert-reference') {
              if (ev.data.path) {
                const targetSid =
                  ctx.get('sidebarRight')?.mounted?.getSnapshot?.() ||
                  activeInputManager.sessionId
                insertWorkspaceReference(
                  ctx,
                  targetSid,
                  ev.data.path,
                  ev.data.path.endsWith('/'),
                  ev.data.lines,
                  ev.data.text,
                )
              }
            }
          }
          window.addEventListener('message', onMessage)

          function isConversationArea(target) {
            if (!target || !(target instanceof Element)) return false
            return !!target.closest(
              '[data-dsh-center-col], [class*="conversation"], [class*="composer"], textarea, [contenteditable="true"]',
            )
          }

          function getComposerBox(target) {
            if (!target || !(target instanceof Element)) return null
            return (
              target.closest('[class*="composer"], textarea, [contenteditable="true"]') ||
              document.querySelector('[class*="composer"]')
            )
          }

          const onDragOver = (e) => {
            if (!isConversationArea(e.target)) return
            e.preventDefault()
            if (e.dataTransfer) {
              e.dataTransfer.dropEffect = 'copy'
            }
            const box = getComposerBox(e.target)
            if (box && !box.hasAttribute('data-trae-drop-hover')) {
              box.setAttribute('data-trae-drop-hover', 'true')
            }
          }

          const onDragLeave = (e) => {
            const box = getComposerBox(e.target)
            if (box && box.hasAttribute('data-trae-drop-hover')) {
              box.removeAttribute('data-trae-drop-hover')
            }
          }

          const onDrop = (e) => {
            const box = getComposerBox(e.target)
            if (box) {
              box.removeAttribute('data-trae-drop-hover')
            }
            if (!isConversationArea(e.target)) return

            let text = ''
            if (e.dataTransfer) {
              text =
                e.dataTransfer.getData('text/plain') ||
                e.dataTransfer.getData('text/uri-list') ||
                ''
            }
            if (!text && activeDraggedPath) {
              text = activeDraggedPath
            }
            if (!text) return

            const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
            const paths = []
            for (const line of lines) {
              let clean = line
              if (clean.startsWith('vscode-remote://')) {
                clean = clean.replace(/^vscode-remote:\/\/[^/]+/, '')
              } else if (clean.startsWith('file://')) {
                clean = clean.replace(/^file:\/\//, '')
              }
              try {
                clean = decodeURIComponent(clean)
              } catch {}
              if (clean.startsWith('/') || /^[A-Za-z]:[\\/]/.test(clean)) {
                paths.push(clean)
              }
            }

            if (paths.length === 0) return

            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            for (const p of paths) {
              insertWorkspaceReference(ctx, activeInputManager.sessionId, p, p.endsWith('/'))
            }
            activeDraggedPath = null
          }

          window.addEventListener('dragover', onDragOver, true)
          window.addEventListener('dragleave', onDragLeave, true)
          window.addEventListener('drop', onDrop, true)

          return () => {
            window.removeEventListener('message', onMessage)
            window.removeEventListener('dragover', onDragOver, true)
            window.removeEventListener('dragleave', onDragLeave, true)
            window.removeEventListener('drop', onDrop, true)
          }
        }, 'dsh-trae-solo: file reference bridge')

        // 5. Left Sidebar SOLO Brand Mark & Name + Center Hero Mark with priority: -10
        ctx.slots.inject('sidebar.brand.mark', () =>
          ctx.slots.register({ name: 'sidebar.brand.mark', priority: -10 }, SoloBrandMark),
        )
        ctx.slots.inject('sidebar.brand.name', () =>
          ctx.slots.register({ name: 'sidebar.brand.name', priority: -10 }, SoloBrandName),
        )
        ctx.slots.inject('conversation.hero.brand.mark', () =>
          ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -10 }, HeroBrandMark),
        )

        // 6. Header shortcut buttons in session header utilities (Editor + Browser)
        ctx.slots.inject('conversation.session.header.utilities', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.utilities',
              id: 'dsh-trae-solo:open-btn',
              order: -10,
              label: () => tr(ctx, 'editorTitle'),
            },
            (props) => h(HeaderOpenSoloButton, { ...props, ctx }),
          ),
        )

        // 7. Register both `[ </> 编辑器 ]` and `[ 🧭 浏览器 ]` tabs side-by-side in the Right Sidebar
        ctx.inject(['sidebarRightTabs', 'sidebarRight'], (rctx) => {
          const tabs = rctx.get('sidebarRightTabs')
          const right = rctx.get('sidebarRight')
          if (!tabs) return

          rctx.effect(() => {
            // 7a. Editor Tab Registration
            const disposeEditorType = tabs.register({
              id: TAB_ID,
              kind: TAB_KIND,
              keepMounted: true,
              priority: 'extension',
              title: () => tr(ctx, 'editorTitle'),
              guide: [
                {
                  id: TAB_KIND,
                  order: 1,
                  title: () => tr(ctx, 'editorTitle'),
                  description: () => tr(ctx, 'editorDescription'),
                  icon: (props) => h(IconTraeCode, { size: props?.size ?? 16 }),
                },
              ],
            })

            const disposeEditorBody = rctx.slots.inject('sidebar.right.pane.tab', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeEditorTabBody,
              ),
            )

            const disposeEditorTitle = rctx.slots.inject('sidebar.right.pane.tab.title', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab.title',
                  key: TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeEditorTabTitle,
              ),
            )

            // 7b. Interactive SOLO Browser Tab Registration (side-by-side with Editor!)
            const disposeBrowserType = tabs.register({
              id: BROWSER_TAB_ID,
              kind: BROWSER_TAB_KIND,
              keepMounted: true,
              priority: 'extension',
              title: () => tr(ctx, 'browserTitle'),
              guide: [
                {
                  id: BROWSER_TAB_KIND,
                  order: 2,
                  title: () => tr(ctx, 'browserTitle'),
                  description: () => tr(ctx, 'browserDescription'),
                  icon: (props) => h(IconTraeBrowser, { size: props?.size ?? 16 }),
                },
              ],
            })

            const disposeBrowserBody = rctx.slots.inject('sidebar.right.pane.tab', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: BROWSER_TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeBrowserTabBody,
              ),
            )

            const disposeBrowserTitle = rctx.slots.inject('sidebar.right.pane.tab.title', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab.title',
                  key: BROWSER_TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeBrowserTabTitle,
              ),
            )

            // 7c. Standalone SOLO Terminal Tab Registration (`[ >_ 终端 ]`, side-by-side with Editor & Browser!)
            const disposeTerminalType = tabs.register({
              id: TERMINAL_TAB_ID,
              kind: TERMINAL_TAB_KIND,
              keepMounted: true,
              priority: 'extension',
              title: () => tr(ctx, 'terminalTitle'),
              guide: [
                {
                  id: TERMINAL_TAB_KIND,
                  order: 3,
                  title: () => tr(ctx, 'terminalTitle'),
                  description: () => tr(ctx, 'terminalDescription'),
                  icon: (props) => h(IconTraeTerminal, { size: props?.size ?? 16, color: '#10b981' }),
                },
              ],
            })

            const disposeTerminalBody = rctx.slots.inject('sidebar.right.pane.tab', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: TERMINAL_TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeTerminalTabBody,
              ),
            )

            const disposeTerminalTitle = rctx.slots.inject('sidebar.right.pane.tab.title', () =>
              rctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab.title',
                  key: TERMINAL_TAB_ID,
                  inject: (sessionId) => ({ ctx, sessionId }),
                },
                TraeTerminalTabTitle,
              ),
            )

            // Auto-open `[ </> 编辑器 ]`, `[ 🧭 浏览器 ]`, and `[ >_ 终端 ]` tabs in the rightbar on session mount
            const openedSessions = new Set()
            const tryAutoOpen = () => {
              try {
                const mountedId = right?.mounted?.getSnapshot?.()
                if (mountedId && !openedSessions.has(mountedId)) {
                  openedSessions.add(mountedId)
                  ctx.get('layout')?.openRightbar?.(true, false)
                  right?.openTab?.(BROWSER_TAB_KIND, { revealIfOpened: false })
                  right?.openTab?.(TERMINAL_TAB_KIND, { revealIfOpened: false })
                  right?.openTab?.(TAB_KIND, { revealIfOpened: true })
                }
              } catch {}
            }
            const unsubMounted =
              typeof right?.mounted?.subscribe === 'function'
                ? right.mounted.subscribe(tryAutoOpen)
                : undefined
            setTimeout(tryAutoOpen, 300)

            return () => {
              unsubMounted?.()
              disposeEditorTitle()
              disposeEditorBody()
              disposeEditorType()
              disposeBrowserTitle()
              disposeBrowserBody()
              disposeBrowserType()
              disposeTerminalTitle()
              disposeTerminalBody()
              disposeTerminalType()
            }
          }, 'dsh-trae-solo: rightbar tab registration')
        })

        // 8. Dispose persistent iframe when plugin unloads
        ctx.effect(() => () => cleanupWorkbenchHolder(), 'dsh-trae-solo: cleanup iframe')
      },
    }
  },
})
