import { html } from '../vendor/htm-preact.js';
import { getImageUrl } from '../api.js';
import { useState, useEffect } from '../vendor/preact-hooks.js';

// Escape HTML utility function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

export function CharacterCard({ character, onClick, globalBlurDisabled }) {
    const [isImageRevealed, setIsImageRevealed] = useState(false);
    const [blurDisabled, setBlurDisabled] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('blurDisabled');
        setBlurDisabled(stored === 'true' || globalBlurDisabled);
    }, [globalBlurDisabled]);

    const handleCardClick = () => {
        if (onClick) {
            onClick(character.source, character.id);
        }
    };

    const handleImageClick = (e) => {
        if (!blurDisabled && !isImageRevealed) {
            e.stopPropagation();
            setIsImageRevealed(true);
        }
    };

    const handleReblurClick = (e) => {
        e.stopPropagation();
        setIsImageRevealed(false);
    };

    return html`
        <div
            class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition cursor-pointer"
            onClick=${handleCardClick}
        >
            <div class="relative">
                <img
                    src=${getImageUrl(character.image_hash)}
                    alt=${escapeHtml(character.name || 'Character')}
                    class="card-image w-full ${!isImageRevealed && !blurDisabled ? 'blur-md' : ''} transition-all duration-300"
                    loading="lazy"
                    onClick=${!blurDisabled ? handleImageClick : undefined}
                    style="${!blurDisabled ? 'cursor: pointer;' : ''}"
                    onError=${(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374151%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239CA3AF%22 font-size=%2212%22>No Image</text></svg>';
                    }}
                />
                ${!blurDisabled && isImageRevealed ? html`
                    <button
                        onClick=${handleReblurClick}
                        class="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full p-1.5 transition"
                        title="Blur image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="p-3">
                <h3
                    class="font-medium text-white truncate"
                    title=${escapeHtml(character.name || '')}
                >
                    ${escapeHtml(character.name || 'Unnamed Character')}
                </h3>
                <p class="text-sm text-gray-400 truncate">
                    by ${escapeHtml(character.author || 'Unknown')}
                </p>
                <div class="mt-1 flex items-center gap-2 flex-wrap">
                    <span class="text-xs px-2 py-0.5 bg-gray-700 rounded">
                        ${escapeHtml(character.source)}
                    </span>
                    ${character.tokens ? html`
                        <span class="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded">
                            ${parseInt(character.tokens).toLocaleString()} tokens
                        </span>
                    ` : ''}
                </div>
                ${character.tagline ? html`
                    <p class="text-xs text-gray-500 mt-2 line-clamp-2">
                        ${escapeHtml(character.tagline)}
                    </p>
                ` : ''}
            </div>
        </div>
    `;
}