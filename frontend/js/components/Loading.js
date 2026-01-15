import { html } from '../vendor/htm-preact.js';

export function Loading() {
    return html`
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
            <p class="mt-2 text-gray-400">Loading...</p>
        </div>
    `;
}
