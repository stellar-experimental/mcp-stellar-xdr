import { assert, assertEquals } from "jsr:@std/assert@1.0.3";

import { Client } from "npm:@modelcontextprotocol/sdk@1.17.5/client";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk@1.17.5/client/stdio.js";

const transport = new StdioClientTransport({
  command: "deno",
  args: ["--allow-read", "./mcp-stellar-xdr.ts"],
});
const client = new Client({ name: "client", version: "0.1.0" });
await client.connect(transport);

// A valid base64-encoded TransactionEnvelope XDR for a simple transaction.
const validTxEnvelopeXdr =
  "AAAAAGL8HQvQkbG28t2Jm/T4hRk2i52HqP+i4g2sTUiJbA+lAAAAZAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA5Iv2u/Y+sDPAx3cO0s7pZkR2n0GnZTzbch+KR3M7e+kAAAAAAAAAAACYloAAAAAAAAAAAA==";

Deno.test("types", async () => {
  const result: any = await client.callTool({ name: "types", arguments: {} });
  const types = JSON.parse(result.content[0].text);
  assert(Array.isArray(types), "should return an array");
  assert(types.length > 0, "should return at least one type");
  assert(types.includes("TransactionEnvelope"));
});

Deno.test("json_schema", async () => {
  const result: any = await client.callTool({
    name: "json_schema",
    arguments: { type: "TransactionEnvelope" },
  });
  const schema = JSON.parse(result.content[0].text);
  assert(schema.title === "TransactionEnvelope");
});

Deno.test("guess", async () => {
  const result: any = await client.callTool({
    name: "guess",
    arguments: { xdr: validTxEnvelopeXdr },
  });
  const types = JSON.parse(result.content[0].text);
  assert(Array.isArray(types), "should return an array");
  assert(types.includes("TransactionEnvelope"));
});

Deno.test("decode", async () => {
  const result: any = await client.callTool({
    name: "decode",
    arguments: { type: "TransactionEnvelope", xdr: validTxEnvelopeXdr },
  });
  const json = JSON.parse(result.content[0].text);
  assert(json.tx_v0.tx.fee == 100);
});

Deno.test("encode", async () => {
  // First, decode to get the JSON
  const encodeResult: any = await client.callTool({
    name: "decode",
    arguments: { type: "TransactionEnvelope", xdr: validTxEnvelopeXdr },
  });
  const json = encodeResult.content[0].text;

  // Now encode
  const decodeResult: any = await client.callTool({
    name: "encode",
    arguments: { type: "TransactionEnvelope", json },
  });
  const xdr = decodeResult.content[0].text;
  assertEquals(xdr, validTxEnvelopeXdr);
});
