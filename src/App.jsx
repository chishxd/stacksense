import { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import Flow from "./Flow";

function TutorialPanel() {
  return (
    <div className="tutorial-container">
      <p>Instructions:</p>
      <ul>
        <li>Double click the pane to add a new node.</li>
        <li>Select a node/edge and press backspace to delete it.</li>
        <li>Double click a node to edit its content.</li>
      </ul>
    </div>
  );
}

export default function App() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);

  const toggleTutorialPane = () => {
    setIsTutorialOpen(!isTutorialOpen);
  };

  return (
    <ReactFlowProvider>
      <div className="flow-container" style={{ height: "100vh" }}>
        <Flow />
        <button className="help-button" onClick={toggleTutorialPane}>
          ?
        </button>
        {isTutorialOpen && <TutorialPanel />}
      </div>
    </ReactFlowProvider>
  );
}
