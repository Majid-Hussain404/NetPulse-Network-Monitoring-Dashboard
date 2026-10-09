"""
NetPulse — Network Monitoring Dashboard
========================================
A beginner-friendly Flask application that checks network connectivity,
resolves DNS, and measures response time for any hostname or IP address.

Architecture
------------
┌──────────┐  AJAX POST   ┌───────────┐  socket/dns  ┌──────────┐
│ Browser  │ ──────────▸  │  Flask    │ ───────────▸ │ Target   │
│ (JS+CSS) │ ◂────────── │  Server   │ ◂─────────── │  Host    │
└──────────┘  JSON reply  └───────────┘              └──────────┘

Key Networking Concepts Used
-----------------------------
1. DNS Resolution  — converting a human-readable name (e.g. google.com)
                     into an IP address using socket.getaddrinfo().
2. TCP Connectivity — opening a TCP socket to port 80 (HTTP) or 443
                      (HTTPS) to test if the host is reachable.
3. Latency          — the round-trip time (in milliseconds) it takes for
                      the TCP handshake to complete.
"""

import os
import re
import socket
import time
from flask import Flask, render_template, request, jsonify

# ─── App Setup ───────────────────────────────────────────────────────
app = Flask(__name__)

# ─── Input Validation ────────────────────────────────────────────────
# Only allow hostnames, domain names, and IPv4/IPv6 addresses.
# This prevents any shell-injection risk since we never call subprocess.
HOSTNAME_RE = re.compile(
    r'^('
    r'([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*'  # subdomain
    r'[a-zA-Z]{2,63}'                                        # TLD
    r'|'
    r'\d{1,3}(\.\d{1,3}){3}'                                 # IPv4
    r'|'
    r'[0-9a-fA-F:]{2,39}'                                    # IPv6 (simple)
    r')$'
)

MAX_INPUT_LEN = 253  # RFC 1035 max domain length


def validate_host(host: str) -> str | None:
    """Return an error message if *host* is invalid, else None."""
    host = host.strip()
    if not host:
        return "Hostname cannot be empty."
    if len(host) > MAX_INPUT_LEN:
        return f"Hostname too long (max {MAX_INPUT_LEN} characters)."
    if not HOSTNAME_RE.match(host):
        return ("Invalid input. Enter a valid domain name (e.g. google.com) "
                "or IP address (e.g. 8.8.8.8).")
    return None


# ─── Core Network Check ─────────────────────────────────────────────

def check_host(host: str, port: int = 80, timeout: float = 5.0) -> dict:
    """
    Perform DNS resolution + TCP connectivity check.

    Returns a dict with:
      - host, port, status, ip_addresses, response_time_ms, error
    """
    result = {
        "host": host,
        "port": port,
        "status": "unreachable",
        "ip_addresses": [],
        "response_time_ms": None,
        "error": None,
    }

    # Step 1 — DNS Resolution
    try:
        addr_info = socket.getaddrinfo(host, port, socket.AF_UNSPEC,
                                       socket.SOCK_STREAM)
        # Deduplicate IPs
        ips = list(dict.fromkeys(ai[4][0] for ai in addr_info))
        result["ip_addresses"] = ips
    except socket.gaierror as e:
        result["error"] = f"DNS resolution failed: {e}"
        return result

    # Step 2 — TCP Connect (measure latency)
    for ip in ips:
        family = socket.AF_INET6 if ":" in ip else socket.AF_INET
        try:
            sock = socket.socket(family, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            start = time.perf_counter()
            sock.connect((ip, port))
            elapsed = (time.perf_counter() - start) * 1000  # ms
            sock.close()

            result["status"] = "reachable"
            result["response_time_ms"] = round(elapsed, 2)
            return result
        except (socket.timeout, TimeoutError):
            result["error"] = f"Connection timed out after {timeout}s."
        except OSError as e:
            result["error"] = f"Connection failed: {e}"

    return result


# ─── Routes ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the dashboard page."""
    return render_template("index.html")


@app.route("/check", methods=["POST"])
def check():
    """
    API endpoint — accepts JSON { "host": "..." }
    and returns the connectivity result.
    """
    data = request.get_json(silent=True) or {}
    host = (data.get("host") or "").strip()

    # Validate
    err = validate_host(host)
    if err:
        return jsonify({"error": err}), 400

    # Perform the real check (port 80 first, fallback to 443)
    result = check_host(host, port=80)
    if result["status"] != "reachable":
        result_443 = check_host(host, port=443)
        if result_443["status"] == "reachable":
            result = result_443
        else:
            # Keep DNS IPs from first attempt if available
            if not result["ip_addresses"] and result_443["ip_addresses"]:
                result["ip_addresses"] = result_443["ip_addresses"]

    result["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    return jsonify(result)


# ─── Entry Point ─────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n*  NetPulse is running at http://127.0.0.1:{port}\n")
    app.run(debug=False, host="0.0.0.0", port=port)
