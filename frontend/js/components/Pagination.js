import { html } from '../vendor/htm-preact.js';

export function Pagination({ page, onPrev, onNext, hasResults = true, loading = false }) {
    if (!hasResults) return null;

    return html`
        <div class="mt-6 flex justify-center gap-2">
            <button
                onClick=${onPrev}
                disabled=${page === 0 || loading}
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            <span class="px-4 py-2 text-gray-400">Page ${page + 1}</span>
            <button
                onClick=${onNext}
                disabled=${loading}
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    `;
}
