#!/usr/bin/env python3

""" rpcboard.py

Script that sets up the central log server, which accepts connections for 
receiving streams of trace information and serves the frontend visualization.
"""

import argparse

parser = argparse.ArgumentParser(
    description='Set up a central log server to receive trace information.'
)

parser.add_argument('-p', '--port',  type=int, default=7007, 
                    help='the port number to receive log data on')
parser.add_argument('-s', '--serve',  type=int, default=6006, 
                    help='the port number to serve the front end from')
# NOTE: '+' means, ensure at least one argument present, gather into list

args = parser.parse_args()
print(args)

# TODO: call node server with these args
# TODO: should this script run npm install? or just fail if forntend isn't working
# TODO: perhaps an rpcboard-install script could be handy...
