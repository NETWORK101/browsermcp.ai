import TurndownService from "turndown";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { gfm } from "turndown-plugin-gfm";

function buildTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // GFM plugin adds proper table support
  td.use(gfm);

  // Strip remaining noise tags outright
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td.remove(["script", "style", "svg", "noscript"] as any);

  // Truncate data: URIs on images to keep markdown readable
  td.addRule("images-no-data-uri", {
    filter: "img",
    replacement(_content, node) {
      const el = node as HTMLImageElement;
      const alt = el.getAttribute("alt") ?? "";
      let src = el.getAttribute("src") ?? "";
      if (src.startsWith("data:")) {
        // Preserve the MIME type prefix only
        const mimeEnd = src.indexOf(";");
        src = mimeEnd !== -1 ? src.slice(0, mimeEnd) + "..." : "data:image/...";
      }
      return `![${alt}](${src})`;
    },
  });

  return td;
}

const turndown = buildTurndown();

/**
 * Convert an HTML string to clean GFM markdown.
 */
export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
