import { generateHorror } from "./engine/generate.js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load profile from CLI arg or default
const profilePath = process.argv[2] || "engine/profiles/test-profile-1.json";

console.log(`\n🔮 Loading profile: ${profilePath}`);
const profile = JSON.parse(readFileSync(profilePath, "utf-8"));

console.log(`⏳ Generating horror narrative...\n`);
const startTime = Date.now();

try {
  const result = await generateHorror(profile);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print the story
  console.log("─".repeat(60));
  console.log(result.story);
  console.log("─".repeat(60));

  // Print metadata
  console.log(`\n📊 Generation stats:`);
  console.log(`   Model: ${result.model}`);
  console.log(`   Time: ${elapsed}s`);
  console.log(`   Tokens: ${result.usage.total_tokens}`);
  console.log(`   Est. cost: $${result.usage.estimated_cost.toFixed(4)}`);

  // Save to output
  const outputDir = join(__dirname, "engine", "output");
  mkdirSync(outputDir, { recursive: true });
  const filename = `story-${Date.now()}.json`;
  writeFileSync(
    join(outputDir, filename),
    JSON.stringify(
      {
        profile,
        ...result,
        generation_time_seconds: parseFloat(elapsed),
      },
      null,
      2
    )
  );
  console.log(`   Saved: engine/output/${filename}`);
} catch (error) {
  console.error(`\n❌ Generation failed:`, error.message);
  process.exit(1);
}