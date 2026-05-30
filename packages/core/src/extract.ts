import { getSession } from "./session.js";
import { distill } from "./distill/pipeline.js";
import { estimateTokens } from "./tokens.js";
import type { ExtractOptions, ExtractResult } from "./types.js";

/**
 * Extract content from a URL, optionally guided by a JSON schema.
 *
 * When a schema is provided, it is prepended to the markdown output as a
 * structured hint so the consuming adapter/LLM can parse the content
 * into the requested shape.
 */
export async function extract(opts: ExtractOptions): Promise<ExtractResult> {
  const { url, schema, timeout } = opts;

  const session = getSession();
  const handle = await session.getPage(url, { timeout });

  try {
    const distilled = await distill(handle.page);
    let markdown = distilled.markdown;

    // Prepend schema as a parsing hint
    if (schema) {
      const schemaBlock = [
        "## Expected Schema",
        "```json",
        JSON.stringify(schema, null, 2),
        "```",
        "",
        "---",
        "",
      ].join("\n");
      markdown = schemaBlock + markdown;
    }

    return {
      url,
      markdown,
      tokens: estimateTokens(markdown),
      reductionRatio: distilled.reductionRatio,
      ...(schema ? { schema } : {}),
    };
  } finally {
    await handle.close();
  }
}
