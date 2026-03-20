// ── Bridge Protocol: postMessage/CustomEvent for bidirectional communication ──

/** Generate inline JS for MCP bridge communication */
export function generateBridgeJS(): string {
  return `
// ── MCP Bridge Protocol ──
(function() {
  'use strict';
  var MCP_BRIDGE = {
    /** Dispatch a tool call event to the parent frame */
    callTool: function(toolName, args) {
      var payload = { type: 'MCP_TOOL_CALL', toolName: toolName, arguments: args, timestamp: Date.now() };
      // postMessage to parent (for iframe embedding)
      if (window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
      // Also fire a CustomEvent for local listeners
      window.dispatchEvent(new CustomEvent('mcp:tool-call', { detail: payload }));
      __mcpLog('→ Tool call: ' + toolName, 'outbound');
      return payload;
    },

    /** Register a result handler */
    onResult: function(callback) {
      window.addEventListener('message', function(evt) {
        if (evt.data && evt.data.type === 'MCP_RESULT') {
          callback(evt.data);
          __mcpLog('← Result received', 'inbound');
        }
      });
      window.addEventListener('mcp:result', function(evt) {
        callback(evt.detail);
        __mcpLog('← Result received (local)', 'inbound');
      });
    },

    /** Notify parent of iframe height for auto-resize */
    notifyHeight: function() {
      if (window.parent !== window) {
        var height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'MCP_RESIZE', height: height }, '*');
      }
    }
  };

  // Expose globally
  window.__mcpBridge = MCP_BRIDGE;

  // Auto-resize notification
  var resizeObserver = new ResizeObserver(function() { MCP_BRIDGE.notifyHeight(); });
  resizeObserver.observe(document.body);

  // ── Form serialization helper ──
  window.__mcpSubmit = function(event) {
    event.preventDefault();
    var form = event.target;
    var data = {};
    var formData = new FormData(form);
    formData.forEach(function(value, key) {
      // Handle radio groups and checkboxes
      var el = form.elements[key];
      if (el && el.type === 'checkbox') {
        data[key] = el.checked;
      } else if (el && el.type === 'number') {
        data[key] = value === '' ? null : Number(value);
      } else {
        // Try parsing as JSON for array/object fields
        try {
          var parsed = JSON.parse(value);
          if (typeof parsed === 'object') {
            data[key] = parsed;
            return;
          }
        } catch(e) { /* not JSON, use as string */ }
        data[key] = value;
      }
    });

    var toolName = form.dataset.toolName || document.title || 'unknown';
    MCP_BRIDGE.callTool(toolName, data);
    return false;
  };

  // ── Console logging helper (used by playground) ──
  var logContainer = null;
  window.__mcpLog = function(msg, type) {
    if (!logContainer) logContainer = document.getElementById('mcp-console');
    if (!logContainer) return;
    var entry = document.createElement('div');
    entry.className = 'console-entry console-' + (type || 'info');
    var ts = new Date().toLocaleTimeString();
    entry.textContent = '[' + ts + '] ' + msg;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  };
})();
`;
}
