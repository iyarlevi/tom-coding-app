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
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("CodeBlock", codeBlockSchema);
