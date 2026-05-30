---
name: headlessdev
description: Read web pages as token-efficient markdown via the headlessdev CLI.
  Use when the agent needs to read docs, articles, dashboards, or any web page
  without flooding context with raw HTML. Prefer over fetching raw HTML.
---

# Reading the web efficiently

When you need the contents of a URL, call the CLI and read the file it writes —
do NOT paste raw HTML into context.

## Browse — read a page

```bash
headlessdev browse "https://docs.stripe.com/api" --out /tmp/page.md
# then read /tmp/page.md only if you need it
```

For your own logged-in pages or localhost, the CLI runs locally — nothing leaves
your machine. For just-the-changes, add `--since`:

```bash
headlessdev browse "https://docs.stripe.com/changelog" --since --out /tmp/changes.md
```

## Extract — get structured data

```bash
headlessdev extract "https://competitor.com/pricing" --schema '{"plans":[{"name":"","price":""}]}' --json
```

## Links — map a site cheaply

```bash
headlessdev links "https://docs.example.com" --filter "/api/" --json
```

This returns just the links, not the full page content. Use it to discover pages
before deciding which ones to read.

## Screenshot — visual check

```bash
headlessdev screenshot "https://myapp.dev" --full-page --out /tmp/screenshot.png
```

## Tips

- Always use `--out` to write to a file, then read the file. This keeps context clean.
- Use `links` first to map, then `browse` specific pages. Don't browse everything.
- Use `--budget 2000` to cap token output if context is tight.
- The `--since` flag on browse returns only what changed — 90%+ fewer tokens on repeat reads.
