import { browse, estimateTokens } from '@headlessdev/core';

const URLS = [
  { label: 'API docs', url: 'https://docs.stripe.com/api' },
  { label: 'Docs landing', url: 'https://nextjs.org/docs' },
  { label: 'Blog post', url: 'https://blog.cloudflare.com' },
  { label: 'E-commerce', url: 'https://shopify.dev/docs' },
];

async function main() {
  console.log('# headlessdev Token Benchmark\n');
  console.log('| Page Type | URL | Raw HTML Tokens | Distilled Tokens | Reduction |');
  console.log('|-----------|-----|-----------------|------------------|-----------|');

  for (const { label, url } of URLS) {
    try {
      const result = await browse({ url });
      const ratio = `${Math.round((1 - result.reductionRatio) * 100)}%`;
      // Estimate raw tokens from the reduction ratio
      const rawTokens = Math.round(result.tokens / result.reductionRatio);
      console.log(`| ${label} | ${url} | ${rawTokens.toLocaleString()} | ${result.tokens.toLocaleString()} | ${ratio} |`);
    } catch (e: any) {
      console.log(`| ${label} | ${url} | ERROR | ${e.message} | - |`);
    }
  }

  console.log('\n_Run with: pnpm --filter benchmarks run_');
  process.exit(0);
}

main();
