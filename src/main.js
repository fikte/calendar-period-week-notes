/* --cpwn-- Obsidian Plugin: Periodic Notes Calendar View --cpwn--
  Developer: Tim Williams
  This plugin uses library: https://app.unpkg.com/ical.js@2.2.1/files/dist/ical.es5.min.cjs (c) 2024 Chris Lawley, MIT License  
*/

import { Plugin, debounce } from 'obsidian';
import { PeriodMonthView, VIEW_TYPE_PERIOD } from './views/PeriodMonthView.js';
import { PeriodSettingsTab } from './settings/PeriodSettingsTab.js';
import { DEFAULT_SETTINGS } from './data/constants.js';
import { BUNDLED_TEMPLATES } from './data/templates.js';


/**
 * The main plugin class that registers the view and settings tab.
 */
export default class PeriodMonthPlugin extends Plugin {
    tasksAPI;
    themeObserver = null;
    themeChangeDebounceTimer = null;

    async onload() {

        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.updateStyles();
        this.registerView(VIEW_TYPE_PERIOD, leaf => new PeriodMonthView(leaf, this));
        this.addRibbonIcon("calendar-check", "Open Calendar Period Week Notes", () => this.activateView());
        this.addCommand({ id: "open-period-month-view", name: "Open Calendar Period Week Notes", callback: () => this.activateView() });
        await this.resetIcsRefreshInterval();
        this.addSettingTab(new PeriodSettingsTab(this.app, this));

        const debouncedThemeChange = debounce(() => {
            if (this.calendarBodyEl) this.updateStyles();
        }, 100, true);

        this.themeObserver = new MutationObserver(() => {
            debouncedThemeChange();
        });

        this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        this.icsRefreshIntervalId = null;

        this.registerEvent(
            this.app.workspace.on('tasks:changed', () => {
                // console.log("Tasks plugin reported a change. Refreshing view data.");
                // When tasks change anywhere, trigger a full data refresh of your view.
                this.refreshData();
            })
        );

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Injects the plugin's CSS into the document head.
     */
    addStyle() {
        const styleEl = document.createElement('style');
        styleEl.id = 'cpwn-period-month-plugin-styles';
        styleEl.textContent = PLUGIN_STYLES;
        document.head.appendChild(styleEl);
    }

    /**
     * Updates CSS custom properties (variables) based on the current plugin settings.
     */
    updateStyles() {
        const styleProps = {
            '--cpwn-header-font-size': this.settings.fontSize,
            '--cpwn-day-number-font-size': this.settings.dayNumberFontSize,
            '--cpwn-header-row-font-weight': this.settings.headerRowBold ? 'bold' : 'normal',
            '--cpwn-pw-column-font-weight': this.settings.pwColumnBold ? 'bold' : 'normal',
            '--cpwn-month-color-light': this.settings.monthColorLight,
            '--cpwn-month-color-dark': this.settings.monthColorDark,
            '--cpwn-year-color-light': this.settings.yearColorLight,
            '--cpwn-year-color-dark': this.settings.yearColorDark,
            '--cpwn-current-highlight-label-color-light': this.settings.currentHighlightLabelColorLight,
            '--cpwn-current-highlight-label-color-dark': this.settings.currentHighlightLabelColorDark,
            '--cpwn-pw-separator-color': this.settings.pwColumnSeparatorColor,
            '--cpwn-pw-column-font-color-light': this.settings.pwColumnFontColorLight,
            '--cpwn-pw-column-font-color-dark': this.settings.pwColumnFontColorDark,
            '--cpwn-week-number-font-color-light': this.settings.weekNumberFontColorLight,
            '--cpwn-week-number-font-color-dark': this.settings.weekNumberFontColorDark,
            '--cpwn-day-header-font-color-light': this.settings.dayHeaderFontColorLight,
            '--cpwn-day-header-font-color-dark': this.settings.dayHeaderFontColorDark,
            '--cpwn-day-cell-font-color-light': this.settings.dayCellFontColorLight,
            '--cpwn-day-cell-font-color-dark': this.settings.dayCellFontColorDark,
            '--cpwn-other-month-font-color-light': this.settings.otherMonthFontColorLight,
            '--cpwn-other-month-font-color-dark': this.settings.otherMonthFontColorDark,
            '--cpwn-scratch-font-family': this.settings.scratchFontFamily,
            '--cpwn-scratch-font-size': this.settings.scratchFontSize,
            '--cpwn-scratch-bold': this.settings.scratchBold ? 'bold' : 'normal',
            '--cpwn-notes-font-size': this.settings.notesFontSize,
            '--cpwn-notes-bold': this.settings.notesBold ? 'bold' : 'normal',
            '--cpwn-tab-title-font-size': this.settings.tabTitleFontSize,
            '--cpwn-tab-title-bold': this.settings.tabTitleBold ? 'bold' : 'normal',
            '--cpwn-notes-line-height': this.settings.notesLineHeight,
            '--cpwn-selected-tab-color': this.settings.selectedTabColor,
            '--cpwn-today-highlight-color-light': this.settings.todayHighlightColorLight,
            '--cpwn-today-highlight-color-dark': this.settings.todayHighlightColorDark,
            '--cpwn-notes-hover-color': this.settings.notesHoverColor,
            '--cpwn-daily-note-dot-color': this.settings.dailyNoteDotColor,
            '--cpwn-note-created-color': this.settings.noteCreatedColor,
            '--cpwn-note-modified-color': this.settings.noteModifiedColor,
            '--cpwn-other-note-dot-color': this.settings.noteCreatedColor,
            '--cpwn-calendar-grid-gap-width': this.settings.calendarGridGapWidth,
            '--cpwn-calendar-modified-dot-color': this.settings.noteModifiedColor,
            '--cpwn-other-note-popup-font-size': this.settings.otherNotePopupFontSize,
            '--cpwn-calendar-dot-size': this.settings.calendarDotSize + 'px',
            '--cpwn-nav-button-height': this.settings.navButtonHeight,
            '--cpwn-date-cell-hover-color-light': this.settings.dateCellHoverColorLight,
            '--cpwn-date-cell-hover-color-dark': this.settings.dateCellHoverColorDark,
            '--cpwn-main-month-year-title-font-size': this.settings.mainMonthYearTitleFontSize,
            '--cpwn-main-month-title-weight': this.settings.mainMonthTitleBold ? 'bold' : 'normal',
            '--cpwn-main-year-title-weight': this.settings.mainYearTitleBold ? 'bold' : 'normal',
            '--cpwn-today-highlight-size': this.settings.todayHighlightSize,
            '--cpwn-task-heading-font-size': this.settings.taskHeadingFontSize,
            '--cpwn-task-text-font-size': this.settings.taskTextFontSize,
            '--cpwn-scratchpad-highlight-color': this.settings.scratchpadHighlightColor,
            '--cpwn-asset-dot-color': this.settings.assetDotColor,
            '--cpwn-calendar-event-dot-color': this.settings.calendarEventDotColor,
            '--cpwn-task-dot-color': this.settings.taskDotColor,
            '--cpwn-task-badge-color': this.settings.taskBadgeColor,
            '--cpwn-task-badge-font-color': this.settings.taskBadgeFontColor,
            '--cpwn-task-badge-font-size': this.settings.taskBadgeFontSize,
            '--cpwn-today-circle-color-light': this.settings.todayCircleColorLight,
            '--cpwn-today-circle-color-dark': this.settings.todayCircleColorDark,
            '--cpwn-weekly-note-dot-color': this.settings.weeklyNoteDotColor,
            '--cpwn-weekend-shade-color-light': this.settings.weekendShadeColorLight,
            '--cpwn-weekend-shade-color-dark': this.settings.weekendShadeColorDark,
            '--cpwn-weekly-note-dot-color': this.settings.weeklyNoteDotColor,
            '--cpwn-row-highlight-color-light': this.settings.rowHighlightColorLight,
            '--cpwn-row-highlight-color-dark': this.settings.rowHighlightColorDark,
            '--cpwn-task-color-overdue': this.settings.taskStatusColorOverdue,
            '--cpwn-task-color-in-progress': this.settings.taskStatusColorInProgress,
            '--cpwn-task-color-open': this.settings.taskStatusColorOpen,
            '--cpwn-task-color-completed': this.settings.taskStatusColorCompleted,
            '--cpwn-task-color-cancelled': this.settings.taskStatusColorCancelled,

        };

        for (const key in styleProps) {
            document.documentElement.style.setProperty(key, styleProps[key]);
        }
    }

    /**
     * Opens the plugin view in a new leaf or reveals it if it's already open.
     */
    async activateView() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD);
        if (leaves.length > 0) {
            this.app.workspace.revealLeaf(leaves[0]);
            return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_PERIOD, active: true });
        this.app.workspace.revealLeaf(leaf);
    }

    async resetIcsRefreshInterval() {
        // If there's an old interval running, clear it first
        if (this.icsRefreshIntervalId !== null) {
            window.clearInterval(this.icsRefreshIntervalId);
        }

        const intervalMinutes = this.settings.icsRefreshInterval;

        if (intervalMinutes > 0) {
            const intervalMilliseconds = intervalMinutes * 60 * 1000;

            this.icsRefreshIntervalId = this.registerInterval(
                window.setInterval(async () => {
                    //console.log(`Periodic Notes: Automatically refreshing ICS feed (interval: ${intervalMinutes} minutes).`);

                    // We need to find the view to call its refresh method
                    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD);
                    for (const leaf of views) {
                        if (leaf.view && leaf.view.refreshIcsEvents) {
                            await leaf.view.refreshIcsEvents();
                        }
                    }
                }, intervalMilliseconds)
            );
        }
    }

    async loadTemplates() {
        
        return Promise.resolve(BUNDLED_TEMPLATES);

    }

    onunload() {
        // Clean up when the plugin is disabled.
        const styleEl = document.getElementById('cpwn-period-month-plugin-styles');
        if (styleEl) styleEl.remove();
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => leaf.detach());

        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }

    }
}


