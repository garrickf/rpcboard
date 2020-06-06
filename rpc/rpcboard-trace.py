#!/usr/bin/env python3

# See: https://stackabuse.com/executing-shell-commands-with-python/
# Change permissions on file: chmod +x rpcboard-trace.py 
# See: http://effbot.org/pyfaq/how-do-i-make-a-python-script-executable-on-unix.htm

""" rpcboard-trace.py

Script that sets up a node (server) or client call to be traced.

References:
https://docs.python.org/3/library/argparse.html
"""

import sys
import argparse
import os
import socket

parser = argparse.ArgumentParser(
    description='Set up a node (server) or client call to be traced.'
)

parser.add_argument('-p', '--port',  type=int, default=7007, 
                    help='the port number to send log data to')
# NOTE: '+' means, ensure at least one argument present, gather into list
parser.add_argument('command', nargs='+', help='the command to run')

args = parser.parse_args()
print(args)
command = args.command
port = args.port

# TODO: check port
client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket = socket.socket()

# TODO: try connecting with host
try: 
    client_socket.connect(('127.0.0.1', port))
except ConnectionRefusedError:
    print('Error connecting to localhost on port %s' % (port))
    exit()

class StreamToSocket(object):
    def __init__(self, sock):
        self.sock = sock

    def write(self, buf):
        for line in buf.rstrip().splitlines():
            self.sock.send(line.encode('ascii'))
            

environ = os.environ
# print(os.environ)
# Set gRPC flags
environ['GRPC_VERBOSITY'] = 'DEBUG'
environ['GRPC_TRACE'] = 'http'

pid = os.fork()
if pid == 0:
    print('i am child')
    # f = client_socket.makefile('w')
    client_socket.send(b'Hellow\n')
    # for i in range(100):
    #     client_socket.send(b'')
    # sys.stderr = StreamToSocket(client_socket)
    # sys.stderr = StreamToSocket(client_socket)
    # sys.stdout = StreamToSocket(client_socket)
    # print('Hello world')
    # Note: above doesn't work when execvp takes over
    print(client_socket.fileno())

    os.dup2(client_socket.fileno(), 2)
    os.execvpe(command[0], command, environ)
    os.exit(0)

print('i am parent')
os.waitpid(pid, 0)
exit()
