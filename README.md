# rpcboard

rpcboard is a visualization tool that collects and reconstructs distributed traces in real
time, from client/server logs.

> This project was developed for CS244B: Distributed Systems, Spring 2020.

## Usage

### Adding symlinks to PATH

Symbolic links for the `rpcboard` and `rpcboard-trace` commands are provided in the root directory of the project. You can add them to your path per Terminal session (allowing easy execution of the commands below) by running `export PATH=$PATH:$(pwd)` (`set PATH $PATH (pwd)` on `fish`). Two scripts are provided in the repo under the name `add_scripts`, for that purpose:

```shell
source add_scripts.fish
```

If you want a more permanent solution, you can modify your shell's configuration file accordingly.

### Starting a distributed trace collection

First, start a rpcboard instance on `localhost:8080`:

```shell
rpcboard -p 8080 -s 6006
```

This boots up a log server that will accept streaming connections from nodes you want to monitor on port `8080` and serve the dashboard on port `6006`. Now, assuming you have a distributed application you want to profile (see `/examples` for some applications you can trace), you can wrap the commands which start its nodes inside:

```shell
rpcboard-trace -p 8080 [command ...]
```

This convenience wrapper connects to the log server on port `8080`, sets necessary trace flags, then forks a child process that runs your command, with any supplied args/flags, and pipes `stderr` via socket to the log server.

Once everything's set up, you can go to `localhost:6006` to watch your distributed system go!

## Developing

> Developed using Node v12.14.1.
