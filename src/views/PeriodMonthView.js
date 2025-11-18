// src/views/PeriodMonthView.js
// Obsidian imports
import {
    ItemView,
    debounce,
    TFile,
    TFolder,
    Notice,
    MarkdownRenderer,
    setIcon,
    Platform
} from 'obsidian';

// External libraries
import ICAL from 'ical.js';
import moment from 'moment';

// Constants
import { VIEW_TYPE_PERIOD, DASHBOARDWIDGETS } from '../data/constants.js';

// Utilities
import {
    getPeriodWeek,
    isSameDay,
    formatDate,
    formatMonthTitle
} from '../utils/dateUtils.js';

import {
    blendRgbaColors,
    parseRgbaString
} from '../utils/colorUtils.js';

// Widgets
import { CssChartRenderer } from '../widgets/CssChartRenderer.js';
import { TaskDataAggregator } from '../widgets/TaskDataAggregator.js';

// Modals
import { ActionChoiceModal } from '../modals/ActionChoiceModal.js';
import { ConfirmationModal } from '../modals/ConfirmationModal.js';
import { FilterSuggest, TagSuggest } from '../utils/suggesters.js';

export { VIEW_TYPE_PERIOD };

/**
 * The main view class for the plugin, handling all rendering and user interaction.
 */
export class PeriodMonthView extends ItemView {

    constructor(leaf, plugin) {
        super(leaf);
        this.activePopupArgs = null;
        this.isTogglingTask = false;
        this.activeHoverCell = null;
        this.plugin = plugin;
        this.calendarHeaderRowEl = null;
        this.pinnedSortOrder = this.plugin.settings.pinnedNotesSortOrder;
        this.blurActiveInput = this.blurActiveInput.bind(this);
        this.dashboardContentEl = null;
        this.dashboardTaskDebounceTimer = null;
        this.dashboardCreationDebounceTimer = null;
        this.dashboardRefreshTimers = new Map();
        this.fileToHeatmapCache = new Map();
        this.statusBarObserver = null;
        this.heatmapRefreshDebounceTimer = null;

        //pull down to fresh
        this.taskPullStartY = 0;
        this.taskPullDistance = 0;
        this.isTaskPulling = false;
        this.lastTasksDashboardState = ''; // Used to detect changes in tasks for heatmap refreshes.


        this.mobileBlurTimeout = null;
        this.activeEditingTimeout = null;
        this.isActivelyEditing = false;
        this.scratchpadActionsContainer = null;

        // --- State Management ---
        this.displayedMonth = new Date(); // The month currently shown in the calendar.
        this.isVerticalView = false;      // Toggles between single-month and vertical scroll view.
        this.isPopupLocked = false;       // Tracks if popups are globally disabled
        this.isCalendarCollapsed = false; // Toggles the visibility of the calendar grid.
        this.calendarWasCollapsedForEditing = false;
        this.isCollapseTogglePressed = false;
        this.isScratchpadPreview = false; // Toggles scratchpad between edit and preview mode.
        this.activeTab = null;            // Tracks the currently selected tab ('scratch', 'notes', etc.).
        this.isProgrammaticScroll = false; // Prevents scroll event loops during programmatic scrolling.
        this.isDraggingNote = false;      // Tracks if a note is currently being dragged for reordering.
        this.isMouseDown = false;         // Tracks if the mouse button is currently pressed.
        this.isReorderModeActive = false;
        this.dashboardViewMode = this.plugin.settings.defaultDashboardView || 'creation';
        this.taskBarChartMode = this.plugin.settings.taskBarChartDefaultMode;

        // --- Search and Data States ---
        this.notesViewMode = this.plugin.settings.notesViewMode;
        this.dashboardSearchTerm = "";
        this.notesSearchTerm = "";
        this.tasksSearchTerm = "";
        this.scratchpadSearchTerm = "";
        this.assetsSearchTerm = "";
        this.collapsedNoteGroups = this.plugin.settings.collapsedNoteGroups || {};
        this.collapsedTaskGroups = this.plugin.settings.collapsedTaskGroups || {};
        this.collapsedAssetGroups = this.plugin.settings.collapsedAssetGroups || {};

        // --- Caching and Data Maps ---
        // These maps store pre-processed data to avoid re-scanning the vault on every render.
        this.noteText = "";
        this.allTasks = [];
        this.createdNotesMap = new Map();
        this.modifiedNotesMap = new Map();
        this.assetCreationMap = new Map();
        this.allCreatedNotesMap = new Map();
        this.tasksByDate = new Map();
        this.icsEventsByDate = new Map();
        this.processedEventSignatures = new Set();
        this.taskCache = new Map(); // Caches task content of files to detect changes.
        this.fileToTaskDates = new Map(); // Tracks which dates a file has tasks for. <filePath, Set<dateKey>>
        this.isAssetsGridView = this.plugin.settings.assetsDefaultView === 'grid';
        this.unusedAssetPathsCache = new Set();
        this.isUnusedAssetCacheValid = false;

        // --- UI and Event Handling ---
        this.todayBtn = null;
        this.scratchWrapperEl = null;
        this.scratchpadViewToggleBtn = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.popupEl = null;
        this.taskRefreshDebounceTimer = null;
        this.titleUpdateTimeout = null;
        this.existingWeeklyNotes = new Set();
        this.dailyRefreshTimeout = null;
        this.themeObserver = null;
        this.lastKnownToday = new Date();
        this.scratchpadFrontmatter = '';

        // --- Mobile Keyboard Handling ---
        this.isEditingMobile = false;

        // Initialize a MutationObserver to watch for theme changes.
        this.themeObserver = new MutationObserver(() => {
            // Debounce the re-render to avoid multiple calls during theme switching.
            if (this.themeChangeDebounceTimer) {
                window.clearTimeout(this.themeChangeDebounceTimer);
            }
            this.themeChangeDebounceTimer = window.setTimeout(() => {
                // If the calendar grid exists, re-render it to apply new theme colors.
                if (this.calendarBodyEl) {
                    this.renderCalendar();
                }
            }, 100); // A 100ms delay is usually sufficient.
        });

        // Start observing the `class` attribute on the document body.
        this.themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        this.registerDomEvent(document, 'mouseup', () => {
            // Always reset the mousedown flag.
            if (this.isMouseDown) {
                this.isMouseDown = false;
            }
            // Also, critically, reset the dragging flag as a safety net.
            // This prevents the flag from getting stuck if dragend doesn't fire.
            if (this.isDraggingNote) {
                this.isDraggingNote = false;
            }
        });

        const debouncedResize = debounce(() => {
            if (this.monthNameEl) this.updateMonthTitle();
        }, 100, true);

        this.registerDomEvent(window, 'resize', () => {
            debouncedResize();
        });

        // Define debounced functions here, bound to the view instance ('this')
        this.debouncedCalendarRefresh = debounce(() => {
            if (this.isVerticalView) {
                this.render();
            } else {
                this.renderCalendar();
            }
        }, 300, true);

        this.debouncedDashboardRefresh = debounce(() => {
            this.populateDashboard();
        }, 300, true);

        this.debouncedPopulateNotes = debounce(() => this.populateNotes(), 250, true);

        this.debouncedPopulateTasks = debounce(() => this.populateTasks(), 250, true);

        this.debouncedRebuildDashboards = debounce(async () => {
            if (!this.dashboardContentEl) return;

            if (this.dashboardViewMode === 'tasks') {
                this.lastTasksState = '';
                this.lastCreationState = '';
                await this.populateDashboard(true);
            } else if (this.dashboardViewMode === 'creation') {
                this.dashboardContentEl.empty();
                const widgetGrid = this.dashboardContentEl.createDiv({ cls: 'cpwn-pm-dashboard-grid' });
                await this.populateCreationDashboard(widgetGrid);
            }
        }, 150, true);

        this.registerEvent(
            this.app.workspace.on('cpwn-pm-dashboard-refresh', () => {
                // Check if the dashboard view is actually visible before trying to re-render it.
                if (this.dashboardContentEl) {
                    this.populateDashboard();
                }
            })
        );
    }

    async buildHeatmapFileCache() {
        this.fileToHeatmapCache.clear();
        const allFiles = this.app.vault.getFiles();

        // Loop through every file and check it against every heatmap config
        allFiles.forEach(file => {
            const matchingHeatmaps = new Set();
            this.plugin.settings.customHeatmaps.forEach((config, index) => {
                if (this._matchesHeatmapRule(file, config)) {
                    matchingHeatmaps.add(index);
                }
            });

            if (matchingHeatmaps.size > 0) {
                this.fileToHeatmapCache.set(file.path, matchingHeatmaps);
            }
        });
    }

    async hasUnlinkedAssets() {
        if (!this.plugin.settings.showUnusedAssetsIndicator) {
            return false;
        }
        // Use the cache if it's valid
        if (!this.isUnusedAssetCacheValid) {
            this.unusedAssetPathsCache = await this.getUnusedAssetPaths();
            this.isUnusedAssetCacheValid = true;
        }
        return this.unusedAssetPathsCache && this.unusedAssetPathsCache.size > 0;
    }

    handleKeyDown(event) {
        // Check if the pressed key is 'Escape' and if the vertical view is active.
        if (event.key === 'Escape' && this.isVerticalView) {
            // Prevent the default 'Escape' key behavior (like closing modals).
            event.preventDefault();

            // Set the state back to the main calendar grid view.
            this.isVerticalView = false;

            // Re-render the view to display the grid.
            this.render();
        }
    }

    blurActiveInput() {
        window.setTimeout(() => {
            const activeEl = document.activeElement;

            // Check if it's an element that can be blurred before calling the method
            if (activeEl instanceof HTMLElement && typeof activeEl.blur === 'function') {
                activeEl.blur();
            }
        }, 0);
    }

    getPriorityIconHTML(priority) {
        const priorityStr = String(priority || '2'); // Default to '2' (Normal/Medium)

        // --- FIX: Map priorities to their standard emoji ---
        const priorityEmojiMap = {
            '0': '🔺', // Highest
            '1': '⏫', // High
            '2': '🔼',    // Medium 
            '3': '', // Normal - no emoji 
            '4': '🔽', // Lowest
            '5': '⏬'     // None (no emoji)
        };

        const priorityKey = {
            'highest': '0',
            'high': '1',
            'medium': '2',
            'normal': '2',
            'low': '3',
            'lowest': '4',
            'none': '5'
        }[priorityStr.toLowerCase()] || priorityStr;

        // Return the emoji from the map, or an empty string if not found.
        return priorityEmojiMap[priorityKey] || '';
    }

    /**
     * The single source of truth for collapsing or expanding the calendar view.
     * @param {boolean} shouldBeCollapsed - The desired state. True to collapse, false to expand.
     */
    toggleCalendar(shouldBeCollapsed) {
        // If the UI is already in the desired state, do nothing.
        if (this.isCalendarCollapsed === shouldBeCollapsed) {
            return;
        }

        this.isCalendarCollapsed = shouldBeCollapsed;

        // Toggle the main CSS class that controls the collapse animation.
        // The CSS will automatically handle rotating the chevron icon.
        if (this.containerEl && this.containerEl.firstElementChild) {
            this.containerEl.firstElementChild.classList.toggle('cpwn-calendar-collapsed', shouldBeCollapsed);
        }
    }

    async refreshWithNewSettings(newSettings) {
        this.plugin.settings = newSettings;
        await this.populateNotes();
    }

    updateDynamicPadding() {
        if (Platform.isMobile) return; // Don't run this logic on mobile

        const statusBar = document.querySelector('.status-bar');
        const contentWrapper = this.containerEl.querySelector('.cpwn-tabs-content-wrapper');

        if (statusBar && contentWrapper) {
            const statusBarHeight = statusBar.offsetHeight;
            contentWrapper.classList.add('cpwn-container-with-statusbar');
            contentWrapper.style.setProperty('--status-bar-height', `${statusBarHeight}px`);

        }
    }

