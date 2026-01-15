import { html } from '../vendor/htm-preact.js';
import { useState, useEffect } from '../vendor/preact-hooks.js';
import { TagSelect } from './TagSelect.js';

const DEBOUNCE_MS = 400;

export function SearchBar({
    sources,
    state,
    onUpdateState,
}) {
    // Local state for input - doesn't trigger URL/data updates immediately
    const [inputValue, setInputValue] = useState(state.query);
    const [tag, setTag] = useState(state.tag);
    const [source, setSource] = useState(state.source);
    const [sortOrder, setSortOrder] = useState(state.order_by || 'latest');

    const createSetValueHandler = (setter) => (event) => {
        event.preventDefault();
        setter(event.target.value);
    }

    const handleClearTag = () => {
        setTag('');
    }

    const handleClear = () => {
        setInputValue('');
        setTag('');
        setSource('');
        setSortOrder('latest');
        onUpdateState({
            query: '',
            tag: '',
            source: '',
            order_by: 'latest',
            page: 0
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdateState({
            query: inputValue,
            tag,
            source,
            order_by: sortOrder,
            page: 0
        });
    }

    return html`
        <div class="mb-6">
            <form onSubmit=${handleSubmit}>
                <div class="flex gap-2 flex-wrap">
                    <input
                        type="text"
                        value=${inputValue}
                        onInput=${createSetValueHandler(setInputValue)}
                        placeholder="Search characters by name, author..."
                        class="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <${TagSelect}
                        selectedTag=${tag}
                        onSelect=${setTag}
                        onRemove=${handleClearTag}
                        placeholder="Filter by tag..."
                    />
                    <select
                        value=${source}
                        onChange=${createSetValueHandler(setSource)}
                        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                        <option value="">All Sources</option>
                        ${Object.entries(sources).map(([key, name]) => html`
                            <option key=${key} value=${key}>${name}</option>
                        `)}
                    </select>
                    <select
                        value=${sortOrder}
                        onChange=${createSetValueHandler(setSortOrder)}
                        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                        <option value="latest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="random">Random</option>
                    </select>
                    <button
                        type="submit"
                        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
                    >
                        Search
                    </button>

                    ${(inputValue || tag || source) && html`
                        <button
                            onClick=${handleClear}
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
                        >
                            Clear Filter
                        </button>
                    `}
                </div>
            </form>
        </div>
    `;
}
