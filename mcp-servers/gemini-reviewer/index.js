#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

const server = new Server(
  { name: "gemini-reviewer", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: "gemini_review",
    description: "Send code to Gemini for expert review. Returns analysis of code quality, bugs, security issues, and improvements.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The code to review",
        },
        context: {
          type: "string",
          description: "Optional context about what the code does or specific concerns",
        },
        focus: {
          type: "string",
          enum: ["general", "security", "performance", "readability", "bugs"],
          description: "What aspect to focus on (default: general)",
        },
      },
      required: ["code"],
    },
  },
];

const FOCUS_PROMPTS = {
  general: "Provide a comprehensive code review covering correctness, style, and potential improvements.",
  security: "Focus on security vulnerabilities, injection risks, authentication issues, and data exposure.",
  performance: "Focus on performance bottlenecks, algorithmic complexity, memory usage, and optimization opportunities.",
  readability: "Focus on code clarity, naming, structure, documentation, and maintainability.",
  bugs: "Focus on finding bugs, edge cases, error handling issues, and logical errors.",
};

async function reviewWithGemini(code, context, focus = "general") {
  let prompt = `Review the following code:\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
  if (context) prompt += `Context: ${context}\n\n`;
  prompt += FOCUS_PROMPTS[focus] || FOCUS_PROMPTS.general;
  prompt += "\n\nProvide specific, actionable feedback with code examples where helpful.";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "gemini_review") {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }

  if (!args || !args.code) {
    return { content: [{ type: "text", text: "Error: Missing required 'code' argument" }], isError: true };
  }

  try {
    const review = await reviewWithGemini(args.code, args.context, args.focus);
    return { content: [{ type: "text", text: `## Gemini Code Review\n\n${review}` }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Gemini Reviewer MCP server running");
