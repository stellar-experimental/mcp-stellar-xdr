#!/usr/bin/env -S deno run --allow-read

import { McpServer } from "npm:@modelcontextprotocol/sdk@1.17.5/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.17.5/server/stdio.js";
import { z } from "npm:zod@3.25.76";

import init, {
  decode,
  encode,
  guess,
  schema,
  types,
} from "npm:@stellar/stellar-xdr-json@23.0.0";
await init();

const server = new McpServer({
  name: "mcp-stellar-xdr",
  version: "0.1.0",
});

// Register the types tool
server.registerTool(
  "types",
  {
    title: "Get Supported XDR Types",
    description: "Get the list of supported XDR types.",
    inputSchema: {},
  },
  () => {
    const list = types();
    return { content: [{ type: "text", text: `${JSON.stringify(list)}` }] };
  },
);

// Register the json_schema tool
server.registerTool(
  "json_schema",
  {
    title: "Get JSON Schema for XDR Type",
    description: "Get the JSON schema for a specific XDR type.",
    inputSchema: {
      type: z.string().describe("XDR type"),
    },
  },
  ({ type }) => {
    const json_schema = schema(type);
    return { content: [{ type: "text", text: `${json_schema}` }] };
  },
);

// Register the guess tool
server.registerTool(
  "guess",
  {
    title: "Guess XDR Type",
    description:
      "Guess what type Stellar XDR is, getting back a list of possible types.",
    inputSchema: {
      xdr: z.string().describe("Base64 encoded XDR"),
    },
  },
  ({ xdr }) => {
    const list = guess(xdr);
    return { content: [{ type: "text", text: `${JSON.stringify(list)}` }] };
  },
);

// Register the decode tool
server.registerTool(
  "decode",
  {
    title: "Decode XDR to JSON",
    description:
      "Decode a Stellar XDR to JSON, given a type name and Base64 XDR.",
    inputSchema: {
      type: z.string().describe("XDR type"),
      xdr: z.string().describe("Base64 encoded XDR"),
    },
  },
  ({ type, xdr }) => {
    const json = decode(type, xdr);
    return { content: [{ type: "text", text: `${json}` }] };
  },
);

// Register the encode tool
server.registerTool(
  "encode",
  {
    title: "Encode JSON to XDR",
    description: "Encode a Stellar XDR from JSON.",
    inputSchema: {
      type: z.string().describe("XDR type"),
      json: z.string().describe("JSON adhering to the types JSON Schema"),
    },
  },
  ({ type, json }) => {
    const xdr = encode(type, json);
    return { content: [{ type: "text", text: `${xdr}` }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  Deno.exit(1);
});

export { server };
