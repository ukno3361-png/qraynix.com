/**
 * AutocompletePlugin — TipTap extension that shows AI ghost-text completions.
 * Triggers on typing pause (300ms debounce). Accept with Tab, dismiss on Escape or any edit.
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { assistant } from '../../api.js';

const pluginKey = new PluginKey('autocomplete');
const DEBOUNCE_MS = 300;
const MIN_CONTEXT_LENGTH = 8;

export const Autocomplete = Extension.create({
    name: 'autocomplete',

    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => {
                const pluginState = pluginKey.getState(editor.state);
                if (!pluginState?.suggestion) return false;
                editor.commands.insertContent(pluginState.suggestion);
                return true;
            },
            Escape: ({ editor }) => {
                const pluginState = pluginKey.getState(editor.state);
                if (!pluginState?.suggestion) return false;
                editor.view.dispatch(
                    editor.state.tr.setMeta(pluginKey, { suggestion: '', pos: 0 }),
                );
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        let debounceTimer = null;
        let requestId = 0;

        return [
            new Plugin({
                key: pluginKey,

                state: {
                    init() {
                        return { suggestion: '', pos: 0 };
                    },
                    apply(tr, prev) {
                        const meta = tr.getMeta(pluginKey);
                        if (meta !== undefined) return meta;
                        if (tr.docChanged) {
                            return { suggestion: '', pos: 0 };
                        }
                        return prev;
                    },
                },

                props: {
                    decorations(state) {
                        const { suggestion, pos } = pluginKey.getState(state);
                        if (!suggestion || !pos) return DecorationSet.empty;

                        const widget = Decoration.widget(pos, () => {
                            const span = document.createElement('span');
                            span.className = 'ai-ghost-text';
                            span.textContent = suggestion;
                            return span;
                        }, { side: 1 });

                        return DecorationSet.create(state.doc, [widget]);
                    },
                },

                view() {
                    const fetchSuggestion = (editorView, prevState) => {
                        // Only trigger on doc changes (typing), not on cursor moves or meta dispatches
                        if (prevState && editorView.state.doc.eq(prevState.doc)) return;

                        // Skip if this update was from our own suggestion dispatch
                        const pluginState = pluginKey.getState(editorView.state);
                        if (pluginState?.suggestion) return;

                        clearTimeout(debounceTimer);

                        const { state } = editorView;
                        const { from, empty } = state.selection;
                        if (!empty) return;

                        const textBefore = state.doc.textBetween(
                            Math.max(0, from - 500), from, '\n',
                        );

                        if (textBefore.trim().length < MIN_CONTEXT_LENGTH) return;

                        const currentId = ++requestId;

                        debounceTimer = setTimeout(async () => {
                            try {
                                const { suggestion } = await assistant.autocomplete({
                                    context: textBefore,
                                });

                                if (currentId !== requestId) return;
                                if (!suggestion) return;

                                // Verify editor hasn't changed since request
                                const currentState = editorView.state;
                                const currentFrom = currentState.selection.from;
                                const currentText = currentState.doc.textBetween(
                                    Math.max(0, currentFrom - 500), currentFrom, '\n',
                                );
                                if (currentText !== textBefore) return;

                                editorView.dispatch(
                                    currentState.tr.setMeta(pluginKey, {
                                        suggestion,
                                        pos: currentFrom,
                                    }),
                                );
                            } catch (_err) {
                                // Silently ignore
                            }
                        }, DEBOUNCE_MS);
                    };

                    return {
                        update: fetchSuggestion,
                        destroy() {
                            clearTimeout(debounceTimer);
                            requestId++;
                        },
                    };
                },
            }),
        ];
    },
});
