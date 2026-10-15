export const csr = true;
export const prerender = true;
export const ssr = false;
export const trailingSlash = 'always';
import { installWebRuntime } from '$web/runtime.js';

if (typeof window !== 'undefined' && !window.electron) {
  installWebRuntime(window);
}
