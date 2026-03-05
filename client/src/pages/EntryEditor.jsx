/**
 * client/src/pages/EntryEditor.jsx
 * Rich entry editor with Tiptap, metadata sidebar, autosave.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import { entries as entriesApi, tags as tagsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

/** Toolbar button helper */
const TB = ({ active, onClick, children, title }) => (
    <button className={`toolbar-btn ${active ? 'active' : ''}`} onClick={onClick} title={title}>{children}</button>
);

const pad = (value) => String(value).padStart(2, '0');

const isoToLocalDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const localDateTimeToIso = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

export default function EntryEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isNew = !id;

    const [entry, setEntry] = useState({ title: '', status: 'draft', excerpt: '', mood: '', location: '', weather: '', cover_image: '', featured: false });
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!isNew);
    const [entryDate, setEntryDate] = useState('');
    const autosaveRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: true }),
            Underline,
            Link.configure({ openOnClick: false }),
            ImageExt.configure({ inline: false }),
            Placeholder.configure({ placeholder: 'Start writing...' }),
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
            CharacterCount,
        ],
        content: '',
        editorProps: {
            attributes: { class: 'editor-area' },
        },
    });

    // Load entry data if editing
    useEffect(() => {
        const loadData = async () => {
            const tagData = await tagsApi.list();
            setAllTags(tagData);

            if (!isNew) {
                const e = await entriesApi.get(id);
                setEntry(e);
                setEntryDate(isoToLocalDateTime(e.published_at));
                setSelectedTags((e.tags || []).map(t => t.id));
                if (editor) editor.commands.setContent(e.content_html || e.content || '');
                setLoading(false);
            }
        };
        loadData().catch(console.error);
    }, [id, isNew, editor]);

    const handleSave = useCallback(async (silent = false) => {
        if (!editor) return;
        setSaving(true);
        try {
            const content_html = editor.getHTML();
            const content = editor.getText();
            const payload = {
                ...entry,
                content,
                content_html,
                published_at: localDateTimeToIso(entryDate),
            };
            delete payload.id; delete payload.tags; delete payload.created_at; delete payload.updated_at;

            let saved;
            if (isNew) {
                saved = await entriesApi.create(payload);
                await entriesApi.updateTags(saved.id, selectedTags);
                toast.success('Entry created');
                navigate(`/admin/entries/${saved.id}/edit`, { replace: true });
            } else {
                saved = await entriesApi.update(id, payload);
                await entriesApi.updateTags(id, selectedTags);
                if (!silent) toast.success('Saved');
            }
            setEntry(saved);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, [editor, entry, selectedTags, id, isNew, navigate, toast]);

    // Autosave every 30 seconds (only for existing entries)
    useEffect(() => {
        if (isNew || !editor) return;
        autosaveRef.current = setInterval(() => {
            handleSave(true);
        }, 30000);
        return () => clearInterval(autosaveRef.current);
    }, [isNew, editor, handleSave]);

    // Keyboard shortcut (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const handlePublish = async () => {
        if (!entryDate) {
            setEntryDate(isoToLocalDateTime(new Date().toISOString()));
        }
        setEntry((prev) => ({ ...prev, status: 'published' }));
        setTimeout(() => handleSave(), 100);
    };

    const toggleTag = (tagId) => {
        setSelectedTags((prev) => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    const wordCount = editor?.storage.characterCount.words() || 0;
    const charCount = editor?.storage.characterCount.characters() || 0;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{isNew ? 'New Entry' : 'Edit Entry'}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleSave()} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button className="btn btn-primary" onClick={handlePublish} disabled={saving}>Publish</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Editor Column */}
                <div>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Entry title..."
                        value={entry.title}
                        onChange={(e) => setEntry({ ...entry, title: e.target.value })}
                        style={{ marginBottom: '1rem', fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}
                    />

                    <div className="editor-container">
                        {editor && (
                            <div className="editor-toolbar">
                                <TB active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><b>B</b></TB>
                                <TB active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><i>I</i></TB>
                                <TB active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></TB>
                                <TB active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></TB>
                                <div className="toolbar-divider" />
                                <TB active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</TB>
                                <TB active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</TB>
                                <div className="toolbar-divider" />
                                <TB active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">•</TB>
                                <TB active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">1.</TB>
                                <TB active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task List">☑</TB>
                                <div className="toolbar-divider" />
                                <TB active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">❝</TB>
                                <TB active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">{'<>'}</TB>
                                <TB active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">⚑</TB>
                                <div className="toolbar-divider" />
                                <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">—</TB>
                                <TB onClick={() => {
                                    const url = prompt('Image URL:');
                                    if (url) editor.chain().focus().setImage({ src: url }).run();
                                }} title="Insert Image">🖼</TB>
                                <TB onClick={() => {
                                    const url = prompt('Link URL:');
                                    if (url) editor.chain().focus().setLink({ href: url }).run();
                                }} title="Insert Link">🔗</TB>
                            </div>
                        )}
                        <EditorContent editor={editor} />
                        <div className="editor-status">
                            <span>{wordCount} words · {charCount} characters</span>
                            <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                        </div>
                    </div>
                </div>

                {/* Metadata Sidebar */}
                <div>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <h3 className="card-title">Details</h3>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={entry.status} onChange={(e) => setEntry({ ...entry, status: e.target.value })}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Entry Date</label>
                            <input
                                className="form-input"
                                type="datetime-local"
                                value={entryDate}
                                onChange={(e) => setEntryDate(e.target.value)}
                            />
                            <div style={{ marginTop: '0.4rem' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEntryDate('')}>Clear Date</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Excerpt</label>
                            <textarea className="form-textarea" rows={3} value={entry.excerpt || ''} onChange={(e) => setEntry({ ...entry, excerpt: e.target.value })} placeholder="Brief summary..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cover Image URL</label>
                            <input className="form-input" type="text" value={entry.cover_image || ''} onChange={(e) => setEntry({ ...entry, cover_image: e.target.value })} placeholder="/uploads/..." />
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <h3 className="card-title">Metadata</h3>
                        <div className="form-group">
                            <label className="form-label">Mood</label>
                            <input className="form-input" type="text" value={entry.mood || ''} onChange={(e) => setEntry({ ...entry, mood: e.target.value })} placeholder="e.g. reflective" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" type="text" value={entry.location || ''} onChange={(e) => setEntry({ ...entry, location: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Weather</label>
                            <input className="form-input" type="text" value={entry.weather || ''} onChange={(e) => setEntry({ ...entry, weather: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!entry.featured} onChange={(e) => setEntry({ ...entry, featured: e.target.checked })} />
                                <span className="form-label" style={{ margin: 0 }}>Featured</span>
                            </label>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Tags</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {allTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    className={`tag-chip`}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedTags.includes(tag.id) ? 'rgba(201,168,76,0.25)' : undefined,
                                        borderColor: selectedTags.includes(tag.id) ? 'var(--accent)' : undefined,
                                    }}
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    {tag.name}
                                </button>
                            ))}
                            {allTags.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>No tags yet</span>}
                        </div>
                        <div style={{ marginTop: '0.8rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type a new tag and press Enter..."
                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        e.preventDefault();
                                        try {
                                            const newTag = await tagsApi.create({ name: e.target.value.trim() });
                                            setAllTags((prev) => [...prev, newTag]);
                                            setSelectedTags((prev) => [...prev, newTag.id]);
                                            e.target.value = '';
                                        } catch (err) {
                                            toast.error(err.message);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
