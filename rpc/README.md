# rpc

RPC related code.

## Folder structure

- `examples` contains RPC applications that can be profiled with rpcboard.
- `staticLogs` contains files of RPC app runs that can be used to test/develop with the `Parser` utility in `/backend`.

## Setting up development environment (Python)

We use `conda` as our main package manager. Create environment from the `.yml` file in this directory by typing:

```shell
conda env create -f environment.yml
```

Then, you can run:

```shell
conda activate cs244b
```

To work with `grpcio` and `grpcio-tools`, and run:

```shell
conda deactivate
```

To go back to your base environment.

In case you need to update the environment, you can export any new dependencies you've installed via `conda` or `pip` using:

```shell
conda env export > environment.yml
```

## Using `protoc` (Python)

`protoc` is the protocol buffer compiler included in `grpcio-tools`.

Assuming you're in the same directory as your `.proto` file, running the compiler to regenerate code looks like:

```shell
python3 -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. ./helloWorld.proto
```

> The `-I` flag specifies an includes directory.

This regenerates `helloWorld_pb2.py` which contains our generated request and response classes and `helloWorld_pb2_grpc.py` which contains our generated client and server classes.
