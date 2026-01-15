import { html } from '../vendor/htm-preact.js';
import { getImageUrl } from '../api.js';

// Escape HTML utility function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

export function CharacterCard({ character, onClick }) {
    const handleCardClick = () => {
        if (onClick) {
            onClick(character.source, character.id);
        }
    };

    return html`
        <div
            class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition cursor-pointer"
            onClick=${handleCardClick}
        >
            <img
                src=${getImageUrl(character.image_hash)}
                alt=${escapeHtml(character.name || 'Character')}
                class="card-image w-full"
                loading="lazy"
                onError=${(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374151%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239CA3AF%22 font-size=%2212%22>No Image</text></svg>';
                }}
            />
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
                <div class="mt-1 flex items-center justify-between">
                    <span class="text-xs px-2 py-0.5 bg-gray-700 rounded">
                        ${escapeHtml(character.source)}
                    </span>
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