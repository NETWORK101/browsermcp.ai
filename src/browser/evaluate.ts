import type { Page } from 'playwright';

/**
 * Run a function inside the page, robust to how this package was compiled.
 *
 * Playwright serialises `fn` with toString(). Transpilers that preserve function names
 * (esbuild's keepNames, used by `tsx` in `npm run dev`) rewrite named helpers inside `fn`
 * into `__name(helper, "helper")` calls — and `__name` doesn't exist in the page, so the
 * script throws. Supplying a no-op `__name` in the evaluated scope makes the same source
 * work whether it came from tsc, tsx, or a bundler.
 */
export async function evaluateFn<A, T>(page: Page, fn: (arg: A) => T, arg: A): Promise<Awaited<T>> {
  const script = `(() => {
    const __name = (f) => f;
    return (${fn.toString()})(${JSON.stringify(arg) ?? 'undefined'});
  })()`;
  return page.evaluate(script) as Promise<Awaited<T>>;
}
