// src/utils/suggesters.js
import { AbstractInputSuggest } from 'obsidian';

/**
 * A custom input suggester for tags.
 */
export class TagSuggest extends AbstractInputSuggest {
    constructor(app, inputEl, view) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.view = view;
        this.allTags = new Set();

        this.refreshAllTags(); 

    }

    getSuggestions(query) {
        //this.refreshAllTags();

        // If the query is empty, show all tags, sorted alphabetically.
        if (!query) {
            return Array.from(this.allTags)
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        }

        // Only proceed if query starts with '#'
        if (!query.startsWith('#')) {
            return [];
        }

        const searchTerm = query.substring(1).toLowerCase();
        return Array.from(this.allTags)
            .filter(tag => tag.toLowerCase().includes(searchTerm))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }

    renderSuggestion(tag, el) {
        el.setText(tag);
    }

    selectSuggestion(tag) {
        const finalValue = tag.startsWith('#') ? tag : `#${tag}`;
        this.setValue(finalValue);

        if (this.view.activeTab === 'tasks') {
            this.view.tasksSearchTerm = finalValue;
            this.view.populateTasks();
        } else if (this.view.activeTab === 'notes') {
            this.view.notesSearchTerm = finalValue;
            this.view.populateNotes();
        }

        this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        this.close();
    }

    refreshAllTags() {
        this.allTags.clear();
        const settings = this.view.plugin.settings;

        if (this.view.activeTab === 'tasks') {
            // For tasks tab, extract tags only from tasks.
            const allTasks = Array.from(this.view.tasksByDate.values()).flat();
            for (const task of allTasks) {
                if (task.tags && task.tags.length > 0) {
                    task.tags.forEach(tag => {

                        //this.allTags.add(tag));
                        const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
                        this.allTags.add(normalizedTag);
                    })
                }
            }
            return; // Stop here for tasks
        }

        // For notes tab, determine which notes to scan and which tag to exclude
        let notesToScan;
        const pinTagToExclude = (this.view.activeTab === 'notes' && this.view.notesViewMode === 'pinned')
            ? (settings.pinTag || '').toLowerCase()
            : null;

        if (pinTagToExclude) {
            // Only scan pinned notes
            notesToScan = this.app.vault.getMarkdownFiles().filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache) return false;
                if (cache.tags?.some(tag => tag.tag.toLowerCase().includes(pinTagToExclude))) return true;
                const frontmatter = cache.frontmatter;
                if (frontmatter) {
                    for (const key in frontmatter) {
                        const value = frontmatter[key];
                        if (typeof value === 'string' && value.toLowerCase().includes(pinTagToExclude)) return true;
                        if (Array.isArray(value) && value.some(item => typeof item === 'string' && item.toLowerCase().includes(pinTagToExclude))) return true;
                    }
                }
                return false;
            });
        } else {
            // Scan all notes for recent notes mode
            notesToScan = this.app.vault.getMarkdownFiles();
        }

        // Extract tags from the determined set of notes
        for (const file of notesToScan) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // Helper to add a tag if it's not the pin tag
            const addTag = (tag) => {
                const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
                if (pinTagToExclude && normalizedTag.toLowerCase() === pinTagToExclude) {
                    return; // Skip the pin tag
                }
                this.allTags.add(normalizedTag);
            };

            if (cache.tags) {
                for (const tagObj of cache.tags) {
                    addTag(tagObj.tag);
                }
            }
            if (cache.frontmatter && cache.frontmatter.tags) {
                const frontmatterTags = Array.isArray(cache.frontmatter.tags) ? cache.frontmatter.tags : [cache.frontmatter.tags];
                frontmatterTags.forEach(tag => {
                    if (typeof tag === 'string') addTag(tag);
                });
            }
            if (cache.frontmatter && cache.frontmatter.tag) {
                if (typeof cache.frontmatter.tag === 'string') addTag(cache.frontmatter.tag);
            }
        }
    }
}

/**
 * A custom input suggester for filter keywords.
 */
export class FilterSuggest extends AbstractInputSuggest {
    constructor(app, inputEl, suggestionItems, onSelectCallback) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.suggestionItems = suggestionItems;
        this.onSelectCallback = onSelectCallback;
    }


    getSuggestions(query) {
        // If the query is empty, show all available suggestions (for focus/arrow-down).
        if (!query) {
            return this.suggestionItems;
        }
        const lowerCaseQuery = query.toLowerCase();
        return this.suggestionItems.filter(suggestion =>
            suggestion.toLowerCase().includes(lowerCaseQuery)
        );
    }

    renderSuggestion(value, el) {
        el.setText(value);
    }

    selectSuggestion(value) {
        this.setValue(value);
        this.onSelectCallback(value);
        // This will now work correctly
        this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        this.close();
    }
}
