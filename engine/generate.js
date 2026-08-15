import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic();

// Load the system prompt from the markdown file
const SYSTEM_PROMPT_PATH = new URL("./prompt.md", import.meta.url);

export async function generateHorror(profile) {
  const systemPrompt = readFileSync(SYSTEM_PROMPT_PATH, "utf-8");

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: JSON.stringify(profile, null, 2),
      },
    ],
  });

  const story = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return {
    story,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      total_tokens:
        message.usage.input_tokens + message.usage.output_tokens,
      // claude-opus-4-6 list price: $5 / $25 per million tokens.
      estimated_cost:
        (message.usage.input_tokens * 5 +
          message.usage.output_tokens * 25) /
        1_000_000,
    },
    model: message.model,
    timestamp: new Date().toISOString(),
  };
}