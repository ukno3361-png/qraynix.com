/**
 * public/js/aiChatWidget.js
 * Floating AI personality chat widget for public visitors.
 */

(function initAiChatWidget() {
    const DEFAULT_DISCLAIMER = `⚠️ Advisory & Disclaimer
This interaction is being conducted on behalf of the one who's feeding me bullshittery. Please be advised that the content generated herein—including any jokes, anecdotes, or "facts"—is intended purely for entertainment purposes. Not all information provided is grounded in reality, and much of it is shared in the spirit of lighthearted fun. This is a consequence-free zone designed for play; please do not take the contents literally or use them as a basis for real-world decision-making. But at the end of the day, I more than anyone know, you will do whatever the fuck you want to do.`;

    const config = window.__AI_CHAT_CONFIG__ || {};
    if (config.enabled === false) return;

    const ownerName = String(config.ownerName || 'Site Owner');
    const botName = String(config.botName || 'Site Bot');
    const firstBubbleText = String(config.disclaimer || DEFAULT_DISCLAIMER).replace(/\[Name\]/g, ownerName);

    const state = {
        open: false,
        busy: false,
        history: [],
    };

    const root = document.createElement('div');
    root.className = 'ai-chat-widget';
    root.innerHTML = `
        <button class="ai-chat-toggle" type="button" aria-label="Open AI chat">
            <span class="ai-chat-toggle-rune">✦</span>
            <span>Chat</span>
        </button>
        <section class="ai-chat-panel" aria-hidden="true">
            <header class="ai-chat-header">
                <div class="ai-chat-brand" aria-label="Qraynix">
                    <span class="ai-chat-brand-rune">◈</span>
                    <span class="ai-chat-brand-text">Qraynix</span>
                </div>
                <button class="ai-chat-close" type="button" aria-label="Close chat">×</button>
            </header>
            <div class="ai-chat-messages" role="log" aria-live="polite"></div>
            <form class="ai-chat-form">
                <input class="ai-chat-input" type="text" maxlength="700" placeholder="Ask about today..." autocomplete="off" />
                <button class="ai-chat-send" type="submit">Send</button>
            </form>
        </section>
    `;

    document.body.appendChild(root);

    const toggleBtn = root.querySelector('.ai-chat-toggle');
    const panel = root.querySelector('.ai-chat-panel');
    const closeBtn = root.querySelector('.ai-chat-close');
    const form = root.querySelector('.ai-chat-form');
    const input = root.querySelector('.ai-chat-input');
    const messages = root.querySelector('.ai-chat-messages');

    const setOpen = (value) => {
        state.open = value;
        panel.classList.toggle('open', value);
        panel.setAttribute('aria-hidden', value ? 'false' : 'true');
        if (value) {
            input.focus();
            scrollBottom();
        }
    };

    const scrollBottom = () => {
        messages.scrollTop = messages.scrollHeight;
    };

    const addBubble = (role, content, isHtml = false) => {
        const bubble = document.createElement('div');
        bubble.className = `ai-chat-bubble ${role}`;
        if (isHtml) {
            bubble.innerHTML = content;
        } else {
            bubble.textContent = content;
        }
        messages.appendChild(bubble);
        scrollBottom();
        return bubble;
    };

    const advisoryHtml = escapeHtml(firstBubbleText).replace(/\n/g, '<br>');
    addBubble('assistant', advisoryHtml, true);

    toggleBtn.addEventListener('click', () => setOpen(!state.open));
    closeBtn.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.open) setOpen(false);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (state.busy) return;

        const message = String(input.value || '').trim();
        if (!message) return;

        input.value = '';
        addBubble('user', message);
        state.history.push({ role: 'user', content: message });

        state.busy = true;
        input.disabled = true;
        const pending = addBubble('assistant', '...');

        try {
            const res = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: state.history.slice(-8),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error?.message || 'Chat failed');
            }

            const reply = String(data.reply || 'No response.').trim();
            pending.textContent = reply;
            state.history.push({ role: 'assistant', content: reply });
            state.history = state.history.slice(-16);
        } catch (err) {
            pending.textContent = `I hit a snag: ${err.message}`;
        } finally {
            state.busy = false;
            input.disabled = false;
            input.focus();
            scrollBottom();
        }
    });

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
