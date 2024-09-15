const mongoose = require("mongoose");

const codeBlockSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  solution: {
    type: String,
    required: true,
  },
  hints: {
    type: [String], // Array of hints for the code block
    default: [], // Default to an empty array if no hints are provided
  },
});

module.exports = mongoose.model("CodeBlock", codeBlockSchema);
