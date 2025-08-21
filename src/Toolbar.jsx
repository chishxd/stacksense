import "./Toolbar.css";

export default function Toolbar({ onAddNode, onDeleteNode, onExport }) {
  return (
    <div className="toolbar">
      <button onClick={onAddNode}>Add Node</button>
      <button onClick={onDeleteNode}>Delete Node</button>
      <button onClick={onExport}>Export</button>
    </div>
  );
}
