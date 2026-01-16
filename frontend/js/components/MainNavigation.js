import { html } from '../vendor/htm-preact.js';
import { useState, useEffect } from '../vendor/preact-hooks.js';

export function MainNavigation({ onShowHome, onBlurToggle }) {
    const [blurDisabled, setBlurDisabled] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('blurDisabled');
        setBlurDisabled(stored === 'true');
    }, []);

    const handleToggleBlur = () => {
        const newValue = !blurDisabled;
        setBlurDisabled(newValue);
        localStorage.setItem('blurDisabled', newValue);
        if (onBlurToggle) {
            onBlurToggle(newValue);
        }
    };

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
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-400">Blur images</label>
                        <button
                            onClick=${handleToggleBlur}
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${!blurDisabled ? 'bg-purple-600' : 'bg-gray-600'}"
                        >
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!blurDisabled ? 'translate-x-6' : 'translate-x-1'}"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;
}