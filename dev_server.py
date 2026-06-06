import http.server
import socketserver
import socket
import os
import sys
import json
import threading
import subprocess
import time
import signal
import shutil
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PORT = 8720
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RELEASE_APK = os.path.join(BASE_DIR, "android", "app", "build", "outputs", "apk", "release", "app-release.apk")
DEBUG_APK = os.path.join(BASE_DIR, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk")

metro_process = None
metro_port = 8081
building = False
build_log = []
build_type = "none"

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()

def log(msg):
    build_log.append(f"[{time.strftime('%H:%M:%S')}] {msg}")
    if len(build_log) > 200:
        build_log[:] = build_log[-100:]

def apk_size(path):
    return os.path.getsize(path) if os.path.exists(path) else 0

class DevHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == "/":
            self.send_html(self.dashboard_html())
        elif path == "/api/status":
            self.send_json({
                "metro": metro_process is not None and metro_process.poll() is None,
                "building": building,
                "build_type": build_type,
                "release_size": apk_size(RELEASE_APK),
                "debug_size": apk_size(DEBUG_APK),
                "metro_port": metro_port,
                "ip": get_ip(),
            })
        elif path == "/api/logs":
            self.send_json({"logs": build_log[-50:]})
        elif path == "/api/download":
            kind = params.get("type", ["release"])[0]
            apk = RELEASE_APK if kind == "release" else DEBUG_APK
            if os.path.exists(apk):
                size = os.path.getsize(apk)
                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.android.package-archive")
                self.send_header("Content-Disposition", f"attachment; filename=app-{kind}.apk")
                self.send_header("Content-Length", str(size))
                self.send_header("Connection", "close")
                self.end_headers()
                with open(apk, "rb") as f:
                    shutil.copyfileobj(f, self.wfile)
            else:
                self.send_error(404, f"{kind} APK not found")
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode() if content_len else "{}"
        try:
            data = json.loads(body)
        except:
            data = {}

        if path == "/api/metro/start":
            threading.Thread(target=self._start_metro, daemon=True).start()
            self.send_json({"status": "starting"})
        elif path == "/api/metro/stop":
            self._stop_metro()
            self.send_json({"status": "stopped"})
        elif path == "/api/build/release":
            threading.Thread(target=self._run_build, args=("release",), daemon=True).start()
            self.send_json({"status": "building"})
        elif path == "/api/build/debug":
            threading.Thread(target=self._run_build, args=("debug",), daemon=True).start()
            self.send_json({"status": "building"})
        else:
            self.send_error(404)

    def _start_metro(self):
        global metro_process
        try:
            if metro_process and metro_process.poll() is None:
                log("Metro already running")
                return
            log("Starting Metro bundler...")
            env = os.environ.copy()
            env["EXPO_PUBLIC_GEMINI_API_KEY"] = ""
            env["EXPO_PUBLIC_GOOGLE_VISION_API_KEY"] = ""
            npx_path = r"H:\Node\npx.cmd"
            if not os.path.exists(npx_path):
                log(f"npx not found at {npx_path}")
                return
            metro_process = subprocess.Popen(
                [npx_path, "react-native", "start",
                 "--host", "0.0.0.0", "--port", str(metro_port)],
                cwd=BASE_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                env=env, creationflags=subprocess.CREATE_NO_WINDOW,
                text=True, bufsize=1, encoding="utf-8", errors="replace"
            )
            log(f"Metro PID: {metro_process.pid}")
            threading.Thread(target=self._pipe_metro_logs, daemon=True).start()
        except Exception as e:
            log(f"Metro start error: {e}")

    def _pipe_metro_logs(self):
        global metro_process
        if not metro_process or not metro_process.stdout:
            return
        for line in metro_process.stdout:
            line = line.rstrip()
            if line:
                log(f"[Metro] {line}")
        log("Metro stopped")

    def _stop_metro(self):
        global metro_process
        if metro_process:
            if metro_process.poll() is None:
                if os.name == "nt":
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(metro_process.pid)], capture_output=True)
                else:
                    metro_process.send_signal(signal.SIGTERM)
                log("Metro stopped")
            metro_process = None

    def _run_build(self, kind):
        global building, build_type
        if building:
            log(f"Build already in progress ({build_type})")
            return
        building = True
        build_type = kind
        log(f"Starting {kind} build...")
        try:
            result = subprocess.run(
                ["cmd", "/c", f"cd /d {BASE_DIR}\\android && .\\gradlew assemble{kind.capitalize()} --offline"],
                capture_output=True, text=True, timeout=1800,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            for line in (result.stdout or "").split("\n"):
                line = line.strip()
                if line and ("BUILD" in line or "ERROR" in line or "Task :app:" in line):
                    log(f"[Gradle] {line}")
            if result.returncode == 0:
                size = apk_size(RELEASE_APK if kind == "release" else DEBUG_APK) // (1024*1024)
                log(f"BUILD SUCCESS — {kind} APK: {size}MB")
            else:
                for line in (result.stderr or "").split("\n")[-10:]:
                    if line.strip():
                        log(f"[ERROR] {line.strip()}")
                log(f"BUILD FAILED (code {result.returncode})")
        except subprocess.TimeoutExpired:
            log("BUILD TIMEOUT (30 min)")
        except Exception as e:
            log(f"BUILD ERROR: {e}")
        building = False
        build_type = "none"

    def dashboard_html(self):
        ip = get_ip()
        return f"""<!DOCTYPE html>
<html dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Beauty App Dev Server</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#111;color:#eee;padding:16px;max-width:1200px;margin:auto}}
h1{{font-size:20px;margin-bottom:4px;color:#fff}}
.sub{{color:#888;font-size:13px;margin-bottom:20px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px}}
.card{{background:#1e1e1e;border-radius:12px;padding:16px}}
.card h3{{font-size:13px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}}
.card .val{{font-size:24px;font-weight:700;color:#fff}}
.card .val.green{{color:#4CAF50}}
.card .val.red{{color:#F44336}}
.card .val.orange{{color:#FF9800}}
.card .val.blue{{color:#2196F3}}
.btn{{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .2s;margin:4px}}
.btn:hover{{opacity:.8}}
.btn:disabled{{opacity:.4;cursor:not-allowed}}
.btn-green{{background:#4CAF50;color:#fff}}
.btn-red{{background:#F44336;color:#fff}}
.btn-blue{{background:#2196F3;color:#fff}}
.btn-gray{{background:#333;color:#eee}}
.btn-group{{margin-top:12px;display:flex;flex-wrap:wrap;gap:4px}}
.log-box{{background:#0a0a0a;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;height:300px;overflow-y:auto;white-space:pre-wrap;line-height:1.5;margin-bottom:16px;border:1px solid #222}}
.log-box .info{{color:#888}}
.log-box .metro{{color:#64B5F6}}
.log-box .success{{color:#4CAF50}}
.log-box .error{{color:#F44336}}
.actions{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}}
.qr{{background:#fff;padding:12px;border-radius:8px;display:inline-block}}
@media(max-width:600px){{.grid{{grid-template-columns:1fr 1fr}}}}
</style>
</head>
<body>
<h1>Beauty App Dev Server</h1>
<p class="sub">http://{ip}:{PORT} — AI Skin Diagnosis & AR Makeup</p>

<div class="grid" id="status-grid">
<div class="card"><h3>Metro Bundler</h3><div class="val orange" id="metro-status">checking...</div></div>
<div class="card"><h3>Release APK</h3><div class="val blue" id="release-size">-</div></div>
<div class="card"><h3>Debug APK</h3><div class="val blue" id="debug-size">-</div></div>
<div class="card"><h3>Build Status</h3><div class="val" id="build-status">idle</div></div>
</div>

<div class="actions" id="actions">
<button class="btn btn-green" id="btn-metro" onclick="toggleMetro()">Start Metro</button>
<button class="btn btn-blue" onclick="buildApp('release')">Build Release</button>
<button class="btn btn-blue" onclick="buildApp('debug')">Build Debug</button>
<button class="btn btn-gray" id="dl-release" onclick="downloadApk('release')">Download Release</button>
<button class="btn btn-gray" id="dl-debug" onclick="downloadApk('debug')">Download Debug</button>
</div>

<div class="log-box" id="log-box">Waiting for logs...</div>

<script>
function addLog(msg, cls) {{
var el=document.getElementById('log-box');
if(el.innerHTML=='Waiting for logs...')el.innerHTML='';
var d=document.createElement('div');
d.className=cls||'info';
d.textContent=msg;
el.appendChild(d);
el.scrollTop=el.scrollHeight;
}}
function $(id){{return document.getElementById(id)}}

function poll() {{
fetch('/api/status').then(r=>r.json()).then(d=>{{
$('metro-status').textContent=d.metro?'Running on :'+d.metro_port:'Stopped';
$('metro-status').className='val '+(d.metro?'green':'red');
$('release-size').textContent=(d.release_size/1e6).toFixed(1)+' MB';
$('debug-size').textContent=(d.debug_size/1e6).toFixed(1)+' MB';
$('build-status').textContent=d.building?'Building '+d.build_type+'...':'Idle';
$('build-status').className='val '+(d.building?'orange':'');
$('btn-metro').textContent=d.metro?'Stop Metro':'Start Metro';
$('btn-metro').className='btn '+(d.metro?'btn-red':'btn-green');
$('dl-release').style.display=d.release_size?'inline-flex':'none';
$('dl-debug').style.display=d.debug_size?'inline-flex':'none';
}});
fetch('/api/logs').then(r=>r.json()).then(d=>{{
var el=$('log-box');
if(d.logs.length){{
el.innerHTML='';
d.logs.forEach(function(l){{
var cls='info';
if(l.includes('BUILD SUCCESS')||l.includes('SUCCESS'))cls='success';
else if(l.includes('ERROR')||l.includes('FAILED'))cls='error';
else if(l.includes('[Metro]'))cls='metro';
var row=document.createElement('div');row.className=cls;row.textContent=l;el.appendChild(row);
}});
el.scrollTop=el.scrollHeight;
}}
}});
}}

function toggleMetro() {{
fetch('/api/status').then(r=>r.json()).then(d=>{{
var url=d.metro?'/api/metro/stop':'/api/metro/start';
fetch(url,{{method:'POST'}}).then(function(){{setTimeout(poll,2000)}});
}});
}}

function buildApp(kind) {{
addLog('Starting '+kind+' build...','info');
fetch('/api/build/'+kind,{{method:'POST'}});
setTimeout(poll,1000);
}}

function downloadApk(kind) {{
window.location.href='/api/download?type='+kind;
}}

setInterval(poll,2000);
poll();
</script>
</body></html>"""

    def send_html(self, html):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html.encode())

    def send_json(self, data):
        body = json.dumps(data)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body.encode())

    def send_error(self, code, msg=""):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(msg.encode())

    def log_message(self, fmt, *args):
        pass

if __name__ == "__main__":
    ip = get_ip()
    print("=" * 50)
    print("  Beauty App Dev Server")
    print("=" * 50)
    print(f"  Dashboard: http://{ip}:{PORT}")
    print(f"  Metro:     http://{ip}:{metro_port}")
    print()
    print("  Controls:")
    print("    · Start/Stop Metro bundler")
    print("    · Build Release APK")
    print("    · Build Debug APK (for dev)")
    print("    · Download APK")
    print("=" * 50)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), DevHandler) as httpd:
        httpd.serve_forever()
