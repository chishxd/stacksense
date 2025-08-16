import "./Toolbar.css";

export default function Toolbar({ onAddNode }) {
  return (
    <div className="toolbar">
      <button onClick={onAddNode}>Add Node</button>
    </div>
  );
}
