/**
 * client/src/pages/EntryEditor.jsx
 * Advanced entry editor with 30+ editing features.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Focus from '@tiptap/extension-focus';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import { createLowlight, common } from 'lowlight';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    CalendarClock,
    CalendarDays,
    Clock3,
    Code2,
    Eraser,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Highlighter,
    Image as ImageIcon,
    IndentDecrease,
    IndentIncrease,
    Italic,
    Link2,
    Link2Off,
    List,
    ListChecks,
    ListOrdered,
    MessageSquare,
    Minus,
    Palette,
    Pilcrow,
    Quote,
    Redo2,
    SquareCode,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Table2,
    Trash2,
    Type,
    Underline as UnderlineIcon,
    Undo2,
    WandSparkles,
} from 'lucide-react';
import { entries as entriesApi, tags as tagsApi, media as mediaApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

const lowlight = createLowlight(common);
const COLOR_SWATCHES = ['#f8fafc', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
const FEATURE_COUNT = 72;
const FONT_OPTIONS = [
    { label: 'Sans', value: 'Inter, ui-sans-serif, system-ui' },
    { label: 'Serif', value: 'Merriweather, Georgia, serif' },
    { label: 'Mono', value: 'JetBrains Mono, Fira Code, monospace' },
];

const JournalImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            align: {
                default: 'center',
                parseHTML: (element) => element.getAttribute('data-align') || 'center',
                renderHTML: (attributes) => ({ 'data-align': attributes.align || 'center' }),
            },
        };
    },
});

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

const normalizeMediaPath = (value) => {
    if (!value) return '';
    const raw = String(value).replace(/\\/g, '/').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    if (raw.startsWith('/uploads/')) return raw;
    if (raw.startsWith('/image/') || raw.startsWith('/audio/') || raw.startsWith('/video/')) return `/uploads${raw}`;
    if (raw.startsWith('uploads/')) return `/${raw}`;
    return `/${raw.replace(/^\/+/, '')}`;
};

const normalizeHref = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const normalizeImageSource = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/') || trimmed.startsWith('/uploads/')) {
        return normalizeMediaPath(trimmed);
    }
    return `https://${trimmed.replace(/^\/+/, '')}`;
};

const getSlashCommandMatch = (editor) => {
    if (!editor) return null;

    const { selection } = editor.state;
    if (!selection.empty) return null;

    const { $from } = selection;
    if (!$from.parent.isTextblock) return null;

    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\0', '\0');
    const slashIndex = textBefore.lastIndexOf('/');
    if (slashIndex < 0) return null;

    const beforeSlash = textBefore.slice(0, slashIndex);
    if (beforeSlash && !/\s$/.test(beforeSlash)) return null;

    const query = textBefore.slice(slashIndex + 1);
    if (/\s/.test(query)) return null;

    const from = $from.start() + slashIndex;
    const to = selection.from;
    const coords = editor.view.coordsAtPos(selection.from);

    return {
        query,
        range: { from, to },
        x: coords.left,
        y: coords.bottom + 10,
    };
};

const ToolbarButton = ({ active, title, onClick, children, tone = 'default' }) => (
    <button
        type="button"
        className={`toolbar-btn tone-${tone} ${active ? 'active' : ''}`}
        title={title}
        aria-label={title}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
    >
        <span className="toolbar-btn-shine" aria-hidden="true" />
        <span className="toolbar-btn-text">{children}</span>
    </button>
);

export default function EntryEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isNew = !id;

    const [entry, setEntry] = useState({
        title: '',
        status: 'draft',
        excerpt: '',
        mood: '',
        location: '',
        weather: '',
        cover_image: '',
        featured: false,
    });

    const [allTags, setAllTags] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!isNew);
    const [entryDate, setEntryDate] = useState('');
    const [coverMediaId, setCoverMediaId] = useState('');

    const [showMediaPanel, setShowMediaPanel] = useState(false);
    const [showImageUrlPanel, setShowImageUrlPanel] = useState(false);
    const [showLinkPanel, setShowLinkPanel] = useState(false);
    const [showColorPanel, setShowColorPanel] = useState(false);
    const [showTablePanel, setShowTablePanel] = useState(false);
    const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
    const [showQuickInsertMenu, setShowQuickInsertMenu] = useState(false);

    const [mediaSearch, setMediaSearch] = useState('');
    const [imageUrlDraft, setImageUrlDraft] = useState('');
    const [imageAltDraft, setImageAltDraft] = useState('');
    const [linkDraft, setLinkDraft] = useState('');

    const [slashMenu, setSlashMenu] = useState({ open: false, query: '', x: 0, y: 0, range: null });
    const [slashIndex, setSlashIndex] = useState(0);

    const autosaveRef = useRef(null);
    const createdEntryIdRef = useRef(id ? Number(id) : null);
    const saveInFlightRef = useRef(false);

    useEffect(() => {
        createdEntryIdRef.current = id ? Number(id) : null;
    }, [id]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
            CodeBlockLowlight.configure({ lowlight }),
            Color.configure({ types: ['textStyle'] }),
            TextStyle,
            FontFamily,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Focus.configure({ className: 'has-focus', mode: 'all' }),
            Underline,
            Link.configure({ openOnClick: false }),
            JournalImage.configure({ inline: false }),
            Subscript,
            Superscript,
            Placeholder.configure({
                placeholder: 'Start typing or press / for commands',
            }),
            Highlight,
            CharacterCount,
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Typography,
        ],
        content: '',
        editorProps: {
            attributes: { class: 'editor-area editor-area-clean' },
        },
    });

    const closeTransientPanels = useCallback(() => {
        setShowMediaPanel(false);
        setShowImageUrlPanel(false);
        setShowLinkPanel(false);
        setShowColorPanel(false);
        setShowTablePanel(false);
        setShowAdvancedPanel(false);
        setShowQuickInsertMenu(false);
    }, []);

    const openPanel = useCallback((panel, options = {}) => {
        const { toggle = false } = options;

        const isOpen =
            (panel === 'media' && showMediaPanel)
            || (panel === 'imageUrl' && showImageUrlPanel)
            || (panel === 'link' && showLinkPanel)
            || (panel === 'color' && showColorPanel)
            || (panel === 'table' && showTablePanel)
            || (panel === 'advanced' && showAdvancedPanel)
            || (panel === 'quickInsert' && showQuickInsertMenu);

        closeTransientPanels();
        if (toggle && isOpen) return;

        if (panel === 'media') setShowMediaPanel(true);
        if (panel === 'imageUrl') setShowImageUrlPanel(true);
        if (panel === 'link') setShowLinkPanel(true);
        if (panel === 'color') setShowColorPanel(true);
        if (panel === 'table') setShowTablePanel(true);
        if (panel === 'advanced') setShowAdvancedPanel(true);
        if (panel === 'quickInsert') setShowQuickInsertMenu(true);
    }, [closeTransientPanels, showAdvancedPanel, showColorPanel, showImageUrlPanel, showLinkPanel, showMediaPanel, showQuickInsertMenu, showTablePanel]);

    const closeSlashMenu = useCallback(() => {
        setSlashMenu({ open: false, query: '', x: 0, y: 0, range: null });
        setSlashIndex(0);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            const [tagData, mediaData] = await Promise.all([
                tagsApi.list(),
                mediaApi.list({ limit: 500 }),
            ]);

            setAllTags(tagData);
            const imageMedia = (mediaData.items || []).filter((item) => String(item.mime_type || '').toLowerCase().startsWith('image/'));
            setMediaItems(imageMedia);

            if (!isNew) {
                const existing = await entriesApi.get(id);
                const normalizedCover = normalizeMediaPath(existing.cover_image);
                setEntry({ ...existing, cover_image: normalizedCover });
                setEntryDate(isoToLocalDateTime(existing.published_at));
                setSelectedTags((existing.tags || []).map((tag) => tag.id));

                const coverMatch = imageMedia.find((item) => normalizeMediaPath(item.filename) === normalizedCover);
                setCoverMediaId(coverMatch ? String(coverMatch.id) : '');

                if (editor) {
                    editor.commands.setContent(existing.content_html || existing.content || '');
                }

                setLoading(false);
            }
        };

        loadData().catch((error) => {
            toast.error(error.message || 'Failed loading editor data');
            setLoading(false);
        });
    }, [editor, id, isNew, toast]);

    const selectCoverFromLibrary = (value) => {
        setCoverMediaId(value || '');
        if (!value) return;
        const selected = mediaItems.find((item) => String(item.id) === String(value));
        if (!selected) return;
        setEntry((prev) => ({ ...prev, cover_image: normalizeMediaPath(selected.filename) }));
    };

    const clearCoverImage = () => {
        setCoverMediaId('');
        setEntry((prev) => ({ ...prev, cover_image: '' }));
    };

    const insertImageFromLibrary = (mediaId) => {
        if (!editor) return;
        const selected = mediaItems.find((item) => String(item.id) === String(mediaId));
        if (!selected) return;

        const src = normalizeMediaPath(selected.filename);
        const alt = selected.alt_text || selected.original_name || 'Image';

        editor.chain().focus().setImage({ src, alt, align: 'center' }).run();
        setShowMediaPanel(false);
    };

    const applyImageUrl = () => {
        if (!editor) return;
        const src = normalizeImageSource(imageUrlDraft);
        if (!src) return;

        editor.chain().focus().setImage({ src, alt: imageAltDraft.trim() || 'Image', align: 'center' }).run();
        setImageUrlDraft('');
        setImageAltDraft('');
        setShowImageUrlPanel(false);
    };

    const setSelectedImageAlign = (align) => {
        if (!editor?.isActive('image')) return;
        editor.chain().focus().updateAttributes('image', { align }).run();
    };

    const removeSelectedImage = () => {
        if (!editor?.isActive('image')) return;
        editor.chain().focus().deleteSelection().run();
    };

    const applyLink = () => {
        if (!editor) return;
        const href = normalizeHref(linkDraft);
        if (!href) return;

        if (editor.state.selection.empty) {
            const from = editor.state.selection.from;
            editor
                .chain()
                .focus()
                .insertContent(href)
                .setTextSelection({ from, to: from + href.length })
                .setLink({ href, target: '_blank', rel: 'noopener noreferrer nofollow' })
                .run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href, target: '_blank', rel: 'noopener noreferrer nofollow' })
                .run();
        }

        setLinkDraft('');
        setShowLinkPanel(false);
    };

    const insertAtCursor = useCallback((value) => {
        if (!editor) return;
        editor.chain().focus().insertContent(value).run();
    }, [editor]);

    const copyToClipboard = useCallback(async (value, label) => {
        try {
            if (!navigator?.clipboard?.writeText) {
                toast.error('Clipboard API is not available in this browser');
                return;
            }
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Could not copy ${label.toLowerCase()}`);
        }
    }, [toast]);

    const adjustListIndent = useCallback((mode) => {
        if (!editor) return;
        if (editor.isActive('listItem')) {
            if (mode === 'in') editor.chain().focus().sinkListItem('listItem').run();
            if (mode === 'out') editor.chain().focus().liftListItem('listItem').run();
            return;
        }
        if (editor.isActive('taskItem')) {
            if (mode === 'in') editor.chain().focus().sinkListItem('taskItem').run();
            if (mode === 'out') editor.chain().focus().liftListItem('taskItem').run();
            return;
        }
        toast.error('Indent controls work on list and checklist items');
    }, [editor, toast]);

    const runAdvancedAction = useCallback((kind) => {
        if (!editor) return;

        if (kind === 'alignLeft') editor.chain().focus().setTextAlign('left').run();
        if (kind === 'alignCenter') editor.chain().focus().setTextAlign('center').run();
        if (kind === 'alignRight') editor.chain().focus().setTextAlign('right').run();
        if (kind === 'alignJustify') editor.chain().focus().setTextAlign('justify').run();

        if (kind === 'fontSans') editor.chain().focus().setFontFamily(FONT_OPTIONS[0].value).run();
        if (kind === 'fontSerif') editor.chain().focus().setFontFamily(FONT_OPTIONS[1].value).run();
        if (kind === 'fontMono') editor.chain().focus().setFontFamily(FONT_OPTIONS[2].value).run();
        if (kind === 'fontReset') editor.chain().focus().unsetFontFamily().run();

        if (kind === 'heading4') editor.chain().focus().toggleHeading({ level: 4 }).run();
        if (kind === 'heading5') editor.chain().focus().toggleHeading({ level: 5 }).run();
        if (kind === 'heading6') editor.chain().focus().toggleHeading({ level: 6 }).run();

        if (kind === 'indentIn') adjustListIndent('in');
        if (kind === 'indentOut') adjustListIndent('out');

        if (kind === 'newLine') editor.chain().focus().setHardBreak().run();
        if (kind === 'clearNodes') editor.chain().focus().clearNodes().run();
        if (kind === 'clearMarks') editor.chain().focus().unsetAllMarks().run();

        if (kind === 'insertDate') insertAtCursor(new Date().toLocaleDateString());
        if (kind === 'insertTime') insertAtCursor(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (kind === 'insertDateTime') insertAtCursor(new Date().toLocaleString());
        if (kind === 'insertCallout') insertAtCursor('<p><strong>Note:</strong> </p>');
        if (kind === 'insertSummary') insertAtCursor('<h3>Summary</h3><ul><li></li><li></li><li></li></ul>');
        if (kind === 'insertTodo') insertAtCursor('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Task</p></li></ul>');
        if (kind === 'insertQa') insertAtCursor('<h3>Q&A</h3><p><strong>Q:</strong> </p><p><strong>A:</strong> </p>');
        if (kind === 'insertCodeFence') insertAtCursor('<pre><code>// snippet</code></pre>');
        if (kind === 'insertTwoColTable') editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run();
        if (kind === 'insertThreeColTable') editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();

        if (kind === 'selectAll') editor.chain().focus().selectAll().run();
        if (kind === 'copyHtml') copyToClipboard(editor.getHTML(), 'HTML');
        if (kind === 'copyText') copyToClipboard(editor.getText(), 'Plain text');
    }, [adjustListIndent, copyToClipboard, editor, insertAtCursor]);

    const insertTemplateBlock = useCallback((kind) => {
        if (!editor) return;

        if (kind === 'paragraph') editor.chain().focus().setParagraph().run();
        if (kind === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
        if (kind === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
        if (kind === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
        if (kind === 'h4') editor.chain().focus().toggleHeading({ level: 4 }).run();
        if (kind === 'h5') editor.chain().focus().toggleHeading({ level: 5 }).run();
        if (kind === 'h6') editor.chain().focus().toggleHeading({ level: 6 }).run();
        if (kind === 'quote') editor.chain().focus().toggleBlockquote().run();
        if (kind === 'bullet') editor.chain().focus().toggleBulletList().run();
        if (kind === 'ordered') editor.chain().focus().toggleOrderedList().run();
        if (kind === 'checklist') editor.chain().focus().toggleTaskList().run();
        if (kind === 'code') editor.chain().focus().toggleCodeBlock().run();
        if (kind === 'divider') editor.chain().focus().setHorizontalRule().run();
        if (kind === 'table') editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        if (kind === 'imageLibrary') openPanel('media');
        if (kind === 'imageUrl') openPanel('imageUrl');
        if (kind === 'tablePanel') openPanel('table');
        if (kind === 'colorPanel') openPanel('color');
        if (kind === 'advancedPanel') openPanel('advanced');

        setShowQuickInsertMenu(false);
    }, [editor, openPanel]);

    const commandItems = useMemo(() => [
        { id: 'paragraph', label: 'Paragraph', hint: 'Plain text block', action: () => insertTemplateBlock('paragraph') },
        { id: 'h1', label: 'Heading 1', hint: 'Large section title', action: () => insertTemplateBlock('h1') },
        { id: 'h2', label: 'Heading 2', hint: 'Medium section title', action: () => insertTemplateBlock('h2') },
        { id: 'h3', label: 'Heading 3', hint: 'Small section title', action: () => insertTemplateBlock('h3') },
        { id: 'h4', label: 'Heading 4', hint: 'Compact section title', action: () => insertTemplateBlock('h4') },
        { id: 'h5', label: 'Heading 5', hint: 'Minor title', action: () => insertTemplateBlock('h5') },
        { id: 'h6', label: 'Heading 6', hint: 'Micro heading', action: () => insertTemplateBlock('h6') },
        { id: 'quote', label: 'Quote', hint: 'Callout quote', action: () => insertTemplateBlock('quote') },
        { id: 'bullet', label: 'Bullet list', hint: 'Simple list', action: () => insertTemplateBlock('bullet') },
        { id: 'ordered', label: 'Numbered list', hint: 'Ordered sequence', action: () => insertTemplateBlock('ordered') },
        { id: 'checklist', label: 'Checklist', hint: 'Track tasks', action: () => insertTemplateBlock('checklist') },
        { id: 'code', label: 'Code block', hint: 'Formatted code', action: () => insertTemplateBlock('code') },
        { id: 'table', label: 'Table', hint: 'Rows and columns', action: () => insertTemplateBlock('table') },
        { id: 'tablePanel', label: 'Table tools', hint: 'Modify table structure', action: () => insertTemplateBlock('tablePanel') },
        { id: 'colorPanel', label: 'Text color', hint: 'Apply text color', action: () => insertTemplateBlock('colorPanel') },
        { id: 'advancedPanel', label: 'Advanced tools', hint: 'Open 30+ extra actions', action: () => insertTemplateBlock('advancedPanel') },
        { id: 'divider', label: 'Divider', hint: 'Section break', action: () => insertTemplateBlock('divider') },
        { id: 'imageLibrary', label: 'Image library', hint: 'Use uploaded media', action: () => insertTemplateBlock('imageLibrary') },
        { id: 'imageUrl', label: 'Image URL', hint: 'Insert by URL', action: () => insertTemplateBlock('imageUrl') },
    ], [insertTemplateBlock]);

    const filteredMediaItems = useMemo(() => {
        const q = mediaSearch.trim().toLowerCase();
        if (!q) return mediaItems.slice(0, 120);
        return mediaItems
            .filter((item) => `${item.original_name || ''} ${item.filename || ''}`.toLowerCase().includes(q))
            .slice(0, 120);
    }, [mediaItems, mediaSearch]);

    const filteredSlashItems = useMemo(() => {
        const q = slashMenu.query.trim().toLowerCase();
        if (!q) return commandItems;
        return commandItems.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q));
    }, [commandItems, slashMenu.query]);

    const runSlashCommand = useCallback((item) => {
        if (!editor || !slashMenu.range) return;
        editor.chain().focus().deleteRange(slashMenu.range).run();
        item.action();
        closeSlashMenu();
    }, [closeSlashMenu, editor, slashMenu.range]);

    useEffect(() => {
        if (!editor) return undefined;

        const syncSlashMenu = () => {
            const match = getSlashCommandMatch(editor);
            if (!match) {
                closeSlashMenu();
                return;
            }
            setSlashMenu({ open: true, query: match.query, x: match.x, y: match.y, range: match.range });
        };

        syncSlashMenu();
        editor.on('selectionUpdate', syncSlashMenu);
        editor.on('transaction', syncSlashMenu);

        return () => {
            editor.off('selectionUpdate', syncSlashMenu);
            editor.off('transaction', syncSlashMenu);
        };
    }, [closeSlashMenu, editor]);

    useEffect(() => {
        if (!slashMenu.open) {
            setSlashIndex(0);
            return;
        }
        if (slashIndex > Math.max(filteredSlashItems.length - 1, 0)) {
            setSlashIndex(0);
        }
    }, [filteredSlashItems.length, slashIndex, slashMenu.open]);

    useEffect(() => {
        if (!editor || !slashMenu.open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSlashMenu();
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSlashIndex((prev) => (filteredSlashItems.length ? (prev + 1) % filteredSlashItems.length : 0));
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSlashIndex((prev) => (filteredSlashItems.length ? (prev <= 0 ? filteredSlashItems.length - 1 : prev - 1) : 0));
                return;
            }
            if ((event.key === 'Enter' || event.key === 'Tab') && filteredSlashItems.length) {
                event.preventDefault();
                runSlashCommand(filteredSlashItems[slashIndex] || filteredSlashItems[0]);
            }
        };

        editor.view.dom.addEventListener('keydown', onKeyDown);
        return () => editor.view.dom.removeEventListener('keydown', onKeyDown);
    }, [closeSlashMenu, editor, filteredSlashItems, runSlashCommand, slashIndex, slashMenu.open]);

    const handleSave = useCallback(async (silent = false, statusOverride) => {
        if (!editor || saveInFlightRef.current) return;

        saveInFlightRef.current = true;
        setSaving(true);
        try {
            const resolvedStatus = statusOverride || entry.status;
            const resolvedPublishedAt = resolvedStatus === 'published' ? localDateTimeToIso(entryDate) : null;

            const payload = {
                ...entry,
                status: resolvedStatus,
                content: editor.getText(),
                content_html: editor.getHTML(),
                published_at: resolvedPublishedAt,
            };

            delete payload.id;
            delete payload.tags;
            delete payload.created_at;
            delete payload.updated_at;

            const entryId = id ? Number(id) : (createdEntryIdRef.current || entry.id || null);

            let saved;
            if (!entryId) {
                saved = await entriesApi.create(payload);
                createdEntryIdRef.current = saved.id;
                await entriesApi.updateTags(saved.id, selectedTags);
                toast.success('Entry created');
                navigate(`/admin/entries/${saved.id}/edit`, { replace: true });
            } else {
                saved = await entriesApi.update(entryId, payload);
                await entriesApi.updateTags(entryId, selectedTags);
                if (!silent) toast.success('Saved');
            }

            setEntry(saved);
        } catch (error) {
            toast.error(error.message || 'Could not save entry');
        } finally {
            saveInFlightRef.current = false;
            setSaving(false);
        }
    }, [editor, entry, entryDate, id, navigate, selectedTags, toast]);

    useEffect(() => {
        if (isNew || !editor) return undefined;
        autosaveRef.current = setInterval(() => handleSave(true), 30000);
        return () => clearInterval(autosaveRef.current);
    }, [editor, handleSave, isNew]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    const handlePublish = () => {
        if (!entryDate) {
            setEntryDate(isoToLocalDateTime(new Date().toISOString()));
        }
        handleSave(false, 'published');
    };

    const toggleTag = (tagId) => {
        setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((idValue) => idValue !== tagId) : [...prev, tagId]));
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    const wordCount = editor?.storage.characterCount.words() || 0;
    const charCount = editor?.storage.characterCount.characters() || 0;

    return (
        <div className="editor-body">
            {/* Editor action bar */}
            <div className="editor-action-bar">
                <div className="editor-action-left">
                    <span className="editor-action-title">{entry.title || 'Untitled'}</span>
                </div>
                <div className="editor-action-right">
                    <span className="editor-word-count">{wordCount} words</span>
                    <button type="button" className="btn" onClick={() => handleSave(false, 'draft')} disabled={saving}>{saving ? 'Saving…' : 'Save Draft'}</button>
                    <button type="button" className="btn btn-primary" onClick={handlePublish} disabled={saving}>Publish</button>
                </div>
            </div>

            {/* Left: Writing canvas */}
            <div className="editor-canvas">
                {/* Cover image area */}
                <div
                    className={`editor-cover${entry.cover_image ? ' has-image' : ''}`}
                    style={entry.cover_image ? { backgroundImage: `url(${entry.cover_image})` } : undefined}
                >
                    <div className="editor-cover-actions">
                        <button type="button" className="editor-cover-btn" onClick={() => openPanel('media', { toggle: true })}>Change cover</button>
                        <button type="button" className="editor-cover-btn" onClick={clearCoverImage}>Remove</button>
                    </div>
                </div>

                {/* Page icon */}
                <div className="editor-page-icon">✦</div>

                {/* Title + subtitle */}
                <div className="editor-title-area">
                    <input
                        className="editor-title-input"
                        type="text"
                        placeholder="Untitled"
                        value={entry.title}
                        onChange={(event) => setEntry({ ...entry, title: event.target.value })}
                    />
                    <input
                        className="editor-subtitle-input"
                        type="text"
                        placeholder="Add a subtitle…"
                        value={entry.excerpt || ''}
                        onChange={(event) => setEntry({ ...entry, excerpt: event.target.value })}
                    />
                </div>

                {/* Inline properties */}
                <div className="editor-props">
                    <div className="editor-prop">
                        <span className="editor-prop-label"><span className="pi">◉</span> Status</span>
                        <span className="editor-prop-value">
                            <span className="prop-status">
                                <span className="prop-status-dot" />
                                {entry.status}
                            </span>
                        </span>
                    </div>
                    <div className="editor-prop">
                        <span className="editor-prop-label"><span className="pi">📅</span> Date</span>
                        <span className="editor-prop-value">{entryDate ? new Date(entryDate).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <div className="editor-prop">
                        <span className="editor-prop-label"><span className="pi">🌱</span> Mood</span>
                        <span className="editor-prop-value">{entry.mood || <span style={{ color: 'var(--text-faint)' }}>Set mood…</span>}</span>
                    </div>
                    <div className="editor-prop">
                        <span className="editor-prop-label"><span className="pi">◈</span> Location</span>
                        <span className="editor-prop-value">{entry.location || <span style={{ color: 'var(--text-faint)' }}>Set location…</span>}</span>
                    </div>
                    <div className="editor-prop">
                        <span className="editor-prop-label"><span className="pi">⟡</span> Tags</span>
                        <span className="editor-prop-value">
                            {selectedTags.length > 0 ? selectedTags.map((tagId) => {
                                const tag = allTags.find((t) => t.id === tagId);
                                return tag ? <span key={tagId} className="prop-tag">{tag.name}</span> : null;
                            }) : <span style={{ color: 'var(--text-faint)' }}>Add tags…</span>}
                        </span>
                    </div>
                </div>

                {/* Info bar */}
                <div className="editor-info-bar">
                    <span className="info-pill"><span className="num">{FEATURE_COUNT}+</span> editing features</span>
                    <span className="info-pill"><span className="num">{wordCount}</span> words</span>
                    <span className="info-pill">{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                </div>

                {/* Editor container */}
                <div className="editor-canvas-notion">
                    <div className="editor-container editor-container-clean">
                        {editor && (
                            <>
                                <BubbleMenu
                                    editor={editor}
                                    tippyOptions={{ duration: 120, placement: 'top', maxWidth: 'none' }}
                                    shouldShow={({ editor: bubbleEditor, state }) => !state.selection.empty && bubbleEditor.isEditable}
                                >
                                    <div className="editor-bubble-menu">
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('bold') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('italic') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('underline') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('strike') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('highlight') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleHighlight().run()}>HL</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('code') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
                                        <button type="button" className={`editor-bubble-btn ${editor.isActive('link') ? 'active' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLinkDraft(editor.getAttributes('link').href || ''); openPanel('link', { toggle: true }); }}>Link</button>
                                    </div>
                                </BubbleMenu>

                                <FloatingMenu
                                    editor={editor}
                                    tippyOptions={{ duration: 120, placement: 'left-start', maxWidth: 'none', offset: [-10, 8] }}
                                    shouldShow={({ editor: floatingEditor, state }) => {
                                        const { empty, $from } = state.selection;
                                        return empty && floatingEditor.isEditable && $from.parent.isTextblock && $from.parent.textContent.length === 0;
                                    }}
                                >
                                    <div className="editor-floating-menu-shell">
                                        <button type="button" className={`editor-floating-trigger ${showQuickInsertMenu ? 'active' : ''}`} onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); setShowQuickInsertMenu((value) => !value); }}>+</button>
                                        <button type="button" className="editor-floating-trigger ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => openPanel('media', { toggle: true })}>Img</button>

                                        {showQuickInsertMenu && (
                                            <div className="editor-command-menu">
                                                <div className="editor-command-list">
                                                    {commandItems.map((item) => (
                                                        <button
                                                            type="button"
                                                            key={item.id}
                                                            className="editor-command-item"
                                                            onMouseDown={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                item.action();
                                                                setShowQuickInsertMenu(false);
                                                            }}
                                                        >
                                                            <span className="editor-command-copy">
                                                                <strong>{item.label}</strong>
                                                                <small>{item.hint}</small>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FloatingMenu>

                                <div className="editor-toolbar editor-toolbar-clean">
                                    <ToolbarButton active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('strike')} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('highlight')} title="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('subscript')} title="Subscript" onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('superscript')} title="Superscript" onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('code')} title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}><Code2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Clear marks" onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser size={14} /></ToolbarButton>
                                    <div className="toolbar-divider" />
                                    <ToolbarButton active={editor.isActive('paragraph')} title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 1 })} title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 2 })} title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 3 })} title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 4 })} title="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}><Heading4 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 5 })} title="Heading 5" onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}><Heading5 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('heading', { level: 6 })} title="Heading 6" onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}><Heading6 size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('bulletList')} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('orderedList')} title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('taskList')} title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('blockquote')} title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolbarButton>
                                    <ToolbarButton active={editor.isActive('codeBlock')} title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><SquareCode size={14} /></ToolbarButton>
                                    <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={14} /></ToolbarButton>
                                    <div className="toolbar-divider" />
                                    <ToolbarButton title="Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Table tools" tone="accent" active={showTablePanel} onClick={() => openPanel('table', { toggle: true })}><Table2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Text color" tone="accent" active={showColorPanel} onClick={() => openPanel('color', { toggle: true })}><Palette size={14} /></ToolbarButton>
                                    <ToolbarButton title="Image library" tone="accent" active={showMediaPanel} onClick={() => openPanel('media', { toggle: true })}><ImageIcon size={14} /></ToolbarButton>
                                    <ToolbarButton title="Image URL" tone="accent" active={showImageUrlPanel} onClick={() => openPanel('imageUrl', { toggle: true })}><ImageIcon size={14} /></ToolbarButton>
                                    <ToolbarButton title="Image align left" active={editor.isActive('image') && editor.getAttributes('image').align === 'left'} onClick={() => setSelectedImageAlign('left')}><AlignLeft size={14} /></ToolbarButton>
                                    <ToolbarButton title="Image align center" active={editor.isActive('image') && editor.getAttributes('image').align === 'center'} onClick={() => setSelectedImageAlign('center')}><AlignCenter size={14} /></ToolbarButton>
                                    <ToolbarButton title="Image align right" active={editor.isActive('image') && editor.getAttributes('image').align === 'right'} onClick={() => setSelectedImageAlign('right')}><AlignRight size={14} /></ToolbarButton>
                                    <ToolbarButton title="Remove selected image" tone="danger" onClick={removeSelectedImage}><Trash2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Insert link" tone="accent" active={showLinkPanel} onClick={() => { setLinkDraft(editor.getAttributes('link').href || ''); openPanel('link', { toggle: true }); }}><Link2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><Link2Off size={14} /></ToolbarButton>
                                    <ToolbarButton title="Align left" onClick={() => runAdvancedAction('alignLeft')}><AlignLeft size={14} /></ToolbarButton>
                                    <ToolbarButton title="Align center" onClick={() => runAdvancedAction('alignCenter')}><AlignCenter size={14} /></ToolbarButton>
                                    <ToolbarButton title="Align right" onClick={() => runAdvancedAction('alignRight')}><AlignRight size={14} /></ToolbarButton>
                                    <ToolbarButton title="Justify" onClick={() => runAdvancedAction('alignJustify')}><AlignJustify size={14} /></ToolbarButton>
                                    <ToolbarButton title="Indent" onClick={() => runAdvancedAction('indentIn')}><IndentIncrease size={14} /></ToolbarButton>
                                    <ToolbarButton title="Outdent" onClick={() => runAdvancedAction('indentOut')}><IndentDecrease size={14} /></ToolbarButton>
                                    <ToolbarButton title="Advanced actions" tone="accent" active={showAdvancedPanel} onClick={() => openPanel('advanced', { toggle: true })}><WandSparkles size={14} /></ToolbarButton>
                                    <div className="toolbar-divider" />
                                    <ToolbarButton title="Undo" tone="muted" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></ToolbarButton>
                                    <ToolbarButton title="Redo" tone="muted" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></ToolbarButton>
                                </div>
                            </>
                        )}

                        {showColorPanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Text color palette</div>
                                <div className="editor-swatch-row">
                                    {COLOR_SWATCHES.map((color) => (
                                        <button
                                            type="button"
                                            key={color}
                                            className="editor-color-swatch"
                                            style={{ backgroundColor: color }}
                                            onClick={() => editor?.chain().focus().setColor(color).run()}
                                            title={color}
                                        />
                                    ))}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => editor?.chain().focus().unsetColor().run()}>Reset Color</button>
                                </div>
                            </div>
                        )}

                        {showTablePanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Table operations</div>
                                <div className="editor-ops-grid">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().addRowBefore().run()} disabled={!editor?.isActive('table')}>Row Before</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().addRowAfter().run()} disabled={!editor?.isActive('table')}>Row After</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().deleteRow().run()} disabled={!editor?.isActive('table')}>Del Row</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().addColumnBefore().run()} disabled={!editor?.isActive('table')}>Col Before</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().addColumnAfter().run()} disabled={!editor?.isActive('table')}>Col After</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().deleteColumn().run()} disabled={!editor?.isActive('table')}>Del Col</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().mergeCells().run()} disabled={!editor?.isActive('table')}>Merge</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().splitCell().run()} disabled={!editor?.isActive('table')}>Split</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().toggleHeaderRow().run()} disabled={!editor?.isActive('table')}>Head Row</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().toggleHeaderColumn().run()} disabled={!editor?.isActive('table')}>Head Col</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editor?.chain().focus().toggleHeaderCell().run()} disabled={!editor?.isActive('table')}>Head Cell</button>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => editor?.chain().focus().deleteTable().run()} disabled={!editor?.isActive('table')}>Delete Table</button>
                                </div>
                            </div>
                        )}

                        {showAdvancedPanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Advanced actions (30+)</div>
                                <div className="editor-font-row">
                                    {FONT_OPTIONS.map((option) => (
                                        <button
                                            type="button"
                                            key={option.label}
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => editor?.chain().focus().setFontFamily(option.value).run()}
                                        >
                                            <Type size={13} /> {option.label}
                                        </button>
                                    ))}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => runAdvancedAction('fontReset')}>Reset Font</button>
                                </div>
                                <div className="editor-advanced-grid">
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('alignLeft')}><AlignLeft size={14} /> Align Left</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('alignCenter')}><AlignCenter size={14} /> Align Center</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('alignRight')}><AlignRight size={14} /> Align Right</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('alignJustify')}><AlignJustify size={14} /> Justify</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('heading4')}><Heading4 size={14} /> Heading 4</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('heading5')}><Heading5 size={14} /> Heading 5</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('heading6')}><Heading6 size={14} /> Heading 6</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('newLine')}><Minus size={14} /> Hard Break</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('indentIn')}><IndentIncrease size={14} /> Indent</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('indentOut')}><IndentDecrease size={14} /> Outdent</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('clearNodes')}><Eraser size={14} /> Clear Blocks</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('clearMarks')}><Eraser size={14} /> Clear Marks</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertDate')}><CalendarDays size={14} /> Insert Date</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertTime')}><Clock3 size={14} /> Insert Time</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertDateTime')}><CalendarClock size={14} /> Insert Date/Time</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertCallout')}><Quote size={14} /> Insert Callout</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertSummary')}><ListChecks size={14} /> Insert Summary</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertTodo')}><ListChecks size={14} /> Insert TODO</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertQa')}><MessageSquare size={14} /> Insert Q&A</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertCodeFence')}><SquareCode size={14} /> Insert Snippet</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertTwoColTable')}><Table2 size={14} /> 2 Col Table</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('insertThreeColTable')}><Table2 size={14} /> 3 Col Table</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('fontSans')}><Type size={14} /> Sans Font</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('fontSerif')}><Type size={14} /> Serif Font</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('fontMono')}><Type size={14} /> Mono Font</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => openPanel('color')}><Palette size={14} /> Color Panel</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => openPanel('table')}><Table2 size={14} /> Table Panel</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => openPanel('media')}><ImageIcon size={14} /> Media Panel</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => openPanel('imageUrl')}><ImageIcon size={14} /> Image URL</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => openPanel('link')}><Link2 size={14} /> Link Panel</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('selectAll')}><Type size={14} /> Select All</button>
                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('copyHtml')}><Code2 size={14} /> Copy HTML</button>

                                    <button type="button" className="editor-advanced-action" onClick={() => runAdvancedAction('copyText')}><Type size={14} /> Copy Text</button>
                                </div>
                            </div>
                        )}

                        {showMediaPanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Insert image from uploaded media</div>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Search images..."
                                    value={mediaSearch}
                                    onChange={(event) => setMediaSearch(event.target.value)}
                                />
                                <div className="editor-media-grid">
                                    {filteredMediaItems.map((media) => (
                                        <button type="button" key={media.id} className="editor-media-item" onClick={() => insertImageFromLibrary(media.id)}>
                                            <img src={normalizeMediaPath(media.filename)} alt={media.alt_text || media.original_name || 'Media'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showImageUrlPanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Insert image by URL</div>
                                <input className="form-input" type="text" placeholder="https://example.com/image.jpg" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} />
                                <input className="form-input" type="text" placeholder="Alt text (optional)" value={imageAltDraft} onChange={(event) => setImageAltDraft(event.target.value)} />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={applyImageUrl}>Insert Image</button>
                                </div>
                            </div>
                        )}

                        {showLinkPanel && (
                            <div className="editor-inline-panel">
                                <div className="editor-panel-label">Insert or update link</div>
                                <input className="form-input" type="text" placeholder="https://example.com" value={linkDraft} onChange={(event) => setLinkDraft(event.target.value)} />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={applyLink}>Apply Link</button>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { editor?.chain().focus().unsetLink().run(); setShowLinkPanel(false); setLinkDraft(''); }}>Remove Link</button>
                                </div>
                            </div>
                        )}

                        {slashMenu.open && (
                            <div className="editor-slash-menu" style={{ left: slashMenu.x, top: slashMenu.y }}>
                                <div className="editor-slash-menu-head">
                                    <strong>Insert block</strong>
                                    <span>Enter to apply</span>
                                </div>
                                <div className="editor-command-list">
                                    {filteredSlashItems.slice(0, 10).map((item, index) => (
                                        <button
                                            type="button"
                                            key={`slash-${item.id}`}
                                            className={`editor-command-item${index === slashIndex ? ' is-active' : ''}`}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                runSlashCommand(item);
                                            }}
                                        >
                                            <span className="editor-command-copy">
                                                <strong>{item.label}</strong>
                                                <small>{item.hint}</small>
                                            </span>
                                        </button>
                                    ))}
                                    {filteredSlashItems.length === 0 && <div className="editor-command-empty">No matching commands.</div>}
                                </div>
                            </div>
                        )}

                        <div className="editor-content-area">
                            <EditorContent editor={editor} />
                        </div>

                        <div className="editor-status">
                            <span>{wordCount} words · {charCount} characters</span>
                            <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right sidebar */}
            <div className="editor-right">
                <div className="right-card">
                    <div className="right-card-title">Details</div>
                    <div className="right-field">
                        <label className="right-label">Status</label>
                        <select className="right-select" value={entry.status} onChange={(event) => setEntry({ ...entry, status: event.target.value })}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    <div className="right-field">
                        <label className="right-label">Entry Date</label>
                        <input className="right-input" type="datetime-local" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
                    </div>
                    <div className="right-field">
                        <label className="right-label">Excerpt</label>
                        <textarea className="right-textarea" rows={3} value={entry.excerpt || ''} onChange={(event) => setEntry({ ...entry, excerpt: event.target.value })} placeholder="Brief summary…" />
                    </div>
                    <div className="right-field">
                        <label className="right-label">Cover Image</label>
                        <select className="right-select" value={coverMediaId} onChange={(event) => selectCoverFromLibrary(event.target.value)}>
                            <option value="">Choose image…</option>
                            {mediaItems.map((media) => (
                                <option key={media.id} value={media.id}>
                                    {media.original_name} ({media.mime_type})
                                </option>
                            ))}
                        </select>
                        {entry.cover_image ? (
                            <img src={entry.cover_image} alt="Cover" className="cover-preview-img" />
                        ) : (
                            <div className="cover-preview">No cover image</div>
                        )}
                    </div>
                </div>

                <div className="right-card">
                    <div className="right-card-title">Metadata</div>
                    <div className="right-field">
                        <label className="right-label">Mood</label>
                        <input className="right-input" type="text" value={entry.mood || ''} onChange={(event) => setEntry({ ...entry, mood: event.target.value })} placeholder="e.g. contemplative" />
                    </div>
                    <div className="right-field">
                        <label className="right-label">Location</label>
                        <input className="right-input" type="text" value={entry.location || ''} onChange={(event) => setEntry({ ...entry, location: event.target.value })} />
                    </div>
                    <div className="right-field">
                        <label className="right-label">Weather</label>
                        <input className="right-input" type="text" value={entry.weather || ''} onChange={(event) => setEntry({ ...entry, weather: event.target.value })} />
                    </div>
                    <div className="right-field">
                        <div className="right-checkbox-row">
                            <button
                                type="button"
                                className={`right-checkbox${entry.featured ? ' checked' : ''}`}
                                onClick={() => setEntry({ ...entry, featured: !entry.featured })}
                            >
                                {entry.featured && '✓'}
                            </button>
                            <span>Featured entry</span>
                        </div>
                    </div>
                </div>

                <div className="right-card">
                    <div className="right-card-title">Tags</div>
                    <div className="tag-chips">
                        {allTags.map((tag) => (
                            <span
                                key={tag.id}
                                className={`tag-chip${selectedTags.includes(tag.id) ? ' active' : ''}`}
                                onClick={() => toggleTag(tag.id)}
                            >
                                {tag.name}
                            </span>
                        ))}
                        {allTags.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>No tags yet</span>}
                    </div>
                    <input
                        type="text"
                        className="right-input"
                        placeholder="Add tag…"
                        style={{ marginTop: '0.5rem', fontSize: '0.76rem' }}
                        onKeyDown={async (event) => {
                            if (event.key === 'Enter' && event.target.value.trim()) {
                                event.preventDefault();
                                try {
                                    const newTag = await tagsApi.create({ name: event.target.value.trim() });
                                    setAllTags((prev) => [...prev, newTag]);
                                    setSelectedTags((prev) => [...prev, newTag.id]);
                                    event.target.value = '';
                                } catch (error) {
                                    toast.error(error.message);
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
