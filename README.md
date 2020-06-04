# rpcboard

Visualization tool that collects and reconstructs distributed traces in real time, from client/server logs.

# Usage

Ideally, to start a rpcboard instance on `localhost:8080`:

```shell
rpcboard -p 8080
```

This boots up a log server that will accept streaming connections from nodes you
want to monitor. Assuming you have a distributed application you want to profile
(see `/examples` for examples), you can wrap the command inside:

```shell
rpcboard-trace -p 8080 [command] [...args]
```

This convenience wrapper connects to the log server on port `8080`, sets necessary trace flags, then forks a child process that runs your command, with any supplied args/flags, and pipelines `stdout` and `stderr` to the parent for transmission.

Once it's set up, you can go to `localhost:8080` to watch your distributed system go!
