// URL state management hooks

import { useState, useEffect, useCallback } from './vendor/preact-hooks.js';

// Parse URL parameters into state object
export function parseUrlState() {
    const params = new URLSearchParams(window.location.search);
    return {
        query: params.get('q') || '',
        tag: params.get('tag') || '',
        source: params.get('source') || '',
        order_by: params.get('order_by') || 'latest',
        page: parseInt(params.get('page')) || 0,
    };
}

// Build URL from state object
export function buildUrl(state) {
    const params = new URLSearchParams();

    if (state.query) {
        params.set('q', state.query);
    }
    if (state.tag) {
        params.set('tag', state.tag);
    }

    if (state.source) {
        params.set('source', state.source);
    }
    if (state.order_by) {
        params.set('order_by', state.order_by);
    }
    if (state.page) {
        params.set('page', state.page);
    }

    return params.toString() ? `?${params.toString()}` : window.location.pathname;
}

// Custom hook for URL-synced state
export function useUrlState() {
    const [state, setState] = useState(parseUrlState);

    // Update URL when state changes
    const updateState = useCallback((updates) => {
        setState(prev => {
            const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
            const newUrl = buildUrl(newState);
            history.replaceState({}, '', newUrl);
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
