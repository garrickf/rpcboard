import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import logo from "./logo.svg";
import "./App.css";
import Viz from "rpc-viz/src";

const testData = {
  columns: [
    "source_ts_start",
    "source_ts_end",
    "dest_ts_start",
    "dest_ts_end",
    "source",
    "dest",
    "type",
    "tag",
    "metadata",
  ],
  data: [
    [1],
    [4],
    [2],
    [3],
    ["A"],
    ["B"],
    ["request"],
    ["hello"],
    [{ message: "hello world" }],
  ],
};

const VizContainer = forwardRef(({ targetFramerate }, ref) => {
  const canvasRef = useRef();
  const vizRef = useRef();

  useEffect(() => {
    console.log(canvasRef.current);
    vizRef.current = new Viz(canvasRef.current, targetFramerate); // Need to access current

    const viz = vizRef.current;
    console.log(viz);
    viz.animate(); // Begin
  }, []); // On mount

  useImperativeHandle(ref, () => ({
    // Expose imperative methods on child component using refs.
    setData(data_obj) {
      const viz = vizRef.current;
      viz.setData(data_obj);
    },
  }));

  // The width and height determine the size of the element, but not the resolution.
  // That is decided in the rpc-viz on load
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <h1>rpcboard</h1>
      <canvas style={{ width: "100%", height: "100%" }} ref={canvasRef} />
    </div>
  );
});

function App() {
  // Fetch data from server:
  const [data, setData] = useState(null);
  const vizContainerRef = useRef();

  useEffect(() => {
    // Poll server every 1s
    // console.log("effect triggered")
    const timer = setInterval(() => {
      // console.log("poll happens")
      fetch("api/data/")
        .then((response) => response.json())
        .then((data) => {
          // console.log(data);
          clearInterval(timer);
          setData(data);
          vizContainerRef.current.setData(data);
        })
        .catch((err) => {
          // Keep retrying via setInterval
          console.log(err);
        });
    }, 1000);
  }, []); // TODO: add back in data!

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div>{JSON.stringify(data)}</div>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <VizContainer ref={vizContainerRef} />
    </div>
  );
}

export default App;
