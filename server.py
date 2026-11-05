import http.server
import socketserver
import os
import sys
import mimetypes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

# Ensure proper MIME types
mimetypes.init()
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/x-icon", ".ico")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")

class SPAServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def send_head(self):
        # Resolve target file path
        path = self.translate_path(self.path)
        
        # If the file exists or is a directory with index.html, serve it normally
        if not os.path.exists(path) or (os.path.isdir(path) and not os.path.exists(os.path.join(path, "index.html"))):
            # For Single Page Application (SPA) client-side routes, serve index.html
            self.path = "/index.html"
            
        return super().send_head()

    def end_headers(self):
        # Prevent aggressive caching for sw.js, manifest, and favicon
        if any(self.path.startswith(p) for p in ["/sw.js", "/manifest.webmanifest", "/manifest.json", "/favicon.svg", "/favicon.ico"]):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):
        # Clean logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {args[0]} -> {args[1]}\n")
        sys.stdout.flush()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    if not os.path.exists(DIRECTORY):
        print(f"Directory '{DIRECTORY}' does not exist. Please run 'npm run build' first.")
        sys.exit(1)

    print("=" * 60)
    print("  Codecraft Client Manager - Python SPA Server")
    print("=" * 60)
    print(f"  Local URL:    http://localhost:{PORT}")
    print(f"  Serving from: {DIRECTORY}")
    print("  SPA Routing:  Enabled (all subroutes fallback to index.html)")
    print("=" * 60)
    print("Press Ctrl+C to stop the server.\n")

    with ThreadedTCPServer(("", PORT), SPAServerHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.shutdown()
