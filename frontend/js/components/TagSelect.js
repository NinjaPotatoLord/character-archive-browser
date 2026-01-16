import { html } from '../vendor/htm-preact.js';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.js';
import * as api from '../api.js';

export function TagSelect({
    selectedTags = [],
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
                if (selectedTags.length === 0 && searchTerm === '') {
                    setIsOpen(false);
                } else if (selectedTags.length > 0 || searchTerm !== '') {
                    // Close dropdown but keep the input active
                    setTags([]);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedTags, searchTerm]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (selectedTags.length === 0 && searchTerm === '') {
                    setIsOpen(false);
                }
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
            } else if (event.key === 'Enter' && focusedIndex >= 0 && tags.length > 0) {
                event.preventDefault();
                handleTagSelect(tags[focusedIndex]);
            } else if (event.key === 'Backspace' && searchTerm === '' && selectedTags.length > 0) {
                // Remove last tag when backspace is pressed and input is empty
                const newTags = [...selectedTags];
                newTags.pop();
                onRemove(newTags);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, tags, searchTerm, selectedTags, onRemove]);

    const handleTagSelect = (tag) => {
        if (!selectedTags.includes(tag.name)) {
            onSelect([...selectedTags, tag.name]);
        }
        setSearchTerm('');
        // Clear search results after selection
        setTags([]);

        // Focus the input after selecting a tag
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleInputFocus = () => {
        if (selectedTags.length === 0 || searchTerm !== '') {
            setIsOpen(true);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!isOpen && (selectedTags.length === 0 || value !== '')) {
            setIsOpen(true);
        }
    };

    const handleRemoveTag = (tagName, e) => {
        e.stopPropagation();
        const newTags = selectedTags.filter(tag => tag !== tagName);
        onRemove(newTags);

        // Focus the input after removing a tag
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleContainerClick = (e) => {
        // Only focus and open if clicked on the container but not on the input or remove buttons
        if (!disabled && e.target === containerRef.current) {
            inputRef.current?.focus();
            if (selectedTags.length === 0 || searchTerm !== '') {
                setIsOpen(true);
            }
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
                    w-full px-4 py-2 bg-gray-800 border
                    ${selectedTags.length > 0 ? 'border-purple-500' : 'border-gray-700'}
                    rounded-lg focus-within:border-purple-500 focus-within:outline-none
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                "
            >
                <div class="grid grid-cols-[1fr_auto] gap-2 items-start">
                    <!-- Left column: tags and input -->
                    <div class="flex gap-2">
                        <!-- Tags row -->
                        <div class="flex flex-wrap gap-1">
                            ${selectedTags.map(tagName => html`
                                <span class="px-2 py-1 bg-purple-600 rounded text-sm font-medium flex items-center gap-1">
                                    ${tagName}
                                    <button
                                        onClick=${(e) => handleRemoveTag(tagName, e)}
                                        class="text-gray-200 hover:text-white text-xs leading-none"
                                        aria-label="Remove tag"
                                    >
                                        ×
                                    </button>
                                </span>
                            `)}
                        </div>

                        <!-- Input row -->
                        <div class="flex items-center gap-1">
                            <input
                                ref=${inputRef}
                                type="text"
                                value=${searchTerm}
                                onInput=${handleInputChange}
                                onFocus=${handleInputFocus}
                                placeholder=${selectedTags.length === 0 ? placeholder : ""}
                                disabled=${disabled}
                                class="
                                    flex-1 bg-transparent outline-none placeholder-gray-500
                                    ${disabled ? 'cursor-not-allowed' : ''}
                                "
                            />
                        </div>
                    </div>

                    <!-- Right column: buttons -->
                    <div class="flex flex-col gap-1">
                        ${isLoading && html`
                            <div class="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent self-center"></div>
                        `}
                    </div>
                </div>
            </div>

            ${isOpen && html`
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