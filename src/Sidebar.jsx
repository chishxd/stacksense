import "./Sidebar.css";
import { useState, useEffect } from "react";

function Sidebar({ selectedNode, onLabelChange, onNodeColorChange }) {
  // Local state to manage the input value and avoid focus loss on parent re-renders
  const [label, setLabel] = useState(selectedNode.data.label);

  // Local state for the color picker to allow immediate UI updates
  const [color, setColor] = useState(selectedNode.style?.backgroundColor);

  useEffect(() => {
    setLabel(selectedNode.data.label);
  }, [selectedNode.data.label]);

  // Sync color state when selectedNode style changes externally
  useEffect(() => {
    setColor(selectedNode.style?.backgroundColor);
  }, [selectedNode.style?.backgroundColor]);

  const handleLabelChange = (event) => {
    const newValue = event.target.value;
    setLabel(newValue);
    onLabelChange(selectedNode.id, newValue);
  };

  // Handler for the color input that passes node ID and selected color value
  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setColor(newColor);
    onNodeColorChange(selectedNode.id, newColor);
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
      <div className="color-chooser">
        <label>Background:</label>
        <input
          className="color-input"
          type="color"
          name="node-color"
          value={color}
          onChange={handleColorChange}
        />
      </div>
    </div>
  );
}

export default Sidebar;
