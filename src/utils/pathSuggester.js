//src/utils/pathSuggester.js

/**
 * Creates a simple path suggestion popup for a text input element.
 * @param {App} app The Obsidian app instance
 * @param {HTMLInputElement} inputEl The input element to attach the suggester to.
 * @param {(query: string) => string[]} getSuggestions A function that returns a list of suggestion strings based on a query.
 */
export function createPathSuggester(app, inputEl, getSuggestions) {
    // Use document.createElement instead of createDiv
    const suggestionEl = document.createElement('div');
    suggestionEl.classList.add('cpwn-custom-suggestion-container');
    
    const parentContainer = inputEl.parentElement;

    // 1. Set up the positioning context
    parentContainer.style.position = 'relative';
    suggestionEl.style.position = 'absolute';
    suggestionEl.style.top = '100%'; // Position directly below the input
    suggestionEl.style.left = '0';
    suggestionEl.style.zIndex = '100';

    // 2. Set flexible width properties
    suggestionEl.style.minWidth = `${parentContainer.offsetWidth}px`;
    suggestionEl.style.width = 'auto';
    suggestionEl.style.maxWidth = '500px';

    suggestionEl.style.display = 'none';
    parentContainer.appendChild(suggestionEl);

    const showSuggestions = () => {
        const query = inputEl.value.toLowerCase();
        const suggestions = getSuggestions(query);
        suggestionEl.empty();

        if (suggestions.length === 0) {
            suggestionEl.style.display = 'none';
            return;
        }

        suggestionEl.style.display = 'block';
        suggestions.slice(0, 10).forEach(path => {
            const item = suggestionEl.createDiv({ cls: 'cpwn-custom-suggestion-item', text: path });

            // Allow long folder paths to wrap onto multiple lines
            item.style.whiteSpace = 'normal';
            item.style.wordBreak = 'break-all';

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                inputEl.value = path;
                inputEl.dispatchEvent(new Event('input'));
                suggestionEl.style.display = 'none';
            });
        });
    };

    inputEl.addEventListener('input', showSuggestions);
    inputEl.addEventListener('focus', showSuggestions);
    inputEl.addEventListener('blur', () => window.setTimeout(() => {
        suggestionEl.style.display = 'none';
    }, 150));
}
