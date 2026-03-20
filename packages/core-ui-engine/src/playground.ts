// ── Debug Playground: floating debug panel ──
import { escapeHtml } from './html-builder.js';

export function generatePlaygroundHTML(): string {
  return `
<!-- Debug Playground -->
<button id="pg-toggle" class="pg-toggle" onclick="__mcpTogglePg()">&lt;/&gt; Debug Playground</button>
<div id="pg-panel" class="pg-panel hidden">
  <div class="pg-header">
    <h3>Debug Playground</h3>
    <button class="pg-close" onclick="__mcpTogglePg()">×</button>
  </div>
  <div class="pg-body">
    <!-- Config Section -->
    <details class="pg-section" open>
      <summary>Configuration</summary>
      <div class="pg-config">
        <label class="pg-label">API Base URL
          <input type="text" id="pg-api-url" class="input" value="" placeholder="https://api.openai.com/v1">
        </label>
        <label class="pg-label">API Key
          <input type="password" id="pg-api-key" class="input" value="" placeholder="sk-...">
        </label>
        <label class="pg-label">Model
          <input type="text" id="pg-model" class="input" value="" placeholder="gpt-4">
        </label>
        <label class="pg-label">System Prompt
          <textarea id="pg-system" class="input textarea" rows="3" placeholder="You are a helpful assistant..."></textarea>
        </label>
        <button class="btn btn-primary btn-sm" onclick="__mcpSaveConfig()">Save to LocalStorage</button>
      </div>
    </details>

    <!-- Console Section -->
    <details class="pg-section" open>
      <summary>Console</summary>
      <div id="mcp-console" class="pg-console"></div>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('mcp-console').innerHTML=''">Clear</button>
    </details>

    <!-- Raw JSON Section -->
    <details class="pg-section">
      <summary>Raw JSON Injection</summary>
      <textarea id="pg-json" class="input textarea pg-json" rows="8" placeholder="Paste JSON data here..."></textarea>
      <button class="btn btn-primary btn-sm" onclick="__mcpInjectJson()">Inject &amp; Re-render</button>
    </details>
  </div>
</div>`;
}

export function getPlaygroundCSS(): string {
  return `
.pg-toggle {
  position: fixed; bottom: 16px; right: 16px; z-index: 9998;
  padding: 8px 16px; border-radius: var(--radius-full);
  background: var(--accent); color: var(--accent-text);
  border: none; font-weight: 600; font-size: var(--text-sm);
  cursor: pointer; box-shadow: var(--shadow-lg);
  font-family: var(--font-mono);
  transition: all var(--duration-fast) var(--ease-out);
}
.pg-toggle:hover { transform: scale(1.05); }

.pg-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(480px, 100vw); z-index: 9999;
  background: var(--bg-primary); border-left: 1px solid var(--border);
  box-shadow: var(--shadow-lg); display: flex; flex-direction: column;
  transition: transform var(--duration-slow) var(--ease-out);
}
.pg-panel.hidden { transform: translateX(100%); pointer-events: none; }

.pg-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--sp-4) var(--sp-5); border-bottom: 1px solid var(--border);
}
.pg-header h3 { font-size: var(--text-lg); font-weight: 700; }
.pg-close {
  background: none; border: none; font-size: 24px; cursor: pointer;
  color: var(--text-secondary); padding: 0 4px;
}

.pg-body { flex: 1; overflow-y: auto; padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); }

.pg-section { border: 1px solid var(--border); border-radius: var(--radius-sm); }
.pg-section summary {
  padding: var(--sp-2) var(--sp-3); font-weight: 600; font-size: var(--text-sm);
  cursor: pointer; user-select: none;
}
.pg-section > *:not(summary) { padding: var(--sp-3); }

.pg-config { display: flex; flex-direction: column; gap: var(--sp-3); }
.pg-label { display: flex; flex-direction: column; gap: var(--sp-1); font-size: var(--text-sm); font-weight: 500; }

.pg-console {
  background: var(--bg-tertiary); border-radius: var(--radius-sm);
  font-family: var(--font-mono); font-size: var(--text-xs);
  min-height: 120px; max-height: 300px; overflow-y: auto; padding: var(--sp-2);
}
.console-entry { padding: 2px 0; border-bottom: 1px solid var(--border); }
.console-outbound { color: var(--accent); }
.console-inbound { color: var(--success); }
.console-error { color: var(--danger); }
.console-info { color: var(--text-secondary); }

.pg-json { font-family: var(--font-mono); font-size: var(--text-xs); }
`;
}

export function getPlaygroundJS(): string {
  return `
// ── Playground Logic ──
(function() {
  // Load saved config from localStorage
  var fields = ['pg-api-url', 'pg-api-key', 'pg-model', 'pg-system'];
  fields.forEach(function(id) {
    var el = document.getElementById(id);
    var saved = localStorage.getItem('mcp_' + id);
    if (el && saved) el.value = saved;
  });

  window.__mcpTogglePg = function() {
    var panel = document.getElementById('pg-panel');
    if (panel) panel.classList.toggle('hidden');
  };

  window.__mcpSaveConfig = function() {
    fields.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) localStorage.setItem('mcp_' + id, el.value);
    });
    __mcpLog('Config saved to localStorage', 'info');
  };

  window.__mcpInjectJson = function() {
    var textarea = document.getElementById('pg-json');
    if (!textarea) return;
    try {
      var data = JSON.parse(textarea.value);
      __mcpLog('JSON parsed, dispatching re-render...', 'info');
      window.dispatchEvent(new CustomEvent('mcp:inject', { detail: data }));
    } catch(e) {
      __mcpLog('JSON parse error: ' + e.message, 'error');
    }
  };

  // Intercept form submissions for LLM relay
  window.addEventListener('mcp:tool-call', function(evt) {
    var apiUrl = (document.getElementById('pg-api-url') || {}).value;
    var apiKey = (document.getElementById('pg-api-key') || {}).value;
    var model = (document.getElementById('pg-model') || {}).value;
    var system = (document.getElementById('pg-system') || {}).value;

    if (!apiUrl || !apiKey) {
      __mcpLog('No API config set — tool call logged but not forwarded', 'info');
      return;
    }

    var detail = evt.detail;
    __mcpLog('Forwarding to LLM: ' + model, 'outbound');

    var body = {
      model: model || 'gpt-4',
      messages: [
        { role: 'system', content: system || 'You are a helpful assistant.' },
        { role: 'user', content: JSON.stringify(detail.arguments) }
      ]
    };

    fetch(apiUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      __mcpLog('LLM response received', 'inbound');
      __mcpLog(JSON.stringify(data.choices?.[0]?.message?.content || data).substring(0, 200), 'info');
      window.dispatchEvent(new CustomEvent('mcp:result', { detail: { type: 'MCP_RESULT', data: data } }));
    })
    .catch(function(err) {
      __mcpLog('LLM error: ' + err.message, 'error');
    });
  });
})();
`;
}
