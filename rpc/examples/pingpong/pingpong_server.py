from concurrent import futures
import logging
import sys

import grpc

import pingpong_pb2
import pingpong_pb2_grpc


class PingPongServicer(pingpong_pb2_grpc.PingPongServicer):
    def __init__(self, pairPort):
        super(PingPongServicer).__init__()
        self.pairPort = pairPort


    def askEvenOrOdd(self, request, context):
        if request.num == -1:
            return pingpong_pb2.EvenOddResponse(message='Your number is odd!')
        elif request.num == -2:
            return pingpong_pb2.EvenOddResponse(message='Your number is even!')
        
        return self.pingPong(request.num - 2)
        


    def pingPong(self, num):
        """ Send request to pair server
        """
        options = [
            ('grpc.lb_policy_name', 'pick_first'),
            ('grpc.enable_retries', 0),
            ('grpc.keepalive_timeout_ms', 10000)
        ]

        with grpc.insecure_channel(target='localhost:%s' % (self.pairPort), 
                                   options=options) as channel:
            stub = pingpong_pb2_grpc.PingPongStub(channel)
            request = pingpong_pb2.NumberRequest(num=num)
            response = stub.askEvenOrOdd(request, timeout=10)

        return response


def serve(port, pairPort):
    # Create a server
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Instantiate our subclass and hand it over to our server
    servicer = PingPongServicer(pairPort)
    pingpong_pb2_grpc.add_PingPongServicer_to_server(servicer, server)

    # Add a port
    server.add_insecure_port('[::]:%s' % (port))

    # Start the server
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python pingpong_server.py [port] [send-to-pair-port]')
        exit()
    logging.basicConfig()
    serve(sys.argv[1], sys.argv[2])
