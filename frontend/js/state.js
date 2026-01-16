// URL state management hooks

import { useState, useEffect, useCallback } from './vendor/preact-hooks.js';

const STORAGE_KEY = 'filters_state';

function saveStateToStorage(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadStateFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

// Parse URL parameters into state object
export function parseUrlState() {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag') || '';
    const tags = tagParam ? tagParam.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    return {
        query: params.get('q') || '',
        tags: tags,
        source: params.get('source') || '',
        order_by: params.get('order_by') || 'latest',
        min_tokens: params.get('min_tokens') ? parseInt(params.get('min_tokens')) : null,
        max_tokens: params.get('max_tokens') ? parseInt(params.get('max_tokens')) : null,
        page: parseInt(params.get('page')) || 0,
    };
}

// Build URL from state object
export function buildUrl(state) {
    const params = new URLSearchParams();

    if (state.query) {
        params.set('q', state.query);
    }
    if (state.tags && state.tags.length > 0) {
        params.set('tag', state.tags.join(','));
    }

    if (state.source) {
        params.set('source', state.source);
    }
    if (state.order_by) {
        params.set('order_by', state.order_by);
    }
    if (state.min_tokens !== null && state.min_tokens !== undefined) {
        params.set('min_tokens', state.min_tokens);
    }
    if (state.max_tokens !== null && state.max_tokens !== undefined) {
        params.set('max_tokens', state.max_tokens);
    }
    if (state.page) {
        params.set('page', state.page);
    }

    return params.toString() ? `?${params.toString()}` : window.location.pathname;
}

// Custom hook for URL-synced state
export function useUrlState() {
    const [state, setState] = useState(() => {
        const saved = loadStateFromStorage();
        if (saved) {
            const newUrl = buildUrl(saved);
            history.replaceState({}, '', newUrl);
            return saved;
        }
        return parseUrlState();
    });

    // Update URL when state changes
    const updateState = useCallback((updates) => {
        setState(prev => {
            const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
            const newUrl = buildUrl(newState);
            history.replaceState({}, '', newUrl);
            saveStateToStorage(newState);
            return newState;
        });
    }, []);

    // Handle browser back/forward
    useEffect(() => {
        const handlePopState = () => {
            setState(parseUrlState());
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return [state, updateState];
}

export const PAGE_SIZE = 40;
