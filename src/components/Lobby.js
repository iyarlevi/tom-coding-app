// src/components/Lobby.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Lobby.css"; // Keep the styles for the layout

const Lobby = () => {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState(""); // State to track selected code block
  const navigate = useNavigate(); // To handle navigation

  useEffect(() => {
    axios
      .get("/api/codeblocks")
      .then((response) => {
        setCodeBlocks(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching code blocks:", error);
        setLoading(false);
      });
  }, []);

  const handleSelectChange = (e) => {
    const blockId = e.target.value;
    if (blockId) {
      setSelectedBlockId(blockId);
      navigate(`/codeblock/${blockId}`); // Navigate to the selected code block
    }
  };

  if (loading) {
    return <div className="lobby-container">Loading...</div>;
  }

  return (
    <div className="lobby-container">
      <div className="lobby-box">
        <h1 className="lobby-title">Choose a Code Block</h1>
        <select
          className="code-block-dropdown"
          value={selectedBlockId}
          onChange={handleSelectChange}
        >
          <option value="" disabled>
            Select here
          </option>
          {codeBlocks.map((block) => (
            <option key={block._id} value={block._id}>
              {block.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Lobby;
