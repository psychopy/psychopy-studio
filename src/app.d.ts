// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type {
	Snippet as SvelteSnippet,
	ComponentProps as SvelteComponentProps,
	Component,
	SvelteComponent
} from "svelte";


declare global {
	// pre-import the type Snippet for JSDoc
	type Snippet<T extends unknown[] = []> = SvelteSnippet<T>;
	// pre-import the type ComponentProps for JSDoc
	type ComponentProps<T extends SvelteComponent | Component<any, any>> = SvelteComponentProps<T>;
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
