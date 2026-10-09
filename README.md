# 🌐 NetPulse — Network Monitoring Dashboard

A beginner-friendly **B.Tech CSE networking project** built with Python, Flask, HTML, CSS, and JavaScript.  
NetPulse lets you check the connectivity, DNS resolution, and latency of any host — right from your browser.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-green?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📸 Screenshots

### Connectivity Check — google.com (Reachable)
> The dashboard resolves DNS, attempts a TCP connection on port 80/443,  
> and reports the status, latency, and resolved IP addresses.

### Input Validation — Invalid Hostname
> Invalid input is caught both on the client (JavaScript) and server (Python)  
> before any network call is made.

### Networking Concepts Section
> Built-in explanations of DNS, Latency, TCP, and Ports help beginners  
> understand the networking principles behind the tool.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Connectivity Check** | Tests if a host is reachable via TCP handshake (port 80 → 443 fallback) |
| **DNS Resolution** | Resolves domain names to IPv4/IPv6 addresses using `socket.getaddrinfo()` |
| **Latency Measurement** | Measures round-trip TCP handshake time in milliseconds |
| **Input Validation** | Client-side + server-side regex validation (no shell injection possible) |
| **Session History** | Stores recent checks in browser memory with color-coded status indicators |
| **Loading Indicator** | Spinner animation while the network check is in progress |
| **Error Handling** | Clear messages for DNS failures, timeouts, and unreachable hosts |
| **Educational Section** | Explains DNS, Latency, TCP, and Ports in simple language |
| **Responsive Design** | Works on desktop, tablet, and mobile screens |

---

## 🏗️ Architecture

```
┌─────────────────────────┐         ┌─────────────────────────┐
│     Browser (Client)    │  AJAX   │     Flask Server        │
│  HTML + CSS + JavaScript│────────▸│     (app.py)            │
│                         │◂────────│                         │
│  • Input form           │  JSON   │  • Input validation     │
│  • Result display       │         │  • DNS resolution       │
│  • Session history      │         │  • TCP connect test     │
│  • Concepts section     │         │  • Latency measurement  │
└─────────────────────────┘         └────────┬────────────────┘
                                             │ socket.connect()
                                             ▼
                                    ┌─────────────────────────┐
                                    │   Target Host           │
                                    │   (e.g. google.com)     │
                                    └─────────────────────────┘
```

**How it works:**

1. User enters a hostname/IP in the input field
2. JavaScript validates the input and sends an AJAX `POST` request to `/check`
3. Flask validates again (defense in depth), then performs DNS lookup via `socket.getaddrinfo()`
4. A TCP socket connection is attempted on port 80 (fallback to 443)
5. Response time is measured using `time.perf_counter()`
6. A JSON response with status, IPs, latency, and timestamp is returned to the browser
7. JavaScript renders the result card and appends the entry to session history

---

## 📁 Project Structure

```
NetPulse/
├── app.py                  # Flask backend — routes, DNS, TCP check
├── requirements.txt        # Dependencies (Flask only)
├── README.md               # This file
├── templates/
│   └── index.html          # Dashboard HTML template
└── static/
    ├── style.css           # Dark-mode glassmorphic CSS theme
    └── script.js           # Client-side AJAX, validation, history
```

**Only 5 source files. Only 1 dependency (Flask).**

---

## 🚀 Setup & Installation (Windows)

### Prerequisites
- Python 3.10 or higher — [Download](https://www.python.org/downloads/)
- pip (comes with Python)

### Steps

```powershell
# 1. Clone or download the project
cd "path\to\your\project"

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the application
python app.py

# 4. Open in browser
# Visit http://127.0.0.1:5000
```

### On Linux/macOS

```bash
pip3 install -r requirements.txt
python3 app.py
```

---

## 🔒 Security Considerations

| Concern | How NetPulse Handles It |
|---------|------------------------|
| **Shell injection** | Never calls `subprocess` or `os.system`. Uses `socket` (stdlib) only |
| **Input validation** | Dual validation — client-side JS regex + server-side Python regex |
| **Allowed input** | Only valid hostnames (RFC 1035), IPv4, and IPv6 addresses |
| **Timeouts** | 5-second timeout prevents hanging on unresponsive hosts |

---

## 📚 Networking Concepts Used

### DNS (Domain Name System)
Translates human-readable domain names into IP addresses. Like the internet's phone book.  
**Python API:** `socket.getaddrinfo(host, port)`

### TCP (Transmission Control Protocol)
A connection-oriented protocol that guarantees reliable data delivery via a 3-way handshake (SYN → SYN-ACK → ACK).  
**Python API:** `socket.connect((ip, port))`

### Latency
The round-trip time for the TCP handshake, measured in milliseconds.  
**Python API:** `time.perf_counter()` before and after `connect()`

### Ports
Numbered endpoints on a server. Port 80 = HTTP, Port 443 = HTTPS.  
NetPulse tries port 80 first, then falls back to 443 — mimicking browser behavior.

---

## 🛠️ Technologies

| Technology | Role |
|------------|------|
| **Python 3** | Backend language |
| **Flask** | Lightweight web framework for routing and templating |
| **HTML5** | Page structure and semantic markup |
| **CSS3** | Dark-mode glassmorphic responsive design |
| **JavaScript (ES6)** | AJAX requests, client-side validation, DOM manipulation |
| **socket (stdlib)** | DNS resolution and TCP connectivity testing |

---

## 📄 API Reference

### `POST /check`

**Request:**
```json
{
  "host": "google.com"
}
```

**Response (success):**
```json
{
  "host": "google.com",
  "port": 80,
  "status": "reachable",
  "ip_addresses": ["142.250.193.14", "2404:6800:4013:807::66"],
  "response_time_ms": 73.24,
  "error": null,
  "timestamp": "2026-10-09 11:26:58"
}
```

**Response (failure):**
```json
{
  "host": "nonexistent.invalid",
  "port": 80,
  "status": "unreachable",
  "ip_addresses": [],
  "response_time_ms": null,
  "error": "DNS resolution failed: ...",
  "timestamp": "2026-10-09 11:27:30"
}
```

---

## 👨‍🎓 Author

**B.Tech CSE — Networking Project**  
Built as a beginner-friendly demonstration of DNS, TCP, and HTTP concepts.

---

## 📝 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).
