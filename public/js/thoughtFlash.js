(() => {
    const initNode = document.getElementById('thought-flash-init');
    const grid = document.getElementById('thought-flash-grid');
    const loader = document.getElementById('thought-flash-loader');
    const modal = document.getElementById('thought-modal');
    const modalMedia = document.getElementById('thought-modal-media');
    const modalBody = document.getElementById('thought-modal-body');
    const closeBtn = document.getElementById('thought-modal-close');

    if (!initNode || !grid || !loader) return;

    let payload = { items: [], usePlaceholders: false };
    try {
        payload = JSON.parse(initNode.textContent || '{}');
    } catch (_err) {
        payload = { items: [], usePlaceholders: false };
    }

    let items = Array.isArray(payload.items) ? payload.items : [];
    let offset = items.length;
    let hasMore = !payload.usePlaceholders;
    let loading = false;

    const truncate = (value, max) => {
        const text = String(value || '').trim();
        if (text.length <= max) return text;
        return `${text.slice(0, max - 1)}…`;
    };

    const makeMediaHtml = (item) => {
        if (item.media_type === 'mp4') {
            return `<video class="thought-media" src="${item.media_url}" muted playsinline loop preload="metadata"></video>`;
        }
        return `<img class="thought-media" src="${item.media_url}" alt="Thought media" loading="lazy" />`;
    };

    const makeModalMediaHtml = (item) => {
        if (item.media_type === 'mp4') {
            return `<video class="thought-modal-media" src="${item.media_url}" controls autoplay playsinline preload="metadata"></video>`;
        }
        return `<img class="thought-modal-media" src="${item.media_url}" alt="Thought media" />`;
    };

    const applyModalSizing = () => {
        const media = modalMedia.querySelector('.thought-modal-media');
        const content = modal.querySelector('.thought-modal-content');
        const textSection = modal.querySelector('.thought-modal-text');
        if (!media || !content) return;

        const vw = Math.max(320, Math.floor(window.innerWidth * 0.92));
        const vhCap = Math.floor(window.innerHeight * 0.9);
        const textHeight = textSection ? Math.min(220, Math.ceil(textSection.scrollHeight) + 24) : 0;
        const maxMediaH = Math.max(220, vhCap - textHeight - 90);
        media.style.maxHeight = `${maxMediaH}px`;

        const setFromNatural = (naturalW, naturalH) => {
            if (!naturalW || !naturalH) return;
            const fitScale = Math.min(vw / naturalW, maxMediaH / naturalH, 1);
            const fittedW = Math.max(280, Math.floor(naturalW * fitScale));
            const fittedContentW = Math.min(vw, fittedW + 32);
            content.style.width = `${fittedContentW}px`;

            if (textSection) {
                textSection.style.maxHeight = `${Math.max(90, vhCap - maxMediaH - 92)}px`;
            }
        };

        if (media.tagName === 'IMG') {
            if (media.complete) {
                setFromNatural(media.naturalWidth, media.naturalHeight);
            } else {
                media.addEventListener('load', () => setFromNatural(media.naturalWidth, media.naturalHeight), { once: true });
            }
            return;
        }

        if (media.tagName === 'VIDEO') {
            if (media.videoWidth && media.videoHeight) {
                setFromNatural(media.videoWidth, media.videoHeight);
            } else {
                media.addEventListener('loadedmetadata', () => setFromNatural(media.videoWidth, media.videoHeight), { once: true });
            }
        }
    };

    const openModal = (item) => {
        modalMedia.innerHTML = makeModalMediaHtml(item);
        modalBody.innerHTML = item.thought_text || item.preview_text || 'No thought yet.';

        const content = modal.querySelector('.thought-modal-content');
        if (content) content.style.width = '';

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        applyModalSizing();
    };

    const renderItems = (newItems) => {
        const html = newItems.map((item) => `
            <article class="thought-card" data-id="${item.id}" tabindex="0" role="button" aria-label="Open thought item">
                ${makeMediaHtml(item)}
                <div class="thought-preview">${truncate(item.preview_text, 120)}</div>
            </article>
        `).join('');

        grid.insertAdjacentHTML('beforeend', html);

        grid.querySelectorAll('.thought-card').forEach((card) => {
            if (card.dataset.bound === '1') return;
            card.dataset.bound = '1';

            const id = card.getAttribute('data-id');
            const item = items.find((entry) => String(entry.id) === String(id));
            if (!item) return;

            card.addEventListener('click', () => {
                openModal(item);
            });

            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openModal(item);
            });
        });
    };

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        modalMedia.innerHTML = '';
        modalBody.innerHTML = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (event) => {
        if (event.target?.dataset?.close === '1') closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });

    window.addEventListener('resize', () => {
        if (modal.classList.contains('open')) applyModalSizing();
    });

    const fetchMore = async () => {
        if (loading || !hasMore) return;
        loading = true;
        loader.classList.add('show');

        try {
            const res = await fetch(`/thought-flash/feed?offset=${offset}&limit=12`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to load more thoughts');

            const data = await res.json();
            const newItems = Array.isArray(data.items) ? data.items : [];
            items = items.concat(newItems);
            offset += newItems.length;
            hasMore = Boolean(data.hasMore);

            if (newItems.length > 0) {
                renderItems(newItems);
            }
        } catch (_err) {
            hasMore = false;
        } finally {
            loading = false;
            if (!hasMore) {
                loader.textContent = 'No more thoughts.';
            }
            loader.classList.toggle('show', hasMore);
        }
    };

    renderItems(items);

    if (!hasMore) {
        loader.textContent = payload.usePlaceholders ? 'Showing placeholder thoughts.' : 'No more thoughts.';
        loader.classList.add('show');
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) fetchMore();
        });
    }, { rootMargin: '300px 0px' });

    observer.observe(loader);
})();
