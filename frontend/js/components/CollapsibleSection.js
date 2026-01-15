import { html } from '../vendor/htm-preact.js';
import { useState } from '../vendor/preact-hooks.js';

export function CollapsibleSection({ title, children, initiallyOpen = false }) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    return html`
        <div class="border border-gray-700 rounded-lg overflow-hidden">
            <button
                class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 flex justify-between items-center"
                onClick=${() => setIsOpen(!isOpen)}
            >
                <h3 class="font-medium text-purple-400">${title}</h3>
                <svg
                    class="w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            ${isOpen ? html`
                <div class="p-4 bg-gray-900">
                    ${children}
                </div>
            ` : null}
        </div>
    `;
}