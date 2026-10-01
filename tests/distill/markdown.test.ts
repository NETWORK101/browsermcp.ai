import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../../src/distill/markdown.js';

describe('htmlToMarkdown', () => {
  it('strips self-link anchors from headings but leaves body links alone', () => {
    const html =
      '<h2>What is Next.js?<a href="#what-is-nextjs"></a></h2>' +
      '<h2><a href="#syntax">Syntax</a></h2>' +
      '<p>Body <a href="#top">top</a> and <a href="https://x.test/a">away</a>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('## What is Next.js?');
    expect(md).toContain('## Syntax');
    expect(md).not.toMatch(/^##.*\(#/m);
    expect(md).toContain('[top](#top)');
    expect(md).toContain('[away](https://x.test/a)');
  });

  it('leaves # lines inside code fences alone', () => {
    const md = htmlToMarkdown('<pre><code># [x](#y)\n</code></pre>');
    expect(md).toContain('# [x](#y)');
  });

  it('renders headerless tables as rows and drops images by default', () => {
    const md = htmlToMarkdown('<table><tr><td>a</td><td>b</td></tr></table><img src="x.png" alt="pic">');
    expect(md).toContain('| a | b |');
    expect(md).not.toContain('x.png');
  });
});
