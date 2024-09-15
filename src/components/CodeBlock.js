import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import MonacoEditor from "@monaco-editor/react";
import * as esprima from "esprima";
import estraverse from "estraverse";
import deepEqual from "deep-equal";
import "./CodeBlock.css";

const CodeBlock = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const [codeBlock, setCodeBlock] = useState(null);
  const [role, setRole] = useState("student");
  const [code, setCode] = useState("");
  const [hints, setHints] = useState([]); // Store hints
  const [hintIndex, setHintIndex] = useState(-1); // Track current hint index
  const [socket, setSocket] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [showSmiley, setShowSmiley] = useState(false);
  const editorRef = useRef(null);

  // Fetch the selected code block from the server
  useEffect(() => {
    axios
      .get(`/api/codeblocks/${blockId}`)
      .then((response) => {
        setCodeBlock(response.data);
        setCode(response.data.template);
        setHints(response.data.hints); // Load the hints from the server
      })
      .catch((error) => {
        console.error("Error fetching code block:", error);
      });

    // Connect to the Socket.IO server
    const socketConnection = io("http://localhost:5000");
    setSocket(socketConnection);

    // Join the specific room for the code block
    socketConnection.emit("join", { blockId });

    socketConnection.on("role", (assignedRole) => {
      setRole(assignedRole);
    });

    // Handle real-time code updates
    socketConnection.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    // Listen for updates to the number of students in the room
    socketConnection.on("studentCount", (count) => {
      setStudentCount(count);
    });

    return () => {
      // Cleanup on component unmount
      socketConnection.disconnect();
    };
  }, [blockId]);

  // Normalize the AST to generalize variable names
  const normalizeAST = (ast) => {
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === "Identifier") {
          node.name = "var"; // Replace all variable names with 'var'
        }
      },
    });
    return ast;
  };

  // Compare the student code with the solution using AST
  const compareCodeWithSolution = (studentCode, solutionCode) => {
    try {
      // Parse both codes into ASTs
      const studentAST = esprima.parseScript(studentCode);
      const solutionAST = esprima.parseScript(solutionCode);

      // Normalize both ASTs
      const normalizedStudentAST = normalizeAST(studentAST);
      const normalizedSolutionAST = normalizeAST(solutionAST);

      // Compare the ASTs using deep-equal
      return deepEqual(normalizedStudentAST, normalizedSolutionAST);
    } catch (error) {
      return false;
    }
  };

  // Handle code changes by the student
  const handleCodeChange = (value) => {
    setCode(value);
    if (socket && role === "student") {
      socket.emit("codeChange", { blockId, code: value });

      // Compare code with the solution using AST comparison
      if (compareCodeWithSolution(value, codeBlock.solution)) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }
    }
  };

  // Handle showing the next hint
  const showNextHint = () => {
    if (hintIndex < hints.length - 1) {
      setHintIndex(hintIndex + 1);
    } else {
      // Reset to start from the beginning
      setHintIndex(-1);
    }
  };

  // Redirect students to the lobby if the mentor leaves
  useEffect(() => {
    if (socket) {
      socket.on("mentorLeft", () => {
        navigate("/");
      });
    }
  }, [socket, navigate]);

  const goToLobby = () => {
    navigate("/");
  };

  if (!codeBlock) return <div className="loading">Loading...</div>;

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <h1>{codeBlock.title}</h1>
        <p>
          Role: <span className="role-label">{role}</span>
        </p>
        <p>Number of students in the room: {studentCount}</p>
      </div>

      {role === "student" && hints.length > 0 && (
        <div className="hint-container">
          <button onClick={showNextHint} className="hint-button">
            Show Hint
          </button>
          {hintIndex >= 0 && hintIndex < hints.length && (
            <p className="hint-text">{hints[hintIndex]}</p>
          )}
        </div>
      )}

      <div className="editor-container">
        <MonacoEditor
          height="80vh"
          width="100%"
          language="javascript"
          value={code}
          onChange={handleCodeChange}
          editorDidMount={(editor) => {
            editorRef.current = editor; // Store editor instance in ref
          }}
          options={{
            readOnly: role === "mentor",
            minimap: { enabled: false }, // Disable minimap for cleaner look
            padding: { top: 10, bottom: 10 },
            fontSize: 16,
            theme: "vs-dark",
          }}
        />
      </div>

      {showSmiley && (
        <div className="smiley-overlay">
          <span className="smiley-face">😊</span>
          <button onClick={goToLobby} className="go-to-lobby-button">
            Go to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
