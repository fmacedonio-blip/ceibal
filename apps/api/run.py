"""
Run the API from apps/api/:

    python run.py
    python run.py --port 8001
    python run.py --reload false
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent


def main() -> None:
    args = sys.argv[1:]

    host = "0.0.0.0"
    port = "8000"
    reload = True

    i = 0
    while i < len(args):
        if args[i] == "--port" and i + 1 < len(args):
            port = args[i + 1]
            i += 2
        elif args[i] == "--host" and i + 1 < len(args):
            host = args[i + 1]
            i += 2
        elif args[i] == "--reload" and i + 1 < len(args):
            reload = args[i + 1].lower() not in ("false", "0", "no")
            i += 2
        else:
            i += 1

    cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", host,
        "--port", port,
    ]
    if reload:
        cmd.append("--reload")

    print(f"Starting API → http://localhost:{port}")
    print(f"Swagger     → http://localhost:{port}/docs\n")

    subprocess.run(cmd, cwd=HERE)


if __name__ == "__main__":
    main()
