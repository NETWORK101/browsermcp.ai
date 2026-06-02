#!/usr/bin/env node

const command = process.argv[2];

if (command === 'init') {
  const { runInit } = await import('../src/config/init.js');
  await runInit();
} else if (command === 'usage') {
  const { UsageTracker } = await import('../src/cost/tracker.js');
  const tracker = new UsageTracker();
  const today = tracker.todayUsage();
  const week = tracker.usage(7);
  console.log('Today:', JSON.stringify(today, null, 2));
  console.log('Week:', JSON.stringify(week, null, 2));
  tracker.close();
} else {
  await import('../src/index.js');
}
