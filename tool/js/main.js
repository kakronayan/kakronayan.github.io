(function () {
  const U = window.Utils;
  const SITE = 'https://kakronayan.github.io';
  const bootTime = Date.now();

  const TOOLS = [
    { id: 'base64', name: 'Base64', code: 'B64', desc: 'Encode and decode UTF-8 text with Base64.' },
    { id: 'jwt', name: 'JWT inspect', code: 'JWT', desc: 'Decode JWT header and payload without verification.' },
    { id: 'text', name: 'Text utilities', code: 'TXT', desc: 'Convert case, generate slugs, and count text.' },
    { id: 'encoding', name: 'Encoding utilities', code: 'ENC', desc: 'URL, HTML entity, and Unicode escaping.' },
    { id: 'json', name: 'JSON utilities', code: 'JSN', desc: 'Format, minify, and query JSON paths.' },
    { id: 'crypto', name: 'Crypto utilities', code: 'SHA', desc: 'Hash text and generate UUIDs locally.' },
    { id: 'time', name: 'Time utilities', code: 'UTC', desc: 'Convert Unix timestamps and format dates.' },
    { id: 'color', name: 'Color utilities', code: 'HEX', desc: 'Convert HEX/RGB/HSL and check contrast.' },
    { id: 'regex', name: 'Regex tester', code: 'REG', desc: 'Test JavaScript regular expressions.' },
  ];

  const state = {
    tool: getToolFromHash(),
    collapsed: false,
    base64: { input: 'Hello, local-first tools!', mode: 'encode' },
    jwt: { input: '' },
    text: { input: 'Hello, Local Browser Utilities!', mode: 'slug' },
    encoding: { input: '<p>Hello world & friends</p>', mode: 'htmlEscape' },
    json: { input: '{"message":"Hello","items":[{"name":"alpha"}]}', mode: 'format', path: '$.items[0].name' },
    crypto: { input: 'Hash this locally', algorithm: 'SHA-256', output: 'Click Generate hash or Generate UUID.' },
    time: { input: String(Math.floor(Date.now() / 1000)), mode: 'unix' },
    color: { primary: '#0f172a', secondary: '#ffffff' },
    regex: { pattern: '\\b\\w{5}\\b', flags: 'gi', input: 'These local tools test regex matches in your browser.' },
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getToolFromHash() {
    const hash = location.hash.replace(/^#/, '').trim();
    return TOOLS.some((t) => t.id === hash) ? hash : 'base64';
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toast-text').textContent = msg;
    el.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function copyText(value) {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => toast('Copied to clipboard'));
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderNav() {
    return TOOLS.map(
      (tool) => `
      <button class="nav-btn ${state.tool === tool.id ? 'active' : ''}" data-tool="${tool.id}" type="button">
        <span class="row">
          <span class="code">${tool.code}</span>
          <span class="name">${tool.name}</span>
        </span>
        <span class="nav-desc">${tool.desc}</span>
      </button>`
    ).join('');
  }

  function modeButtons(modes, selected, group) {
    return `<div class="mode-row">${modes
      .map(
        ([value, label]) =>
          `<button class="mode-btn ${selected === value ? 'active' : ''}" data-mode="${value}" data-group="${group}" type="button">${label}</button>`
      )
      .join('')}</div>`;
  }

  function ioGrid(inputHtml, output, copy = true) {
    return `
      <div class="grid-2">
        <div class="field-block">${inputHtml}</div>
        <div class="field-block">
          <div class="output-head">
            <label class="field-label">Output</label>
            ${copy ? `<button class="copy-btn" data-copy="${escHtml(output)}" type="button">Copy</button>` : ''}
          </div>
          <div class="out" id="toolOutput">${escHtml(output)}</div>
        </div>
      </div>`;
  }

  function computeOutput() {
    try {
      switch (state.tool) {
        case 'base64':
          return state.base64.mode === 'encode'
            ? U.bytesToBase64(U.textEncoder.encode(state.base64.input))
            : U.base64ToText(state.base64.input);
        case 'jwt': {
          if (!state.jwt.input.trim()) return 'Paste a JWT to inspect its header and payload.';
          const parts = state.jwt.input.trim().split('.');
          if (parts.length < 2) return 'JWTs should contain at least a header and payload separated by dots.';
          return `Header\n${U.base64UrlToJson(parts[0])}\n\nPayload\n${U.base64UrlToJson(parts[1])}\n\nSignature\n${parts[2] ? 'Present (not verified)' : 'Missing'}`;
        }
        case 'text': {
          const { input, mode } = state.text;
          if (mode === 'slug') return U.generateSlug(input);
          if (mode === 'count') return U.countText(input);
          return U.caseConvert(input, mode);
        }
        case 'encoding': {
          const { input, mode } = state.encoding;
          if (mode === 'urlEncode') return encodeURIComponent(input);
          if (mode === 'urlDecode') return decodeURIComponent(input);
          if (mode === 'htmlEscape') return U.escapeHtml(input);
          if (mode === 'htmlUnescape') return U.unescapeHtml(input);
          if (mode === 'unicodeEscape') return U.unicodeEscape(input);
          return U.unicodeUnescape(input);
        }
        case 'json': {
          const { input, mode, path } = state.json;
          if (mode === 'minify') return U.minifyJson(input);
          if (mode === 'path') return U.evaluateJsonPath(input, path);
          return U.prettyJson(input);
        }
        case 'crypto':
          return state.crypto.output;
        case 'time':
          return U.formatDateSummary(state.time.input, state.time.mode);
        case 'color': {
          const color = U.parseColorInput(state.color.primary);
          if (!color) return 'Enter a HEX (#0f172a), RGB (rgb(15, 23, 42)), or HSL (hsl(222, 47%, 11%)) color.';
          const hsl = U.rgbToHsl(color.r, color.g, color.b);
          return [
            `HEX: ${U.rgbToHex(color.r, color.g, color.b)}`,
            `RGB: rgb(${color.r}, ${color.g}, ${color.b})`,
            `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            '',
            U.testContrast(state.color.primary, state.color.secondary),
          ].join('\n');
        }
        case 'regex': {
          const regex = new RegExp(state.regex.pattern, state.regex.flags);
          const matcher = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
          const matches = Array.from(state.regex.input.matchAll(matcher));
          if (!matches.length) return 'No matches.';
          return matches.map((match, index) => `${index + 1}. "${match[0]}" at index ${match.index}`).join('\n');
        }
        default:
          return '';
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  function renderToolBody() {
    const output = computeOutput();
    const isError = output.startsWith('Error:') || output.startsWith('Invalid') || output.startsWith('Unable');

    switch (state.tool) {
      case 'base64':
        return `
          ${modeButtons(
            [
              ['encode', 'Encode'],
              ['decode', 'Decode'],
            ],
            state.base64.mode,
            'base64'
          )}
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.base64.input)}</textarea>`,
            output
          )}`;
      case 'jwt':
        return ioGrid(
          `<label class="field-label">Token</label><textarea id="toolInput" placeholder="Paste a JWT...">${escHtml(state.jwt.input)}</textarea>`,
          output
        );
      case 'text':
        return `
          ${modeButtons(
            [
              ['slug', 'Slug'],
              ['camel', 'camelCase'],
              ['pascal', 'PascalCase'],
              ['snake', 'snake_case'],
              ['kebab', 'kebab-case'],
              ['upper', 'UPPER'],
              ['lower', 'lower'],
              ['title', 'Title Case'],
              ['count', 'Count'],
            ],
            state.text.mode,
            'text'
          )}
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.text.input)}</textarea>`,
            output
          )}`;
      case 'encoding':
        return `
          ${modeButtons(
            [
              ['urlEncode', 'URL encode'],
              ['urlDecode', 'URL decode'],
              ['htmlEscape', 'HTML escape'],
              ['htmlUnescape', 'HTML unescape'],
              ['unicodeEscape', 'Unicode escape'],
              ['unicodeUnescape', 'Unicode unescape'],
            ],
            state.encoding.mode,
            'encoding'
          )}
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.encoding.input)}</textarea>`,
            output
          )}`;
      case 'json':
        return `
          ${modeButtons(
            [
              ['format', 'Format'],
              ['minify', 'Minify'],
              ['path', 'Path lookup'],
            ],
            state.json.mode,
            'json'
          )}
          ${
            state.json.mode === 'path'
              ? `<div class="field-block"><label class="field-label">JSON path</label><input id="jsonPath" type="text" value="${escHtml(state.json.path)}"></div>`
              : ''
          }
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.json.input)}</textarea>`,
            output
          )}`;
      case 'crypto':
        return `
          ${modeButtons(
            [
              ['SHA-1', 'SHA-1'],
              ['SHA-256', 'SHA-256'],
              ['SHA-384', 'SHA-384'],
              ['SHA-512', 'SHA-512'],
            ],
            state.crypto.algorithm,
            'crypto'
          )}
          <div class="mode-row">
            <button class="action-btn primary" id="hashBtn" type="button">Generate hash</button>
            <button class="action-btn" id="uuidBtn" type="button">Generate UUID</button>
          </div>
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.crypto.input)}</textarea>`,
            output
          )}`;
      case 'time':
        return `
          ${modeButtons(
            [
              ['unix', 'Unix timestamp'],
              ['iso', 'ISO/date text'],
            ],
            state.time.mode,
            'time'
          )}
          ${ioGrid(
            `<label class="field-label">Input</label><textarea id="toolInput">${escHtml(state.time.input)}</textarea>`,
            output
          )}`;
      case 'color':
        return `
          <div class="grid-2" style="margin-bottom:20px">
            <div><label class="field-label">Color to convert</label><input id="colorPrimary" type="text" value="${escHtml(state.color.primary)}"></div>
            <div><label class="field-label">Contrast color</label><input id="colorSecondary" type="text" value="${escHtml(state.color.secondary)}"></div>
          </div>
          <div class="field-block">
            <div class="output-head"><label class="field-label">Output</label><button class="copy-btn" data-copy="${escHtml(output)}" type="button">Copy</button></div>
            <div class="out ${isError ? 'error' : ''}" id="toolOutput">${escHtml(output)}</div>
          </div>`;
      case 'regex':
        return `
          <div class="row-2 field-block">
            <div><label class="field-label">Pattern</label><input id="regexPattern" type="text" value="${escHtml(state.regex.pattern)}"></div>
            <div><label class="field-label">Flags</label><input id="regexFlags" type="text" value="${escHtml(state.regex.flags)}"></div>
          </div>
          ${ioGrid(
            `<label class="field-label">Test string</label><textarea id="toolInput">${escHtml(state.regex.input)}</textarea>`,
            output
          )}`;
      default:
        return '';
    }
  }

  function render() {
    const tool = TOOLS.find((t) => t.id === state.tool);
    const output = computeOutput();
    const now = new Date();
    const s = Math.floor((Date.now() - bootTime) / 1000);
    const uptime = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s / 60) % 60))}:${pad(s % 60)}`;

    document.getElementById("app").innerHTML = `
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
      <aside class="sidebar ${state.collapsed ? "collapsed" : ""}" id="sidebar">
        <div class="top-actions">
          <a class="back-link" href="${SITE}/">← Workspace</a>
          <a class="back-link" href="https://github.com/kakronayan">Contributor</a>
          <button class="theme-btn" id="themeBtn" type="button">Theme</button>
        </div>
        <div class="console-bar">
          <span class="seg"><span class="blink"></span><span class="dot-live">SYSTEM NOMINAL</span></span>
          <span class="seg">${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}</span>
          <span class="seg">UPTIME ${uptime}</span>
        </div>
        <div class="sidebar-head">
          <div class="sidebar-copy">
            <p class="eyebrow">Local Utilities</p>
            <h1>Browser Tools</h1>
            <p class="desc">Fast browser tools for transforming, inspecting, and validating text without leaving the page.</p>
          </div>
          <button class="collapse-btn" id="collapseBtn" type="button">${state.collapsed ? ">" : "<"}</button>
        </div>
        <nav class="tool-nav" id="toolNav">${renderNav()}</nav>
      </aside>
      <main class="main">
        <div class="status-bar"><strong>${tool.name}</strong> runs locally after the page loads — no data leaves your browser.</div>
        <section class="tool-panel">
          <div class="tool-panel-head">
            <span class="badge">Local input</span>
            <p class="eyebrow">Browser-only tool</p>
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
          </div>
          <div class="tool-panel-body" id="toolBody">${renderToolBody()}</div>
        </section>
      </main>
      <div class="toast" id="toast"><span class="led"></span><span id="toast-text"></span></div>
    `;

    bindEvents(output);
  }

  function bindEvents(latestOutput) {
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
    document.getElementById("collapseBtn").addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      render();
    });

    document.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tool = btn.dataset.tool;
        history.pushState({ tool: state.tool }, "", `#${state.tool}`);
        render();
      });
    });

    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        const mode = btn.dataset.mode;
        if (group === "base64") state.base64.mode = mode;
        if (group === "text") state.text.mode = mode;
        if (group === "encoding") state.encoding.mode = mode;
        if (group === "json") state.json.mode = mode;
        if (group === "crypto") state.crypto.algorithm = mode;
        if (group === "time") state.time.mode = mode;
        render();
      });
    });

    const input = document.getElementById("toolInput");
    if (input) {
      input.addEventListener("input", (e) => {
        const value = e.target.value;
        if (state.tool === "base64") state.base64.input = value;
        if (state.tool === "jwt") state.jwt.input = value;
        if (state.tool === "text") state.text.input = value;
        if (state.tool === "encoding") state.encoding.input = value;
        if (state.tool === "json") state.json.input = value;
        if (state.tool === "crypto") state.crypto.input = value;
        if (state.tool === "time") state.time.input = value;
        if (state.tool === "regex") state.regex.input = value;
        updateOutput();
      });
    }

    const jsonPath = document.getElementById("jsonPath");
    if (jsonPath) {
      jsonPath.addEventListener("input", (e) => {
        state.json.path = e.target.value;
        updateOutput();
      });
    }

    const colorPrimary = document.getElementById("colorPrimary");
    const colorSecondary = document.getElementById("colorSecondary");
    if (colorPrimary) {
      colorPrimary.addEventListener("input", (e) => {
        state.color.primary = e.target.value;
        updateOutput();
      });
    }
    if (colorSecondary) {
      colorSecondary.addEventListener("input", (e) => {
        state.color.secondary = e.target.value;
        updateOutput();
      });
    }

    const regexPattern = document.getElementById("regexPattern");
    const regexFlags = document.getElementById("regexFlags");
    if (regexPattern) {
      regexPattern.addEventListener("input", (e) => {
        state.regex.pattern = e.target.value;
        updateOutput();
      });
    }
    if (regexFlags) {
      regexFlags.addEventListener("input", (e) => {
        state.regex.flags = e.target.value;
        updateOutput();
      });
    }

    const hashBtn = document.getElementById("hashBtn");
    if (hashBtn) {
      hashBtn.addEventListener("click", async () => {
        try {
          const digest = await crypto.subtle.digest(
            state.crypto.algorithm,
            U.textEncoder.encode(state.crypto.input),
          );
          state.crypto.output = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
          render();
        } catch (error) {
          state.crypto.output = `Error: ${error.message}`;
          render();
        }
      });
    }

    const uuidBtn = document.getElementById("uuidBtn");
    if (uuidBtn) {
      uuidBtn.addEventListener("click", () => {
        state.crypto.output = crypto.randomUUID();
        render();
      });
    }

    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () =>
        copyText(
          btn.dataset.copy ||
            document.getElementById("toolOutput")?.textContent ||
            "",
        ),
      );
    });

    setInterval(() => {
      const bar = document.querySelector(".status-bar");
      if (!bar) return;
      const tool = TOOLS.find((t) => t.id === state.tool);
      const s = Math.floor((Date.now() - bootTime) / 1000);
      bar.innerHTML = `<strong>${tool.name}</strong> runs locally after the page loads — no data leaves your browser.`;
      const clock = document.querySelector(".console-bar .seg:nth-child(2)");
      const uptimeEl = document.querySelector(".console-bar .seg:nth-child(3)");
      if (clock) {
        const now = new Date();
        clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      }
      if (uptimeEl) {
        uptimeEl.textContent = `UPTIME ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s / 60) % 60))}:${pad(s % 60)}`;
      }
    }, 1000);
  }

  function updateOutput() {
    const out = document.getElementById("toolOutput");
    const copyBtn = document.querySelector(".copy-btn");
    if (!out) return;
    const value = computeOutput();
    out.textContent = value;
    out.classList.toggle(
      "error",
      value.startsWith("Error:") ||
        value.startsWith("Invalid") ||
        value.startsWith("Unable"),
    );
    if (copyBtn) copyBtn.dataset.copy = value;
  }

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  window.addEventListener("popstate", () => {
    state.tool = getToolFromHash();
    render();
  });

  const savedTheme = localStorage.getItem("theme");
  document.documentElement.setAttribute("data-theme", savedTheme || "dark");

  if (!location.hash) history.replaceState({ tool: state.tool }, '', `#${state.tool}`);
  render();
})();
