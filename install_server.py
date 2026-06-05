import http.server
import socketserver
import socket
import os
import threading
import time

PORT = 8720
APK_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "android", "app", "build", "outputs", "apk", "release")
APK_FILE = "app-release.apk"
clients = {}
lock = threading.Lock()

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()

def show_clients():
    while True:
        time.sleep(2)
        with lock:
            if not clients:
                continue
            os.system("cls" if os.name == "nt" else "clear")
            print(f"Beauty App Install Server - http://{get_ip()}:{PORT}\n")
            print(f"{'IP':<20} {'Progress':<12} {'Speed':<12} {'Status':<12}")
            print("-"*56)
            for ip, info in sorted(clients.items()):
                pct = f"{info['pct']:.0f}%" if info['total'] > 0 else "0%"
                speed = f"{info['speed']/1024:.1f} KB/s" if info['speed'] > 0 else "waiting"
                print(f"{ip:<20} {pct:<12} {speed:<12} {info['status']:<12}")

class InstallHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            apk_path = os.path.join(APK_DIR, APK_FILE)
            apk_size = os.path.getsize(apk_path)
            host_ip = get_ip()
            html = f"""<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Beauty App - Install</title>
<style>
  *{{margin:0;padding:0;box-sizing:border-box}}
  body{{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh}}
  .card{{background:#fff;border-radius:16px;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:400px;width:90%}}
  h1{{font-size:24px;margin-bottom:8px}}
  p{{color:#666;margin-bottom:24px;font-size:14px}}
  .size{{font-weight:600;color:#333}}
  .btn{{display:inline-block;background:#0a7cff;color:#fff;text-decoration:none;padding:14px 48px;border-radius:12px;font-size:18px;font-weight:600;margin-bottom:16px;transition:background .2s}}
  .btn:hover{{background:#0066dd}}
  .ip{{background:#f0f0f0;padding:8px 16px;border-radius:8px;font-size:13px;color:#555;word-break:break-all}}
  .bar{{width:100%;height:6px;background:#eee;border-radius:3px;margin:16px 0;overflow:hidden}}
  .bar-fill{{height:100%;width:0%;background:#0a7cff;border-radius:3px;transition:width .5s}}
</style></head>
<body>
<div class="card">
<h1>Beauty App</h1>
<p>AI Skin Diagnosis & AR Makeup</p>
<p class="size">{apk_size / 1024 / 1024:.1f} MB</p>
<div class="bar"><div class="bar-fill" id="progress"></div></div>
<a class="btn" href="/apk" download="BeautyApp.apk">Download APK</a>
<p class="ip">Server: http://{host_ip}:{PORT}</p>
</div>
<script>
var el=document.getElementById('progress');
setInterval(function(){{
  var x=new XMLHttpRequest();
  x.open('GET','/progress',true);
  x.onload=function(){{
    var v=parseFloat(x.responseText);
    if(v)el.style.width=v+'%';
  }};
  x.send();
}},1000)
</script>
</body></html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html.encode())
        elif self.path == "/apk":
            apk_path = os.path.join(APK_DIR, APK_FILE)
            apk_size = os.path.getsize(apk_path)
            client_ip = self.client_address[0]
            with lock:
                clients[client_ip] = {"pct": 0, "speed": 0, "total": apk_size, "status": "downloading", "start": time.time(), "last_bytes": 0, "last_time": time.time()}
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.android.package-archive")
            self.send_header("Content-Disposition", "attachment; filename=BeautyApp.apk")
            self.send_header("Content-Length", str(apk_size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            sent = 0
            last_update = time.time()
            with open(apk_path, "rb") as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                        sent += len(chunk)
                        now = time.time()
                        if now - last_update >= 1:
                            with lock:
                                c = clients.get(client_ip)
                                if c:
                                    dt = now - c["last_time"]
                                    if dt > 0:
                                        c["speed"] = (sent - c["last_bytes"]) / dt
                                    c["last_bytes"] = sent
                                    c["last_time"] = now
                                    c["pct"] = (sent / apk_size) * 100
                            last_update = now
                    except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                        break
            with lock:
                c = clients.get(client_ip)
                if c:
                    c["pct"] = 100
                    c["status"] = "done"
                    c["speed"] = 0
        elif self.path == "/progress":
            with lock:
                total_pct = sum(c["pct"] for c in clients.values()) / max(len(clients), 1)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(str(total_pct))))
            self.end_headers()
            self.wfile.write(str(total_pct).encode())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    ip = get_ip()
    print(f"Server started on http://{ip}:{PORT}")
    print("Open on your phone (same WiFi)")
    t = threading.Thread(target=show_clients, daemon=True)
    t.start()
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), InstallHandler) as httpd:
        httpd.serve_forever()
