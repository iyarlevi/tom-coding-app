const express = require("express");
const router = express.Router();
const CodeBlock = require("../models/CodeBlock");

// Route to get all code blocks
router.get("/codeblocks", async (req, res) => {
  try {
    const codeBlocks = await CodeBlock.find();
    res.json(codeBlocks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route to get a single code block by ID
router.get("/codeblocks/:id", async (req, res) => {
  try {
    const codeBlock = await CodeBlock.findById(req.params.id);
    if (!codeBlock) {
      return res.status(404).json({ message: "Code block not found" });
    }
    res.json(codeBlock);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
