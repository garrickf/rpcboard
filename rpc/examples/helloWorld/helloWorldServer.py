from concurrent import futures
import logging

import grpc

import helloWorld_pb2
import helloWorld_pb2_grpc


class Greeter(helloWorld_pb2_grpc.GreeterServicer):
    # Define how server responds to methods
    def sayHello(self, request, context):
        return helloWorld_pb2.HelloResponse(message='Hello, %s!' % request.name)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    helloWorld_pb2_grpc.add_GreeterServicer_to_server(Greeter(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    logging.basicConfig()
    serve()
