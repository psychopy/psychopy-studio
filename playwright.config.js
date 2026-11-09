import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	// all specs share one Electron app per worker, and the app holds a single-instance lock,
	// so tests can't run in parallel
	fullyParallel: false,
	workers: 1,
	// starting the app (including the Vite dev server) can be slow
	timeout: 60_000,
	expect: {
		timeout: 15_000
	},
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
	use: {
		trace: 'retain-on-failure'
	}
});
