import { html } from '../vendor/htm-preact.js';

export function MainNavigation({ onShowHome }) {
    return html`
        <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 py-3">
                <div class="flex items-center justify-between">
                    <h1
                        class="text-xl font-bold text-purple-400 cursor-pointer"
                        onClick=${onShowHome}
                    >
                        Character Archive Browser
                    </h1>
                </div>
            </div>
        </nav>
    `;
}