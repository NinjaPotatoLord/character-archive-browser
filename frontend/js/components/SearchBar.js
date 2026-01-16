import { html } from '../vendor/htm-preact.js';
import { useState, useEffect } from '../vendor/preact-hooks.js';
import { TagSelect } from './TagSelect.js';

const DEBOUNCE_MS = 400;

export function SearchBar({
    sources,
    state,
    onUpdateState,
}) {
    const [inputValue, setInputValue] = useState(state.query);
    const [tags, setTags] = useState(state.tags || []);
    const [source, setSource] = useState(state.source);
    const [sortOrder, setSortOrder] = useState(state.order_by || 'latest');
    const [minTokens, setMinTokens] = useState(state.min_tokens || '');
    const [maxTokens, setMaxTokens] = useState(state.max_tokens || '');

    const createSetValueHandler = (setter) => (event) => {
        event.preventDefault();
        setter(event.target.value);
    }

    const handleClearTag = () => {
        setTags([]);
    }

    const handleClear = () => {
        setInputValue('');
        setTags([]);
        setSource('');
        setSortOrder('latest');
        setMinTokens('');
        setMaxTokens('');
        onUpdateState({
            query: '',
            tags: [],
            source: '',
            order_by: 'latest',
            min_tokens: null,
            max_tokens: null,
            page: 0
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdateState({
            query: inputValue,
            tags,
            source,
            order_by: sortOrder,
            min_tokens: minTokens ? parseInt(minTokens) : null,
            max_tokens: maxTokens ? parseInt(maxTokens) : null,
            page: 0
        });
    }

    return html`
        <div class="mb-6">
            <form onSubmit=${handleSubmit}>
                <div class="flex gap-2">
                    <div class="flex flex-col grow-1 gap-2">
                    <div class="flex gap-2">
                            <input
                                type="text"
                                value=${inputValue}
                                onInput=${createSetValueHandler(setInputValue)}
                                placeholder="Search characters by name, author..."
                                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                            />
                    </div>
                    
                    <div class="flex gap-2">
                            <${TagSelect}
                                selectedTags=${tags}
                                onSelect=${setTags}
                                onRemove=${setTags}
                                placeholder="Filter by tag..."
                            />
                    </div> 
                                    
                    <div class="flex gap-2">
                            <input
                                type="number"
                                value=${minTokens}
                                onInput=${createSetValueHandler(setMinTokens)}
                                placeholder="Min tokens"
                                min="0"
                                class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                            />
                            <input
                                type="number"
                                value=${maxTokens}
                                onInput=${createSetValueHandler(setMaxTokens)}
                                placeholder="Max tokens"
                                min="0"
                                class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                            />
                            <select
                                value=${source}
                                onChange=${createSetValueHandler(setSource)}
                                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                            >
                                <option value="">All Sources</option>
                                ${Object.entries(sources).map(([key, name]) => html`
                                    <option key=${key} value=${key}>${name}</option>
                                `)}
                            </select>
                            <select
                                value=${sortOrder}
                                onChange=${createSetValueHandler(setSortOrder)}
                                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                            >
                                <option value="latest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="random">Random</option>
                                <option value="tokens_asc">Tokens (Low to High)</option>
                                <option value="tokens_desc">Tokens (High to Low)</option>
                            </select>
                    </div>
                    </div>

                    <!-- Buttons Section -->
                    <div class="flex gap-2 flex-col shrink-0 flex-wrap">
                        <button
                            type="submit"
                            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex-1 min-w-[100px]"
                        >
                            Search
                        </button>
                        ${(inputValue || (tags && tags.length > 0) || source || minTokens || maxTokens) ? html`
                            <button
                                onClick=${handleClear}
                                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium flex-1 min-w-[100px]"
                            >
                                Clear Filter
                            </button>
                        ` : null}
                    </div>
                </div>
            </form>
        </div>
    `;
}
