import htm from './htm.js';
import { h } from './preact.js';

const html = htm.bind(h);

export { html };
export * from './preact.js';
