import "./Sidebar.css";
import { useState, useEffect } from "react";

function Sidebar({ selectedNode, onLabelChange }) {
  // Local state to manage the input value and avoid focus loss on parent re-renders
  const [label, setLabel] = useState(selectedNode.data.label);

  useEffect(() => {
    setLabel(selectedNode.data.label);
  }, [selectedNode.data.label]);

  const handleLabelChange = (event) => {
    const newValue = event.target.value;
    setLabel(newValue);
    onLabelChange(selectedNode.id, newValue);
  };

  return (
    <div className="sidebar">
      <h2>Style Editor</h2>
      <hr />
      <div className="data-edit-container">
        <label>Label: </label>
        <input
          className="label-data"
          type="text"
          value={label}
          onChange={handleLabelChange}
        />
      </div>
    </div>
  );
}

export default Sidebar;
