import { html } from '../vendor/htm-preact.js';
import { useRef, useEffect } from '../vendor/preact-hooks.js';
import { getImageUrl } from '../api.js';
import { CollapsibleSection } from './CollapsibleSection.js';

// Component that renders HTML content in an isolated Shadow DOM
function IsolatedHtml({ content }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !content) return;

        // Clear any existing shadow root content
        if (containerRef.current.shadowRoot) {
            containerRef.current.shadowRoot.innerHTML = '';
        }

        // Create shadow root if it doesn't exist
        const shadow = containerRef.current.shadowRoot ||
                       containerRef.current.attachShadow({ mode: 'open' });

        // Base styles for the shadow DOM content
        const baseStyles = `
            <style>
                :host {
                    display: block;
                    max-height: 200px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    color: #d1d5db;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    isolation: isolate;
                }
                * {
                    max-width: 100%;
                    box-sizing: border-box;
                }
                a { color: #a78bfa; }
                img { max-width: 100%; height: auto; }
            </style>
        `;

        shadow.innerHTML = baseStyles + content;
    }, [content]);

    return html`<div ref=${containerRef} class="overflow-auto relative isolate"></div>`;
}

// Check if content looks like HTML
function containsHtml(text) {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
}

// Escape HTML utility function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

export function CharacterModal({
    selectedCharacter,
    selectedCharacterTags,
    closeModal,
    downloadCard,
    downloadCardPng,
    searchAuthor,
    handleTagClick
}) {
    if (!selectedCharacter) return null;

    const def = selectedCharacter.definition;
    const tags = selectedCharacterTags;

    // Get token count with fallback
    const tokens = selectedCharacter.character?.data?.nTokens || 
                   def?.metadata?.totalTokens || 
                   null;

    // Determine which section should be open by default
    const hasCreatorNotes = !!def.definition?.data?.creator_notes;
    const hasTagline = !!def.tagline;
    const hasFirstMessage = !!(def.definition?.data?.first_mes || def.definition?.first_mes);

    return html`
        <div
            id="characterModal"
            class="modal fixed inset-0 bg-black/80 z-50 items-center justify-center p-4 overflow-auto active"
            onClick=${(e) => e.target === e.currentTarget && closeModal()}
        >
            <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div class="sticky z-10 top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 class="text-xl font-bold">${def.name || 'Character'}</h2>
                    <button
                        onClick=${closeModal}
                        class="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div class="p-4">
                    <div class="grid md:grid-cols-3 gap-6">
                        <div>
                            <img
                                src=${getImageUrl(def.image_hash)}
                                alt=${escapeHtml(def.name)}
                                class="w-full rounded-lg"
                                onError=${(e) => e.target.style.display = 'none'}
                            />
                            <div class="mt-4 space-y-2 text-sm">
                                <p>
                                    <span class="text-gray-400">Author:</span>
                                    <a
                                        href="#"
                                        onClick=${(e) => {
                                            e.preventDefault();
                                            searchAuthor(selectedCharacter.source, escapeHtml(def.author || ''));
                                        }}
                                        class="text-purple-400 hover:underline"
                                    >
                                        ${escapeHtml(def.author || 'Unknown')}
                                    </a>
                                </p>
                                <p><span class="text-gray-400">Source:</span> ${selectedCharacter.source}</p>
                                <p><span class="text-gray-400">Added:</span> ${def.added ? new Date(def.added).toLocaleDateString() : 'Unknown'}</p>
                                <p><span class="text-gray-400">Tokens:</span> ${tokens ? tokens.toLocaleString() : 'N/A'}</p>
                            </div>
                            <div class="mt-4 space-y-2">
                                <button
                                    onClick=${() => downloadCardPng(selectedCharacter.source, selectedCharacter.id)}
                                    class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                                >
                                    Download Card (PNG)
                                </button>
                                <button
                                    onClick=${() => downloadCard(selectedCharacter.source, selectedCharacter.id)}
                                    class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                                >
                                    Download JSON
                                </button>
                            </div>
                        </div>
                        <div class="md:col-span-2 space-y-4">
                            ${def.tagline ? html`
                                <${CollapsibleSection} title="Tagline" initiallyOpen=${!hasCreatorNotes}>
                                    <${IsolatedHtml} content=${def.tagline} />
                                </${CollapsibleSection}>
                            ` : ''}

                            ${tags.length > 0 ? html`
                                <${CollapsibleSection} title="Tags" initiallyOpen=${false}>
                                    <div class="flex flex-wrap gap-1">
                                        ${tags.map(tag => html`
                                            <span
                                                class="tag-chip px-2 py-1 bg-gray-700 hover:bg-purple-600 rounded text-xs"
                                                onClick=${() => {
                                                    closeModal();
                                                    handleTagClick(escapeHtml(tag.name));
                                                }}
                                            >
                                                ${escapeHtml(tag.name)}
                                                <span class="text-gray-500 ml-1">(${tag.count})</span>
                                            </span>
                                        `)}
                                    </div>
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.creator_notes || def.definition?.creator_notes) ? html`
                                <${CollapsibleSection} title="Creator Notes" initiallyOpen=${true}>
                                    ${containsHtml(def.definition?.data?.creator_notes || def.definition?.creator_notes) ? html`
                                        <${IsolatedHtml} content=${def.definition?.data?.creator_notes || def.definition?.creator_notes} />
                                    ` : html`
                                        <p class="text-gray-300 whitespace-pre-wrap text-sm">
                                            ${escapeHtml(def.definition?.data?.creator_notes || def.definition?.creator_notes || '')}
                                        </p>
                                    `}
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.description || def.definition?.description) ? html`
                                <${CollapsibleSection} title="Description" initiallyOpen=${false}>
                                    <p class="text-gray-300 whitespace-pre-wrap text-sm">
                                        ${escapeHtml(def.definition?.data?.description || def.definition?.description || '')}
                                    </p>
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.personality || def.definition?.personality) ? html`
                                <${CollapsibleSection} title="Personality" initiallyOpen=${false}>
                                    <p class="text-gray-300 whitespace-pre-wrap text-sm">
                                        ${escapeHtml(def.definition?.data?.personality || def.definition?.personality || '')}
                                    </p>
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.first_mes || def.definition?.first_mes) ? html`
                                <${CollapsibleSection} title="First Message" initiallyOpen=${!hasCreatorNotes && !hasTagline}>
                                    <p class="text-gray-300 whitespace-pre-wrap text-sm bg-gray-900 p-3 rounded">
                                        ${escapeHtml(def.definition?.data?.first_mes || def.definition?.first_mes || '')}
                                    </p>
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.scenario || def.definition?.scenario) ? html`
                                <${CollapsibleSection} title="Scenario" initiallyOpen=${false}>
                                    <p class="text-gray-300 whitespace-pre-wrap text-sm">
                                        ${escapeHtml(def.definition?.data?.scenario || def.definition?.scenario || '')}
                                    </p>
                                </${CollapsibleSection}>
                            ` : null}

                            ${(def.definition?.data?.mes_example || def.definition?.mes_example) ? html`
                                <${CollapsibleSection} title="Example Messages" initiallyOpen=${false}>
                                    <pre class="text-gray-300 whitespace-pre-wrap text-sm bg-gray-900 p-3 rounded overflow-auto max-h-64">
                                        ${escapeHtml(def.definition?.data?.mes_example || def.definition?.mes_example || '')}
                                    </pre>
                                </${CollapsibleSection}>
                            ` : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}