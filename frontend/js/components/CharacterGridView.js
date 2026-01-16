import { html } from '../vendor/htm-preact.js';
import { CharacterCard } from './CharacterCard.js';
import { Pagination } from './Pagination.js';

export function CharacterGridView({
    characters,
    state,
    loading,
    handlePageChange,
    handleCharacterClick,
    blurDisabled
}) {
    const renderCharacterCards = () => {
        if (!characters || characters.length === 0) {
            return html`<p class="text-gray-500 col-span-full text-center py-8">No characters found</p>`;
        }

        return characters.map(char => html`
            <${CharacterCard}
                key=${`${char.source}-${char.id}`}
                character=${char}
                onClick=${handleCharacterClick}
                globalBlurDisabled=${blurDisabled}
            />
        `);
    };

    return html`
        <div id="content">
                <div id="characterGrid" class="card-grid">
                    ${renderCharacterCards()}
                </div>
                    <${Pagination}
                    page=${state.page}
                    onPrev=${() => handlePageChange(state.page - 1)}
                    onNext=${() => handlePageChange(state.page + 1)}
                    hasResults=${characters.length > 0}
                    loading=${loading}
                />
        </div>
    `;
}