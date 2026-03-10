/**
 * AutocompleteTextarea — drop-in <textarea> replacement with AI ghost-text.
 * Works like the TipTap AutocompletePlugin but for plain textareas.
 *
 * Usage:
 *   <AutocompleteTextarea value={val} onChange={handler} rows={3} className="form-textarea" />
 *
 * Accept with Tab, dismiss with Escape. Ghost text appears after a typing pause.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { assistant } from '../api.js';

const DEBOUNCE_MS = 400;
const MIN_CONTEXT_LENGTH = 8;

export default function AutocompleteTextarea({ value, onChange, className, ...rest }) {
    const [suggestion, setSuggestion] = useState('');
    const textareaRef = useRef(null);
    const debounceRef = useRef(null);
    const requestIdRef = useRef(0);

    // Clear suggestion whenever value changes externally
    useEffect(() => {
        setSuggestion('');
    }, [value]);

    const fetchSuggestion = useCallback((text) => {
        clearTimeout(debounceRef.current);

        if (text.trim().length < MIN_CONTEXT_LENGTH) {
            setSuggestion('');
            return;
        }

        const currentId = ++requestIdRef.current;

        debounceRef.current = setTimeout(async () => {
            try {
                const { suggestion: result } = await assistant.autocomplete({
                    context: text.slice(-600),
                });
                if (currentId !== requestIdRef.current) return;
                setSuggestion(result || '');
            } catch {
                // Silently ignore — no key, server down, etc.
            }
        }, DEBOUNCE_MS);
    }, []);

    const handleChange = useCallback((e) => {
        onChange(e);
        fetchSuggestion(e.target.value);
    }, [onChange, fetchSuggestion]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            // Build a synthetic event with the accepted suggestion
            const textarea = textareaRef.current;
            if (!textarea) return;
            const cursorPos = textarea.selectionStart;
            const before = (value || '').slice(0, cursorPos);
            const after = (value || '').slice(cursorPos);
            const newValue = before + suggestion + after;
            // Fire onChange with a synthetic-ish event
            const syntheticEvent = {
                target: { value: newValue, name: textarea.name },
                currentTarget: { value: newValue, name: textarea.name },
            };
            setSuggestion('');
            onChange(syntheticEvent);
            // Move cursor to end of inserted text
            requestAnimationFrame(() => {
                const newPos = cursorPos + suggestion.length;
                textarea.setSelectionRange(newPos, newPos);
                textarea.focus();
            });
        } else if (e.key === 'Escape' && suggestion) {
            e.preventDefault();
            setSuggestion('');
        }
    }, [suggestion, value, onChange]);

    const handleBlur = useCallback(() => {
        clearTimeout(debounceRef.current);
        requestIdRef.current++;
        setSuggestion('');
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(debounceRef.current);
            requestIdRef.current++;
        };
    }, []);

    // Build the visible ghost text: show current value + faded suggestion
    const cursorPos = textareaRef.current?.selectionStart ?? (value || '').length;
    const ghostBefore = (value || '').slice(0, cursorPos);
    const ghostAfter = (value || '').slice(cursorPos);

    return (
        <div className="autocomplete-textarea-wrap">
            <textarea
                {...rest}
                ref={textareaRef}
                className={className}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
            />
            {suggestion && (
                <div className="autocomplete-textarea-ghost" aria-hidden="true">
                    <span className="ghost-existing">{ghostBefore}</span>
                    <span className="ghost-suggestion">{suggestion}</span>
                    <span className="ghost-existing">{ghostAfter}</span>
                </div>
            )}
        </div>
    );
}
