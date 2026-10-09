/* ════════════════════════════════════════════════════════════════════
   NetPulse — Client-Side Logic
   ════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── DOM Refs ─────────────────────────────────────────────────────
  const form        = document.getElementById("check-form");
  const hostInput   = document.getElementById("host-input");
  const checkBtn    = document.getElementById("check-btn");
  const btnText     = checkBtn.querySelector(".btn__text");
  const btnLoader   = document.getElementById("btn-loader");
  const inputError  = document.getElementById("input-error");

  const resultCard  = document.getElementById("result-card");
  const resultIcon  = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultGrid  = document.getElementById("result-grid");

  const historyCard = document.getElementById("history-card");
  const historyList = document.getElementById("history-list");
  const clearBtn    = document.getElementById("clear-history-btn");

  // ── Session History ──────────────────────────────────────────────
  let history = [];

  // ── Helpers ──────────────────────────────────────────────────────
  const HOSTNAME_RE = /^(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,63}|\d{1,3}(\.\d{1,3}){3}|[0-9a-fA-F:]{2,39})$/;

  function validateInput(value) {
    value = value.trim();
    if (!value) return "Please enter a hostname or IP address.";
    if (value.length > 253) return "Input is too long (max 253 characters).";
    if (!HOSTNAME_RE.test(value))
      return "Invalid format. Use a domain (google.com) or IP (8.8.8.8).";
    return null;
  }

  function showError(msg) {
    inputError.textContent = msg;
    inputError.hidden = false;
    hostInput.classList.add("input--error");
  }

  function clearError() {
    inputError.hidden = true;
    hostInput.classList.remove("input--error");
  }

  function setLoading(on) {
    checkBtn.disabled = on;
    btnText.textContent = on ? "Checking…" : "Check Network";
    btnLoader.hidden = !on;
  }

  // ── Render Result ────────────────────────────────────────────────
  function renderResult(data) {
    const isUp = data.status === "reachable";

    resultIcon.textContent = isUp ? "✅" : "❌";
    resultTitle.textContent = isUp
      ? `${data.host} is Reachable`
      : `${data.host} is Unreachable`;

    const items = [
      { label: "Status",       value: isUp ? "Reachable" : "Unreachable", cls: isUp ? "status--reachable" : "status--unreachable" },
      { label: "Host",         value: data.host },
      { label: "Port",         value: data.port || "—" },
      { label: "Response Time",value: data.response_time_ms !== null ? `${data.response_time_ms} ms` : "—" },
      { label: "IP Addresses", value: data.ip_addresses && data.ip_addresses.length ? data.ip_addresses.join(", ") : "—" },
      { label: "Checked At",   value: data.timestamp || "—" },
    ];

    if (data.error) {
      items.push({ label: "Error", value: data.error, cls: "status--unreachable" });
    }

    resultGrid.innerHTML = items.map(item => `
      <div class="result-item">
        <div class="result-item__label">${item.label}</div>
        <div class="result-item__value ${item.cls || ''}">${item.value}</div>
      </div>
    `).join("");

    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ── Render History ───────────────────────────────────────────────
  function renderHistory() {
    if (history.length === 0) {
      historyCard.hidden = true;
      return;
    }

    historyCard.hidden = false;

    historyList.innerHTML = history.map((h, i) => {
      const isUp = h.status === "reachable";
      const dotClass = isUp ? "history-row__dot--ok" : "history-row__dot--fail";
      const meta = isUp && h.response_time_ms !== null
        ? `${h.response_time_ms} ms`
        : (isUp ? "OK" : "Failed");

      return `
        <div class="history-row" data-index="${i}" tabindex="0">
          <span class="history-row__dot ${dotClass}"></span>
          <span class="history-row__host">${h.host}</span>
          <span class="history-row__meta">${meta} · ${h.timestamp || ""}</span>
        </div>
      `;
    }).join("");
  }

  // ── Event: Submit ────────────────────────────────────────────────
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError();

    const host = hostInput.value.trim();
    const err = validateInput(host);
    if (err) {
      showError(err);
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch("/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        showError(data.error || "Server error.");
        return;
      }

      renderResult(data);

      // Prepend to history (max 20)
      history.unshift(data);
      if (history.length > 20) history.pop();
      renderHistory();
    } catch (networkErr) {
      showError("Could not reach the NetPulse server. Is it running?");
    } finally {
      setLoading(false);
    }
  });

  // ── Event: Clear History ─────────────────────────────────────────
  clearBtn.addEventListener("click", function () {
    history = [];
    renderHistory();
    resultCard.hidden = true;
  });

  // ── Event: Click History Row ─────────────────────────────────────
  historyList.addEventListener("click", function (e) {
    const row = e.target.closest(".history-row");
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (history[idx]) {
      hostInput.value = history[idx].host;
      renderResult(history[idx]);
    }
  });

  // ── Event: Clear error on typing ─────────────────────────────────
  hostInput.addEventListener("input", clearError);
})();
