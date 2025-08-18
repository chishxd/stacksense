import "./Toolbar.css";

export default function Toolbar({ onAddNode, onDeleteNode }) {
  return (
    <div className="toolbar">
      <button onClick={onAddNode}>Add Node</button>
      <button onClick={onDeleteNode}>Delete Node</button>
    </div>
  );
}
