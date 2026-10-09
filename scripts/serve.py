"""Serve the repository for previews and browser tests.

``python -m http.server`` asks the operating system for MIME types; Windows
registries commonly map ``.mjs`` to ``text/plain``, which browsers refuse for
module scripts. This standard-library server fixes the JavaScript types, asks
browsers to revalidate edited files and accepts a deeper connection queue.
"""

import argparse
import functools
import http.server
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
    }

    def end_headers(self):
        # Revalidate every request so edited modules are never served stale.
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    # Parallel browser projects open many connections at once; the default
    # listen backlog of 5 refuses some of them on Windows.
    request_queue_size = 128


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args(argv)
    handler = functools.partial(Handler, directory=str(ROOT))
    with Server((args.bind, args.port), handler) as server:
        print(f'Serving {ROOT} at http://{args.bind}:{args.port}/', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()
