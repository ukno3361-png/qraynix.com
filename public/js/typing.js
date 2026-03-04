/**
 * public/js/typing.js
 * Natural Typing Simulator.
 * Adapted to work safely with rich HTML content (journal entries) while preserving the original rhythm paradigm.
 */
(function () {
    const timer = ms => new Promise(cb => setTimeout(cb, ms));

    async function typing(elementSelector, endCursorDisabled = false) {
        let isSkipped = false;

        const element = typeof elementSelector === 'string' ? document.querySelector(elementSelector) : elementSelector;
        if (!element) return;

        // Allow user to click anywhere to skip the typing animation and show instantly
        const skipHandler = () => { isSkipped = true; };
        document.addEventListener('click', skipHandler);

        // Create the blinking cursor
        const cursor = document.createElement('span');
        cursor.textContent = '|';
        cursor.className = 'typing-cursor';
        cursor.style.fontWeight = 'bold';
        cursor.style.color = 'var(--accent, #c9a84c)';
        cursor.style.animation = 'blink 1s step-end infinite';

        if (!document.getElementById('cursor-styles')) {
            const style = document.createElement('style');
            style.id = 'cursor-styles';
            style.innerHTML = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
            document.head.appendChild(style);
        }

        // Clone the DOM so we can walk through its original state
        const clone = element.cloneNode(true);
        element.innerHTML = '';
        element.style.opacity = '1'; // Unhide element

        // Recursive function to type out text nodes while preserving HTML elements
        async function typeNode(node, cursorEl) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                node.nodeValue = '';
                node.parentNode.insertBefore(cursorEl, node.nextSibling);

                for (let i = 0; i < text.length; i++) {
                    if (isSkipped) {
                        // Fast forward the rest of this text node
                        node.nodeValue += text.slice(i);
                        break;
                    }

                    let randNum = Math.floor(Math.random() * (40 - 15) + 15); // Fast, natural typing speed

                    // Natural rhythm pauses
                    if (text[i] === '.' || text[i] === ',' || text[i] === '\n') {
                        randNum += 200; // Pause at punctuation
                    } else if (Math.random() < 0.02) {
                        randNum += 150; // Random mid-word pause
                    }

                    await timer(randNum);
                    node.nodeValue += text[i];
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList && node.classList.contains('typing-cursor')) return;

                const children = Array.from(node.childNodes);
                node.innerHTML = '';
                for (const child of children) {
                    node.appendChild(child);
                    await typeNode(child, cursorEl);
                }
            }
        }

        element.appendChild(cursor);

        const children = Array.from(clone.childNodes);
        for (const child of children) {
            element.appendChild(child);
            await typeNode(child, cursor);
        }

        document.removeEventListener('click', skipHandler);

        if (endCursorDisabled) {
            cursor.remove();
        }
    }

    // Attach to window to match the project's traditional script paradigm
    window.naturalTyping = typing;
})();