    renderTaskSummaryWidget(parent, title, incompleteTasks, completedTasks, overdueTasks = [], inProgressTasks = [], noDueTasks = [], widgetKey) {

        const widgetContainer = parent.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-widget-small is-summary-widget' });

        let showTitle;
        if (typeof this.plugin.settings.overrideShowTitle === 'boolean') {
            showTitle = this.plugin.settingsoverrideShowTitle;

        } else if (typeof this.plugin.settings.showTaskWidgetTitles === 'boolean') {
            showTitle = this.plugin.settings.showTaskWidgetTitles;

        } else {
            showTitle = true; // default fallback
        }

        let showChevron;
        if (typeof this.plugin.settings.overrideShowChevron === 'boolean') {
            showChevron = this.plugin.settings.overrideShowChevron;

        } else if (typeof this.plugin.settings.showTaskWidgetChevrons === 'boolean') {
            showChevron = this.plugin.settings.showTaskWidgetChevrons;
        } else {
            showChevron = true; // default fallback
        }

        // --- State Management ---
        const states = ['full', 'mini'];
        let currentState = this.plugin.settings.smallWidgetStates[widgetKey] || 'full';

        // --- UI Elements ---
        const header = widgetContainer.createDiv({ cls: 'cpwn-pm-widget-header' });

        let toggleIcon = '';

        if (showChevron) {
            toggleIcon = header.createDiv({ cls: 'cpwn-summary-toggle-icon' });
        }
        if (showTitle) {
            const titleEl = header.createEl('h3', { text: title });
        }

        // --- Core Rendering Logic ---
        const totalTasks = (incompleteTasks?.length || 0) + (completedTasks?.length || 0) + (overdueTasks?.length || 0) + (inProgressTasks?.length || 0) + (noDueTasks?.length || 0);
        const isEmpty = totalTasks === 0;

        // --- UI Update and Click Handlers ---
        const updateView = () => {
            widgetContainer.removeClasses(['cpwn-is-full', 'cpwn-is-mini']);
            widgetContainer.addClass(`cpwn-is-${currentState}`);

            if (showChevron) {
                setIcon(toggleIcon, 'chevron-down');
            }
            if (isEmpty && currentState === 'full') {
                widgetContainer.addClass('cpwn-widget-empty-full');
            } else {
                widgetContainer.removeClass('cpwn-widget-empty-full');
            }
        };

        if (isEmpty) {
            widgetContainer.createDiv({ text: 'No tasks in this period.', cls: 'cpwn-task-group-empty-message' });
        } else {
            const barAndLegendWrapper = widgetContainer.createDiv({ cls: 'bar-and-cpwn-legend-wrapper' });
            const progressBar = barAndLegendWrapper.createDiv({ cls: 'cpwn-pm-progress-bar' });
            const legend = barAndLegendWrapper.createDiv({ cls: 'cpwn-pm-progress-legend' });

            // --- setupSegment function ---
            const setupSegment = (tasks, type) => {
                if (!tasks || tasks.length === 0) return;

                const segment = progressBar.createDiv({
                    cls: `cpwn-pm-progress-segment ${type}`,
                    text: tasks.length,
                });
                segment.classList.add('cpwn-pm-progress-segment');
                segment.style.setProperty('--cpwn-segment-width', `${(tasks.length / totalTasks) * 100}%`);
                segment.addClass('is-interactive');

                let bgColor = '';
                switch (type) {
                    case 'overdue':
                        bgColor = this.plugin.settings.taskStatusColorOverdue;
                        break;
                    case 'in-progress':
                        bgColor = this.plugin.settings.taskStatusColorInProgress;
                        break;
                    case 'incomplete':
                        bgColor = this.plugin.settings.taskStatusColorOpen;
                        break;
                    case 'completed':
                        bgColor = this.plugin.settings.taskStatusColorCompleted;
                        break;
                    case 'no-due':
                        bgColor = 'rgba(158, 158, 158, 0.5)';
                        break;
                }
                if (bgColor) {
                    segment.style.backgroundColor = bgColor;
                }

                // Your mouseenter logic, unchanged
                segment.addEventListener('mouseenter', () => {
                    if (this.isPopupLocked) return;
                    window.clearTimeout(this.hideTimeout);
                    this.hideFilePopup();

                    const isCompleted = type === 'completed';
                    const isOverdue = type === 'overdue';
                    const isInProgress = type === 'in-progress';
                    const isNoDue = type === 'no-due';

                    let popupTitleText = 'To do';
                    if (isCompleted) {
                        popupTitleText = 'Done';
                    } else if (isOverdue) {
                        popupTitleText = 'Overdue';
                    } else if (isInProgress) {
                        popupTitleText = 'In progress';
                    } else if (isNoDue) {
                        popupTitleText = 'No due date';
                    } else if (widgetKey === 'futureNoDue' && type === 'incomplete') {
                        popupTitleText = 'Future';
                    }

                    const popupTitle = `${title} - ${popupTitleText}`;
                    this.hoverTimeout = window.setTimeout(() => {
                        this.showFilePopup(segment, { tasks: tasks }, popupTitle);
                    }, this.plugin.settings.otherNoteHoverDelay);
                });

                segment.addEventListener('mouseleave', () => {
                    window.clearTimeout(this.hoverTimeout);
                    this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                });

                let legendText = 'To do';
                if (widgetKey === 'futureNoDue' && type === 'incomplete') {
                    legendText = 'Future';
                } else if (type === 'completed') {
                    legendText = 'Done';
                } else if (type === 'overdue') {
                    legendText = 'Overdue';
                } else if (type === 'in-progress') {
                    legendText = 'In progress';
                } else if (type === 'no-due') {
                    legendText = 'No due date';
                }

                const legendItem = legend.createDiv({ cls: 'cpwn-legend-item' });
                // This sets the legend box color via CSS, but the new logic above sets the bar color
                const legendColorBox = legendItem.createDiv({ cls: `cpwn-legend-color-box ${type}` });
                if (bgColor) {
                    legendColorBox.style.backgroundColor = bgColor;
                }
                legendItem.createSpan({ text: legendText });
            };

            // Render segments in the correct visual order (MODIFIED)
            setupSegment(overdueTasks, 'overdue');
            setupSegment(incompleteTasks, 'incomplete');
            setupSegment(inProgressTasks, 'in-progress');
            setupSegment(noDueTasks, 'no-due');
            setupSegment(completedTasks, 'completed');
        }

        header.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();

            currentState = currentState === 'full' ? 'mini' : 'full';
            this.plugin.settings.smallWidgetStates[widgetKey] = currentState;
            await this.plugin.saveSettings();

            // Update the UI - remove old classes first
            widgetContainer.removeClass('cpwn-is-full', 'cpwn-is-mini');
            widgetContainer.addClass(`cpwn-is-${currentState}`);
            if (showChevron) {
                setIcon(toggleIcon, 'chevron-down');

            }
            // Handle the empty state styling
            if (isEmpty && currentState === 'full') {
                widgetContainer.addClass('cpwn-widget-empty-full');
            } else {
                widgetContainer.removeClass('cpwn-widget-empty-full');
            }
        });

        updateView();
    }

    getComputedCssVar(varName) {
        return getComputedStyle(this.containerEl).getPropertyValue(varName).trim();
    }

    /**
     * Renders a single, generalized heatmap widget for the dashboard.
     * @param {HTMLElement} parentContainer The parent element to append this widget to.
     * @param {string} title The title to display for the widget.
     * @param {Map<string, TFile[]>} dataMap A map where keys are 'YYYY-MM-DD' strings and values are arrays of files.
     * @param {string | string[]} colorSource The color(s) to use. Can be a single color string or an array of 4 color strings for a gradient.
     */
    async populateSingleHeatmapWidget(widgetContainer, title, dataMap, colorSource, options = {}, widgetKey) {

        if (!widgetKey) {
            console.error("Heatmap widget rendered without a widgetKey:", title);
            return;
        }

        let showTitle;
        if (typeof this.plugin.settings.overrideShowTitle === 'boolean') {
            showTitle = this.plugin.settingsoverrideShowTitle;

        } else if (typeof this.plugin.settings.showTaskWidgetTitles === 'boolean') {
            showTitle = this.plugin.settings.showTaskWidgetTitles;

        } else {
            showTitle = true; // default fallback
        }

        let showChevron;
        if (typeof this.plugin.settings.overrideShowChevron === 'boolean') {
            showChevron = this.plugin.settings.overrideShowChevron;

        } else if (typeof this.plugin.settings.showTaskWidgetChevrons === 'boolean') {
            showChevron = this.plugin.settings.showTaskWidgetChevrons;
        } else {
            showChevron = true; // default fallback
        }

        widgetContainer.empty();

        const isCollapsed = this.plugin.settings.collapsedHeatmaps[widgetKey] === true;
        if (isCollapsed) {
            widgetContainer.addClass('cpwn-is-collapsed');
        }

        let totalCount = 0;
        for (const files of dataMap.values()) {
            totalCount += files.length;
        }

        const header = widgetContainer.createDiv({ cls: 'cpwn-pm-widget-header' });

        // 1. Collapse Icon
        let collapseIcon = '';

        if (showChevron) {
            collapseIcon = header.createDiv({ cls: 'cpwn-heatmap-collapse-icon' });
            setIcon(collapseIcon, 'chevron-down');
        }

        let titleEl = '';
        // 2. Clickable Title
        if (showTitle) {
            titleEl = header.createEl('h3', { text: title });

            // 3. Total Count (moves to the end)
            const totalCountEl = header.createDiv({
                cls: 'cpwn-heatmap-total-count',
                text: totalCount.toString()
            });

            let linkPath = '';
            // Check if it's a custom heatmap
            if (widgetKey.startsWith('custom-')) {
                const index = parseInt(widgetKey.split('-')[1], 10);
                if (!isNaN(index)) {
                    linkPath = this.plugin.settings.customHeatmaps[index]?.linkPath;
                }
            } else {
                // Otherwise, it's a built-in heatmap
                linkPath = this.plugin.settings.heatmapLinkConfig[widgetKey];
            }

            if (linkPath) {
                totalCountEl.addClass('is-clickable');
                totalCountEl.setAttribute('aria-label', `Open note: ${linkPath}`);

                totalCountEl.addEventListener('click', async (event) => {
                    event.stopPropagation();

                    const file = this.app.vault.getAbstractFileByPath(linkPath);
                    if (file && file instanceof TFile) {
                        const openInNew = this.plugin.settings.heatmapTotalClickOpenAction === 'new-tab';
                        const leaf = this.app.workspace.getLeaf(event.shiftKey || openInNew);
                        await leaf.openFile(file);
                    } else {
                        new Notice(`Note not found: ${linkPath}`);
                    }
                });
            }
        }

        const heatmapContainer = widgetContainer.createDiv({ cls: 'cpwn-heatmap-container' });

        // Toggle collapse state
        if (showChevron) {
            collapseIcon.addEventListener('click', async () => {
                const currentlyCollapsed = widgetContainer.classList.toggle('cpwn-is-collapsed');
                this.plugin.settings.collapsedHeatmaps[widgetKey] = currentlyCollapsed;
                await this.plugin.saveSettings();
                if (!currentlyCollapsed) {
                    window.setTimeout(() => {
                        const todayCell = heatmapContainer.querySelector('.cpwn-heatmap-today-cell');
                        if (todayCell) {
                            const scrollPos = todayCell.offsetLeft - (heatmapContainer.offsetWidth / 2) + (todayCell.offsetWidth / 2);
                            heatmapContainer.scrollLeft = scrollPos;
                        }
                    }, 50);
                }
            });
        }

        if (showTitle) {
            // Scroll to today
            titleEl.addEventListener('click', () => {
                const todayCell = heatmapContainer.querySelector('.cpwn-heatmap-today-cell');
                if (todayCell) {
                    const scrollPos = todayCell.offsetLeft - (heatmapContainer.offsetWidth / 2) + (todayCell.offsetWidth / 2);
                    heatmapContainer.scrollLeft = scrollPos;
                }
            });
        }

        const dayLabelsContainer = heatmapContainer.createDiv({ cls: 'cpwn-heatmap-day-labels' });
        const grid = heatmapContainer.createDiv({ cls: 'cpwn-heatmap-grid' });
        let currentHoveredCell = null;
        const today = moment();
        const weekStartsOnMonday = this.plugin.settings.weekStartDay === 'monday';

        const dayLabels = weekStartsOnMonday ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const todayDayIndex = weekStartsOnMonday ? (today.day() + 6) % 7 : today.day();

        dayLabels.forEach((day, index) => {
            const label = dayLabelsContainer.createSpan({ text: day });
            if (index === todayDayIndex) {
                label.addClass('cpwn-heatmap-today-label');
            }
        });

        const endDate = options.endDate || today.clone().endOf('month');
        const startDate = options.startDate || today.clone().subtract(11, 'months').startOf('month');
        const startDayOfWeek = startDate.day();
        const weekStartOffset = weekStartsOnMonday ? (startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek) : -startDayOfWeek;

        startDate.add(weekStartOffset, 'days');

        let currentDay = startDate.clone();
        let colIndex = 1;
        const seenMonths = new Set();

        while (currentDay.isSameOrBefore(endDate, 'day')) {
            const dayOfWeek = weekStartsOnMonday ? (currentDay.weekday() + 6) % 7 : currentDay.weekday();
            const cellDate = currentDay.clone();

            const mapKey = `${cellDate.year()}-${cellDate.month()}`;
            if (!seenMonths.has(mapKey)) {

                if (cellDate.date() === 1) {
                    seenMonths.add(mapKey);

                    let labelCol = colIndex + 1;

                    const monthLabelId = `cpwn-heatmap-month-${widgetKey}-${cellDate.format('YYYY-MM')}`;
                    const monthLabelContainer = grid.createDiv({ cls: 'cpwn-heatmap-month-label-container' });
                    monthLabelContainer.id = monthLabelId;

                    const today = moment();
                    if (cellDate.isSame(today, 'month')) {
                        monthLabelContainer.addClass('cpwn-heatmap-current-month-label');
                    }

                    monthLabelContainer.createSpan({
                        cls: 'cpwn-heatmap-month-prefix',
                        text: cellDate.format('MMM')
                    });

                    monthLabelContainer.createSpan({ cls: 'cpwn-heatmap-date-suffix' });

                    monthLabelContainer.style.gridRow = '1';
                    monthLabelContainer.style.gridColumn = labelCol;

                }
            }

            const cell = grid.createDiv({ cls: 'cpwn-heatmap-cell' });

            cell.dataset.date = cellDate.format('YYYY-MM-DD');
            cell.dataset.monthLabelId = `cpwn-heatmap-month-${widgetKey}-${cellDate.format('YYYY-MM')}`;


            const weekType = weekStartsOnMonday ? 'isoWeek' : 'week';
            const startOfThisWeek = today.clone().startOf(weekType);
            const endOfThisWeek = today.clone().endOf(weekType);

            if (cellDate.isBetween(startOfThisWeek, endOfThisWeek, 'day', '[]')) {
                cell.addClass('cpwn-heatmap-current-week-cell');
            }
            if (cellDate.isSame(today, 'day')) {
                cell.addClass('cpwn-heatmap-today-cell');
            }

            cell.style.gridColumn = `${colIndex}`;
            cell.style.gridRow = `${dayOfWeek + 2}`;

            const dateKey = cellDate.format('YYYY-MM-DD');
            const filesOnDay = dataMap.get(dateKey);
            const count = filesOnDay ? filesOnDay.length : 0;

            if (count > 0) {
                let countForColor = count; // Default to total count
                let colorGradient = colorSource; // Default to provided gradient

                // Check if this is the special overdue/upcoming widget
                if (options.overdueMap && options.upcomingMap) {
                    const overdueTasksOnDay = options.overdueMap.get(dateKey);
                    if (overdueTasksOnDay && overdueTasksOnDay.length > 0) {
                        countForColor = overdueTasksOnDay.length;
                        colorGradient = options.overdueGradient; // Use red gradient
                    } else {
                        const upcomingTasksOnDay = options.upcomingMap.get(dateKey);
                        countForColor = upcomingTasksOnDay ? upcomingTasksOnDay.length : 0;
                        // Keep default blue gradient
                    }
                }
                // For all other heatmaps (like Task Completion), countForColor is already set to `count`
                if (countForColor > 0) {
                    let finalColor = 'transparent';
                    if (Array.isArray(colorGradient) && colorGradient.length > 0) {
                        let level;
                        if (countForColor >= 10) level = 4;
                        else if (countForColor >= 6) level = 3;
                        else if (countForColor >= 3) level = 2;
                        else level = 1;
                        finalColor = colorGradient[level - 1] || colorGradient[colorGradient.length - 1];
                    }
                    cell.style.setProperty('background-color', finalColor, 'important');
                }

                cell.addClass('is-interactive');



                cell.addEventListener('mouseenter', (event) => {
                    if (this.isPopupLocked) return;
                    window.clearTimeout(this.hideTimeout);
                    this.hideFilePopup();

                    this.hoverTimeout = window.setTimeout(() => {
                        const itemsOnDay = dataMap.get(dateKey) || [];
                        if (itemsOnDay.length === 0) return;

                        let popupData = {};

                        // This checks for the 'description' property which we now know exists on the task object.
                        if (itemsOnDay[0].description !== undefined) {

                            // 1. Get unique file paths from the tasks.
                            const filePaths = [...new Set(itemsOnDay.map(task => task.path))];

                            // 2. Convert paths to TFile objects.
                            const filesOnDay = filePaths.map(path => this.app.vault.getAbstractFileByPath(path)).filter(file => file instanceof TFile);

                            // 3. Categorize the files.
                            const dailyNotes = [];
                            const createdNotes = [];
                            const modifiedNotes = [];
                            const assets = [];

                            filesOnDay.forEach(file => {
                                if (this.isDailyNote(file)) {
                                    dailyNotes.push(file);
                                } else if (file.path && file.path.toLowerCase().endsWith('.md')) {
                                    createdNotes.push(file);
                                } else {
                                    assets.push(file);
                                }
                            });

                            // 4. Construct the full data object for the popup.
                            popupData = {
                                tasks: itemsOnDay,
                                daily: dailyNotes,
                                created: createdNotes,
                                modified: modifiedNotes,
                                assets: assets
                            };

                        } else {
                            // This is a FILE heatmap.
                            const dailyNotes = [];
                            const createdNotes = [];
                            const modifiedNotes = [];
                            const assets = [];

                            itemsOnDay.forEach(file => {
                                if (this.isDailyNote(file)) {
                                    dailyNotes.push(file);
                                } else if (file.path && file.path.toLowerCase().endsWith('.md')) {
                                    createdNotes.push(file);
                                } else {
                                    assets.push(file);
                                }
                            });

                            popupData = {
                                daily: dailyNotes,
                                created: createdNotes,
                                modified: modifiedNotes,
                                assets: assets
                            };
                        }

                        this.showFilePopup(cell, popupData, cellDate.toDate());
                    }, this.plugin.settings.otherNoteHoverDelay);
                });

                cell.addEventListener('mouseleave', () => {
                    window.clearTimeout(this.hoverTimeout);
                    this.hideTimeout = window.setTimeout(() => {
                        this.hideFilePopup();
                    }, this.plugin.settings.popupHideDelay);
                });
            }

            if (dayOfWeek === 6) {
                colIndex++;
            }
            currentDay.add(1, 'day');
        }

        grid.addEventListener('mouseover', (event) => {
            const cell = event.target.closest('.cpwn-heatmap-cell');

            // If we are already on a cell, and move to another, remove the old highlight
            if (currentHoveredCell && currentHoveredCell !== cell) {
                currentHoveredCell.classList.remove('is-hovered');
            }

            if (cell && cell.dataset.date) {
                // Add highlight to the new cell
                cell.classList.add('is-hovered');
                currentHoveredCell = cell;

                // --- Update Month Label Logic (as before, but now more robust) ---
                const activeSuffix = grid.querySelector('.cpwn-heatmap-date-suffix.is-active');
                if (activeSuffix) {
                    activeSuffix.setText('');
                    activeSuffix.classList.remove('is-active');
                }

                const monthLabelId = cell.dataset.monthLabelId;
                const monthLabelContainer = document.getElementById(monthLabelId);

                if (monthLabelContainer) {
                    const dateSuffixEl = monthLabelContainer.querySelector('.cpwn-heatmap-date-suffix');
                    if (dateSuffixEl) {
                        const dateText = moment(cell.dataset.date).format('Do'); // e.g., "1st", "23rd"
                        dateSuffixEl.setText(dateText);
                        dateSuffixEl.classList.add('is-active');
                    }
                }
            }
        });

        grid.addEventListener('mouseleave', () => {
            // When the mouse leaves the entire grid, clear everything
            if (currentHoveredCell) {
                currentHoveredCell.classList.remove('is-hovered');
                currentHoveredCell = null;
            }

            const activeSuffix = grid.querySelector('.cpwn-heatmap-date-suffix.is-active');
            if (activeSuffix) {
                activeSuffix.setText('');
                activeSuffix.classList.remove('is-active');
            }
        });

        window.setTimeout(() => {
            const todayCell = grid.querySelector('.cpwn-heatmap-today-cell');
            if (todayCell) {
                const scrollPos = todayCell.offsetLeft - (heatmapContainer.offsetWidth / 2) + (todayCell.offsetWidth / 2);
                heatmapContainer.scrollLeft = scrollPos;
            } else {
                heatmapContainer.scrollLeft = heatmapContainer.scrollWidth;
            }
        }, 100);
    }

    setupReorderMode() {
        const isMac = Platform.isMacOS;
        const modifierKeyName = isMac ? "Option" : "Ctrl";

        const handleKeyDown = (e) => {
            // Use Alt key (Option on Mac) or Ctrl key (Control on Windows)
            const isModifierPressed = isMac ? e.altKey : e.ctrlKey;

            // Only activate if we're in pinned notes view AND custom sort is selected
            if (isModifierPressed && !this.isReorderModeActive && this.notesViewMode === 'pinned' && this.pinnedSortOrder === 'custom') {
                this.isReorderModeActive = true;
                this.populateNotes(); // Re-render to show handles
                //new Notice(`Reorder mode active: Hold ${modifierKeyName} and drag to rearrange.`);
            } else if (isModifierPressed && this.notesViewMode === 'pinned' && this.pinnedSortOrder !== 'custom') {
                // Show a message if the user tries to activate reorder mode when not in custom sort
                //new Notice('Switch to "Custom" sort order to enable drag-and-drop reordering.');
            }
        };

        const handleKeyUp = (e) => {
            const wasModifierReleased = isMac ? !e.altKey : !e.ctrlKey;

            if (wasModifierReleased && this.isReorderModeActive) {
                this.isReorderModeActive = false;
                this.populateNotes();
            }
        };

        // Register the listeners using Obsidian's API for proper cleanup
        this.registerDomEvent(document, 'keydown', handleKeyDown);
        this.registerDomEvent(document, 'keyup', handleKeyUp);
    }

    /**
    * Navigates the calendar to the current month with a smooth scroll animation
    * in the vertical view. It forces a re-render to ensure the target element
    * exists before scrolling.
    */
    async goToCurrentMonth() {
        const now = new Date();
        const currentMonthId = `cpwn-month-${now.getFullYear()}-${now.getMonth()}`;
        const currentMonthEl = this.verticalScrollerEl?.querySelector(`#${currentMonthId}`);

        if (this.isVerticalView) {
            // Check if the current month is visible in the viewport.
            const isCurrentMonthVisible = this.isElementInViewport(currentMonthEl);

            if (isCurrentMonthVisible) {
                // If visible, TOGGLE popup lock. This is the ONLY action.
                this.isPopupLocked = !this.isPopupLocked;
                this.todayBtn.classList.toggle('cpwn-popup-locked', this.isPopupLocked);
                this.updateTodayBtnAriaLabel();
            } else {
                // If NOT visible, NAVIGATE. This is the ONLY action.
                if (currentMonthEl) {
                    currentMonthEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // Fallback for very distant months: re-render and then scroll.
                    this.displayedMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const popupState = this.isPopupLocked;
                    await this.render(); // Re-render to bring the month into the DOM
                    this.isPopupLocked = popupState; // Restore state
                    this.todayBtn.classList.toggle('cpwn-popup-locked', this.isPopupLocked);
                    this.updateTodayBtnAriaLabel();
                    window.setTimeout(() => {
                        const newCurrentMonthEl = this.verticalScrollerEl?.querySelector(`#${currentMonthId}`);
                        if (newCurrentMonthEl) {
                            newCurrentMonthEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            }
        } else {
            // Horizontal view logic remains unchanged.
            const isAlreadyCurrentMonth = moment(this.displayedMonth).isSame(now, 'month');
            if (isAlreadyCurrentMonth) {
                this.isPopupLocked = !this.isPopupLocked;
                this.todayBtn.classList.toggle('cpwn-popup-locked', this.isPopupLocked);
                this.updateTodayBtnAriaLabel();
            } else {
                await this.changeMonth(0, true);
            }
        }
    }

    /**
     * Applies font size settings as CSS variables to the view's root element,
     * allowing all CSS rules to update dynamically.
     */
    applyFontSettings() {
        if (!this.containerEl) return;

        // Get values from settings, providing default fallbacks.
        const labelFontSize = this.plugin.settings.fontSize || '12px';
        const dayNumberFontSize = this.plugin.settings.dayNumberFontSize || '15px';

        // Set the CSS variables on the main container element for this view.
        this.containerEl.style.setProperty('--cpwn-calendar-label-font-size', labelFontSize);
        this.containerEl.style.setProperty('--cpwn-calendar-day-number-font-size', dayNumberFontSize);
    }

    async handleFileClick(file, event, navState = {}) {
        if (!file) return;

        // This logic correctly determines if a new tab should be opened based on your settings.
        const isAsset = file.extension.toLowerCase() !== 'md';
        const openInNewTabSetting = isAsset
            ? this.plugin.settings.assetsOpenAction === 'new-tab'
            : this.plugin.settings.notesOpenAction === 'new-tab';

        const forceNewLeaf = event.shiftKey || openInNewTabSetting;

        // The sourcePath MUST be the path of the file containing the link.
        const sourcePath = file.path;

        // The API requires the line number to be inside an 'eState' object.
        const openViewState = {};
        if (navState && navState.line !== undefined) {
            openViewState.eState = {
                line: navState.line,
                // 'active: true' ensures the new pane is focused, which is
                // necessary for scrolling and highlighting to occur.
                active: true
            };
        }

        // This API call now has the correct source path and the correct state structure.
        await this.app.workspace.openLinkText(
            file.path,
            sourcePath,
            forceNewLeaf,
            openViewState
        );
    }


    /**
     * Renders a single note item row in a given container.
     * @param {TFile} file The note file to render.
     * @param {HTMLElement} container The parent element to append the row to.
     */
    renderNoteItem(file, container) {
        const settings = this.plugin.settings;
        const searchInputEl = this.notesSearchInputEl;

        const row = container.createDiv({ cls: 'cpwn-note-row' });
        row.dataset.filePath = file.path;

        // --- Mousedown flag for better drag-hover detection ---
        row.addEventListener('mousedown', () => {
            this.isMouseDown = true;
            this.hideFilePopup(); // Immediately hide any visible popup
        });

        // --- Drag-and-Drop Logic for Pinned Notes (Preserved) ---
        const isReorderable = this.notesViewMode === 'pinned' && this.pinnedSortOrder === 'custom';

        if (isReorderable && this.isReorderModeActive) {
            row.draggable = true;
            const dragHandle = row.createDiv({ cls: 'cpwn-drag-handle' });
            setIcon(dragHandle, 'grip-vertical');

            row.addEventListener('dragstart', (e) => {
                this.isDraggingNote = true;
                e.dataTransfer.setData('text/plain', file.path);
                e.dataTransfer.effectAllowed = 'move';
                window.setTimeout(() => row.addClass('dragging'), 0);
            });

            row.addEventListener('dragend', async () => {
                row.removeClass('dragging');
                this.isDraggingNote = false;
                await this.savePinnedOrder(container);
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dragging = container.querySelector('.dragging');
                if (dragging && dragging !== row) {
                    const rect = row.getBoundingClientRect();
                    const isAfter = e.clientY > rect.top + rect.height / 2;
                    row.parentNode.insertBefore(dragging, isAfter ? row.nextSibling : row);
                }
            });
        } else {
            row.draggable = false;
        }

        // --- Build Row Visual Content (Preserved) ---
        const titleWrapper = row.createDiv({ cls: 'cpwn-note-title-wrapper' });

        if (settings.showNoteStatusDots) {
            const dot = titleWrapper.createDiv({ cls: 'cpwn-note-status-dot' });
            if (this.isDailyNote(file)) {
                dot.classList.add('cpwn-daily-note-dot');
                dot.style.setProperty('--daily-note-color', settings.dailyNoteDotColor);
            } else if (this.isWeeklyNote(file)) {
                dot.classList.add('cpwn-weekly-note-dot');
                dot.style.setProperty('--weekly-note-color', settings.weeklyNoteDotColor);

            } else {
                dot.addClass(isSameDay(new Date(file.stat.ctime), new Date(file.stat.mtime)) ? 'cpwn-note-status-dot-created' : 'cpwn-note-status-dot-modified');
            }
        }

        const titlePathWrapper = titleWrapper.createDiv({ cls: 'cpwn-note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: file.basename, cls: 'cpwn-note-title' });
        if (file.parent && file.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: file.parent.path, cls: 'cpwn-note-path' });
        }

        row.createDiv({ text: formatDate(new Date(file.stat.mtime), 'DD-MM-YYYY'), cls: 'note-mod-date' });

        // --- APPLY UNIFIED EVENT HANDLER ---
        // This single call correctly handles popups and clicks for both desktop and mobile,
        // including the special long-press behavior for reorderable pinned notes.
        this.applyPopupTrigger(row, file, 'note');

        // --- Keyboard Navigation ---
        this.addKeydownListeners(row, searchInputEl);

        return row;
    }

    async savePinnedOrder(container) {

        const noteRows = container.querySelectorAll('.cpwn-note-row');
        const newOrder = Array.from(noteRows).map(row => row.dataset.filePath);

        // Update the settings with the new order
        this.plugin.settings.pinnedNotesCustomOrder = newOrder;

        // Set the active sort mode to 'custom' since a manual sort just happened
        this.pinnedSortOrder = 'custom';

        await this.plugin.saveSettings();

        // Refresh the view to ensure the header's sort indicator is updated
        await this.populateNotes();
    }

    /**
     * Formats a list of calendar events into a markdown string for template insertion.
     * @param {-} events 
     * @returns 
     */
    formatEventsForTemplate(events) {
        if (!events || events.length === 0) {
            return "";
        }

        // Retrieve the user-defined format from settings
        const formatString = this.plugin.settings.calendarEventsFormat || '- {{startTime}} - {{endTime}}: {{summary}}';

        // Sort events
        events.sort((a, b) => {
            if (a.isAllDay && !b.isAllDay) return -1;
            if (!a.isAllDay && b.isAllDay) return 1;
            if (a.isAllDay && b.isAllDay) return a.summary.localeCompare(b.summary);
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
        });

        // Map each event to its formatted string
        const eventStrings = events.map(event => {
            let finalString;

            if (event.isAllDay) {
                // For all-day events, replace the time placeholders with "All-day"
                // This regex looks for {{startTime}}, optional whitespace, a separator, optional whitespace, and {{endTime}}
                const timePlaceholderRegex = /{{\s*startTime\s*}}.*{{\s*endTime\s*}}/;

                finalString = formatString.replace(timePlaceholderRegex, 'All-day');

                // Now, replace the summary as usual
                finalString = finalString.replace(/{{summary}}/g, event.summary || '');

            } else {
                // For timed events, use the original logic
                const startTime = event.startTime || '';
                const endTime = event.endTime || '';

                finalString = formatString
                    .replace(/{{startTime}}/g, startTime)
                    .replace(/{{endTime}}/g, endTime)
                    .replace(/{{summary}}/g, event.summary || '');
            }

            // Trim any leftover whitespace or dangling separators
            return finalString.replace(/\s*:\s*$/, '').replace(/\s*-\s*$/, '').trim();
        });

        // Join the array of event strings with a double newline
        const eventBody = eventStrings.join('\n\n');

        // Construct the final output
        return eventBody;
    }

    /**
     * Schedules a refresh to occur at the next midnight.
     */
    scheduleDailyRefresh() {
        // Clear any existing timer to avoid duplicates
        if (this.dailyRefreshTimeout) {
            window.clearTimeout(this.dailyRefreshTimeout);
        }

        const now = moment();
        const endOfDay = moment().endOf('day');
        // Calculate milliseconds until the end of today, plus one to tick over to the new day
        const msUntilMidnight = endOfDay.diff(now) + 1;

        this.dailyRefreshTimeout = window.setTimeout(async () => {

            // Re-calculate all task due dates relative to the new "today"
            await this.buildTasksByDateMap();

            // Re-render the calendar to update heatmaps, badges, and today's highlight
            this.renderCalendar();

            // If the user is currently looking at the tasks tab, refresh its view
            if (this.activeTab === 'tasks') {
                await this.populateTasks();
            }

            // IMPORTANT: Schedule the next refresh for the following day
            this.scheduleDailyRefresh();

        }, msUntilMidnight);
    }

    getViewType() { return VIEW_TYPE_PERIOD; }
    //getDisplayText() { return "📅 Calendar period week notes"; }
    //removed the emoji from display text
    getDisplayText() { return "Calendar period week notes"; }
    getIcon() { return "calendar-check"; }

    async buildWeeklyNotesCache() {
        if (!this.plugin.settings.enableWeeklyNotes) return;
        this.existingWeeklyNotes.clear();
        const folderPath = this.plugin.settings.weeklyNoteFolder;
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (folder instanceof TFolder) {
            for (const file of folder.children) {
                if (file instanceof TFile && file.extension === 'md') {
                    this.existingWeeklyNotes.add(file.path);
                }
            }
        }
    }

    async refreshIcsEvents() {
        const { requestUrl, Notice } = require("obsidian");

        if (!ICAL) {
            console.error("ical.js library not bundled correctly.");
            return;
        }

        this.icsEventsByDate.clear();
        this.processedEventSignatures.clear();

        const icsUrl = this.plugin.settings.icsUrl;
        if (!icsUrl) {
            if (this.isCalendarRendered) {
                this.renderCalendar();
            }
            return;
        }

        try {
            const response = await requestUrl({ url: icsUrl });
            const icalData = response.text;
            const calendar = new ICAL.Component(ICAL.parse(icalData));

            const icalEndDate = ICAL.Time.fromJSDate(moment().add(2, 'years').toDate());
            const icalStartDate = ICAL.Time.fromJSDate(moment().subtract(1, 'year').toDate());

            const events = calendar.getAllSubcomponents('vevent');
            for (const vevent of events) {
                const event = new ICAL.Event(vevent);

                if (!event) {
                    continue;
                }

                if (event.recurrenceId) {
                    this.addParsedEvent(event, false);
                } else if (event.isRecurring()) {
                    const iterator = event.iterator();
                    let next;
                    while (next = iterator.next()) {
                        if (next.compare(icalEndDate) > 0) break;
                        if (next.compare(icalStartDate) < 0) continue;

                        const occurrence = event.getOccurrenceDetails(next);
                        this.addParsedEvent(occurrence, true);
                    }
                } else {
                    this.addParsedEvent(event, false);
                }
            }
        } catch (error) {
            new Notice('Calendar period week notes - ICS error: ' + error.message, 10000);
            console.error("A detailed ICS parsing error occurred:", error);
        }

        if (this.isCalendarRendered) {
            this.renderCalendar();
        }
    }


    /**
     *  Adds a parsed ICAL event occurrence to the events map, handling de-duplication.
     *  This method uses a hybrid approach to de-duplication:
     *  - For recurring instances, it uses a combination of UID and recurrenceId.
     *  - For single events, it uses a content-based signature (summary, start, end).   
     * 
     * @param {*} occurrence 
     * @param {*} isRecurringInstance 
     * @returns 
     */
    addParsedEvent(occurrence, isRecurringInstance) {
        const item = isRecurringInstance ? occurrence.item : occurrence;

        if (!item) return;

        if (isRecurringInstance) {
            // For recurring instances, the UID is the UID of the parent event, and the
            // recurrenceId makes it unique. We create a signature from both.
            const recurrenceSignature = `${item.uid}:${occurrence.recurrenceId.toString()}`;
            if (this.processedEventSignatures.has(recurrenceSignature)) {
                return; // Skip duplicate recurring instance
            }
            this.processedEventSignatures.add(recurrenceSignature);
        } else {
            const singleEventSignature = `${item.summary}:${item.startDate.toString()}:${item.endDate.toString()}`;
            if (this.processedEventSignatures.has(singleEventSignature)) {
                return; // Skip duplicate single event
            }
            this.processedEventSignatures.add(singleEventSignature);
        }

        const startMoment = moment(occurrence.startDate ? occurrence.startDate.toJSDate() : item.startDate.toJSDate());
        const endMoment = moment(occurrence.endDate ? occurrence.endDate.toJSDate() : item.endDate.toJSDate());

        const isAllDay = item.startDate.isDate;
        if (isAllDay) {
            endMoment.subtract(1, 'second');
        }

        const eventData = {
            uid: item.uid,
            summary: item.summary,
            isAllDay: isAllDay,
            startTime: isAllDay ? null : startMoment.format('HH:mm'),
            endTime: isAllDay ? null : endMoment.format('HH:mm')
        };

        // Create a clone of the end date to avoid modifying the original.
        const loopEndDate = endMoment.clone();

        // If the event ends exactly at midnight, subtract one second for loop boundary calculations.
        // This prevents the event from "leaking" into the next day.
        if (!isAllDay && loopEndDate.hour() === 0 && loopEndDate.minute() === 0 && loopEndDate.second() === 0) {
            loopEndDate.subtract(1, 'second');
        }

        let currentDay = startMoment.clone().startOf('day');
        // Use the adjusted loopEndDate for the condition.
        while (currentDay.isSameOrBefore(loopEndDate.startOf('day'))) {
            const dateKey = currentDay.format('YYYY-MM-DD');
            if (!this.icsEventsByDate.has(dateKey)) {
                this.icsEventsByDate.set(dateKey, []);
            }
            // Final simple check to prevent adding the exact same object twice in the loop
            if (!this.icsEventsByDate.get(dateKey).some(e => e.uid === eventData.uid && e.summary === eventData.summary)) {
                this.icsEventsByDate.get(dateKey).push(eventData);
            }
            currentDay.add(1, 'day');
        }
    }

    async openWeeklyNote(dateInfo) {
        // --- Start of Debugging ---
        if (!dateInfo || typeof dateInfo.year === 'undefined') {
            console.error("Weekly Note Error: Invalid dateInfo object received.", dateInfo);
            new Notice("Could not create weekly note due to an internal error. Check console for details.");
            return;
        }
        // --- End of Debugging ---

        if (!this.plugin.settings.enableWeeklyNotes) return;

        const { weeklyNoteFolder, weeklyNoteTemplate, weeklyNoteFormat } = this.plugin.settings;

        // 1. Calculate all possible placeholder values from the data object
        const pweek = ((dateInfo.weekSinceStart - 1) % 52) + 1; // Calculate the week (1-52) in the period year
        const replacements = {
            YYYY: dateInfo.year,
            MM: String(dateInfo.month + 1).padStart(2, '0'),
            PN: "P" + dateInfo.period,
            PW: "W" + dateInfo.week,
            WKP: String(pweek).padStart(2, '0'),
            WKC: String(dateInfo.calendarWeek).padStart(2, '0')
        };

        // 2. Build the filename by replacing placeholders in the format string
        const fileName = weeklyNoteFormat.replace(/YYYY|MM|PN|PW|WKP|WKC/g, (match) => {
            // This ensures that if a value is somehow undefined, it won't break the filename.
            return replacements[match] !== undefined ? replacements[match] : match;
        });

        // 3. The rest of the file creation/opening logic remains the same
        const path = `${weeklyNoteFolder}/${fileName}.md`;
        const file = this.app.vault.getAbstractFileByPath(path);

        if (file) {
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file);
        } else {
            new ConfirmationModal(this.app,
                "Create weekly note?",
                `A weekly note for "${fileName}" does not exist. Would you like to create it?`,
                async () => {
                    let fileContent = "";
                    const templateFile = this.app.vault.getAbstractFileByPath(weeklyNoteTemplate);
                    if (templateFile instanceof TFile) fileContent = await this.app.vault.read(templateFile);

                    if (!this.app.vault.getAbstractFileByPath(weeklyNoteFolder)) {
                        await this.app.vault.createFolder(weeklyNoteFolder);
                    }

                    const newFile = await this.app.vault.create(path, fileContent);
                    await this.buildWeeklyNotesCache();
                    this.renderCalendar();
                    const leaf = this.app.workspace.getLeaf(false);
                    await leaf.openFile(newFile);
                },
                "Yes, create it"
            ).open();
        }
    }

    generateMonthGrid(dateForMonth, targetBodyEl) {
        const { settings } = this.plugin;
        const today = new Date();
        const year = dateForMonth.getFullYear();
        const month = dateForMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const folder = settings.dailyNotesFolder || "";
        const format = settings.dailyNoteDateFormat || "YYYY-MM-DD";
        const existingNotes = new Set(this.app.vault.getMarkdownFiles().filter(file => !folder || file.path.startsWith(folder + "/")).map(file => file.basename));

        // This new logic correctly calculates the first day to show on the calendar
        const startDayNumber = this.plugin.settings.weekStartDay === 'monday' ? 1 : 0; // Mon=1, Sun=0
        moment.updateLocale('en', { week: { dow: startDayNumber } });

        let dayOfWeek = firstDayOfMonth.getDay(); // JS standard: Sun=0, Mon=1...

        let diff = dayOfWeek - startDayNumber;
        if (diff < 0) {
            diff += 7; // Ensure we go back to the previous week
        }

        let currentDay = new Date(firstDayOfMonth);
        currentDay.setDate(firstDayOfMonth.getDate() - diff);

        const requiredRows = 6;
        for (let i = 0; i < requiredRows; i++) {
            const row = targetBodyEl.createEl("tr");

            if (settings.highlightCurrentWeek) {
                const todayMoment = moment();
                const startOfWeekMoment = moment(currentDay);
                if (todayMoment.weekYear() === startOfWeekMoment.weekYear() && todayMoment.week() === startOfWeekMoment.week()) {
                    row.addClass('current-week-row');
                }
            }

            const weekMoment = moment(new Date(currentDay));
            const isoWeek = weekMoment.isoWeek();
            const isoYear = weekMoment.isoWeekYear();
            const isoMonth = weekMoment.month();
            const periodWeekData = getPeriodWeek(new Date(currentDay), settings.startOfPeriod1Date);

            const dateInfoForWeek = {
                year: isoYear,
                month: isoMonth,
                period: periodWeekData.period,
                week: periodWeekData.week,
                calendarWeek: isoWeek,
                weekSinceStart: periodWeekData.weekSinceStart
            };

            const clickHandler = () => {
                this.openWeeklyNote(dateInfoForWeek);
            };

            let weeklyNoteExists = false;
            if (settings.enableWeeklyNotes) {
                const pweek = ((dateInfoForWeek.weekSinceStart - 1) % 52) + 1;
                const replacements = {
                    YYYY: dateInfoForWeek.year,
                    MM: String(dateInfoForWeek.month + 1).padStart(2, '0'),
                    PN: "P" + dateInfoForWeek.period,
                    PW: "W" + dateInfoForWeek.week,
                    WKP: String(pweek).padStart(2, '0'),
                    WKC: String(dateInfoForWeek.calendarWeek).padStart(2, '0')
                };
                const expectedFileName = settings.weeklyNoteFormat.replace(/YYYY|WKP|WKC|MM|PN|PW/g, match => replacements[match]);
                const expectedPath = `${settings.weeklyNoteFolder}/${expectedFileName}.md`;
                weeklyNoteExists = this.existingWeeklyNotes.has(expectedPath);
            }

            if (settings.showPWColumn) {
                const pwCell = row.createEl("td", { cls: "cpwn-pw-label-cell" });
                const pwContent = pwCell.createDiv({ cls: "cpwn-day-content" });
                pwContent.createDiv({ cls: "cpwn-day-number" }).setText(this.formatPW(periodWeekData.period, periodWeekData.week));

                if (this.plugin.settings.highlightTodayPWLabel) {
                    for (let d = 0; d < 7; d++) {
                        const checkDate = new Date(currentDay);
                        checkDate.setDate(currentDay.getDate() + d);
                        if (isSameDay(checkDate, today)) {
                            pwCell.addClass("today-pw-label");
                            break;
                        }
                    }
                }

                if (weeklyNoteExists && settings.showWeeklyNoteDot && !settings.showWeekNumbers) {
                    const dotsContainer = pwContent.createDiv({ cls: 'cpwn-dots-container' });

                    const layout = this.plugin.settings.calendarLayout || 'normal';
                    dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');
                    dotsContainer.classList.add(`layout-${layout}`);
                    dotsContainer.createDiv({ cls: 'cpwn-calendar-dot cpwn-weekly-note-dot' });
                }
                pwCell.addEventListener('click', clickHandler);

                const handleRowHoverEnter = () => {
                    if (this.plugin.settings.enableRowHighlight) {
                        row.classList.add('row-hover');
                    }
                };
                const handleRowHoverLeave = () => {
                    row.classList.remove('row-hover');
                };

                pwCell.addEventListener('mouseenter', handleRowHoverEnter);
                pwCell.addEventListener('mouseleave', handleRowHoverLeave);

            }

            if (settings.showWeekNumbers) {
                const weekNum = settings.weekNumberType === 'period' ? periodWeekData.weekSinceStart : isoWeek;
                const weekCell = row.createEl("td", { cls: "cpwn-week-number-cell" });
                const weekContent = weekCell.createDiv({ cls: "cpwn-day-content" });
                weekContent.createDiv({ cls: "cpwn-day-number" }).setText(weekNum.toString());

                weekCell.classList.add('cpwn-clickable');

                if (this.plugin.settings.highlightTodayPWLabel) {
                    for (let d = 0; d < 7; d++) {
                        const checkDate = new Date(currentDay);
                        checkDate.setDate(currentDay.getDate() + d);
                        if (isSameDay(checkDate, today)) {
                            weekCell.addClass("today-pw-label");
                            break;
                        }
                    }
                }

                if (weeklyNoteExists && settings.showWeeklyNoteDot) {
                    const dotsContainer = weekContent.createDiv({ cls: 'cpwn-dots-container' });

                    const layout = this.plugin.settings.calendarLayout || 'normal';
                    dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');
                    dotsContainer.classList.add(`layout-${layout}`);

                    dotsContainer.createDiv({ cls: 'cpwn-calendar-dot cpwn-weekly-note-dot' });
                }
                weekCell.addEventListener('click', clickHandler);

                const handleRowHoverEnter = () => {
                    if (this.plugin.settings.enableRowHighlight) {
                        row.classList.add('row-hover');
                    }
                };
                const handleRowHoverLeave = () => {
                    row.classList.remove('row-hover');
                };

                weekCell.addEventListener('mouseenter', handleRowHoverEnter);
                weekCell.addEventListener('mouseleave', handleRowHoverLeave);
            }

            for (let d = 0; d < 7; d++) {
                const dayDate = new Date(currentDay);
                dayDate.setDate(currentDay.getDate() + d);
                const isOtherMonth = dayDate.getMonth() !== month;
                const cell = row.createEl("td");

                // Add separator class to first date column
                if (d === 0 && this.plugin.settings.showPWColumnSeparator &&
                    (this.plugin.settings.showPWColumn || this.plugin.settings.showWeekNumbers)) {
                    cell.addClass('first-date-column');
                }

                const contentDiv = cell.createDiv("cpwn-day-content");
                const dayNumber = contentDiv.createDiv("cpwn-day-number");
                dayNumber.textContent = dayDate.getDate().toString();
                const dateKey = moment(dayDate).format("YYYY-MM-DD");
                const icsEventsForDay = this.icsEventsByDate.get(dateKey);
                const tasksForDay = this.tasksByDate.get(dateKey);
                const createdFiles = this.createdNotesMap.get(dateKey) || [];
                const modifiedFiles = this.modifiedNotesMap.get(dateKey) || [];
                const assetsCreated = this.assetCreationMap.get(dateKey) || [];
                const dailyNoteFileName = formatDate(dayDate, format);
                const dailyNoteExists = existingNotes.has(dailyNoteFileName);

                let totalTaskCount = tasksForDay ? tasksForDay.length : 0;
                const calendarEventCount = icsEventsForDay ? icsEventsForDay.length : 0;
                const eventIndicatorStyle = this.plugin.settings.calendarEventIndicatorStyle;

                // Conditionally add calendar event count to the total count for heatmap/badge
                if (eventIndicatorStyle === 'heatmap' || eventIndicatorStyle === 'badge') {
                    totalTaskCount += calendarEventCount;
                }

                const isToday = isSameDay(dayDate, today)
                if (totalTaskCount > 0) {
                    if (settings.taskIndicatorStyle === 'badge') {
                        contentDiv.createDiv({ cls: 'cpwn-task-count-badge', text: totalTaskCount.toString() });

                    } else if (settings.taskIndicatorStyle === 'heatmap') {
                        const shouldApplyHeatmap = !(isToday && settings.todayHighlightStyle === 'cell');

                        if (shouldApplyHeatmap) {

                            const startColor = parseRgbaString(settings.taskHeatmapStartColor);
                            const midColor = parseRgbaString(settings.taskHeatmapMidColor);
                            const endColor = parseRgbaString(settings.taskHeatmapEndColor);
                            const midPoint = settings.taskHeatmapMidpoint;
                            const maxPoint = settings.taskHeatmapMaxpoint;


                            if (startColor && midColor && endColor) {
                                let finalColor;
                                if (totalTaskCount >= maxPoint) { finalColor = settings.taskHeatmapEndColor; }
                                else if (totalTaskCount >= midPoint) { const factor = (totalTaskCount - midPoint) / (maxPoint - midPoint); finalColor = blendRgbaColors(midColor, endColor, factor); }
                                else { const divisor = midPoint - 1; const factor = divisor > 0 ? (totalTaskCount - 1) / divisor : 1; finalColor = blendRgbaColors(startColor, midColor, factor); }

                                contentDiv.classList.add('cpwn-heatmap-cell');
                                contentDiv.style.setProperty('--cpwn-heatmap-color', finalColor);

                                // This creates a border using the theme's background color, making a clean gap.
                                const isInHighlightedRow = settings.highlightCurrentWeek &&
                                    row.classList.contains('current-week-row');

                                // Use the row highlight color as border if in highlighted row
                                if (isInHighlightedRow) {
                                    const borderColor = document.body.classList.contains('cpwn-theme-dark')
                                        ? settings.rowHighlightColorDark
                                        : settings.rowHighlightColorLight;
                                    contentDiv.style.border = `${this.plugin.settings.contentBorderWidth} solid ${borderColor}`;
                                } else {
                                    contentDiv.style.border = `${this.plugin.settings.contentBorderWidth} solid var(--background-secondary)`;
                                }
                                // A slightly smaller radius makes it look neatly inset.
                                contentDiv.addClass('cpwn-content-heatmap-cell-box');


                            }
                        }
                    }
                }

                if (isOtherMonth) dayNumber.addClass("cpwn-day-number-other-month");
                if (isSameDay(dayDate, today) && !isOtherMonth) cell.addClass("cpwn-today-cell");

                const dotsContainer = contentDiv.createDiv({ cls: 'cpwn-dots-container' });
                const layout = this.plugin.settings.calendarLayout || 'normal';

                // Ensure no old layout classes are lingering
                dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');

                // Apply the correct class based on the current setting
                dotsContainer.classList.add(`layout-${layout}`);


                if (dailyNoteExists) { dotsContainer.createDiv({ cls: "cpwn-period-month-daily-note-dot cpwn-calendar-dot" }); }
                if (settings.showOtherNoteDot && createdFiles.length > 0) { dotsContainer.createDiv({ cls: 'cpwn-other-note-dot cpwn-calendar-dot' }); }
                if (settings.showModifiedFileDot && modifiedFiles.length > 0) { dotsContainer.createDiv({ cls: 'cpwn-modified-file-dot cpwn-calendar-dot' }); }

                if (settings.showAssetDot && assetsCreated.length > 0) { dotsContainer.createDiv({ cls: 'cpwn-asset-dot cpwn-calendar-dot' }); }
                if (settings.showTaskDot && totalTaskCount > 0) { dotsContainer.createDiv({ cls: 'cpwn-task-dot cpwn-calendar-dot' }); }


                if (eventIndicatorStyle === 'dot' && calendarEventCount > 0 || settings.showIcsDot && calendarEventCount > 0) {
                    dotsContainer.createDiv({ cls: 'cpwn-calendar-dot cpwn-ics-event-dot' });
                }

                const hasPopupContent = dailyNoteExists || (totalTaskCount > 0) || (createdFiles.length > 0) || (modifiedFiles.length > 0) || (assetsCreated.length > 0) || (calendarEventCount > 0);

                let dataToShow = {};
                if (hasPopupContent) {
                    const dailyNoteFile = dailyNoteExists ? this.app.vault.getAbstractFileByPath(folder ? `${folder}/${dailyNoteFileName}.md` : `${dailyNoteFileName}.md`) : null;
                    dataToShow = {
                        tasks: tasksForDay,
                        daily: dailyNoteFile ? [dailyNoteFile] : [],
                        created: settings.showOtherNoteDot ? createdFiles : [],
                        modified: settings.showModifiedFileDot ? modifiedFiles : [],
                        assets: settings.showAssetDot ? assetsCreated : [],
                        ics: icsEventsForDay || [],
                    };
                }

                let longPressOccurred = false;
                let touchTimer = null;

                if (Platform.isMobile) {
                    // --- MOBILE: Long-press for popup, tap for daily note ---
                    cell.addEventListener('touchstart', (e) => {
                        longPressOccurred = false; // Reset on new touch
                        if (hasPopupContent) {
                            touchTimer = window.setTimeout(() => {
                                longPressOccurred = true;
                                this.showFilePopup(cell, dataToShow, dayDate, true); // Pass 'true' for mobile
                                e.preventDefault(); // Prevents context menu and text selection
                            }, 500); // 500ms for a long-press
                        }
                    });

                    const cancelLongPress = () => window.clearTimeout(touchTimer);
                    cell.addEventListener('touchend', cancelLongPress);
                    cell.addEventListener('touchmove', cancelLongPress);

                } else {
                    // --- DESKTOP: Hover for popup ---

                    if (hasPopupContent) {
                        const cellDate = dayDate;

                        // --- MOUSE ENTER LISTENER ---
                        cell.addEventListener('mouseenter', () => {
                            // PREVENT re-triggering if this cell is already the active one
                            if (cell === this.activeHoverCell) return;

                            // Store this cell as the new active one
                            this.activeHoverCell = cell;

                            if (this.isPopupLocked || this.isMouseDown) return;

                            window.clearTimeout(this.hideTimeout);
                            this.hideFilePopup(); // This will now correctly clear activeHoverCell

                            this.hoverTimeout = window.setTimeout(() => {
                                // Check AGAIN if the mouse is still meant to be over this cell
                                if (this.activeHoverCell !== cell) return;

                                const liveTasksForDay = this.allTasks.filter(task => {
                                    const isDone = task.status.type === 'DONE';
                                    if (isDone) {
                                        return task.done?.moment?.isSame(cellDate, 'day');
                                    } else {
                                        const matchesStartDate = task.start?.moment?.isSame(cellDate, 'day');
                                        const matchesScheduledDate = task.scheduled?.moment?.isSame(cellDate, 'day');
                                        const matchesDueDate = task.due?.moment?.isSame(cellDate, 'day');
                                        return matchesStartDate || matchesScheduledDate || matchesDueDate;
                                    }
                                });

                                const freshDataToShow = { ...dataToShow, tasks: liveTasksForDay };
                                this.showFilePopup(cell, freshDataToShow, cellDate, false);

                            }, this.plugin.settings.otherNoteHoverDelay);
                        });

                        // --- MOUSE LEAVE LISTENER ---
                        cell.addEventListener('mouseleave', () => {
                            // If the mouse leaves this cell, it's no longer the active one
                            if (this.activeHoverCell === cell) {
                                this.activeHoverCell = null;
                            }

                            window.clearTimeout(this.hoverTimeout);
                            this.hideTimeout = window.setTimeout(() => {
                                // Only hide the popup if it's not locked
                                if (!this.isPopupLocked) {
                                    this.hideFilePopup();
                                }
                            }, this.plugin.settings.popupHideDelay);
                        });
                    }
                }

                // --- UNIFIED CLICK HANDLER ---
                cell.addEventListener('click', (event) => {
                    if (longPressOccurred) {
                        // A long-press just happened and showed a popup, so ignore this subsequent 'click' event.
                        return;
                    }
                    this.hideFilePopup();
                    this.openDailyNote(dayDate);
                });
                cell.addEventListener('mouseenter', () => {
                    if (!this.plugin.settings.enableRowToDateHighlight) return;
                    const highlightColor = document.body.classList.contains('cpwn-theme-dark')
                        ? this.plugin.settings.rowHighlightColorDark
                        : this.plugin.settings.rowHighlightColorLight;
                    const row = cell.parentElement;
                    const allRows = Array.from(row.parentElement.children);
                    const rowIndex = allRows.indexOf(row);
                    const colIndex = Array.from(row.children).indexOf(cell);
                    const table = cell.closest('table');
                    for (let j = 0; j <= colIndex; j++) {
                        const cellToHighlight = row.children[j];
                        if (cellToHighlight) {
                            cellToHighlight.classList.add('cpwn-highlighted');
                            cellToHighlight.style.setProperty('--highlight-color', highlightColor);

                        } c
                    }
                    for (let i = 0; i < rowIndex; i++) {
                        const priorRow = allRows[i];
                        const cellToHighlight = priorRow.children[colIndex];
                        if (cellToHighlight) {
                            cellToHighlight.classList.add('cpwn-highlighted');
                            cellToHighlight.style.setProperty('--highlight-color', highlightColor);
                        }
                    }
                    if (table) {
                        const headerRow = table.querySelector('thead tr');
                        if (headerRow) {
                            const headerCell = headerRow.children[colIndex];
                            if (headerCell) {
                                headerCell.classList.add('cpwn-highlighted');
                                headerCell.style.setProperty('--highlight-color', highlightColor);
                            }
                        }
                    }
                });
                cell.addEventListener('mouseleave', () => {
                    if (!this.plugin.settings.enableRowToDateHighlight) return;
                    const table = cell.closest('table');
                    if (table) {
                        const allCells = table.querySelectorAll('tbody td, thead th');
                        allCells.forEach(c => c.style.backgroundColor = '');
                    }
                });
            }
            currentDay.setDate(currentDay.getDate() + 7);
        }
    }

    /**
     * Finds all markdown files that link to or embed the given asset file.
     * @param {TFile} assetFile - The asset file to find backlinks for.
     * @returns {Promise<TFile[]>} A promise that resolves to an array of markdown files linking to the asset.
     */
    async findAssetBacklinks(assetFile) {
        const backlinks = [];
        const markdownFiles = this.app.vault.getMarkdownFiles();

        for (const mdFile of markdownFiles) {
            const cache = this.app.metadataCache.getFileCache(mdFile);
            if (!cache) continue;

            const linksAndEmbeds = [...(cache.embeds || []), ...(cache.links || [])];

            for (const ref of linksAndEmbeds) {
                const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, mdFile.path);
                if (linkedFile && linkedFile.path === assetFile.path) {
                    backlinks.push(mdFile);
                    break; // Move to the next file once a link is found
                }
            }
        }
        return backlinks;
    }

    isWeeklyNote(file) {
        if (!this.plugin.settings.enableWeeklyNotes || !(file instanceof TFile)) {
            return false;
        }
        // A file is considered a weekly note if it's inside the specified folder.
        return file.parent?.path === this.plugin.settings.weeklyNoteFolder;
    }

    /**
    * Attaches touch event listeners for mobile swipe gestures.
    * @param {HTMLElement} calendarEl The element to listen for 'swipe up' on.
    * @param {HTMLElement} headerEl The element to listen for 'swipe down' on.
    */
    attachSwipeListeners(calendarEl, headerEl) {
        const swipeThreshold = 50;
        let startY = 0;
        let startX = 0;
        let isDragging = false;
        let dragTarget = null; // To know which element started the drag

        const handleDragStart = (e) => {
            isDragging = true;
            dragTarget = e.currentTarget; // Store if drag started on calendar or header
            startY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = e.touches ? e.touches[0].clientX : e.clientX;

            // Add the 'end' listeners to the window to catch drags that end outside the element
            window.addEventListener('mouseup', handleDragEnd, { once: true });
            window.addEventListener('touchend', handleDragEnd, { once: true });
        };

        const handleDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;

            const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const deltaY = startY - endY;
            const deltaX = Math.abs(startX - endX);

            // Check if it's a predominantly vertical swipe
            if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > deltaX) {
                // Swipe Up on Calendar Body: Hide Calendar
                if (dragTarget === calendarEl && deltaY > 0 && !this.isCalendarCollapsed) {
                    this.calendarWasCollapsedForEditing = false;
                    this.toggleCalendar(true); // Collapse
                }
                // Swipe Down on Header: Show Calendar
                else if (dragTarget === headerEl && deltaY < 0 && this.isCalendarCollapsed) {
                    this.calendarWasCollapsedForEditing = false;
                    this.toggleCalendar(false); // Use the helper

                    this.blurActiveInput();   // Explicitly dismiss the keyboard
                }
                else if (this.app.isMobile && dragTarget === calendarEl && deltaY < -80) { // A longer swipe down gesture
                    this.isVerticalView = true;
                    this.render(); // Re-render the entire view to switch to vertical mode
                }
            }
        };

        // Attach start listeners for both mouse and touch to both elements
        calendarEl.addEventListener('mousedown', handleDragStart);
        calendarEl.addEventListener('touchstart', handleDragStart, { passive: true });
        headerEl.addEventListener('mousedown', handleDragStart);
        headerEl.addEventListener('touchstart', handleDragStart, { passive: true });
    }

    /**
     * Checks if a file is an image based on its extension.
     * @param {TFile} file The file to check.
     * @returns {boolean} True if the file is a common image type.
     */
    isImageAsset(file) {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
        return imageExtensions.includes(file.extension.toLowerCase());
    }

    /**
     * Dynamically generates the label for a tab, including icon and/or text based on settings.
     * @param {HTMLElement} container The HTML element to populate with the label.
     * @param {string} key The key of the tab (e.g., 'notes', 'scratch').
     */
    getTabLabel(container, key) {
        container.empty(); // Clear previous content

        const isMobile = Platform.isMobile;
        const displayMode = isMobile ? this.plugin.settings.mobileTabDisplayMode : this.plugin.settings.tabDisplayMode;

        const icons = this.plugin.settings.tabIcons || DEFAULT_SETTINGS.tabIcons;
        const textLabels = {
            scratch: "Scratchpad",
            notes: "Notes",
            pinned: "Pinned",
            tasks: "Tasks",
            assets: "Assets",
            fileCreationDashboard: "Dashboard",
            tasksDashboard: "Dashboard"
        };

        let iconName = '';
        let text = '';

        if (key === 'notes') {
            const mode = this.notesViewMode;
            iconName = mode === 'pinned' ? icons.pinned : icons.notes;
            text = mode === 'pinned' ? textLabels.pinned : textLabels.notes;
        }
        else if (key === 'tasks') {
            const groupBy = this.plugin.settings.taskGroupBy;
            iconName = groupBy === 'tag' ? 'circle-check' : icons.tasks;
            text = groupBy === 'tag' ? "Tasks" : "Tasks";
        }
        else if (key === 'assets') {
            iconName = this.isAssetsGridView ? 'image' : 'file-image';
            text = textLabels[key];
        } else if (key === 'dashboard') {
            // Dynamically set both icon and text based on the current dashboard view mode
            if (this.dashboardViewMode === 'creation') {
                iconName = 'layout-grid';
                text = textLabels.fileCreationDashboard;
            } else { // Assumes 'tasks' view

                iconName = 'chart-bar-big';
                text = textLabels.tasksDashboard;
            }
        }
        else {
            iconName = icons[key];
            text = textLabels[key];
        }

        if (displayMode.includes("icon")) {
            const iconEl = container.createDiv({ cls: 'cpwn-tab-icon' });
            setIcon(iconEl, iconName || 'file-question');
        }

        if (displayMode.toLowerCase().includes("text")) {
            container.createSpan({ cls: 'tab-text', text: text || '' });
        }
    }

    /**
     * Determines if a file is a daily note based on its name format and location.
     * @param {TFile} file The file to check.
     * @returns {boolean} True if the file matches the daily note criteria.
     */
    isDailyNote(file) {
        const settings = this.plugin.settings;
        const dailyNoteFolder = settings.dailyNotesFolder;
        const format = settings.dailyNoteDateFormat || "YYYY-MM-DD";

        // Check if the filename strictly matches the daily note date format.
        const isNameCorrect = moment(file.basename, format, true).isValid();
        if (!isNameCorrect) {
            return false;
        }

        // If a daily notes folder is specified, check if the file is directly inside it.
        if (dailyNoteFolder) {
            return file.parent?.path === dailyNoteFolder;
        }

        // If no folder is set, the file must be in the vault's root directory.
        return file.parent?.path === '/';
    }

    /**
     * Toggles the scratchpad between edit and preview mode and triggers a re-render.
     */
    toggleScratchpadView() {
        this.isScratchpadPreview = !this.isScratchpadPreview;
        // The button state and content visibility are handled by the render method.
        this.renderScratchpadContent();
    }

    /**
     * Processes date placeholders in a string and replaces them with formatted dates.
     * Also handles a cursor position marker.
     * @param {string} formatString The string containing placeholders like {today}, {monday}, {date}+7, and a cursor marker '|'.
     * @returns {{text: string, cursorOffset: number}} The processed string and the calculated final cursor position.
     */
    processDatePlaceholders(formatString) {
        const cursorMarker = '|';
        let cursorOffset = -1;

        // Find the cursor marker's position and remove it for processing.
        const markerIndex = formatString.indexOf(cursorMarker);
        if (markerIndex !== -1) {
            cursorOffset = markerIndex;
            formatString = formatString.replace(cursorMarker, '');
        }

        // Process date placeholders using a regex.
        const processedText = formatString.replace(/{([^}]+)}/g, (match, tag) => {
            const now = moment();
            tag = tag.toLowerCase().trim();

            if (tag === 'today') return now.format('YYYY-MM-DD');
            if (tag === 'tomorrow') return now.add(1, 'day').format('YYYY-MM-DD');

            const weekdays = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
            if (tag in weekdays) {
                const targetDay = weekdays[tag];
                const currentDay = now.day();
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) {
                    daysToAdd += 7; // Find the *next* instance of the day.
                }
                return now.add(daysToAdd, 'days').format('YYYY-MM-DD');
            }

            const dynamicDateMatch = tag.match(/^date\s*([+-])\s*(\d+)/);
            if (dynamicDateMatch) {
                const operator = dynamicDateMatch[1];
                const amount = parseInt(dynamicDateMatch[2], 10);
                return operator === '+' ? now.add(amount, 'days').format('YYYY-MM-DD') : now.subtract(amount, 'days').format('YYYY-MM-DD');
            }

            return match; // Return original match if no placeholder is recognized.
        });

        // If the cursor marker wasn't found, set the offset to the end of the text.
        if (cursorOffset === -1) {
            cursorOffset = processedText.length;
        }

        return { text: processedText, cursorOffset: cursorOffset };
    }

    /**
     * Scans the entire vault for open tasks with due dates (e.g., 📅YYYY-MM-DD)
     * and populates `this.tasksByDate` map for quick lookups by the calendar view.
     */
    // This is the NEW, CORRECT version of the function
    async buildTasksByDateMap() {
        this.tasksByDate.clear();
        this.fileToTaskDates.clear();

        // The 'this.allTasks' property is now the single source of truth,
        // populated with the official Task objects from the plugin API.
        for (const task of this.allTasks) {
            // We only care about incomplete tasks that have a valid due date.
            // The Tasks API uses status.type: 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'
            const isCompletedOrCancelled = task.status.type === 'DONE' || task.status.type === 'CANCELLED';

            if (!isCompletedOrCancelled && task.due?.moment) {
                const dateKey = task.due.moment.format('YYYY-MM-DD');

                // Add the task to the map for the given due date.
                if (!this.tasksByDate.has(dateKey)) {
                    this.tasksByDate.set(dateKey, []);
                }
                this.tasksByDate.get(dateKey).push(task);

                // Also update the reverse-lookup map for efficient updates.
                const filePath = task.file.path;
                if (!this.fileToTaskDates.has(filePath)) {
                    this.fileToTaskDates.set(filePath, new Set());
                }
                this.fileToTaskDates.get(filePath).add(dateKey);
            }
        }
    }


    /**
     * Scans the vault for ALL tasks (complete and incomplete) and populates this.allTasks.
     * This serves as the single source of truth for the tasks dashboard.
     */
    // This is the NEW, CORRECT version
    async buildAllTasksList() {

        this.allTasks = [];

        const tasksPlugin = this.app.plugins.plugins['obsidian-tasks-plugin'];


        if (tasksPlugin && typeof tasksPlugin.getTasks === 'function') {
            this.allTasks = tasksPlugin.getTasks();

        } else {
            console.error("Obsidian tasks plugin not found or is not ready. Task-based widgets will be empty.");
            this.allTasks = [];
        }


    }

    getScratchpadParts(fullContent) {
        // If the setting to hide frontmatter is OFF, return the entire content as the body.
        if (!this.plugin.settings.scratchpad?.hideFrontmatter) {
            return { frontmatter: '', body: fullContent };
        }

        // This regex finds a valid frontmatter block at the very start of the file.
        const frontmatterRegex = /^---\s*[\r\n][\s\S]+?[\r\n]\s*---/;
        const match = fullContent.match(frontmatterRegex);

        if (match) {
            const frontmatterBlock = match[0];
            const endOfBlock = fullContent.indexOf(frontmatterBlock) + frontmatterBlock.length;

            // Determine the start of the body by skipping exactly one newline after the block.
            let bodyStartIndex = endOfBlock;
            if (fullContent.substring(bodyStartIndex, bodyStartIndex + 2) === '\r\n') {
                bodyStartIndex += 2;
            } else if (fullContent.substring(bodyStartIndex, bodyStartIndex + 1) === '\n') {
                bodyStartIndex += 1;
            }

            // The frontmatter now correctly includes the separating newline(s).
            const frontmatter = fullContent.substring(0, bodyStartIndex);
            // The body is everything after that, with its leading whitespace intact.
            const body = fullContent.substring(bodyStartIndex);

            return { frontmatter, body };
        }

        // If no frontmatter is found, the entire content is the body.
        return { frontmatter: '', body: fullContent };
    }

    /**
     * Renders the content of the scratchpad, switching between an editor textarea
     * and a rendered Markdown preview based on the current view mode.
     */
    async renderScratchpadContent() {
        if (!this.scratchWrapperEl) return;

        // Preserve focus on the textarea across re-renders.
        const wasFocused = this.noteTextarea === document.activeElement;

        this.scratchWrapperEl.empty();

        // Create a container for action buttons (Preview, Add Task).
        const actionsContainer = this.scratchWrapperEl.createDiv({ cls: 'cpwn-scratchpad-actions-container' });
        this.scratchpadActionsContainer = actionsContainer; // Store reference

        // Only show the Preview/Edit toggle button if enabled in settings.
        if (this.plugin.settings.scratchpad?.showPreviewToggle) {
            this.scratchpadViewToggleBtn = actionsContainer.createEl('button', { cls: 'cpwn-scratchpad-action-btn' });
            this.scratchpadViewToggleBtn.addEventListener('click', () => this.toggleScratchpadView());
        }

        // Only show the Add Task button if enabled in settings.
        if (this.plugin.settings.scratchpad?.showAddTaskButton) {
            this.addTaskBtn = actionsContainer.createEl('button', { cls: 'cpwn-scratchpad-action-btn' });
            setIcon(this.addTaskBtn, 'plus');
            this.addTaskBtn.setAttribute('aria-label', 'Add new task');
            this.addTaskBtn.addEventListener('click', () => this.addNewTaskToScratchpad());
        }

        if (this.isScratchpadPreview && this.plugin.settings.scratchpad?.showPreviewToggle) {
            // --- CONFIGURE UI FOR PREVIEW MODE ---
            if (this.scratchpadViewToggleBtn) {
                setIcon(this.scratchpadViewToggleBtn, 'edit');
                this.scratchpadViewToggleBtn.setAttribute('aria-label', 'Edit mode');
            }

            if (this.addTaskBtn) {
                this.addTaskBtn.classList.add('cpwn-hidden');
            }

            // Disable search controls in preview mode.
            if (this.scratchpadSearchInputEl) this.scratchpadSearchInputEl.disabled = true;
            if (this.scratchpadSearchControlsEl) {
                Array.from(this.scratchpadSearchControlsEl.children).forEach(child => {
                    if (child.matches('button')) child.disabled = true;
                });
            }

            // Render the content as Markdown.
            this.scratchWrapperEl.addClass('markdown-preview-view');

            // Use the pre-processed body content for rendering
            const markdownContent = this.noteText;
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.fixedNoteFile);

            if (file) {
                await MarkdownRenderer.render(this.app, markdownContent, this.scratchWrapperEl, file.path, this);
            }

        } else {
            // --- CONFIGURE UI FOR EDIT MODE ---
            if (this.scratchpadViewToggleBtn) {
                setIcon(this.scratchpadViewToggleBtn, 'eye');
                this.scratchpadViewToggleBtn.setAttribute('aria-label', 'Preview mode');
            }

            if (this.addTaskBtn) {
                this.addTaskBtn.classList.remove('cpwn-hidden')
            }

            // Enable search controls in edit mode.
            if (this.scratchpadSearchInputEl) this.scratchpadSearchInputEl.disabled = false;
            if (this.scratchpadSearchControlsEl) {
                Array.from(this.scratchpadSearchControlsEl.children).forEach(child => {
                    if (child.matches('button')) child.disabled = false;
                });
            }

            this.scratchWrapperEl.removeClass('markdown-preview-view');

            // The highlighter is a div that sits behind the textarea to show search matches.
            this.scratchHighlighterEl = this.scratchWrapperEl.createDiv({ cls: 'cpwn-scratch-base cpwn-scratch-highlighter' });
            this.noteTextarea = this.scratchWrapperEl.createEl('textarea', { cls: 'cpwn-scratch-base cpwn-scratch-content' });

            if (this.app.isMobile) {
                this.noteTextarea.addEventListener('focus', () => {
                    this.calendarWasCollapsedForEditing = true;
                    this.toggleCalendar(true); // Collapse calendar
                    this.noteTextarea.classList.add('is-editing-mobile');
                });

                // Note: The blur handler for saving is already added above
                // This handler is ONLY for calendar expand logic
                this.noteTextarea.addEventListener('blur', (e) => {
                    // If focus moves to the collapse button, don't auto-expand the calendar
                    if (e.relatedTarget === this.collapseBtn) {
                        this.noteTextarea.classList.remove('is-editing-mobile');
                        return;
                    }

                    // Add a small delay before expanding calendar
                    window.setTimeout(() => {
                        // Only expand if focus hasn't returned to the textarea
                        if (document.activeElement !== this.noteTextarea && this.calendarWasCollapsedForEditing) {
                            this.calendarWasCollapsedForEditing = false;
                            this.toggleCalendar(false); // Expand calendar
                        }
                        this.noteTextarea.classList.remove('is-editing-mobile');
                    }, 100);
                });
            }


            this.noteTextarea.addEventListener('touchstart', () => {
                this.isActivelyEditing = true;
            }, { passive: true });

            this.noteTextarea.addEventListener('touchend', () => {
                window.clearTimeout(this.activeEditingTimeout);
                this.activeEditingTimeout = window.setTimeout(() => {
                    this.isActivelyEditing = false;
                }, 300);
            });

            // Set the textarea value from the pre-processed body content
            this.noteTextarea.value = this.noteText;

            if (wasFocused) {
                this.noteTextarea.focus();
            }

            this.updateScratchpadHighlights();
            this.updateScratchpadSearchCount();

            // Save content on input.
            this.noteTextarea.addEventListener('input', () => {
                this.noteText = this.noteTextarea.value;
                this.updateScratchpadSearchCount();
                this.updateScratchpadHighlights();
            });

            // Save behavior: desktop saves on input, mobile saves on blur
            if (this.app.isMobile) {
                // Mobile: only save when textarea loses focus
                this.noteTextarea.addEventListener('blur', async () => {
                    await this.saveFixedNote(this.noteText);
                });
            } else {
                // Desktop: save on every input with debounce
                const debouncedSave = debounce(async () => {
                    await this.saveFixedNote(this.noteText);
                }, 500, true);

                this.noteTextarea.addEventListener('input', () => {
                    debouncedSave();
                });
            }

            // Synchronize scroll position between textarea and highlighter.
            this.noteTextarea.addEventListener('scroll', () => {
                if (this.scratchHighlighterEl) {
                    this.scratchHighlighterEl.scrollTop = this.noteTextarea.scrollTop;
                    this.scratchHighlighterEl.scrollLeft = this.noteTextarea.scrollLeft;
                }
            });
        }
    }


    /**
     * Called when the view is first opened. It loads all initial data and registers
     * event listeners for file changes and auto-reloading.
     */
    async onOpen() {
        // --- Load all initial data ---
        await this.buildCreatedNotesMap();
        await this.buildModifiedNotesMap();
        await this.buildAssetCreationMap();
        await this.buildAllCreatedNotesMap();

        await this.refreshIcsEvents();
        await this.buildWeeklyNotesCache();
        await this.buildHeatmapFileCache();

        // Poll for Tasks plugin availability (max 5 seconds, checks every 500ms)
        let pollAttempts = 0;
        const maxAttempts = 10; // 5 seconds total
        const pollInterval = 500; // ms

        const pollForTasks = async () => {
            const tasksPlugin = this.app.plugins.plugins["obsidian-tasks-plugin"];
            if (tasksPlugin && typeof tasksPlugin.getTasks === "function") {
                // Tasks is ready—rebuild and render
                await this.buildAllTasksList();
                await this.buildTasksByDateMap();
                this.renderCalendar();
                return; // Stop polling
            }

            pollAttempts++;
            if (pollAttempts < maxAttempts) {
                window.setTimeout(pollForTasks, pollInterval);
            } else {
                console.warn("Tasks plugin not detected within timeout—heatmap will be empty until manual refresh or Tasks loads.");
                new Notice("Enable/reload Obsidian Tasks plugin for full heatmap support.", 5000);
                // Still render the calendar without tasks
                this.renderCalendar();
            }
        };

        // Trigger the poll
        pollForTasks();

        // Correctly load and parse the scratchpad content on initial open
        const fullContent = await this.loadNote();
        const { frontmatter, body } = this.getScratchpadParts(fullContent);
        this.scratchpadFrontmatter = frontmatter;
        this.noteText = body; // this.noteText now correctly stores only the body

        this.render();
        this.setupReorderMode();
        this.registerDomEvent(document, 'keydown', this.handleKeyDown.bind(this));

        // --- Register events and intervals ---
        const intervalMs = this.plugin.settings.autoReloadInterval || 5000;

        this.registerInterval(window.setInterval(async () => {
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            // --- NEW: Mobile Keyboard Detection ---
            let isKeyboardOpen = false;
            if (this.app.isMobile && window.visualViewport) {
                // Heuristic: If the visual viewport height is significantly smaller than
                // the window height, it's very likely the on-screen keyboard is open.
                isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.7;
            }

            if (isTyping || isKeyboardOpen) {
                return; // Pause refresh if typing or if mobile keyboard is open
            }

            const latestFullContent = await this.loadNote();
            const currentFullContent = this.scratchpadFrontmatter + this.noteText;

            if (latestFullContent !== currentFullContent) {
                const {
                    frontmatter,
                    body
                } = this.getScratchpadParts(latestFullContent);
                this.scratchpadFrontmatter = frontmatter;
                this.noteText = body;

                if (this.noteTextarea) {
                    this.noteTextarea.value = this.noteText;
                }
                if (this.isScratchpadPreview) {
                    this.renderScratchpadContent();
                }

                this.updateScratchpadSearchCount();
                this.updateScratchpadHighlights();
            }
        }, intervalMs));

        // This listener checks the date when the app window gets focus.
        // This solves a 'stale date highlight after a device sleep' issue.
        this.registerDomEvent(window, 'focus', () => {
            const now = new Date();
            // Only proceed if the day has actually changed.
            if (!isSameDay(now, this.lastKnownToday)) {
                console.log("Window focus detected: Day has changed. Refreshing calendar.");

                // Update our tracker to the new date.
                this.lastKnownToday = now;

                // Efficiently re-render just the calendar grid.
                this.renderCalendar();
            }
        });

        // Custom listener to rebuild dashboards
        this.registerEvent(
            this.app.workspace.on('cpwn-pm-dashboard-refresh', this.rebuildDashboards, this)
        );

        this.registerEvent(
            this.app.workspace.on('tasks-changed', async () => {
                await this.buildAllTasksList();      // fresh snapshot from Tasks plugin
                await this.buildTasksByDateMap();    // recompute calendar map
                this.renderCalendar();               // update badges + heatmap together
                this.refreshUI({ updateType: 'tasks' }); // keep dashboard in sync
            })
        );

        this.registerEvent(this.app.metadataCache.on('changed', async (file) => {
            window.clearTimeout(this._tasksFallbackTimer);
            this._tasksFallbackTimer = window.setTimeout(async () => {
                const tasksChanged = await this.updateTasksForFile(file); // rebuilds allTasks + tasksByDate
                if (tasksChanged) {
                    this.renderCalendar(); // badges + heatmap together
                }
                this.refreshUI({ updateType: tasksChanged ? 'tasks' : 'metadata', file });
            }, 400);
        }));


        // Separate listener specifically for heatmap filter changes (Tags only)
        this.registerEvent(this.app.metadataCache.on('changed', async (file) => {
            // Only check for heatmap changes, don't touch task logic
            if (this.activeTab !== 'dashboard' || this.dashboardViewMode !== 'creation') {
                return; // Exit early if not viewing creation dashboard
            }

            window.clearTimeout(this.heatmapRefreshDebounceTimer);
            this.heatmapRefreshDebounceTimer = window.setTimeout(async () => {
                const affectsHeatmap = await this.checkIfFileAffectsHeatmaps(file);

                if (affectsHeatmap) {
                    this.refreshUI({ updateType: 'creation', file });
                }
            }, 400); // Debounce to avoid refresh on every keystroke
        }));

        // Handle file renames (Filename, File Path, and File Type filters)
        this.registerEvent(this.app.vault.on('rename', async (file, oldPath) => {
            if (!(file instanceof TFile)) return;

            if (this.activeTab !== 'dashboard' || this.dashboardViewMode !== 'creation') {
                return;
            }

            // Check both old and new paths
            const oldMatches = this.fileToHeatmapCache.get(oldPath) || new Set();
            const newMatches = await this.getMatchingHeatmapsForFile(file);

            // Update cache
            this.fileToHeatmapCache.delete(oldPath);
            if (newMatches.size > 0) {
                this.fileToHeatmapCache.set(file.path, newMatches);
            }

            // Refresh if matching state changed
            if (this.hasHeatmapMatchChanged(oldMatches, newMatches)) {
                window.clearTimeout(this.heatmapRefreshDebounceTimer);
                this.heatmapRefreshDebounceTimer = window.setTimeout(() => {
                    this.refreshUI({ updateType: 'creation', file });
                }, 200);
            }
        }));




        // Handles CREATING a new file
        this.registerEvent(this.app.vault.on("create", (file) => {
            if (!(file instanceof TFile)) return;
            this._addFileToAllCreatedMap(file);
            this.refreshUI({ updateType: 'creation' });
        }));

        // Handles DELETING a file
        this.registerEvent(this.app.vault.on("delete", async (file) => {
            if (!(file instanceof TFile)) return;

            // These calls update the data maps for calendar dots and other features.
            if (this.existingWeeklyNotes.has(file.path)) this.existingWeeklyNotes.delete(file.path);
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(file.path);
                // Also remove tasks from the deleted file
                const oldDateKeys = this.fileToTaskDates.get(file.path) || new Set();
                for (const dateKey of oldDateKeys) {
                    const tasks = this.tasksByDate.get(dateKey);
                    if (tasks) {
                        const remaining = tasks.filter(t => t.file.path !== file.path);
                        if (remaining.length > 0) this.tasksByDate.set(dateKey, remaining);
                        else this.tasksByDate.delete(dateKey);
                    }
                }
                this.fileToTaskDates.delete(file.path);
            } else {
                this.removeFileFromAssetMap(file.path);
            }

            if (this.fileToHeatmapCache.has(file.path)) {
                this.fileToHeatmapCache.delete(file.path);
            }

            // Update the dashboard's data source
            this._removeFileFromAllCreatedMap(file);

            // Trigger the correct UI refresh
            this.refreshUI({ updateType: 'creation', file: file });
        }));


        // Handles RENAMING a file
        this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
            if (!(file instanceof TFile)) return;

            // These calls handle the remove/add logic other features.
            if (this.existingWeeklyNotes.has(oldPath)) this.existingWeeklyNotes.delete(oldPath);
            if (this.isWeeklyNote(file)) this.existingWeeklyNotes.add(file.path);

            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(oldPath);
                this.addFileToMaps(file);
                // This correctly re-associates tasks with the new file path.
                await this.updateTasksForFile(file);
            } else {
                this.removeFileFromAssetMap(oldPath);
                this.addFileToAssetMap(file);
            }

            // Update the dashboard's data source ---
            const oldFilePlaceholder = { path: oldPath, stat: file.stat };
            this._removeFileFromAllCreatedMap(oldFilePlaceholder);
            this._addFileToAllCreatedMap(file);

            if (this.fileToHeatmapCache.has(oldPath)) {
                const matches = this.fileToHeatmapCache.get(oldPath);
                this.fileToHeatmapCache.delete(oldPath);
                this.fileToHeatmapCache.set(file.path, matches);
            }

            // Trigger the correct UI refresh
            this.refreshUI({ updateType: 'creation', file: file });
        }));

        // Add a global listener to blur inputs when tapping outside.
        // Uses 'mousedown' and the 'capture: true' phase for mobile reliability.
        this.registerDomEvent(this.containerEl, 'mousedown', (event) => {
            const activeEl = document.activeElement;
            const target = event.target;

            // Safely check if the clicked target is a valid HTML element.
            // If not, do nothing. This prevents the errors you saw before.
            if (!(target instanceof HTMLElement)) {
                return;
            }

            // Define the list of inputs this behavior applies to.
            const focusableInputs = [
                this.notesSearchInputEl,
                this.tasksSearchInputEl,
                this.assetsSearchInputEl,
                this.scratchpadSearchInputEl,
                this.noteTextarea
            ].filter(Boolean); // Removes any non-existent elements

            // Check if one of our inputs currently has focus.
            const isInputFocused = focusableInputs.includes(activeEl);

            // Check if the tap occurred on one of the inputs themselves.
            const clickedOnInput = focusableInputs.some(input => input.contains(target));

            // If an input is focused, but the tap was *outside* of it, blur the input.
            if (isInputFocused && !clickedOnInput) {
                // This re-uses the same helper function from the swipe fix.
                this.blurActiveInput();
            }
        }, true); // 'true' enables the capture phase, which is crucial for reliability.


        const PULL_THRESHOLD = 70; // How far the user needs to pull down to trigger a refresh

        const resetPullStyles = () => {
            this.taskRefreshIndicator.removeClass('is-ready', 'is-pulling', 'is-refreshing');

            this.tasksContentEl.classList.add('cpwn-pull-indicator');
            this.tasksContentEl.style.setProperty('--pull-transform', 'translateY(0px)');
            this.tasksContentEl.style.setProperty('--pull-transform', 'translateY(-50px) scale(0.7)');

            setIcon(this.taskRefreshIndicator, 'arrow-down');
        };

        this.registerDomEvent(this.tasksContentEl, 'touchstart', (e) => {
            if (this.tasksContentEl.scrollTop === 0) {
                this.isTaskPulling = true;
                this.taskPullStartY = e.touches[0].clientY;
            }
        }, { passive: false });

        this.registerDomEvent(this.tasksContentEl, 'touchmove', (e) => {
            if (!this.isTaskPulling) return;

            const currentY = e.touches[0].clientY;
            // We only care about the downward pull distance from the start
            this.taskPullDistance = Math.max(0, currentY - this.taskPullStartY);

            // Only interfere if the list is scrolled to the top AND the user is pulling down.
            if (this.tasksContentEl.scrollTop === 0 && this.taskPullDistance > 0) {
                // Prevent the browser from scrolling the page
                e.preventDefault();

                const pullRatio = Math.min(this.taskPullDistance, PULL_THRESHOLD);
                this.tasksContentEl.style.transform = `translateY(${pullRatio}px)`;

                this.taskRefreshIndicator.addClass('is-pulling');
                this.taskRefreshIndicator.style.transform = `translateY(${pullRatio - 50}px) scale(0.7)`;

                if (this.taskPullDistance > PULL_THRESHOLD) {
                    this.taskRefreshIndicator.addClass('is-ready');
                    setIcon(this.taskRefreshIndicator, 'check');
                } else {
                    this.taskRefreshIndicator.removeClass('is-ready');
                    setIcon(this.taskRefreshIndicator, 'arrow-down');
                }
            } else {
                // If we've started scrolling down the list, stop tracking the pull
                this.isTaskPulling = false;
            }

        }, { passive: false });

        this.app.workspace.onLayoutReady(() => {
            const statusBar = document.querySelector('.status-bar');
            if (statusBar && !Platform.isMobile) {
                this.statusBarObserver = new ResizeObserver(() => {
                    this.updateDynamicPadding();
                });

                this.statusBarObserver.observe(statusBar);
                this.updateDynamicPadding(); // Run once on initial load
            }
        });

        this.registerDomEvent(this.tasksContentEl, 'touchend', async (e) => {
            if (!this.isTaskPulling) return;
            this.isTaskPulling = false;

            if (this.taskPullDistance > PULL_THRESHOLD) {

                this.blurActiveInput();
                // Trigger the refresh
                this.taskRefreshIndicator.addClass('is-refreshing', 'is-ready');
                setIcon(this.taskRefreshIndicator, 'loader');

                await this.populateTasks();

                // Reset styles after refresh is complete
                window.setTimeout(() => {
                    resetPullStyles();
                }, 300); // Small delay for user to see the end of the spin

            } else {
                // Snap back if not pulled far enough
                resetPullStyles();
            }

            this.taskPullDistance = 0;

        });
        this.scheduleDailyRefresh();
    }

    /**
     * Forces a full rebuild of all data maps and a complete re-render of the view.
     * Useful after major setting changes.
     */
    async rebuildAndRender() {
        // --- Existing data map rebuilds ---
        await this.buildCreatedNotesMap();
        await this.buildModifiedNotesMap();
        await this.buildAssetCreationMap();
        await this.buildAllCreatedNotesMap();
        await this.buildTasksByDateMap();
        await this.buildAllTasksList();
        await this.refreshIcsEvents();
        await this.buildWeeklyNotesCache();
        await this.buildHeatmapFileCache();

        // Re-load the note from the file and re-process it based on the new setting
        const fullContent = await this.loadNote();
        const { frontmatter, body } = this.getScratchpadParts(fullContent);
        this.scratchpadFrontmatter = frontmatter;
        this.noteText = body;

        // Now, trigger the main render function, which will use the updated content
        this.render();
    }

    // Rebuilds the dashboard content based on the current view mode.
    async rebuildDashboards() {
        if (!this.dashboardContentEl) return;
        this.debouncedRebuildDashboards();
    }

    /**
     * Performs a more targeted UI refresh based on which file was changed,
     * avoiding a full re-render when possible.
     * @param {TFile} file The file that was changed.
     */
    // In class PeriodMonthView

    async refreshUI(options = {}) {
        const { updateType, file = null } = options;

        // Always refresh the calendar display via the plugin instance.
        this.debouncedCalendarRefresh();

        if (this.activeTab === 'dashboard') {
            const isTaskDashboard = this.dashboardViewMode === 'tasks';
            const isCreationDashboard = this.dashboardViewMode === 'creation';

            // Refresh if the update type matches the visible dashboard view, or if it's a general update.
            if ((updateType === 'tasks' && isTaskDashboard) ||
                (updateType === 'creation' && isCreationDashboard) ||
                (updateType === 'general')) {
                this.debouncedDashboardRefresh();
            }
            return; // Exit after handling dashboard
        }

        // Handle updates for other tabs via the plugin instance.
        switch (this.activeTab) {
            case 'scratch':
                if (file?.path === this.plugin.settings.fixedNoteFile) {
                    const fullContent = await this.loadNote();
                    const { frontmatter, body } = this.getScratchpadParts(fullContent);
                    this.scratchpadFrontmatter = frontmatter;
                    this.noteText = body;
                    if (this.noteTextarea && this.noteTextarea.value !== this.noteText) {
                        const cursorPos = this.noteTextarea.selectionStart;
                        this.noteTextarea.value = this.noteText;
                        this.noteTextarea.selectionStart = this.noteTextarea.selectionEnd = cursorPos;
                    }
                }
                break;
            case 'notes':
                this.debouncedPopulateNotes();
                break;
            case 'tasks':
                this.debouncedPopulateTasks();
                break;
            case 'assets':
                this.isUnusedAssetCacheValid = false;
                this.populateAssets();
                break;
        }
    }



    async updateTasksForFile(file) {
        if (!file || !(file instanceof TFile) || !file.path.toLowerCase().endsWith('.md')) {
            // Return false to indicate this was not a task-relevant file change.
            return false;
        }

        // Reload the master task list from the Tasks API.
        await this.buildAllTasksList();

        // Rebuild the map used by the calendar grid.
        await this.buildTasksByDateMap();

        // Return true to signal to the 'changed' event handler that a task update occurred.
        return true;
    }

    /**
     * Updates the highlighter div with <mark> tags to show search term matches.
     */
    updateScratchpadHighlights() {
        if (!this.scratchHighlighterEl || !this.noteTextarea) return;

        const text = this.noteTextarea.value;
        const term = this.scratchpadSearchTerm;

        if (!term) {
            this.scratchHighlighterEl.innerHTML = '';
            return;
        }

        // Sanitize text to prevent HTML injection before inserting it into the highlighter.
        const sanitizedText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, 'gi');

        const highlightedHtml = sanitizedText.replace(regex, (match) => `<mark>${match}</mark>`);
        this.scratchHighlighterEl.innerHTML = highlightedHtml;
    }

    /**
     * Counts and displays the number of search matches in the scratchpad.
     */
    updateScratchpadSearchCount() {
        if (!this.scratchpadSearchCountEl || !this.noteTextarea) return;

        const term = this.scratchpadSearchTerm;
        const text = this.noteTextarea.value;
        let matchCount = 0;

        if (term) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedTerm, 'gi');
            matchCount = (text.match(regex) || []).length;
        }

        this.scratchpadSearchCountEl.setText(`(${matchCount})`);
    }

    /**
     * Checks if a file path should be ignored based on user settings.
     * @param {string} filePath The path of the file to check.
     * @param {string} settingKey The key for the ignore list in the plugin settings.
     * @returns {boolean} True if the path should be ignored.
     */
    isPathIgnored(filePath, settingKey = 'otherNoteIgnoreFolders') {
        // Normalize folder paths to end with a slash for consistent matching.
        const ignoreFolders = (this.plugin.settings[settingKey] || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const dailyNoteFolder = this.plugin.settings.dailyNotesFolder;
        const filePathLower = filePath.toLowerCase();

        // Always ignore files inside the daily notes folder for "other note" calculations.
        if (dailyNoteFolder && filePathLower.startsWith(dailyNoteFolder.toLowerCase() + "/")) {
            return true;
        }
        return ignoreFolders.some(folder => folder && filePathLower.startsWith(folder));
    }

    /**
     * Adds a file to the createdNotesMap and modifiedNotesMap.
     * @param {TFile} file The file to add.
     */
    addFileToMaps(file) {
        if (this.isPathIgnored(file.path)) return;

        // Add to createdNotesMap.
        const cdate = new Date(file.stat.ctime);
        const cdateKey = moment(cdate).format("YYYY-MM-DD");
        if (!this.createdNotesMap.has(cdateKey)) {
            this.createdNotesMap.set(cdateKey, []);
        }
        const createdFiles = this.createdNotesMap.get(cdateKey);
        if (!createdFiles.some(f => f.path === file.path)) {
            createdFiles.push(file);
        }

        // Add to modifiedNotesMap if modified date is on a different day than creation date.
        const mdate = new Date(file.stat.mtime);
        if (!isSameDay(cdate, mdate)) {
            const mdateKey = moment(mdate).format("YYYY-MM-DD");
            if (!this.modifiedNotesMap.has(mdateKey)) {
                this.modifiedNotesMap.set(mdateKey, []);
            }
            const modifiedFiles = this.modifiedNotesMap.get(mdateKey);
            if (!modifiedFiles.some(f => f.path === file.path)) {
                modifiedFiles.push(file);
            }
        }
    }

    /**
     * Removes a file from all internal note data maps by its path.
     * @param {string} filePath The path of the file to remove.
     */
    removeFileFromMaps(filePath) {
        // Iterate through maps and remove any entries with the given file path.
        for (const [key, files] of this.createdNotesMap.entries()) {
            const updatedFiles = files.filter(f => f.path !== filePath);
            if (updatedFiles.length < files.length) {
                if (updatedFiles.length === 0) {
                    this.createdNotesMap.delete(key);
                } else {
                    this.createdNotesMap.set(key, updatedFiles);
                }
            }
        }
        for (const [key, files] of this.modifiedNotesMap.entries()) {
            const updatedFiles = files.filter(f => f.path !== filePath);
            if (updatedFiles.length < files.length) {
                if (updatedFiles.length === 0) {
                    this.modifiedNotesMap.delete(key);
                } else {
                    this.modifiedNotesMap.set(key, updatedFiles);
                }
            }
        }
    }

    /**
 * Checks if a file's metadata change affects any custom heatmaps.
 * Handles Tag filter changes only (other filter types handled by rename event).
 */
    async checkIfFileAffectsHeatmaps(file) {
        if (!file || !(file instanceof TFile)) {
            return false;
        }

        const oldMatches = this.fileToHeatmapCache.get(file.path) || new Set();
        const newMatches = await this.getMatchingHeatmapsForFile(file);

        // Update cache
        if (newMatches.size > 0) {
            this.fileToHeatmapCache.set(file.path, newMatches);
        } else {
            this.fileToHeatmapCache.delete(file.path);
        }

        return this.hasHeatmapMatchChanged(oldMatches, newMatches);
    }

    /**
     * Get all heatmap indices that a file matches.
     * Checks against all four filter types: Tag, Filename, File Path, File Type.
     */
    async getMatchingHeatmapsForFile(file) {
        const matches = new Set();

        this.plugin.settings.customHeatmaps.forEach((config, index) => {
            if (this._matchesHeatmapRule(file, config)) {
                matches.add(index);
            }
        });

        return matches;
    }

    /**
     * Compare two sets of heatmap matches to detect if matching state changed.
     */
    hasHeatmapMatchChanged(oldMatches, newMatches) {
        if (oldMatches.size !== newMatches.size) {
            return true;
        }

        for (const index of newMatches) {
            if (!oldMatches.has(index)) {
                return true;
            }
        }

        return false;
    }


    /**
     * Formats a file size in bytes into a human-readable string (B, KB, MB, GB).
     * @param {number} bytes The file size in bytes.
     * @returns {string} The formatted file size.
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const fixed = i < 2 ? 0 : 1;
        return parseFloat((bytes / Math.pow(k, i)).toFixed(fixed)) + ' ' + sizes[i];
    }

    /**
     * Adds a new task to the scratchpad note using the format defined in settings.
     */
    async addNewTaskToScratchpad() {
        if (this.isScratchpadPreview || !this.noteTextarea) {
            return;
        }

        const taskFormatSetting = this.plugin.settings.scratchpad?.taskFormat || "- [ ] ";
        const processed = this.processDatePlaceholders(taskFormatSetting);
        const textToInsert = processed.text;
        const ta = this.noteTextarea;

        // 1. Capture current state
        const selectionStart = ta.selectionStart;
        const textBeforeCursor = ta.value.substring(0, selectionStart);
        const textAfterCursor = ta.value.substring(selectionStart);

        // 2. Prepare new text and update the value
        const needsLeadingNewline = textBeforeCursor.length > 0 && !textBeforeCursor.endsWith("\n");
        const finalInsertionText = needsLeadingNewline ? "\n" + textToInsert : textToInsert;
        const newText = textBeforeCursor + finalInsertionText + textAfterCursor;
        ta.value = newText;

        // 3. Set the new cursor position
        const newCursorPosition = selectionStart + finalInsertionText.length - (textToInsert.length - processed.cursorOffset);
        ta.setSelectionRange(newCursorPosition, newCursorPosition);

        // 4. Give the textarea focus
        ta.focus();

        // 5. Save the new content immediately
        this.noteText = newText;
        await this.saveFixedNote(this.noteText);
        this.updateScratchpadSearchCount();
        this.updateScratchpadHighlights();

        // 6. Use an awaited Promise with a longer delay to ensure this runs LAST.
        await new Promise(resolve => window.setTimeout(resolve, 50)); // 50ms delay

        const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
        const linesToCaret = ta.value.slice(0, newCursorPosition).split("\n").length;
        const targetScrollTop = (linesToCaret - 1) * lineHeight;

        // Directly set the scroll position as the final action.
        ta.scrollTop = targetScrollTop;
    }


    /**
     * Scans all Markdown files in the vault to build the initial `createdNotesMap`.
     */
    async buildCreatedNotesMap() {
        this.createdNotesMap.clear();
        const allNotes = this.app.vault.getMarkdownFiles();
        for (const file of allNotes) {
            if (this.isPathIgnored(file.path)) continue;

            const cdate = new Date(file.stat.ctime);
            const dateKey = moment(cdate).format("YYYY-MM-DD");
            if (!this.createdNotesMap.has(dateKey)) {
                this.createdNotesMap.set(dateKey, []);
            }
            this.createdNotesMap.get(dateKey).push(file);
        }
    }

    /**
     * Scans all Markdown files in the vault to build the initial `modifiedNotesMap`.
     */
    async buildModifiedNotesMap() {
        this.modifiedNotesMap.clear();
        const allNotes = this.app.vault.getMarkdownFiles();
        for (const file of allNotes) {
            if (this.isPathIgnored(file.path)) continue;

            const cdate = new Date(file.stat.ctime);
            const mdate = new Date(file.stat.mtime);
            if (!isSameDay(cdate, mdate)) {
                const dateKey = moment(mdate).format("YYYY-MM-DD");
                if (!this.modifiedNotesMap.has(dateKey)) {
                    this.modifiedNotesMap.set(dateKey, []);
                }
                if (!this.modifiedNotesMap.get(dateKey).some(f => f.path === file.path)) {
                    this.modifiedNotesMap.get(dateKey).push(file);
                }
            }
        }
    }

    /**
     * Scans all non-Markdown files in the vault to build the `assetCreationMap`.
     */
    async buildAssetCreationMap() {
        this.assetCreationMap.clear();
        const allFiles = this.app.vault.getFiles();
        const ignoreFolders = (this.plugin.settings.assetIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const hiddenTypes = (this.plugin.settings.hiddenAssetTypes || "")
            .split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => ext.length > 0);

        for (const file of allFiles) {
            if (file.path.toLowerCase().endsWith('.md')) continue;
            if (hiddenTypes.includes(file.extension.toLowerCase())) continue; // Filter by extension

            const filePathLower = file.path.toLowerCase();
            if (ignoreFolders.some(folder => folder && filePathLower.startsWith(folder))) continue;

            const cdate = new Date(file.stat.ctime);
            const dateKey = moment(cdate).format("YYYY-MM-DD");
            if (!this.assetCreationMap.has(dateKey)) {
                this.assetCreationMap.set(dateKey, []);
            }
            this.assetCreationMap.get(dateKey).push(file);
        }
    }

    /**
     * Finds all asset files in the vault that are not linked to from any Markdown file.
     * @returns {Promise<Set<string>>} A promise that resolves to a Set of unused asset paths.
     */
    async getUnusedAssetPaths() {
        const allMarkdownFiles = this.app.vault.getMarkdownFiles();
        const referencedAssetPaths = new Set();

        for (const mdFile of allMarkdownFiles) {
            const cache = this.app.metadataCache.getFileCache(mdFile);
            if (!cache) continue;

            const linksAndEmbeds = [...(cache.embeds || []), ...(cache.links || [])];

            for (const ref of linksAndEmbeds) {
                const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, mdFile.path);
                if (linkedFile && !linkedFile.path.toLowerCase().endsWith('.md')) {
                    referencedAssetPaths.add(linkedFile.path);
                }
            }
        }
        const allAssetPaths = this.app.vault.getFiles()
            .filter(file => !file.path.toLowerCase().endsWith('.md'))
            .map(file => file.path);

        const unusedAssetPaths = new Set(allAssetPaths.filter(assetPath => !referencedAssetPaths.has(assetPath)));
        return unusedAssetPaths;
    }

    _createBacklinkItem(container, noteFile, assetFile) {
        const itemEl = container.createDiv({ cls: 'cpwn-other-notes-popup-item' });

        if (this.isImageAsset(noteFile)) {
            const thumbnail = itemEl.createEl('img', { cls: 'cpwn-popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(noteFile);
        } else {
            setIcon(itemEl, 'file-text'); // Fallback to a generic icon
        }

        const titlePathWrapper = itemEl.createDiv({ cls: 'cpwn-note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: noteFile.basename, cls: 'cpwn-note-title' });
        if (noteFile.parent && noteFile.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: noteFile.parent.path, cls: 'cpwn-note-path' });
        }

        itemEl.addEventListener('click', async (e) => {
            // Find the specific line where the asset is mentioned
            const cache = this.app.metadataCache.getFileCache(noteFile);
            let targetLine = 0;
            if (cache) {
                const allLinks = [...(cache.embeds || []), ...(cache.links || [])];
                for (const ref of allLinks) {
                    const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
                    if (linkedFile && linkedFile.path === assetFile.path) {
                        targetLine = ref.position.start.line;
                        break;
                    }
                }
            }

            // Use the centralized handler, passing the line number
            this.handleFileClick(noteFile, e, { line: targetLine });
            this.hideFilePopup();
        });
    }

    isImageAsset(file) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        return imageExtensions.includes(file.extension.toLowerCase());
    }

    async showNotePopup(targetEl, noteFile) {
        this.hideFilePopup(); // Clear any existing popups
        this.popupEl = document.body.createEl('div', { cls: 'cpwn-other-notes-popup' });

        // --- 1. Header with Note Basename and Path ---
        const headerRow = this.popupEl.createEl('div', { cls: 'cpwn-popup-header' });

        headerRow.addEventListener('click', () => this.hideFilePopup());
        const titleContainer = headerRow.createEl('div', { cls: 'cpwn-popup-title-container' });
        titleContainer.createEl('div', { text: noteFile.basename, cls: 'cpwn-popup-header-title' });

        const closeBtn = headerRow.createDiv({ cls: 'cpwn-popup-close-btn' });
        setIcon(closeBtn, 'x');
        closeBtn.addEventListener('click', () => this.hideFilePopup());

        const contentWrapper = this.popupEl.createEl('div', { cls: 'cpwn-popup-content-wrapper' });
        const cache = this.app.metadataCache.getFileCache(noteFile);

        // --- PRE-FETCH: Find linked assets first to decide if a separator is needed ---
        const linkedAssets = [];
        if (cache) {
            const allLinks = [...(cache.embeds || []), ...(cache.links || [])];
            for (const ref of allLinks) {
                const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
                if (linkedFile && !linkedFile.path.toLowerCase().endsWith('.md')) {
                    if (!linkedAssets.some(asset => asset.path === linkedFile.path)) {
                        linkedAssets.push(linkedFile);
                    }
                }
            }
        }

        // This flag determines if we need to show the separator.
        const hasAdditionalContent = linkedAssets.length > 0;

        // --- 2. File Details Section ---
        contentWrapper.createEl('h6', { text: 'Details', cls: 'cpwn-popup-section-header' });
        const infoContainer = contentWrapper.createDiv({ cls: 'cpwn-other-notes-popup-item is-clickable' });
        infoContainer.addEventListener('click', (e) => {
            this.handleFileClick(noteFile, e); // Use the new handler
            this.hideFilePopup();
        });

        setIcon(infoContainer, 'info');
        const infoWrapper = infoContainer.createEl('div', { cls: 'cpwn-note-title-path-wrapper' });

        const size = this.formatFileSize ? this.formatFileSize(noteFile.stat.size) : 'N/A';
        const created = this.formatDateTime ? this.formatDateTime(new Date(noteFile.stat.ctime)) : 'N/A';
        const modified = this.formatDateTime ? this.formatDateTime(new Date(noteFile.stat.mtime)) : 'N/A';

        infoWrapper.createDiv({ text: `Created: ${created}`, cls: 'cpwn-note-path' });
        infoWrapper.createDiv({ text: `Modified: ${modified}`, cls: 'cpwn-note-path' });
        infoWrapper.createDiv({ text: `Size: ${size}`, cls: 'cpwn-note-path' });
        infoWrapper.createDiv({ text: `Path: ${noteFile.path}`, cls: 'cpwn-note-path' });

        let tagsText = 'No tags';
        if (cache && cache.tags && cache.tags.length > 0) {
            const tagStrings = cache.tags.map(t => t.tag);
            const uniqueTags = [...new Set(tagStrings)].sort();
            tagsText = uniqueTags.join(', ');
        }
        infoWrapper.createDiv({ text: `Tags: ${tagsText}`, cls: 'cpwn-note-path' });

        // --- 3. CONDITIONAL SEPARATOR & ASSETS SECTION ---
        // Only add the separator and the assets section if there are assets to show.
        if (hasAdditionalContent) {
            contentWrapper.createDiv({ cls: 'cpwn-popup-separator' });

            contentWrapper.createEl('h6', { text: 'Assets in Note', cls: 'cpwn-popup-section-header' });
            linkedAssets.forEach(assetFile => {
                this._createAssetListItem(contentWrapper, assetFile);
            });
        }

        // --- 4. Footer with Actions ---
        const footer = this.popupEl.createDiv({ cls: 'cpwn-popup-actions-footer' });
        footer.createDiv({ style: 'flex-grow: 1' });
        const deleteBtn = footer.createDiv({ cls: 'cpwn-popup-action-icon-btn mod-danger' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete file');

        deleteBtn.addEventListener('click', () => {
            this.hideFilePopup();
            this.handleDeleteFile(noteFile);
        });

        // --- 5. Finalize and Display ---
        document.body.appendChild(this.popupEl);
        if (this.positionPopup) {
            this.positionPopup(targetEl);
        }

        this.popupEl.addEventListener('mouseenter', () => window.clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });
    }

    positionPopup(targetEl) {
        if (!this.popupEl) return;

        const popupRect = this.popupEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = this.plugin.settings.popupGap;
        let finalTop = targetRect.bottom + margin;

        // Standard overflow check (keep this)
        if (finalTop + popupRect.height > viewportHeight) {
            finalTop = targetRect.top - popupRect.height - margin;
        }

        // Mobile-specific logic to force to bottom half
        if (Platform.isMobile) {
            const viewportMidpoint = viewportHeight / 2;
            if (finalTop < viewportMidpoint) {
                finalTop = viewportMidpoint; // Force it to start at the halfway mark
            }
        }

        // Ensure it doesn't go off the top of the screen after the mobile adjustment
        if (finalTop < 0) {
            finalTop = margin;
        }

        // Adjust left position as before
        let finalLeft = targetRect.left;
        if (finalLeft + popupRect.width > viewportWidth) {
            finalLeft = targetRect.right - popupRect.width;
        }
        if (finalLeft < 0) {
            finalLeft = margin;
        }

        this.popupEl.classList.add('cpwn-context-menu');
        this.popupEl.style.setProperty('--menu-top', `${finalTop}px`);
        this.popupEl.style.setProperty('--menu-left', `${finalLeft}px`);
    }


    _createAssetListItem(container, assetFile) {
        const itemEl = container.createDiv({ cls: 'cpwn-other-notes-popup-item is-clickable' });

        // Show a thumbnail preview if it's an image asset
        if (this.isImageAsset(assetFile)) {
            const thumbnail = itemEl.createEl('img', { cls: 'cpwn-popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(assetFile);
        } else {
            setIcon(itemEl, 'file-text'); // Fallback icon for non-image files
        }

        // Display the asset's name and parent folder path
        const titlePathWrapper = itemEl.createDiv({ cls: 'cpwn-note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: assetFile.basename, cls: 'cpwn-note-title' });
        if (assetFile.parent && assetFile.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: assetFile.parent.path, cls: 'cpwn-note-path' });
        }

        // Add a click listener to open the asset file
        itemEl.addEventListener('click', (e) => {
            this.handleFileClick(assetFile, e); // Use the new handler
            this.hideFilePopup(); // Close the popup after clicking
        });

    }

    async showAssetPopup(targetEl, assetFile) {
        this.hideFilePopup();
        const backlinks = await this.findAssetBacklinks(assetFile);
        this.popupEl = createDiv({ cls: 'cpwn-other-notes-popup' });

        // --- 1. Header ---
        const headerRow = this.popupEl.createDiv({ cls: 'cpwn-popup-header' });
        const titleContainer = headerRow.createDiv({ cls: 'cpwn-popup-title-container' });
        titleContainer.createEl('div', { text: assetFile.name, cls: 'cpwn-popup-header-title' });
        const closeBtn = headerRow.createDiv({ cls: 'cpwn-popup-close-btn' });
        setIcon(closeBtn, 'x');
        headerRow.addEventListener('click', () => this.hideFilePopup());

        const contentWrapper = this.popupEl.createDiv({ cls: 'cpwn-popup-content-wrapper' });

        // --- 2. Asset Details & Preview ---
        contentWrapper.createEl('h6', { text: 'Details', cls: 'cpwn-popup-section-header' });
        const infoContainer = contentWrapper.createDiv({ cls: 'cpwn-other-notes-popup-item' });
        infoContainer.addEventListener('click', (e) => {
            this.handleFileClick(assetFile, e);
            this.hideFilePopup();
        });

        if (this.isImageAsset(assetFile)) {
            const thumbnail = infoContainer.createEl('img', { cls: 'cpwn-popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(assetFile);
        } else {
            setIcon(infoContainer, 'file-question');
        }
        const infoWrapper = infoContainer.createDiv({ cls: 'cpwn-note-title-path-wrapper' });
        infoWrapper.createDiv({ text: `Modified: ${this.formatDateTime(new Date(assetFile.stat.mtime))}`, cls: 'cpwn-note-path' });
        infoWrapper.createDiv({ text: `Size: ${this.formatFileSize(assetFile.stat.size)}`, cls: 'cpwn-note-path' });
        infoWrapper.createDiv({ text: `Path: ${assetFile.path}`, cls: 'cpwn-note-path' });

        // --- 3. Backlinks Section ---
        if (backlinks.length > 0) {
            contentWrapper.createDiv({ cls: 'cpwn-popup-separator' });
            contentWrapper.createEl('h6', { text: `Used in ${backlinks.length} note(s)`, cls: 'cpwn-popup-section-header' });
            backlinks.forEach(noteFile => {
                this._createBacklinkItem(contentWrapper, noteFile, assetFile);
            });
        }

        // --- 4. Actions Section ---
        const footer = this.popupEl.createDiv({ cls: 'cpwn-popup-actions-footer' });

        // Copy Link Button on the far left
        const copyBtn = footer.createDiv({ cls: 'cpwn-popup-action-icon-btn' });
        setIcon(copyBtn, 'copy');
        copyBtn.setAttribute('aria-label', 'Copy markdown link');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isImage = this.isImageAsset(assetFile);
            const link = this.app.fileManager.generateMarkdownLink(assetFile, '');
            const linkText = isImage ? `!${link}` : link;

            navigator.clipboard.writeText(linkText).then(() => {
                new Notice('Link copied to clipboard');
            }).catch(err => {
                new Notice('Failed to copy link');
                console.error('Failed to copy link: ', err);
            });
            this.hideFilePopup();
        });

        // Info message or a spacer to push the delete button away
        if (backlinks.length === 0) {
            const infoMessage = footer.createDiv({ cls: 'cpwn-popup-info-message', style: 'flex-grow: 1; text-align: center;' });
            setIcon(infoMessage, 'info');
            infoMessage.createEl('span', { text: 'Not used in any notes.' });
        } else {
            // This spacer pushes the delete button to the far right
            footer.createDiv({ style: 'flex-grow: 1;' });
        }

        // Delete icon button on the far right
        const deleteBtn = footer.createDiv({ cls: 'cpwn-popup-action-icon-btn mod-danger' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete asset');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideFilePopup();
            this.handleDeleteFile(assetFile);
        });

        // --- 5. Finalize and Display ---
        document.body.appendChild(this.popupEl);
        this.positionPopup(targetEl);
        this.popupEl.addEventListener('mouseenter', () => window.clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });
    }

    /**
     * Shows a confirmation modal and handles the permanent deletion of any file.
     * After deletion, it refreshes the notes and assets tabs.
     * @param {TFile} file - The file (note or asset) to delete.
     */
    async handleDeleteFile(file) {
        new ConfirmationModal(
            this.app,
            'Confirm deletion',
            `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
            async () => {
                try {
                    await this.app.vault.trash(file, true); // true for permanent deletion
                    new Notice(`Deleted: ${file.name}`);

                    // Refresh all relevant views
                    this.populateNotes();
                    this.populateAssets();

                    // Also refresh the calendar to remove any dots associated with the file
                    this.renderCalendar();

                } catch (err) {
                    new Notice(`Error deleting file: ${err.message}`);
                    console.error("Error during file deletion:", err);
                }
            },
            'Yes, delete'
        ).open();
    }

    /**
     * Formats a date to show time if it's today, otherwise shows the full date.
     * @param {Date} date The date to format.
     * @returns {string} The formatted date string.
     */
    formatDateTime(date) {
        if (!date) return 'N/A';
        // Ensure you are using the moment.js library instance available in Obsidian
        const momentDate = moment(date);
        if (momentDate.isSame(new Date(), 'day')) {
            return momentDate.format('HH:mm');
        }
        return momentDate.format('DD-MM-YYYY');
    }

    /**
     * Formats file size in bytes into a human-readable string (KB, MB, etc.).
     * @param {number} bytes The size of the file in bytes.
     * @returns {string} The formatted file size string.
     */
    formatFileSize(bytes) {
        if (bytes === undefined || bytes === null) return 'N/A';
        if (bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
    }

    applyPopupTrigger(element, file, type, isReorderable = false) {

        if (this.isReorderModeActive) {
            return; // Exit the function immediately
        }

        let longPressOccurred = false;
        const showPopup = () => {
            // This check ensures a setting for the new functionality exists.
            if (!this.plugin.settings.showNoteTooltips) return;

            if (type === 'note') {
                this.showNotePopup(element, file);
            } else { // 'asset'
                this.showAssetPopup(element, file);
            }
        };

        // 1. Mobile: Always use a long-press.
        if (Platform.isMobile) {
            let touchTimer;
            element.addEventListener('touchstart', () => {
                longPressOccurred = false;
                touchTimer = window.setTimeout(() => {
                    longPressOccurred = true;
                    // Special handling for reorderable items on mobile
                    if (isReorderable) {
                        if (navigator.vibrate) navigator.vibrate(50);
                        new Notice('Drag to reorder');
                    } else {
                        showPopup();
                    }
                }, 500);
            });

            const cancelTimer = () => window.clearTimeout(touchTimer);
            element.addEventListener('touchend', cancelTimer);
            element.addEventListener('touchmove', cancelTimer);
        } else {
            // 2. Desktop: Check the user's setting.
            if (this.plugin.settings.listPopupTrigger === 'hover') {
                let hoverTimeout;
                element.addEventListener('mouseenter', () => {
                    if (this.isDraggingNote || this.isPopupLocked || this.isMouseDown) return;
                    window.clearTimeout(this.hideTimeout);
                    this.hideFilePopup();
                    hoverTimeout = window.setTimeout(showPopup, this.plugin.settings.otherNoteHoverDelay);
                });
                element.addEventListener('mouseleave', () => {
                    window.clearTimeout(hoverTimeout);
                    this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                });
            } else { // 'rightclick'
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showPopup();
                });
            }
        }

        // --- Primary Click Action ---
        element.addEventListener('click', (e) => {
            if (longPressOccurred) {
                longPressOccurred = false; // Reset for the next interaction
                return;
            }

            // Prevent click action if a drag handle was the target
            if (this.isDraggingNote && e.target.closest('.cpwn-drag-handle')) {
                return;
            }

            // Use the new centralized handler
            this.handleFileClick(file, e);
        });
    }

    groupAssets(assets) {
        const groups = {};
        const groupOrderMap = new Map();

        assets.forEach(file => {
            const monthKey = moment(file.stat.mtime).format('YYYY-MM');
            if (!groups[monthKey]) {
                groups[monthKey] = [];
                groupOrderMap.set(monthKey, {
                    key: monthKey,
                    label: moment(file.stat.mtime).format('MMMM YYYY')
                });
            }
            groups[monthKey].push(file);
        });

        const groupOrder = Array.from(groupOrderMap.values())
            .sort((a, b) => b.key.localeCompare(a.key)); // Sort descending by "YYYY-MM"

        return { groups, groupOrder };
    }

    /**
     * Renders the list of recent assets in the "Assets" tab.
     */
    async populateAssets() {
        if (!this.assetsContentEl) return;
        this.assetsContentEl.empty();

        const settings = this.plugin.settings;
        let unusedAssetPaths = new Set();

        if (settings.showUnusedAssetsIndicator || this.assetsSearchTerm.toLowerCase() === 'status:unlinked') {
            if (!this.isUnusedAssetCacheValid) {
                this.unusedAssetPathsCache = await this.getUnusedAssetPaths();
                this.isUnusedAssetCacheValid = true;
            }
            unusedAssetPaths = this.unusedAssetPathsCache;
        }

        const cutoff = moment().subtract(settings.assetsLookbackDays, 'days');
        const ignoreFolders = settings.assetIgnoreFolders.map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const hiddenTypes = settings.hiddenAssetTypes.split(',').map(ext => ext.trim().toLowerCase()).filter(ext => ext.length > 0);

        const allAssets = this.app.vault.getFiles().filter(file => {
            if (file.path.toLowerCase().endsWith('.md') || hiddenTypes.includes(file.extension.toLowerCase())) return false;
            if (ignoreFolders.some(f => file.path.toLowerCase().startsWith(f))) return false;
            return moment(file.stat.mtime).isAfter(cutoff);
        });

        const searchTerm = this.assetsSearchTerm.toLowerCase();
        let filteredAssets;


        if (searchTerm === 'status:unlinked') {
            filteredAssets = allAssets.filter(file => unusedAssetPaths.has(file.path));
        } else if (searchTerm) {
            //filteredAssets = allAssets.filter(file => file.name.toLowerCase().includes(searchTerm));
            const parsedGroups = this.parseSearchQuery(searchTerm);
            filteredAssets = allAssets.filter(file =>
                searchTerm === "" ? true : this.searchMatches(file.name.toLowerCase(), parsedGroups)
            );

        } else {
            filteredAssets = allAssets;
        }

        filteredAssets.sort((a, b) => b.stat.mtime - a.stat.mtime);

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            lastWeek: [],
        };

        // Initialize the display order with the fixed recent categories.
        const groupOrder = [
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'thisWeek', label: 'This week' },
            { key: 'lastWeek', label: 'Last week' },
        ];

        const now = moment();
        const startOfThisWeek = now.clone().startOf('week');
        const startOfLastWeek = now.clone().subtract(1, 'week').startOf('week');

        // Dynamically add the last 12 months to our groups and order.
        // We start from the current month and go back.
        for (let i = 0; i < 12; i++) {
            const month = now.clone().subtract(i, 'months');
            const monthKey = month.format('YYYY-MM');
            if (!groups[monthKey]) {
                groups[monthKey] = [];
                groupOrder.push({ key: monthKey, label: month.format('MMMM YYYY') });
            }
        }

        groups['older'] = []; // Catch-all for anything older than 12 months.
        groupOrder.push({ key: 'older', label: 'Older' });

        // Iterate through the filtered assets and sort them into the groups.
        filteredAssets.forEach(file => {
            const modTime = moment(file.stat.mtime);
            // Prioritize the special recent groups first.
            if (modTime.isSame(now, 'day')) {
                groups.today.push(file);
            } else if (modTime.isSame(now.clone().subtract(1, 'day'), 'day')) {
                groups.yesterday.push(file);
            } else if (modTime.isAfter(startOfThisWeek)) {
                // More reliable check for This Week
                groups.thisWeek.push(file);
            } else if (modTime.isAfter(startOfLastWeek)) {
                // More reliable check for Last Week
                groups.lastWeek.push(file);
            } else {
                // If it's not in a recent group, find the correct month bucket.
                const monthKey = modTime.format('YYYY-MM');
                if (groups[monthKey]) {
                    groups[monthKey].push(file);
                } else {
                    // If it's older than our 12-month window, put it in the older bucket.
                    groups.older.push(file);
                }
            }
        });

        if (filteredAssets.length === 0) {
            const message = searchTerm === 'status:unlinked' ? 'No unlinked assets found.' : 'No assets found.';
            this.assetsContentEl.createDiv({ text: message, cls: 'cpwn-task-group-empty-message' });
            return;
        }

        // --- CHANGE 2: Initialize the IntersectionObserver ---
        this.assetObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const gridItem = entry.target;
                    const img = gridItem.querySelector('img[data-src]');
                    if (img) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(gridItem);
                }
            });
        }, {
            root: this.assetsContentEl,
            rootMargin: "100px"
        });

        groupOrder.forEach(groupInfo => {
            const assetsInGroup = groups[groupInfo.key];  // This line should already exist or add it here if missing

            if (assetsInGroup.length > 0) {
                const groupContainer = this.assetsContentEl.createDiv({ cls: 'cpwn-note-group-container' });

                // Your existing isCollapsed calculation here (from previous changes)
                const isMonthlyGroup = /^\d{4}-\d{2}$/.test(groupInfo.key);
                let isCollapsed;
                if (isMonthlyGroup) {
                    isCollapsed = this.collapsedAssetGroups[groupInfo.key] !== false;
                } else {
                    isCollapsed = this.collapsedAssetGroups[groupInfo.key] === true;
                }
                if (isCollapsed) groupContainer.addClass('cpwn-is-collapsed');

                // Header creation and click handler (unchanged from previous)
                const header = groupContainer.createDiv({ cls: 'cpwn-note-group-header' });
                const headerContent = header.createDiv({ cls: 'cpwn-note-group-header-content' });
                const collapseIcon = headerContent.createDiv({ cls: 'cpwn-note-group-collapse-icon' });
                setIcon(collapseIcon, 'chevron-down');
                headerContent.createSpan({ text: groupInfo.label });
                header.createDiv({ cls: 'cpwn-note-group-count', text: assetsInGroup.length.toString() });

                header.addEventListener('click', () => {
                    const isCurrentlyCollapsed = groupContainer.classList.toggle('cpwn-is-collapsed');
                    this.collapsedAssetGroups[groupInfo.key] = isCurrentlyCollapsed;
                    this.plugin.saveSettings();

                    // NEW: Re-observe lazy-loaded images after expansion (fixes cutoff/blank images)
                    if (!isCurrentlyCollapsed && this.isAssetsGridView) {
                        window.setTimeout(() => {
                            const gridItems = groupContainer.querySelectorAll('.cpwn-asset-grid-item img[data-src]');
                            gridItems.forEach(img => {
                                if (img.dataset.src) {  // Only observe unloaded images
                                    this.assetObserver.observe(img.closest('.cpwn-asset-grid-item'));
                                }
                            });
                        }, 150);  // Slightly longer delay for smooth CSS transition
                    }
                });

                const listWrapper = groupContainer.createDiv({ cls: 'cpwn-note-list-wrapper' });

                if (this.isAssetsGridView) {
                    listWrapper.addClass('assets-grid-view');
                    assetsInGroup.forEach(file => {
                        const item = listWrapper.createDiv({ cls: 'cpwn-asset-grid-item' });
                        this.applyPopupTrigger(item, file, 'asset');

                        const preview = item.createDiv({ cls: 'cpwn-asset-grid-preview' });
                        if (this.isImageAsset(file)) {
                            const thumbnail = preview.createEl('img', { attr: { 'data-src': this.app.vault.getResourcePath(file) } });
                            thumbnail.alt = file.name;  // For accessibility
                            // Observer will load this on visibility
                        } else {
                            setIcon(preview, 'file-question');
                        }
                        item.createDiv({ text: file.name, cls: 'cpwn-asset-grid-name' });

                        // NEW: Initially observe all new grid items for lazy loading
                        this.assetObserver.observe(item);
                    });
                } else {
                    listWrapper.removeClass('assets-grid-view');
                    assetsInGroup.forEach(file => {
                        const row = listWrapper.createDiv({ cls: 'cpwn-note-row' });
                        this.applyPopupTrigger(row, file, 'asset');

                        const isUnused = unusedAssetPaths.has(file.path);
                        const titleWrapper = row.createDiv({ cls: 'cpwn-note-title-wrapper' });
                        const iconContainer = titleWrapper.createDiv({ cls: 'cpwn-asset-icon-container' });

                        if (this.isImageAsset(file)) {
                            const thumbnail = iconContainer.createEl('img', { cls: 'cpwn-asset-thumbnail' });
                            thumbnail.src = this.app.vault.getResourcePath(file);
                        } else {
                            setIcon(iconContainer, 'file-text');
                        }

                        iconContainer.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.handleFileClick(file, e);
                        });

                        if (isUnused && settings.showUnusedAssetsIndicator) {
                            const actionIconContainer = titleWrapper.createDiv({ cls: 'cpwn-asset-action-icon' });
                            setIcon(actionIconContainer, 'trash');
                            actionIconContainer.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.handleDeleteFile(file);
                            });
                        }

                        titleWrapper.createDiv({ text: file.name, cls: 'cpwn-note-title' });

                        const metaContainer = row.createDiv({ cls: 'note-meta-container' });
                        metaContainer.createSpan({ text: this.formatFileSize(file.stat.size), cls: 'note-file-size' });
                        metaContainer.createSpan({ text: this.formatDateTime(new Date(file.stat.mtime)), cls: 'note-mod-date' });
                    });
                }
            }
        });
        this.assetsContentEl.style.opacity = '0';
        requestAnimationFrame(() => {
            this.assetsContentEl.style.transition = 'opacity 0.2s';
            this.assetsContentEl.style.opacity = '1';
        });
    }

    /**
     * Gets the final, ordered list of tabs to display, combining user-defined order
     * with the full list of possible tabs to ensure none are missing.
     * @returns {string[]} An array of tab keys in the correct order.
     */
    getFinalTabOrder() {
        const allPossibleTabs = Object.keys(this.plugin.settings.tabVisibility);
        const userTabOrder = this.plugin.settings.tabOrder || allPossibleTabs;
        // Use a Set to merge the user's order with all possible tabs, ensuring no duplicates and that new tabs are appended.
        const finalTabOrder = [...new Set([...userTabOrder, ...allPossibleTabs])];
        return finalTabOrder;
    }

    /**
     * Adds a non-Markdown file to the `assetCreationMap`.
     * @param {TFile} file The asset file to add.
     */
    addFileToAssetMap(file) {
        if (file.path.toLowerCase().endsWith('.md')) return;

        const ignoreFolders = (this.plugin.settings.assetIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const filePathLower = file.path.toLowerCase();
        if (ignoreFolders.some(folder => folder && filePathLower.startsWith(folder))) return;

        const cdate = new Date(file.stat.ctime);
        const dateKey = moment(cdate).format("YYYY-MM-DD");
        if (!this.assetCreationMap.has(dateKey)) {
            this.assetCreationMap.set(dateKey, []);
        }
        const assets = this.assetCreationMap.get(dateKey);
        if (!assets.some(f => f.path === file.path)) {
            assets.push(file);
        }
    }

    /**
     * Removes a non-Markdown file from the `assetCreationMap` by its path.
     * @param {string} filePath The path of the asset file to remove.
     */
    removeFileFromAssetMap(filePath) {
        if (filePath.toLowerCase().endsWith('.md')) return;

        for (const [key, files] of this.assetCreationMap.entries()) {
            const updatedFiles = files.filter(f => f.path !== filePath);
            if (updatedFiles.length < files.length) {
                if (updatedFiles.length === 0) {
                    this.assetCreationMap.delete(key);
                } else {
                    this.assetCreationMap.set(key, updatedFiles);
                }
            }
        }
    }

    /**
     * Adds hover event listeners to table headers to highlight the entire column.
     * This version fixes two bugs:
     * 1. A race condition on initial load by querying for rows inside the event listener.
     * 2. A state conflict by intelligently restoring the current week highlight on mouseleave.
     *
     * @param {HTMLTableRowElement} headerRow The <tr> element containing the header cells.
     * @param {HTMLTableSectionElement} tableBody The <tbody> element of the calendar table.
     */
    addColumnHighlighting(headerRow, tableBody) {
        if (!this.plugin.settings.enableColumnHighlight) return;

        const headerCells = headerRow.querySelectorAll("th");
        const highlightColor = document.body.classList.contains('cpwn-theme-dark')
            ? this.plugin.settings.rowHighlightColorDark
            : this.plugin.settings.rowHighlightColorLight;

        headerCells.forEach((th, colIndex) => {
            if (!th.textContent.trim()) return;

            th.addEventListener('mouseenter', () => {
                const rows = tableBody.querySelectorAll('tr');
                th.classList.add('column-hover');
                rows.forEach(row => row.children[colIndex]?.classList.add('column-hover'));
            });

            th.addEventListener('mouseleave', () => {
                const rows = tableBody.querySelectorAll('tr');
                th.classList.remove('column-hover');
                rows.forEach(row => row.children[colIndex]?.classList.remove('column-hover'));
            });
        });
    }


    /**
     * Populates a given HTML element with the styled month and year title,
     * respecting all user settings. This is the single source of truth for all titles.
     * @param {HTMLElement} targetEl The element to populate.
     * @param {Date} date The date to display.
     */
    populateStyledTitle(targetEl, date) {
        if (!targetEl) return;

        targetEl.empty();

        const format = this.plugin.settings.monthTitleFormat || "MMMM YYYY";
        const formatParts = format.split(' ');

        formatParts.forEach((part, index) => {
            const isYear = /[Yy]/.test(part);

            targetEl.createSpan({
                cls: isYear ? 'cpwn-month-title-year' : 'cpwn-month-title-month',
                text: moment(date).format(part)
            });

            // If this is not the last part, append a NON-BREAKING space.
            // This is the only reliable way to ensure a space is rendered in a flex container.
            if (index < formatParts.length - 1) {
                targetEl.appendText('\u00A0'); // This is the unicode for a non-breaking space (&nbsp;)
            }
        });
    }


    /**
     * Formats the period and week numbers according to the user's preference.
     * @param {number} period The period number.
     * @param {number} week The week number.
     * @returns {string} The formatted string.
     */
    formatPW(period, week) { return this.plugin.settings.pwFormat.replace('#', period).replace('#', week); }

    /**
     * Renders the infinite-scrolling vertical calendar view.
     * @param {HTMLElement} container The parent element to render into.
     */
    renderVerticalCalendar(container) {
        this.intersectionObserver?.disconnect();

        // FIX 1: The variable is now a class property `this.verticalScrollerEl`
        this.verticalScrollerEl = container.createDiv("cpwn-vertical-calendar-scroller");

        const initialMonthId = `cpwn-month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
        const numMonthsAfter = 12;
        for (let i = -6; i <= numMonthsAfter; i++) {
            const monthDate = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() + i, 1);

            // FIX 2: Use the new class property here
            const monthWrapper = this.verticalScrollerEl.createDiv({ cls: "cpwn-vertical-month-wrapper" });

            monthWrapper.id = `cpwn-month-${monthDate.getFullYear()}-${monthDate.getMonth()}`;

            // Create the month title heading for the vertical list.
            const monthTitleEl = monthWrapper.createEl("h3", {
                cls: "cpwn-vertical-month-title",
                // Set the initial text using the simple formatter.
                text: formatMonthTitle(monthDate, this.plugin.settings.monthTitleFormat)
            });
            monthTitleEl.classList.add('cpwn-clickable');

            let hoverTimeout;

            monthTitleEl.addEventListener('mouseenter', () => {
                // After 400ms, use our new helper to build the perfectly consistent, styled title.
                hoverTimeout = window.setTimeout(() => {
                    this.populateStyledTitle(monthTitleEl, monthDate);
                }, 500);
            });

            monthTitleEl.addEventListener('mouseleave', () => {
                window.clearTimeout(hoverTimeout);
                // On leave, revert back to the simple text format.
                monthTitleEl.empty();
                monthTitleEl.setText(formatMonthTitle(monthDate, this.plugin.settings.monthTitleFormat));
            });

            monthTitleEl.addEventListener('click', () => {
                // Click logic remains the same.
                this.displayedMonth = monthDate;
                this.isVerticalView = false;
                this.render();
            });

            const table = monthWrapper.createEl("table", { cls: "cpwn-period-calendar-table" });
            const thead = table.createEl("thead");
            const headerRow = thead.createEl("tr");

            if (this.plugin.settings.showPWColumn) {
                headerRow.createEl("th", { text: " " });
            }
            if (this.plugin.settings.showWeekNumbers) {
                headerRow.createEl("th", { text: this.plugin.settings.weekNumberColumnLabel });
            }
            const startDayOffset = this.plugin.settings.weekStartDay === 'monday' ? 1 : 0;
            for (let d = 0; d < 7; d++) {
                const dayIndex = (d + startDayOffset) % 7;
                headerRow.createEl("th", { text: moment().day(dayIndex).format("ddd").toUpperCase() });
            }

            // Add today's header highlight
            if (this.plugin.settings.highlightTodayDayHeader) {
                const today = new Date();
                if (monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth()) {
                    const todayHeaderIndex = Array.from(headerRow.children).findIndex(th => th.textContent.toLowerCase() === moment(today).format("ddd").toLowerCase());
                    if (todayHeaderIndex !== -1) {
                        headerRow.children[todayHeaderIndex].addClass("cpwn-today-day-header");
                    }
                }
            }

            const tbody = table.createEl("tbody");
            this.generateMonthGrid(monthDate, tbody);
            this.addColumnHighlighting(headerRow, tbody);
        }

        // After the layout is ready, scroll the initial month into view.
        this.app.workspace.onLayoutReady(() => {
            // SET FLAG before scrolling
            this.isProgrammaticScroll = true;

            const initialEl = this.verticalScrollerEl.querySelector(`#${initialMonthId}`);
            if (initialEl) {
                initialEl.scrollIntoView({ block: 'start' });
            }

            // CLEAR FLAG after scroll completes
            window.setTimeout(() => {
                this.isProgrammaticScroll = false;
            }, 300);
        });

        // Use a scroll listener to update the main header title.
        this.verticalScrollerEl.addEventListener('scroll', () => {
            // if programmatic scroll is in progress, do nothing
            if (this.isProgrammaticScroll) return;

            window.clearTimeout(this.titleUpdateTimeout);
            this.titleUpdateTimeout = window.setTimeout(() => {
                let topmostVisibleMonth = null;
                let smallestTopValue = Infinity;
                const scrollerTop = this.verticalScrollerEl.getBoundingClientRect().top;
                const monthElements = this.verticalScrollerEl.querySelectorAll('.cpwn-vertical-month-wrapper');

                for (const monthEl of monthElements) {
                    const monthTop = monthEl.getBoundingClientRect().top;
                    if (monthTop < scrollerTop && monthTop > smallestTopValue) {
                        smallestTopValue = monthTop;
                        topmostVisibleMonth = monthEl;
                    }
                }

                if (topmostVisibleMonth) {
                    const [, year, month] = topmostVisibleMonth.id.split('-').map(Number);
                    if (this.displayedMonth.getFullYear() !== year || this.displayedMonth.getMonth() !== month) {
                        this.displayedMonth = new Date(year, month, 1);
                        this.updateMonthTitle();
                        this.updateTodayBtnAriaLabel();
                    }
                }
            }, 100);
        });
    }

    async onclose() {
        this.assetObserver?.disconnect();
        this.intersectionObserver?.disconnect();
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        if (this.dailyRefreshTimeout) window.clearTimeout(this.dailyRefreshTimeout);
        if (this.statusBarObserver) this.statusBarObserver.disconnect();
    }

    /**
    * A helper function to create a standardized search input with a clear button.
    * @param {HTMLElement} container The parent element.
    * @param {string} placeholder The placeholder text for the input.
    * @param {(term: string) => void} onInput The callback function to execute on input.
    * @returns {HTMLInputElement} The created input element.
    */
    setupSearchInput(container, placeholder, suggestionItems, onInput) {
        const inputEl = container.createEl("input", {
            type: "text",
            placeholder: placeholder,
            cls: "cpwn-pm-search-input" // Use a consistent class
        });

        // Attach the suggester, passing the onInput callback to be used upon selection.
        if (suggestionItems && suggestionItems.length > 0) {
            new FilterSuggest(this.app, inputEl, suggestionItems, onInput);
        }

        // Create the clear button inside this function
        const clearButton = container.createDiv({ cls: "cpwn-search-input-clear-btn" });
        setIcon(clearButton, "x");

        clearButton.addEventListener('click', () => {
            const wasFocused = document.activeElement === inputEl;

            inputEl.value = "";
            inputEl.dispatchEvent(new Event('input'));

            if (wasFocused) {
                inputEl.focus();
            }
        });

        inputEl.addEventListener("input", (e) => {
            const term = e.target.value;
            clearButton.style.visibility = term ? 'visible' : 'hidden';
            onInput(term);
        });

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                inputEl.value = '';
                inputEl.dispatchEvent(new Event('input'));
            } else if (e.key === 'Enter') {
                // Check if the suggester is active. If so, let it handle the event.
                const suggester = this.app.workspace.activeEditorSuggest;
                if (!suggester || !suggester.isOpen) {
                    e.preventDefault();
                    onInput(inputEl.value); // Manually trigger search on Enter
                }
            } else if (e.key === 'ArrowDown') {
                // Check if the suggester is active. If so, do not interfere.
                const suggester = this.app.workspace.activeEditorSuggest;
                if (suggester && suggester.isOpen) {
                    return;
                }

                // If no suggester, proceed with custom navigation.
                e.preventDefault();
                const contentEl = this.activeTab === 'notes' ? this.notesContentEl : this.tasksContentEl;
                const firstItem = contentEl.querySelector('.cpwn-note-row, .cpwn-task-row');
                if (firstItem) {
                    firstItem.focus();
                }
            }
        });

        if (this.app.isMobile) {
            inputEl.addEventListener('focus', () => {
                this.calendarWasCollapsedForEditing = true;
                // This call handles state, class, AND icon.
                this.toggleCalendar(true);
            });

            inputEl.addEventListener('blur', (e) => {
                // Prevent race condition
                if (e.relatedTarget === this.collapseBtn) return;

                // Otherwise, proceed with auto-expansion logic.
                if (this.calendarWasCollapsedForEditing) {
                    this.calendarWasCollapsedForEditing = false;
                    this.toggleCalendar(false);
                }
            });
        }
        return inputEl;
    }

    /**
     * Sets up the tab container, creating draggable tabs with click and double-click behaviors.
     * @param {HTMLElement} tabContainer The parent element for the tabs.
     * @param {(tab: string) => void} switchTabs The function to call when a tab is clicked.
     * @returns {Object.<string, HTMLElement>} A map of tab keys to their corresponding HTML elements.
     */
    setupDraggableTabs(tabContainer, switchTabs) {
        tabContainer.empty();
        const tabOrder = this.getFinalTabOrder()
            .filter(key => this.plugin.settings.tabVisibility[key]);

        const tabElements = {};
        const tooltipLabels = {
            scratch: "Scratchpad",
            notes: "Recent notes",
            pinned: "Pinned notes",
            tasks: "Tasks",
            assets: "Assets",
            dashboard: 'Dashboard'
        };

        for (const key of tabOrder) {
            const tabEl = tabContainer.createDiv({ cls: "cpwn-note-tab" });
            this.getTabLabel(tabEl, key);
            tabEl.dataset.tabKey = key;

            const initialTooltip = key === 'notes'
                ? (this.notesViewMode === 'pinned' ? tooltipLabels.pinned : tooltipLabels.notes)
                : tooltipLabels[key];
            tabEl.setAttribute('aria-label', initialTooltip);

            tabElements[key] = tabEl;

            tabEl.addEventListener("click", async (e) => {
                if (key === 'scratch' && e.shiftKey) {
                    this.openScratchpadFile(true); // Force new tab
                    return;
                }

                if (this.activeTab === key) {
                    // This is a second click on an already active tab, which triggers a special action.
                    if (key === 'scratch') {
                        this.openScratchpadFile();
                    } else if (key === 'tasks') {
                        const currentGroupBy = this.plugin.settings.taskGroupBy;
                        const newGroupBy = currentGroupBy === 'date' ? 'tag' : 'date';
                        this.plugin.settings.taskGroupBy = newGroupBy;

                        await this.plugin.saveData(this.plugin.settings);
                        this.getTabLabel(tabEl, 'tasks');
                        await this.populateTasks();

                    } else if (key === 'assets') {
                        this.isAssetsGridView = !this.isAssetsGridView;
                        this.getTabLabel(tabEl, 'assets');
                        await this.populateAssets();
                        this.isAssetsGridView ? 'grid' : 'list';
                    } else if (key === 'notes') {
                        this.notesViewMode = this.notesViewMode === 'recent' ? 'pinned' : 'recent';
                        this.plugin.settings.notesViewMode = this.notesViewMode;
                        await this.plugin.saveData(this.plugin.settings);

                        this.getTabLabel(tabEl, 'notes');
                        const newTooltip = this.notesViewMode === 'pinned' ? tooltipLabels.pinned : tooltipLabels.notes;
                        tabEl.setAttribute('aria-label', newTooltip);

                        if (this.notesSearchInputEl) {
                            this.notesSearchInputEl.placeholder = this.notesViewMode === 'pinned' ? 'Filter pinned notes...' : 'Filter recent notes...';
                        }

                        await this.populateNotes();
                    } else if (key === 'dashboard') {

                        // Toggle between the two dashboard views
                        this.dashboardViewMode = this.dashboardViewMode === 'creation' ? 'tasks' : 'creation';
                        this.getTabLabel(tabEl, 'dashboard');
                        if (this.dashboardViewMode === 'tasks') { this.lastTasksState = ''; }

                        await this.populateDashboard();

                    }
                } else {
                    // This is a first click, just switch to the tab.
                    switchTabs(key);
                }
            });

            tabEl.draggable = true;
            tabEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', key);
                e.dataTransfer.effectAllowed = 'move';
                window.setTimeout(() => tabEl.classList.add('dragging'), 0);
            });

            tabEl.addEventListener('dragend', () => tabEl.classList.remove('dragging'));

            tabEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                const rect = target.getBoundingClientRect();
                const isAfter = e.clientX > rect.left + rect.width / 2;

                target.classList.remove('drag-over-indicator-before', 'drag-over-indicator-after');
                if (isAfter) {
                    target.classList.add('drag-over-indicator-after');
                } else {
                    target.classList.add('drag-over-indicator-before');
                }
            });

            tabEl.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('drag-over-indicator-before', 'drag-over-indicator-after');
            });

            tabEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over-indicator-before', 'drag-over-indicator-after');

                const draggedKey = e.dataTransfer.getData('text/plain');
                const targetKey = e.currentTarget.dataset.tabKey;
                if (draggedKey === targetKey) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const isAfter = e.clientX > rect.left + rect.width / 2;

                let currentOrder = this.plugin.settings.tabOrder;
                const newOrder = currentOrder.filter(k => k !== draggedKey);
                const targetIndex = newOrder.indexOf(targetKey);

                if (isAfter) {
                    newOrder.splice(targetIndex + 1, 0, draggedKey);
                } else {
                    newOrder.splice(targetIndex, 0, draggedKey);
                }

                this.plugin.settings.tabOrder = newOrder;
                await this.plugin.saveData(this.plugin.settings);

                newOrder.forEach(k => tabContainer.appendChild(tabElements[k]));
            });
        }
        return tabElements;
    }

    updateDayHeaderHighlight() {
        // 1. If the header row doesn't exist yet, do nothing.
        if (!this.calendarHeaderRowEl) return;

        // 2. Get all the header cells ('th' elements).
        const headers = this.calendarHeaderRowEl.querySelectorAll('th');
        const today = new Date();

        // 3. IMPORTANT: Remove the highlight from every header first to reset them.
        headers.forEach(th => th.classList.remove('cpwn-today-day-header'));

        // 4. If the user has this feature turned off in settings, stop here.
        if (!this.plugin.settings.highlightTodayDayHeader) {
            return;
        }

        // 5. Check if the month/year being displayed is the actual current month/year.
        const isCurrentMonth = this.displayedMonth.getFullYear() === today.getFullYear() &&
            this.displayedMonth.getMonth() === today.getMonth();

        // 6. Only if it IS the current month, apply the highlight.
        if (isCurrentMonth) {
            const todayDayOfWeek = today.getDay(); // Sunday=0, Monday=1...
            const weekStartsOnMonday = this.plugin.settings.weekStartDay === 'monday';

            let todayColumnIndex;
            if (weekStartsOnMonday) {
                todayColumnIndex = (todayDayOfWeek === 0) ? 6 : todayDayOfWeek - 1; // Mon=0, Tue=1..Sun=6
            } else {
                todayColumnIndex = todayDayOfWeek; // Sun=0, Mon=1...
            }

            // Account for the extra columns you might have (PW, WeekNr)
            let offset = 0;
            if (this.plugin.settings.showPWColumn) offset++;
            if (this.plugin.settings.showWeekNumbers) offset++;

            const targetTh = headers[todayColumnIndex + offset];
            if (targetTh) {
                targetTh.classList.add('cpwn-today-day-header');
            }
        }
    }

    /**
     * The main render function for the entire view. It builds the DOM from scratch.
     */
    async render() {
        // Determine the first visible tab to be the default active tab.
        const finalTabOrder = this.getFinalTabOrder();
        const visibleTabs = finalTabOrder.filter(key => this.plugin.settings.tabVisibility[key]);

        // Only reset the active tab if it's not set or has become invisible
        if (!this.activeTab || !visibleTabs.includes(this.activeTab)) {
            this.activeTab = visibleTabs[0] || null;
        }

        this.containerEl.empty();
        const container = this.containerEl.createDiv("cpwn-period-month-container");
        container.addClass(`layout-${this.plugin.settings.calendarLayout}`);
        container.addClass(`today-style-${this.plugin.settings.todayHighlightStyle}`);
        container.toggleClass("hide-grid", !this.plugin.settings.showCalendarGridLines);
        container.classList.toggle("cpwn-calendar-collapsed", this.isCalendarCollapsed);
        container.toggleClass("cpwn-vertical-view-active", this.isVerticalView);
        container.toggleClass('monday-start', this.plugin.settings.weekStartDay === 'monday');

        // Add weekend shading classes
        if (this.plugin.settings.highlightWeekends) {
            container.addClass('weekend-shading-enabled');
        }

        if (this.plugin.settings.showPWColumn) {
            container.addClass('has-pw-column');
        }

        if (this.plugin.settings.showWeekNumbers) {
            container.addClass('has-week-numbers');
        }

        // --- Header and Navigation ---
        const headerDiv = container.createDiv("cpwn-month-header");
        this.monthNameEl = headerDiv.createDiv({ cls: "cpwn-month-header-title" });
        this.updateMonthTitle();
        this.monthNameEl.addEventListener('click', () => {
            // SET THE FLAG before switching views
            this.isProgrammaticScroll = true;

            this.isVerticalView = !this.isVerticalView;
            this.render();

            // CLEAR THE FLAG after render and initial scroll complete
            window.setTimeout(() => {
                this.isProgrammaticScroll = false;
            }, 800);  // Longer delay for initial view render on mobile
        });
        const navDiv = headerDiv.createDiv({ cls: "cpwn-month-header-nav" });

        const backBtn = navDiv.createEl("button");
        backBtn.setAttribute("aria-label", "Previous month");
        setIcon(backBtn, "chevron-left");
        backBtn.addEventListener('click', () => {
            if (this.isVerticalView) {
                // SET FLAG
                this.isProgrammaticScroll = true;

                this.displayedMonth.setMonth(this.displayedMonth.getMonth() - 1, 1);

                const targetMonthId = `cpwn-month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
                const targetEl = this.verticalScrollerEl?.querySelector(`#${targetMonthId}`);

                if (targetEl) {
                    targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    this.updateMonthTitle();
                    this.updateTodayBtnAriaLabel();

                    // CLEAR FLAG
                    window.setTimeout(() => {
                        this.isProgrammaticScroll = false;
                    }, 500);
                }
            } else {
                this.changeMonth(-1);
            }
        });
        // Store reference and add new event listener for the "Today" button
        const todayBtn = navDiv.createEl('button');
        this.todayBtn = todayBtn;
        setIcon(todayBtn, 'calendar-days');

        // Apply initial style and ARIA label on render
        if (this.isPopupLocked) {
            this.todayBtn.classList.add('cpwn-popup-locked');
        }
        this.updateTodayBtnAriaLabel();

        todayBtn.addEventListener('click', () => {

            this.goToCurrentMonth();

        });

        // Ensure the button style is correct on re-render
        if (this.isPopupLocked) {
            this.todayBtn.classList.add('cpwn-popup-locked');
        }

        const forwardBtn = navDiv.createEl("button");
        forwardBtn.setAttribute("aria-label", "Next month");
        setIcon(forwardBtn, "chevron-right");
        forwardBtn.addEventListener('click', () => {
            if (this.isVerticalView) {
                // SET FLAG
                this.isProgrammaticScroll = true;
                this.displayedMonth.setMonth(this.displayedMonth.getMonth() + 1, 1);

                const targetMonthId = `cpwn-month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
                const targetEl = this.verticalScrollerEl?.querySelector(`#${targetMonthId}`);

                if (targetEl) {
                    targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    this.updateMonthTitle();
                    this.updateTodayBtnAriaLabel();

                    // CLEAR FLAG
                    window.setTimeout(() => {
                        this.isProgrammaticScroll = false;
                    }, 500);
                }
            } else {
                this.changeMonth(1);
            }
        });

        const collapseBtn = navDiv.createEl("button");
        this.collapseBtn = collapseBtn;
        collapseBtn.setAttribute("aria-label", "Toggle calendar visibility");
        setIcon(this.collapseBtn, 'chevron-down');

        this.collapseBtn.addEventListener('click', () => {
            // This is a manual user action, so reset the "editing" flag.
            this.calendarWasCollapsedForEditing = false;

            // Use the helper to toggle to the opposite of the current state.
            this.toggleCalendar(!this.isCalendarCollapsed);

            // If the result of the toggle is that the calendar is now expanded,
            // dismiss any active keyboard.
            if (!this.isCalendarCollapsed) {
                this.blurActiveInput();
            }
        });

        // --- Calendar Rendering (Vertical or Horizontal) ---
        if (this.isVerticalView) {
            this.renderVerticalCalendar(container);
        } else {
            const tableWrapper = container.createDiv({ cls: "cpwn-calendar-table-wrapper" });
            const table = tableWrapper.createEl("table", { cls: "cpwn-period-calendar-table" });
            this.attachSwipeListeners(tableWrapper, headerDiv);
            const thead = table.createEl('thead');
            this.calendarHeaderRowEl = thead.createEl('tr');

            if (this.plugin.settings.showPWColumn) {
                this.calendarHeaderRowEl.createEl('th', { text: '' });
            }
            if (this.plugin.settings.showWeekNumbers) {
                this.calendarHeaderRowEl.createEl('th', { text: this.plugin.settings.weekNumberColumnLabel });
            }

            const startDayOffset = this.plugin.settings.weekStartDay === 'monday' ? 1 : 0;
            for (let d = 0; d < 7; d++) {
                const dayIndex = (d + startDayOffset) % 7;
                // Note: The highlighting logic has been completely removed from this loop
                this.calendarHeaderRowEl.createEl('th', { text: moment().day(dayIndex).format('ddd').toUpperCase() });
            }

            this.calendarBodyEl = table.createEl("tbody");
            this.renderCalendar();
            window.setTimeout(() => {
                this.addColumnHighlighting(this.calendarHeaderRowEl, this.calendarBodyEl);
            }, 0);
            // Add this line right here to set the highlight correctly on the first load
            this.updateDayHeaderHighlight();

            // --- Tabs and Content Panels ---
            const tabWrapper = container.createDiv("cpwn-tabs-content-wrapper");
            const areTabsVisible = Object.values(this.plugin.settings.tabVisibility).some(visible => visible);
            if (!areTabsVisible) {
                tabWrapper.classList.add('cpwn-hidden');
            } else {
                container.addClass("tabs-are-visible");
            }

            const tabHeader = tabWrapper.createDiv("cpwn-note-tab-header");
            const tabContainer = tabHeader.createDiv("cpwn-tab-container");
            const searchWrapper = tabHeader.createDiv("cpwn-search-wrapper");

            const scratchpadSearchContainer = searchWrapper.createDiv({ cls: "cpwn-pm-search-container" });
            const notesSearchContainer = searchWrapper.createDiv({ cls: "cpwn-pm-search-container" });
            const assetsSearchContainer = searchWrapper.createDiv({ cls: "cpwn-pm-search-container" });
            const tasksSearchContainer = searchWrapper.createDiv({ cls: "cpwn-pm-search-container" });
            const dashboardSearchContainer = searchWrapper.createDiv({ cls: "cpwn-pm-search-container" });

            // -- CONTENT PANELS --
            this.scratchWrapperEl = tabWrapper.createDiv({ cls: "cpwn-scratchpad-wrapper" });
            this.renderScratchpadContent();

            this.notesContentEl = tabWrapper.createDiv({ cls: "cpwn-notes-container" });
            this.assetsContentEl = tabWrapper.createDiv({ cls: "cpwn-notes-container" });
            this.tasksContentEl = tabWrapper.createDiv({ cls: "cpwn-tasks-container" });
            this.dashboardContentEl = tabWrapper.createDiv({ cls: "cpwn-pm-tab-content" });

            this.taskRefreshIndicator = tabWrapper.createDiv({ cls: 'cpwn-pm-refresh-indicator' });
            setIcon(this.taskRefreshIndicator, 'arrow-down');

            // Function to handle switching between tabs.
            const switchTabs = (tab) => {

                this.activeTab = tab;
                Object.values(tabElements).forEach(el => el.removeClass("active"));
                if (tabElements[tab]) tabElements[tab].addClass("active");

                // Toggle visibility of content panels and their corresponding search bars.
                this.scratchWrapperEl.style.display = (tab === "scratch") ? "grid" : "none";
                this.notesContentEl.style.display = (tab === "notes") ? "block" : "none";
                this.assetsContentEl.style.display = (tab === "assets") ? "" : "none";
                this.tasksContentEl.style.display = (tab === "tasks") ? "block" : "none";
                this.dashboardContentEl.style.display = (tab === 'dashboard') ? 'block' : 'none';

                scratchpadSearchContainer.style.display = (tab === "scratch") ? "flex" : "none";
                notesSearchContainer.style.display = (tab === "notes") ? "flex" : "none";
                assetsSearchContainer.style.display = (tab === "assets") ? "flex" : "none";
                tasksSearchContainer.style.display = (tab === "tasks") ? "flex" : "none";
                dashboardSearchContainer.style.display = (tab === "dashboard") ? "flex" : "none";

                // Populate the content of the newly activated tab.
                if (tab === "notes") this.populateNotes();
                if (tab === "assets") this.populateAssets();
                if (tab === "tasks") this.populateTasks();
                if (tab === 'dashboard') {
                    // Set the view to the user's default before populating
                    if (!this.dashboardViewMode) {
                        this.dashboardViewMode = this.plugin.settings.defaultDashboardView;
                    }

                    // Reset lastTasksState if switching to tasks view
                    if (this.dashboardViewMode === 'tasks') { this.lastTasksState = ''; }

                    // Now, always re-render the label and content based on the CURRENT state.
                    // This ensures it remembers if you've toggled it.
                    this.getTabLabel(tabElements['dashboard'], 'dashboard');
                    this.populateDashboard();
                }
            };

            const tabElements = this.setupDraggableTabs(tabContainer, switchTabs);

            // -- SEARCH LOGIC --
            this.scratchpadSearchInputEl = this.setupSearchInput(
                scratchpadSearchContainer,
                'Search scratchpad...',
                [],
                (term) => {
                    this.scratchpadSearchTerm = term;
                    this.updateScratchpadHighlights();
                }
            );

            // This is a logic bug from the original code; this needs to be inside the "else" block of the preview mode
            if (!this.isScratchpadPreview) {
                this.noteTextarea.value = this.noteText;
                this.noteTextarea.addEventListener("input", async () => {
                    this.noteText = this.noteTextarea.value;
                    await this.saveFixedNote(this.noteText);
                    this.updateScratchpadHighlights();
                });

                this.noteTextarea.addEventListener('scroll', () => {
                    if (this.scratchHighlighterEl) {
                        this.scratchHighlighterEl.scrollTop = this.noteTextarea.scrollTop;
                        this.scratchHighlighterEl.scrollLeft = this.noteTextarea.scrollLeft;
                    }
                });
            }

            const notesPlaceholder = this.notesViewMode === 'pinned' ? 'Filter pinned notes...' : 'Filter recent notes...';
            this.notesSearchInputEl = this.setupSearchInput(notesSearchContainer, notesPlaceholder, ['status:unlinked'], (term) => {
                this.notesSearchTerm = term;
                this.populateNotes();
            });

            // Attach the new tag suggester to the notes search input.
            new TagSuggest(this.app, this.notesSearchInputEl, this);

            const hasUnlinkedAssets = await this.hasUnlinkedAssets();
            const assetsSuggestions = hasUnlinkedAssets ? ['status:unlinked'] : [];
            this.assetsSearchInputEl = this.setupSearchInput(assetsSearchContainer, 'Filter assets...', assetsSuggestions, (term) => {
                this.assetsSearchTerm = term;
                this.populateAssets();
            });

            this.tasksSearchInputEl = this.setupSearchInput(tasksSearchContainer, 'Filter tasks...', [], (term) => {
                this.tasksSearchTerm = term;
                this.populateTasks();
            });

            // Attach the tag suggester to the tasks search input as well.
            new TagSuggest(this.app, this.tasksSearchInputEl, this);

            this.dashboardSearchInputEl = this.setupSearchInput(
                dashboardSearchContainer,
                'Filter widgets...',
                [], // No suggestions needed for widget filtering
                (term) => {
                    this.dashboardSearchTerm = term;

                    this.populateDashboard(true); // Re-render the dashboard with the filter applied
                }
            );

            this.updateScratchpadSearchCount();
            switchTabs(this.activeTab);
        }
        this.applyFontSettings();
    }

    parseSearchQuery(query) {
        const tokens = query.trim().split(/\s+/);
        const groups = [];
        let currentGroup = [];
        for (const token of tokens) {
            if (token.toLowerCase() === 'or') {
                if (currentGroup.length > 0) groups.push(currentGroup);
                currentGroup = [];
            } else if (token.toLowerCase() !== 'and') {
                currentGroup.push(token);
            }
        }
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups; // [[keyword1, keyword2], [keyword3]]
    }

    matchesItem(text, group) {
        return group.every(keyword => text.includes(keyword));
    }

    searchMatches(text, groups) {
        return groups.some(group => this.matchesItem(text, group));
    }

    matchesNote(file, group) {
        // You can include more properties here (title, body, etc)
        return group.every(keyword =>
            file.basename.toLowerCase().includes(keyword)
        );
    }

    searchMatchesNote(file, groups) {
        return groups.some(group => this.matchesNote(file, group));
    }

    /**
     * Creates a 4-step color gradient from a single base RGBA color.
     * @param {string} baseColor - The RGBA color string from settings (e.g., "rgba(74, 144, 226, 1)").
     * @returns {string[]} An array of 4 RGBA color strings with varying opacity.
     */
    createColorGradient(baseColor) {
        // Fallback gradient in case the input color is invalid
        const fallbackGradient = ['#4A271E', '#D35400', '#F39C12', '#FFB74D'];

        if (!baseColor || !baseColor.startsWith('rgba')) {
            return fallbackGradient;
        }

        try {
            const parts = baseColor.match(/(\d+)/g);
            if (!parts || parts.length < 3) {
                return fallbackGradient;
            }
            const [r, g, b] = parts;

            // Return a 4-step gradient by varying the alpha channel
            return [
                `rgba(${r}, ${g}, ${b}, 0.4)`, // Lightest shade for low activity
                `rgba(${r}, ${g}, ${b}, 0.6)`,
                `rgba(${r}, ${g}, ${b}, 0.8)`,
                `rgba(${r}, ${g}, ${b}, 1.0)`  // Full color for high activity
            ];
        } catch (error) {
            console.error("Failed to parse color for gradient:", baseColor, error);
            return fallbackGradient;
        }
    }

    /**
    * Scans all Markdown files in the vault to build a complete map for the dashboard,
    * without ignoring any paths.
    */
    async buildAllCreatedNotesMap(file, action = 'add') {
        // If no file is provided, do a full rebuild (initial load)
        if (!file) {
            this.allCreatedNotesMap.clear();
            const allFiles = this.app.vault.getMarkdownFiles();
            for (const f of allFiles) {
                this._addFileToAllCreatedMap(f);
            }
            return;
        }

        // If a file IS provided, perform a targeted update
        if (action === 'add') {
            this._addFileToAllCreatedMap(file);
        } else if (action === 'remove') {
            this._removeFileFromAllCreatedMap(file);
        }
    }

    _addFileToAllCreatedMap(file) {
        if (!(file instanceof TFile) || !file.path.toLowerCase().endsWith('.md')) return;

        let dateKey;
        if (this.isDailyNote(file)) {
            const fileDate = moment(file.basename, this.plugin.settings.dailyNoteDateFormat, true);
            dateKey = fileDate.isValid() ? fileDate.format('YYYY-MM-DD') : moment(file.stat.ctime).format('YYYY-MM-DD');
        } else {
            dateKey = moment(file.stat.ctime).format('YYYY-MM-DD');
        }

        if (!this.allCreatedNotesMap.has(dateKey)) {
            this.allCreatedNotesMap.set(dateKey, []);
        }
        this.allCreatedNotesMap.get(dateKey).push(file);
    }

    _removeFileFromAllCreatedMap(file) {
        if (!(file instanceof TFile)) return;

        // Since we don't know the date key without calculating it, we have to iterate
        for (const [dateKey, files] of this.allCreatedNotesMap.entries()) {
            const index = files.findIndex(f => f.path === file.path);
            if (index !== -1) {
                files.splice(index, 1);
                if (files.length === 0) {
                    this.allCreatedNotesMap.delete(dateKey);
                }
                break; // Assume file path is unique, so we can stop
            }
        }
    }

    // Helper function to convert priority value to human-readable name
    getPriorityName(priority) {
        switch (priority) {
            case '0': return 'Highest';
            case '1': return 'High';
            case '2': return 'Medium';
            case '3': return '';
            case '4': return 'Low';
            case '5': return 'Lowest';
            default: return 'None';
        }
    }

    /**
     * Processes and aggregates task data for multiple metrics to be displayed on a single chart.
     * This function is the new data engine for all custom chart widgets (except KPI).
     * @param {object} config - The configuration object for the widget, now expecting a 'metrics' array.
     * @param {Array<object>} allTasks - The complete list of task objects.
     * @returns {Promise<object>} An object containing unified labels and multiple datasets.
     */
    async getCustomWidgetData(config, allTasks) {

        const tagFilterString = config.tags || '';

        // 1. Create a mutable list of tasks to be filtered.
        let filteredTasks = allTasks;

        // 2. Parse the single tag string into inclusion and exclusion lists.
        const rawTags = tagFilterString.split(',').map(t => t.trim()).filter(t => t);

        const inclusionTags = rawTags
            .filter(t => !t.startsWith('-'))
            .map(t => t.replace(/^#/, '').toLowerCase());

        const exclusionTags = rawTags
            .filter(t => t.startsWith('-'))
            .map(t => t.substring(1).replace(/^#/, '').toLowerCase());


        // 3. Apply Inclusion Tag Filter first.
        // If there are any inclusion tags, a task MUST have at least one of them.
        if (inclusionTags.length > 0) {
            filteredTasks = filteredTasks.filter(task => {
                // If task has no tags, it can't be included.
                if (!task.tags || task.tags.length === 0) {
                    return false;
                }
                const taskTags = task.tags.map(t => t.replace(/^#/, '').toLowerCase());
                // Return true if any of the task's tags are in our inclusion list.
                return taskTags.some(t => inclusionTags.includes(t));
            });
        }

        // 4. Apply Exclusion Tag Filter on the remaining tasks.
        // A task must NOT have any of the exclusion tags.
        if (exclusionTags.length > 0) {
            filteredTasks = filteredTasks.filter(task => {
                // If task has no tags, it can't be excluded, so it's safe.
                if (!task.tags || task.tags.length === 0) {
                    return true;
                }
                const taskTags = task.tags.map(t => t.replace(/^#/, '').toLowerCase());
                // Return true only if NONE of the task's tags are in our exclusion list.
                return !taskTags.some(t => exclusionTags.includes(t));
            });
        }

        allTasks = filteredTasks;

        const {
            metrics,
            dateRange,
            groupBy,
            chartType,
            tag: filterTag,
            legend
        } = config;

        const now = moment();

        // --- 1. Determine Date Range for All Metrics ---
        let startDate, endDate;
        const lookMode = dateRange?.look || 'back';
        const lookValue = parseInt(dateRange?.value, 10) || 30;
        const lookUnit = dateRange?.unit || 'days';

        if (lookMode.startsWith('all')) {
            const allRelevantDates = allTasks
                .flatMap(t => [t.created?.moment, t.due?.moment, t.done?.moment, t.start?.moment])
                .filter(Boolean)
                .map(d => moment(d));

            startDate = allRelevantDates.length > 0 ? moment.min(allRelevantDates) : now.clone().subtract(30, 'days');
            endDate = allRelevantDates.length > 0 ? moment.max(allRelevantDates) : now.clone();


        } else if (lookMode === 'back') {
            startDate = now.clone().subtract(lookValue, lookUnit).startOf('day');
            endDate = now.clone().endOf('day');
        } else if (lookMode === 'forward') {
            startDate = now.clone().startOf('day');
            endDate = now.clone().add(lookValue, lookUnit).endOf('day');
        } else if (lookMode === 'custom') {
            const forwardValue = parseInt(dateRange.forward?.value, 10) || 0;
            const forwardUnit = dateRange.forward?.unit || 'days';
            startDate = now.clone().subtract(lookValue, lookUnit).startOf('day');
            endDate = now.clone().add(forwardValue, forwardUnit).endOf('day');
        } else if (lookMode === 'fixedStart') {
            const fixedStartDate = moment(dateRange.startDate, 'YYYY-MM-DD');
            if (fixedStartDate.isValid()) {
                startDate = fixedStartDate.startOf('day');
            } else {
                startDate = now.clone().subtract(30, 'days').startOf('day'); // Fallback
            }

            if (dateRange.endDate === 'forward') {
                const forwardBase = config.lookForwardFrom === 'currentDate' ? now : startDate;
                const forwardValue = parseInt(dateRange.forward.value, 10) || 0;
                const forwardUnit = dateRange.forward.unit || 'days';
                endDate = forwardBase.clone().add(forwardValue, forwardUnit).endOf('day');
            } else {
                endDate = now.clone().endOf('day');
            }

        } else { // Fallback for any unexpected value
            startDate = now.clone().subtract(30, 'days').startOf('day');
            endDate = now.clone().endOf('day');
        }

        const allLabels = new Set();
        const datasets = [];

        // --- 2. Process Each Metric Individually ---
        for (const metricConfig of metrics) {
            const {
                type: metricType,
                label,
                color
            } = metricConfig;

            const groupedData = new Map();

            // a) Filter tasks based on the presence of the correct date property
            let preFilteredTasks = [];
            switch (metricType) {
                case 'completed':
                    //preFilteredTasks = allTasks.filter(t => t.isDone);

                    preFilteredTasks = allTasks.filter(t => t.isDone && t.created?.moment && t.done?.moment);

                    break;
                case 'created':
                    preFilteredTasks = allTasks.filter(t => t.created?.moment);
                    break;
                case 'open':
                    preFilteredTasks = allTasks.filter(t => {
                        const isNotDone = !t.isDone;
                        const isNotCompleted = t.status.symbol !== 'x';
                        const isNotCancelled = t.status.symbol !== '-';
                        // Include TODO and IN_PROGRESS tasks
                        const isOpenStatus = t.status.type === 'TODO' || t.status.type === 'IN_PROGRESS';
                        return isNotDone && isNotCompleted && isNotCancelled && isOpenStatus;
                    });

                    break;

                case 'due':
                    // ONLY tasks with due date that are NOT overdue and NOT in-progress
                    preFilteredTasks = allTasks.filter(t => {
                        const hasDueDate = t.due && t.due.moment;
                        const isOverdue = hasDueDate && t.due.moment.isBefore(window.moment(), 'day');
                        const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                        const isInProgress = t.status && t.status.symbol === '/';
                        return hasDueDate && !isOverdue && !isCompleted && !isInProgress;
                    });
                    break;

                case 'overdue':
                    // Tasks that are past due and not completed
                    preFilteredTasks = allTasks.filter(t => {
                        const hasDueDate = t.due && t.due.moment;
                        const isOverdue = hasDueDate && t.due.moment.isBefore(window.moment(), 'day');
                        const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                        return isOverdue && !isCompleted;
                    });
                    break;

                case 'in-progress':
                    // ONLY tasks with in-progress status (forward slash)
                    preFilteredTasks = allTasks.filter(t => {
                        const isInProgress = t.status && t.status.symbol === '/';
                        return isInProgress;
                    });

                    break;

                case 'someday':
                    // ONLY tasks with NO due date that are NOT completed
                    preFilteredTasks = allTasks.filter(t => {
                        const hasDueDate = t.due && t.due.moment;
                        const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                        return !hasDueDate && !isCompleted;
                    });
                    break;


                case 'by-tag':
                    preFilteredTasks = allTasks.filter(t => t.tags?.some(tag => tag.toLowerCase().includes(filterTag?.toLowerCase())));
                    break;
                default:
                    preFilteredTasks = allTasks;
            }

            //Calculate opening balance for cumulative "created" metric
            let openingBalance = 0;
            if (chartType === 'cumulative') {
                if (metricType === 'created') {
                    // Count all tasks created BEFORE the startDate that are not cancelled
                    openingBalance = preFilteredTasks.filter(t => {
                        const createdMoment = moment(t.created.moment);
                        const isCancelled = t.status?.type === 'CANCELLED';
                        return createdMoment.isBefore(startDate, 'day') && !isCancelled;
                    }).length;
                } else if (metricType === 'completed') {
                    // Count all tasks completed BEFORE the startDate
                    openingBalance = preFilteredTasks.filter(t => {
                        const completedMoment = moment(t.done.moment);
                        return completedMoment.isBefore(startDate, 'day');
                    }).length;
                } 
            }

            // b) Apply date range filtering if not an "All Time" chart
            const isDateRelevant = ['completed', 'created', 'due', 'overdue', 'in-progress'].includes(metricType);
            let finalFilteredTasks = preFilteredTasks;
            if (!lookMode.startsWith('all') && isDateRelevant) {
                finalFilteredTasks = preFilteredTasks.filter(task => {
                    let dateToTest = null;
                    switch (metricType) {
                        case 'completed':
                            dateToTest = task.done?.moment;
                            break;
                        case 'created':
                            dateToTest = task.created?.moment;
                            break;
                        case 'due':
                        case 'overdue':
                            dateToTest = task.due?.moment;
                            break;
                        case 'in-progress':
                            dateToTest = task.due?.moment;
                            break;
                    }

                    return dateToTest && moment(dateToTest).isBetween(startDate, endDate, null, '[]');
                });
            }

            if (config.chartType === 'kpi') {
                //console.log(`Count of completed tasks (final filtered)2 : ${finalFilteredTasks.length}`);
                if (config.kpiPriorities && typeof config.kpiPriorities === 'object') {
                    const activePriorities = Object.keys(config.kpiPriorities).filter(key => config.kpiPriorities[key] === true);

                    if (activePriorities.length > 0) {
                        finalFilteredTasks = finalFilteredTasks.filter(task => {
                            const taskPriority = String(task.priority);
                            return activePriorities.includes(taskPriority);
                        });
                    }
                }

                const totalCount = finalFilteredTasks.length;

                // For KPIs, we return a very simple structure.
                // The calling function will expect something like this to render the number.
                return {
                    datasets: [{
                        label: label, // The label for this specific metric (e.g., "Open")
                        data: [totalCount],
                        total: totalCount // Explicitly provide the total
                    }],
                    labels: [label],
                    legend: [{ label: label, color: color }],
                    filteredTasks: finalFilteredTasks
                };

            }

            // c) Aggregate data based on groupBy
            if (metricType === 'someday') {
                // For 'someday' tasks, the grouping logic is simple: just count them.
                // We can assign them to a single label.
                const count = finalFilteredTasks.length;
                groupedData.set('Someday', count);

            } else {

                // c) Group the filtered data
                if (['day', 'week', 'month'].includes(groupBy) && isDateRelevant) {
                    let current = startDate.clone();
                    while (current.isSameOrBefore(endDate, groupBy)) {
                        const key = current.format(groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');
                        groupedData.set(key, 0);
                        current.add(1, groupBy);
                    }
                }

                for (const task of finalFilteredTasks) {
                    let key;

                    switch (groupBy) {
                        case 'day':
                        case 'week':
                        case 'month':
                            if (isDateRelevant) {
                                let dateField = null;
                                switch (metricType) {
                                    case 'completed':
                                        dateField = task.done?.moment;
                                        break;
                                    case 'created':
                                        dateField = task.created?.moment;
                                        break;
                                    case 'due':
                                    case 'overdue':
                                        dateField = task.due?.moment;
                                        break;
                                    case 'in-progress':
                                        dateField = task.due?.moment;
                                        break;
                                }
                                if (dateField) {
                                    const dateMoment = moment(dateField);
                                    // CRITICAL: Only add to groupedData if within the chart's date range
                                    if (dateMoment.isBetween(startDate, endDate, null, '[]')) {
                                        key = dateMoment.format(groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');
                                    }
                                }
                            }
                            break;
                        case 'tag':
                            if (task.tags?.length) key = task.tags[0].replace(/^#/, '');
                            break;
                        case 'priority':
                            key = this.getPriorityName(task.priority);
                            break;
                    }
                    if (key) {
                        groupedData.set(key, (groupedData.get(key) || 0) + 1);
                    }
                }

            }

            groupedData.forEach((_, label) => allLabels.add(label));
            datasets.push({
                label,
                color,
                dataMap: groupedData,
                openingBalance: openingBalance || 0  // NEW: Store opening balance
            });
        }

        if (chartType === 'cumulative' && lookMode === 'fixedStart' && ['day', 'week', 'month'].includes(groupBy)) {
            // Find the maximum date across all tasks in the filtered dataset
            const allTaskDates = allTasks
                .flatMap(t => [
                    t.created?.moment,
                    t.due?.moment,
                    t.done?.moment,
                    t.start?.moment
                ])
                .filter(Boolean)
                .map(d => moment(d));

            if (allTaskDates.length > 0) {
                const maxDataDate = moment.max(allTaskDates);

                // Calculate the look-ahead end: max date + 2 weeks
                const lookAheadEnd = maxDataDate.clone().add(2, 'weeks').endOf('day');

                // Only extend if the look-ahead end is beyond the current endDate
                if (lookAheadEnd.isAfter(endDate)) {
                    endDate = lookAheadEnd;
                }
            }
        }

        if (chartType === 'cumulative' && lookMode === 'fixedStart' && ['day', 'week', 'month'].includes(groupBy)) {
            // Ensure all dates from startDate to endDate are in allLabels
            let current = startDate.clone();
            while (current.isSameOrBefore(endDate, groupBy)) {
                const key = current.format(groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');
                allLabels.add(key);
                current.add(1, groupBy);
            }
        }

        // --- 3. Unify Datasets ---
        const sortedLabels = Array.from(allLabels).sort();
        const formattedDatasets = datasets.map(ds => {
            return {
                label: ds.label,
                color: ds.color,
                data: sortedLabels.map(label => ds.dataMap.get(label) || 0)
            };
        });

        if (chartType === 'cumulative') {
            formattedDatasets.forEach((ds, index) => {
                // NEW: Start with opening balance if this dataset has one
                let cumulativeTotal = datasets[index]?.openingBalance || 0;

                ds.data = ds.data.map(value => {
                    cumulativeTotal += value;
                    return cumulativeTotal;
                });
            });
        }

        // --- 4. Add Projected Completion Line (if configured) ---
        if (chartType === 'cumulative' && config.projection?.show) {

            // The previous logic to find the completed dataset was too complex.
            // This is a more direct approach: find the dataset with the exact label "Completed".
            const completedDataset = formattedDatasets.find(ds => ds.label === 'Completed');

            // If there is a different label for completed tasks (e.g., "Done"),
            // remember to change the string above to match it exactly.

            if (completedDataset) {

                // a) Filter for 'due' tasks that are not yet complete
                const dueTasks = allTasks.filter(t => {
                    const hasDueDate = t.due && t.due.moment;
                    const isOverdue = hasDueDate && t.due.moment.isBefore(window.moment(), 'day');
                    const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                    const isInProgress = t.status && t.status.symbol === '/';
                    // The projection should only count tasks that are due but not overdue or in-progress
                    return hasDueDate && !isOverdue && !isCompleted && !isInProgress;
                });

                // b) Group due tasks by the specified period
                const dueGroupedData = new Map();
                for (const task of dueTasks) {
                    const dateMoment = moment(task.due.moment);
                    if (dateMoment.isBetween(startDate, endDate, null, '[]')) {
                        const key = dateMoment.format(groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');
                        dueGroupedData.set(key, (dueGroupedData.get(key) || 0) + 1);
                    }
                }

                // c) Create a cumulative data array for due tasks
                let cumulativeDueTotal = 0;
                const dueData = sortedLabels.map(label => {
                    cumulativeDueTotal += dueGroupedData.get(label) || 0;
                    return cumulativeDueTotal;
                });

                const dueDataset = formattedDatasets.find(
                    (ds) => ds.label === "Due"
                );

                if (dueDataset) {
                    dueDataset.data = dueData;
                }

                // d) Create the projected data by adding cumulative due tasks to cumulative completed tasks
                // The projection represents: all completed tasks + all remaining due tasks
                const projectedData = completedDataset.data.map((completedValue, index) => {
                    // Get the current cumulative completed count
                    const completed = completedValue;
                    // Get the current cumulative due count
                    const due = dueData[index] || 0;

                    // Projection = Completed + Due (this should equal Created total)
                    return completed + due;
                });

                // e) Get styling from config or use defaults
                const projectionConfig = config.projection || {};
                const projectionColor = projectionConfig.color || 'rgba(128, 128, 128, 0.7)';
                const projectionLabel = projectionConfig.label || 'Projected';

                // f) Create and add the new dataset for the projected line
                const projectedDataset = {
                    label: projectionLabel,
                    color: projectionColor,
                    data: projectedData,
                    borderColor: projectionColor,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.1,
                    backgroundColor: 'transparent'
                };

                formattedDatasets.push(projectedDataset);

            } else {
                // This message will now appear if the lookup fails.
                console.error("PROJECTION FAILED: Could not find a dataset with the label 'Completed'. Please ensure one of your metrics has this exact label.");
            }
        }

        const legendData = formattedDatasets.map(ds => ({
            label: ds.label,
            color: ds.color
        }));


        if (chartType === 'cumulative' && config.projection?.show && formattedDatasets.some(ds => ds.label === (config.projection.label || 'Projected'))) {
            // We re-create the object here just to be safe.
            const projectionConfig = config.projection || {};
            const projectionLabel = projectionConfig.label || 'Projected';
            const projectionColor = projectionConfig.color || 'rgba(128, 128, 128, 0.7)';
            legendData.push({ label: projectionLabel, color: projectionColor });
        }

        if (chartType === 'line' && lookMode.startsWith('all')) {
            // Find first AND last labels where ANY metric has a non-zero value
            let firstNonZeroIndex = -1;
            let lastNonZeroIndex = -1;

            for (let i = 0; i < sortedLabels.length; i++) {
                const hasData = formattedDatasets.some(ds => ds.data[i] > 0);
                if (hasData) {
                    if (firstNonZeroIndex === -1) {
                        firstNonZeroIndex = i;
                    }
                    lastNonZeroIndex = i;
                }
            }

            if (firstNonZeroIndex !== -1) {
                // Calculate buffer (2 weeks worth of labels)
                const bufferSize = groupBy === 'day' ? 14 : (groupBy === 'week' ? 2 : 1);

                // Start index with buffer
                const startIndex = Math.max(0, firstNonZeroIndex - bufferSize);

                // For end, we need to EXTEND beyond the existing data
                const extendBeyondData = Math.max(0, bufferSize - (sortedLabels.length - 1 - lastNonZeroIndex));

                // Slice existing data
                let trimmedLabels = sortedLabels.slice(startIndex);
                let trimmedDatasets = formattedDatasets.map(ds => ({
                    ...ds,
                    data: ds.data.slice(startIndex)
                }));

                // Add extra labels for the end buffer if needed
                if (extendBeyondData > 0) {
                    const lastLabel = sortedLabels[sortedLabels.length - 1];
                    const lastDate = moment(lastLabel, groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');

                    for (let i = 1; i <= extendBeyondData; i++) {
                        const newDate = lastDate.clone().add(i, groupBy);
                        const newLabel = newDate.format(groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-[W]WW');
                        trimmedLabels.push(newLabel);

                        // Add 0 values for all datasets at this new label
                        trimmedDatasets.forEach(ds => ds.data.push(0));
                    }
                }

                return { datasets: trimmedDatasets, labels: trimmedLabels, legend: legendData, dateRange: { startDate, endDate } };
            }
        }


        return {
            datasets: formattedDatasets,
            labels: sortedLabels,
            legend: legendData,
            dateRange: { startDate, endDate }
        };
    }

    // Helper to determine if a widget part (title or chevron) should be shown
    shouldShowWidgetPart({
        part,
        config = {},
        isFileCreation = false,
        pluginSettings
    }) {
        // Determine per-widget override property name
        const overrideKey =
            part === 'title' ? 'overrideShowTitle' : 'overrideShowChevron';

        // Determine global setting key
        const globalKey =
            isFileCreation
                ? (part === 'title' ? 'showFileCreationWidgetTitles' : 'showFileCreationWidgetChevrons')
                : (part === 'title' ? 'showTaskWidgetTitles' : 'showTaskWidgetChevrons');

        if (typeof config[overrideKey] === 'boolean') {
            return config[overrideKey];
        }
        return pluginSettings[globalKey];
    }

    /**
     * Renders a single, user-configured statistics widget in the dashboard.
     * @param {HTMLElement} parentGrid - The flexbox container for all widgets.
     * @param {object} config - The configuration object for this specific widget.
     * @param {Array<object>} allTasks - The complete list of task objects.
     */
    async renderCustomStatsWidget(parentGrid, config, allTasks) {
        // --- This function now only creates the container and calls the real renderer ---
        const sizeClass = `cpwn-pm-widget-${config.size || 'medium'}`;
        const widgetContainer = parentGrid.createDiv({ cls: `cpwn-pm-widget-container ${sizeClass}` });
        widgetContainer.setAttribute('data-widget-key', config.widgetKey);

        // Call a new helper function to do the actual work.
        // This creates a new, clean scope for each widget.
        await this._renderIndividualWidget(widgetContainer, config, allTasks);
    }

    async _renderIndividualWidget(widgetContainer, config, allTasks) {
        // const sizeClass = `cpwn-pm-widget-${config.size || 'medium'}`;
        // const widgetContainer = parentGrid.createDiv({ cls: `cpwn-pm-widget-container ${sizeClass}` });
        // widgetContainer.setAttribute('data-widget-key', config.widgetKey);

        let showTitle;
        if (typeof config.overrideShowTitle === 'boolean') {
            showTitle = config.overrideShowTitle;

        } else if (typeof this.plugin.settings.showTaskWidgetTitles === 'boolean') {
            showTitle = this.plugin.settings.showTaskWidgetTitles;

        } else {
            showTitle = true; // default fallback
        }

        let showChevron;
        if (typeof config.overrideShowChevron === 'boolean') {
            showChevron = config.overrideShowChevron;

        } else if (typeof this.plugin.settings.showTaskWidgetChevrons === 'boolean') {
            showChevron = this.plugin.settings.showTaskWidgetChevrons;
        } else {
            showChevron = true; // default fallback
        }

        const header = widgetContainer.createDiv({ cls: 'cpwn-widget-header' });
        let toggleIcon = '';

        if (showChevron) {
            toggleIcon = header.createDiv({ cls: 'cpwn-widget-toggle-icon' });
        }

        if (!this.plugin.settings.collapsedWidgets) {
            this.plugin.settings.collapsedWidgets = {};
        }

        // Check the initial collapsed state.
        const isCollapsed = this.plugin.settings.collapsedWidgets[config.widgetKey] || false;

        if (showChevron) {
            setIcon(toggleIcon, isCollapsed ? 'chevron-right' : 'chevron-down');
        }

        if (showTitle) {
            let title = config.widgetName;
            if (config.appendTimePeriod !== false) {
                const lookMode = config.dateRange?.look;
                if (lookMode === 'back' || lookMode === 'forward' || lookMode === 'custom') {
                    const backText = config.dateRange.value ? `${config.dateRange.value} ${config.dateRange.unit}` : '';
                    const fwdText = (lookMode === 'custom' && config.dateRange.forward?.value) ? `${config.dateRange.forward.value} ${config.dateRange.forward.unit}` : '';
                    const rangeText = [backText, fwdText].filter(Boolean).join(' & ');
                    if (rangeText) title = `${config.widgetName} (${rangeText})`;
                } else if (lookMode === 'fixedStart' && config.dateRange.startDate) {
                    title = `${config.widgetName} (Since ${config.dateRange.startDate})`;
                }
            }
            header.createDiv({ cls: 'cpwn-widget-title' }).setText(title);
        }

        const contentWrapper = widgetContainer.createDiv({ cls: 'cpwn-widget-content' });

        if (isCollapsed) {
            widgetContainer.addClass('collapsed');
        }

        header.addEventListener('click', async () => {
            const isCurrentlyCollapsed = widgetContainer.classList.toggle('collapsed');
            this.plugin.settings.collapsedWidgets[config.widgetKey] = isCurrentlyCollapsed;
            await this.plugin.saveSettings(); // Save the settings

            if (showChevron && toggleIcon) {
                setIcon(toggleIcon, isCurrentlyCollapsed ? 'chevron-right' : 'chevron-down');
            }
            if (config.chartType === 'kpi') {
                const kpiWrapper = widgetContainer.querySelector('.cpwn-pm-kpi-wrapper');
                if (kpiWrapper) {
                    kpiWrapper.style.display = isCurrentlyCollapsed ? 'none' : '';
                }
            }
        });
        /*
        header.addEventListener('click', async () => {
            const isCurrentlyCollapsed = widgetContainer.classList.toggle('collapsed');
            this.plugin.settings.collapsedWidgets[config.widgetKey] = isCurrentlyCollapsed;
            await this.plugin.saveSettings();

            if (showChevron) {
                setIcon(toggleIcon, isCurrentlyCollapsed ? 'chevron-right' : 'chevron-down');
            }
            // For KPI widgets, we need to show/hide the correct wrapper
            if (config.chartType === 'kpi') {
                const kpiWrapper = widgetContainer.querySelector('.cpwn-pm-kpi-wrapper');
                if (kpiWrapper) {
                    kpiWrapper.style.display = isCurrentlyCollapsed ? 'none' : '';
                }
            }
        });
        */

        let chartData = await this.getCustomWidgetData(config, allTasks);


        const chartArea = contentWrapper.createDiv({ cls: 'cpwn-pm-chart-area' });
        const renderer = new CssChartRenderer(chartArea);
        const legendlessConfig = config.legend;


        switch (config.chartType) {
            case 'line':
            case 'cumulative':
                renderer.renderLineChart(chartData.datasets, chartData.labels, config, legendlessConfig, chartData.rawData, chartData.dateRange);
                break;
            case 'bar':
                renderer.renderBarChart(chartData, config);
                break;
            case 'radar':
                renderer.renderRadarChart(chartData.datasets, chartData.labels, config, legendlessConfig);
                break;
            case 'pie':
            case 'doughnut':
                const pieData = chartData.datasets.map(ds => ({ label: ds.label, value: ds.data.reduce((a, b) => a + b, 0), color: ds.color }));
                renderer.renderPieChart(pieData, config.chartType, null, legendlessConfig, chartData.datasets);
                break;
            case 'kpi':
                const kpiWrapper = contentWrapper.createDiv({ cls: 'cpwn-pm-kpi-wrapper' });

                if (config.kpiIcon) {

                    const iconWrapper = kpiWrapper.createDiv({ cls: 'cpwn-pm-kpi-icon' });

                    const iconToRender = config.kpiIconOverride || config.kpiIcon;
                    if (iconToRender) {
                        setIcon(iconWrapper, iconToRender);
                    }
                    if (config.kpiIconColor) {
                        const svg = iconWrapper.querySelector('svg');
                        if (svg) {
                            svg.style.color = config.kpiIconColor;

                        }
                    }
                }

                const totalCount = chartData.datasets[0]?.data?.reduce((sum, value) => sum + value, 0) || 0;
                const kpiValueEl = kpiWrapper.createDiv({
                    text: totalCount.toString(),
                    cls: 'cpwn-pm-kpi-value'
                });

                // Store the original opacity from the configured color
                let originalOpacity = 1;

                if (config?.metrics && config.metrics[0] && config.metrics[0].color) {
                    const colorString = config.metrics[0].color;
                    kpiValueEl.style.color = colorString;

                    // Extract opacity from rgba if present
                    const rgbaMatch = colorString.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
                    if (rgbaMatch) {
                        originalOpacity = parseFloat(rgbaMatch[1]);
                    }
                }

                // Make it look interactive
                kpiValueEl.classList.add('cpwn-clickable');
                let showPopupTimeout = null; // Store the timeout reference

                // Add hover opacity effect
                kpiValueEl.addEventListener('mouseenter', async (e) => {

                    // Reduce opacity by multiplying by 0.7 (30% dimmer)
                    const hoverOpacity = originalOpacity * 0.7;
                    //kpiValueEl.style.opacity = hoverOpacity.toString();

                    kpiValueEl.classList.add('cpwn-hover-fade');
                    kpiValueEl.style.setProperty('--hover-opacity', hoverOpacity.toString());

                    e.stopPropagation();

                    const dataByType = {
                        tasks: chartData.filteredTasks
                    };

                    // Clear any existing timeout first
                    if (showPopupTimeout) {
                        window.clearTimeout(showPopupTimeout);
                    }

                    showPopupTimeout = window.setTimeout(() => {
                        this.showFilePopup(kpiValueEl, dataByType, config.widgetName, this.app.isMobile);
                    }, this.plugin.settings.otherNoteHoverDelay); // Slight delay to prevent flicker
                });

                kpiValueEl.addEventListener('mouseleave', () => {
                    // Restore original opacity from configured color
                    kpiValueEl.style.opacity = originalOpacity.toString();

                    if (showPopupTimeout) {
                        window.clearTimeout(showPopupTimeout);
                        showPopupTimeout = null;
                    }

                    this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                });

                return;
            default:
                contentWrapper.setText(`Unknown chart type: ${config.chartType}`);
                return;
        }

        if (!['kpi', 'pie', 'doughnut', 'radar'].includes(config.chartType) && (config.axisLabels?.x || config.axisLabels?.y)) {
            const chartContainerEl = contentWrapper.querySelector('.cpwn-pm-css-chart-container');
            if (chartContainerEl && config.axisLabels.y) {
                chartContainerEl.createDiv({ cls: 'cpwn-pm-axis-label y-axis', text: config.axisLabels.y });
            }
        }

        const footerArea = contentWrapper.createDiv({ cls: 'cpwn-pm-chart-footer' });
        if (!['kpi', 'pie', 'doughnut', 'radar'].includes(config.chartType) && config.axisLabels?.x) {
            footerArea.createDiv({ cls: 'cpwn-pm-axis-label-footer', text: config.axisLabels.x });
        }

    }

    async getTasksForMetric(metricType, config, allTasks) {
        const now = window.moment();
        let filtered = [];

        switch (metricType) {
            case 'overdue':
                filtered = allTasks.filter(t => {
                    const hasDueDate = t.due && t.due.moment;
                    const isOverdue = hasDueDate && t.due.moment.isBefore(now, 'day');
                    const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                    return isOverdue && !isCompleted;
                });
                break;

            case 'due':
                filtered = allTasks.filter(t => {
                    const hasDueDate = t.due && t.due.moment;
                    const isOverdue = hasDueDate && t.due.moment.isBefore(now, 'day');
                    const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                    const isInProgress = t.status && t.status.symbol === '/';

                    if (!hasDueDate || isOverdue || isCompleted || isInProgress) return false;

                    // Apply date range if configured
                    if (config.dateRange && config.dateRange.look !== 'all') {
                        const lookValue = parseInt(config.dateRange.value, 10) || 30;
                        const lookUnit = config.dateRange.unit || 'days';

                        let startDate, endDate;
                        if (config.dateRange.look === 'back') {
                            startDate = now.clone().subtract(lookValue, lookUnit).startOf('day');
                            endDate = now.clone().endOf('day');
                        } else if (config.dateRange.look === 'forward') {
                            startDate = now.clone().startOf('day');
                            endDate = now.clone().add(lookValue, lookUnit).endOf('day');
                        }

                        if (startDate && endDate) {
                            return t.due.moment.isBetween(startDate, endDate, null, '[]');
                        }
                    }

                    return true;
                });
                break;

            case 'in-progress':
                filtered = allTasks.filter(t => {
                    if (!t.status || t.status.symbol !== '/') return false;

                    if (config.dateRange && config.dateRange.look !== 'all' && t.due && t.due.moment) {
                        const lookValue = parseInt(config.dateRange.value, 10) || 30;
                        const lookUnit = config.dateRange.unit || 'days';

                        let startDate, endDate;
                        if (config.dateRange.look === 'back') {
                            startDate = now.clone().subtract(lookValue, lookUnit).startOf('day');
                            endDate = now.clone().endOf('day');
                        } else if (config.dateRange.look === 'forward') {
                            startDate = now.clone().startOf('day');
                            endDate = now.clone().add(lookValue, lookUnit).endOf('day');
                        }

                        if (startDate && endDate) {
                            return t.due.moment.isBetween(startDate, endDate, null, '[]');
                        }
                    }

                    return true;
                });
                break;

            case 'someday':
                filtered = allTasks.filter(t => {
                    const hasDueDate = t.due && t.due.moment;
                    const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
                    return !hasDueDate && !isCompleted;
                });
                break;

            case 'completed':
                filtered = allTasks.filter(t => t.isDone);
                break;

            default:
                filtered = allTasks;
        }

        return filtered;
    }


    /**
     * Aggregates tasks by date for use in line charts.
     * @param {Array} tasks - The list of tasks to process.
     * @param {string} dateField - The date property to use ('createdDate' or 'completionDate').
     * @param {number} days - The number of days to look back.
     * @returns {Map<string, number>} A map of date strings to task counts.
     */
    aggregateByDate(tasks, dateField, days) {
        const counts = new Map();
        const startDate = moment().subtract(days - 1, 'days').startOf('day');

        for (const task of tasks) {
            const taskDate = task[dateField];
            if (taskDate) {
                const dateMoment = moment(taskDate);
                if (dateMoment.isSameOrAfter(startDate)) {
                    const dateKey = dateMoment.format('YYYY-MM-DD');
                    counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
                }
            }
        }
        return counts;
    }

    /**
     * Aggregates tasks by tag for use in bar charts.
     * @param {Array} tasks - The list of tasks to process.
     * @param {number} days - The number of days to look back for task creation.
     * @returns {Map<string, number>} A map of tag names to task counts.
     */
    aggregateByTag(tasks, days) {
        const tagStats = new Map();
        const startDate = moment().subtract(days - 1, 'days').startOf('day');

        for (const task of tasks) {
            if (!task.tags || task.tags.length === 0) continue;
            if (!task.createdDate || moment(task.createdDate).isBefore(startDate)) continue;

            for (const tag of task.tags) {
                const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
                tagStats.set(cleanTag, (tagStats.get(cleanTag) || 0) + 1);
            }
        }
        return tagStats;
    }

    /**
     * Aggregates tasks by their status for use in pie/doughnut charts.
     * @param {Array} tasks - The list of tasks to process.
     * @param {number} days - The number of days to look back.
     * @returns {object} An object with counts for each status.
     */
    aggregateByStatus(tasks, days) {
        const statusCounts = {
            Completed: 0,
            Cancelled: 0,
            InProgress: 0,
            Open: 0
        };
        const startDate = moment().subtract(days - 1, 'days').startOf('day');

        for (const task of tasks) {
            if (!task.createdDate || moment(task.createdDate).isBefore(startDate)) continue;

            switch (task.status) {
                case 'x':
                    statusCounts.Completed++;
                    break;
                case '-':
                    statusCounts.Cancelled++;
                    break;
                case '/':
                    statusCounts.InProgress++;
                    break;
                default:
                    statusCounts.Open++;
                    break;
            }
        }
        return statusCounts;
    }

    /**
     * Returns a color for a given tag.
     * This is a placeholder and can be expanded with more sophisticated color generation.
     * @param {string} tag - The tag name.
     * @returns {string} A CSS color string.
     */
    getTagColor(tag) {
        // A simple hashing function to get a color
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    }


    filterTasksForWidget(tasks, filterConfig) {
        const now = moment();
        let filtered = [...tasks];

        // --- 1. Task Status Filter (Apply this first) ---
        if (filterConfig.taskStatus && filterConfig.taskStatus !== 'all') {
            filtered = filtered.filter(task => {
                const status = (task.status || '').toLowerCase();
                switch (filterConfig.taskStatus) {
                    case 'completed':
                        return status === 'x';
                    case 'incomplete':
                        // Incomplete means not completed and not cancelled
                        return status !== 'x' && status !== '-';
                    case 'overdue':
                        // Overdue means it has a due date in the past and is not completed
                        return task.dueDate && moment(task.dueDate).isBefore(now, 'day') && status !== 'x';
                    default:
                        return true;
                }
            });
        }

        // --- 2. Date Range Filter (Now uses the correct date) ---
        if (filterConfig.dateRange) {
            let start, end;
            switch (filterConfig.dateRange) {
                case 'past7days':
                    start = now.clone().subtract(6, 'days').startOf('day');
                    end = now.clone().endOf('day');
                    break;
                case 'thisMonth':
                    start = now.clone().startOf('month');
                    end = now.clone().endOf('month');
                    break;
                case 'past30days':
                    start = now.clone().subtract(29, 'days').startOf('day');
                    end = now.clone().endOf('day');
                    break;
            }

            if (start && end) {
                filtered = filtered.filter(task => {
                    // Use completionDate for completed tasks, otherwise use dueDate.
                    const dateToTest = (filterConfig.taskStatus === 'completed')
                        ? task.completionDate
                        : task.dueDate;

                    return dateToTest && moment(dateToTest).isBetween(start, end, null, '[]');
                });
            }
        }

        // --- 3. Tag and Folder Filters (No changes needed here) ---
        const filterTags = filterConfig.tags || [];
        if (filterTags.length > 0) {
            filtered = filtered.filter(task => {
                if (!task.tags) return false;
                const taskTags = task.tags.map(t => t.replace(/^#/, ''));
                return filterTags.some(ft => taskTags.includes(ft));
            });
        }

        const filterFolders = filterConfig.folders || [];
        if (filterFolders.length > 0) {
            filtered = filtered.filter(task => {
                if (!task.file) return false;
                return filterFolders.some(folder => task.file.path.startsWith(folder));
            });
        }

        return filtered;
    }

    // Renders a simple statistic card showing the count of tasks.
    renderStatCard(container, tasks, config) {
        container.empty();
        const count = tasks.length;
        const card = container.createDiv({ cls: 'cpwn-pm-stat-card' });
        card.createDiv({ cls: 'cpwn-pm-stat-card-value', text: count.toString() });
        card.createDiv({ cls: 'cpwn-pm-stat-card-label', text: config.widgetName });
    }

    // Main function to populate the dashboard based on the selected view mode.
    async populateDashboard(forceRefresh = false) {
        if (!this.dashboardContentEl) return;

        // 1. Always get the latest data first.
        await this.buildAllTasksList();

        if (this.dashboardViewMode === 'tasks') {

            // Only check cache if this is NOT a forced refresh
            if (!forceRefresh) {
                const stableTasks = this.allTasks.map(task => ({
                    path: task.path,
                    description: task.description,
                    status: task.status.type,
                    due: task.due?.moment?.toISOString(),
                    done: task.done?.moment?.toISOString(),
                }));

                stableTasks.sort((a, b) => {
                    if (a.path < b.path) return -1;
                    if (a.path > b.path) return 1;
                    if (a.description < b.description) return -1;
                    if (a.description > b.description) return 1;
                    return 0;
                });

                const currentState = JSON.stringify(stableTasks);
                if (currentState === this.lastTasksState) {
                    //console.log("No changes in task data detected. Skipping dashboard refresh.");

                    return; // Exit if task data hasn't changed
                }
                this.lastTasksState = currentState;
            }

            // Now render
            this.dashboardContentEl.empty();
            const widgetGrid = this.dashboardContentEl.createDiv({ cls: 'cpwn-pm-dashboard-grid' });
            await this.populateTasksDashboard(widgetGrid);

        } else {
            // Same pattern for creation dashboard
            this.dashboardContentEl.empty();
            const widgetGrid = this.dashboardContentEl.createDiv({ cls: 'cpwn-pm-dashboard-grid' });
            await this.populateCreationDashboard(widgetGrid);
        }
    }


    // Renders a single heatmap widget based on the provided configuration.
    async renderSingleHeatmap(widgetGrid, heatmapConfig, index) {
        // Find existing widget or create a new one

        //  console.log(`Rendering Heatmap Widget: ${heatmapConfig.name}`);
        let widgetContainer = widgetGrid.querySelector(`#cpwn-heatmap-widget-${index}`);
        if (!widgetContainer) {
            widgetContainer = widgetGrid.createDiv({
                cls: 'cpwn-pm-widget-container cpwn-pm-widget-medium',
                attr: { id: `cpwn-heatmap-widget-${index}` }
            });
        } else {
            // If it exists, clear it for re-rendering
            widgetContainer.empty();
        }

        // Add filtering and data gathering logic here
        const allFiles = this.app.vault.getFiles();
        const hasValidFilter = Array.isArray(heatmapConfig.filters) && heatmapConfig.filters.length > 0 && heatmapConfig.filters.some(f => f.value && f.value.trim() !== '');

        if (!hasValidFilter) {
            this.renderEmptyHeatmapWidget(widgetContainer, heatmapConfig.name, 'Heatmap not configured. Please set a filter value in settings.');
            return;
        }

        const filteredFiles = allFiles.filter(file => this._matchesHeatmapRule(file, heatmapConfig));

        if (heatmapConfig.debug) {
            console.groupCollapsed(`--- Debug for Heatmap: ${heatmapConfig.name} ---`);
            if (filteredFiles.length > 0) {
                console.log(`Found ${filteredFiles.length} matching files:`);
                console.table(filteredFiles.map(f => ({ path: f.path })));
            } else {
                console.log('No matching files found for the configured rules.');
            }
            console.groupEnd();
        }

        const customMap = new Map();
        const userDateFormats = this.plugin.settings.customDateFormats ? this.plugin.settings.customDateFormats.split(',').map(f => f.trim()) : ['YYYY-MM-DD', 'DD-MM-YYYY'];
        for (const file of filteredFiles) {
            let dateKey = null;
            if (heatmapConfig.dateSource === 'dateFromTitle') {
                const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})/;
                const match = file.basename.match(dateRegex);
                if (match && match[0]) {
                    const dateMoment = moment(match[0], userDateFormats, true);
                    if (dateMoment.isValid()) {
                        dateKey = dateMoment.format('YYYY-MM-DD');
                    }
                }
            }
            if (!dateKey) {
                dateKey = moment(file.stat.ctime).format('YYYY-MM-DD');
            }
            if (!customMap.has(dateKey)) customMap.set(dateKey, []);
            customMap.get(dateKey).push(file);
        }

        // Render the widget content
        if (customMap.size > 0) {
            const color = heatmapConfig.color || 'rgba(74, 144, 226, 1)';
            const gradient = this.createColorGradient(color);
            const monthsBack = heatmapConfig.monthsBack ?? 11;
            const monthsForward = heatmapConfig.monthsForward ?? 0;
            const startDate = moment().subtract(monthsBack, 'months').startOf('month');
            const endDate = moment().add(monthsForward, 'months').endOf('month');

            // We pass the already-found container to the main render function
            const widgetKey = `custom-${index}`;
            await this.populateSingleHeatmapWidget(widgetContainer, heatmapConfig.name, customMap, gradient, { startDate, endDate }, widgetKey);

        } else {
            this.renderEmptyHeatmapWidget(widgetContainer, heatmapConfig.name);
        }
    }

    /**
     * The main orchestrator that handles AND/OR logic and calls the debug logger.
     */
    _matchesHeatmapRule(file, config) {
        // If debug is on, start a collapsible group for this file.
        if (config.debug) {
            console.groupCollapsed(`Checking File: "${file.path}"`);
        }

        const logic = config.logic || 'AND';
        const filters = config.filters || [];
        let finalMatch;

        if (logic === 'AND') {
            finalMatch = filters.every(rule => this._evaluateSingleRule(file, rule, config.debug));
        } else {
            finalMatch = filters.some(rule => this._evaluateSingleRule(file, rule, config.debug));
        }

        // Close the debug group for this file.
        if (config.debug) {
            console.log(`%cFinal Result: ${finalMatch ? 'MATCH' : 'NO MATCH'} (Logic: ${logic})`, `font-weight: bold; color: ${finalMatch ? 'green' : 'red'};`);
            console.groupEnd();
        }

        return finalMatch;
    }

    /**
     * The new, powerful filtering engine that evaluates a single file against a single rule.
     */
    _evaluateSingleRule(file, rule, isDebug) {
        // Provide default operator for backward compatibility
        const { type, operator = 'contains', value } = rule;
        let match = false;
        let reason = 'Rule did not match.';

        if (!value || value.trim() === '') {
            if (isDebug) console.log(`- Rule (${type}): SKIPPED (No value provided)`);
            return false;
        }

        // --- 1. Get the target value from the file to be tested ---
        let target;
        switch (type) {
            case 'filename':
                target = file.name;
                break;
            case 'filepath':
                target = file.path;
                break;
            case 'filetype':
                target = file.extension;
                break;
            case 'tag':
                const fileCache = this.app.metadataCache.getFileCache(file);
                const bodyTags = (fileCache?.tags || []).map(t => t.tag.substring(1).toLowerCase());
                const fm = fileCache?.frontmatter;
                const fmTags = fm ? [].concat(fm.tags || [], fm.tag || []).map(String).map(t => t.toLowerCase()) : [];
                target = [...new Set([...bodyTags, ...fmTags])]; // An array of unique tags
                break;
            default:
                if (isDebug) console.log(`- Rule (${type}): FAIL. Reason: Unknown filter type.`);
                return false;
        }

        // --- 2. Evaluate the rule based on the operator ---
        try {
            const lowerCaseValue = value.toLowerCase().replace(/^#/, ''); // Clean filter value
            let baseResult = false;

            // The logic for string-based types (filename, filepath, filetype)
            if (typeof target === 'string') {
                const lowerCaseTarget = target.toLowerCase();
                switch (operator) {
                    case 'matches_regex':
                    case 'not_matches_regex':
                        try {
                            const [, pattern, flags] = value.match(/\/(.*)\/(.*)/);
                            const regex = new RegExp(pattern, flags);
                            baseResult = regex.test(target); // Use original target for case-sensitive regex
                            reason = `Regex /${pattern}/${flags} ${baseResult ? 'matched' : 'did not match'} target: "${target}"`;
                        } catch (e) {
                            baseResult = false;
                            reason = `Invalid regex pattern: "${value}"`;
                        }
                        break;
                    case 'contains':
                        baseResult = lowerCaseTarget.includes(lowerCaseValue);
                        reason = `Target "${target}" ${baseResult ? 'contains' : 'does not contain'} "${value}"`;
                        break;
                    case 'equals':
                        baseResult = lowerCaseTarget === lowerCaseValue;
                        reason = `Target "${target}" ${baseResult ? 'equals' : 'does not equal'} "${value}"`;
                        break;
                    case 'starts_with':
                        baseResult = lowerCaseTarget.startsWith(lowerCaseValue);
                        reason = `Target "${target}" ${baseResult ? 'starts with' : 'does not start with'} "${value}"`;
                        break;
                    case 'ends_with':
                        baseResult = lowerCaseTarget.endsWith(lowerCaseValue);
                        reason = `Target "${target}" ${baseResult ? 'ends with' : 'does not end with'} "${value}"`;
                        break;
                }
                // Handle negation for string types
                if (operator.startsWith('not_')) {
                    match = !baseResult;
                } else {
                    match = baseResult;
                }
            }
            // The logic for array-based types (tag)
            else if (Array.isArray(target)) {
                switch (operator) {
                    case 'equals': // "is"
                        match = target.includes(lowerCaseValue);
                        reason = `Tag list [${target.join(', ')}] ${match ? 'contains' : 'does not contain'} tag "${value}"`;
                        break;
                    case 'not_equals': // "is not"
                        match = !target.includes(lowerCaseValue);
                        reason = `Tag list [${target.join(', ')}] ${match ? 'does not contain' : 'contains'} tag "${value}"`;
                        break;
                    default:
                        reason = `Operator "${operator}" is not valid for type "tag". Use "is" or "is not".`;
                        match = false;
                }
            }
        } catch (e) {
            reason = `Error during evaluation: ${e.message}`;
            match = false;
        }

        if (isDebug) {
            const style = `color: ${match ? 'green' : 'orange'}`;
            console.log(`- Rule (${type} ${operator} "${value}") -> %c${match ? 'PASS' : 'FAIL'}`, style);
            console.log(`  Reason: ${reason}`);
        }

        return match;
    }

    // Populates the dashboard in "Creation" mode.
    async populateCreationDashboard(widgetGrid) {
        const searchTerm = this.dashboardSearchTerm.toLowerCase();
        const finalOrder = this._getFinalWidgetOrder('creation');

        const dailyNotesMap = new Map();
        const regularNotesMap = new Map();

        // This first loop correctly populates the daily and regular note maps.
        for (const [dateStr, filesOrFile] of this.allCreatedNotesMap.entries()) {
            const files = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile];

            files.forEach(file => {
                if (!file) return;

                if (this.isDailyNote(file)) {
                    if (!dailyNotesMap.has(dateStr)) dailyNotesMap.set(dateStr, []);
                    dailyNotesMap.get(dateStr).push(file);
                } else {
                    if (!regularNotesMap.has(dateStr)) regularNotesMap.set(dateStr, []);
                    regularNotesMap.get(dateStr).push(file);
                }
            });
        }

        for (const widgetKey of finalOrder) {

            if (widgetKey.startsWith('custom-')) {
                const index = parseInt(widgetKey.split('-')[1], 10);
                const heatmapConfig = this.plugin.settings.customHeatmaps?.[index];
                if (heatmapConfig) {
                    // This function now creates the container OR finds the existing one
                    if (searchTerm && !heatmapConfig.name.toLowerCase().includes(searchTerm)) continue;

                    await this.renderSingleHeatmap(widgetGrid, heatmapConfig, index);
                }
            } else {
                const widgetName = DASHBOARDWIDGETS.creation[widgetKey]?.name || '';
                if (searchTerm && !widgetName.toLowerCase().includes(searchTerm)) continue;

                const widgetContainer = widgetGrid.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-widget-medium' });

                switch (widgetKey) {
                    case 'allfilesheatmap': {
                        const allFilesMap = new Map();
                        // Safely merge notes map
                        this.allCreatedNotesMap.forEach((files, date) => {
                            const fileList = Array.isArray(files) ? files : [files];
                            if (!allFilesMap.has(date)) allFilesMap.set(date, []);
                            allFilesMap.get(date).push(...fileList);
                        });
                        // Safely merge assets map
                        this.assetCreationMap.forEach((files, date) => {
                            const fileList = Array.isArray(files) ? files : [files];
                            if (!allFilesMap.has(date)) allFilesMap.set(date, []);
                            allFilesMap.get(date).push(...fileList);
                        });

                        const gradient = this.createColorGradient('rgba(210, 105, 30, 0.8)');
                        await this.populateSingleHeatmapWidget(widgetContainer, 'All files', allFilesMap, gradient, {}, 'allfilesheatmap');
                        break;
                    }
                    case 'dailynotesheatmap': {
                        const gradient = this.createColorGradient(this.plugin.settings.dailyNoteDotColor);
                        const futureEndDate = moment().add(6, 'months').endOf('month');
                        await this.populateSingleHeatmapWidget(widgetContainer, "Daily notes", dailyNotesMap, gradient, { endDate: futureEndDate }, 'dailynotesheatmap');
                        break;
                    }
                    case 'regularnotesheatmap': {
                        const gradient = this.createColorGradient(this.plugin.settings.noteCreatedColor);
                        await this.populateSingleHeatmapWidget(widgetContainer, 'Regular notes', regularNotesMap, gradient, {}, 'regularnotesheatmap');
                        break;
                    }
                    case 'assetsheatmap': {
                        if (this.assetCreationMap.size > 0) {
                            const gradient = this.createColorGradient(this.plugin.settings.assetDotColor);
                            await this.populateSingleHeatmapWidget(widgetContainer, 'Assets', this.assetCreationMap, gradient, {}, 'assetsheatmap');
                        } else {
                            this.renderEmptyHeatmapWidget(widgetContainer, 'Assets');
                        }
                        break;
                    }
                }
            }
        }
    }

    async getTaskMetrics() {

        const allTasks = this.allTasks;
        if (!allTasks || allTasks.length === 0) {
            return { completed: 0, open: 0, inProgress: 0, overdue: 0, cancelled: 0, total: 0 };
        }

        const now = moment();
        const totalTasks = allTasks.length;
        const completed = allTasks.filter(t => t.status.type === 'DONE').length;
        const cancelled = allTasks.filter(t => t.status.type === 'CANCELLED').length;
        const inProgress = allTasks.filter(t => t.status.type === 'IN_PROGRESS').length;
        // FIXED: Include both TODO and IN_PROGRESS tasks in the "open" count

        const open = allTasks.filter(t =>
            t.status.type === 'TODO' || t.status.type === 'IN_PROGRESS'
        ).length;

        // FIXED: Also check IN_PROGRESS tasks for overdue
        const overdue = allTasks.filter(t =>
            (t.status.type === 'TODO' || t.status.type === 'IN_PROGRESS') &&
            t.due?.moment?.isBefore(now, 'day')
        ).length;

        const due = allTasks.filter(t =>
            t.due?.moment && !t.due.moment.isBefore(now, 'day') &&
            t.status.type === 'TODO'
        ).length;

        const someday = allTasks.filter(t => {
            const hasDueDate = t.due && t.due.moment;
            const isCompleted = t.status && (t.status.type === 'DONE' || t.status.symbol === 'x');
            const isCancelled = t.status?.type === 'CANCELLED';
            return !hasDueDate && !isCompleted && !isCancelled;
        }).length;

        const completedWithCreatedDate = allTasks.filter(t => t.status.type === 'DONE' && t.createdDate).length;

        return { completed, open, inProgress, overdue, cancelled, total: totalTasks, due, completedWithCreatedDate, someday };

    }

    async getTaskSummaryMetrics() {
        const allTasks = this.allTasks || [];
        const now = moment();

        // --- Define Date Ranges ---
        const todayStart = now.clone().startOf('day');
        const todayEnd = now.clone().endOf('day');
        const tomorrowStart = now.clone().add(1, 'day').startOf('day');
        const tomorrowEnd = now.clone().add(1, 'day').endOf('day');
        const next7DaysStart = now.clone().add(2, 'days').startOf('day');
        const next7DaysEnd = now.clone().add(8, 'days').endOf('day'); // Today + 1 + 7 = 8 days from now

        // --- Initialize Metrics Buckets ---
        const metrics = {
            today: { incomplete: [], completed: [], overdue: [], inProgress: [] },
            tomorrow: { incomplete: [], completed: [], inProgress: [] },
            next7days: { incomplete: [], completed: [], inProgress: [] },
            future: { incomplete: [], inProgress: [] },
            noDue: { incomplete: [], inProgress: [] },
        };

        for (const task of allTasks) {
            // Use the official 'Task' object properties
            const isCompleted = task.status.type === 'DONE';
            const isInProgress = task.status.type === 'IN_PROGRESS';
            const dueDate = task.due?.moment;
            const completionDate = task.done?.moment;

            if (isCompleted && completionDate) {
                // Logic for completed tasks
                if (completionDate.isBetween(todayStart, todayEnd, null, '[]')) {
                    metrics.today.completed.push(task);
                } else if (completionDate.isBetween(tomorrowStart, tomorrowEnd, null, '[]')) {
                    metrics.tomorrow.completed.push(task);
                } else if (completionDate.isBetween(next7DaysStart, next7DaysEnd, null, '[]')) {
                    metrics.next7days.completed.push(task);
                }
            } else if (!isCompleted) {

                if (!dueDate) {
                    if (isInProgress) {
                        metrics.noDue.inProgress.push(task)
                    } else {
                        metrics.noDue.incomplete.push(task);
                    }
                } else if (dueDate.isBefore(todayStart, 'day')) {
                    metrics.today.overdue.push(task);
                } else if (dueDate.isBetween(todayStart, todayEnd, null, '[]')) {
                    if (isInProgress) metrics.today.inProgress.push(task);
                    else metrics.today.incomplete.push(task);
                } else if (dueDate.isBetween(tomorrowStart, tomorrowEnd, null, '[]')) {
                    if (isInProgress) metrics.tomorrow.inProgress.push(task);
                    else metrics.tomorrow.incomplete.push(task);
                } else if (dueDate.isBetween(next7DaysStart, next7DaysEnd, null, '[]')) {
                    if (isInProgress) metrics.next7days.inProgress.push(task);
                    else metrics.next7days.incomplete.push(task);
                } else if (dueDate.isAfter(next7DaysEnd, 'day')) {
                    if (isInProgress) metrics.future.inProgress.push(task);
                    else metrics.future.incomplete.push(task);
                }
            }
        }
        return metrics;
    }

    // Returns weekly task metrics including incomplete, completed, and overdue counts.
    async getWeeklyTaskMetrics() {
        const allTasks = this.allTasks || [];
        const now = moment();
        const startOfToday = now.clone().startOf('day');

        const weekStartsOnMonday = this.plugin.settings.weekStartDay === 'monday';
        const weekStartString = weekStartsOnMonday ? 'isoWeek' : 'week';

        const dateRanges = {
            today: {
                start: startOfToday,
                end: now.clone().endOf('day')
            },
            thisWeek: {
                start: now.clone().startOf(weekStartString),
                end: now.clone().endOf(weekStartString)
            },
            nextWeek: {
                start: now.clone().add(1, 'week').startOf(weekStartString),
                end: now.clone().add(1, 'week').endOf(weekStartString)
            },
            next4Weeks: {
                start: startOfToday,
                end: now.clone().add(4, 'weeks').endOf('day')
            }
        };

        const metrics = {
            today: { incomplete: 0, completed: 0, overdue: 0 },
            thisWeek: { incomplete: 0, completed: 0, overdue: 0 },
            nextWeek: { incomplete: 0, completed: 0, overdue: 0 },
            next4Weeks: { incomplete: 0, completed: 0, overdue: 0 }
        };

        for (const task of allTasks) {
            const isCompleted = task.status === 'x';
            const dueDate = task.dueDate ? moment(task.dueDate) : null;
            const completionDate = task.completionDate ? moment(task.completionDate) : null;

            if (isCompleted && completionDate) {
                for (const key in dateRanges) {
                    if (completionDate.isBetween(dateRanges[key].start, dateRanges[key].end, 'day', '[]')) {
                        metrics[key].completed++;
                    }
                }
            } else if (!isCompleted && dueDate) {
                if (dueDate.isBefore(startOfToday, 'day')) {
                    // Overdue tasks are counted in all relevant future periods
                    for (const key in dateRanges) {
                        metrics[key].overdue++;
                    }
                } else {
                    for (const key in dateRanges) {
                        if (dueDate.isBetween(dateRanges[key].start, dateRanges[key].end, 'day', '[]')) {
                            metrics[key].incomplete++;
                        }
                    }
                }
            }
        }
        return metrics;
    }

    // Determines the final order and visibility of widgets for a given dashboard type.
    _getFinalWidgetOrder(dashboardType) {
        const visibilityKey = `${dashboardType}DashboardWidgets`;
        const orderKey = `${dashboardType}DashboardOrder`;
        const defaultWidgets = DASHBOARDWIDGETS[dashboardType];

        // Your fix to default to empty objects is correct and preserved.
        const savedVisibility = this.plugin.settings[visibilityKey] || {};
        const savedOrder = this.plugin.settings[orderKey] || [];

        let allWidgetKeys = Object.keys(defaultWidgets);

        if (dashboardType === 'tasks') {
            (this.plugin.settings.tasksStatsWidgets || []).forEach(widget => {
                allWidgetKeys.push(widget.widgetKey);
            });
        }

        // Your existing logic for custom creation heatmaps is correct and preserved.
        if (dashboardType === 'creation') {
            this.plugin.settings.customHeatmaps?.forEach((_, index) => {
                allWidgetKeys.push(`custom-${index}`);
            });
        }

        // Your logic for merging and filtering the order is also correct and preserved.
        const finalOrder = [...new Set([...savedOrder, ...allWidgetKeys])];

        // This ensures new widgets are visible by default and deleted ones are removed.
        return finalOrder.filter(key => {
            const existsInMasterList = allWidgetKeys.includes(key);
            const isVisible = savedVisibility[key] !== false;
            return existsInMasterList && isVisible;
        });
    }

    // Returns weekly task metrics including incomplete, completed, and overdue counts.
    async getWeeklyTaskMetrics() {
        const allTasks = this.allTasks || [];
        const now = moment();
        const startOfToday = now.clone().startOf('day');

        const weekStartsOnMonday = this.plugin.settings.weekStartDay === 'monday';
        const weekStartString = weekStartsOnMonday ? 'isoWeek' : 'week';

        const dateRanges = {
            today: {
                start: startOfToday,
                end: now.clone().endOf('day')
            },
            thisWeek: {
                start: now.clone().startOf(weekStartString),
                end: now.clone().endOf(weekStartString)
            },
            nextWeek: {
                start: now.clone().add(1, 'week').startOf(weekStartString),
                end: now.clone().add(1, 'week').endOf(weekStartString)
            },
            next4Weeks: {
                start: startOfToday,
                end: now.clone().add(4, 'weeks').endOf('day')
            }
        };

        const metrics = {
            today: { incomplete: 0, completed: 0, overdue: 0 },
            thisWeek: { incomplete: 0, completed: 0, overdue: 0 },
            nextWeek: { incomplete: 0, completed: 0, overdue: 0 },
            next4Weeks: { incomplete: 0, completed: 0, overdue: 0 }
        };

        for (const task of allTasks) {
            const isCompleted = task.status === 'x';
            const dueDate = task.dueDate ? moment(task.dueDate) : null;
            const completionDate = task.completionDate ? moment(task.completionDate) : null;

            if (isCompleted && completionDate) {
                for (const key in dateRanges) {
                    if (completionDate.isBetween(dateRanges[key].start, dateRanges[key].end, 'day', '[]')) {
                        metrics[key].completed++;
                    }
                }
            } else if (!isCompleted && dueDate) {
                if (dueDate.isBefore(startOfToday, 'day')) {
                    for (const key in dateRanges) {
                        metrics[key].overdue++;
                    }
                } else {
                    for (const key in dateRanges) {
                        if (dueDate.isBetween(dateRanges[key].start, dateRanges[key].end, 'day', '[]')) {
                            metrics[key].incomplete++;
                        }
                    }
                }
            }
        }
        return metrics;
    }

    // Builds maps of upcoming and overdue tasks grouped by their due dates.
    async getTaskMaps() {
        const upcomingMap = new Map();
        const overdueMap = new Map();
        const allTasks = this.allTasks;
        const now = moment();

        for (const task of allTasks) {
            // We only care about incomplete tasks with a due date
            if (task.status !== 'x' && task.status !== '-' && task.dueDate) {
                const dueDate = moment(task.dueDate);
                const isOverdue = dueDate.isBefore(now, 'day');
                const dateKey = dueDate.format('YYYY-MM-DD');

                // Add to the appropriate map
                if (isOverdue) {
                    if (!overdueMap.has(dateKey)) {
                        overdueMap.set(dateKey, []);
                    }
                    overdueMap.get(dateKey).push(task);
                } else if (dueDate.isSameOrAfter(now, 'day')) {
                    // Only include future tasks in the upcoming map
                    if (!upcomingMap.has(dateKey)) {
                        upcomingMap.set(dateKey, []);
                    }
                    upcomingMap.get(dateKey).push(task);
                }
            }
        }
        return { upcomingMap, overdueMap };
    }

    // Renders an empty heatmap widget with a message.
    renderEmptyHeatmapWidget(parent, title, message = 'No files found matching the filter criteria.') {
        const widgetContainer = parent.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-empty-widget' });

        const header = widgetContainer.createDiv({ cls: 'cpwn-pm-widget-header' });
        header.createEl('h3', { text: title });

        widgetContainer.createDiv({
            text: message,
            cls: 'cpwn-pm-empty-widget-message'
        });
    }

    // Helper to check if a widget is in a collapsed section
    isWidgetInCollapsedSection(widgetKey, order, settings) {
        const widgetIndex = order.indexOf(widgetKey);

        // Look backwards to find the parent section
        for (let i = widgetIndex - 1; i >= 0; i--) {
            const prevConfig = settings.tasksStatsWidgets.find(w => w.widgetKey === order[i]);
            if (prevConfig && prevConfig.type === 'section-header') {
                return prevConfig.isCollapsed === true;
            }
        }
        return false;
    }

    // Render the section header
    renderSectionHeader(container, config) {
        if (config.isVisible === false) {
            return; // Don't render if not visible
        }

        const sectionHeader = container.createDiv({ cls: 'cpwn-pm-section-header' });

        const textAlign = config.textAlign || 'left';

        sectionHeader.classList.add('cpwn-section-header');

        if (textAlign === 'center') {
            sectionHeader.classList.add('cpwn-section-header-center');
        }
        if (textAlign === 'right') {
            sectionHeader.classList.add('cpwn-section-header-right');
            sectionHeader.classList.add('cpwn-section-icon-left');
        }

        const shouldShowChevron = config.showChevron === 'show' ||
            (config.showChevron === 'global' && this.plugin.settings.showSectionHeaderChevrons);

        // Only render collapse icon if chevron is enabled
        if (shouldShowChevron) {

            // Collapse icon
            const collapseIcon = sectionHeader.createDiv({ cls: 'cpwn-pm-section-collapse-icon' });
            //setIcon(collapseIcon, config.isCollapsed ? 'chevron-right' : 'chevron-down');
            setIcon(collapseIcon, config.isCollapsed ? (textAlign === 'right' ? 'chevron-left' : 'chevron-right') : 'chevron-down');



        }

        // Section icon (if configured)
        if (config.icon) {
            const iconEl = sectionHeader.createDiv({ cls: 'cpwn-pm-section-icon' });
            setIcon(iconEl, config.icon);
            if (config.iconColor) {
                // Apply color to the SVG element inside the icon container
                const svgEl = iconEl.querySelector('svg');
                if (svgEl) {
                    svgEl.style.setProperty('color', config.iconColor, 'important');
                }
            }
        }

        // Section name
        const nameEl = sectionHeader.createSpan({ text: config.name, cls: 'cpwn-pm-section-name' });

        nameEl.style.flexGrow = '1';
        nameEl.style.textAlign = textAlign;

        // Apply ALL the configured styles with !important to ensure they take effect
        if (config.textColor) {
            nameEl.style.setProperty('color', config.textColor, 'important');
        }

        if (config.fontWeight) {
            const weight = config.fontWeight === 'bold' ? 'bold' : config.fontWeight === 'italic' ? 'normal' : 'normal';
            nameEl.style.setProperty('font-weight', weight, 'important');

            // Handle italic separately
            const style = config.fontWeight === 'italic' ? 'italic' : 'normal';
            nameEl.style.setProperty('font-style', style, 'important');
        }

        if (config.fontSize) {
            nameEl.style.setProperty('font-size', `${config.fontSize}px`, 'important');
        }

        // Click to toggle collapse
        sectionHeader.addEventListener('click', async () => {
            config.isCollapsed = !config.isCollapsed;
            await this.plugin.saveSettings();
            // Call the main dashboard populate function to re-render
            this.lastTasksState = ''; // Reset last state to force re-render
            await this.populateDashboard();
        });
    }


    // Populates the dashboard in "Tasks" mode.
    async populateTasksDashboard(widgetGrid) {

        const searchTerm = this.dashboardSearchTerm.toLowerCase();
        const finalOrder = this._getFinalWidgetOrder('tasks');

        const now = moment();
        const startOfToday = now.clone().startOf('day');
        const endOfToday = now.clone().endOf('day');
        const startOfTomorrow = now.clone().add(1, 'day').startOf('day');
        const endOfTomorrow = now.clone().add(1, 'day').endOf('day');
        const startOfNext7Days = now.clone().add(2, 'day').startOf('day');
        const endOfNext7Days = now.clone().add(8, 'day').endOf('day');

        const metrics = {
            today: { incomplete: [], completed: [], overdue: [], inProgress: [] },
            tomorrow: { incomplete: [], inProgress: [] },
            next7days: { incomplete: [], inProgress: [] },
            future: { incomplete: [], inProgress: [] },
            noDue: { incomplete: [], inProgress: [] }
        };

        // 1. Correctly process the official Task objects into metric buckets
        for (const task of this.allTasks) {
            const statusType = task.status?.type || '';
            const isCompleted = statusType === 'DONE';
            const isInProgress = statusType === 'IN_PROGRESS';
            const dueDate = task.due?.moment;
            const completionDate = task.done?.moment;

            if (isCompleted) {
                if (this.plugin.settings.showCompletedTasksToday && completionDate && completionDate.isBetween(startOfToday, endOfToday, null, '[]')) {
                    metrics.today.completed.push(task);
                }
            } else if (dueDate) {
                if (dueDate.isBefore(startOfToday, 'day')) {
                    metrics.today.overdue.push(task);
                } else if (dueDate.isBetween(startOfToday, endOfToday, null, '[]')) {
                    (isInProgress ? metrics.today.inProgress : metrics.today.incomplete).push(task);
                } else if (dueDate.isBetween(startOfTomorrow, endOfTomorrow, null, '[]')) {
                    (isInProgress ? metrics.tomorrow.inProgress : metrics.tomorrow.incomplete).push(task);
                } else if (dueDate.isBetween(startOfNext7Days, endOfNext7Days, null, '[]')) {
                    (isInProgress ? metrics.next7days.inProgress : metrics.next7days.incomplete).push(task);
                } else if (dueDate.isAfter(endOfNext7Days, 'day')) {
                    (isInProgress ? metrics.future.inProgress : metrics.future.incomplete).push(task);
                }
            } else {
                (isInProgress ? metrics.noDue.inProgress : metrics.noDue.incomplete).push(task);
            }
        }

        // 2. Render all widgets using the correct, existing function calls
        for (const widgetKey of finalOrder) {

            if (!this.plugin.settings.tasksDashboardWidgets[widgetKey]) continue;

            let widgetName = DASHBOARDWIDGETS.tasks[widgetKey]?.name || '';


            const customWidgetConfig = (this.plugin.settings.tasksStatsWidgets || []).find(w => w.widgetKey === widgetKey);

            if (customWidgetConfig) widgetName = customWidgetConfig.widgetName;
            if (widgetName && searchTerm && !widgetName.toLowerCase().includes(searchTerm)) continue;

            if (customWidgetConfig && customWidgetConfig.type === 'section-header') {
                this.renderSectionHeader(widgetGrid, customWidgetConfig);
                continue; // Skip normal widget rendering
            }

            // Check if this widget should be hidden (in a collapsed section)
            const isInCollapsedSection = this.isWidgetInCollapsedSection(widgetKey, finalOrder, this.plugin.settings);
            if (isInCollapsedSection) {
                continue; // Skip rendering this widget
            }

            switch (widgetKey) {
                case 'today':
                    this.renderTaskSummaryWidget(widgetGrid, 'Today', metrics.today.incomplete, metrics.today.completed, metrics.today.overdue, metrics.today.inProgress, [], 'today');
                    break;
                case 'tomorrow':
                    this.renderTaskSummaryWidget(widgetGrid, 'Tomorrow', metrics.tomorrow.incomplete, [], [], metrics.tomorrow.inProgress, [], 'tomorrow');
                    break;
                case 'next7days':
                    this.renderTaskSummaryWidget(widgetGrid, 'Next 7 days', metrics.next7days.incomplete, [], [], metrics.next7days.inProgress, [], 'next7days');
                    break;
                case 'futureNoDue': {
                    const combinedIncomplete = metrics.future.incomplete || [];
                    const combinedInProgress = [...(metrics.future.inProgress || []), ...(metrics.noDue.inProgress || [])];
                    this.renderTaskSummaryWidget(widgetGrid, 'Future / No due', combinedIncomplete, [], [], combinedInProgress, metrics.noDue.incomplete, 'futureNoDue');
                    break;
                }
                case 'upcomingoverdue': {
                    const upcomingMap = new Map();
                    const overdueMap = new Map();

                    for (const task of this.allTasks) {
                        const statusType = task.status?.type || '';
                        if (statusType === 'DONE' || statusType === 'CANCELLED' || !task.due?.moment) continue;

                        const dateKey = task.due.moment.format('YYYY-MM-DD');

                        if (task.due.moment.isBefore(now, 'day')) {
                            if (!overdueMap.has(dateKey)) overdueMap.set(dateKey, []);
                            overdueMap.get(dateKey).push(task);
                        } else {
                            if (!upcomingMap.has(dateKey)) upcomingMap.set(dateKey, []);
                            upcomingMap.get(dateKey).push(task);
                        }
                    }

                    const totalDataMap = new Map(upcomingMap);
                    for (const [key, tasks] of overdueMap.entries()) {
                        totalDataMap.set(key, [...(totalDataMap.get(key) || []), ...tasks]);
                    }

                    const upcomingGradient = this.createColorGradient(this.plugin.settings.taskStatusColorOpen);
                    const overdueGradient = this.createColorGradient(this.plugin.settings.taskStatusColorOverdue);
                    const futureEndDate = moment().add(12, 'months').endOf('month');

                    await this.populateSingleHeatmapWidget(
                        widgetGrid.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-widget-medium' }),
                        "Upcoming & overdue tasks",
                        totalDataMap,
                        upcomingGradient, // Default color source
                        {
                            endDate: futureEndDate,
                            upcomingMap: upcomingMap,
                            overdueMap: overdueMap,
                            overdueGradient: overdueGradient // Specific gradient for overdue days
                        },
                        'upcomingoverdue'
                    );
                    break;
                }
                case 'taskcompletionheatmap': {
                    const widgetContainer = widgetGrid.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-widget-medium' });
                    const completionMap = new Map();
                    this.allTasks.forEach(task => {
                        if (task.status.type === 'DONE' && task.done?.moment) { // Corrected check
                            const dateKey = task.done.moment.format('YYYY-MM-DD');
                            if (!completionMap.has(dateKey)) completionMap.set(dateKey, []);
                            completionMap.get(dateKey).push(task);
                        }
                    });
                    const gradient = this.createColorGradient(this.plugin.settings.taskStatusColorCompleted);
                    await this.populateSingleHeatmapWidget(widgetContainer, "Task completion activity", completionMap, gradient, {}, 'taskcompletionheatmap');
                    break;
                }
                case 'taskstatusoverview': {
                    const metrics = await this.getTaskMetrics();
                    // This passes the entire metrics object as the second argument
                    this.renderTaskStatusWidget(
                        widgetGrid,
                        metrics,
                        'taskstatusoverview'
                    );
                    break;
                }

                default: {
                    if (customWidgetConfig) {
                        await this.renderCustomStatsWidget(widgetGrid, customWidgetConfig, this.allTasks);
                    }
                    break;
                }
            }
        }
    }

    // Renders the Task Status Overview widget with multiple horizontal bar charts.
    renderTaskStatusWidget(parentContainer, metrics, widgetKey) {
        const statsContainer = parentContainer.createDiv({ cls: 'cpwn-pm-widget-container cpwn-pm-widget-large' });

        let showTitle;
        if (typeof this.plugin.settings.overrideShowTitle === 'boolean') {
            showTitle = this.plugin.settings.overrideShowTitle;

        } else if (typeof this.plugin.settings.showTaskWidgetTitles === 'boolean') {
            showTitle = this.plugin.settings.showTaskWidgetTitles;

        } else {
            showTitle = true; // default fallback
        }

        let showChevron;
        if (typeof this.plugin.settings.overrideShowChevron === 'boolean') {
            showChevron = config.overrideShowChevron;

        } else if (typeof this.plugin.settings.showTaskWidgetChevrons === 'boolean') {
            showChevron = this.plugin.settings.showTaskWidgetChevrons;
        } else {
            showChevron = true; // default fallback
        }

        // --- State Management ---
        const isCollapsed = this.plugin.settings.collapsedWidgets[widgetKey] || false;
        if (isCollapsed) {
            statsContainer.addClass('cpwn-is-collapsed');
        }

        // --- UI Elements ---
        const header = statsContainer.createDiv({ cls: 'cpwn-pm-widget-header' });
        let toggleIcon = '';
        if (showChevron) {
            toggleIcon = header.createDiv({ cls: 'cpwn-heatmap-collapse-icon' });
        }
        if (showTitle) {
            header.createEl('h3', { text: 'Task status overview' });
        }
        const barChartsWrapper = statsContainer.createDiv({ cls: 'cpwn-widget-content-wrapper' });

        if (showTitle) {
            // --- Click Handler ---
            header.addEventListener('click', async () => {
                const currentlyCollapsed = statsContainer.classList.toggle('cpwn-is-collapsed');
                this.plugin.settings.collapsedWidgets[widgetKey] = currentlyCollapsed;
                await this.plugin.saveSettings();
            });
        }

        const total = metrics.total;

        // --- Bar Chart Rendering Logic ---
        const renderBars = () => {
            barChartsWrapper.empty();
            // Render each status bar. The order is adjusted to include the new "Due" metric.
            this.renderTaskBarChart(barChartsWrapper, 'Cancelled', metrics.cancelled, total, this.plugin.settings.taskStatusColorCancelled);
            this.renderTaskBarChart(barChartsWrapper, 'Overdue', metrics.overdue, total, this.plugin.settings.taskStatusColorOverdue);

            // 1. Add the new "Due" line
            this.renderTaskBarChart(barChartsWrapper, 'Due', metrics.due, total, this.plugin.settings.taskStatusColorOpen); // Reusing the "Open" color for "Due"

            this.renderTaskBarChart(barChartsWrapper, 'In progress', metrics.inProgress, total, this.plugin.settings.taskStatusColorInProgress);

            this.renderTaskBarChart(barChartsWrapper, 'Someday', metrics.someday, total, 'rgba(158, 158, 158, 0.6)');

            this.renderTaskBarChart(barChartsWrapper, 'Total open', metrics.open, total, this.plugin.settings.taskStatusColorOpen);

            // 2. Add the new primary "Completed" metric
            this.renderTaskBarChart(barChartsWrapper, 'Completed', metrics.completedWithCreatedDate, total, this.plugin.settings.taskStatusColorCompleted);

            // 3. Add the renamed original "Completed" metric
            this.renderTaskBarChart(barChartsWrapper, 'Total completed (inc tasks with no dates)', metrics.completed, total, this.plugin.settings.taskStatusColorCompleted);

        };

        renderBars();

        // --- Set Initial Icon ---
        if (showChevron) {
            setIcon(toggleIcon, 'chevron-down');
        }
    }


    /**
     * Renders a single horizontal bar chart for a task statistic.
     * This function creates the DOM elements directly without using Chart.js for better performance
     * and to match the requested style.
     *
     * @param {HTMLElement} parentContainer The container to append this chart to.
     * @param {string} label The text label for the metric (e.g., "Overdue").
     * @param {number} value The count for this metric.
     * @param {number} total The total number of items to calculate the percentage against.
     * @param {string} color The color of the bar.
     */
    renderTaskBarChart(parentContainer, label, value, total, color) {
        const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
        const widgetEl = parentContainer.createDiv({ cls: 'cpwn-pm-bar-chart-widget' });

        // Determine what value to display based on the current mode
        const displayValue = this.taskBarChartMode === 'percent'
            ? `${percentage}%`
            : `${value}`;

        // Create the DOM elements
        widgetEl.createEl('div', { text: label, cls: 'cpwn-pm-bar-label' });
        widgetEl.createEl('div', { text: displayValue, cls: 'cpwn-pm-bar-display-value' });

        const barTrack = widgetEl.createDiv({ cls: 'cpwn-pm-bar-track' });
        const barFill = barTrack.createDiv({ cls: 'cpwn-pm-bar-fill' });

        barFill.style.width = `${percentage}%`;
        barFill.style.backgroundColor = color;
    }

    /**
     * Helper to re-render just the calendar grid.
     */
    renderCalendar() {
        if (this.calendarBodyEl) {
            this.calendarBodyEl.empty();
            this.generateMonthGrid(this.displayedMonth, this.calendarBodyEl);
        }
    }

    async refreshData() {
        // It's the core of your view's update mechanism.
        await this.buildAllTasksList(); // I'm assuming this is the function name from your code
        await this.collectAllFiles();   // And this one for files

        // After refreshing the data, re-render the main components
        this.renderCalendar();
        this.updateTabs();
    }

    /**
     * Shows a popup listing all notes, tasks, and assets associated with a specific day.
     * @param {HTMLElement} targetEl The calendar day element to position the popup near.
     * @param {object} dataByType An object containing arrays of items to display, keyed by type.
     * @param {Date} date The date for which the popup is being shown.
     */
    async showFilePopup(targetEl, dataByType, dateOrTitle, isMobile = false) {

        this.hideFilePopup();

        // Query fresh task data for calendar dates
        if (dateOrTitle && typeof dateOrTitle !== 'string') {
            const dateKey = moment(dateOrTitle).format('YYYY-MM-DD');

            const freshTasks = (this.allTasks || []).filter(task => {
                if (!task.due?.moment) return false;
                return task.due.moment.format('YYYY-MM-DD') === dateKey;
            });

            dataByType.tasks = freshTasks;
        }

        this.activePopupArgs = { targetEl, dataByType, dateOrTitle, isMobile }; // Store args for the new popup
        this.popupEl = createDiv({ cls: 'cpwn-other-notes-popup' });
        const { settings } = this.plugin;

        if (isMobile) {
            this.popupEl.addClass('cpwn-is-mobile-popup');
        }

        // Store the listener so we can remove it later
        this.popupFileChangeListener = (file) => {
            // Check if the modified file is relevant to the content of our popup
            const relevantPaths = new Set([
                ...(dataByType.daily || []).map(f => f.path),
                ...(dataByType.created || []).map(f => f.path),
                ...(dataByType.modified || []).map(f => f.path),
                ...(dataByType.assets || []).map(f => f.path),
                ...(dataByType.tasks || []).map(t => t.path)
            ]);

            if (relevantPaths.has(file.path)) {
                // If a relevant file changes, refresh the popup content
                this.refreshPopupContent(dateOrTitle);
            }
        };


        // Add header with a close button and dynamic date/title
        const headerRow = this.popupEl.createDiv({ cls: 'cpwn-popup-header' });

        // This logic now correctly uses the 'dateOrTitle' parameter to handle
        // both Date objects (from heatmaps) and title strings (from summary widgets).
        let headerText;
        if (typeof dateOrTitle === 'string') {
            headerText = dateOrTitle;
        } else {
            headerText = moment(dateOrTitle).format("dddd, D MMMM YYYY");
        }
        headerRow.createDiv({ cls: 'cpwn-popup-header-title', text: headerText });

        const closeBtn = headerRow.createDiv({ cls: 'cpwn-popup-close-btn' });
        setIcon(closeBtn, 'x');
        headerRow.addEventListener('click', () => this.hideFilePopup());

        // Create a scrollable wrapper for the content
        const contentWrapper = this.popupEl.createDiv({ cls: 'cpwn-popup-content-wrapper' });

        // logic for ICS events
        if (dataByType.ics && dataByType.ics.length > 0) {
            contentWrapper.createEl('h6', { text: "Calendar events", cls: "cpwn-popup-section-header" });
            dataByType.ics.forEach(event => {
                const itemEl = contentWrapper.createDiv({ cls: "cpwn-other-notes-popup-item cpwn-is-calendar-event" });
                const iconEl = itemEl.createDiv({ cls: 'note-icon' });
                setIcon(iconEl, 'calendar');
                const titleWrapper = itemEl.createDiv({ cls: 'cpwn-note-title-wrapper' });
                titleWrapper.createDiv({ cls: 'cpwn-note-title' }).setText(event.summary);
                if (!event.isAllDay && event.startTime && event.endTime) {
                    const timeString = `${event.startTime} - ${event.endTime}`;
                    titleWrapper.createDiv({ text: timeString, cls: 'cpwn-note-path' });
                }
            });
            const hasOtherContent = (dataByType.tasks && dataByType.tasks.length > 0) || (dataByType.daily && dataByType.daily.length > 0);
            if (hasOtherContent) {
                contentWrapper.createDiv({ cls: "cpwn-popup-separator" });
            }
        }

        const addFileToList = (container, file, type) => {
            const itemEl = container.createDiv({ cls: 'cpwn-other-notes-popup-item' });
            const settings = this.plugin.settings;
            const dot = itemEl.createDiv({ cls: 'cpwn-popup-file-dot' });
            if (type === 'daily') {
                dot.style.backgroundColor = settings.dailyNoteDotColor;
            } else if (type === 'created') {
                dot.style.backgroundColor = settings.noteCreatedColor;
            } else if (type === 'modified') {
                dot.style.backgroundColor = settings.noteModifiedColor;
            } else if (type === 'asset') {
                dot.style.backgroundColor = settings.assetDotColor;
            }
            if (type === 'asset' && this.isImageAsset(file)) {
                const thumbnail = itemEl.createEl('img', { cls: 'cpwn-popup-asset-thumbnail' });
                thumbnail.src = this.app.vault.getResourcePath(file);
            }
            const titlePathWrapper = itemEl.createDiv({ cls: 'cpwn-note-title-path-wrapper' });
            const displayName = file.path.toLowerCase().endsWith('.md') ? file.basename : file.name;
            titlePathWrapper.createDiv({ text: displayName, cls: 'cpwn-note-title' });
            if (file.parent && file.parent.path !== '/') {
                titlePathWrapper.createDiv({ text: file.parent.path, cls: 'cpwn-note-path' });
            }

            itemEl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.handleFileClick(file, e, {});
                this.hideFilePopup();
            });
        };

        const addTaskToList = async (container, task, view) => {
            // 1. Create the main item container. Make it a flexbox.
            const itemEl = container.createDiv({ cls: 'cpwn-other-notes-popup-item' });
            itemEl.style.display = 'flex';
            itemEl.style.alignItems = 'baseline'; // Use baseline alignment.
            itemEl.style.gap = '6px';             // Add a gap between all items.

            // Add dataset properties
            itemEl.dataset.taskStatus = task.status.type;
            itemEl.dataset.taskPath = task.path;
            itemEl.dataset.lineNumber = task.lineNumber;

            // --- Create all items directly inside itemEl in the correct order ---

            // 2. Create the Checkbox
            const checkbox = itemEl.createDiv({ cls: 'cpwn-task-checkbox-symbol' });
            await view.renderTaskSymbol(checkbox, task);


            // 3. Create the Text Span for the description
            const textSpan = itemEl.createSpan({ cls: 'cpwn-task-text' });
            if (task.status.type === 'DONE') {
                textSpan.classList.add('completed');
            }

            const priority = task.priority ?? 2;
            const iconEmoji = view.getPriorityIconHTML(priority);
            let descriptionToRender = task.description;

            if (iconEmoji && priority !== 2) { // Only add icon if NOT normal priority
                descriptionToRender = `${iconEmoji} ${task.description}`;
            }


            // Render the markdown into the text span
            await MarkdownRenderer.render(view.app, descriptionToRender, textSpan, task.path, view);

            // --- Event listener remains the same ---
            itemEl.addEventListener('click', (e) => {
                if (e.target.closest('.cpwn-task-checkbox-symbol')) {
                    e.stopPropagation();
                    view.toggleTaskCompletion(task);
                    return;
                }

                e.stopPropagation();
                e.stopImmediatePropagation();

                const file = view.app.vault.getAbstractFileByPath(task.path);
                if (file) {
                    view.handleFileClick(file, e, { line: task.lineNumber });
                }
                view.hideFilePopup();
            });
        };

        // logic for populating the content
        const allFiles = [...(dataByType.daily || []), ...(dataByType.created || []), ...(dataByType.modified || []), ...(dataByType.assets || [])];
        const hasTasks = dataByType.tasks && dataByType.tasks.length > 0;
        const hasFiles = allFiles.length > 0;

        if (hasTasks) {
            contentWrapper.createEl('h6', { text: 'Tasks', cls: 'cpwn-popup-section-header' });

            // Sorts the tasks array in place by date, in ascending order.
            dataByType.tasks.sort((a, b) => {
                const timeA = a.due?.moment ? a.due.moment.valueOf() : 0;
                const timeB = b.due?.moment ? b.due.moment.valueOf() : 0;
                return timeA - timeB;
            });

            for (const task of dataByType.tasks) {
                await addTaskToList(contentWrapper, task, this);
            }


        }
        if (hasTasks && hasFiles) {
            contentWrapper.createDiv({ cls: 'cpwn-popup-separator' });
        }
        if (hasFiles) {
            contentWrapper.createEl('h6', { text: 'Notes & assets', cls: 'cpwn-popup-section-header' });

            // Create a Set to keep track of the paths of files already added to the popup.
            const renderedFilePaths = new Set();

            // Helper function to render a file only if it hasn't been rendered yet.
            const addUniqueFile = (file, type) => {
                if (file && file.path && !renderedFilePaths.has(file.path)) {
                    addFileToList(contentWrapper, file, type);
                    renderedFilePaths.add(file.path);
                }
            };

            // Process daily notes first to give them priority.
            (dataByType.daily || []).forEach(file => addUniqueFile(file, 'daily'));

            // Process created, modified, and asset notes, skipping any that are already rendered.
            (dataByType.created || []).forEach(file => addUniqueFile(file, 'created'));
            (dataByType.modified || []).forEach(file => addUniqueFile(file, 'modified'));
            (dataByType.assets || []).forEach(file => addUniqueFile(file, 'asset'));

        }

        if (!contentWrapper.hasChildNodes()) {
            this.hideFilePopup();
            return;
        }

        // event listeners and positioning logic
        this.popupEl.addEventListener('mouseenter', () => window.clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = window.setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });

        document.body.appendChild(this.popupEl);

        this.popupEl.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (isMobile) {
            const margin = 8;

            this.popupEl.classList.add('cpwn-context-menu');
            this.popupEl.style.setProperty('--menu-width', `calc(100% - ${margin * 2}px)`);
            this.popupEl.style.setProperty('--menu-bottom', `${margin}px`);
            this.popupEl.style.setProperty('--menu-left', `${margin}px`);


            this.popupEl.style.top = '';
            this.popupEl.style.visibility = 'visible';
        } else {
            const popupRect = this.popupEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const margin = this.plugin.settings.popupGap;
            let finalTop = targetRect.bottom + margin;
            if (finalTop + popupRect.height > viewportHeight) finalTop = targetRect.top - popupRect.height - margin;
            if (finalTop < margin) finalTop = margin;
            let finalLeft = targetRect.left;
            if (finalLeft + popupRect.width > viewportWidth - margin) finalLeft = targetRect.right - popupRect.width;
            if (finalLeft < margin) finalLeft = margin;
            this.popupEl.style.top = `${finalTop}px`;
            this.popupEl.style.left = `${finalLeft}px`;
            this.popupEl.style.visibility = 'visible';
        }
    }

    /**
     * Hides and destroys the file popup element.
     */
    hideFilePopup() {
        window.clearTimeout(this.hoverTimeout);
        window.clearTimeout(this.hideTimeout);

        this.activePopupArgs = null;

        if (this.popupEl) {
            this.popupEl.remove();
            this.popupEl = null;
            this.activeHoverCell = null;
            // this.taskRefreshDebounceTimer = null;
            //this.dashboardRefreshDebounceTimer = null;
            this.taskCache = new Map();
        }


    }

    // Updates the month title element with the currently displayed month.
    updateMonthTitle() {
        this.populateStyledTitle(this.monthNameEl, this.displayedMonth);
    }

    // Changes the displayed month by a given offset or resets to the current month.
    changeMonth(offset, toToday = false) {
        if (toToday) {
            this.displayedMonth = new Date();
        } else {
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() + offset, 1);
        }

        this.updateMonthTitle();
        this.renderCalendar();
        this.updateTodayBtnAriaLabel();

        this.updateDayHeaderHighlight();
    }

    // Updates the label of the "Today" button based on the current state.
    updateTodayBtnAriaLabel() {
        const now = new Date();
        const isCurrentMonth = moment(this.displayedMonth).isSame(now, 'month');
        let label;

        if (isCurrentMonth) {
            label = this.isPopupLocked ? 'Popups disabled. Click to re-enable.' : 'Popups enabled. Click to disable.';
        } else {
            label = 'Go to current month';
        }
        this.todayBtn.setAttribute('aria-label', label);
    }

    // Checks if an element is fully within the viewport.
    isElementInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Adds keyboard event listeners to a row element for list navigation.
     * @param {HTMLElement} row The row element (e.g., a `.cpwn-note-row` or `.cpwn-task-row`).
     * @param {HTMLInputElement} searchInputEl The search input associated with the list.
     */
    addKeydownListeners(row, searchInputEl) {
        row.setAttribute('tabindex', -1); // Make the row focusable.
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                row.click();
                return;
            }

            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            const container = row.closest('.cpwn-notes-container, .cpwn-tasks-container');
            if (!container) return;

            const items = Array.from(container.querySelectorAll('.cpwn-note-row, .cpwn-task-row'));
            const currentIndex = items.indexOf(row);

            let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

            if (nextIndex >= 0 && nextIndex < items.length) {
                items[nextIndex].focus();
            } else if (e.key === 'ArrowUp' && searchInputEl) {
                // If at the top of the list, focus the search input.
                searchInputEl.focus();
            }
        });
    }

    /**
     * Populates the "Notes" tab with either recent or pinned notes.
     */
    async populateNotes() {
        if (!this.notesContentEl) return;
        this.notesContentEl.empty();

        const settings = this.plugin.settings;
        let notesToShow = [];

        // --- 1. FILTER AND SORT NOTES ---
        if (this.notesViewMode === 'pinned') {
            const pinValue = settings.pinTag.toLowerCase();
            notesToShow = this.app.vault.getMarkdownFiles().filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache) return false;

                if (cache.tags?.some(tag => tag.tag.toLowerCase().includes(pinValue))) {
                    return true;
                }

                const frontmatter = cache.frontmatter;
                if (frontmatter) {
                    for (const key in frontmatter) {
                        const value = frontmatter[key];
                        if (typeof value === 'string' && value.toLowerCase().includes(pinValue)) {
                            return true;
                        }
                        if (Array.isArray(value) && value.some(item => typeof item === 'string' && item.toLowerCase().includes(pinValue))) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (this.pinnedSortOrder === 'z-a') {
                notesToShow.sort((a, b) => b.basename.localeCompare(a.basename));
            } else if (this.pinnedSortOrder === 'custom') {
                const customOrder = settings.pinnedNotesCustomOrder;
                notesToShow.sort((a, b) => {
                    const indexA = customOrder.indexOf(a.path);
                    const indexB = customOrder.indexOf(b.path);

                    if (indexA !== -1 && indexB !== -1) {
                        return indexA - indexB;
                    }
                    if (indexA !== -1) {
                        return -1;
                    }
                    if (indexB !== -1) {
                        return 1;
                    }
                    return a.basename.localeCompare(b.basename);
                });
            } else { // a-z
                notesToShow.sort((a, b) => a.basename.localeCompare(b.basename));
            }
        } else { // recent notes mode
            // When not in pinned mode, ensure reorder mode is always off
            this.isReorderModeActive = false;
            const cutoff = moment().subtract(settings.notesLookbackDays, 'days').valueOf();
            notesToShow = this.app.vault.getMarkdownFiles()
                .filter(file => !settings.ignoreFolders.some(f => file.path.startsWith(f)) && (file.stat.mtime >= cutoff || file.stat.ctime >= cutoff))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);
        }

        // --- 2. APPLY SEARCH TERM ---
        // --- Filtering Logic ---
        const searchTerm = this.notesSearchTerm.toLowerCase();

        let filteredNotes;

        if (searchTerm.startsWith('#')) {
            const tagToFilter = searchTerm.toLowerCase();
            const tagWithoutHash = tagToFilter.substring(1);

            filteredNotes = notesToShow.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache) return false;

                // 1. Check inline tags
                if (cache.tags && cache.tags.some(t => t.tag.toLowerCase() === tagToFilter)) {
                    return true;
                }

                // 2. Check frontmatter 'tags' property
                if (cache.frontmatter && cache.frontmatter.tags) {
                    const fmTags = Array.isArray(cache.frontmatter.tags) ? cache.frontmatter.tags : [cache.frontmatter.tags];
                    if (fmTags.some(tag => typeof tag === 'string' && tag.toLowerCase() === tagWithoutHash)) {
                        return true;
                    }
                }

                // 3. Check frontmatter 'tag' property (singular)
                if (cache.frontmatter && typeof cache.frontmatter.tag === 'string' && cache.frontmatter.tag.toLowerCase() === tagWithoutHash) {
                    return true;
                }

                return false;
            });
        } else if (searchTerm === 'status:unlinked') {
            // This is a placeholder for the unlinked notes logic you might add
            // For now, it will show all notes. Replace with actual logic.
            filteredNotes = notesToShow;
        } else if (searchTerm) {
            //filteredNotes = notesToShow.filter(file => file.basename.toLowerCase().includes(searchTerm));
            const parsedGroups = this.parseSearchQuery(searchTerm.toLowerCase());
            filteredNotes = notesToShow.filter(file =>
                this.searchMatchesNote(file, parsedGroups)
            );

        } else {
            filteredNotes = notesToShow;
        }

        // --- 3. RENDER THE VIEW ---
        if (this.notesViewMode === 'pinned') {
            const groupContainer = this.notesContentEl.createDiv({ cls: 'cpwn-note-group-container' });
            // Apply the reorder mode class if it's active
            if (this.isReorderModeActive) {
                groupContainer.addClass('cpwn-reorder-mode-active');
            }

            const header = groupContainer.createDiv({ cls: 'cpwn-note-group-header' });
            const headerContent = header.createDiv({ cls: 'cpwn-note-group-header-content', attr: { 'aria-live': 'polite' } });
            setIcon(headerContent, settings.tabIcons.pinned || 'pin');
            headerContent.createSpan({ text: 'Pinned notes' });

            const sortIndicator = headerContent.createSpan({ cls: 'cpwn-pinned-sort-indicator' });
            const updateSortVisuals = () => {
                if (this.pinnedSortOrder === 'z-a') {
                    sortIndicator.setText('Z-A');
                    headerContent.setAttribute('aria-label', 'Current sort: Z-A. Click for Custom sort.');
                } else if (this.pinnedSortOrder === 'custom') {
                    sortIndicator.setText('Custom');
                    headerContent.setAttribute('aria-label', 'Current sort: Custom. Click for A-Z sort.');
                } else { // a-z
                    sortIndicator.setText('A-Z');
                    headerContent.setAttribute('aria-label', 'Current sort: A-Z. Click for Z-A sort.');
                }
            };
            updateSortVisuals();

            let longPressTriggered = false;

            // A standard click cycles through sort orders and disables reorder mode.
            headerContent.addEventListener('click', () => {

                if (longPressTriggered) {
                    longPressTriggered = false;
                    return;
                }

                this.isReorderModeActive = false; // Always disable reorder mode on click
                if (this.pinnedSortOrder === 'a-z') this.pinnedSortOrder = 'z-a';
                else if (this.pinnedSortOrder === 'z-a') this.pinnedSortOrder = 'custom';
                else this.pinnedSortOrder = 'a-z';
                this.populateNotes();
            });

            // A long-press on mobile (in custom sort) toggles reorder mode.
            if (Platform.isMobile) {
                let touchTimer = null;
                headerContent.addEventListener('touchstart', (e) => {
                    if (this.pinnedSortOrder !== 'custom') return;
                    e.preventDefault();
                    longPressTriggered = false;
                    touchTimer = window.setTimeout(() => {
                        touchTimer = null;
                        longPressTriggered = true;

                        this.isReorderModeActive = !this.isReorderModeActive;
                        if (navigator.vibrate) navigator.vibrate(50);
                        this.populateNotes(); // Re-render to show/hide handles
                    }, 700);
                });
                const cancelTimer = () => window.clearTimeout(touchTimer);
                headerContent.addEventListener('touchend', cancelTimer);
                headerContent.addEventListener('touchmove', cancelTimer);
            }

            header.createDiv({ cls: 'cpwn-note-group-count', text: filteredNotes.length.toString() });

            const listWrapper = groupContainer.createDiv({ cls: 'cpwn-note-list-wrapper' });

            if (filteredNotes.length === 0) {
                const emptyMessageEl = listWrapper.createDiv({ cls: 'cpwn-pinned-notes-empty-message' });
                const pinTag = this.plugin.settings.pinTag || 'pin'; // Safely get the tag
                emptyMessageEl.innerHTML = `No pinned notes. To pin a note, add the <code>#${pinTag}</code> tag to its properties or body.`;
            } else {
                listWrapper.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    await this.savePinnedOrder(listWrapper);
                });

                filteredNotes.forEach(file => this.renderNoteItem(file, listWrapper));
            }

        } else { // recent notes mode
            const groups = {
                today: [],
                yesterday: [],
                thisWeek: [],
                lastWeek: [],
            };
            const groupOrder = [
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'thisWeek', label: 'This week' },
                { key: 'lastWeek', label: 'Last week' },
            ];
            const now = moment();
            const startOfThisWeek = now.clone().startOf('week');
            const startOfLastWeek = now.clone().subtract(1, 'week').startOf('week');

            for (let i = 0; i < 12; i++) {
                const month = now.clone().subtract(i, 'months');
                const monthKey = month.format('YYYY-MM');
                if (!groups[monthKey]) {
                    groups[monthKey] = [];
                    groupOrder.push({ key: monthKey, label: month.format('MMMM YYYY') });
                }
            }
            groups['older'] = [];
            groupOrder.push({ key: 'older', label: 'Older' });

            // --- 2. NOTE SORTING LOGIC ---
            filteredNotes.forEach(file => {
                const modTime = moment(file.stat.mtime);
                if (modTime.isSame(now, 'day')) {
                    groups.today.push(file);
                } else if (modTime.isSame(now.clone().subtract(1, 'day'), 'day')) {
                    groups.yesterday.push(file);
                } else if (modTime.isAfter(startOfThisWeek)) {
                    groups.thisWeek.push(file);
                } else if (modTime.isAfter(startOfLastWeek)) {
                    groups.lastWeek.push(file);
                } else {
                    const monthKey = modTime.format('YYYY-MM');
                    if (groups[monthKey]) {
                        groups[monthKey].push(file);
                    } else {
                        groups.older.push(file);
                    }
                }
            });

            // --- 3. RENDERING WITH DEFAULT COLLAPSE LOGIC ---
            groupOrder.forEach(groupInfo => {
                const notesInGroup = groups[groupInfo.key];
                if (notesInGroup.length > 0) {
                    const groupContainer = this.notesContentEl.createDiv({ cls: 'cpwn-note-group-container' });

                    // Apply the default collapsed state for monthly groups
                    const isMonthlyGroup = /^\d{4}-\d{2}$/.test(groupInfo.key);
                    let isCollapsed;

                    if (isMonthlyGroup) {
                        isCollapsed = this.collapsedNoteGroups[groupInfo.key] !== false;
                    } else {
                        isCollapsed = this.collapsedNoteGroups[groupInfo.key] === true;
                    }

                    if (isCollapsed) {
                        groupContainer.addClass('cpwn-is-collapsed');
                    }

                    const header = groupContainer.createDiv({ cls: 'cpwn-note-group-header' });
                    const headerContent = header.createDiv({ cls: 'cpwn-note-group-header-content' });
                    const collapseIcon = headerContent.createDiv({ cls: 'cpwn-note-group-collapse-icon' });
                    setIcon(collapseIcon, 'chevron-down');
                    headerContent.createSpan({ text: groupInfo.label });
                    header.createDiv({ cls: 'cpwn-note-group-count', text: notesInGroup.length.toString() });

                    header.addEventListener('click', () => {
                        const currentlyCollapsed = groupContainer.classList.toggle('cpwn-is-collapsed');
                        this.collapsedNoteGroups[groupInfo.key] = currentlyCollapsed;
                        this.plugin.saveSettings();
                    });

                    const listWrapper = groupContainer.createDiv({ cls: 'cpwn-note-list-wrapper' });
                    notesInGroup.forEach(file => this.renderNoteItem(file, listWrapper));
                }
            });
        }
    }

    async populateTasks() {
        // 1. Safety check and clear the existing content
        if (!this.tasksContentEl) return;
        this.tasksContentEl.empty();

        // 2. Ensure the master task list is up-to-date
        await this.buildAllTasksList();

        const settings = this.plugin.settings;
        const searchTerm = (this.tasksSearchTerm || '').toLowerCase();

        // 3. Filter tasks from the master list (this.allTasks)
        let filteredTasks = this.allTasks;

        const now = moment();
        const startOfToday = now.clone().startOf('day');
        const endOfToday = now.clone().endOf('day');

        if (this.plugin.settings.showCompletedTasksToday) {
            filteredTasks = this.allTasks.filter(task => {
                const isCompleted = task.status?.type === 'DONE';

                if (!isCompleted) {
                    // Always show incomplete tasks
                    return true;
                }

                // For completed tasks, only show if completed today
                const completionDate = task.done?.moment;
                if (completionDate) {
                    //console.log('Completion Date:', completionDate.format());
                    return completionDate.isSame(moment(), 'day');
                }

                // If no completion date, don't show completed tasks
                return false;
            });
        }


        if (searchTerm) {

            const searchTerm = this.tasksSearchTerm.toLowerCase();
            const parsedGroups = this.parseSearchQuery(searchTerm);
            filteredTasks = this.allTasks.filter(task =>
                searchTerm === "" ? true : this.searchMatches(task.description.toLowerCase(), parsedGroups)
            );



            /*filteredTasks = this.allTasks.filter(task =>
                task.description.toLowerCase().includes(searchTerm)
            );
            */
        } else {

            if (settings.hideCompletedTasks) {
                filteredTasks = filteredTasks.filter(t => t.status.type !== 'DONE');
            }
        }

        // 4. Sort the filtered tasks
        filteredTasks.sort((a, b) => {
            if (settings.taskSortOrder === 'a-z') return a.description.localeCompare(b.description);
            if (settings.taskSortOrder === 'z-a') return b.description.localeCompare(a.description);

            const aDue = a.due?.moment;
            const bDue = b.due?.moment;
            if (aDue && bDue) return aDue.isBefore(bDue) ? -1 : 1;
            return aDue ? -1 : (bDue ? 1 : a.description.localeCompare(b.description));
        });

        // 5. Group and render the tasks
        const newGroupData = settings.taskGroupBy === 'tag'
            ? this.groupTasksByTag(filteredTasks)
            : this.groupTasksByDate(filteredTasks);

        this.reconcileTaskGroups(newGroupData);
    }

    // Renders the checkbox symbol for a task using MarkdownRenderer.
    async renderTaskSymbol(checkboxEl, task) {
        checkboxEl.empty();
        checkboxEl.className = 'cpwn-task-checkbox-symbol';

        const status = task.status;

        // Create a minimal markdown string with the task
        const markdownText = `- [${task.status.symbol}] `;
        //`- [${status}] `;

        // Use MarkdownRenderer to render it - this will inherit ALL theme styling
        await MarkdownRenderer.render(
            this.app,
            markdownText,
            checkboxEl,
            task.path,
            this
        );
    }

    // Generates a unique, stable key for a task item for DOM reconciliation.
    getTaskKey(task) {
        // A key made of the file path and line number is guaranteed to be unique.
        return `${task.path}#${task.lineNumber}`;
    }

    // Groups tasks by their due date, adding the necessary metadata for rendering.
    groupTasksByDate(tasks) {
        const settings = this.plugin.settings;
        const now = moment().startOf('day');

        const groupsData = { overdue: [], today: [], tomorrow: [], next7days: [], future: [], noDate: [], completed: [] };
        tasks.forEach(task => {

            // console.log(task.status?.type);
            if (task.status?.type === 'DONE') {
                groupsData.completed.push(task);
                return;
            }

            if (!task.due?.moment) {
                groupsData.noDate.push(task);
                return;
            }
            const due = task.due.moment.startOf('day');
            if (due.isBefore(now)) { groupsData.overdue.push(task); }
            else if (due.isSame(now)) { groupsData.today.push(task); }
            else if (due.isSame(now.clone().add(1, 'day'))) { groupsData.tomorrow.push(task); }
            else if (due.isSameOrBefore(now.clone().add(7, 'days'))) { groupsData.next7days.push(task); }
            else { groupsData.future.push(task); }
        });

        const icons = settings.taskGroupIcons || DEFAULT_SETTINGS.taskGroupIcons;
        const groupOrder = [
            { key: 'overdue', title: 'Overdue', icon: icons.overdue, color: settings.taskGroupColorOverdue },
            { key: 'today', title: 'Today', icon: icons.today, color: settings.taskGroupColorToday },
            { key: 'tomorrow', title: 'Tomorrow', icon: icons.tomorrow, color: settings.taskGroupColorTomorrow },
            { key: 'next7days', title: 'Next 7 days', icon: icons.next7days, color: settings.taskGroupColorNext7Days },
            { key: 'future', title: 'Future', icon: icons.future, color: settings.taskGroupColorFuture },
            { key: 'noDate', title: 'Someday', icon: icons.noDate, color: settings.taskGroupColorNoDate },
            { key: 'completed', title: 'Completed', icon: 'check-check', color: settings.taskGroupColorNoDate }


        ];

        const finalGroups = {};
        groupOrder.forEach(g => {
            const showGroup = settings.taskDateGroupsToShow.includes(g.key);
            const tasksInGroup = groupsData[g.key];

            const shouldShowCompleted = (g.key === 'completed' && this.tasksSearchTerm && tasksInGroup && tasksInGroup.length > 0);

            if ((showGroup || shouldShowCompleted) && tasksInGroup && tasksInGroup.length > 0) {
                finalGroups[g.key] = {
                    ...g,
                    tasks: tasksInGroup
                };
            }

        });

        return finalGroups;
    }

    // Groups tasks by tag, adding metadata for rendering.
    groupTasksByTag(tasks) {
        const settings = this.plugin.settings;
        const groupedByTag = tasks.reduce((acc, task) => {
            const tags = task.tags.length > 0 ? task.tags.map(t => `#${t}`) : ['#untagged'];
            tags.forEach(tag => {
                const key = tag.toLowerCase();
                const cleanTag = tag.replace(/^#+\s*/, ''); // Add this line
                if (!acc[key]) acc[key] = { title: cleanTag, icon: settings.taskGroupIcons?.tag ?? tag, color: settings.taskGroupColorTag, tasks: [] };

                if (!acc[key]) {
                    acc[key] = {
                        title: tag,
                        icon: settings.taskGroupIcons?.tag || 'tag',
                        color: settings.taskGroupColorTag,
                        tasks: []
                    };
                }
                acc[key].tasks.push(task);
            });
            return acc;
        }, {});

        const sortedKeys = Object.keys(groupedByTag).sort((a, b) => a.localeCompare(b));
        const sortedGroups = {};
        for (const key of sortedKeys) {
            sortedGroups[key] = groupedByTag[key];
        }
        return sortedGroups;
    }

    // Renders a single task group container.
    renderTaskGroup(key, groupData) {
        const groupContainer = createDiv({ cls: 'cpwn-task-group-container', attr: { style: `background-color: ${groupData.color}` } });
        groupContainer.dataset.groupKey = key;

        const isCollapsed = this.plugin.settings.collapsedTaskGroups[key];
        if (isCollapsed) groupContainer.addClass('cpwn-is-collapsed');

        const header = groupContainer.createDiv({ cls: 'cpwn-task-group-header' });
        header.addEventListener('click', () => {
            const isCurrentlyCollapsed = groupContainer.classList.toggle('cpwn-is-collapsed');
            this.plugin.settings.collapsedTaskGroups[key] = isCurrentlyCollapsed;
            this.plugin.saveSettings();
            setIcon(collapseIcon, isCurrentlyCollapsed ? 'chevron-right' : 'chevron-down');

        });

        const headerContent = header.createSpan({ cls: 'cpwn-task-group-header-content' });
        const iconEl = headerContent.createSpan({ cls: 'icon' });
        setIcon(iconEl, groupData.icon); // Sets the group icon (e.g., calendar)
        headerContent.createSpan({ text: `${groupData.title} (${groupData.tasks.length})` });

        const collapseIcon = header.createSpan({ cls: 'cpwn-task-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');

        const taskListWrapper = groupContainer.createDiv('cpwn-task-list-wrapper');
        groupData.tasks.forEach(task => {
            const taskEl = this.renderTaskItem(task);
            taskListWrapper.appendChild(taskEl);
        });

        return groupContainer;
    }

    // Renders a single task row.
    renderTaskItem(task) {
        const taskRow = createDiv({ cls: 'cpwn-task-row' });
        taskRow.dataset.key = this.getTaskKey(task);
        taskRow.dataset.taskStatus = task.status.type;

        // Add flexbox for proper alignment
        //taskRow.style.display = 'flex';
        //taskRow.style.alignItems = 'flex-start'; // Aligns checkbox with first line of text
        //taskRow.style.gap = '10px'; // Space between checkbox and text
        taskRow.classList.add('cpwn-task-row');


        const checkbox = taskRow.createDiv({ cls: 'cpwn-task-checkbox-symbol' });

        //checkbox.style.flexShrink = '0'; // Prevent checkbox from shrinking
        //checkbox.style.marginLeft = '-4px';
        //checkbox.style.marginTop = '4px';
        checkbox.classList.add('cpwn-task-checkbox-symbol');

        this.renderTaskSymbol(checkbox, task);
        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.toggleTaskCompletion(task);
        });

        const textEl = taskRow.createSpan({ cls: 'cpwn-task-text' });
        //textEl.style.flex = '1'; // Text takes remaining space
        //textEl.style.minWidth = '0'; // Allows proper text wrapping
        textEl.classList.add('cpwn-task-text');
        if (task.status.type === 'DONE') {
            textEl.classList.add('completed');
        }

        // Prepend priority icon to the description text
        const priority = task.priority ?? 2;
        const iconEmoji = this.getPriorityIconHTML(priority);
        let descriptionToRender = task.description;

        if (iconEmoji && priority !== 2) {
            descriptionToRender = `${iconEmoji} ${task.description}`;
        }

        // Render the markdown with the icon prepended
        MarkdownRenderer.render(this.app, descriptionToRender, textEl, task.path, this);

        taskRow.addEventListener('click', () => {
            this.app.workspace.openLinkText(task.path, '', false, { eState: { line: task.lineNumber } });
        });

        return taskRow;
    }



    // Updates an existing task row in the DOM.
    updateTaskItem(taskRowEl, task) {
        if (taskRowEl.dataset.taskStatus !== task.status.type) {
            const checkbox = taskRowEl.querySelector('.cpwn-task-checkbox-symbol');
            if (checkbox) {
                this.renderTaskSymbol(checkbox, task);  // No await
            }
            taskRowEl.dataset.taskStatus = task.status.type;
            taskRowEl.querySelector('.cpwn-task-text')?.classList.toggle('completed', task.status.type === 'DONE');
        }

        const textEl = taskRowEl.querySelector('.cpwn-task-text');
        if (textEl && textEl.textContent !== task.description) {
            textEl.empty();
            MarkdownRenderer.render(this.app, task.description, textEl, task.path, this);
        }
    }

    // Reconciles the list of tasks within a single group.
    reconcileTaskList(listWrapperEl, newTasks) {
        const existingTaskRows = new Map();
        listWrapperEl.querySelectorAll('.cpwn-task-row').forEach(row => {
            if (row.dataset.key) {
                existingTaskRows.set(row.dataset.key, row);
            }
        });

        let lastElement = null;
        newTasks.forEach(task => {
            const taskKey = this.getTaskKey(task);
            let taskEl = existingTaskRows.get(taskKey);

            if (taskEl) {
                this.updateTaskItem(taskEl, task);
                existingTaskRows.delete(taskKey);
            } else {
                taskEl = this.renderTaskItem(task);
            }

            if (lastElement) {
                lastElement.after(taskEl);
            } else {
                listWrapperEl.prepend(taskEl);
            }
            lastElement = taskEl;
        });

        existingTaskRows.forEach(row => row.remove());
    }

    // Reconciles the entire list of task groups.
    reconcileTaskGroups(newGroupData) {
        const existingGroups = new Map();
        this.tasksContentEl.querySelectorAll('.cpwn-task-group-container').forEach(groupEl => {
            if (groupEl.dataset.groupKey) {
                existingGroups.set(groupEl.dataset.groupKey, groupEl);
            }
        });

        const groupOrder = Object.keys(newGroupData);
        let lastElement = null;

        groupOrder.forEach(groupKey => {
            const groupData = newGroupData[groupKey];
            let groupEl = existingGroups.get(groupKey);

            if (groupEl) {
                const headerContent = groupEl.querySelector('.cpwn-task-group-header-content span:last-of-type');
                if (headerContent) {
                    headerContent.textContent = `${groupData.title} (${groupData.tasks.length})`;
                }
                this.reconcileTaskList(groupEl.querySelector('.cpwn-task-list-wrapper'), groupData.tasks);
                existingGroups.delete(groupKey);
            } else {
                groupEl = this.renderTaskGroup(groupKey, groupData);
            }

            if (lastElement) {
                lastElement.after(groupEl);
            } else {
                this.tasksContentEl.prepend(groupEl);
            }
            lastElement = groupEl;
        });

        existingGroups.forEach(groupEl => groupEl.remove());

        const emptyMessageEl = this.tasksContentEl.querySelector('.cpwn-task-group-empty-message');
        if (groupOrder.length === 0 && !emptyMessageEl) {
            const message = this.tasksSearchTerm ? 'No tasks match your search.' : 'No tasks found.';
            this.tasksContentEl.createDiv({ text: message, cls: 'cpwn-task-group-empty-message' });
        } else if (groupOrder.length > 0 && emptyMessageEl) {
            emptyMessageEl.remove();
        }
    }

    async waitForFileMutation(path, timeoutMs = 1500) {
        return new Promise((resolve) => {
            let done = false;
            const finish = () => { if (done) return; done = true; resolve(); };

            // Resolve on either metadata cache change or vault modify for this file
            const onMeta = this.app.metadataCache.on('changed', (file) => {
                if (file?.path === path) finish();
            });
            const onModify = this.app.vault.on('modify', (file) => {
                if (file?.path === path) finish();
            });

            // Ensure handlers are cleaned up by the plugin when the view unloads
            this.registerEvent(onMeta);
            this.registerEvent(onModify);

            window.setTimeout(finish, timeoutMs);
        });
    }

    // Prefer the Tasks plugin’s authoritative event
    async waitForTasksChangedOnce(timeoutMs = 500) {
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => { if (settled) return; settled = true; resolve(); };

            const ref = this.app.workspace.on('tasks-changed', () => finish());
            this.registerEvent(ref);

            // Fallback if plugin doesn’t emit in time
            window.setTimeout(finish, timeoutMs);
        });
    }

    /**
     * Toggles the completion state of a task by modifying the source Markdown file.
     * @param {object} task The task object to toggle.
     */
    // In toggleTaskCompletion: write → await tasks-changed (authoritative) → return
    async toggleTaskCompletion(task) {
        const tasksApi = this.app.plugins.plugins['obsidian-tasks-plugin']?.apiV1;
        if (!tasksApi) { new Notice('Tasks API not found.'); return; }

        const file = this.app.vault.getAbstractFileByPath(task.path);
        if (!(file instanceof TFile)) return;

        this.isTogglingTask = true;
        try {
            const content = await this.app.vault.read(file);
            const lines = content.split('\n');
            const currentLine = lines[task.lineNumber];
            if (currentLine === undefined) throw new Error('Task line not found.');

            const updatedLine = tasksApi.executeToggleTaskDoneCommand(currentLine, task.path);
            lines.splice(task.lineNumber, 1, updatedLine);
            await this.app.vault.modify(file, lines.join('\n'));

            // Prefer Tasks’ update if available; otherwise we already have metadata fallback
            await this.waitForTasksChangedOnce(500);
        } catch (err) {
            console.error('Error toggling task', err);
            new Notice('Failed to toggle task.');
        } finally {
            this.isTogglingTask = false;
        }
    }

    // Refreshes the popup content with the latest data.
    async refreshPopup(popupArgs) {
        if (!popupArgs) return;
        const { targetEl, dateOrTitle, isMobile } = popupArgs;

        let freshData;

        // Logic to get fresh data for the popup
        if (typeof dateOrTitle === 'string') {
            // For dashboard summary widgets
            const originalTaskIds = new Set((popupArgs.dataByType.tasks || []).map(t => `${t.path}|${t.lineNumber}`));
            const freshTasks = this.allTasks.filter(t => originalTaskIds.has(`${t.path}|${t.lineNumber}`));
            freshData = { ...popupArgs.dataByType, tasks: freshTasks };
        } else {
            // For calendar day popups
            const dateKey = moment(dateOrTitle).format('YYYY-MM-DD');
            const freshTasks = this.tasksByDate.get(dateKey) || [];

            // Re-fetch other data types as they might have changed
            const dailyNoteFile = popupArgs.dataByType.daily?.[0]; // Assuming only one daily note
            freshData = {
                ...popupArgs.dataByType,
                tasks: freshTasks,
                daily: dailyNoteFile ? [this.app.vault.getAbstractFileByPath(dailyNoteFile.path)] : [],
            };
        }

        // Re-show the popup immediately with the fresh data.
        this.showFilePopup(targetEl, freshData, dateOrTitle, isMobile);
    }

    // Specifically refreshes task items in the popup.
    async refreshPopupContent() {
        if (!this.popupEl) return;

        const contentWrapper = this.popupEl.querySelector('.cpwn-popup-content-wrapper');
        if (!contentWrapper) return;

        // Find all task items in the popup and update them
        const taskItems = this.popupEl.querySelectorAll('.cpwn-other-notes-popup-item');
        taskItems.forEach(itemEl => {
            // Look up the task in allTasks (which has ALL tasks)
            const freshTask = this.allTasks.find(t =>
                t.path === itemEl.dataset.taskPath &&
                t.lineNumber === parseInt(itemEl.dataset.lineNumber)
            );

            if (freshTask) {
                const textSpan = itemEl.querySelector('.cpwn-task-text');
                if (textSpan) {
                    textSpan.classList.toggle('completed', freshTask.status.type === 'DONE');
                }
                // Also update the checkbox symbol
                const checkbox = itemEl.querySelector('.cpwn-task-checkbox-symbol');
                if (checkbox) {
                    this.renderTaskSymbol(checkbox, freshTask);
                }
            }
        });
    }

    /**
     * Opens the scratchpad note in a new or current tab.
     */
    async openScratchpadFile(forceNewTab = false) {
        const path = this.plugin.settings.fixedNoteFile;

        if (this.app.isMobile) {
            let file = this.app.vault.getAbstractFileByPath(path);
            if (!file) {
                try {
                    file = await this.app.vault.create(path, '');
                } catch (err) {
                    new Notice('Failed to create scratchpad file.');
                    console.error(err);
                    return;
                }
            }

            if (file instanceof TFile) {
                // The `true` argument forces a new leaf, which reliably brings the note to the front on mobile.
                this.app.workspace.getLeaf(true).openFile(file);
            } else {
                new Notice('Scratchpad path is invalid or could not be created.');
            }
            return;
        }

        // First, try to find an already open leaf for this file.
        let targetLeaf = this.app.workspace.getLeavesOfType("markdown").find(leaf => leaf.view.file?.path === path);
        if (targetLeaf) { this.app.workspace.revealLeaf(targetLeaf); return; }

        let file = this.app.vault.getAbstractFileByPath(path);
        // If the file doesn't exist, create it.
        if (!file) file = await this.app.vault.create(path, "").catch(() => new Notice(`Failed to create scratchpad: ${path}`));

        //if (file instanceof TFile) this.app.workspace.getLeaf(this.plugin.settings.scratchpadOpenAction === 'new-tab').openFile(file);
        if (file instanceof TFile) {
            const openInNew = forceNewTab || this.plugin.settings.scratchpadOpenAction === 'new-tab';
            this.app.workspace.getLeaf(openInNew).openFile(file);
        }
    }

    /**
     * Saves text content to the scratchpad note file.
     * @param {string} text The text to save.
     */
    async saveFixedNote(text) { // 'text' is the body content from the textarea
        const path = this.plugin.settings.fixedNoteFile;
        if (!path) return; // Safety check

        const folderPath = path.substring(0, path.lastIndexOf('/'));

        if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
            await this.app.vault.createFolder(folderPath).catch(err => console.error("Error creating folder:", err));
        }

        // Combine the stored frontmatter with the current body text
        const contentToSave = this.scratchpadFrontmatter + text;

        let file = this.app.vault.getAbstractFileByPath(path);
        if (!file) {
            file = await this.app.vault.create(path, contentToSave);
        } else if (file instanceof TFile) {
            await this.app.vault.modify(file, contentToSave);
        }
    }

    /**
     * Loads the content of the scratchpad note file.
     * @returns {Promise<string>} The content of the note, or an empty string if it doesn't exist.
     */
    async loadNote() {
        const path = this.plugin.settings.fixedNoteFile;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) return await this.app.vault.read(file);
        return "";
    }

    /**
     * Opens a daily note for a given date, creating it from a template if it doesn't exist.
     * @param {Date} date The date for the daily note.
     */
    async openDailyNote(date) {
        const {
            dailyNotesFolder,
            dailyNoteDateFormat,
            dailyNoteTemplatePath,
            dailyNoteOpenAction
        } = this.plugin.settings;
        const filename = formatDate(date, dailyNoteDateFormat);
        const path = dailyNotesFolder ? `${dailyNotesFolder}/${filename}.md` : `${filename}.md`;

        let file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
            // File already exists, just open it
            const leaf = this.app.workspace.getLeaf(dailyNoteOpenAction === 'new-tab');
            await leaf.openFile(file);
            return;
        }
        // --- File does NOT exist, proceed with creation ---
        // This inner function is now updated to handle Templater correctly
        const createNote = async (includeEvents = false) => {

            let templateContent = "";
            const templateFile = dailyNoteTemplatePath ? this.app.vault.getAbstractFileByPath(dailyNoteTemplatePath) : null;

            if (templateFile instanceof TFile) {
                templateContent = await this.app.vault.read(templateFile);
            } else {
                console.warn(`Template file not found at: ${dailyNoteTemplatePath}`);
            }

            // Create the note with the placeholder first
            const newFile = await this.app.vault.create(path, templateContent);

            // Open the note
            const leaf = this.app.workspace.getLeaf(dailyNoteOpenAction === "new-tab");
            await leaf.openFile(newFile);

            const placeholder = this.plugin.settings.calendarEventsPlaceholder || '%%CALENDAR_EVENTS%%';

            // If including events, proceed with injection
            if (includeEvents) {
                await new Promise(resolve => window.setTimeout(resolve, 1000)); // Delay

                // 1. Check for events in the map
                const dateKey = moment(date).format("YYYY-MM-DD");
                const eventsForDay = this.icsEventsByDate.get(dateKey);

                if (eventsForDay && eventsForDay.length > 0) {
                    // 2. Format the events into a string
                    const eventContent = this.formatEventsForTemplate(eventsForDay) || "";

                    // 3. Read the file *after* Templater has run
                    let currentContent = await this.app.vault.read(newFile);

                    // 4. Replace placeholder and save
                    if (currentContent.includes(placeholder)) {
                        const finalContent = currentContent.replace(placeholder, eventContent);
                        await this.app.vault.modify(newFile, finalContent);
                    } else {
                        console.error(`Placeholder "${placeholder}" not found in the note after creation. Templater might be removing it.`);
                    }
                } else {
                    console.warn("No events found for this date, so nothing to inject.");
                }
            }
            // Logic for removing placeholder when includeEvents is false can be added here if needed
            else {
                await new Promise(resolve => window.setTimeout(resolve, 200));
                let currentContent = await this.app.vault.read(newFile);
                if (currentContent.includes(placeholder)) {
                    const finalContent = currentContent.replace(placeholder, "").trim();
                    await this.app.vault.modify(newFile, finalContent);
                }
            }
        };

        const hasTemplate = !!dailyNoteTemplatePath && dailyNoteTemplatePath.length > 0;
        // The rest of logic remains unchanged.
        const dateKey = moment(date).format('YYYY-MM-DD');
        const eventsForDay = this.icsEventsByDate.get(dateKey);
        const friendlyDate = date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (eventsForDay && eventsForDay.length > 0) {
            // --- Case 1: Events exist for the selected day ---
            new ActionChoiceModal(this.app,
                `Create daily note for ${friendlyDate}?`,
                "This day has calendar events. How would you like to proceed?",
                [{
                    // Button 1: Always includes events
                    text: hasTemplate ? 'Create with events & template' : 'Create with events',
                    cls: 'mod-cta',
                    action: () => createNote(true)
                }, {
                    // Button 2: Excludes events
                    text: hasTemplate ? 'Create from template only' : 'Create blank note',
                    action: () => createNote(false)
                }, {
                    text: 'Cancel',
                    action: () => { }
                }]
            ).open();
        } else {
            // --- Case 2: No events exist for the selected day ---
            new ActionChoiceModal(this.app,
                'Create daily note?',
                `A daily note for ${friendlyDate} does not exist. Would you like to create it?`,
                [{
                    // The main action button
                    text: hasTemplate ? 'Create from template' : 'Create blank note',
                    cls: 'mod-cta',
                    action: () => createNote(false) // No events to include, so always false
                }, {
                    text: 'Cancel',
                    action: () => { }
                }]
            ).open();
        }
    }
}
