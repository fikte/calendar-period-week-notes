// src/settings/PeriodSettingsTab.js
import {
    PluginSettingTab,
    Setting,
    Notice,
    sanitizeHTMLToDom,
    setIcon,
    Platform
} from 'obsidian';

import { BUNDLED_THEMES } from '../data/themes.js';
import { DEFAULT_SETTINGS, DASHBOARDWIDGETS, VIEW_TYPE_PERIOD } from '../data/constants.js';
import { PeriodMonthView } from '../views/PeriodMonthView.js';
import { WidgetBuilderModal } from '../modals/WidgetBuilderModal.js';
import { SectionHeaderModal } from '../modals/SectionHeaderModal.js';
import { TemplatePickerModal } from '../modals/TemplatePickerModal.js';
import { GoalEditModal } from '../modals/GoalEditModal.js';
import { GoalTracker } from '../logic/GoalTracker';

/**
 * The settings tab class for the plugin, responsible for building the settings UI.
 */
export class PeriodSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.activeTab = 'general';
        this.heatmapUpdateTimer = null;
        this.activePreviewMode = null;
        this.scrollPosition = 0;
        this.colorClipboard = null;
        this.selectedThemeFile = null;
        this.currentThemeDefaults = { ...DEFAULT_SETTINGS };

    }

    refreshDisplay() {
        if (this.contentEl) {
            this.scrollPosition = this.contentEl.scrollTop;
        }
        this.display();
    }

    triggerDashboardRefresh() {
        this.app.workspace.trigger('cpwn-pm-dashboard-refresh');
    }

    async loadCurrentThemeDefaults() {
        if (this.plugin.settings.appliedTheme) {
            const themeName = this.plugin.settings.appliedTheme;
            const themeKey = themeName.replace('.json', '');

            if (BUNDLED_THEMES[themeKey]) {
                this.currentThemeDefaults = { ...DEFAULT_SETTINGS, ...BUNDLED_THEMES[themeKey] };
            } else {
                console.warn(`Applied theme "${themeName}" not found. Using base defaults.`);
                this.currentThemeDefaults = { ...DEFAULT_SETTINGS };
            }
        } else {
            this.currentThemeDefaults = { ...DEFAULT_SETTINGS };
        }
    }

    async hide() {
        // This function runs automatically when the user closes the settings tab.
        // Get all open views of the calendar type
        const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD);

        if (views.length > 0) {
            // Tell each open calendar view to re-render itself
            for (const leaf of views) {
                if (leaf.view instanceof PeriodMonthView) {
                    // Calling renderCalendar() will redraw the view with the latest settings
                    await leaf.view.renderCalendar();
                }
            }
        }
    }

    /**
     * A helper function to save settings and trigger a full UI refresh in any open views.
     */
    async saveAndUpdate() {
        await this.plugin.saveData(this.plugin.settings);
        this.plugin.updateStyles();
        this.triggerDashboardRefresh();
        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => {
            if (leaf.view instanceof PeriodMonthView) {
                leaf.view.rebuildAndRender();
            }
        });
    }


    /**
     * A utility function for drag-and-drop reordering. It determines which
     * element the currently dragged item should be placed before.
     * @param {HTMLElement} container - The list container being sorted.
     * @param {number} y - The vertical mouse coordinate.
     * @returns {HTMLElement | null} The element to insert before, or null.
     */
    getDragAfterElement(container, y) {
        // Get all draggable items in the container, excluding the one being dragged
        const draggableElements = [...container.querySelectorAll('.cpwn-pm-draggable-widget-item:not(.dragging)')];

        // Find the element that is closest to the mouse position
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            // The offset is the distance from the mouse to the center of the item
            const offset = y - box.top - box.height / 2;

            // We are looking for the element with the smallest positive offset
            // (i.e., the one just below the cursor)
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }



    /**
     * Memoized final order calculation to prevent redundant recalculations
     */
    getMemoizedFinalOrder(allWidgets, orderKey) {
        const widgetsHash = Object.keys(allWidgets).sort().join(',');
        const orderHash = (this.plugin.settings[orderKey] || []).join(',');
        const cacheKey = `${widgetsHash}|${orderHash}`;

        if (this._orderCache?.key === cacheKey) {
            return this._orderCache.value;
        }

        const savedOrder = this.plugin.settings[orderKey] || [];
        const allKeys = Object.keys(allWidgets);
        const finalOrder = [...new Set([...savedOrder, ...allKeys])];
        const result = finalOrder.filter(key => allKeys.includes(key));

        this._orderCache = { key: cacheKey, value: result };
        return result;
    }

    /**
     * Creates a widget element with all its settings and drag handlers
     */
    createWidgetElement(key, name, visibilitySettings, visibilityKey, index, containerEl) {
        const widgetConfig = this.plugin.settings.tasksStatsWidgets?.find(w => w.widgetKey === key);
        const isSectionHeader = widgetConfig?.type === 'section-header';

        let isInSection = false;
        if (!isSectionHeader && this.plugin.settings.tasksStatsWidgets) {
            const allKeys = this.getMemoizedFinalOrder(
                { ...DASHBOARDWIDGETS.tasks },
                'tasksDashboardOrder'
            );
            for (let i = index - 1; i >= 0; i--) {
                const prevConfig = this.plugin.settings.tasksStatsWidgets.find(w => w.widgetKey === allKeys[i]);
                if (prevConfig?.type === 'section-header') {
                    isInSection = true;
                    break;
                }
            }
        }

        const widgetEl = createDiv({
            cls: `cpwn-pm-draggable-widget-item ${isSectionHeader ? 'cpwn-pm-section-header-item' : ''} ${isInSection && !isSectionHeader ? 'cpwn-pm-indented-item' : ''}`,
            attr: { 'data-widget-key': key }
        });

        // Drag handle
        const dragHandle = widgetEl.createDiv({ cls: 'cpwn-pm-drag-handle' });
        setIcon(dragHandle, 'grip-vertical');

        // Setting wrapper
        const settingWrapper = widgetEl.createDiv({ cls: 'cpwn-pm-setting-wrapper' });
        const setting = new Setting(settingWrapper);

        if (isSectionHeader) {
            setting.setName(widgetConfig.name);
            const visibilityStatus = widgetConfig.isVisible !== false ? 'Visible' : 'Not visible';
            setting.setDesc(`Type: Section header | ${visibilityStatus}`);

            // Icon preview
            if (widgetConfig.icon) {
                const iconPreview = setting.nameEl.createSpan({ cls: 'cpwn-pm-section-icon-preview' });
                setIcon(iconPreview, widgetConfig.icon);
                iconPreview.style.color = widgetConfig.iconColor;
                iconPreview.style.marginRight = '8px';
                setting.nameEl.prepend(iconPreview);
            }

            // Styling
            setting.nameEl.style.color = widgetConfig.textColor;
            setting.nameEl.style.fontWeight = widgetConfig.fontWeight === 'bold' ? 'bold' : 'normal';
            setting.nameEl.style.fontStyle = widgetConfig.fontWeight === 'italic' ? 'italic' : 'normal';
            setting.nameEl.style.fontSize = `${widgetConfig.fontSize}px`;
        } else {
            const widgetType = widgetConfig?.chartType || 'Core widget';
            const widgetSize = widgetConfig?.size || 'N/A';
            setting.setName(name);
            setting.setDesc(`Type: ${widgetType} | Size: ${widgetSize}`);
        }

        // Toggle visibility - OPTIMIZED: Only save, no full re-render
        setting.addToggle(toggle => {
            toggle.setValue(visibilitySettings[key] ?? true)
                .onChange(async (value) => {
                    visibilitySettings[key] = value;
                    await this.plugin.saveData(this.plugin.settings);
                    this.triggerDashboardRefresh();
                });
        });

        // Configure/Delete buttons - COMPLETE IMPLEMENTATION
        if (isSectionHeader || (widgetConfig && key.startsWith('custom-'))) {
            setting.addButton(button => {
                button.setIcon('settings')
                    .setTooltip('Configure')
                    .onClick(() => {
                        if (isSectionHeader) {
                            new SectionHeaderModal(this.app, this.plugin, async (updatedConfig) => {
                                Object.assign(widgetConfig, updatedConfig);
                                await this.plugin.saveSettings();
                                this.renderTasksDashboardSettings(containerEl);
                                const dashboardView = this.app.workspace.getLeavesOfType('cpwn-calendar-period-week-notes')
                                    .find(leaf => leaf.view instanceof PeriodMonthView)?.view;
                                if (dashboardView) {
                                    dashboardView.lastTasksState = '';
                                    dashboardView.lastCreationState = '';
                                }
                                this.app.workspace.trigger('cpwn-pm-dashboard-refresh');
                            }, widgetConfig).open();
                        } else {
                            new WidgetBuilderModal(this.app, this.plugin, widgetConfig, async (updatedConfig) => {
                                const widgetIndex = this.plugin.settings.tasksStatsWidgets.findIndex(w => w.widgetKey === key);
                                this.plugin.settings.tasksStatsWidgets[widgetIndex] = updatedConfig;
                                await this.plugin.saveSettings();
                                this.renderTasksDashboardSettings(containerEl);
                                this.triggerDashboardRefresh();
                            }).open();
                        }
                    });
            });

            setting.addButton(button => {
                button.setIcon('trash')
                    .setTooltip('Delete')
                    .setWarning()
                    .onClick(async () => {
                        if (confirm(`Are you sure you want to delete ${name}?`)) {
                            const widgetIndex = this.plugin.settings.tasksStatsWidgets.findIndex(w => w.widgetKey === key);
                            this.plugin.settings.tasksStatsWidgets.splice(widgetIndex, 1);
                            delete this.plugin.settings.tasksDashboardWidgets[key];
                            this.plugin.settings.tasksDashboardOrder = this.plugin.settings.tasksDashboardOrder.filter(k => k !== key);
                            await this.plugin.saveSettings();
                            this.renderTasksDashboardSettings(containerEl);
                            this.triggerDashboardRefresh();
                            new Notice('Widget deleted.');
                        }
                    });
            });
        } else {
            setting.addButton(button => button.setIcon('settings').setTooltip('Core widgets cannot be configured').setDisabled(true));
            setting.addButton(button => button.setIcon('trash').setTooltip('Core widgets cannot be deleted, use the toggle to hide').setDisabled(true));
        }

        // Make draggable and cache element on dragstart
        widgetEl.draggable = true;
        widgetEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', key);
            e.dataTransfer.effectAllowed = 'move';
            widgetEl.addClass('dragging');
            this._draggingElement = widgetEl;
        });

        widgetEl.addEventListener('dragend', () => {
            widgetEl.removeClass('dragging');
            this._draggingElement = null;
        });

        return widgetEl;
    }

    /**
     * Attach optimized drag handlers with throttling and event delegation
     */
    attachDragHandlers(container, orderKey) {
        // Remove old handlers
        if (this._dragOverHandler) {
            container.removeEventListener('dragover', this._dragOverHandler);
        }
        if (this._dropHandler) {
            container.removeEventListener('drop', this._dropHandler);
        }

        // Use a local Map to track dragging elements per container
        const draggingMap = new WeakMap();

        // Dragover handler - captures element locally
        this._dragOverHandler = (e) => {
            e.preventDefault();

            // Get dragging element from the container
            let draggingEl = draggingMap.get(container);
            if (!draggingEl) {
                draggingEl = container.querySelector('.dragging');
                if (draggingEl) {
                    draggingMap.set(container, draggingEl);
                }
            }

            if (!draggingEl) return;

            if (this._dragRAF) return;
            this._dragRAF = requestAnimationFrame(() => {
                this._dragRAF = null;

                const afterElement = this.getDragAfterElementOptimized(
                    container,
                    e.clientY,
                    draggingEl
                );

                if (afterElement == null) {
                    container.appendChild(draggingEl);
                } else {
                    container.insertBefore(draggingEl, afterElement);
                }
            });
        };

        // Drop handler - uses the captured element
        this._dropHandler = async (e) => {
            e.preventDefault();

            const draggingEl = draggingMap.get(container);
            if (!draggingEl) return;

            const newOrder = Array.from(container.children)
                .map(child => child.dataset.widgetKey);

            this.plugin.settings[orderKey] = newOrder;
            await this.saveAndUpdate();

            // Clear the map after successful drop
            draggingMap.delete(container);
        };

        // Clear map on dragend as fallback
        container.addEventListener('dragend', () => {
            draggingMap.delete(container);
        }, { once: true });

        container.addEventListener('dragover', this._dragOverHandler);
        container.addEventListener('drop', this._dropHandler);
    }


    /**
     * Optimized positioning calculation with reduced layout thrashing
     */
    getDragAfterElementOptimized(container, y, draggingElement) {
        const draggableElements = [...container.querySelectorAll(
            '.cpwn-pm-draggable-widget-item:not(.dragging)'
        )];

        if (draggableElements.length < 20) {
            let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
            for (const child of draggableElements) {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    closest = { offset, element: child };
                }
            }
            return closest.element;
        }

        return this.binarySearchPosition(draggableElements, y);
    }

    /**
     * Binary search for O(log n) positioning in large lists
     */
    binarySearchPosition(elements, y) {
        let left = 0;
        let right = elements.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const rect = elements[mid].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (y < midY) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return elements[left] || null;
    }

    /**
     * Clean up drag handlers when settings tab is closed
     */
    onClose() {
        super.onClose();

        this._dragOverHandler = null;
        this._dropHandler = null;
        this._dragRAF = null;
        this._orderCache = null;
    }



    /**
     * Renders a single, performant, draggable list of widgets for a settings screen.
     * This function handles initial rendering, efficient toggling, and smooth drag-and-drop reordering.
     * @param {HTMLElement} containerEl - The parent element to render the list into.
     * @param {string} title - The heading to display for this widget list.
     * @param {'creationDashboardWidgets'} visibilityKey - The key in settings for widget visibility.
     * @param {'creationDashboardOrder'} orderKey - The key in settings for widget order.
     * @param {object} defaultWidgets - The master object of all possible default widgets.
     */
    renderFileCreationWidgetSettings(containerEl, title, visibilityKey, orderKey, defaultWidgets) {
        containerEl.createEl('h2', { text: title });

        const draggableContainer = containerEl.createDiv({ cls: 'cpwn-pm-draggable-widget-list' });

        // 1. --- Master Widget List Creation ---
        let allWidgets = { ...defaultWidgets };
        if (visibilityKey === 'tasksDashboardWidgets') {
            this.plugin.settings.tasksStatsWidgets
                .forEach(widget => {
                    allWidgets[widget.widgetKey] = { name: widget.widgetName };
                });
        }

        if (visibilityKey === 'creationDashboardWidgets') {
            this.plugin.settings.customHeatmaps
                ?.forEach((heatmap, index) => {
                    allWidgets[`custom-${index}`] = { name: heatmap.name || `Custom Heatmap ${index + 1}` };
                });
        }

        // 2. --- Initialize Visibility Settings ---
        const visibilitySettings = this.plugin.settings[visibilityKey];
        let settingsWereUpdated = false;
        for (const key in allWidgets) {
            if (visibilitySettings[key] === undefined) {
                visibilitySettings[key] = true; // Default new widgets to be visible
                settingsWereUpdated = true;
            }
        }
        if (settingsWereUpdated) {
            this.plugin.saveData(this.plugin.settings);
        }
        this.plugin.settings[visibilityKey] = visibilitySettings;


        // 3. --- Get Final Render Order ---
        const getFinalOrder = () => {
            const savedOrder = this.plugin.settings[orderKey] || [];
            const allKeys = Object.keys(allWidgets);
            // Combine and clean up: ensures deleted widgets are removed and new ones are added
            const finalOrder = [...new Set([...savedOrder, ...allKeys])];
            return finalOrder.filter(key => allKeys.includes(key));
        };

        const finalOrder = getFinalOrder();

        // 4. --- Render Draggable Items ---
        finalOrder.forEach(key => {
            if (!allWidgets[key]) return; // Failsafe for deleted custom widgets

            const widgetEl = draggableContainer.createDiv({ cls: 'cpwn-pm-draggable-widget-item', attr: { 'data-widget-key': key } });
            const name = allWidgets[key].name || 'Unknown widget';

            const dragHandle = widgetEl.createDiv({ cls: 'cpwn-pm-drag-handle' });
            setIcon(dragHandle, 'grip-vertical');

            const settingWrapper = widgetEl.createDiv({ cls: 'cpwn-pm-setting-wrapper' });

            new Setting(settingWrapper)
                .setName(name)
                .addToggle(toggle => {
                    toggle
                        .setValue(visibilitySettings[key] ?? true)
                        .onChange(async (value) => {
                            // OPTIMIZED: Only save the setting, no re-render.
                            visibilitySettings[key] = value;
                            await this.saveAndUpdate();
                        });
                });

            widgetEl.draggable = true;
            widgetEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', key);
                e.dataTransfer.effectAllowed = 'move';
                widgetEl.addClass('dragging');
            });

            widgetEl.addEventListener('dragend', () => {
                widgetEl.removeClass('dragging');
            });
        });

        // 5. --- Simplified Drag-and-Drop Event Handlers ---
        draggableContainer.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingEl = draggableContainer.querySelector('.dragging');
            if (!draggingEl) return;

            // Call the function as a method of the class
            const afterElement = this.getDragAfterElement(draggableContainer, e.clientY);

            if (afterElement == null) {
                draggableContainer.appendChild(draggingEl);
            } else {
                draggableContainer.insertBefore(draggingEl, afterElement);
            }
        });

        draggableContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            const newOrder = Array.from(draggableContainer.children).map(child => child.dataset.widgetKey);
            this.plugin.settings[orderKey] = newOrder;
            await this.saveAndUpdate();
        });
    }

    /**
     * Renders a single, performant, draggable list of widgets for a settings screen.
     * This function handles initial rendering, efficient toggling, and smooth drag-and-drop reordering.
     * @param {HTMLElement} containerEl - The parent element to render the list into.
     * @param {string} title - The heading to display for this widget list.
     * @param {'tasksDashboardWidgets' | 'creationDashboardWidgets'} visibilityKey - The key in settings for widget visibility.
     * @param {'tasksDashboardOrder' | 'creationDashboardOrder'} orderKey - The key in settings for widget order.
     * @param {object} defaultWidgets - The master object of all possible default widgets.
     */
    /*
        renderWidgetSettings(containerEl, title, visibilityKey, orderKey, defaultWidgets) {
            //containerEl.createEl('h2', { text: title });
    
            const draggableContainer = containerEl.createDiv({ cls: 'cpwn-pm-draggable-widget-list' });
    
            // 1. --- Master Widget List Creation ---
            let allWidgets = { ...defaultWidgets };
            if (visibilityKey === 'tasksDashboardWidgets') {
                this.plugin.settings.tasksStatsWidgets
                    .forEach(widget => {
                        allWidgets[widget.widgetKey] = { name: widget.widgetName };
                    });
            }
    
            if (visibilityKey === 'creationDashboardWidgets') {
                this.plugin.settings.customHeatmaps
                    ?.forEach((heatmap, index) => {
                        allWidgets[`custom-${index}`] = { name: heatmap.name || `Custom Heatmap ${index + 1}` };
                    });
            }
    
            // 2. --- Initialize Visibility Settings ---
            const visibilitySettings = this.plugin.settings[visibilityKey];
            let settingsWereUpdated = false;
            for (const key in allWidgets) {
                if (visibilitySettings[key] === undefined) {
                    visibilitySettings[key] = true; // Default new widgets to be visible
                    settingsWereUpdated = true;
                }
            }
            if (settingsWereUpdated) {
                this.plugin.saveData(this.plugin.settings);
            }
            this.plugin.settings[visibilityKey] = visibilitySettings;
    
            // 3. --- Get Final Render Order ---
            const getFinalOrder = () => {
                const savedOrder = this.plugin.settings[orderKey] || [];
                const allKeys = Object.keys(allWidgets);
                // Combine and clean up: ensures deleted widgets are removed and new ones are added
                const finalOrder = [...new Set([...savedOrder, ...allKeys])];
                return finalOrder.filter(key => allKeys.includes(key));
            };
    
            const finalOrder = getFinalOrder();
    
            // 4. --- Render Draggable Items ---
            finalOrder.forEach((key, index) => {
                if (!allWidgets[key]) return;
    
                const name = allWidgets[key].name || 'Unknown widget';
                const widgetConfig = this.plugin.settings.tasksStatsWidgets.find(w => w.widgetKey === key);
    
                // Check if this is a section header
                const isSectionHeader = widgetConfig && widgetConfig.type === 'section-header';
    
                // Check if this widget is under a section (look backwards for the nearest section header)
                let isInSection = false;
                for (let i = index - 1; i >= 0; i--) {
                    const prevKey = finalOrder[i];
                    const prevConfig = this.plugin.settings.tasksStatsWidgets.find(w => w.widgetKey === prevKey);
                    if (prevConfig && prevConfig.type === 'section-header') {
                        isInSection = true;
                        break;
                    }
                }
    
                const widgetEl = draggableContainer.createDiv({
                    cls: `cpwn-pm-draggable-widget-item ${isSectionHeader ? 'cpwn-pm-section-header-item' : ''} ${isInSection && !isSectionHeader ? 'cpwn-pm-indented-item' : ''}`
                });
                widgetEl.setAttr('data-widget-key', key);
    
                // Drag handle
                const dragHandle = widgetEl.createDiv({ cls: 'cpwn-pm-drag-handle' });
                setIcon(dragHandle, 'grip-vertical');
    
                const settingWrapper = widgetEl.createDiv({ cls: 'cpwn-pm-setting-wrapper' });
                const setting = new Setting(settingWrapper);
    
                if (isSectionHeader) {
                    // Render section header differently
                    setting.setName(widgetConfig.name);
                    const visibilityStatus = widgetConfig.isVisible !== false ? 'Visible' : 'Not visible';
                    setting.setDesc(`Type: Section header | ${visibilityStatus}`);
    
                    // Add icon preview if configured
                    if (widgetConfig.icon) {
                        const iconPreview = setting.nameEl.createSpan({ cls: 'cpwn-pm-section-icon-preview' });
                        setIcon(iconPreview, widgetConfig.icon);
                        iconPreview.style.color = widgetConfig.iconColor;
                        iconPreview.style.marginRight = '8px';
                        setting.nameEl.prepend(iconPreview);
                    }
    
                    // Style the name with configured settings
                    setting.nameEl.style.color = widgetConfig.textColor;
                    setting.nameEl.style.fontWeight = widgetConfig.fontWeight === 'bold' ? 'bold' : 'normal';
                    setting.nameEl.style.fontStyle = widgetConfig.fontWeight === 'italic' ? 'italic' : 'normal';
                    setting.nameEl.style.fontSize = `${widgetConfig.fontSize}px`;
    
                } else {
                    // Regular widget rendering
                    const widgetType = widgetConfig?.chartType || 'Core widget';
                    const widgetSize = widgetConfig?.size || 'N/A';
                    setting.setName(name);
                    setting.setDesc(`Type: ${widgetType} | Size: ${widgetSize}`);
                }
    
                // Toggle visibility
                setting.addToggle(toggle => {
                    toggle
                        .setValue(this.plugin.settings[visibilityKey][key] ?? true)
                        .onChange(async (value) => {
                            this.plugin.settings[visibilityKey][key] = value;
                            await this.plugin.saveSettings();
                            this.triggerDashboardRefresh();
                        });
                });
    
                // Configure button
                if (isSectionHeader || (widgetConfig && key.startsWith('custom-'))) {
                    setting.addButton(button => {
                        button
                            .setIcon('settings')
                            .setTooltip('Configure')
                            .onClick(() => {
                                if (isSectionHeader) {
                                    // Open section header modal for editing
                                    new SectionHeaderModal(this.app, this.plugin, async (updatedConfig) => {
                                        Object.assign(widgetConfig, updatedConfig);
                                        await this.plugin.saveSettings();
                                        this.renderTasksDashboardSettings(containerEl);
                                        const dashboardView = this.app.workspace.getLeavesOfType('cpwn-calendar-period-week-notes')
                                            .find(leaf => leaf.view instanceof PeriodMonthView)?.view;
                                        if (dashboardView) {
                                            dashboardView.lastTasksState = '';
                                            dashboardView.lastCreationState = '';
                                        }
                                        this.app.workspace.trigger('cpwn-pm-dashboard-refresh');
                                        //new Notice('Section header updated!');
                                    }, widgetConfig).open();
                                } else {
                                    // Open widget builder modal
                                    new WidgetBuilderModal(this.app, this.plugin, widgetConfig, async (updatedConfig) => {
                                        const widgetIndex = this.plugin.settings.tasksStatsWidgets.findIndex(w => w.widgetKey === key);
                                        this.plugin.settings.tasksStatsWidgets[widgetIndex] = updatedConfig;
                                        await this.plugin.saveSettings();
                                        this.renderTasksDashboardSettings(containerEl);
                                        this.triggerDashboardRefresh();
                                        //new Notice(`${updatedConfig.widgetName} updated.`);
                                    }).open();
                                }
                            });
                    });
    
                    // Delete button
                    setting.addButton(button => {
                        button
                            .setIcon('trash')
                            .setTooltip('Delete')
                            .setWarning()
                            .onClick(async () => {
                                if (confirm(`Are you sure you want to delete ${name}?`)) {
                                    const widgetIndex = this.plugin.settings.tasksStatsWidgets.findIndex(w => w.widgetKey === key);
                                    this.plugin.settings.tasksStatsWidgets.splice(widgetIndex, 1);
                                    delete this.plugin.settings.tasksDashboardWidgets[key];
                                    this.plugin.settings.tasksDashboardOrder = this.plugin.settings.tasksDashboardOrder.filter(k => k !== key);
                                    await this.plugin.saveSettings();
                                    this.renderTasksDashboardSettings(containerEl);
                                    this.triggerDashboardRefresh();
                                    new Notice('Widget deleted.');
                                }
                            });
                    });
                } else {
                    // Core widgets - disabled buttons
                    setting.addButton(button => button.setIcon('settings').setTooltip('Core widgets cannot be configured').setDisabled(true));
                    setting.addButton(button => button.setIcon('trash').setTooltip('Core widgets cannot be deleted, use the toggle to hide').setDisabled(true));
                }
    
                // Make draggable
                widgetEl.draggable = true;
                widgetEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', key);
                    widgetEl.addClass('dragging');
                });
                widgetEl.addEventListener('dragend', () => {
                    widgetEl.removeClass('dragging');
                });
            });
    
    
            // 5. --- Simplified Drag-and-Drop Event Handlers ---
            draggableContainer.addEventListener('dragover', e => {
                e.preventDefault();
                const draggingEl = draggableContainer.querySelector('.dragging');
                if (!draggingEl) return;
    
                // Call the function as a method of the class
                const afterElement = this.getDragAfterElement(draggableContainer, e.clientY);
    
                if (afterElement == null) {
                    draggableContainer.appendChild(draggingEl);
                } else {
                    draggableContainer.insertBefore(draggingEl, afterElement);
                }
            });
    
            draggableContainer.addEventListener('drop', async (e) => {
                e.preventDefault();
                const newOrder = Array.from(draggableContainer.children).map(child => child.dataset.widgetKey);
                this.plugin.settings[orderKey] = newOrder;
                await this.saveAndUpdate();
            });
        }
    */
    renderWidgetSettings(containerEl, title, visibilityKey, orderKey, defaultWidgets) {
        const draggableContainer = containerEl.createDiv({
            cls: 'cpwn-pm-draggable-widget-list',
            attr: { 'data-order-key': orderKey }
        });

        // Build widget list
        let allWidgets = { ...defaultWidgets };
        if (visibilityKey === 'tasksDashboardWidgets') {
            this.plugin.settings.tasksStatsWidgets.forEach(widget => {
                allWidgets[widget.widgetKey] = { name: widget.widgetName };
            });
        }

        if (visibilityKey === 'creationDashboardWidgets') {
            this.plugin.settings.customHeatmaps?.forEach((heatmap, index) => {
                allWidgets[`custom-${index}`] = { name: heatmap.name || `Custom Heatmap ${index + 1}` };
            });
        }

        // Initialize visibility
        const visibilitySettings = this.plugin.settings[visibilityKey];
        let settingsWereUpdated = false;
        for (const key in allWidgets) {
            if (visibilitySettings[key] === undefined) {
                visibilitySettings[key] = true;
                settingsWereUpdated = true;
            }
        }
        if (settingsWereUpdated) {
            this.plugin.saveData(this.plugin.settings);
        }

        // Memoized order calculation
        const finalOrder = this.getMemoizedFinalOrder(allWidgets, orderKey);

        // Render with document fragment for better performance
        const fragment = document.createDocumentFragment();
        finalOrder.forEach((key, index) => {
            if (!allWidgets[key]) return;

            const widgetEl = this.createWidgetElement(
                key,
                allWidgets[key].name || 'Unknown widget',
                visibilitySettings,
                visibilityKey,
                index,
                containerEl  // Pass container for callbacks
            );
            fragment.appendChild(widgetEl);
        });
        draggableContainer.appendChild(fragment);

        // Single event listener using delegation
        this.attachDragHandlers(draggableContainer, orderKey);
    }



    // Utility function to capitalize the first letter of a string
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Parses an rgba() string into a hex color and an alpha value.
     * @param {string} rgbaString The input string (e.g., "rgba(255, 165, 0, 0.4)").
     * @returns {{color: string, alpha: number}}
     */
    parseRgba(rgbaString) {
        if (!rgbaString) return { color: '#000000', alpha: 1 };
        const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return { color: '#000000', alpha: 1 };
        const toHex = (c) => ('0' + parseInt(c, 10).toString(16)).slice(-2);
        const color = `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
        const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
        return { color, alpha };
    }

    /**
     * Builds an rgba() string from a hex color and an alpha value.
     * @param {string} hex The hex color string (e.g., "#ffa500").
     * @param {number} alpha The alpha value (0 to 1).
     * @returns {string} The rgba string.
     */
    buildRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }

    /**
     * Creates a custom setting component with a color picker and an alpha slider.
     * @param {string} name The setting name.
     * @param {string} desc The setting description.
     * @param {string} settingKey The key in the settings object to modify.
     */
    createRgbaColorSetting(containerEl, name, desc, settingKey) {
        // These will live inside this function, so they don't pollute the class.
        const getNestedValue = (obj, path) => {
            if (!path) return undefined;
            // This regex converts path['key'] or path[0] to path.key or path.0
            const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
            return keys.reduce((o, k) => (o || {})[k], obj);
        };

        const setNestedValue = (obj, path, value) => {
            if (!path) return;
            const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
            target[lastKey] = value;
        };

        const setting = new Setting(containerEl)
            .setName(name)
            .setDesc(desc);

        let colorPicker;
        let slider;

        // Use the helper to get the initial value, whether it's nested or not
        const initialValue = getNestedValue(this.plugin.settings, settingKey) || getNestedValue(this.currentThemeDefaults, settingKey);
        const { color: initialColor, alpha: initialAlpha } = this.parseRgba(initialValue);

        setting.addColorPicker(picker => {
            colorPicker = picker;
            picker
                .setValue(initialColor)
                .onChange(async (newColor) => {
                    const currentAlpha = slider ? slider.getValue() : 1;
                    const newRgba = this.buildRgba(newColor, currentAlpha);
                    // Use the helper to set the value
                    setNestedValue(this.plugin.settings, settingKey, newRgba);
                    if (picker.colorEl) picker.colorEl.style.backgroundColor = newRgba;
                    await this.saveAndUpdate();
                });
        });

        setting.addSlider(sliderComponent => {
            slider = sliderComponent;
            slider
                .setLimits(0, 1, 0.05)
                .setValue(initialAlpha)
                .setDynamicTooltip()
                .onChange(async (newAlpha) => {
                    const currentColor = colorPicker ? colorPicker.getValue() : '#000000';
                    const newRgba = this.buildRgba(currentColor, newAlpha);
                    // Use the helper to set the value
                    setNestedValue(this.plugin.settings, settingKey, newRgba);
                    if (colorPicker && colorPicker.colorEl) colorPicker.colorEl.style.backgroundColor = newRgba;
                    await this.saveAndUpdate();
                });
        });

        if (colorPicker && colorPicker.colorEl) {
            colorPicker.colorEl.style.backgroundColor = initialValue;
        }

        // --- BUTTONS ---
        setting.addExtraButton(button => {
            button
                .setIcon('copy')
                .setTooltip('Copy color and transparency')
                .onClick(() => {
                    // Use the helper to get the value
                    this.colorClipboard = getNestedValue(this.plugin.settings, settingKey);
                    new Notice('Color copied to clipboard.');
                });
        });

        setting.addExtraButton(button => {
            button
                .setIcon('paste')
                .setTooltip('Paste color and transparency')
                .onClick(async () => {
                    if (!this.colorClipboard) { new Notice('Clipboard is empty.'); return; }
                    // Use the helper to set the value
                    setNestedValue(this.plugin.settings, settingKey, this.colorClipboard);

                    const { color, alpha } = this.parseRgba(this.colorClipboard);
                    if (colorPicker) {
                        colorPicker.setValue(color);
                        if (colorPicker.colorEl) colorPicker.colorEl.style.backgroundColor = this.colorClipboard;
                    }
                    if (slider) slider.setValue(alpha);
                    await this.saveAndUpdate();
                });
        });

        setting.addExtraButton(button => {
            button
                .setIcon('rotate-ccw')
                .setTooltip('Reset to default')
                .onClick(async () => {
                    // Use the helper to get the default value
                    const defaultValue = getNestedValue(this.currentThemeDefaults, settingKey);
                    // Use the helper to set the value
                    setNestedValue(this.plugin.settings, settingKey, defaultValue);

                    const { color, alpha } = this.parseRgba(defaultValue);
                    if (colorPicker) {
                        colorPicker.setValue(color);
                        if (colorPicker.colorEl) colorPicker.colorEl.style.backgroundColor = defaultValue;
                    }
                    if (slider) slider.setValue(alpha);
                    await this.saveAndUpdate();
                });
        });
    }

    /**
     * Creates a simple path suggestion popup for a text input element.
     * @param {HTMLInputElement} inputEl The input element to attach the suggester to.
     * @param {(query: string) => string[]} getSuggestions A function that returns a list of suggestion strings based on a query.
     */
    createPathSuggester(inputEl, getSuggestions) {
        const suggestionEl = createDiv({ cls: 'cpwn-custom-suggestion-container' });
        const parentContainer = inputEl.parentElement;

        // 1. Set up the positioning context
        parentContainer.style.position = 'relative';
        suggestionEl.style.position = 'absolute';
        suggestionEl.style.top = '100%'; // Position directly below the input
        suggestionEl.style.left = '0';
        suggestionEl.style.zIndex = '100';

        // 2. Set flexible width properties
        // Be at least as wide as the input's container.
        suggestionEl.style.minWidth = `${parentContainer.offsetWidth}px`;
        // Allow the width to grow automatically with the content.
        suggestionEl.style.width = 'auto';
        // Prevent it from becoming excessively wide on large screens.
        suggestionEl.style.maxWidth = '500px';

        suggestionEl.style.display = 'none';
        parentContainer.appendChild(suggestionEl);

        const showSuggestions = () => {
            const query = inputEl.value.toLowerCase();
            const suggestions = getSuggestions(query);
            suggestionEl.empty();

            if (suggestions.length === 0 || query.trim() === '') {
                suggestionEl.style.display = 'none';
                return;
            }

            suggestionEl.style.display = 'block';
            suggestions.slice(0, 10).forEach(path => {
                const item = suggestionEl.createDiv({ cls: 'cpwn-custom-suggestion-item', text: path });

                // --- Style for Text Wrapping ---
                // Allow long folder paths to wrap onto multiple lines.
                item.style.whiteSpace = 'normal';
                // Break very long words to prevent horizontal overflow.
                item.style.wordBreak = 'break-all';
                // --- End ---

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


    /**
     * Creates a settings section for managing a list of ignored folder paths.
     * @param {HTMLElement} containerEl The parent container for this setting section.
     * @param {string} name The heading name for the section.
     * @param {string} desc The description for the section.
     * @param {string} settingKey The key in the settings object for the ignored folder array.
     */
    createIgnoredFolderList(containerEl, name, desc, settingKey) {
        new Setting(containerEl).setName(name).setDesc(desc).setHeading();
        const ignoredFolders = this.plugin.settings[settingKey];
        if (ignoredFolders && ignoredFolders.length > 0) {
            ignoredFolders.forEach((folder, index) => {
                new Setting(containerEl).setName(folder).addButton(button => {
                    button.setIcon("trash").setTooltip("Remove folder")
                        .onClick(async () => {
                            this.plugin.settings[settingKey].splice(index, 1);
                            await this.saveAndUpdate();
                            this.refreshDisplay();
                        });
                });
            });
        } else {
            containerEl.createEl('p', { text: 'No folders are being ignored.', cls: 'cpwn-setting-item-description' });
        }
        const addSetting = new Setting(containerEl);
        let textInput;
        addSetting.addText(text => {
            textInput = text;
            const getFolders = (query) => this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && (!query || f.path.toLowerCase().includes(query))).map(f => f.path);
            this.createPathSuggester(text.inputEl, getFolders);
            text.setPlaceholder("Enter folder path to ignore...");
        }).addButton(button => {
            button.setButtonText("Add").setTooltip("Add this folder to the ignore list")
                .onClick(async () => {
                    const newFolder = textInput.getValue();
                    if (newFolder && !this.plugin.settings[settingKey].includes(newFolder)) {
                        this.plugin.settings[settingKey].push(newFolder);
                        await this.saveAndUpdate();
                        this.refreshDisplay();
                    }
                });
        });
    }

    async display() {
        const { containerEl } = this;
        containerEl.empty();

        await this.loadCurrentThemeDefaults();

        // Create the main two-column layout
        const settingsContainer = containerEl.createDiv({ cls: 'cpwn-period-settings-container' });
        const navEl = settingsContainer.createDiv({ cls: 'cpwn-period-settings-nav' });
        this.contentEl = settingsContainer.createDiv({ cls: 'cpwn-period-settings-content' }); // Assign content area to this.contentEl

        const tabs = {
            general: "General display",
            functional: "Calendar functional",
            popup: "Popup controls",
            dots: "Dot indicators",
            weeklyNotes: "Weekly notes",
            tasksIndicator: "Task indicators",
            tabs: "General Tab",
            scratchpad: "Scratchpad tab",
            notes: "Notes tab",
            pinned: 'Pinned notes tab',
            assets: "Assets tab",
            tasks: "Tasks tab",
            dashboard: 'Dashboard tab',
            goals: 'Goal configuration',
            themes: "Themes",
            importExport: "Import / Export",
            startHere: "Help",
            about: "About"
        };

        // Create the navigation buttons on the left
        for (const [key, label] of Object.entries(tabs)) {
            const button = navEl.createEl('button', { text: label });
            if (this.activeTab === key) {
                button.addClass('is-active');
            }
            button.addEventListener('click', () => {
                this.activeTab = key;
                this.display(); // Re-render the whole tab on click
            });
        }

        // Now, render the content for the active tab into this.contentEl
        this.renderContentForActiveTab();
    }

    // Function to render the draggable list of pinned notes
    async renderDraggablePinnedNotes(container) {
        container.empty();

        const pinValue = this.plugin.settings.pinTag.toLowerCase();
        const allMarkdownFiles = this.app.vault.getMarkdownFiles();

        // Filter for pinned notes (using logic)
        const pinnedNotes = allMarkdownFiles.filter(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) return false;

            // Check tags
            const hasPinTag = cache.tags?.some(tag => tag.tag.toLowerCase().includes(pinValue));
            if (hasPinTag) return true;

            // Check frontmatter
            const frontmatter = cache.frontmatter;
            if (frontmatter) {
                for (const key in frontmatter) {
                    const value = frontmatter[key];
                    if (typeof value === 'string' && value.toLowerCase().includes(pinValue)) return true;
                    if (Array.isArray(value) && value.some(item => typeof item === 'string' && item.toLowerCase().includes(pinValue))) return true;
                }
            }
            return false;
        });

        const customOrder = this.plugin.settings.pinnedNotesCustomOrder || [];

        // Sort the notes based on the saved custom order, with a fallback for new notes
        pinnedNotes.sort((a, b) => {
            const indexA = customOrder.indexOf(a.path);
            const indexB = customOrder.indexOf(b.path);

            if (indexA === -1 && indexB === -1) return a.basename.localeCompare(b.basename);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        // Create draggable elements
        pinnedNotes.forEach(file => {
            const itemEl = container.createDiv({ cls: 'cpwn-draggable-item' });
            itemEl.draggable = true;
            itemEl.dataset.filePath = file.path;

            const handle = itemEl.createDiv({ cls: 'drag-handle' });
            setIcon(handle, 'grip-vertical');
            itemEl.createSpan({ text: file.basename });

            // Drag-and-Drop Event Listeners
            itemEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', file.path);
                itemEl.classList.add('dragging');
            });

            itemEl.addEventListener('dragend', () => {
                itemEl.classList.remove('dragging');
            });

            itemEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingItem = container.querySelector('.dragging');
                if (draggingItem && draggingItem !== itemEl) {
                    const rect = itemEl.getBoundingClientRect();
                    const isAfter = e.clientY > rect.top + rect.height / 2;
                    if (isAfter) {
                        itemEl.parentNode.insertBefore(draggingItem, itemEl.nextSibling);
                    } else {
                        itemEl.parentNode.insertBefore(draggingItem, itemEl);
                    }
                }
            });
        });

        // Save the new order on drop (by listening on the container)
        container.addEventListener('drop', async () => {
            const newOrder = Array.from(container.children).map(child => child.dataset.filePath);
            this.plugin.settings.pinnedNotesCustomOrder = newOrder;
            await this.plugin.saveSettings();
            new Notice('Custom pinned order saved!');
        });
    }

    renderContentForActiveTab() {
        this.contentEl.empty();
        switch (this.activeTab) {
            case 'general':
                this.renderGeneralSettings();
                break;
            case 'functional':
                this.renderFunctionalSettings();
                break;
            case 'popup':
                this.renderPopupSettings();
                break;
            case 'dots':
                this.renderDotsSettings();
                break;
            case 'weeklyNotes':
                this.renderWeeklyNotesSettings();
                break;
            case 'tasksIndicator':
                this.renderTaskIndicatorSettings();
                break;
            case 'tabs':
                this.renderTabsSettings();
                break;
            case 'scratchpad':
                this.renderScratchpadSettings();
                break;
            case 'notes':
                this.renderNotesSettings();
                break;
            case 'pinned':
                this.renderPinnedNotesSettings();
                break;
            case 'assets':
                this.renderAssetsSettings();
                break;
            case 'tasks':
                this.renderTasksSettings();
                break;
            case 'dashboard':
                this.renderDashboardSettings();
                break;
            case 'goals':
                this.renderGoalsSettings();
                break;
            case 'themes':
                this.renderThemesSettings();
                break;
            case 'importExport':
                this.renderImportExportTab();
                break;
            case 'startHere':
                this.renderStartHereTab();
                break;
            case 'about':
                this.renderAboutTab();
                break;
        }
    }

    // --- RENDER METHODS FOR EACH TAB ---
    renderGeneralSettings() {
        const containerEl = this.contentEl;
        containerEl.empty();

        containerEl.createEl("h1", { text: "General display settings" });

        // --- Titles & Headers Section ---
        new Setting(containerEl).setName("Titles & headers").setHeading();
        const monthTitleSetting = new Setting(containerEl).setName("Month title format");
        const descHtml = `
            Set the format for the calendar's month title. Uses <a href="https://momentjs.com/docs/#/displaying/format/">moment.js</a> format strings, e.g.
            <br><code>YYYY</code>: 4-digit year (e.g., 2025)
            <br><code>YY</code>: 2-digit year (e.g., 25)
            <br><code>MMMM</code>: Full month name (e.g., September)
            <br><code>MMM</code>: Short month name (e.g., Sep)
            <br><code>MM</code>: 2-digit month (e.g., 09)
            <br><code>M</code>: Month number (e.g., 9)
        `;
        monthTitleSetting.descEl.empty();
        monthTitleSetting.descEl.appendChild(sanitizeHTMLToDom(descHtml));


        monthTitleSetting.addText(text => text.setPlaceholder("MMMM YYYY").setValue(this.plugin.settings.monthTitleFormat).onChange(async (value) => { this.plugin.settings.monthTitleFormat = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Month title font size").setDesc("Font size for the main 'Month Year' title at the top of the calendar. Default is 22px.").addText(text => text.setValue(this.plugin.settings.mainMonthYearTitleFontSize).onChange(async value => { this.plugin.settings.mainMonthYearTitleFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("Bold month in title")
            .setDesc("Toggles bold font weight for the month part of the title.")
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.mainMonthTitleBold)
                    .onChange(async (value) => {
                        this.plugin.settings.mainMonthTitleBold = value;
                        await this.saveAndUpdate();
                    });
            });

        this.createRgbaColorSetting(containerEl, "Month title color (Light mode)", "Color for the main 'Month' title in light mode.", "monthColorLight");
        this.createRgbaColorSetting(containerEl, "Month title color (Dark mode)", "Color for the main 'Month' title in dark mode.", "monthColorDark");

        new Setting(containerEl)
            .setName("Bold year in title")
            .setDesc("Toggles bold font weight for the year part of the title.")
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.mainYearTitleBold)
                    .onChange(async (value) => {
                        this.plugin.settings.mainYearTitleBold = value;
                        await this.saveAndUpdate();
                    });
            });

        this.createRgbaColorSetting(
            containerEl,
            'Year title color (Light mode)',
            'Color for the year text in the main title in light mode.',
            'yearColorLight'
        );
        this.createRgbaColorSetting(
            containerEl,
            'Year title color (Dark mode)',
            'Color for the year text in the main title in dark mode.',
            'yearColorDark'
        );

        new Setting(containerEl).setName("Navigation buttons height").setDesc("Default is 28px.").addText(text => text.setValue(this.plugin.settings.navButtonHeight).onChange(async value => { this.plugin.settings.navButtonHeight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold calendar header").setDesc("Toggles bold font weight for the day names row (Mon, Tue, etc.).").addToggle(toggle => toggle.setValue(this.plugin.settings.headerRowBold).onChange(async value => { this.plugin.settings.headerRowBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Day header row font color (Light mode)", "Text color for the day names (Sun, Mon, Tue, etc.) in light theme.", "dayHeaderFontColorLight");
        this.createRgbaColorSetting(containerEl, "Day header row font color (Dark mode)", "Text color for the day names (Sun, Mon, Tue, etc.) in dark theme.", "dayHeaderFontColorDark");

        // --- Calendar Grid Section ---
        new Setting(containerEl).setName("Calendar grid").setHeading();

        new Setting(containerEl)
            .setName("Calendar grid layout")
            .setDesc("Choose between a spacious, normal or condensed layout for the calendar grid.")
            .addDropdown(dropdown => dropdown
                .addOption('spacious', 'Spacious')
                .addOption('normal', 'Normal')
                .addOption('condensed', 'Condensed')
                .setValue(this.plugin.settings.calendarLayout)
                .onChange(async (value) => {
                    this.plugin.settings.calendarLayout = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName('Calendar grid labels font size')
            .setDesc('Font size for calendar day lables and week, period/week columns. Default is 12px.')
            .addText(text => text
                .setValue(this.plugin.settings.fontSize)
                .onChange(async (value) => {
                    this.plugin.settings.fontSize = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl).setName("Calendar grid day numbers font size").setDesc("Font size for the day numbers in the calendar grid. Default is 15px.").addText(text => text.setValue(this.plugin.settings.dayNumberFontSize).onChange(async value => { this.plugin.settings.dayNumberFontSize = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Date cell font color (Light Mode)", "Text color for the date numbers in light theme.", "dayCellFontColorLight");
        this.createRgbaColorSetting(containerEl, "Date cell font color (Dark Mode)", "Text color for the date numbers in dark theme.", "dayCellFontColorDark");
        this.createRgbaColorSetting(containerEl, "Other month date font color (Light Mode)", "Text color for dates outside the current month in light theme.", "otherMonthFontColorLight");
        this.createRgbaColorSetting(containerEl, "Other month date font color (Dark Mode)", "Text color for dates outside the current month in dark theme.", "otherMonthFontColorDark");

        new Setting(containerEl).setName("Show calendar grid lines").setDesc("Toggles the visibility of border lines around each date cell.").addToggle(toggle => toggle.setValue(this.plugin.settings.showCalendarGridLines).onChange(async value => { this.plugin.settings.showCalendarGridLines = value; await this.saveAndUpdate(); }));
        new Setting(containerEl)
            .setName("Calendar grid gap width")
            .setDesc("Width of the gap/border between calendar cells. The grid lines setting above needs to be toggled on. (e.g., 1px, 2px, 0.5px). Default is 1px.")
            .addText(text => text
                .setPlaceholder("1px")
                .setValue(this.plugin.settings.calendarGridGapWidth)
                .onChange(async (value) => {
                    this.plugin.settings.calendarGridGapWidth = value || "1px";
                    await this.saveAndUpdate();
                }));

        // --- Corrected Dynamic "Today's date style" Section ---
        const todayStyleSetting = new Setting(containerEl)
            .setName("Today's date style")
            .setDesc("Choose how to indicate the current day on the calendar.");

        const todayHighlightSizeSetting = new Setting(containerEl)
            .setName("Today circle highlight size")
            .setDesc("Adjust the size of the 'today' highlight circle.")
            .addSlider(slider => slider
                .setLimits(1.5, 3.4, 0.1) // Min size, Max size, Step increment

                .setValue(parseFloat(this.plugin.settings.todayHighlightSize))

                .setDynamicTooltip() // Shows the current value as you slide
                .onChange(async (value) => {

                    this.plugin.settings.todayHighlightSize = `${value}em`;
                    await this.saveAndUpdate();
                    this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => {
                        if (leaf.view instanceof CalendarPeriodWeekView) {
                            leaf.view.containerEl.style.setProperty(
                                '--today-highlight-size',
                                this.plugin.settings.todayHighlightSize // Now using the correct value from settings
                            );
                        }
                    });
                }));

        const highlightOptionsContainer = containerEl.createDiv();
        const renderHighlightOptions = (style) => {
            highlightOptionsContainer.empty();

            if (style === 'cell') {
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's date cell highlight (Light mode)", "Background color for the current day's cell in light mode.", "todayHighlightColorLight");
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's date cell highlight (Dark mode)", "Background color for the current day's cell in dark mode.", "todayHighlightColorDark");
            } else if (style === 'circle' || style === 'number') {

                this.createRgbaColorSetting(highlightOptionsContainer, "Today's date highlight color (Light mode)", "Controls the highlight for Circle/Square styles in light mode.", "todayCircleColorLight");
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's date highlight color (Dark mode)", "Controls the highlight for Circle/Square styles in dark mode.", "todayCircleColorDark");
            }

            if (style === 'circle') {

                todayHighlightSizeSetting.settingEl.style.display = '';
            } else {
                todayHighlightSizeSetting.settingEl.style.display = 'none';

            }
        };

        todayStyleSetting.addDropdown(dropdown => {
            dropdown
                .addOption('none', 'Off (no highlight)')
                .addOption('cell', 'Highlight cell')
                .addOption('circle', 'Circle around date')
                .addOption('number', 'Square around date')
                .setValue(this.plugin.settings.todayHighlightStyle)
                .onChange(async (value) => {
                    this.plugin.settings.todayHighlightStyle = value;
                    await this.saveAndUpdate();
                    renderHighlightOptions(value);
                });
        });

        renderHighlightOptions(this.plugin.settings.todayHighlightStyle);

        new Setting(containerEl).setName("Highlight today's day header").setDesc("Colors the day column header (Sun, Mon, etc.) containing today.").addToggle(toggle => toggle.setValue(this.plugin.settings.highlightTodayDayHeader).onChange(async value => { this.plugin.settings.highlightTodayDayHeader = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Highlight today's P/W or week number").setDesc("Colors the Period/Week or Calendar Week number for the current week.").addToggle(toggle => toggle.setValue(this.plugin.settings.highlightTodayPWLabel).onChange(async value => { this.plugin.settings.highlightTodayPWLabel = value; await this.saveAndUpdate(); }));

        this.createRgbaColorSetting(
            containerEl,
            "Current day / Week label highlight (Light mode)",
            "Color for the current day's labels, (e.g. SUN, MON) and period week / calendar week labels in light mode.",
            "currentHighlightLabelColorLight"
        );

        this.createRgbaColorSetting(
            containerEl,
            "Current day / Week label highlight (Dark mode)",
            "Color for the current day's labels, (e.g. SUN, MON) and period week / calendar week labels in dark mode.",
            "currentHighlightLabelColorDark"
        );

        this.createRgbaColorSetting(containerEl, "Date cell hover color (Light mode)", "Background color when hovering over a date cell in light mode.", "dateCellHoverColorLight");
        this.createRgbaColorSetting(containerEl, "Date cell hover color (Dark mode)", "Background color when hovering over a date cell in dark mode.", "dateCellHoverColorDark");
        new Setting(containerEl).setName("Bold period/Week column").setDesc("Toggles bold font weight for the Period/Week column.").addToggle(toggle => toggle.setValue(this.plugin.settings.pwColumnBold).onChange(async value => { this.plugin.settings.pwColumnBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show P/W separator line").setDesc("Display a vertical line between the week columns and the date grid.").addToggle(toggle => toggle.setValue(this.plugin.settings.showPWColumnSeparator).onChange(async value => { this.plugin.settings.showPWColumnSeparator = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "P/W separator line color", "Color of the vertical separator line.", "pwColumnSeparatorColor");
        this.createRgbaColorSetting(containerEl, "Period/Week column font color (Light Mode)", "Text color for the Period/Week column in light theme.", "pwColumnFontColorLight");
        this.createRgbaColorSetting(containerEl, "Period/Week column font color (Dark Mode)", "Text color for the Period/Week column in dark theme.", "pwColumnFontColorDark");
        this.createRgbaColorSetting(containerEl, "Week number column font color (Light Mode)", "Text color for the week number column in light theme.", "weekNumberFontColorLight");
        this.createRgbaColorSetting(containerEl, "Week number column font color (Dark Mode)", "Text color for the week number column in dark theme.", "weekNumberFontColorDark");
    }

    renderFunctionalSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Calendar functional settings" });

        // --- Period/Week System Section ---
        new Setting(containerEl).setName("Period/Week system").setHeading();

        new Setting(containerEl)
            .setName("Week starts on")
            .setDesc("Choose whether the calendar week starts on Sunday or Monday.")
            .addDropdown(dropdown => dropdown
                .addOption('monday', 'Monday')
                .addOption('sunday', 'Sunday')
                .setValue(this.plugin.settings.weekStartDay)
                .onChange(async (value) => {
                    this.plugin.settings.weekStartDay = value;
                    await this.saveAndUpdate();
                    // Refresh the settings tab to show the updated validation message
                    this.refreshDisplay();
                }));

        const requiredDay = this.plugin.settings.weekStartDay === 'monday' ? 1 : 0; // Monday is 1, Sunday is 0
        const requiredDayName = this.plugin.settings.weekStartDay.charAt(0).toUpperCase() + this.plugin.settings.weekStartDay.slice(1);

        new Setting(containerEl)
            .setName("Start of period 1 week 1")
            .setDesc(`The date for the start of P1W1. This date must be a ${requiredDayName} to match your 'Week starts on' setting.`) // Dynamic description
            .addText(text => {
                text.inputEl.type = "date";
                text.setValue(this.plugin.settings.startOfPeriod1Date)
                    .onChange(async value => {
                        const selectedDate = moment(value, "YYYY-MM-DD");
                        if (selectedDate.day() !== requiredDay) {
                            new Notice(`Error: The start date must be a ${requiredDayName}.`, 5000);
                            return; // Do not save the invalid date
                        }
                        this.plugin.settings.startOfPeriod1Date = value;
                        await this.saveAndUpdate();
                    });
            });

        new Setting(containerEl).setName("Period/week format").setDesc("Choose the display format for the P/W column.").addDropdown(dropdown => dropdown.addOption("P#W#", "P#W#").addOption("P# W#", "P# W#").addOption("# W#", "# W#").addOption("p#w#", "p#p#").addOption("p# w#", "p# w#").addOption("# w#", "# w#").addOption("#-#", "#-#").addOption("# - #", "# - #").addOption("#/#", "#/#").addOption("# / #", "# / #").addOption("#,#", "#,#").addOption("#, #", "#, #").setValue(this.plugin.settings.pwFormat).onChange(async (value) => { this.plugin.settings.pwFormat = value; await this.saveAndUpdate(); }));

        new Setting(containerEl).setName("Show period/week column").setDesc("Show or hide the Period/Week column on the left side of the calendar.").addToggle(toggle => toggle.setValue(this.plugin.settings.showPWColumn).onChange(async value => { this.plugin.settings.showPWColumn = value; await this.saveAndUpdate(); }));

        // --- Week Numbers Section ---
        new Setting(containerEl).setName("Week numbers").setHeading();

        new Setting(containerEl)
            .setName("Show week number column")
            .setDesc("Display a column for week numbers on the left side of the calendar.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showWeekNumbers)
                .onChange(async (value) => {
                    this.plugin.settings.showWeekNumbers = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Week number type")
            .setDesc("Choose which week numbering system to use.")
            .addDropdown(dropdown => dropdown
                .addOption('period', 'Period System Week')
                .addOption('calendar', 'Calendar Year Week (ISO)')
                .setValue(this.plugin.settings.weekNumberType)
                .onChange(async (value) => {
                    this.plugin.settings.weekNumberType = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Week number column label")
            .setDesc("The text to display at the top of the week number column.")
            .addText(text => text
                .setValue(this.plugin.settings.weekNumberColumnLabel)
                .onChange(async (value) => {
                    this.plugin.settings.weekNumberColumnLabel = value;
                    await this.saveAndUpdate();
                }));

        // --- Daily Notes Section ---
        new Setting(containerEl).setName("Daily notes").setHeading();
        new Setting(containerEl).setName("Daily notes folder").setDesc("Specify the folder where your daily notes are stored and created.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && (!q || f.path.toLowerCase().includes(q))).map(f => f.path)); text.setValue(this.plugin.settings.dailyNotesFolder).onChange(async value => { this.plugin.settings.dailyNotesFolder = value; await this.saveAndUpdate(); }); });
        new Setting(containerEl).setName("Daily note open behavior").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.dailyNoteOpenAction).onChange(async (value) => { this.plugin.settings.dailyNoteOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Daily note template").setDesc("Path to a template file to use when creating a new daily note.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path)); text.setPlaceholder("Example: Templates/Daily.md").setValue(this.plugin.settings.dailyNoteTemplatePath).onChange(async (value) => { this.plugin.settings.dailyNoteTemplatePath = value; await this.saveAndUpdate(); }); });

        // --- Grid Highlighting Section ---
        new Setting(containerEl).setName("Grid highlighting").setHeading();
        new Setting(containerEl).setName("Enable row highlight").setDesc("Highlights the entire week's row when hovering over the P/W label.").addToggle(toggle => toggle.setValue(this.plugin.settings.enableRowHighlight).onChange(async (value) => { this.plugin.settings.enableRowHighlight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Enable column highlight").setDesc("Highlights the entire day's column when hovering over the day name (e.g., Mon).").addToggle(toggle => toggle.setValue(this.plugin.settings.enableColumnHighlight).onChange(async (value) => { this.plugin.settings.enableColumnHighlight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Enable complex grid highlight").setDesc("When hovering a date, highlights all cells in its row and column up to that date.").addToggle(toggle => toggle.setValue(this.plugin.settings.enableRowToDateHighlight).onChange(async (value) => { this.plugin.settings.enableRowToDateHighlight = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("Always highlight current week")
            .setDesc("Keeps the entire row for the current week permanently highlighted.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightCurrentWeek)
                .onChange(async (value) => {
                    this.plugin.settings.highlightCurrentWeek = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(containerEl, "Grid highlight color (Light mode)", "Color for row/column highlighting on hover in light mode.", "rowHighlightColorLight");
        this.createRgbaColorSetting(containerEl, "Grid highlight color (Dark mode)", "Color for row/column highlighting on hover in dark mode.", "rowHighlightColorDark");

        new Setting(containerEl)
            .setName("Highlight weekends")
            .setDesc("Shade Saturday and Sunday columns with a subtle background color.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.highlightWeekends)
                .onChange(async (value) => {
                    this.plugin.settings.highlightWeekends = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(
            containerEl,
            "Weekend shade color (Light mode)",
            "Background color for Saturday and Sunday columns in light theme.",
            "weekendShadeColorLight"
        );

        this.createRgbaColorSetting(
            containerEl,
            "Weekend shade color (Dark mode)",
            "Background color for Saturday and Sunday columns in dark theme.",
            "weekendShadeColorDark"
        );

        new Setting(containerEl).setName("Integrate external calendar events").setHeading();

        new Setting(containerEl)
            .setName('External calendar URL (.ics)')
            .setDesc('Integrate an external .ics feed calendar URL (e.g., from Google Calendar using the \'Secret address in iCal format\' or \'Public address in iCal Format\') to indicate events as dots in the calendar grid and event details in the date popup box.')
            .addText(text => {
                text
                    .setPlaceholder('https://calendar.google.com/calendar/ical/.../basic.ics')
                    .setValue(this.plugin.settings.icsUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.icsUrl = value;
                        await this.saveAndUpdate();
                    });
                text.inputEl.style.minWidth = "300px";
                text.inputEl.style.resize = "vertical";
            })
            .settingEl.style.alignItems = "flex-start";

        new Setting(containerEl)
            .setName('Auto-refresh interval')
            .setDesc('How often the external calendar URL should be automatically refreshed in the background.')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('15', '15 minutes')
                    .addOption('30', '30 minutes')
                    .addOption('60', '1 hour')
                    .addOption('180', '3 hours')
                    .addOption('360', '6 hours')
                    .addOption('720', '12 hours')
                    .setValue(this.plugin.settings.icsRefreshInterval.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.icsRefreshInterval = parseInt(value, 10);
                        await this.plugin.saveSettings();

                        // Call a method on the main plugin to reset the timer
                        this.plugin.resetIcsRefreshInterval();
                    });
            });

        new Setting(containerEl)
            .setName('Calendar event indicator')
            .setDesc('Choose how to display external calendar events on the calendar grid. "Dot" shows a separate colored dot, while "Heatmap" and "Badge" will add the event count to the existing task indicators. If you select "Heatmap" or "Badge", ensure that the corresponding task indicator option is also enabled in the "Task Indicators" settings tab. Settings will be applied after closing the settings window.')
            .addDropdown(dropdown => dropdown
                .addOption('dot', 'Dot only')
                .addOption('heatmap', 'Add to heatmap')
                .addOption('badge', 'Add to task badge')
                .setValue(this.plugin.settings.calendarEventIndicatorStyle || 'dot')
                .onChange(async (value) => {
                    // Step 1: Save the new value
                    this.plugin.settings.calendarEventIndicatorStyle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Calendar events placeholder')
            .setDesc('The placeholder text to use in your daily note template. The plugin will replace this text with calendar events.')
            .addText(text => {
                text
                    .setPlaceholder('%%CALENDAR_EVENTS%%')
                    .setValue(this.plugin.settings.calendarEventsPlaceholder)
                    .onChange(async (value) => {
                        this.plugin.settings.calendarEventsPlaceholder = value.trim() || '%%CALENDAR_EVENTS%%';
                        await this.plugin.saveSettings();
                    });

                // Set the minimum width for the text input field
                text.inputEl.style.minWidth = "300px";
                text.inputEl.style.resize = "vertical";
            })
            .settingEl.style.alignItems = "flex-start";


        const calendarFormatSetting = new Setting(containerEl)
            .setName('Calendar event format')
            .addTextArea(text => {
                text
                    .setPlaceholder('- {{startTime}} - {{endTime}}: {{summary}}')
                    .setValue(this.plugin.settings.calendarEventsFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.calendarEventsFormat = value || '- {{startTime}} - {{endTime}}: {{summary}}';
                        await this.plugin.saveSettings();
                    });

                // Apply styles to the textarea element
                text.inputEl.style.minWidth = "300px";
                text.inputEl.style.minHeight = "100px";
                text.inputEl.style.resize = "vertical";
            });

        const descEl = calendarFormatSetting.descEl;
        descEl.appendText('Customize the format for each calendar event. Use these placeholders:');

        const placeholderList = descEl.createEl('ul');

        const placeholders = [
            { code: '{{summary}}', text: 'The event title' },
            { code: '{{startTime}}', text: 'The event start time (or "All-day")' },
            { code: '{{endTime}}', text: 'The event end time' }
        ];

        placeholders.forEach(p => {
            const item = placeholderList.createEl('li');
            item.createEl('code', { text: p.code });
            item.appendText(` ${p.text}`);
        });

        // Align the entire setting row to the top
        calendarFormatSetting.settingEl.style.alignItems = "flex-start";

    }

    renderPopupSettings() {

        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Popup controls" });

        // --- Popups Section ---
        new Setting(containerEl).setName("Popup hover delay").setDesc("How long to wait before showing the note list popup on hover. Default is 800.").addText(text => text.setValue(String(this.plugin.settings.otherNoteHoverDelay)).onChange(async (value) => { this.plugin.settings.otherNoteHoverDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup hide delay").setDesc("How long to wait before hiding the popup after the mouse leaves. Default is 50.").addText(text => text.setValue(String(this.plugin.settings.popupHideDelay)).onChange(async (value) => { this.plugin.settings.popupHideDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup gap").setDesc("The gap (in pixels) between a calendar day and its popup list. Can be negative. Default is -2.").addText(text => text.setValue(String(this.plugin.settings.popupGap)).onChange(async (value) => { this.plugin.settings.popupGap = Number(value) || -2; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup font size").setDesc("The font size for the note names inside the calendar popup. Default is 14px.").addText(text => text.setValue(this.plugin.settings.otherNotePopupFontSize).onChange(async value => { this.plugin.settings.otherNotePopupFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName('Notes & assets popup trigger')
            .setDesc('Choose how popups appear in the Notes and Assets tabs: on hover, or on right-click (which corresponds to a long-press on mobile).')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('hover', 'Hover')
                    .addOption('rightclick', 'Right-click / Long-press')
                    .setValue(this.plugin.settings.listPopupTrigger || 'hover')
                    .onChange(async (value) => {
                        this.plugin.settings.listPopupTrigger = value;
                        await this.plugin.saveSettings();

                        // Refresh the notes and assets views to apply the new behavior instantly
                        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => {
                            if (leaf.view && typeof leaf.view.populateNotes === 'function') {
                                // Call both populate functions. Since they check for their
                                // own container's existence, only the one for the active
                                // tab in that view instance will actually run.
                                leaf.view.populateNotes();
                                leaf.view.populateAssets();
                            }
                        });
                    });
            });

    }

    renderDotsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Dot indicators" });
        // --- Dot Functionality Section ---
        new Setting(containerEl).setName("Calendar Functionality & Style").setHeading();
        new Setting(containerEl).setName("Show dot for created notes").setDesc("Show a dot on days where any note (that is not a daily note) was created.").addToggle(toggle => toggle.setValue(this.plugin.settings.showOtherNoteDot).onChange(async value => { this.plugin.settings.showOtherNoteDot = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show dot for modified notes").setDesc("Show a dot on days where any note (that is not a daily note) was modified.").addToggle(toggle => toggle.setValue(this.plugin.settings.showModifiedFileDot).onChange(async value => { this.plugin.settings.showModifiedFileDot = value; await this.saveAndUpdate(); }));
        new Setting(containerEl)
            .setName("Show dot for new assets")
            .setDesc("Show a dot on days where an asset (image, PDF, etc.) was added to the vault.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showAssetDot)
                .onChange(async (value) => {
                    this.plugin.settings.showAssetDot = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName('Show dot for external ics calendar events')
            .setDesc('Show a dot on days that have a calendard event from an external calendar source, e.g. Google Calendar.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showIcsDot)
                .onChange(async (value) => {
                    this.plugin.settings.showIcsDot = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl).setName("Calendar dot size").setDesc("The size (in pixels) of the colored dots that appear under calendar days. Default is 4.").addText(text => text.setValue(String(this.plugin.settings.calendarDotSize)).onChange(async (value) => { this.plugin.settings.calendarDotSize = Number(value) || 4; await this.saveAndUpdate(); }));

        // --- Dot Colors Section ---
        new Setting(containerEl).setName("Dot colors").setHeading();
        this.createRgbaColorSetting(containerEl, "Daily note", "Used for daily notes.", "dailyNoteDotColor");
        this.createRgbaColorSetting(containerEl, "Created note", "Uses the created file date for notes, not used for Daily / Weekly Notes.", "noteCreatedColor");
        this.createRgbaColorSetting(containerEl, "Modified note", "Uses the modified file date for notes, not used for Daily / Weekly Notes.", "noteModifiedColor");
        this.createRgbaColorSetting(containerEl, "Asset note", "Uses the created file date for newly added assets.", "assetDotColor");
        this.createRgbaColorSetting(containerEl, 'Calendar event', 'Used for events from your iCal/.ics feed.', 'calendarEventDotColor');
        this.createIgnoredFolderList(containerEl, "Ignore folders for note dots", "Files in these folders will not create 'created' or 'modified' dots on the calendar grid or lists.", 'otherNoteIgnoreFolders');
        this.createIgnoredFolderList(containerEl, "Ignore folders for asset dots", "Assets in these folders will not create dots on the calendar and lists.", 'assetIgnoreFolders');

    }

    renderWeeklyNotesSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Weekly notes settings" });

        new Setting(containerEl)
            .setName("Enable weekly notes")
            .setDesc("Enable clicking on week numbers to open/create weekly notes and show the dot indicator.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableWeeklyNotes)
                .onChange(async (value) => {
                    this.plugin.settings.enableWeeklyNotes = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Weekly note folder")
            .setDesc("The folder where your weekly notes are stored. It will be created if it doesn't exist.")
            .addText(text => {
                this.createPathSuggester(text.inputEl, (q) => this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && (!q || f.path.toLowerCase().includes(q))).map(f => f.path));
                text.setValue(this.plugin.settings.weeklyNoteFolder)
                    .onChange(async value => {
                        this.plugin.settings.weeklyNoteFolder = value;
                        await this.saveAndUpdate();
                    });
            });

        // In the PeriodSettingsTab class, inside renderWeeklyNotesSettings()
        const weeklyFormatSetting = new Setting(containerEl).setName("Weekly note format");
        const weeklyDescHtml = `
            Set the filename format for weekly notes using dots, hyphens, or other separators.
            <br>The following placeholders will be replaced automatically:
            <br><code>YYYY</code> - The 4-digit year (e.g., 2025)
            <br><code>MM</code> - The 2-digit month (e.g., 08)
            <br><code>PN</code> - The Period Number with a 'P' prefix (e.g., P8)
            <br><code>PW</code> - The week number within the period with a 'W' prefix (e.g., W2)
            <br><code>WKP</code> - The week number (1-52) within your custom period year
            <br><code>WKC</code> - The standard ISO calendar week number (1-53)
            <br><br><b>Examples:</b>
            <br>Format: <code>YYYY-MM-PNPW</code> → Filename: <code>2025-08-P8W2.md</code>
            <br>Format: <code>YYYY-MM-WKP</code> → Filename: <code>2025-08-30.md</code>
            <br>Format: <code>YYYY-MM-WWKC</code> → Filename: <code>2025-08-W38.md</code>
        `;
        weeklyFormatSetting.descEl.empty();
        weeklyFormatSetting.descEl.appendChild(sanitizeHTMLToDom(weeklyDescHtml));

        weeklyFormatSetting.addText(text => text
            .setValue(this.plugin.settings.weeklyNoteFormat)
            .onChange(async (value) => {
                this.plugin.settings.weeklyNoteFormat = value;
                await this.saveAndUpdate();
            }));

        new Setting(containerEl)
            .setName("Weekly note template")
            .setDesc("Path to a template file to use when creating a new weekly note.")
            .addText(text => {
                this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path));
                text.setPlaceholder("Example: Templates/Weekly.md")
                    .setValue(this.plugin.settings.weeklyNoteTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.weeklyNoteTemplate = value;
                        await this.saveAndUpdate();
                    });
            });

        new Setting(containerEl).setName("Dot indicator").setHeading();

        new Setting(containerEl)
            .setName("Show dot for weekly notes")
            .setDesc("Show a dot in the week number column if a note for that week exists.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showWeeklyNoteDot)
                .onChange(async (value) => {
                    this.plugin.settings.showWeeklyNoteDot = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(containerEl, "Weekly note Dot color", "The color of the dot for existing weekly notes.", "weeklyNoteDotColor");
    }

    renderTaskIndicatorSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Calendar task indicators" });
        new Setting(containerEl)
            .setName("Task indicator style")
            .setDesc("Choose how to indicate days with tasks on the calendar grid.")
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None')
                .addOption('badge', 'Number badge')
                .addOption('heatmap', 'Cell color heatmap')
                .setValue(this.plugin.settings.taskIndicatorStyle)
                .onChange(async (value) => {
                    this.plugin.settings.taskIndicatorStyle = value;
                    await this.saveAndUpdate();
                    // We re-render the settings display to show/hide relevant options
                    this.refreshDisplay();
                }));

        new Setting(containerEl)
            .setName("Show dot for tasks")
            .setDesc("Show a single dot on days with tasks. This can be used with or instead of the heatmap/badge.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTaskDot)
                .onChange(async (value) => {
                    this.plugin.settings.showTaskDot = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(containerEl, "Task dot color", "The color of the dot indicating a day has tasks.", "taskDotColor");

        // Only show the badge/heatmap settings if they are relevant
        if (this.plugin.settings.taskIndicatorStyle === 'badge') {
            new Setting(containerEl)
                .setName("Task badge font size")
                .setDesc("The font size for the number inside the task badge. Default is 11px.")
                .addText(text => text
                    .setValue(this.plugin.settings.taskBadgeFontSize)
                    .onChange(async (value) => {
                        this.plugin.settings.taskBadgeFontSize = value;
                        await this.saveAndUpdate();
                    }));

            this.createRgbaColorSetting(containerEl, "Task badge colur", "The background color of the task count badge.", "taskBadgeColor");
            this.createRgbaColorSetting(containerEl, "Task badge font color", "The color of the number inside the task count badge.", "taskBadgeFontColor");
        }

        if (this.plugin.settings.taskIndicatorStyle === 'heatmap') {

            new Setting(containerEl)
                .setName("Heatmap content border width")
                .setDesc("Width of the border around the day heatmap content area (e.g., 1px, 2px, 3px). Creates visual separation inside cells. Default is 1px.")
                .addText(text => text
                    .setPlaceholder("1px")
                    .setValue(this.plugin.settings.contentBorderWidth)
                    .onChange(async (value) => {
                        this.plugin.settings.contentBorderWidth = value || "1px";
                        await this.saveAndUpdate();
                    }));

            containerEl.createEl('p', { text: 'Configure the start, middle, and end points of the dynamic color gradient. Colors will be blended smoothly between these points.', cls: 'cpwn-setting-item-description' });

            new Setting(containerEl).setName("Gradient Midpoint").setDesc("The number of tasks that should have the exact 'Mid' color. Default is 5.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMidpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMidpoint = Number(value) || 5; await this.saveAndUpdate(); }));
            new Setting(containerEl).setName("Gradient Maxpoint").setDesc("The number of tasks that should have the exact 'End' color. Any day with more tasks will also use the end color. Default is 10.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMaxpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMaxpoint = Number(value) || 10; await this.saveAndUpdate(); }));

            this.createRgbaColorSetting(containerEl, "Heatmap: start color (1 Task)", "The color for days with 1 task.", "taskHeatmapStartColor");
            this.createRgbaColorSetting(containerEl, "Heatmap: mid color", "The color for days meeting the 'Midpoint' task count.", "taskHeatmapMidColor");
            this.createRgbaColorSetting(containerEl, "Heatmap: end color", "The color for days meeting the 'Maxpoint' task count.", "taskHeatmapEndColor");
        }
    }

    renderDraggableTabs(container) {
        container.empty(); // Clear the container first

        // Define labels for tabs
        const tabLabels = {
            scratch: 'Scratchpad',
            notes: 'Notes',
            tasks: 'Tasks',
            assets: 'Assets',
            dashboard: 'Dashboard'
        };

        let draggedItem = null; // To keep track of the item being dragged

        this.plugin.settings.tabOrder.forEach((key, index) => {
            const settingItem = container.createDiv('cpwn-draggable-item');
            settingItem.draggable = true;
            settingItem.dataset.tabKey = key;

            // Add a drag handle icon
            const handle = settingItem.createDiv('drag-handle');
            setIcon(handle, 'grip-vertical');

            // Add the tab's name
            settingItem.createSpan({ text: tabLabels[key] || key });

            // --- Drag and Drop Event Listeners ---
            settingItem.addEventListener('dragstart', (e) => {
                draggedItem = settingItem;
                window.setTimeout(() => settingItem.addClass('dragging'), 0);
            });

            settingItem.addEventListener('dragend', (e) => {
                draggedItem?.removeClass('dragging');
                draggedItem = null;
            });

            settingItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingItem = document.querySelector('.dragging');
                if (draggingItem && draggingItem !== settingItem) {
                    // Get the bounding box of the item we're dragging over
                    const rect = settingItem.getBoundingClientRect();
                    // Check if we are in the top or bottom half of the item
                    const isAfter = e.clientY > rect.top + rect.height / 2;

                    if (isAfter) {
                        // Insert the dragged item after the current one
                        settingItem.parentNode.insertBefore(draggingItem, settingItem.nextSibling);
                    } else {
                        // Insert the dragged item before the current one
                        settingItem.parentNode.insertBefore(draggingItem, settingItem);
                    }
                }
            });

            settingItem.addEventListener('drop', async (e) => {
                e.preventDefault();
                const newOrder = Array.from(container.children).map(child => child.dataset.tabKey);
                this.plugin.settings.tabOrder = newOrder;
                await this.saveAndUpdate();
                new Notice('Tab order saved!');
            });
        });
    }

    renderTabsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "General Tab Settings" });

        new Setting(containerEl)
            .setName("Desktop tab display style")
            .setDesc("Choose how tab names are displayed in the desktop client.")
            .addDropdown(dropdown => dropdown
                .addOption('text', 'Text only')
                .addOption('iconAndText', 'Icon and text')
                .addOption('iconOnly', 'Icon only')
                .setValue(this.plugin.settings.tabDisplayMode)
                .onChange(async (value) => {
                    this.plugin.settings.tabDisplayMode = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Mobile tab display style")
            .setDesc("Choose a different, often more compact, display style for smaller mobile / tablet screens.")
            .addDropdown(dropdown => dropdown
                .addOption('text', 'Text only')
                .addOption('iconAndText', 'Icon and text')
                .addOption('iconOnly', 'Icon only')
                .setValue(this.plugin.settings.mobileTabDisplayMode)
                .onChange(async (value) => {
                    this.plugin.settings.mobileTabDisplayMode = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl).setName("Tab title font size").setDesc("Font size for the tab titles (Scratchpad, Notes, Tasks). Default is 15px.").addText(text => text.setValue(this.plugin.settings.tabTitleFontSize).onChange(async value => { this.plugin.settings.tabTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold tab titles").setDesc("Toggles bold font weight for the tab titles.").addToggle(toggle => toggle.setValue(this.plugin.settings.tabTitleBold).onChange(async value => { this.plugin.settings.tabTitleBold = value; await this.saveAndUpdate(); }));

        this.createRgbaColorSetting(containerEl, "Active Tab Indicator", "Underline color for the active tab.", "selectedTabColor");

        containerEl.createDiv('cpwn-setting-spacer');

        new Setting(containerEl)
            .setName('Tab order')
            .setDesc('Drag and drop the tabs to set their display order.');

        // Create a container for our draggable list
        const tabOrderContainer = containerEl.createDiv('cpwn-tab-order-container');
        this.renderDraggableTabs(tabOrderContainer);

        containerEl.createDiv('cpwn-setting-spacer');

        new Setting(containerEl).setName("Tab Visibility").setHeading();

        new Setting(containerEl)
            .setName("Show tasks tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.tasks)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.tasks = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show scratchpad tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.scratch)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.scratch = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl)
            .setName("Show notes tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.notes)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.notes = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show assets tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.assets)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.assets = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl)
            .setName('Show dashboard tab')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.dashboard)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.dashboard = value;
                    await this.saveAndUpdate();
                }));

    }

    renderScratchpadSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Scratchpad tab settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        new Setting(containerEl).setName("Scratchpad tab click action").setDesc("What to do when the Scratchpad tab is clicked while it's already active.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.scratchpadOpenAction).onChange(async (value) => { this.plugin.settings.scratchpadOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Scratchpad note path").setDesc("The full path to the note that the Scratchpad tab will read from and write to.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path)); text.setValue(this.plugin.settings.fixedNoteFile).onChange(async value => { this.plugin.settings.fixedNoteFile = value; await this.saveAndUpdate(); }); });
        new Setting(containerEl).setName("Show preview/edit button").setDesc("Show the button to toggle between plain text editing and a rendered Markdown preview.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchpad?.showPreviewToggle ?? false).onChange(async (value) => { if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {}; this.plugin.settings.scratchpad.showPreviewToggle = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show '+ Task' button").setDesc("Show the button in the scratchpad area to quickly add a new task.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchpad?.showAddTaskButton ?? true).onChange(async (value) => { if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {}; this.plugin.settings.scratchpad.showAddTaskButton = value; await this.saveAndUpdate(); }));

        const taskTitleSetting = new Setting(containerEl).setName("Task creation format");
        taskTitleSetting.descEl.innerHTML = `
                Use the following to insert as placeholders for the task creation date:
                <br><code>{today}</code>, <code>{tomorrow}</code>
                <br><code>{monday}</code>, <code>{tuesday}</code>, etc. for the next upcoming day.
                <br><code>{date}+7</code> or <code>{date}-3</code> for dates in the future or past.
                <br>
                <br>Use <code>|</code> to set the final cursor position.
            `;

        taskTitleSetting.addText(text => text
            .setPlaceholder("- [ ] ")
            .setValue(this.plugin.settings.scratchpad?.taskFormat || "- [ ] ")
            .onChange(async (value) => {
                if (!this.plugin.settings.scratchpad) {
                    this.plugin.settings.scratchpad = {};
                }
                this.plugin.settings.scratchpad.taskFormat = value;
                await this.saveAndUpdate();
            }));

        new Setting(containerEl).setName("Appearance").setHeading();

        new Setting(containerEl)
            .setName('Hide note properties')
            .setDesc('If enabled, the frontmatter properties text (text between ---) at the top of the note will be hidden from the Scratchpad view.')
            .addToggle(toggle => {
                // Ensure the nested object exists to prevent errors
                if (!this.plugin.settings.scratchpad) {
                    this.plugin.settings.scratchpad = {};
                }
                toggle
                    .setValue(this.plugin.settings.scratchpad.hideFrontmatter ?? false)
                    .onChange(async (value) => {
                        this.plugin.settings.scratchpad.hideFrontmatter = value;
                        // This helper saves settings and refreshes any open plugin views
                        await this.saveAndUpdate();
                    });
            });

        new Setting(containerEl).setName("Scratchpad font size").setDesc("Font size for the text inside the Scratchpad editor. Default is 14px.").addText(text => text.setValue(this.plugin.settings.scratchFontSize).onChange(async value => { this.plugin.settings.scratchFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold Scratchpad text").setDesc("Toggles bold font weight for the text in the Scratchpad.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchBold).onChange(async value => { this.plugin.settings.scratchBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Scratchpad font family").setDesc("Examples: monospace, Arial, 'Courier New'. Leave blank to use the editor default.").addText(text => text.setValue(this.plugin.settings.scratchFontFamily).onChange(async (value) => { this.plugin.settings.scratchFontFamily = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Search highlight color", "The background color for the selected search result in the Scratchpad.", "scratchpadHighlightColor");

    }

    renderNotesSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Notes tab settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        new Setting(containerEl).setName("Notes tab open behavior").setDesc("Choose how to open notes when clicked from the notes list. NOTE: Holding the shift key and clicking a note will always open it in a new tab.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.notesOpenAction).onChange(async (value) => { this.plugin.settings.notesOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes lookback days").setDesc("How many days back the Notes tab should look for created or modified notes. Default is 120.").addText(text => text.setValue(String(this.plugin.settings.notesLookbackDays)).onChange(async value => { this.plugin.settings.notesLookbackDays = Number(value) || 7; await this.saveAndUpdate(); }));

        new Setting(containerEl).setName("Appearance").setHeading();
        new Setting(containerEl).setName("Show note status dots").setDesc("Show a colored dot next to each note, indicating if it was recently created or modified.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteStatusDots).onChange(async value => { this.plugin.settings.showNoteStatusDots = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show note tooltips").setDesc("Show a detailed tooltip on hover, containing note path, dates, size, and tags.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteTooltips).onChange(async value => { this.plugin.settings.showNoteTooltips = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes list font size").setDesc("Font size for note titles in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.notesFontSize).onChange(async value => { this.plugin.settings.notesFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold note titles").setDesc("Toggles bold font weight for note titles in the list.").addToggle(toggle => toggle.setValue(this.plugin.settings.notesBold).onChange(async value => { this.plugin.settings.notesBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Note/Task Hover Color", "Background color when hovering a note or task in a list.", "notesHoverColor");
        this.createIgnoredFolderList(containerEl, "Ignore folders in Notes tab", "Files in these folders will not appear in the 'Notes' list.", 'ignoreFolders');

    }

    renderPinnedNotesSettings() {
        const containerEl = this.contentEl; // All settings will be rendered into this element
        containerEl.createEl('h1', { text: 'Pinned notes settings' });
        new Setting(containerEl).setName('Functionality').setHeading();
        new Setting(containerEl)
            .setName("Pinned notes tag")
            .setDesc("The tag to use for pinned notes, enter in the text box without the '#'. For notes to appear in the pinned tab, (accessed with another click on the notes tab icon once it has focus), and if you set 'pin' as the tag name, then in your notes add #pin in the body or properties tag section. Default is 'pin'.")
            .addText(text => text
                .setValue(this.plugin.settings.pinTag)
                .onChange(async (value) => {
                    this.plugin.settings.pinTag = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl).setName('Sort order').setHeading();
        new Setting(containerEl)
            .setName('Default sort order')
            .setDesc("Choose the default sort order for pinned notes when the plugin is loaded. To change the order click on the PINNED NOTES title in the main view.")
            .addDropdown(dropdown => dropdown
                .addOption('a-z', 'A-Z (Default)')
                .addOption('z-a', 'Z-A')
                .addOption('custom', 'Custom order')
                .setValue(this.plugin.settings.pinnedNotesSortOrder)
                .onChange(async (value) => {
                    this.plugin.settings.pinnedNotesSortOrder = value;
                    await this.plugin.saveSettings();
                }));

        const isMac = Platform.isMacOS;
        const modifierKey = isMac ? 'Option (⌥)' : 'Ctrl';

        new Setting(containerEl)
            .setName('How to change the sort order in the main view')
            .setDesc(`Click the "PINNED NOTES" header in the main view to cycle between A-Z, Z-A, and Custom sort orders.\n\nWhen in Custom order, hold ${modifierKey} and drag notes to reorder them.`);

        new Setting(containerEl)
            .setName('Set custom order')
            .setDesc('Drag and drop the notes below to set your preferred manual order.');

        const draggableContainer = containerEl.createDiv('pinned-notes-order-container');
        this.renderDraggablePinnedNotes(draggableContainer);
    }

    renderAssetsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Assets tab settings" });
        new Setting(containerEl)
            .setName("Asset open behavior")
            .setDesc("Choose how to open assets when clicked from the Assets list.")
            .addDropdown(dropdown => dropdown
                .addOption('new-tab', 'Open in a new tab')
                .addOption('current-tab', 'Open in the current tab')
                .setValue(this.plugin.settings.assetsOpenAction)
                .onChange(async (value) => {
                    this.plugin.settings.assetsOpenAction = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName('Default assets view')
            .setDesc('Choose the default layout for the assets tab.')
            .addDropdown(dropdown => dropdown
                .addOption('list', 'List')
                .addOption('grid', 'Grid')
                .setValue(this.plugin.settings.assetsDefaultView)
                .onChange(async (value) => {
                    this.plugin.settings.assetsDefaultView = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Assets lookback days")
            .setDesc("How many days back the Assets tab should look for created or modified notes. Default is 120.")
            .addText(text => text
                .setValue(String(this.plugin.settings.assetsLookbackDays))
                .onChange(async value => {
                    this.plugin.settings.assetsLookbackDays = Number(value) || 7;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Hidden asset file types")
            .setDesc("A comma-separated list of file extensions to hide from the Assets tab and calendar dots (e.g., jpg,pdf,zip). Default is base,canvas.")
            .addText(text => text
                .setPlaceholder("e.g., jpg,pdf,zip")
                .setValue(this.plugin.settings.hiddenAssetTypes)
                .onChange(async (value) => {
                    this.plugin.settings.hiddenAssetTypes = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl).setName("Show indicator for unused assets").setDesc("An icon will appear next to assets that are not linked or embedded in any note, allowing for easier detection to delete.").addToggle(toggle => toggle.setValue(this.plugin.settings.showUnusedAssetsIndicator).onChange(async (value) => { this.plugin.settings.showUnusedAssetsIndicator = value; await this.saveAndUpdate(); }));

    }

    renderTasksSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Tasks tab settings" });
        new Setting(containerEl).setName("Display & sorting").setHeading();
        new Setting(containerEl).setName("Task group heading font size").setDesc("The font size for the date/tag group headings (e.g., 'Overdue', 'Today'). Default is 13px.").addText(text => text.setValue(this.plugin.settings.taskHeadingFontSize).onChange(async value => { this.plugin.settings.taskHeadingFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task text font size").setDesc("The font size for the individual task items in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.taskTextFontSize).onChange(async value => { this.plugin.settings.taskTextFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Truncate long task text").setDesc("If enabled, long tasks will be shortened with '...'. If disabled, they will wrap to multiple lines.").addToggle(toggle => toggle.setValue(this.plugin.settings.taskTextTruncate).onChange(async (value) => { this.plugin.settings.taskTextTruncate = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task sort order").setDesc("The default order for tasks within each group.").addDropdown(dropdown => dropdown.addOption('dueDate', 'By Due Date (earliest first)').addOption('a-z', 'A-Z').addOption('z-a', 'Z-A').setValue(this.plugin.settings.taskSortOrder).onChange(async (value) => { this.plugin.settings.taskSortOrder = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Group tasks by").setDesc("Choose how to group tasks in the view. Second-clicking the Tasks tab will also toggle this.").addDropdown(dropdown => dropdown.addOption('date', 'Date (Overdue, Today, etc.)').addOption('tag', 'Tag').setValue(this.plugin.settings.taskGroupBy).onChange(async (value) => { this.plugin.settings.taskGroupBy = value; await this.saveAndUpdate(); this.refreshDisplay(); }));

        if (this.plugin.settings.taskGroupBy === 'date') {
            new Setting(containerEl).setName("Date groups to show").setHeading();
            const dateGroups = [{ key: 'overdue', name: 'Overdue', desc: 'Show tasks that have a due date before today and are not completed.' }, { key: 'today', name: 'Today', desc: 'Show all tasks that have a due date of today.' }, { key: 'tomorrow', name: 'Tomorrow', desc: 'Show all tasks that have a due date of tomorrow.' }, { key: 'next7days', name: 'Next 7 Days', desc: 'Show all tasks that are due after tomorrow and up to 7 days ahead' }, { key: 'future', name: 'Future', desc: 'Show tasks that have a due date after the next 7 days out.' }, { key: 'noDate', name: 'Someday', desc: 'Show all tasks that due not have a due date.' }];
            dateGroups.forEach(g => { new Setting(containerEl).setName(g.name).setDesc(g.desc).addToggle(t => t.setValue(this.plugin.settings.taskDateGroupsToShow.includes(g.key)).onChange(async v => { const groups = this.plugin.settings.taskDateGroupsToShow; if (v && !groups.includes(g.key)) groups.push(g.key); else if (!v) this.plugin.settings.taskDateGroupsToShow = groups.filter(i => i !== g.key); await this.saveAndUpdate(); })); });
        }
        new Setting(containerEl).setName("Completed").setDesc("Show tasks that you have marked as complete today.").addToggle(toggle => toggle.setValue(this.plugin.settings.showCompletedTasksToday).onChange(async (value) => { this.plugin.settings.showCompletedTasksToday = value; await this.saveAndUpdate(); }));


        containerEl.createEl('div', { cls: 'cpwn-setting-spacer' });


        new Setting(containerEl).setName("Content & appearance").setHeading();
        this.createIgnoredFolderList(containerEl, "Exclude folders from Task search", "Tasks in these folders will not appear in the 'Tasks' list.", 'taskIgnoreFolders');

        containerEl.createEl('h2', { text: 'Task group icons' });
        containerEl.createEl('p', { text: 'Customize the icon displayed next to each task group header.', cls: 'cpwn-setting-item-description' });

        const taskGroupIconSettings = [
            { key: 'overdue', name: 'Overdue icon' },
            { key: 'today', name: 'Today icon' },
            { key: 'tomorrow', name: 'Tomorrow icon' },
            { key: 'next7days', name: 'Next 7 days icon' },
            { key: 'future', name: 'Future icon' },
            { key: 'noDate', name: 'Someday icon' },
            { key: 'tag', name: 'Tag Group icon' }
        ];


        // Loop through the settings to create each input field and its reset button
        taskGroupIconSettings.forEach(s => {
            let textComponent; // This will hold a reference to the text input

            new Setting(containerEl)
                .setName(s.name)
                .setDesc('Enter any Lucide icon name.')
                .addText(text => {
                    textComponent = text; // Store the reference
                    text
                        .setValue(this.plugin.settings.taskGroupIcons[s.key] || DEFAULT_SETTINGS.taskGroupIcons[s.key])
                        .onChange(async (value) => {
                            this.plugin.settings.taskGroupIcons[s.key] = value.trim();
                            await this.saveAndUpdate();
                        });
                })
                .addExtraButton(button => {
                    button
                        .setIcon('rotate-ccw')
                        .setTooltip('Reset to default')
                        .onClick(async () => {
                            const defaultValue = this.currentThemeDefaults.tabIcons[s.key];
                            this.plugin.settings.taskGroupIcons[s.key] = defaultValue;
                            if (textComponent) {
                                textComponent.setValue(defaultValue);
                            }

                            await this.saveAndUpdate();
                            new Notice(`'${s.name}' reset to default.`);
                        });
                });
        });

        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Reset all task group icons')
                .setTooltip('Resets all task group icons to their original values')
                .onClick(async () => {
                    if (confirm('Are you sure you want to reset all task group icons?')) {
                        this.plugin.settings.taskGroupIcons = { ...DEFAULT_SETTINGS.taskGroupIcons };
                        await this.saveAndUpdate();
                        new Notice('All task group icons have been reset.');
                        this.refreshDisplay();
                    }
                }));

        containerEl.createEl('div', { cls: 'cpwn-setting-spacer' });


        new Setting(containerEl).setName("Task group backgrounds").setHeading();
        this.createRgbaColorSetting(containerEl, "Overdue", "Background color for the 'Overdue' task group.", "taskGroupColorOverdue");
        this.createRgbaColorSetting(containerEl, "Today", "Background color for the 'Today' task group.", "taskGroupColorToday");
        this.createRgbaColorSetting(containerEl, "Tomorrow", "Background color for the 'Tomorrow' task group.", "taskGroupColorTomorrow");
        this.createRgbaColorSetting(containerEl, "Next 7 days", "Background color for the 'Next 7 Days' task group.", "taskGroupColorNext7Days");
        this.createRgbaColorSetting(containerEl, "Future", "Background color for 'Future' task group.", "taskGroupColorFuture");
        this.createRgbaColorSetting(containerEl, "Someday", "Background color for the 'Someday' task group.", "taskGroupColorNoDate");
        this.createRgbaColorSetting(containerEl, "Tag", "Background color for task groups when grouped by tag.", "taskGroupColorTag");
    }

    /**
     * Renders the main Dashboard settings tab with sub-navigation for "Tasks" and "File Creation".
     */
    renderDashboardSettings() {
        const container = this.contentEl;
        container.empty();
        container.createEl('h1', { text: 'Dashboard tab settings' });

        // --- Create Sub-Tab Navigation ---
        const navContainer = container.createDiv({ cls: 'cpwn-pm-settings-sub-nav' });
        const tasksBtn = navContainer.createEl('button', { text: 'Tasks', cls: 'cpwn-pm-sub-nav-btn' });
        const creationBtn = navContainer.createEl('button', { text: 'File creation', cls: 'cpwn-pm-sub-nav-btn' });
        const generalBtn = navContainer.createEl('button', { text: 'General', cls: 'cpwn-pm-sub-nav-btn' });
        const contentContainer = container.createDiv(); // This will hold the content for the selected sub-tab

        // Event listeners to switch between tabs
        tasksBtn.addEventListener('click', () => {
            tasksBtn.addClass('is-active');
            creationBtn.removeClass('is-active');
            generalBtn.removeClass('is-active');
            // Pass the sub-content container to the specific renderer
            this.renderTasksDashboardSettings(contentContainer);
        });

        creationBtn.addEventListener('click', () => {
            creationBtn.addClass('is-active');
            tasksBtn.removeClass('is-active');
            generalBtn.removeClass('is-active');
            // Pass the sub-content container to the specific renderer
            this.renderCreationDashboardSettings(contentContainer);
        });

        generalBtn.addEventListener('click', () => {
            generalBtn.addClass('is-active');
            tasksBtn.removeClass('is-active');
            creationBtn.removeClass('is-active');
            this.renderGeneralDashboardSettings(contentContainer);
        });

        // Default to showing the Tasks tab on first render
        tasksBtn.click();
    }

    renderGoalsSettings() {
        const containerEl = this.contentEl;
        containerEl.empty();
        containerEl.createEl("h1", { text: "Goal configuration" });
        containerEl.createEl("p", { text: "Define goals to track your progress and earn points. Drag to reorder." });

        const goalsList = containerEl.createDiv({ cls: 'cpwn-goals-list' });
        this.enableGoalSorting(goalsList);

        const allGoals = this.plugin.settings.goals || [];
        const coreGoals = allGoals.filter(g => g.core);
        const customGoals = allGoals.filter(g => !g.core);

        // --- Render core goals first ---
        coreGoals.forEach((goal, index) =>
            this.renderGoalItem(goalsList, goal, allGoals.indexOf(goal), true)
        );

        // --- Render Custom Goals ---
        customGoals.forEach((goal, index) => {
            this.renderGoalItem(goalsList, goal, allGoals.indexOf(goal), false);
        });

        // --- Add New Goal Button ---
        new Setting(containerEl)
            .addButton(btn => {
                btn.setButtonText("Add new goal")
                    .setCta()
                    .onClick(() => {
                        new GoalEditModal(this.app, null, async (newGoal) => {
                            if (!this.plugin.settings.goals) this.plugin.settings.goals = [];
                            this.plugin.settings.goals.push(newGoal);
                            await this.saveAndUpdate();
                            this.renderGoalsSettings();
                        }).open();
                    });
            });


        // --- Global Vacation Toggle ---
        new Setting(containerEl)
            .setName("Global Vacation Mode")
            .setDesc("When enabled, all goals are paused — no points or penalties are tracked. Note: you can also pause goals individually. To do this enter the goal settings to toggle on/off.")
            .addToggle(toggle => {
                toggle.setValue(!!this.plugin.settings.vacationModeGlobal)
                    .onChange(async (value) => {
                        this.plugin.settings.vacationModeGlobal = value;
                        await this.saveAndUpdate();
                    });
            });


        containerEl.createEl('h3', { text: 'Level ladder' });

        const tracker = new GoalTracker(this.app, this.plugin.settings);
        const lifetimeTargetRaw =
            tracker.getLifetimeTargetPoints && tracker.getLifetimeTargetPoints();
        const effectiveTarget =
            lifetimeTargetRaw && lifetimeTargetRaw > 0 ? lifetimeTargetRaw : 300000;

        // Same bands you use in the widget / GoalTracker
        const LEVEL_BANDS = [
            { frac: 1.0, title: 'Grandmaster of Flow', icon: 'infinity' },
            { frac: 0.9, title: 'Legendary Leader', icon: 'crown' },
            { frac: 0.8, title: 'Relentless Result', icon: 'trophy' },
            { frac: 0.7, title: 'Task Titan', icon: 'medal' },
            { frac: 0.6, title: 'Output Overlord', icon: 'award' },
            { frac: 0.5, title: 'High Performer', icon: 'star' },
            { frac: 0.4, title: 'Productivity Pro', icon: 'zap' },
            { frac: 0.3, title: 'Goal Getter', icon: 'target' },
            { frac: 0.22, title: 'Focused Ninja', icon: 'crosshair' },
            { frac: 0.16, title: 'Efficiency Enthusiast', icon: 'gauge' },
            { frac: 0.10, title: 'Daily Driver', icon: 'calendar-check' },
            { frac: 0.06, title: 'Momentum Maker', icon: 'trending-up' },
            { frac: 0.03, title: 'Task Tinkerer', icon: 'check-circle-2' },
            { frac: 0.01, title: 'Routine Rookie', icon: 'clipboard-list' },
            { frac: 0.0, title: 'Starter Spark', icon: 'sprout' }
        ];

        const levels = LEVEL_BANDS
            .map((band, idx) => ({
                min: Math.round(band.frac * effectiveTarget),
                title: band.title,
                icon: band.icon,
                level: LEVEL_BANDS.length - idx
            }))
            // for display, show from lowest -> highest points
            .sort((a, b) => a.min - b.min);

        const table = containerEl.createEl('table', { cls: 'cpwn-level-table' });

        const headerRow = table.createEl('tr');
        headerRow.createEl('th', { text: 'Level' });
        headerRow.createEl('th', { text: 'Name' });
        headerRow.createEl('th', { text: 'Icon' });
        headerRow.createEl('th', { text: 'Points needed' });

        for (const lvl of levels) {
            const row = table.createEl('tr');

            row.createEl('td', { text: String(lvl.level) });
            row.createEl('td', { text: lvl.title });

            const iconCell = row.createEl('td');
            const iconDiv = iconCell.createDiv({ cls: 'cpwn-level-icon' });
            setIcon(iconDiv, lvl.icon);

            row.createEl('td', { text: lvl.min.toLocaleString() });
        }

        containerEl.createEl('div', { cls: 'cpwn-setting-spacer' });

        // --- Reset Scoring Cache ---
        new Setting(containerEl)
            .setName("Reset scoring cache")
            .setDesc("Clears cached daily scores and recomputes them from your tasks and notes. Vacation history is kept, but past totals may change.")
            .addButton(btn => btn
                .setButtonText("Reset cache")
                .setWarning()
                .onClick(async () => {
                    if (!confirm("Are you sure you want to reset the scoring cache? This will delete all cached daily scores and rebuild them from your tasks and notes.")) {
                        return;
                    }
                    this.plugin.settings.goalScoreHistory = {};
                    await this.plugin.saveData(this.plugin.settings);
                    new Notice("Goal scoring cache cleared. It will be rebuilt as you view dashboards.", 4000);
                    this.triggerDashboardRefresh();
                }));

        // --- Reset Vacation History ---
        new Setting(containerEl)
            .setName("Reset vacation history")
            .setDesc("Clears stored vacation days for all goals. After resetting the scoring cache, past days will be recomputed without vacation applied.")
            .addButton(btn => btn
                .setButtonText("Reset vacation days")
                .setWarning()
                .onClick(async () => {
                    if (!confirm("Are you sure you want to reset all vacation history? All days will be treated as normal working days on the next rebuild.")) {
                        return;
                    }
                    this.plugin.settings.vacationHistory = {};
                    await this.plugin.saveData(this.plugin.settings);
                    new Notice("Vacation history cleared. Reset the scoring cache if you want past days recomputed without vacation.", 5000);
                }));
    }

    getGoalDisplayName(goal) {
        // If the user named it "Tasks completed" (default), rename it to "Core: Tasks"
        // Or check by type if you want to force it
        if (goal.type === 'task-count') return "Task count";
        if (goal.type === 'word-count') return "Words count";
        if (goal.type === 'note-created') return "Create note";

        // Fallback for custom names
        return goal.type;
    }

    renderGoalItem(goalsList, goal, index, isCore) {
        const goalEl = goalsList.createDiv({ cls: 'cpwn-goal-item setting-item' });
        //goalEl.setAttribute('draggable', isCore ? 'false' : 'true');
        goalEl.setAttribute('draggable', 'true');
        goalEl.dataset.index = index;

        // Drag handle (disabled for core)
        const handle = goalEl.createDiv({ cls: 'cpwn-pm-drag-handle' });
        setIcon(handle, 'grip-vertical');
        handle.style.marginRight = '10px';
        //handle.style.cursor = isCore ? 'not-allowed' : 'grab';
        handle.style.cursor = 'grab';

        //if (isCore) handle.style.opacity = '0.5';

        const info = goalEl.createDiv({ cls: 'setting-item-info' });

        info.createEl('div', { text: goal.name, cls: 'setting-item-name' });
        info.createEl('div', {
            text: `${this.getGoalDisplayName(goal)} | Target: ${goal.target} | ${goal.points} pts`,
            cls: 'setting-item-description'
        });

        const controls = goalEl.createDiv({ cls: 'setting-item-control' });

        // EDIT (always)
        new Setting(controls)
            .addButton(btn => btn
                .setIcon('pencil')
                .onClick(() => {
                    new GoalEditModal(this.app, goal, async (updatedGoal) => {
                        this.plugin.settings.goals[index] = updatedGoal;
                        await this.saveAndUpdate();
                        this.renderGoalsSettings();
                    }).open();
                }));

        // TOGGLE (always)
        new Setting(controls)
            .addToggle(toggle => {
                toggle.setValue(!!goal.enabled)
                    .onChange(async value => {
                        goal.enabled = value;
                        await this.saveAndUpdate();
                        this.renderGoalsSettings();
                    });
            });

        // DELETE (only for custom)
        if (!isCore) {
            new Setting(controls)
                .addButton(btn => btn
                    .setIcon('trash')
                    .setWarning()
                    .onClick(async () => {
                        if (confirm(`Delete goal "${goal.name}"?`)) {
                            this.plugin.settings.goals.splice(index, 1);
                            await this.saveAndUpdate();
                            this.renderGoalsSettings();
                        }
                    }));
        }

    }

    // Helper method to handle Drag & Drop logic
    enableGoalSorting(container) {
        let draggedItem = null;

        container.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.cpwn-goal-item');
            if (draggedItem) {
                draggedItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                // Firefox requires data to be set
                e.dataTransfer.setData('text/plain', draggedItem.dataset.index);
            }
        });

        container.addEventListener('dragend', async (e) => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');

                // Update settings based on DOM order
                const newOrder = [];
                const children = Array.from(container.children);

                children.forEach(child => {
                    const oldIndex = parseInt(child.dataset.index);
                    if (!isNaN(oldIndex) && this.plugin.settings.goals[oldIndex]) {
                        newOrder.push(this.plugin.settings.goals[oldIndex]);
                    }
                });

                this.plugin.settings.goals = newOrder;
                await this.saveAndUpdate();

                // Re-render to update indices
                this.renderGoalsSettings();
            }
            draggedItem = null;
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            }
        });


    }

    // Reusing your existing helper, or defining it here if it's private
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.cpwn-goal-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }



    renderGeneralDashboardSettings(container) {
        container.empty();

        container.createEl('div', { cls: 'cpwn-setting-spacer' });
        container.createEl('h2', { text: 'Default dashboard settings' });

        new Setting(container)
            .setName('Default dashboard view')
            .setDesc('Choose which dashboard to show by default.')
            .addDropdown(dropdown => dropdown
                .addOption('tasks', 'Tasks dashboard')
                .addOption('creation', 'File Creation dashboard')
                .setValue(this.plugin.settings.defaultDashboardView)
                .onChange(async (value) => {
                    this.plugin.settings.defaultDashboardView = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(container)
            .setName('Custom date formats for parsing')
            .setDesc('For the "Date from note title" heatmap source. Provide a comma-separated list of formats to check for.')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD,DD-MM-YYYY')
                .setValue(this.plugin.settings.customDateFormats) // Assuming the setting is named 'customDateFormats'
                .onChange(async (value) => {
                    this.plugin.settings.customDateFormats = value;
                    await this.plugin.saveSettings();
                }));

        container.createEl('div', { cls: 'cpwn-setting-spacer' });

        container.createEl('h2', { text: 'Show / hide widget names & cheverons' });


        new Setting(container)
            .setName("Show widget names")
            .setDesc("Toggle all widget names in the dashboard on/off. Custom widgets can override this.")
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.showTaskWidgetTitles ?? true)
                    .onChange(async value => {
                        this.plugin.settings.showTaskWidgetTitles = value;
                        await this.plugin.saveSettings();
                        const dashboardView = this.app.workspace.getLeavesOfType('cpwn-calendar-period-week-notes')
                            .find(leaf => leaf.view instanceof PeriodMonthView)?.view;
                        if (dashboardView) {
                            dashboardView.lastTasksState = '';
                            dashboardView.lastCreationState = '';
                        }
                        this.app.workspace.trigger('cpwn-pm-dashboard-refresh');
                    })
            );

        new Setting(container)
            .setName("Show widget chevrons")
            .setDesc("Toggle widget chevrons for expand/collapse in the dashboard. Custom widgets can override this.")
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.showTaskWidgetChevrons ?? true)
                    .onChange(async value => {
                        this.plugin.settings.showTaskWidgetChevrons = value;
                        await this.plugin.saveSettings();
                        const dashboardView = this.app.workspace.getLeavesOfType('cpwn-calendar-period-week-notes')
                            .find(leaf => leaf.view instanceof PeriodMonthView)?.view;
                        if (dashboardView) {
                            dashboardView.lastTasksState = '';
                            dashboardView.lastCreationState = '';
                        }
                        this.app.workspace.trigger('cpwn-pm-dashboard-refresh');

                    })
            );
    }


    renderTasksDashboardSettings(container) {
        container.empty();

        // 1. --- Master Widget List Creation (The Only Required Step Here) ---
        const allWidgets = { ...DASHBOARDWIDGETS.tasks };

        container.createEl('div', { cls: 'cpwn-setting-spacer' });
        container.createEl('h2', { text: 'Task dashboard widgets' });

        // --- Add New Widget Buttons ---
        new Setting(container)
            //.setName('Create a New Stats Widget')
            .addButton(button => {
                button
                    .setButtonText('Add section header')
                    .onClick(async () => {
                        new SectionHeaderModal(this.app, this.plugin, async (headerConfig) => {
                            // Create a new section header with unique key
                            const newHeader = {
                                ...headerConfig,
                                widgetKey: `section-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                type: 'section-header',
                                isCollapsed: false
                            };

                            // Add to the tasks stats widgets array
                            this.plugin.settings.tasksStatsWidgets.unshift(newHeader);
                            this.plugin.settings.tasksDashboardWidgets[newHeader.widgetKey] = true;
                            this.plugin.settings.tasksDashboardOrder.unshift(newHeader.widgetKey);

                            await this.plugin.saveSettings();
                            this.renderTasksDashboardSettings(container);
                            new Notice('Section header added!');
                        }).open();
                    });
            })
            .addButton(button => button
                .setButtonText('Add blank widget')
                .onClick(async () => {
                    const newWidget = {
                        widgetKey: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        widgetName: 'New custom widget',
                        size: 'medium',
                        chartType: 'line',
                        metric: 'completed',
                        dateRange: {
                            look: 'look back',
                            value: 30,
                            unit: 'days',
                            forward: {
                                value: 0,
                                unit: 'days'
                            },
                            startDate: null,
                            endDate: 'today'
                        },
                        groupBy: 'day',
                        // --- FIX STARTS HERE ---
                        overrideShowTitle: false,
                        overrideShowChevron: false,
                        appendTimePeriod: false,
                        metrics: [
                            { label: 'Metric 1', type: 'completed', color: 'rgba(59, 213, 16, 0.6)' }
                        ],
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    };

                    // Add to the main list
                    this.plugin.settings.tasksStatsWidgets.unshift(newWidget);

                    // Add to visibility and order lists
                    this.plugin.settings.tasksDashboardWidgets[newWidget.widgetKey] = true;
                    this.plugin.settings.tasksDashboardOrder.unshift(newWidget.widgetKey);

                    await this.plugin.saveSettings();
                    this.renderTasksDashboardSettings(container); // Re-render to show the new widget
                    new Notice('Blank widget added. Click "Configure" to set it up.');
                }))
            .addButton(button => button
                .setButtonText('Add from template')
                .onClick(async () => {
                    new TemplatePickerModal(this.app, this.plugin, async (widgetConfig) => {

                        const newWidget = {
                            ...widgetConfig,
                            widgetKey: `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`

                        };

                        delete widgetConfig.widgetKey;
                        this.plugin.settings.tasksStatsWidgets.unshift(newWidget);
                        this.plugin.settings.tasksDashboardWidgets[newWidget.widgetKey] = true;
                        this.plugin.settings.tasksDashboardOrder.unshift(newWidget.widgetKey);

                        await this.plugin.saveSettings();
                        const dashboardView = this.app.workspace.getLeavesOfType('cpwn-calendar-period-week-notes')
                            .find(leaf => leaf.view instanceof PeriodMonthView)?.view;
                        if (dashboardView) {
                            dashboardView.lastTasksState = '';
                            dashboardView.lastCreationState = '';
                        }
                        this.app.workspace.trigger('cpwn-pm-dashboard-refresh');

                        this.renderTasksDashboardSettings(container);

                        new Notice(`${widgetConfig.widgetName} added from template!`);
                    }).open();
                })
            )

        // Add custom task stats widgets to the master list
        this.plugin.settings.tasksStatsWidgets
            .forEach(widget => {
                allWidgets[widget.widgetKey] = { name: widget.widgetName };
            });

        // 2. --- Single, Correct Call to Render the Draggable List ---
        // This function will now handle everything: rendering, toggling, and drag-and-drop.
        this.renderWidgetSettings(
            container,
            'Tasks dashboard widgets',
            'tasksDashboardWidgets', // The OBJECT for visibility
            'tasksDashboardOrder',   // The ARRAY for order
            allWidgets               // The complete list of all widgets
        );

        // --- 3. Spacer and Other Settings ---
        container.createEl('div', { cls: 'cpwn-setting-spacer' });

        new Setting(container).setName("Task status colors").setHeading();

        this.createRgbaColorSetting(
            container,
            "Cancelled",
            "Color for cancelled tasks in widgets.",
            "taskStatusColorCancelled"
        );

        this.createRgbaColorSetting(
            container,
            "Overdue",
            "Color for overdue tasks in widgets and heatmaps.",
            "taskStatusColorOverdue"
        );

        this.createRgbaColorSetting(
            container,
            "In progress",
            "Color for in-progress tasks in widgets.",
            "taskStatusColorInProgress"
        );

        this.createRgbaColorSetting(
            container,
            "Open",
            "Color for open (to-do) tasks in widgets.",
            "taskStatusColorOpen"
        );

        this.createRgbaColorSetting(
            container,
            "Completed",
            "Color for completed tasks in widgets and heatmaps.",
            "taskStatusColorCompleted"
        );


        container.createEl('div', { cls: 'cpwn-setting-spacer' });
        const customHeatmapsContainer = container.createDiv();

        // --- Create the Collapsible Guide ---
        const guideContainer = container.createDiv({ cls: 'cpwn-note-group-container' });

        // Check the saved state and apply 'cpwn-is-collapsed' class if needed
        if (this.plugin.settings.isHeatmapGuideCollapsed) {
            guideContainer.addClass('cpwn-is-collapsed');
        }

        // 1. Create the clickable header
        const header = guideContainer.createDiv({ cls: 'cpwn-note-group-header' });
        const headerContent = header.createDiv({ cls: 'cpwn-note-group-header-content' });
        const collapseIcon = headerContent.createDiv({ cls: 'cpwn-note-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');
        headerContent.createSpan({ text: "Custom tasks widget guide" });

        header.addEventListener('click', () => {
            const isNowCollapsed = guideContainer.classList.toggle('cpwn-is-collapsed');
            this.plugin.settings.isHeatmapGuideCollapsed = isNowCollapsed;
            this.plugin.saveSettings();
        });

        // 2. Create the content wrapper for the guide text
        const helpContentWrapper = guideContainer.createDiv({ cls: 'cpwn-note-list-wrapper' });
        const helpText = helpContentWrapper.createDiv(); // The actual element for the text
        helpText.setAttr('style', 'user-select: text; font-size: 0.9em; line-height: 1.6; padding: 15px; margin: 0; border-radius: 8px; background-color: var(--background-secondary);');

        helpText.innerHTML = `

    <div style="padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 8px; margin-bottom: 20px; background-color: var(--background-secondary-alt);">
    <h4 style="margin-top: 0;">Important: Requires Obsidian Tasks Plugin</h4>
    <p style="margin-bottom: 0;">
        For the <strong>Tasks Tab</strong> and all <strong>Dashboard Task Widgets</strong> to function, you <strong>MUST</strong> have the official <a href="https://github.com/obsidian-tasks-group/obsidian-tasks">Obsidian Tasks</a> plugin installed and enabled. This plugin provides the core engine for finding and processing tasks in your vault.
    </p>
</div>

<h4>How to Create and Configure Task Widgets</h4>
<p>
    The Tasks Dashboard is fully customizable, allowing you to create a personalized overview of your task activity. You can create widgets in two ways: by starting from a blank slate or by using a pre-configured template.
</p>

<h4>1. Creating a New Widget</h4>
<p>
    In the settings, you have two options to add a new widget to your dashboard:
</p>
<ul>
    <li>
        <strong>Add Blank Widget:</strong> This creates a new, default widget. It's the perfect starting point if you know exactly what you want to build from the ground up.
    </li>
    <li>
        <strong>Add from Template:</strong> This opens a selection modal where you can choose from a list of pre-configured widgets. This is the fastest way to get started and includes advanced chart types.
    </li>
</ul>

<h4>2. Widget & Chart Types Explained</h4>
<p>
    When you create a widget, you can choose from several chart types, each designed for a different purpose:
</p>
<ul>
    <li>
        <strong>Line Chart:</strong> Displays data points connected by a line, making it perfect for showing trends over time. Use this to track metrics like <em>tasks completed per day</em> or <em>tasks created per week</em>.
    </li>
    <li>
        <strong>Bar Chart:</strong> Uses vertical or horizontal bars to compare values for different categories. This is ideal for comparing distinct counts, such as the <em>number of tasks in each status (Open, Overdue, etc.)</em>.
    </li>
    <li>
        <strong>Pie Chart:</strong> A circular chart that shows the proportion of different categories as slices of a whole. Use this to visualize the percentage of tasks per project or area.
    </li>
    <li>
        <strong>Radar Chart:</strong> A powerful chart that compares multiple categories on the same axes, showing where your efforts are concentrated. This is excellent for visualizing balance, such as the <em>distribution of tasks across different projects</em> or days of the week.
    </li>
     <li>
        <strong>KPI Stat Widget:</strong> This is not a chart, but a widget that displays a single, important number (a Key Performance Indicator). It's designed for a quick, high-level overview. Use it to track critical metrics like <em>Total Overdue Tasks</em> or <em>Tasks Completed Today</em>.
    </li>
</ul>


<h4>3. Core Configuration Options</h4>
<p>
    Every widget has the following core settings that you can customize after clicking "Configure":
</p>
<ul>
    <li>
        <strong>Widget Name:</strong> A descriptive title for your widget (e.g., "Daily Work Completions").
    </li>
    <li>
        <strong>Chart Type:</strong> Choose from <code>line</code>, <code>bar</code>, <code>pie</code>, <code>radar</code>, or <code>kpi</code>.
    </li>
     <li>
        <strong>Metric:</strong> The specific data point you want to measure (e.g., <code>completed</code>, <code>created</code>, <code>due</code>).
    </li>
    <li>
        <strong>Date Range:</strong> Defines the time period for the data, set with a direction (<code>look: 'back'</code> or <code>'forward'</code>), a time unit (<code>'days'</code>, <code>'weeks'</code>), and a value. For example, <code>{ look: 'back', unit: 'days', value: 30 }</code> shows data for the last 30 days.
    </li>
    <li>
        <strong>Group By:</strong> Aggregates the data into time-based groups for chart display (<code>day</code>, <code>week</code>, <code>month</code>). This is mainly used for line and bar charts.
    </li>
</ul>

<h4>4. Advanced Filtering & Display</h4>
<p>
    Focus your widgets on what truly matters using filters. Remember, <strong>all filters are combined with AND logic</strong>.
</p>
<ul>
    <li>
        <strong>Filtering (Folders & Tags):</strong> Specify Folders and Tags to either <strong>Include</strong> or <strong>Exclude</strong>. This is the key to creating project- or context-specific widgets.
    </li>
    <li>
        <strong>Display Options:</strong> You can also toggle the widget's title (\`overrideShowTitle\`), the expand/collapse chevron (\`overrideShowChevron\`), and automatically add the date range to the title (\`appendTimePeriod\`).
    </li>
</ul>

<h4>Example Use Cases:</h4>
<ol>
    <li>
        <strong>Project Health KPI:</strong>
        <ul>
            <li><strong>Type:</strong> KPI Stat</li>
            <li><strong>Metric:</strong> <code>overdue</code></li>
            <li><strong>Tags to Include:</strong> <code>#project-apollo</code></li>
            <li><strong>Result:</strong> A single, large number showing you exactly how many tasks are currently overdue for Project Apollo.</li>
        </ul>
    </li>
    <li>
        <strong>Area of Focus Breakdown:</strong>
        <ul>
            <li><strong>Type:</strong> Radar Chart</li>
            <li><strong>Group By:</strong> Tag</li>
            <li><strong>Tags to Include:</strong> <code>#work</code>, <code>#personal</code>, <code>#learning</code></li>
            <li><strong>Result:</strong> A radar chart with three axes (#work, #personal, #learning), showing the distribution of open tasks across your main areas of focus.</li>
        </ul>
    </li>
</ol>



        `;



    }



    renderCreationDashboardSettings(container) {
        container.empty();

        this.draggedItem = null;
        this.placeholder = null;

        const handleMouseMove = (e) => {
            if (!this.draggedItem) return;
            const draggableContainer = this.draggedItem.closest('.cpwn-pm-draggable-widget-list');
            if (!draggableContainer) return;
            const otherItems = Array.from(draggableContainer.children).filter(child => child !== this.draggedItem && child !== this.placeholder);
            let target = null;
            for (const item of otherItems) {
                const rect = item.getBoundingClientRect();
                if (e.clientY > rect.top && e.clientY < rect.bottom) {
                    target = item;
                    break;
                }
            }
            if (target) {
                const rect = target.getBoundingClientRect();
                const isAfter = e.clientY > rect.top + rect.height / 2;
                target.parentNode.insertBefore(this.placeholder, isAfter ? target.nextSibling : target);
            }
        };

        const handleMouseUp = async (e) => {
            if (!this.draggedItem) return;
            if (this.placeholder && this.placeholder.parentNode) {
                this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);
                this.placeholder.remove();
            }
            this.draggedItem.removeClass('dragging');
            const container = this.draggedItem.closest('.cpwn-pm-draggable-widget-list');
            if (container) {
                const orderKey = container.dataset.orderKey;
                const title = container.dataset.title;
                const newOrder = Array.from(container.children).map(child => child.dataset.widgetKey);
                this.plugin.settings[orderKey] = newOrder;
                await this.saveAndUpdate();
            }
            this.draggedItem = null;
            this.placeholder = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        this.plugin.register(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        });

        container.createEl('div', { cls: 'cpwn-setting-spacer' });

        this.renderFileCreationWidgetSettings(container, 'Creation dashboard widgets (order and toggle display)', 'creationDashboardWidgets', 'creationDashboardOrder', DASHBOARDWIDGETS.creation);

        container.createEl('div', { cls: 'cpwn-setting-spacer' });

        container.createEl('div', { cls: 'cpwn-setting-spacer' });

        container.createEl('h2', { text: 'Built-in heatmap links' });
        container.createEl('p', { text: 'Set a note path to open when clicking the total count on a built-in heatmap widget. Leave empty to disable.', cls: 'cpwn-setting-item-description' });

        // Get all built-in creation heatmap widgets
        const creationWidgets = DASHBOARDWIDGETS.creation;

        // Loop through each widget and create a setting if it's a heatmap
        for (const widgetKey in creationWidgets) {
            // Only create settings for widgets that are actually heatmaps
            if (widgetKey.endsWith('heatmap')) {
                new Setting(container)
                    .setName(creationWidgets[widgetKey].name)
                    .addText(text => {
                        this.createPathSuggester(text.inputEl, (query) => {
                            return this.app.vault.getFiles()
                                .filter(f => !query || f.path.toLowerCase().includes(query.toLowerCase()))
                                .map(f => f.path);
                        });
                        text
                            .setPlaceholder('Path/to/your/note.md or file.base / file.canvas')
                            .setValue(this.plugin.settings.heatmapLinkConfig[widgetKey] || '')
                            .onChange(async (value) => {
                                this.plugin.settings.heatmapLinkConfig[widgetKey] = value.trim();
                                await this.plugin.saveSettings();
                            });
                    });
            }
        }

        container.createEl('div', { cls: 'cpwn-setting-spacer' });
        const customHeatmapsContainer = container.createDiv();

        // --- Create the Collapsible Guide ---
        const guideContainer = container.createDiv({ cls: 'cpwn-note-group-container' });

        // Check the saved state and apply 'cpwn-is-collapsed' class if needed
        if (this.plugin.settings.isHeatmapGuideCollapsed) {
            guideContainer.addClass('cpwn-is-collapsed');
        }

        // 1. Create the clickable header
        const header = guideContainer.createDiv({ cls: 'cpwn-note-group-header' });
        const headerContent = header.createDiv({ cls: 'cpwn-note-group-header-content' });
        const collapseIcon = headerContent.createDiv({ cls: 'cpwn-note-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');
        headerContent.createSpan({ text: "Custom Heatmap Widget Guide" });

        header.addEventListener('click', () => {
            const isNowCollapsed = guideContainer.classList.toggle('cpwn-is-collapsed');
            this.plugin.settings.isHeatmapGuideCollapsed = isNowCollapsed;
            this.plugin.saveSettings();
        });

        // 2. Create the content wrapper for the guide text
        const helpContentWrapper = guideContainer.createDiv({ cls: 'cpwn-note-list-wrapper' });
        const helpText = helpContentWrapper.createDiv(); // The actual element for the text
        helpText.setAttr('style', 'user-select: text; font-size: 0.9em; line-height: 1.6; padding: 15px; margin: 0; border-radius: 8px; background-color: var(--background-secondary);');

        helpText.innerHTML = `

<p>Use the Custom Heatmap section to add personalized heatmaps to your <strong>Creation</strong> dashboard. Each heatmap acts as a widget that visually tracks file creation activity based on a set of rules you define.</p>

<h2>Key Features</h2>
<ul>
    <li><strong>Date Range:</strong> Set a custom date range for each heatmap using the <strong>Months Back</strong> and <strong>Months Forward</strong> fields. For example, to see the last 6 months of activity, set "Months Back" to <code>5</code> and "Months Forward" to <code>0</code>.</li>
    <li><strong>Color:</strong> Choose a unique base color for each heatmap. The widget will automatically generate a 4-step gradient to represent activity density.</li>
    <li><strong>Filter Logic:</strong> Combine multiple rules using <strong>AND</strong> (all rules must match) or <strong>OR</strong> (any rule can match) logic for complex filtering.</li>
    <li><strong>Folder Exclusions:</strong> Exclude specific vault folders from a heatmap's results to narrow its focus.</li>
    <li><strong>Debug Mode:</strong> Enable "debug logging" to see a detailed list of all files matched by a heatmap's rules in the developer console, for Mac: Command (⌘) + Option (⌥) + I, for Windows: F12 or Ctrl + Shift + I.</li>
</ul>

<h2>Filter Rule Guide</h2>
<p>Each heatmap is powered by one or more filter rules. A rule consists of a <strong>Type</strong> (e.g., Tag, Filename), an <strong>Operator</strong> (e.g., is, contains), and a <strong>Value</strong>.</p>

<h3>Filter Types &amp; Operators</h3>
<table style="width:100%; border-collapse: collapse;">
    <thead style="text-align: left;">
        <tr>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; width: 20%;">Type</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; width: 30%;">Available Operators</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd;">Description</th>
        </tr>
    </thead>
    <tbody>
        <tr style="vertical-align: top;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tag</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><code>is</code><br><code>is not</code></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Checks if a file has a specific tag.</td>
        </tr>
        <tr style="vertical-align: top;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>File Path</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><code>contains</code><br><code>starts with</code><br><code>ends with</code><br><code>equals</code><br><code>matches regex</code></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Matches against the file's full path (e.g., <code>Journal/2025/My Note.md</code>). Path suggester is available.</td>
        </tr>
        <tr style="vertical-align: top;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Filename</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><code>contains</code><br><code>starts with</code><br><code>ends with</code><br><code>equals</code><br><code>matches regex</code></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Matches against the filename only (e.g., <code>My Note.md</code>).</td>
        </tr>
        <tr style="vertical-align: top;">
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>File Type</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><code>is</code><br><code>is not</code></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">Matches the file extension (e.g., <code>pdf</code>, <code>png</code>, <code>md</code>).</td>
        </tr>
    </tbody>
</table>

<h3>Filter Value Examples</h3>

<h4>1. Basic Text Matching</h4>
<ul>
    <li><strong>Tag</strong> <code>is</code> <code>meeting</code>: Matches files tagged with <code>#meeting</code>.</li>
    <li><strong>File Path</strong> <code>starts with</code> <code>Journal/</code>: Matches all files inside the <code>Journal</code> folder.</li>
    <li><strong>File Type</strong> <code>is not</code> <code>md</code>: Matches all files that are not Markdown files.</li>
</ul>

<h4>2. Advanced Matching (Regular Expressions)</h4>
<p>For complex patterns, use the <code>matches regex</code> operator. The value should be in the format <code>/pattern/flags</code> (e.g., <code>i</code> for case-insensitive).</p>
<ul>
    <li><strong>Example (Filename):</strong> Match all daily notes in <code>YYYY-MM-DD</code> format.<br>
    Operator: <code>matches regex</code><br>
    Value: <code>/\\d{4}-\\d{2}-\\d{2}/</code></li>
    <br>
    <li><strong>Example (File Path):</strong> Match files in 'Projects' or 'Areas' top-level folders.<br>
    Operator: <code>matches regex</code><br>
    Value: <code>/^(Projects|Areas)\\//</code></li>
</ul>

        `;

        this.renderCustomHeatmapsSection(customHeatmapsContainer);

    }

    renderFilterRules(heatmap, container) {
        // Clear only the specific container for this heatmap's filters to prevent full re-renders.
        container.empty();

        // Loop over the existing filters for the current heatmap and render a row for each one.
        (heatmap.filters || []).forEach((filter, filterIndex) => {
            const filterRow = container.createDiv({ cls: 'cpwn-pm-filter-row' });

            new Setting(filterRow)
                .setName(`Rule #${filterIndex + 1}`)
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('tag', 'Tag')
                        .addOption('filename', 'Filename')
                        .addOption('filepath', 'File path')
                        .addOption('filetype', 'File type')
                        .setValue(filter.type)
                        .onChange(async (value) => {
                            filter.type = value;
                            await this.saveAndUpdate();
                            // Re-render locally to update the UI (e.g., to add/remove the folder suggester).
                            this.renderFilterRules(heatmap, container);
                        });
                })

                .addDropdown(op_dropdown => { // Dropdown for Operator
                    const options = {
                        contains: 'contains',
                        not_contains: 'does not contain',
                        equals: 'equals',
                        not_equals: 'does not equal',
                        starts_with: 'starts with',
                        ends_with: 'ends with',
                        matches_regex: 'matches regex',
                        not_matches_regex: 'does not match regex'
                    };

                    // For 'tag' and 'filetype', only 'equals' and 'not_equals' make sense.
                    if (filter.type === 'tag' || filter.type === 'filetype') {
                        op_dropdown.addOption('equals', 'is');
                        op_dropdown.addOption('not_equals', 'is not');
                    } else {
                        for (const key in options) {
                            op_dropdown.addOption(key, options[key]);
                        }
                    }

                    op_dropdown
                        .setValue(filter.operator || 'contains')
                        .onChange(async (value) => {
                            filter.operator = value;
                            await this.saveAndUpdate();
                        });
                })

                .addText(text => {
                    text
                        .setPlaceholder("Enter value, e.g., #project or Work/*")
                        .setValue(filter.value)
                        .onChange(async (value) => {
                            filter.value = value;
                            if (this.heatmapUpdateTimer) window.clearTimeout(this.heatmapUpdateTimer);
                            this.heatmapUpdateTimer = window.setTimeout(async () => {
                                await this.saveAndUpdate();
                            }, 750);
                        });

                    // If the current filter type is 'filepath', reuse suggester.
                    if (filter.type === 'filepath') {
                        // Define the function that gets folder suggestions.
                        const getFolders = (query) => this.app.vault.getAllLoadedFiles()
                            .filter(f => f instanceof TFolder && (!query || f.path.toLowerCase().includes(query.toLowerCase())))
                            .map(f => f.path);

                        // Call helper method to attach the suggester.
                        this.createPathSuggester(text.inputEl, getFolders);
                    }
                })
                .addButton(button => {
                    button
                        .setButtonText('-')
                        .setTooltip('Remove rule')
                        .onClick(async () => {
                            heatmap.filters.splice(filterIndex, 1);
                            await this.saveAndUpdate();
                            this.renderFilterRules(heatmap, container);
                        });
                });
        });

        // "Add Filter Rule" button logic remains the same.
        new Setting(container)
            .addButton(button => {
                button
                    .setButtonText('Add filter rule')
                    .setCta()
                    .onClick(async () => {
                        if (!heatmap.filters) heatmap.filters = [];
                        heatmap.filters.push({ type: 'tag', operator: 'equals', value: '' });
                        await this.saveAndUpdate();
                        this.renderFilterRules(heatmap, container);
                    });
            });
    }

    renderCustomHeatmapsSection(container) {
        container.empty();

        (this.plugin.settings.customHeatmaps || []).forEach((heatmap, index) => {

            const heatmapBox = container.createDiv({ cls: 'cpwn-pm-heatmap-config-box' });

            // 1. Keep the existing title and name settings
            const titleEl = heatmapBox.createEl('h2', { text: `Heatmap ${index + 1}: ${heatmap.name}` });

            new Setting(heatmapBox)
                .setName("Name")
                .addText(text => text
                    .setPlaceholder("Enter heatmap name")
                    .setValue(heatmap.name)
                    .onChange(async (value) => {
                        heatmap.name = value;
                        titleEl.setText(`Heatmap ${index + 1}: ${value}`);
                        await this.saveAndUpdate();  // Use the more direct save here
                    }));

            new Setting(heatmapBox)
                .setName("Override show name")
                .setDesc("Override the global setting and choose if this widget shows a title.")
                .addToggle(toggle =>
                    toggle.setValue(heatmap.overrideShowTitle ?? null)
                        .onChange(async value => {
                            heatmap.overrideShowTitle = value; // can be true, false, or null (falls back to master)
                            await this.saveAndUpdate();

                        })
                );

            new Setting(heatmapBox)
                .setName("Override show chevron")
                .setDesc("Override the global setting and choose if this widget shows a toggle chevron.")
                .addToggle(toggle =>
                    toggle.setValue(heatmap.overrideShowChevron ?? null)
                        .onChange(async value => {
                            heatmap.overrideShowChevron = value;
                            await this.saveAndUpdate();
                        })
                );

            new Setting(heatmapBox)
                .setName('Date source')
                .setDesc('Choose which date to use for placing files on the heatmap.')
                .addDropdown(dropdown => dropdown
                    .addOption('creationDate', 'File Creation Date')
                    .addOption('dateFromTitle', 'Date from Note Title')
                    .setValue(heatmap.dateSource || 'creationDate') // Default to creationDate
                    .onChange(async (value) => {
                        heatmap.dateSource = value;
                        await this.saveAndUpdate();
                    }));

            new Setting(heatmapBox)
                .setName('Months back')
                .setDesc('Number of past months to show in the grid (e.g., 11 for the last year).')
                .addText(text => text
                    .setPlaceholder('11')
                    .setValue(heatmap.monthsBack?.toString() ?? '11')
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 0) {
                            heatmap.monthsBack = num;
                            await this.saveAndUpdate();
                        }
                    }));

            new Setting(heatmapBox)
                .setName('Months forward')
                .setDesc('Number of future months to show in the grid.')
                .addText(text => text
                    .setPlaceholder('0')
                    .setValue(heatmap.monthsForward?.toString() ?? '0')
                    .onChange(async (value) => {
                        const num = parseInt(value, 10);
                        if (!isNaN(num) && num >= 0) {
                            heatmap.monthsForward = num;
                            await this.saveAndUpdate();
                        }
                    }));

            new Setting(heatmapBox)
                .setName('Note link path')
                .setDesc('Set a note to open when clicking the total count for this heatmap.')
                .addText(text => {
                    this.createPathSuggester(text.inputEl, (query) => {
                        return this.app.vault.getFiles()
                            .filter(f => !query || f.path.toLowerCase().includes(query.toLowerCase()))
                            .map(f => f.path);
                    });
                    text
                        .setPlaceholder('Path/to/summary/note.md or file.base / file.canvas')
                        .setValue(heatmap.linkPath || '')
                        .onChange(async (value) => {
                            heatmap.linkPath = value.trim();
                            await this.saveAndUpdate();
                        });
                });


            // Add the dropdown for AND/OR logic
            new Setting(heatmapBox)
                .setName('Filter logic')
                .setDesc('Choose how multiple rules are combined.')
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('AND', 'All rules must match (AND)')
                        .addOption('OR', 'Any rule can match (OR)')
                        .setValue(heatmap.logic || 'AND')
                        .onChange(async (value) => {
                            heatmap.logic = value;
                            await this.saveAndUpdate();
                        });
                });

            // Create a container for the dynamic filter rules
            const filtersContainer = heatmapBox.createDiv({ cls: 'cpwn-pm-filters-container' });
            this.renderFilterRules(heatmap, filtersContainer);

            this.createRgbaColorSetting(heatmapBox, "Heatmap color", "Set the color for this specific heatmap.", `customHeatmaps.${index}.color`);
            this.createFolderExclusionUI(heatmapBox, heatmap, index);

            new Setting(heatmapBox)
                .setName('Enable debug logging')
                .setDesc('If enabled, the list of files for this heatmap will be printed to the developer console each time the dashboard refreshes. Each file will be listed with details if it was matched. An end summary section "--- Debug for Heatmap: Changes ---" will be outputted for files that were matched. NOTE: debug to be toggled off for normal daily use.')
                .addToggle(toggle => {
                    toggle
                        .setValue(heatmap.debug || false)
                        .onChange(async (value) => {
                            heatmap.debug = value;
                            await this.plugin.saveSettings();
                        });
                });


            new Setting(heatmapBox)
                .addButton(button => button
                    .setButtonText("Delete heatmap")
                    .setWarning()
                    .onClick(async () => {
                        if (confirm(`Are you sure you want to delete the "${heatmap.name}" heatmap?`)) {
                            this.plugin.settings.customHeatmaps.splice(index, 1);
                            await this.saveAndUpdate();
                            this.renderDashboardSettings()
                        }
                    }));
        });

        // The "Add Custom Heatmap" button now goes inside this section
        new Setting(container)
            .setName("Add new custom heatmap")
            .setDesc("Create a new heatmap widget with custom filtering rules.")
            .addButton(button => button
                .setButtonText("Add heatmap")
                .setCta()
                .onClick(async () => {
                    // Add the new heatmap to settings
                    this.plugin.settings.customHeatmaps.push({
                        name: 'New heatmap',
                        color: 'rgba(74, 144, 226, 1.00)',
                        logic: 'AND',
                        filters: [{ type: 'tag', operator: 'equals', value: '' }],
                        debug: false,
                        dateSource: 'creationDate',
                        excludeFolders: [],
                        monthsBack: 11,
                        monthsForward: 0,
                        linkPath: ''
                    });
                    await this.saveAndUpdate();
                    this.renderDashboardSettings();
                }));
    }

    // Add this function inside the PeriodSettingsTab class
    createFolderExclusionUI(containerEl, heatmap, heatmapIndex) {
        const exclusionContainer = containerEl.createDiv({ cls: 'cpwn-pm-folder-exclusion-container' });
        new Setting(exclusionContainer)
            .setName("Excluded folders")
            .setDesc("Files in these folders will be ignored by this heatmap.");

        // Display the list of currently excluded folders
        const excludedListEl = exclusionContainer.createDiv();
        const renderExcludedList = () => {
            excludedListEl.empty(); // Clear the current list

            if (heatmap.excludeFolders && heatmap.excludeFolders.length > 0) {
                heatmap.excludeFolders.forEach((folder, index) => {
                    new Setting(excludedListEl)
                        .setName(folder)
                        .addButton(button => button
                            .setIcon('trash')
                            .setTooltip('Remove folder')
                            .onClick(async () => {
                                heatmap.excludeFolders.splice(index, 1);
                                await this.saveAndUpdate();
                                renderExcludedList(); // Re-render only this list
                            }));
                });
            } else {
                excludedListEl.createEl('p', { text: 'No folders are currently excluded.', cls: 'cpwn-setting-item-description' });
            }
        };

        renderExcludedList();

        // Add UI for adding a new folder
        const addSetting = new Setting(exclusionContainer);
        let textInput;
        addSetting.addText(text => {
            textInput = text;

            // This function now correctly accepts a 'query' and filters the results.
            const getFilteredFolders = (query) => {
                const allFolders = this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder);

                // If the query is empty, return the full list of folders.
                if (!query) {
                    return allFolders.map(f => f.path);
                }

                const lowerCaseQuery = query.toLowerCase();

                // Otherwise, return only the folders that include the query text.
                return allFolders
                    .filter(folder => folder.path.toLowerCase().includes(lowerCaseQuery))
                    .map(folder => folder.path);
            };

            // Pass the new, correct filtering function to the suggester.
            this.createPathSuggester(text.inputEl, getFilteredFolders);

            text.setPlaceholder('Enter folder path to exclude...');
        }).addButton(button => button
            .setButtonText('Add')
            .setTooltip('Exclude this folder')
            .onClick(async () => {
                const newFolder = textInput.getValue().trim();
                if (!newFolder) return; // Exit if the input is empty

                // Directly reference the heatmap settings that will be modified.
                const heatmapToUpdate = this.plugin.settings.customHeatmaps[heatmapIndex];

                // 1. Defensive Check: If the `excludeFolders` array doesn't exist, create it.
                // This handles heatmaps created before this feature was added.
                if (!heatmapToUpdate.excludeFolders) {
                    heatmapToUpdate.excludeFolders = [];
                }

                // 2. Safe Check: Now that we are certain the array exists, we can safely
                // check if the folder is already in the list.
                if (!heatmapToUpdate.excludeFolders.includes(newFolder)) {
                    heatmapToUpdate.excludeFolders.push(newFolder);
                    await this.saveAndUpdate();

                    renderExcludedList();
                }

            }));
    }

    async renderThemesSettings() {
        const containerEl = this.contentEl;
        containerEl.empty(); // Clear previous content to prevent duplicating event listeners
        containerEl.createEl('h1', { text: 'Theme management' });

        if (!this.activePreviewMode) {
            // Check if Obsidian is in dark mode (Obsidian adds theme-dark class to body)
            const isDarkMode = document.body.classList.contains('theme-dark');
            this.activePreviewMode = isDarkMode ? 'dark' : 'light';
        }

        // Display an indicator if a theme is currently applied
        if (this.plugin.settings.appliedTheme) {
            new Setting(containerEl)
                .setName('Currently applied theme: ' + this.plugin.settings.appliedTheme)
                .setDesc(`The appearance settings from the "${this.plugin.settings.appliedTheme}" theme are currently active.`)
                .addButton(button =>
                    button
                        .setButtonText('Clear')
                        .setTooltip('Clear this indicator. This does not change your settings.')
                        .onClick(async () => {
                            this.plugin.settings.appliedTheme = '';
                            await this.plugin.saveSettings();
                            this.display(); // Re-render the entire settings tab
                            new Notice('Applied theme indicator cleared.');
                        })
                )
                .settingEl.addClass('cpwn-applied-theme-indicator');
        }

        // Find theme files in the plugin's "themes" directory
        const themeFiles = await this.getThemeFiles();
        if (!themeFiles) {
            containerEl.createEl('p', { text: 'The Themes could not be loaded.' });
            return;
        }

        if (themeFiles.length === 0) {
            containerEl.createEl('p', { text: 'No themes were found.' });
            return;
        }

        // Create the main two-column layout
        const mainContainer = containerEl.createDiv({ cls: 'cpwn-theme-settings-container' });
        const listContainer = mainContainer.createDiv({ cls: 'cpwn-theme-list-container' });
        this.previewContainer = mainContainer.createDiv({ cls: 'cpwn-theme-preview-wrapper' });

        listContainer.createEl('h3', { text: 'Available themes' });

        // Sort the theme files alphabetically before rendering.
        themeFiles.sort((a, b) => a.localeCompare(b));

        // Create a list item for each theme file
        // Now themeFiles is just an array of theme names from BUNDLED_THEMES
        themeFiles.forEach(file => {
            const themeName = file.replace('.json', '').replace('-theme', '');
            const itemEl = listContainer.createDiv({ text: themeName, cls: 'cpwn-theme-list-item' });

            if (themeName === this.plugin.settings.appliedTheme) {
                itemEl.classList.add('is-active');
            }

            // Add a click listener to each theme item to render its preview
            itemEl.addEventListener('click', async () => {
                Array.from(listContainer.querySelectorAll('.cpwn-theme-list-item')).forEach(child => child.classList.remove('is-active'));
                itemEl.classList.add('is-active');
                this.selectedThemeFile = { name: themeName };

                // Instead of reading file, get theme directly from bundled object
                const themeSettings = BUNDLED_THEMES[themeName];

                if (themeSettings) {
                    this.renderThemePreview(themeSettings, themeName);
                } else {
                    new Notice(`Error: Theme "${themeName}" not found`);
                    console.error('Theme not found in BUNDLED_THEMES:', themeName);
                }
            });
        });


        const themeItems = Array.from(listContainer.querySelectorAll('.cpwn-theme-list-item'));
        let focusedIndex = -1;

        if (themeItems.length > 0) {
            // Determine the initial item to focus on (the active theme, or the first one)
            const initiallyActiveIndex = themeItems.findIndex(item => item.classList.contains('is-active'));
            focusedIndex = (initiallyActiveIndex !== -1) ? initiallyActiveIndex : 0;

            // Set tabindex to manage focus: '0' for the focusable item, '-1' for the rest
            themeItems.forEach((item, index) => {
                item.setAttribute('tabindex', index === focusedIndex ? '0' : '-1');
            });

            themeItems[focusedIndex].focus();

            // Load the initial preview if the pane is empty
            if (!this.previewContainer.hasChildNodes()) {
                themeItems[focusedIndex].click();
            }

            // --- GLOBAL KEYBOARD NAVIGATION ---
            // Attach a single, persistent listener to the settings tab's root container.
            // This captures arrow keys regardless of what specific element has focus.
            this.containerEl.onkeydown = (e) => {
                // Ignore key presses if the user is typing in an input field
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }

                const key = e.key;
                if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    return;
                }

                e.preventDefault();

                // Handle Up/Down for theme selection
                if (key === 'ArrowUp' || key === 'ArrowDown') {
                    themeItems[focusedIndex].setAttribute('tabindex', '-1');
                    if (key === 'ArrowDown') {
                        focusedIndex = (focusedIndex + 1) % themeItems.length;
                    } else {
                        focusedIndex = (focusedIndex - 1 + themeItems.length) % themeItems.length;
                    }
                    const newItem = themeItems[focusedIndex];
                    newItem.setAttribute('tabindex', '0');
                    newItem.focus();
                    newItem.click(); // Click to load preview instantly

                    // Handle Left/Right for light/dark mode toggle
                } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
                    // Find buttons by their data-mode attribute inside the preview container
                    const lightButton = this.previewContainer.querySelector('button[data-mode="light"]');
                    const darkButton = this.previewContainer.querySelector('button[data-mode="dark"]');

                    if (lightButton && darkButton) {
                        // Click the button that is NOT currently active
                        const targetButton = lightButton.classList.contains('is-active') ? darkButton : lightButton;
                        targetButton.click();
                    }
                }
            };
        } else {
            this.renderInitialPreview();
        }
    }

    async getThemeFiles() {
        // Return theme names from bundled object
        return Object.keys(BUNDLED_THEMES).map(name => `${name}.json`);
    }

    renderInitialPreview() {
        if (!this.previewContainer) return;
        this.previewContainer.empty();
        this.previewContainer.createEl('h3', { text: 'Theme preview' });
        const placeholder = this.previewContainer.createDiv({ cls: 'theme-preview-placeholder' });
        placeholder.setText('Select a theme to see a preview and apply it.');
    }

    renderThemePreview(settings, fileName) {
        if (!this.previewContainer) return;
        this.previewContainer.empty();

        this.previewContainer.createEl('h3', { text: 'Live theme preview' });

        const tabContainer = this.previewContainer.createDiv({ cls: 'cpwn-theme-preview-tabs' });
        const lightTabBtn = tabContainer.createEl('button', { text: 'Light mode' });
        lightTabBtn.setAttribute('data-mode', 'light');

        const darkTabBtn = tabContainer.createEl('button', { text: 'Dark mode' });
        darkTabBtn.setAttribute('data-mode', 'dark');

        const previewContent = this.previewContainer.createDiv();

        const render = (mode) => {
            this.activePreviewMode = mode;
            previewContent.empty();
            previewContent.className = '';
            previewContent.addClass('cpwn-theme-preview-pane');

            if (mode === 'light') {
                previewContent.style.backgroundColor = settings.backgroundColorLight || '#ffffff';
                previewContent.style.color = settings.textColorLight || '#000000';
            } else {
                previewContent.style.backgroundColor = settings.backgroundColorDark || '#1e1e1e';
                previewContent.style.color = settings.textColorDark || '#dddddd';
            }

            this.createComprehensivePreview(previewContent, settings, mode);
        };

        lightTabBtn.addEventListener('click', () => {
            darkTabBtn.classList.remove('is-active');
            lightTabBtn.classList.add('is-active');
            render('light');
        });

        darkTabBtn.addEventListener('click', () => {
            lightTabBtn.classList.remove('is-active');
            darkTabBtn.classList.add('is-active');
            render('dark');
        });

        // Initialize the preview mode based on app appearance ONLY if it hasn't been set yet.
        if (!this.activePreviewMode) {
            this.activePreviewMode = document.body.classList.contains('cpwn-theme-dark') ? 'dark' : 'light';
        }

        // Trigger the click on the correct button based on the *stored* preview mode.
        if (this.activePreviewMode === 'dark') {
            darkTabBtn.click();
        } else {
            lightTabBtn.click();
        }

        const initialMode = this.activePreviewMode || (document.body.classList.contains('cpwn-theme-dark') ? 'dark' : 'light');
        if (initialMode === 'light') {
            lightTabBtn.click();
        } else {
            darkTabBtn.click();
        }

        new Setting(this.previewContainer)
            .setName("Apply this theme")
            .setDesc("This will overwrite your current appearance settings with the previewed values.")
            .addButton(button => {
                button
                    .setButtonText("Apply")
                    .setCta() // Makes the button more prominent, indicating a primary action



                    .onClick(async () => {
                        // 1. Apply the settings from the previewed theme
                        for (const key of Object.keys(settings)) {
                            if (this.plugin.settings.hasOwnProperty(key)) {
                                this.plugin.settings[key] = settings[key];
                            }
                        }
                        // 2. Save the name of the applied theme file
                        if (fileName) {
                            this.plugin.settings.appliedTheme = fileName.replace(/\.json$/, '');
                            //console.log("Applied theme settings:", fileName, settings);
                        }

                        // 3. Save the new settings to disk and update the live styles
                        await this.plugin.saveSettings();
                        this.plugin.updateStyles();

                        // 4. Force the entire settings tab to re-render from scratch
                        this.refreshDisplay();

                        new Notice('Theme applied successfully!');

                        // 5. Force any open calendar views to update with the new theme
                        const leaf = this.app.workspace.getLeavesOfType('calendar-period-week')[0];

                        if (leaf && leaf.view instanceof PeriodMonthView) {
                            await leaf.view.render();
                        }
                    });
            });

    }

    getPreviewColor(themeSettings, key) {
        // 1. Prioritize the color from the loaded theme file
        if (themeSettings && themeSettings[key] !== undefined) {
            return themeSettings[key];
        }
        // 2. Fallback to the live plugin settings if the key is missing in the theme
        if (this.plugin.settings && this.plugin.settings[key] !== undefined) {
            return this.plugin.settings[key];
        }
        // 3. Provide a safe default if the setting is defined nowhere
        // This is a fallback for older themes that might not have all keys
        if (key.toLowerCase().includes('light')) {
            return 'rgba(0, 0, 0, 1)'; // Default to black for light mode
        }
        return 'rgba(255, 255, 255, 1)'; // Default to white for dark mode
    }


    createComprehensivePreview(container, settings, mode) {
        const isLight = mode === 'light';
        container.addClass(`cpwn-theme-preview-pane-${mode}`);

        // --- Calendar Grid Preview ---
        const calendarGridHeader = container.createEl('div', { cls: 'cpwn-preview-section-header' });

        // --- Month and Year Title Preview ---
        const monthTitleContainer = calendarGridHeader.createEl('h3');
        monthTitleContainer.style.fontSize = this.getPreviewColor(settings, 'mainMonthYearTitleFontSize', '22px');

        // Create a span for the MONTH part of the title
        const monthSpan = monthTitleContainer.createSpan({
            text: moment(new Date()).format('MMMM')
        });
        monthSpan.style.color = this.getPreviewColor(settings, isLight ? 'monthColorLight' : 'monthColorDark');
        monthSpan.style.fontWeight = this.getPreviewColor(settings, 'mainMonthTitleBold', false) ? 'bold' : 'normal';

        // Create a span for the YEAR part of the title
        const yearSpan = monthTitleContainer.createSpan({
            text: ` ${moment(new Date()).format('YYYY')}` // Note the leading space
        });
        yearSpan.style.color = this.getPreviewColor(settings, isLight ? 'yearColorLight' : 'yearColorDark');
        yearSpan.style.fontWeight = this.getPreviewColor(settings, 'mainYearTitleBold', false) ? 'bold' : 'normal';

        // --- Calendar Grid Preview ---
        const calendarWrapper = container.createDiv({ cls: `cpwn-preview-section-wrapper ${mode}` });
        calendarWrapper.style.backgroundColor = isLight ? (settings.backgroundColorLight || '#f5f5f5') : (settings.backgroundColorDark || '#2a2a2a');

        const table = calendarWrapper.createEl('table', { cls: 'cpwn-preview-calendar-grid' });

        // --- Table Header (thead) ---
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        const headers = ['CW', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        headers.forEach(headerText => {
            const th = headerRow.createEl('th', { text: headerText });

            // Always use the standard day header font color for the CW header text
            if (headerText === 'CW') {
                th.style.color = this.getPreviewColor(settings, isLight ? 'dayHeaderFontColorLight' : 'dayHeaderFontColorDark');
            }
            // For the SAT header, check if it should be highlighted
            else if (headerText === 'SAT' && this.getPreviewColor(settings, 'highlightTodayLabels', true) && this.getPreviewColor(settings, 'highlightTodayDayHeader', true)) {
                th.style.color = this.getPreviewColor(settings, isLight ? 'todayCircleColorLight' : 'todayCircleColorDark');
            }
            // For all other headers, use the standard day color
            else {
                th.style.color = this.getPreviewColor(settings, isLight ? 'dayHeaderFontColorLight' : 'dayHeaderFontColorDark');
            }
        });

        // --- Table Body (tbody) ---
        const tbody = table.createEl('tbody');
        const bodyRow = tbody.createEl('tr');

        // --- 1. Define All Dot Colors ---
        const dayDotColors = [
            this.getPreviewColor(settings, 'dailyNoteDotColor', '#4a90e2'),
            this.getPreviewColor(settings, 'noteCreatedColor', '#4caf50'),
            this.getPreviewColor(settings, 'noteModifiedColor', '#ff9800'),
            this.getPreviewColor(settings, 'assetDotColor', '#ff0000'),
            this.getPreviewColor(settings, 'calendarEventDotColor', '#c864c8'),
            this.getPreviewColor(settings, 'taskDotColor', '#80128D')
        ];

        // --- 2. Create the 'CW' cell (This was the missing part) ---
        const cwCell = bodyRow.createEl('td');
        const cwContent = cwCell.createDiv({ cls: 'cpwn-preview-day-content' });
        const cwNumber = cwContent.createDiv({ text: '42', cls: 'cpwn-preview-day-number' });

        // Style the week number based on theme settings
        if (this.getPreviewColor(settings, 'highlightTodayLabels', true) && this.getPreviewColor(settings, 'highlightTodayPWLabel', true)) {
            cwNumber.style.color = this.getPreviewColor(settings, isLight ? 'todayCircleColorLight' : 'todayCircleColorDark');
        } else {
            cwNumber.style.color = this.getPreviewColor(settings, isLight ? 'weekNumberFontColorLight' : 'weekNumberFontColorDark');
        }

        // Add the exclusive weekly note dot to the CW column
        if (this.getPreviewColor(settings, 'showWeeklyNoteDot', true)) {
            const weeklyDotsContainer = cwContent.createDiv({ cls: 'cpwn-preview-dots-container' });
            const weeklyNoteDot = weeklyDotsContainer.createDiv({ cls: 'cpwn-preview-dot' });
            weeklyNoteDot.style.backgroundColor = this.getPreviewColor(settings, 'weeklyNoteDotColor', '#a073f0');
        }

        // --- 3. Create the Day Cells (Sunday to Saturday) ---
        const dotDistribution = new Map([
            [5, [dayDotColors[1]]],
            [6, dayDotColors],
            [7, [dayDotColors[2]]],
            [8, [dayDotColors[0], dayDotColors[1]]],
            [9, [dayDotColors[1], dayDotColors[2], dayDotColors[3]]],
            [10, [dayDotColors[3], dayDotColors[4]]],
            [11, [dayDotColors[1], dayDotColors[2]]]
        ]);

        for (let i = 5; i <= 11; i++) {
            const td = bodyRow.createEl('td');
            const dayContent = td.createDiv({ cls: 'cpwn-preview-day-content' });
            const dayNumber = dayContent.createDiv({ text: i.toString(), cls: 'cpwn-preview-day-number' });

            const dotsToShow = dotDistribution.get(i);
            if (dotsToShow && dotsToShow.length > 0) {
                const dotsContainer = dayContent.createDiv({ cls: 'cpwn-preview-dots-container' });
                dotsToShow.forEach(color => {
                    const dot = dotsContainer.createDiv({ cls: 'cpwn-preview-dot' });
                    dot.style.backgroundColor = color;
                });
            }

            if (i === 11) {
                dayNumber.addClass('today');
                dayNumber.style.backgroundColor = this.getPreviewColor(settings, isLight ? 'todayCircleColorLight' : 'todayCircleColorDark');
                dayNumber.style.color = this.getPreviewColor(settings, isLight ? 'todayCircleTextColorLight' : 'todayCircleTextColorDark', '#000000');
            } else {
                dayNumber.style.color = this.getPreviewColor(settings, isLight ? 'dayCellFontColorLight' : 'dayCellFontColorDark');
            }
        }

        const tasksWrapper = container.createDiv({ cls: `cpwn-preview-section-wrapper ${mode}` });
        tasksWrapper.style.backgroundColor = isLight ? (settings.backgroundColorLight || '#f5f5f5') : (settings.backgroundColorDark || '#2a2a2a');

        const taskGroups = [
            { name: "Overdue", colorKey: "taskGroupColorOverdue", count: 2, icon: "alarm-clock-off" },
            { name: "Today", colorKey: "taskGroupColorToday", count: 3, icon: "target" },
            { name: "Tomorrow", colorKey: "taskGroupColorTomorrow", count: 1, icon: "calendar-days" }, // "Tomorrow" maps to "Next 7 Days" icon
            { name: "Future", colorKey: "taskGroupColorFuture", count: 5, icon: "telescope" },
            { name: "No date", colorKey: "taskGroupColorNoDate", count: 4, icon: "help-circle" }
        ];


        taskGroups.forEach(group => {
            const taskGroupEl = tasksWrapper.createDiv({ cls: 'cpwn-preview-task-group' });
            taskGroupEl.style.backgroundColor = this.getPreviewColor(settings, group.colorKey);

            // This wrapper keeps the icon and title together on the left
            const contentWrapper = taskGroupEl.createDiv({ cls: 'cpwn-preview-task-content-wrapper' });

            const titleRow = contentWrapper.createDiv({ cls: 'cpwn-preview-task-title-row' });

            const iconEl = titleRow.createDiv({ cls: 'cpwn-preview-task-icon' });
            setIcon(iconEl, group.icon);

            // The text now becomes "Overdue (2)", "Today (3)", etc.
            const titleSpan = titleRow.createSpan({
                text: `${group.name} (${group.count})`,
                cls: 'cpwn-preview-task-title'
            });

            // Move chevron up to be alongside the title
            const collapseIconEl = titleRow.createDiv({
                cls: 'cpwn-preview-collapse-icon'
            });
            setIcon(collapseIconEl, 'chevron-up');



            // Set the text color for all elements inside the group
            const textColor = this.getPreviewColor(settings, isLight ? 'taskGroupTextColorLight' : 'taskGroupTextColorDark');
            contentWrapper.style.color = textColor;
            collapseIconEl.style.color = textColor;
        });


        // --- 3. Create the Dot Color Key ---
        const keyContainer = container.createDiv({ cls: 'cpwn-preview-dot-key-container' });
        keyContainer.createEl('h5', { text: 'Calendar grid dot color key' });

        // Create a mapping of the dot colors to their names
        const dotKeyMap = new Map([
            [this.getPreviewColor(settings, 'weeklyNoteDotColor', '#a073f0'), 'Weekly note'],
            [this.getPreviewColor(settings, 'dailyNoteDotColor', '#4a90e2'), 'Daily note'],
            [this.getPreviewColor(settings, 'noteCreatedColor', '#4caf50'), 'Created note'],
            [this.getPreviewColor(settings, 'noteModifiedColor', '#ff9800'), 'Modified note'],
            [this.getPreviewColor(settings, 'assetDotColor', '#ff0000'), 'Asset'],
            [this.getPreviewColor(settings, 'calendarEventDotColor', '#c864c8'), 'Event'],
            [this.getPreviewColor(settings, 'taskDotColor', '#80128D'), 'Task']
        ]);

        // Loop through the map and create a key item for each dot type
        for (const [color, name] of dotKeyMap.entries()) {
            const keyItem = keyContainer.createDiv({ cls: 'cpwn-preview-dot-key-item' });
            const keyDot = keyItem.createDiv({ cls: 'cpwn-preview-dot-key-swatch' });
            keyDot.style.backgroundColor = color;
            keyItem.createSpan({ text: name });
        }
    }

    renderImportExportTab() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Import & export settings" });

        // --- EXPORT ---
        new Setting(containerEl)
            .setName("Export settings")
            .setDesc("Save your plugin settings to a JSON file. Two options: all plugin settings or theme settins only. This is useful for backing up all your settings or sharing your theme configuration with others.")
            .addButton(button => {
                button
                    .setButtonText("Export all settings")
                    .setIcon("save")
                    .setTooltip("Save all plugin settings to a file")
                    .onClick(() => this.handleExport('all'));

                button.buttonEl.style.cursor = 'pointer';
            })
            .addButton(button => {
                button
                    .setButtonText("Export theme only")
                    .setIcon("palette")
                    .setTooltip("Save only colors, fonts, and sizes to a theme file")
                    .onClick(() => this.handleExport('theme'));

                button.buttonEl.style.cursor = 'pointer';
            });

        new Setting(containerEl)
            .setName("Import settings")
            .setDesc("Load settings from a JSON file. This will overwrite your current settings after confirmation.")
            .addButton(button => {
                button
                    .setButtonText("Import from File")
                    .setIcon("upload")
                    .setTooltip("Load settings from a .json file")
                    .onClick(() => {
                        const fileInput = containerEl.createEl('input', {
                            type: 'file',
                            attr: {
                                accept: '.json',
                                style: 'display: none;'
                            }
                        });

                        fileInput.addEventListener('change', (event) => {
                            const file = event.target.files[0];
                            if (file) {
                                this.handleImport(file);
                            }
                        });

                        fileInput.click();
                    });

                button.buttonEl.style.cursor = 'pointer';
            });
    }

    /**
     * Handles the export functionality.
     * @param {'all' | 'theme'} type The type of export to perform.
     */
    handleExport(type) {
        let settingsToExport;
        let fileName;

        if (type === 'theme') {
            const themeKeys = [
                // General appearance settings
                "fontSize",
                "dayNumberFontSize",
                "navButtonHeight",
                "headerRowBold",
                "pwColumnBold",
                "pwColumnSeparatorColor",

                // Add all the font color settings
                "pwColumnFontColorLight",
                "pwColumnFontColorDark",
                "weekNumberFontColorLight",
                "weekNumberFontColorDark",
                "dayHeaderFontColorLight",
                "dayHeaderFontColorDark",
                "dayCellFontColorLight",
                "dayCellFontColorDark",
                "otherMonthFontColorLight",
                "otherMonthFontColorDark",

                // Add the highlight toggles
                "highlightTodayDayHeader",
                "highlightTodayPWLabel",
                "todayHighlightSize",

                "currentHighlightLabelColorLight",
                "currentHighlightLabelColorDark",

                // Add all the highlight color settings
                "monthColorLight",
                "monthColorDark",
                "yearColorLight",
                "yearColorDark",

                "mainMonthYearTitleFontSize",
                "mainMonthTitleBold",
                "mainYearTitleBold",

                // Other settings
                "tabTitleFontSize",
                "tabTitleBold",
                "selectedTabColor",
                "todayHighlightColorLight",
                "todayHighlightColorDark",
                "notesHoverColor",
                "dailyNoteDotColor",
                "noteCreatedColor",
                "noteModifiedColor",
                "rowHighlightColorLight",
                "rowHighlightColorDark",
                'weekendShadeColorLight',
                'weekendShadeColorDark',
                "dateCellHoverColorLight",
                "dateCellHoverColorDark",
                "assetDotColor",
                "calendarEventDotColor",
                "todayHighlightStyle",
                "todayCircleColorLight",
                "todayCircleColorDark",
                "weeklyNoteDotColor",
                "scratchFontSize",
                "scratchBold",
                "scratchFontFamily",
                "scratchpadHighlightColor",
                "notesFontSize",
                "notesBold",
                "notesLineHeight",
                "showNoteStatusDots",
                "otherNotePopupFontSize",
                "calendarDotSize",
                // Task settings
                "taskIndicatorStyle",
                "taskDotColor",
                "taskBadgeFontSize",
                "taskBadgeColor",
                "taskBadgeFontColor",
                "taskHeatmapStartColor",
                "taskHeatmapMidColor",
                "taskHeatmapEndColor",
                "taskHeadingFontSize",
                "taskTextFontSize",
                "taskGroupColorOverdue",
                "taskGroupColorToday",
                "taskGroupColorTomorrow",
                "taskGroupColorNext7Days",
                "taskGroupColorFuture",
                "taskGroupColorNoDate",
                "taskGroupColorTag",

                //Task Dashboard
                "taskStatusColorOverdue",
                "taskStatusColorInProgress",
                "taskStatusColorOpen",
                "taskStatusColorCompleted",
                "taskStatusColorCancelled"
            ];
            settingsToExport = {};
            for (const key of themeKeys) {
                if (this.plugin.settings.hasOwnProperty(key)) {
                    settingsToExport[key] = this.plugin.settings[key];
                }
            }
            // Add the theme-specific identifier
            settingsToExport.__exportType = "theme";
            fileName = `cpwn-calendar-period-week-notes-theme.json`;

        } else { // 'all'
            // Create a copy to avoid modifying the live settings object
            settingsToExport = { ...this.plugin.settings };
            // Add the 'all' settings identifier
            settingsToExport.__exportType = "all";
            fileName = `cpwn-calendar-period-week-notes-settings.json`;
        }

        const data = JSON.stringify(settingsToExport, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        new Notice(`${type === 'theme' ? 'Theme' : 'All'} settings exported.`);
    }

    /**
     * Handles the import functionality.
     * @param {File} file The JSON file selected by the user.
     */
    handleImport(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = JSON.parse(event.target.result);
                const exportType = importedSettings.__exportType;

                // Define default/fallback messages
                let title = 'Overwrite settings?';
                let message = 'This appears to be an older settings file. Are you sure you want to import it? Your current configuration will be overwritten.';
                let confirmText = 'Import';

                // Customize messages based on the export type
                if (exportType === 'theme') {
                    title = 'Import theme settings?';
                    message = 'You are about to import a theme file. This will overwrite only your current appearance settings (colors, fonts, etc.).';
                    confirmText = 'Import theme';
                } else if (exportType === 'all') {
                    title = 'Import all settings?';
                    message = 'You are about to import a full settings file. This will overwrite your ENTIRE current configuration for this plugin.';
                    confirmText = 'Import all';
                } else {
                    // Basic validation for old files without an identifier
                    if (!importedSettings.hasOwnProperty('fontSize') && !importedSettings.hasOwnProperty('fixedNoteFile')) {
                        new Notice('Error: This does not appear to be a valid settings file.', 5000);
                        return;
                    }
                }

                // Remove the identifier before merging so it's not saved into the plugin's data
                if (exportType) {
                    delete importedSettings.__exportType;
                }

                // Show the confirmation modal with the appropriate message
                new ConfirmationModalWithStyles(this.app,
                    title,
                    message,
                    async () => {
                        this.plugin.settings = Object.assign({}, this.plugin.settings, importedSettings);

                        if (exportType === 'theme') {
                            this.plugin.settings.appliedTheme = file.name.replace(/\.json$/, '');
                        }

                        await this.saveAndUpdate();
                        this.refreshDisplay(); // Re-render the settings tab
                        new Notice('Settings imported successfully!');
                    },
                    confirmText // Use the customized button text
                ).open();

            } catch (e) {
                new Notice('Error: Could not parse the JSON file. Ensure it is not corrupted.', 5000);
                console.error("Failed to parse settings JSON:", e);
            }
        };
        reader.readAsText(file);
    }

    renderAboutTab() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "About calendar period week notes" });

        containerEl.createEl("p", {
            text: "This plugin provides two comprehensive calendar views together with an integrated panel containing a scratchpad area, notes, tasks, and assets."
        });

        new Setting(containerEl)
            .setName("Support the developer")
            .setDesc("If you find this plugin useful, please consider supporting its development. It's greatly appreciated!")
            .addButton(button => {
                button
                    .setButtonText("☕ Buy me a coffee")
                    .setTooltip("https://buymeacoffee.com/fikte")
                    .onClick(() => {
                        window.open("https://buymeacoffee.com/fikte");
                    });
                button.buttonEl.addClass('mod-cta');
                button.buttonEl.style.backgroundColor = '#FFDD00';
                button.buttonEl.style.color = '#000000';
                button.buttonEl.style.cursor = 'pointer';
            });
    }

    async renderStartHereTab() {
        const containerEl = this.contentEl;

        // We are setting the HTML directly to bypass the MarkdownRenderer and avoid plugin conflicts.
        const htmlContent = `
        <h1>🚀 Quick start: Initial setup</h1>
        <hr>
        <p>To get the most out of this plugin, it's recommended to configure a few key settings to match your workflow.</p>
        <hr>
        <h3>1. Set Up Your Scratchpad Note</h3>
        <p>The <strong>Scratchpad</strong> tab needs to point to a note file in your vault. By default, it looks for <code>Scratchpad.md</code> in your vault's root.</p>
        <ul>
            <li><strong>Go to:</strong> "Scratchpad Tab" → "ScratchPage note path"></li>
            <li><strong>Action:</strong> Set the <strong>Scratchpad note path</strong> to any note you prefer. If it doesn't exist, the plugin will create it for you.</li>
        </ul>
        <hr>
        <h3>2. Configure Your Daily Notes</h3>
        <p>For calendar and list dots and click-to-open features to work, the plugin needs to know where your daily notes are.</p>
        <ul>
            <li><strong>Go to:</strong> "Calendar Functional" → "Daily Notes"</li>
            <li><strong>Action:</strong> Set your <strong>Daily Notes folder</strong> and <strong>Daily note format</strong> to match setup (e.g., YYYY-MM-DD).</li>
        </ul>
        <hr>
        <h3>3. Set up the Task Dashboard and Tab features</h3>


    <div style="padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 8px; margin-bottom: 20px; background-color: var(--background-secondary-alt);">
    <h4 style="margin-top: 0;">Important: Requires Obsidian Tasks Plugin</h4>
    <p style="margin-bottom: 0;">
        For the <strong>Tasks Tab</strong> and all <strong>Dashboard Task Widgets</strong> to function, you <strong>MUST</strong> have the official <a href="https://github.com/obsidian-tasks-group/obsidian-tasks">Obsidian Tasks</a> plugin installed and enabled. This plugin provides the core engine for finding and processing tasks in your vault.
    </p>
</div>


        <h4 style="margin-top: 0;">Getting the Most Out of Task Tracking</h4>
    <p>
        To unlock the full potential of the Tasks Tab and Dashboard Widgets, it is highly recommended to use <strong>Created, Due, and Completion dates</strong> on your tasks. These dates power all the date-based filtering, sorting, and charting capabilities of this plugin.
    </p>

    <p>
        You can enable automatic date tracking in the settings of the <strong>Obsidian Tasks</strong> plugin. Go to <code>Settings → Tasks</code> and ensure the following options are enabled:
    </p>
    <ul>
        <li><strong>Set created date on new tasks</strong></li>
        <li><strong>Set done date on every completed task</strong></li>
    </ul>

    <h4>Task Date Format Examples:</h4>
    <p>By default, the Obsidian Tasks plugin uses the following emoji formats, (note date format below is in YYYY-MM-DD but you can configure this as required):</p>
    
    <p><strong>Due Dates (When is it due?):</strong></p>
    <pre><code>- [ ] My task with a due date 📅 2025-10-26</code></pre>
    <pre><code>- [ ] Review project notes #work 📅 2025-11-01</code></pre>
    
    <p><strong>Created Dates (When was it added?):</strong></p>
    <pre><code>- [ ] A new idea I had today ➕ 2025-11-09</code></pre>

    <p><strong>Completion Dates (When was it finished?):</strong></p>
    <pre><code>- [x] My completed task ✅ 2025-11-15</code></pre>
    
    <p><strong>What a completed task should look like:</strong></p>
    <pre><code>- [x] A completed task ➕ 2025-11-09 📅 2025-11-15 ✅ 2025-11-15</code></pre>
    <hr>
    <p style="font-size: var(--font-ui-small); margin-bottom: 0;">
        <strong>NOTE:</strong> If you prefer not to use this task format or the Tasks plugin, you can disable the Tasks Tab entirely in the "General Tab" → "Tab Visibility" section of this plugin's settings to declutter your workspace.
    </p>
</div>
        <h3>4. (Optional) Set Your Period/Week Start Date</h3>
        <p>If you plan to use the custom Period/Week calendar system (e.g., "P7W4"), you should set its starting date. The period/week calendar system, used by some companies for financial year tracking, assumes 13 periods with 4 weeks in each period.</p>
        <ul>
            <li><strong>Go to:</strong> "Calendar Functional" → "Period/Week System"</li>
            <li><strong>Action:</strong> Set the <strong>Start of Period 1 Week 1</strong> to the Sunday date of your choice.</li>
        </ul>
    `;
        const fragment = sanitizeHTMLToDom(htmlContent);
        containerEl.empty();
        containerEl.appendChild(fragment);

    }

}
