from __future__ import print_function
import logging
import sys

import grpc

import pingpong_pb2
import pingpong_pb2_grpc


def run(port, num):
    options = [
        ('grpc.lb_policy_name', 'pick_first'),
        ('grpc.enable_retries', 0),
        ('grpc.keepalive_timeout_ms', 10000)
    ]

    with grpc.insecure_channel(target='localhost:%s' % (port), 
                               options=options) as channel:
        stub = pingpong_pb2_grpc.PingPongStub(channel)
        request = pingpong_pb2.NumberRequest(num=num)
        response = stub.askEvenOrOdd(request, timeout=10)

    print("Client got: %s" % (response.message))

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python number_client.py [port] [number]')
        exit()
    logging.basicConfig()
    run(sys.argv[1], int(sys.argv[2]))
