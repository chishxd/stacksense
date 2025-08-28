import "./Toolbar.css";
import { useRef } from "react";

function Toolbar({
  onAddNode,
  onDeleteNode,
  onImport,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="toolbar">
      <button onClick={onAddNode}>Add Node</button>
      <button onClick={onDeleteNode}>Delete Node</button>
      <button onClick={handleImportClick}>Import</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={onImport}
        accept=".json"
      />
      <button onClick={onExport}>Export</button>
      <button onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo}>
        Redo
      </button>
    </div>
  );
}

export default Toolbar;
