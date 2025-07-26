import { useState, useCallback } from "react";
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlowProvider, useReactFlow } from "reactflow";
import 'reactflow/dist/style.css';

const initialEdges = [{ id: '1-2', source: '1', target: '2' }];
const initialNodes = [
    { id: '1', type: 'default', position: { x: 50, y: 50 }, data: { label: "Node 1" } },
    { id: '2', type: 'default', position: { x: 400, y: 50 }, data: { label: "Node 2" } },

];
function Flow() {
    const reactFlowInstance = useReactFlow();
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback(
    (changes) => {
      setNodes((oldNodes) => applyNodeChanges(changes, oldNodes));
    },
    [setNodes],
  );

    const onDoubleClick = (event) => {
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        const newNode = {
            id: (nodes.length + 1).toString(),
            position: position,
            data: {label: "New Node"}
        };
        setNodes([...nodes, newNode])
    };

    const onEdgesChange = useCallback(
        (change) => {
            setEdges((oldEdge) => applyEdgeChanges(change, oldEdge))
        },
        [setEdges],
    );
    
    const onConnect = useCallback(
        (changes) => {
            setEdges((oldEdges) => addEdge(changes, oldEdges))
        },
        [setEdges],
    );
    return (
        <div style={{ height: '100vh' }} onDoubleClick={onDoubleClick}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                zoomOnDoubleClick={false}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            />
        </div>
    );
}

export default function App() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}