/**
 * ResizableImageView — TipTap NodeViewWrapper for resizable images.
 * Renders alignment, selection highlight, and a drag handle at bottom-right.
 */
import React, { useCallback, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default function ResizableImageView({ node, updateAttributes, selected }) {
    const { src, alt, align, width } = node.attrs;
    const frameRef = useRef(null);
    const startX = useRef(0);
    const startW = useRef(0);

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        const frame = frameRef.current;
        if (!frame) return;
        startX.current = e.clientX;
        startW.current = frame.offsetWidth;

        const onMove = (ev) => {
            const delta = ev.clientX - startX.current;
            const next = Math.max(60, startW.current + delta);
            frame.style.width = `${next}px`;
        };

        const onUp = (ev) => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            const delta = ev.clientX - startX.current;
            const next = Math.max(60, startW.current + delta);
            updateAttributes({ width: next });
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }, [updateAttributes]);

    const style = width ? { width: `${width}px` } : {};

    return (
        <NodeViewWrapper
            className={`journal-image-node${selected ? ' is-selected' : ''}`}
            data-align={align || 'center'}
        >
            <div className="journal-image-frame" ref={frameRef} style={style}>
                <img src={src} alt={alt || ''} draggable={false} />
                {selected && (
                    <div
                        className="journal-image-resize-handle"
                        onPointerDown={onPointerDown}
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
}
