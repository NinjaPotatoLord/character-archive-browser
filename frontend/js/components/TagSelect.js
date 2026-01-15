import { html } from '../vendor/htm-preact.js';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.js';
import * as api from '../api.js';

export function TagSelect({
    selectedTag,
    onSelect,
    onRemove,
    placeholder = "Search tags...",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Load tags based on search term or show popular tags
    useEffect(() => {
        if (!isOpen) {
            setTags([]);
            setFocusedIndex(-1);
            return;
        }

        if (searchTerm.trim().length > 0) {
            // Load search results
            const loadTags = async () => {
                setIsLoading(true);
                try {
                    const data = await api.searchTags({
                        query: searchTerm,
                        limit: 50,
                        offset: 0
                    });
                    setTags(data.tags || []);
                    setFocusedIndex(-1);
                } catch (error) {
                    console.error('Failed to load tags:', error);
                    setTags([]);
                } finally {
                    setIsLoading(false);
                }
            };

            const debounceTimer = setTimeout(loadTags, 300);
            return () => clearTimeout(debounceTimer);
        } else {
            // Load popular tags when search term is empty
            const loadPopularTags = async () => {
                setIsLoading(true);
                try {
                    const data = await api.fetchPopularTags(10); // Load top 10 popular tags
                    setTags(data.tags || []);
                    setFocusedIndex(-1);
                } catch (error) {
                    console.error('Failed to load popular tags:', error);
                    setTags([]);
                } finally {
                    setIsLoading(false);
                }
            };

            loadPopularTags();
        }
    }, [searchTerm, isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setTags([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm('');
                setTags([]);
                inputRef.current?.blur();
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, tags.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, -1));
            } else if (event.key === 'Enter' && focusedIndex >= 0) {
                event.preventDefault();
                handleTagSelect(tags[focusedIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, tags]);

    const handleTagSelect = (tag) => {
        onSelect(tag.name);
        setIsOpen(false);
        setSearchTerm('');
        setTags([]);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const handleRemoveTag = (e) => {
        e.stopPropagation();
        onRemove();
    };

    const handleContainerClick = () => {
        if (!selectedTag && !disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
        }
    };

    return html`
        <div
            ref=${containerRef}
            class="relative"
            onClick=${handleContainerClick}
        >
            <div
                class="
                    flex items-center gap-2 min-w-[200px] px-4 py-2 bg-gray-800 border
                    ${selectedTag ? 'border-purple-500' : 'border-gray-700'}
                    rounded-lg focus-within:border-purple-500 focus-within:outline-none
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                "
            >
                ${selectedTag ? html`
                    <span class="px-2 py-1 bg-purple-600 rounded text-sm font-medium truncate max-w-[150px]">
                        ${selectedTag}
                    </span>
                    <button
                        onClick=${handleRemoveTag}
                        class="text-gray-400 hover:text-white text-lg leading-none"
                        aria-label="Remove tag"
                    >
                        ×
                    </button>
                ` : html`
                    <input
                        ref=${inputRef}
                        type="text"
                        value=${searchTerm}
                        onInput=${handleInputChange}
                        onFocus=${handleInputFocus}
                        placeholder=${placeholder}
                        disabled=${disabled}
                        class="
                            flex-1 bg-transparent outline-none placeholder-gray-500
                            ${disabled ? 'cursor-not-allowed' : ''}
                        "
                    />
                    ${isLoading && html`
                        <div class="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                    `}
                `}
            </div>

            ${isOpen && !selectedTag && html`
                <div class="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    ${tags.length === 0 && !isLoading ? html`
                        <div class="px-4 py-2 text-gray-500 text-sm">
                            ${searchTerm.trim().length > 0 ? 'No tags found' : 'No tags available'}
                        </div>
                    ` : null}
                    ${tags.map((tag, index) => html`
                        <div
                            key=${tag.name}
                            class="
                                px-4 py-2 cursor-pointer hover:bg-purple-600
                                ${index === focusedIndex ? 'bg-purple-600' : 'hover:bg-gray-700'}
                            "
                            onClick=${() => handleTagSelect(tag)}
                        >
                            <div class="flex justify-between items-center">
                                <span>${tag.name}</span>
                                <span class="text-xs text-gray-400">(${tag.count})</span>
                            </div>
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}