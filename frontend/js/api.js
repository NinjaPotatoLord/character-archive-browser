// API client for Character Archive

const API_BASE = '/api';

export async function fetchSources() {
    const res = await fetch(`${API_BASE}/sources`);
    return res.json();
}

export async function fetchCharacter(source, id) {
    const res = await fetch(`${API_BASE}/character/${source}/${encodeURIComponent(id)}`);
    return res.json();
}

export async function fetchCharacterTags(source, id) {
    const res = await fetch(`${API_BASE}/character/${source}/${encodeURIComponent(id)}/tags`);
    return res.json();
}

export async function fetchCharacterCard(source, id) {
    const res = await fetch(`${API_BASE}/character/${source}/${encodeURIComponent(id)}/card`);
    return res.json();
}

export async function fetchPopularTags(limit = 100) {
    const res = await fetch(`${API_BASE}/tags/popular?limit=${limit}`);
    return res.json();
}

export async function searchTags({ query = '', limit = 100, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    if (query) params.set('q', query);
    const res = await fetch(`${API_BASE}/tags?${params}`);
    return res.json();
}

// All functionality is now covered by the unified fetchCharacters function
export async function searchCharacters({ query = '', tags = [], source = '', order_by = 'latest', min_tokens = null, max_tokens = null, limit = 40, offset = 0 }) {
    const params = new URLSearchParams({ order_by, limit, offset });
    if (source) params.set('source', source);
    if (query) params.set('q', query);
    if (tags && tags.length > 0) params.set('tag', tags.join(','));
    if (min_tokens !== null) params.set('min_tokens', min_tokens);
    if (max_tokens !== null) params.set('max_tokens', max_tokens);
    const res = await fetch(`${API_BASE}/characters?${params}`);
    return res.json();
}

export function getImageUrl(hash) {
    return `${API_BASE}/image/${hash}`;
}

export function getCardPngUrl(source, id) {
    return `${API_BASE}/character/${source}/${encodeURIComponent(id)}/card.png`;
}
