"""
Orlog Web Game Backend Server
Serves static web app files and provides WebSocket multiplayer room management.
"""

import os
import json
import random
import string
import asyncio
from http.server import SimpleHTTPRequestHandler, HTTPServer
import socketserver
import urllib.parse

# In-memory storage for rooms
ROOMS = {}

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase, k=4))

class OrlogHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Serve static files
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

def run_server(port=8000):
    print(f"==================================================")
    print(f"Serveur Orlog demarre sur : http://localhost:{port}")
    print(f"Etape 1 (VS IA Bot) et Etape 2 (Multijoueur) Prets !")
    print(f"==================================================")

    handler = OrlogHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()
