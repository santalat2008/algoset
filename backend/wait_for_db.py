import os
import socket
import sys
import time

host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))

connected = False
for attempt in range(1, 61):
    try:
        with socket.create_connection((host, port), timeout=2):
            connected = True
            break
    except OSError:
        time.sleep(1)

if not connected:
    sys.stderr.write(f"Ma'lumotlar bazasiga ({host}:{port}) ulanib bo'lmadi (Timeout 60s).\n")
    sys.exit(1)
