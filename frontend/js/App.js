import { html } from './vendor/htm-preact.js';
import { useState, useEffect, useCallback } from './vendor/preact-hooks.js';

import { MainNavigation } from './components/MainNavigation.js';
import { CharacterGridView } from './components/CharacterGridView.js';
import { CharacterModal } from './components/CharacterModal.js';
import { SearchBar } from './components/SearchBar.js';
import { Loading } from './components/Loading.js';
import {
    useUrlState,
    PAGE_SIZE,
} from './state.js';
import * as api from './api.js';

// Main App Component
export function App() {
    const [state, updateState] = useUrlState();
    const [characters, setCharacters] = useState([]);
    const [sources, setSources] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedCharacterTags, setSelectedCharacterTags] = useState([]);
    const [blurDisabled, setBlurDisabled] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('blurDisabled');
        setBlurDisabled(stored === 'true');
    }, []);

    // Load sources on mount
    useEffect(() => {
        loadSources();
    }, []);

    // Load data based on current state
    useEffect(() => {
        loadData();
    }, [state]);

    const loadSources = async () => {
        try {
            const data = await api.fetchSources();
            setSources(data.sources);
        } catch (e) {
            console.error('Failed to load sources:', e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            await loadWithFilters();
        } catch (e) {
            console.error('Failed to load data:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadWithFilters = async () => {
        try {
            const data = await api.searchCharacters({
                query: state.query,
                tags: state.tags,
                source: state.source,
                order_by: state.order_by || 'latest',
                min_tokens: state.min_tokens,
                max_tokens: state.max_tokens,
                limit: PAGE_SIZE,
                offset: state.page * PAGE_SIZE
            });
            setCharacters(data.characters || []);
        } catch (e) {
            console.error('Failed to load with filters:', e);
            setCharacters([]);
        }
    };

    const handleShowHome = useCallback(() => {
        updateState({
            query: '',
            tag: '',
            min_tokens: null,
            max_tokens: null,
            page: 0
        });
    }, [updateState]);

    const handleTagClick = useCallback((tagName) => {
        updateState({
            tag: tagName,
            // Keep the current query if it exists
            query: state.query,
            page: 0
        });
    }, [state.query, updateState]);

    const handleCharacterClick = useCallback(async (source, id) => {
        try {
            const [charRes, tagsRes] = await Promise.all([
                api.fetchCharacter(source, id),
                api.fetchCharacterTags(source, id)
            ]);

            // Store id along with the response
            setSelectedCharacter({ ...charRes, id });
            setSelectedCharacterTags(tagsRes.tags || []);
        } catch (e) {
            console.error('Failed to load character:', e);
        }
    }, []);

    const handlePageChange = useCallback((newPage) => {
        updateState(prev => ({
            ...prev,
            page: Math.max(0, newPage)
        }));
    }, [updateState]);

    const closeModal = useCallback(() => {
        setSelectedCharacter(null);
        setSelectedCharacterTags([]);
    }, []);

    const downloadCard = useCallback(async (source, id) => {
        try {
            const data = await api.fetchCharacterCard(source, id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${String(id).replace(/[^a-z0-9]/gi, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Failed to download card');
        }
    }, []);

    const downloadCardPng = useCallback((source, id) => {
        // Directly trigger download via link
        const url = api.getCardPngUrl(source, id);
        const a = document.createElement('a');
        a.href = url;
        a.download = ''; // Let server set filename
        a.click();
    }, []);

    const searchAuthor = useCallback((source, author) => {
        closeModal();
        updateState({
            query: author,
            source,
            page: 0
        });
    }, [closeModal, updateState]);

    const handleBlurToggle = useCallback((newValue) => {
        setBlurDisabled(newValue);
    }, []);

    return html`
        <div class="bg-gray-900 text-gray-100 min-h-screen">
            <${MainNavigation}
                onShowHome=${handleShowHome}
                onBlurToggle=${handleBlurToggle}
            />

            <main class="max-w-7xl mx-auto px-4 py-6">
                <${SearchBar}
                    sources=${sources}
                    onUpdateState=${updateState}
                    state=${state}
                />

                <div id="content">
                    ${loading ? html`<${Loading} />` : null}

                    ${!loading ? html`<${CharacterGridView}
                        characters=${characters}
                        state=${state}
                        loading=${loading}
                        handlePageChange=${handlePageChange}
                        handleCharacterClick=${handleCharacterClick}
                        blurDisabled=${blurDisabled}
                    />` : null}
                </div>
            </main>

            <${CharacterModal}
                selectedCharacter=${selectedCharacter}
                selectedCharacterTags=${selectedCharacterTags}
                closeModal=${closeModal}
                downloadCard=${downloadCard}
                downloadCardPng=${downloadCardPng}
                searchAuthor=${searchAuthor}
                handleTagClick=${handleTagClick}
            />
        </div>
    `;
}