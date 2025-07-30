// Importing React
import { useState, useCallback } from "react";
// Importing Reactflow elements
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Background, Handle, ReactFlowProvider, useReactFlow, useCon } from "reactflow";
// Importing Reactflow CSS
import 'reactflow/dist/style.css';

const nodeTypes = {
        "editable": EditableNode
    }
// Declaring Initial Edges and Nodes
const initialEdges = []; //Edge is connected with source node with id 1 and target node with id 2
const initialNodes = [ //Basic initial node declaration
    { id: '1', type: 'editable', position: { x: 50, y: 50 }, data: { label: "Node 1" } },
    { id: '2', type: 'editable', position: { x: 400, y: 50 }, data: { label: "Node 2" } },
];

function EditableNode({ data, isConnectable }) {
    
const connection = useConnection();
 
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
 
  const label = isTarget ? 'Drop here' : 'Drag to connect';
 
  return (
    <div className="customNode">
      <div
        className="customNodeBody"
      >
        {/* If handles are conditionally rendered and not present initially, you need to update the node internals https://reactflow.dev/docs/api/hooks/use-update-node-internals/ */}
        {/* In this case we don't need to use useUpdateNodeInternals, since !isConnecting is true at the beginning and all handles are rendered initially. */}
        {!connection.inProgress && (
          <Handle
            className="customHandle"
            position={Position.Right}
            type="source"
          />
        )}
        {/* We want to disable the target handle, if the connection was started from this node */}
        {(!connection.inProgress || isTarget) && (
          <Handle className="customHandle" position={Position.Left} type="target" isConnectableStart={false} />
        )}
        {label}
      </div>
    </div>
  );
    return (
        <>
            
            <Handle type="source" position="top" id="top-source" isConnectable={isConnectable} />
                {data.isEditing ? <input type="text" value={data.label}/> : data.label}
            <Handle type="target" position="bottom"id="bottom-target" isConnectable={isConnectable} />
    </>
    );
}

// The main component which has two initial nodes connected with an edge.
function Flow() {
    // useReactFlow is a hook that returns the React Flow instance.
    const reactFlowInstance = useReactFlow(); //Initializing `Project` object
    // useState is a hook that lets you add React state to function components.
    const [nodes, setNodes] = useState(initialNodes); //Declaring state functions for nodes
    const [edges, setEdges] = useState(initialEdges); //Declaring state functions for edges

    // onNodesChange is called when a node is moved, selected, or removed.
    const onNodesChange = useCallback( //useCallback improves React's performance
    (changes) => {
      setNodes((oldNodes) => applyNodeChanges(changes, oldNodes));
    },
    [setNodes],
  );

    // onDoubleClick is called when the pane is double-clicked.
    const onDoubleClick = (event) => {
        // screenToFlowPosition converts screen coordinates to flow coordinates.
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        // A new node is created with the position of the double-click.
        const newNode = {
            id: (nodes.length + 1).toString(),
            type: "editable",
            position: position,
            data: {label: "New Node"}
        };
        // The new node is added to the existing nodes.
        setNodes([...nodes, newNode])
    };

    const handleNodeDoubleClick = (event, node) => {
        //This function stops from 'bubbling up' the double click
        event.stopPropagation();

        setNodes(nodes.map((currentNode) => {
            if (currentNode.id === node.id) {
                return { ...currentNode, data: { ...currentNode.data ,  isEditing: true} };
            } else {
                return currentNode;
            }
        }));
    }
    
    // onEdgesChange is called when an edge is moved, selected, or removed.
    const onEdgesChange = useCallback(
        (change) => {
            setEdges((oldEdge) => applyEdgeChanges(change, oldEdge))
        },
        [setEdges],
    );
    
    // onConnect is called when a new connection is made.
    const onConnect = useCallback(
        (changes) => {
            setEdges((oldEdges) => addEdge(changes, oldEdges))
        },
        [setEdges],
    );

    return (
        // The onDoubleClick event is attached to the div.
        <div style={{ height: '100vh' }} onDoubleClick={onDoubleClick}>
            <ReactFlow
                connectionMode="loose"
                nodes={nodes}
                edges={edges}
                zoomOnDoubleClick={false}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDoubleClick={handleNodeDoubleClick}
                nodeTypes={nodeTypes}
                isValidConnection={() => true}
            >
                <Background />
            </ReactFlow>
        </div>
    );
}

// The App component is the root component of the application.
export default function App() {
    return (
        // ReactFlowProvider provides the React Flow context to its children.
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}