/* --- Obsidian Plugin: Periodic Notes Calendar View ---
  Developer: Tim Williams
  This plugin uses library: https://app.unpkg.com/ical.js@2.2.1/files/dist/ical.es5.min.cjs (c) 2024 Chris Lawley, MIT License  
*/
import ICAL from 'ical.js';

const DASHBOARDWIDGETS = {
    tasks: {
        today: { name: 'Today' },
        tomorrow: { name: 'Tomorrow' },
        next7days: { name: 'Next 7 Days' },
        futureNoDue: { name: 'Future / No Due' },
        upcomingoverdue: { name: 'Upcoming & Overdue Tasks' },
        taskstatusoverview: { name: 'Task Status Overview' },
        taskcompletionheatmap: { name: 'Task Completion Activity' }
    },
    creation: {
        allfilesheatmap: { name: 'All Files' },
        dailynotesheatmap: { name: 'Daily Notes' },
        regularnotesheatmap: { name: 'Regular Notes' },
        assetsheatmap: { name: 'Assets' }
    }
};

// Import necessary components from the Obsidian API.
const { Plugin, ItemView, PluginSettingTab, Notice, TFile, TFolder, Setting, Modal, Menu, AbstractInputSuggest, moment, MarkdownRenderer, setIcon, Platform } = require("obsidian");

// Define a unique type for this plugin's view.
const VIEW_TYPE_PERIOD = "calendar-period-week";

// Define the default settings for the plugin. This object is used as a fallback and for resetting configurations.
const DEFAULT_SETTINGS = {
    // General Display
    appliedTheme: "",
    fontSize: "12px",
    customDateFormats: "YYYY-MM-DD,DD-MM-YYYY",
    dayNumberFontSize: "15px",
    navButtonHeight: "28px",
    headerRowBold: false,
    pwColumnBold: false,
    showCalendarGridLines: false,
    calendarGridGapWidth: "1px",
    contentBorderWidth: "1px",
    monthColorLight: "rgba(51, 51, 51, 1)", // Dark Grey for light mode
    monthColorDark: "rgba(255, 255, 255, 1)", // White for dark mode
    yearColorLight: "rgba(255, 0, 0, 1)", // Darker red for light mode
    yearColorDark: "rgba(255, 80, 80, 1)",  // Brighter red for dark mode
    currentHighlightLabelColorLight: "rgba(255, 80, 80, 1)", // A distinct but readable red for light mode
    currentHighlightLabelColorDark: "rgba(255, 80, 80, 1)",  // A brighter red for dark mode
    monthTitleFormat: "MMMM YYYY",
    mainMonthYearTitleFontSize: "22px",
    mainMonthTitleBold: true,
    mainYearTitleBold: false,
    todayHighlightSize: "2.2em",
    tabTitleBold: false,
    tabDisplayMode: "iconOnly",
    mobileTabDisplayMode: "iconOnly",
    collapsedNoteGroups: {},
    tabOrder: ["scratch", "tasks", "notes", "assets", "dashboard"],
    tabIcons: {
        scratch: "pencil",
        notes: "files",
        tasks: "check-circle",
        pinned: "pin",
        assets: "image-file",
        dashboard: "chart-bar-big"
    },
    assetsLookbackDays: 120,
    assetsDefaultView: 'grid',
    defaultDashboardView: 'creation',
    taskBarChartDefaultMode: 'percent',
    tabVisibility: {
        scratch: true,
        tasks: true,
        notes: true,
        assets: true,
        dashboard: true
    },
    calendarLayout: "normal",
    weekStartDay: "sunday",

    // Scratchpad
    fixedNoteFile: "ScratchPad.md",
    scratchFontSize: "14px",
    scratchBold: false,
    scratchFontFamily: "",
    scratchpadOpenAction: "new-tab",
    scratchpadHighlightColor: "rgba(255, 165, 0, 0.4)",
    scratchpad: {
        showPreviewToggle: true,
        showAddTaskButton: true,
        taskFormat: "- [ ] #Tag | 📅 {friday}",
        hideFrontmatter: true
    },
    // Notes Tab
    ignoreFolders: [],
    pinTag: "pin",
    notesViewMode: "recent",
    notesFontSize: "14px",
    notesBold: false,
    notesOpenAction: "current-tab",
    notesLineHeight: 1.2,
    notesLookbackDays: 120,
    showNoteStatusDots: true,
    showNoteTooltips: true,
    pinnedNotesSortOrder: 'a-z', // can be 'a-z' or 'custom'
    pinnedNotesCustomOrder: [],  // Stores an array of note paths for custom order

    //Assets 
    hiddenAssetTypes: "base,canvas",
    showUnusedAssetsIndicator: true,
    assetsOpenAction: "new-tab",

    // Calendar Dots & Popups
    listPopupTrigger: "hover",
    showOtherNoteDot: true,
    showModifiedFileDot: true,
    otherNoteIgnoreFolders: [],
    otherNoteHoverDelay: 800,
    popupHideDelay: 50,
    popupGap: -2,
    otherNotePopupFontSize: "14px",
    calendarDotSize: 4,
    showAssetDot: true,
    assetDotColor: "rgba(255, 0, 0, 1)", 
    calendarEventDotColor: 'rgba(148, 148, 148, 1)', 

    assetIgnoreFolders: [],
    showPWColumnSeparator: true,
    pwColumnSeparatorColor: "rgba(128, 128, 128, 0.2)", // Grey separator line

    pwColumnFontColorLight: "rgba(51, 51, 51, 0.6)", // Dark grey for light mode
    pwColumnFontColorDark: "rgba(255, 255, 255, 0.6)", // White for dark mode
    weekNumberFontColorLight: "rgba(51, 51, 51, 0.6)", // Dark grey for light mode
    weekNumberFontColorDark: "rgba(255, 255, 255, 0.6)", // White for dark mode
    dayHeaderFontColorLight: "rgba(51, 51, 51, 0.6)", // Dark grey for light mode
    dayHeaderFontColorDark: "rgba(255, 255, 255, 0.6)", // White for dark mode

    dayCellFontColorLight: "rgba(51, 51, 51, 1)", // Current month dates - light
    dayCellFontColorDark: "rgba(255, 255, 255, 1)", // Current month dates - dark
    otherMonthFontColorLight: "rgba(153, 153, 153, 0.6)", // Previous/next month dates - light
    otherMonthFontColorDark: "rgba(153, 153, 153, 0.6)", // Previous/next month dates - dark

    // Task Count Badge
    taskIndicatorStyle: "heatmap", // 'none', 'badge', or 'heatmap'
    taskBadgeFontSize: "11px",
    taskBadgeColor: "rgba(100, 149, 237, 0.6)", // Cornflower Blue
    taskBadgeFontColor: "rgba(255, 255, 255, 1)", // White
    taskHeatmapStartColor: "rgba(100, 149, 237, 0.3)", // Cornflower Blue
    taskHeatmapMidColor: "rgba(255, 127, 80, 0.45)",    // Coral
    taskHeatmapEndColor: "rgba(255, 71, 71, 0.6)",     // Red
    taskHeatmapMidpoint: 5,
    taskHeatmapMaxpoint: 10,
    showTaskDot: false,
    taskDotColor: "rgba(200, 100, 200, 1)",

    // Task Dashboard Colours
    taskStatusColorOverdue: 'rgba(244, 21, 1, 0.5)',
    taskStatusColorInProgress: 'rgba(251, 188, 5, 0.5)',
    taskStatusColorOpen: 'rgba(74, 144, 226, 0.5)',
    taskStatusColorCompleted: 'rgba(126, 211, 33, 0.5)',
    taskStatusColorCancelled: 'rgba(158, 158, 158, 0.5)',

    // Daily Notes
    dailyNotesFolder: "Daily Notes",
    dailyNoteDateFormat: "YYYY-MM-DD",
    dailyNoteTemplatePath: "",
    dailyNoteOpenAction: "new-tab",

    //period / week numbers 
    showWeekNumbers: true,
    weekNumberType: "calendar", // 'period' or 'calendar'
    weekNumberColumnLabel: "CW",

    //calendar events (from ICS) settings
    icsUrl: '',
    showIcsDot: true,
    icsRefreshInterval: 60, // in minutes
    calendarEventsPlaceholder: '%%CALENDAR_EVENTS%%',
    calendarEventsFormat: '- {{startTime}} - {{endTime}}: {{summary}}',
    calendarEventIndicatorStyle: 'dot', // Options: 'dot', 'heatmap', 'badge'

    // Functional
    autoReloadInterval: 5000,
    startOfPeriod1Date: "2025-03-02",
    showPWColumn: false,
    pwFormat: "P#W#",
    enableRowHighlight: true,
    enableColumnHighlight: true,
    enableRowToDateHighlight: false,
    highlightCurrentWeek: true,

    // Colors
    selectedTabColor: "rgba(102, 102, 102, 1)",
    todayHighlightColorLight: "rgba(255, 80, 80, 0.40)",
    todayHighlightColorDark: "rgba(255, 80, 80, 0.75)",
    notesHoverColor: "rgba(171, 171, 171, 0.15)",
    dailyNoteDotColor: "rgba(74, 144, 226, 1)",
    noteCreatedColor: "rgba(76, 175, 80, 1)",
    noteModifiedColor: "rgba(255, 152, 0, 1)",
    rowHighlightColorLight: "rgba(163, 163, 163, 0.2)", // Lighter Grey
    rowHighlightColorDark: "rgba(51, 51, 51, 0.7)",     // Dark Grey
    dateCellHoverColorLight: "rgba(105, 105, 105, 0.75)",     // Light Grey
    dateCellHoverColorDark: "rgba(51, 51, 51, 1)",
    assetDotColor: "rgba(255, 0, 0, 1)",
    todayHighlightStyle: "circle", // 'cell' or 'circle'
    todayCircleColorLight: "rgba(255, 80, 80, 0.40)",
    todayCircleColorDark: "rgba(255, 80, 80, 0.75)",
    highlightTodayLabels: true,
    highlightTodayPWLabel: true,
    highlightTodayDayHeader: true,
    highlightWeekends: false,
    weekendShadeColorLight: "rgba(163, 163, 163, 0.15)", // Subtle grey for light theme
    weekendShadeColorDark: "rgba(51, 51, 51, 0.4)", // Subtle grey for dark theme


    // Weekly Notes (NEW)
    enableWeeklyNotes: true,
    weeklyNoteFolder: "Weekly Notes",
    weeklyNoteFormat: "YYYY-WKC", // e.g., 2025-W38
    weeklyNoteTemplate: "",
    showWeeklyNoteDot: true,
    weeklyNoteDotColor: "rgba(128, 128, 128, 1)",

    // Tasks Tab Settings
    taskIgnoreFolders: [],
    taskSortOrder: "dueDate",
    taskGroupBy: "date",
    taskDateGroupsToShow: ["overdue", "today", "tomorrow", "next7days", "future"],
    taskTextTruncate: false,
    showCompletedTasksToday: true,
    taskHeadingFontSize: "13px",
    taskTextFontSize: "14px",
    taskGroupIcons: {
        overdue: "alarm-clock-off",
        today: "target",
        tomorrow: "arrow-right",
        next7days: "calendar-days",
        future: "telescope",
        noDate: "help-circle",
        tag: "tag"
    },
    taskGroupColorOverdue: "rgba(40, 40, 40, 0.15)",
    taskGroupColorToday: "rgba(60, 60, 60, 0.15)",
    taskGroupColorTomorrow: "rgba(80, 80, 80, 0.15)",
    taskGroupColorNext7Days: "rgba(100, 100, 100, 0.15)",
    taskGroupColorFuture: "rgba(120, 120, 120, 0.15)",
    taskGroupColorNoDate: "rgba(140, 140, 140, 0.15)",
    taskGroupColorTag: "rgba(40, 40, 40, 0.15)",
    showPreviewToggle: true,
    showAddTaskButton: true,
    collapsedTaskGroups: {},
    collapsedAssetGroups: {},

    //Dashboard Tab
    customHeatmaps: [],
    creationDashboardOrder: ['dailynotesheatmap', 'regularnotesheatmap', 'assetsheatmap', 'allfilesheatmap'],
    creationDashboardWidgets: {
        allfilesheatmap: true,
        dailynotesheatmap: true,
        regularnotesheatmap: true,
        assetsheatmap: true,
    },
    tasksDashboardOrder: ['today', 'tomorrow', 'next7days', 'futureNoDue', 'upcomingoverdue', 'taskstatusoverview', 'taskcompletionheatmap'],
    tasksDashboardWidgets: {
        today: true,
        tomorrow: true,
        next7days: true,
        futureNoDue: true,
        upcomingoverdue: true,
        taskstatusoverview: true,
        taskcompletionheatmap: true,
    },
    collapsedHeatmaps: {},
    smallWidgetStates: {},
    collapsedWidgets: {},
    isHeatmapGuideCollapsed: true,
    heatmapLinkConfig: {},
    heatmapTotalClickOpenAction: 'new-tab',
    customHeatmaps: [],

};

// A string containing all the CSS for the plugin. It's injected into the document head on load.
const PLUGIN_STYLES = `
body.theme-light {
    --month-color-themed: var(--month-color-light);
    --today-circle-color-themed: var(--today-circle-color-light);
    --today-highlight-color-themed: var(--today-highlight-color-light);
    --date-cell-hover-color-themed: var(--date-cell-hover-color-light);
    --pw-column-font-color-themed: var(--pw-column-font-color-light);
    --week-number-font-color-themed: var(--week-number-font-color-light);
    --day-header-font-color-themed: var(--day-header-font-color-light);
    --day-cell-font-color-themed: var(--day-cell-font-color-light);
    --other-month-font-color-themed: var(--other-month-font-color-light);
    --weekend-shade-color-themed: var(--weekend-shade-color-light);
    --row-highlight-color-themed: var(--row-highlight-color-light);
    --year-color-themed: var(--year-color-light);
    --current-label-highlight-color-themed: var(--current-highlight-label-color-light); 

}
body.theme-dark {
    --month-color-themed: var(--month-color-dark);
    --today-circle-color-themed: var(--today-circle-color-dark);
    --today-highlight-color-themed: var(--today-highlight-color-dark);
    --date-cell-hover-color-themed: var(--date-cell-hover-color-dark);
    --pw-column-font-color-themed: var(--pw-column-font-color-dark);
    --week-number-font-color-themed: var(--week-number-font-color-dark);
    --day-header-font-color-themed: var(--day-header-font-color-dark);
    --day-cell-font-color-themed: var(--day-cell-font-color-dark);
    --other-month-font-color-themed: var(--other-month-font-color-dark);
    --weekend-shade-color-themed: var(--weekend-shade-color-dark);
    --row-highlight-color-themed: var(--row-highlight-color-dark);
    --year-color-themed: var(--year-color-dark);
    --current-label-highlight-color-themed: var(--current-highlight-label-color-dark); 

}

/* Style for the "Month" part (uses existing --month-color-themed variable) */
.month-title-month {
    color: var(--month-color-themed);
}

/* Style for the "Year" part (uses the new variable) */
.month-title-year {
    color: var(--year-color-themed);
}

/* 4. Ensure individual date hover appears ON TOP of other highlights */
.period-calendar-table td:hover td:not(.pw-label-cell):not(.week-number-cell):hover .day-content {
    background-color: var(--date-cell-hover-color-themed) !important;
}

.period-calendar-table td.row-hover:not(.pw-label-cell):not(.week-number-cell) {
    background-color: var(--row-highlight-color-themed);
}

/* Day header row font color */
.period-calendar-table thead th {
    color: var(--day-header-font-color-themed);
}

/* Period/Week column font color */
.period-calendar-table .pw-label-cell,
.period-calendar-table .pw-label-cell .day-number {
    font-weight: var(--pw-column-font-weight);
    font-size: var(--header-font-size);
    color: var(--pw-column-font-color-themed);
}

/* Highlight today's P/W column with today color */
.period-calendar-table .pw-label-cell.today-pw-label .day-number,
.period-calendar-table .week-number-cell.today-pw-label .day-number {
    color: var(--current-label-highlight-color-themed);
    
}

/* Highlight today's day column header with today color */
.period-calendar-table thead th.today-day-header {
    color: var(--current-label-highlight-color-themed);    
}

/* Week number column font color */
.period-calendar-table .week-number-cell,
.period-calendar-table .week-number-cell .day-number {
    font-weight: var(--pw-column-font-weight);
    font-size: var(--header-font-size);
    color: var(--week-number-font-color-themed);
}

/* --- Main Layout --- */
.period-month-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 6px;
}
.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0.25rem;
  margin-bottom: 0.5rem; /* Specific margin for spacing */
}
.month-header-title {
    font-size: var(--main-month-year-title-font-size);
    white-space: nowrap;
    cursor: pointer;
}
.month-title-month {
    font-weight: var(--main-month-title-weight);
}

.month-title-year {
    font-weight: var(--main-year-title-weight);
}

.month-header-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.month-header-nav button {
  height: var(--nav-button-height);
  min-height: var(--nav-button-height);
  padding: 0; /* Remove horizontal padding */
  width: var(--nav-button-height); /* Make the button square */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Accent color for the locked popup button on desktop */
.month-header-nav button.popup-locked .svg-icon {
    color: var(--interactive-accent);
}

/* Specific override for mobile to ensure accent color is applied */
body.is-mobile .month-header-nav button.popup-locked .svg-icon {
    color: var(--interactive-accent);
}

/* --- Chevron Button Animation --- */
.month-header-nav button[aria-label="Toggle calendar visibility"] .svg-icon {
  transition: transform 0.3s ease-in-out;
}
.period-month-container.calendar-collapsed .month-header-nav button[aria-label="Toggle calendar visibility"] .svg-icon {
  transform: rotate(180deg);
}
body.is-mobile .month-header-nav button .svg-icon {
  width: 18px;
  height: 18px;
  color: var(--icon-color);
  flex-shrink: 0;
}
/* --- Calendar Collapse Animation --- */
.calendar-table-wrapper {
  flex-shrink: 0;
  max-height: 500px; 
  transition: max-height 0.3s ease-in-out, margin-bottom 0.3s ease-in-out;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.period-month-container.calendar-collapsed .calendar-table-wrapper {
  max-height: 0;
  margin-bottom: 0;
}

/* --- Calendar Table --- */
.period-calendar-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.period-calendar-table th, .period-calendar-table td {
  text-align: center;
  vertical-align: middle;
  padding: 0;
  font-size: var(--header-font-size);
}
.period-calendar-table th {
    vertical-align: middle;
}

.period-calendar-table th {
  font-weight: var(--header-row-font-weight);
  height: 2.5em;
}
.period-calendar-table tbody td {
 cursor: pointer;
 overflow: visible; 
 position: relative;
}
.period-month-container:not(.hide-grid) .period-calendar-table td {
    border: var(--calendar-grid-gap-width) solid var(--background-modifier-border);
}

/* --- Rounded Row Highlight --- */
.period-calendar-table .current-week-row td:first-child {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
}

.period-calendar-table .current-week-row td:last-child {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.period-calendar-table tbody td:not(.pw-label-cell):not(.week-number-cell):hover .day-content {
  background-color: var(--date-cell-hover-color-themed);
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

body .period-month-container.today-style-cell .today-cell .day-content {
  background-color: var(--today-highlight-color-themed);
  border-radius: 6px;
}

body .period-month-container.today-style-cell .period-calendar-table tbody tr.current-week-row td.today-cell .day-content {
    background-color: var(--today-highlight-color-themed) !important;
}

.period-month-container.today-style-circle .today-cell .day-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--today-circle-color-themed);
    z-index: 2;
    border-radius: 50%;
    width: var(--today-highlight-size);
    height: var(--today-highlight-size);
    display: flex;
    align-items: center; 
    justify-content: center;
}

.period-month-container.today-style-number .today-cell .day-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--today-circle-color-themed);
    border-radius: 6px; 
    padding: 0px 10px; /* Minimal padding for a tight fit */
    display: flex;
    align-items: center; 
    z-index: 2; /* Ensures it's drawn on top of the heatmap */
}

.period-calendar-table td .day-content.heatmap-cell {
    background-color: var(--heatmap-color) !important;
}

.period-calendar-table .pw-label-cell,
.period-calendar-table .week-number-cell {
  font-weight: var(--pw-column-font-weight);
  font-size: var(--header-font-size);
  position: relative;
}

/* --- Period/Week Column Separator Line --- */
.period-calendar-table tbody td.first-date-column::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--pw-separator-color);
    z-index: 1;
}

.week-dots-container {
    position: absolute;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
}

/* --- Calendar Dots Color Variables --- */
.calendar-dot {
    width: var(--calendar-dot-size);
    height: var(--calendar-dot-size);
    border-radius: 50%;
}

.ics-event-dot {
    background-color: var(--calendar-event-dot-color);
}

/* --- Calendar Layout Styles --- */
.period-month-container.layout-spacious .day-content {
    height: 3.8em;
}
.period-month-container.layout-normal .day-content {
    height: 3.0em;
}
.period-month-container.layout-condensed .day-content {
    height: 2.8em; /* Even smaller height */
    
}

/* The weekly dot now just sets the color and re-uses .calendar-dot for its size */
.weekly-note-dot {
    background-color: var(--weekly-note-dot-color);
}

/* --- Calendar Day Content & Dots (REFACTORED) --- */
/* 1. The Day Content Wrapper */
/* Its ONLY job is to be the positioning anchor. No more flexbox. */
.day-content {
    position: relative;
    width: 100%;
    height: 100%;
}

/* 2. The Day Number */
/* We now position it absolutely to ensure it is perfectly centered. */
.day-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1; /* Sits on top of the highlight circle */
    font-size: var(--calendar-day-number-font-size);
    color: var(--day-cell-font-color-themed);
}

/* 3. The Dots Container (with dynamic bottom positioning) */
/* The base rule removes the bottom property. */
.dots-container, .week-dots-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    gap: 3px;
    z-index: 2; /* Sits on top of the day number */
}

/* These layout-specific classes now have full control and will work correctly. */
.dots-container.layout-condensed,
.week-dots-container.layout-condensed {
    top: 26px; 
}

.dots-container.layout-normal,
.week-dots-container.layout-normal {
    top: 28px; 
}

.dots-container.layout-spacious,
.week-dots-container.layout-spacious {
    top: 34px; 
}

/* 4. Ensure other layered items are also positioned absolutely */


.badge-container {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 3; /* Sits at the very top */
}

.day-header-cell, .pw-cell, .week-number-cell {
    /* Uses the general font size for labels */
    font-size: var(--calendar-label-font-size); 
}

.day-number-other-month {
    color: var(--other-month-font-color-themed) !important;
}

.period-calendar-table th, .period-calendar-table .pw-cell, .period-calendar-table .week-number-cell {
    font-size: var(--calendar-label-font-size); 
}

/* --- Calendar Layout Styles --- */
.period-month-container.layout-spacious .dots-container  {
    padding-bottom: 10px; /* Creates space from the bottom edge */
}
.period-month-container.layout-spacious .dots-container:empty {
    padding-top: var(--calendar-dot-size);
}

.period-month-container.layout-normal .dots-container  {
    padding-bottom: 6px; /* Creates space from the bottom edge */
}
.period-month-container.layout-condensed .dots-container  {
    padding-bottom: 4px; /* Creates space from the bottom edge */
}

.task-count-badge {
    position: absolute;
    top: 2px;
    right: 3px;
    z-index: 3;
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
    background-color: var(--task-badge-color);
    color: var(--task-badge-font-color);
    font-size: var(--task-badge-font-size);
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1; /* Prevents text from shifting vertically */
}

.calendar-dot {
  width: var(--calendar-dot-size);
  height: var(--calendar-dot-size);
  border-radius: 50%;
}
.other-note-dot { background-color: var(--other-note-dot-color); }
.modified-file-dot { background-color: var(--calendar-modified-dot-color); }
.asset-dot { background-color: var(--asset-dot-color); }
.task-dot { background-color: var(--task-dot-color); } 
.period-month-daily-note-dot { background-color: var(--daily-note-dot-color, var(--text-accent)); }
.period-month-daily-note-dot-other-month { opacity: 0.4; }

/* --- Tabs & Search Header --- */
.tabs-content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 60px;
}
.note-tab-header {
  display: flex;
  flex-shrink: 0;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}
.tab-container {
  display: flex;
  align-items: center;
  
}
.note-tab {
  position: relative;
  flex: 0 1 auto;
  text-align: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-size: var(--tab-title-font-size);
  font-weight: var(--tab-title-bold);
  white-space: nowrap;
}
.note-tab:hover { background-color: var(--background-modifier-hover); }
.note-tab.active {
  border-bottom-color: var(--selected-tab-color);
}
.note-tab.dragging {
  opacity: 0.5;
  cursor: grabbing;
}
.note-tab.drag-over-indicator-before::before,
.note-tab.drag-over-indicator-after::after {
  content: '';
  position: absolute;
  top: 10%;
  bottom: 10%;
  width: 2px;
  background-color: var(--selected-tab-color);
}
.note-tab.drag-over-indicator-before::before { left: 0; }
.note-tab.drag-over-indicator-after::after { right: 0; }
.search-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
  padding-right: 8px;
}

/* --- Mobile-Specific Tab Compaction --- */
body.is-mobile .note-tab {
    padding: 0.5rem 0.6rem; /* Reduced horizontal padding */
    gap: 5px; /* Reduced gap between icon and text */
}

body.is-mobile .tab-icon {
    width: 18px; /* Smaller icon width */
    height: 18px; /* Smaller icon height */
}

body.is-mobile .pm-search-input {
    flex-grow: 1; /* Allow search input to take more space */
}

/* --- Unified Search Input --- */
.pm-search-container {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
}
.pm-search-input {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    width: 100%;
    padding: 4px 28px 4px 8px;
    box-sizing: border-box;
    line-height: var(--line-height-normal);
}
.pm-search-input:focus {
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 1px var(--interactive-accent);
}

/* --- Scratchpad Content & Buttons --- */
.scratchpad-wrapper {
  flex: 1 1 auto;
  display: grid;
  width: 100%;
  height: 100%;
  position: relative;
}
.scratch-content:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
}
/* This is the visual cutout */
.scratchpad-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 64px;
  background-color: var(--background-secondary);
  z-index: 3;
  border-bottom-left-radius: var(--radius-m);
}
.scratchpad-wrapper.markdown-preview-view {
  align-content: start; 
}
.scratchpad-wrapper.markdown-preview-view p {
  margin-block-start: 0 !important;
  margin-block-end: 0.5em !important; 
}
.scratchpad-actions-container {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.scratchpad-action-btn {
  cursor: pointer;
  background-color: var(--background-modifier-hover);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
  padding: 4px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scratchpad-action-btn .svg-icon {
    width: 16px;
    height: 16px;
}
.scratchpad-action-btn:hover {
  background-color: var(--background-modifier-border);
}

/* --- Scratchpad Textarea & Highlighter --- */
.scratch-base {
  margin: 0;
  padding: 0.75rem 3.5rem 0.5rem 0.5rem;
  border: none;
  font-family: var(--scratch-font-family);
  font-size: var(--scratch-font-size);
  font-weight: var(--scratch-bold);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  grid-area: 1 / 1;
  overflow: auto;
}
.scratch-highlighter {
  z-index: 1;
  color: transparent;
  pointer-events: none;
}
.scratch-highlighter mark {
  color: transparent;
  background-color: var(--scratchpad-highlight-color);
  border-radius: 3px;
}
.scratch-content {
  z-index: 2;
  background-color: transparent;
  resize: none;
}
.scratch-content:hover {
  background-color: transparent !important;
}
.scratch-content::selection {
  background-color: var(--scratchpad-highlight-color) !important;
}

/* --- Notes & Tasks List Styles --- */

.notes-container, .tasks-container {
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px;
  display: flex;         
  flex-direction: column;
  gap: 8px;
}

.note-row, .task-row {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
.note-row {
  gap: 1em;
}
.task-row {
  gap: 0.5em;

}
.task-row .task-text > p {
    margin: 0;
    padding: 0;
}

.task-text .task-completed-text {
    text-decoration: line-through;
    opacity: 0.6;
    color: var(--text-muted);
}

#notes-list-view .note-row:hover,
#asset-list-view .note-row:hover,
#pinned-notes-list .note-row:hover,
.tasks-container .task-row:hover,
#notes-list-view .note-row:focus,
#asset-list-view .note-row:focus,
#pinned-notes-list .note-row:focus,
.tasks-container .task-row:focus {
    background-color: var(--notes-hover-color);
}

.note-status-dot { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  flex-shrink: 0; 
}
.note-status-dot-created { background-color: var(--note-created-color); }
.note-status-dot-modified { background-color: var(--note-modified-color); }
.note-row .note-title-wrapper { 
  display: flex; 
  align-items: flex-start;
  gap: 6px; 
  flex: 1; 
  min-width: 0; 
}
.note-row .note-title { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-size: var(--notes-font-size); 
  font-weight: var(--notes-bold); 
}
.note-row .note-meta-container {
  display: flex;
  align-items: center;
  gap: 1em;
  flex-shrink: 0;
  margin-left: 1em;
}
.note-row .note-file-size {
  font-size: 0.8em;
  color: var(--text-muted);
  width: 65px;
  text-align: right;
}
.note-row .note-mod-date { 
  white-space: nowrap; 
  font-size: 0.8em; 
  color: var(--text-muted);
  width: 85px;
  text-align: right 
}

/* --- Tasks Specific Styles --- */
.task-group-container {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 8px;
}

/* --- Popups & Tooltips --- */
/* Common base styles for popups */
.other-notes-popup, .custom-suggestion-container {
    position: absolute;
    z-index: 100;
    background-color: var(--background-secondary);
    border: 1px solid #4a4a4a;
    border-radius: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    min-width: 450px;
    max-width: 658px;
}

/* Main popup specific styles */
.other-notes-popup {
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Hide overflow on the main container */
    max-height: 250px; /* Increased slightly for mobile header */
}

/* Popup header */
.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0; /* Prevent header from shrinking */
    cursor: pointer;
    gap: 10px;
}
.popup-header-title {
    font-weight: normal;
    color: var(--text-muted);
    flex-grow: 1; /* Allow title to take available space */
    flex-shrink: 1; /* Allow title to shrink if needed */
    min-width: 0; /* Important for text-overflow to work with flex items */
    white-space: nowrap; /* Prevent title from wrapping */
    overflow: hidden; /* Hide overflow */
    text-overflow: ellipsis; /* Add ellipsis for long titles */
    font-size: --var(--other-note-popup-font-size);
    /* max-width: 420px;  */
    
}

.popup-close-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    /* Default for DARK theme: Light grey circle */
    background-color: #9c9b9b; 
    /* Default for DARK theme: Dark 'x' icon */
    color: #383838; 
    transition: background-color 0.1s ease-in-out, color 0.1s ease-in-out;
}

.popup-close-btn:hover {
    /* Hover for DARK theme: Even lighter circle */
    background-color: #f5f5f5;
}

/* --- Light Theme Overrides --- */
body.theme-light .popup-close-btn {
    /* Default for LIGHT theme: Dark grey circle */
    background-color: #5c5c5c;
    /* Default for LIGHT theme: White 'x' icon */
    color: #ffffff;
}

body.theme-light .popup-close-btn:hover {
    /* Hover for LIGHT theme: Even darker circle */
    background-color: #383838;
}

.popup-close-btn .svg-icon {
    width: 14px;
    height: 14px;
}

/* Content wrapper for scrolling and padding */
.popup-content-wrapper {
    padding: 8px;
    overflow-y: auto;
}

/* Suggestion container specific styles */
.custom-suggestion-container {
    z-index: 999;
    margin-top: 4px;
    padding: 8px;
    max-height: 200px;
    overflow-y: auto;
}

.other-notes-popup-item {
  display: flex; 
  align-items: flex-start; 
  gap: 8px; 
  padding: 12px 2px 8px 2px; 
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer; 
  white-space: normal;
  word-break: break-word; 
  text-overflow: ellipsis; 
  font-size: var(--other-note-popup-font-size);
}

.other-notes-popup-item .popup-file-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-left: calc(8px); /* Push dot over by checkbox width + small gap */
}

.other-notes-popup-item:hover { 
  background-color: var(--background-modifier-hover); 
}
.other-notes-popup-item .svg-icon {
  flex-shrink: 0;
  width: 1.2em;
  height: 1.2em;
}

.note-row .note-status-dot,
.other-notes-popup-item .popup-file-dot,
.other-notes-popup-item .popup-asset-thumbnail {
    margin-top: 5px; 
    align-self: flex-start; 
}

.note-row:hover {
    background-color: var(--background-modifier-hover);
}

.other-notes-popup-item p {
    margin: 0;
}
.popup-file-dot { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  flex-shrink: 0; 
}
.custom-suggestion-item { 
  padding: 8px 12px; 
  cursor: pointer; 
  font-size: var(--font-ui-small); 
}
.custom-suggestion-item:hover { 
  background-color: var(--background-modifier-hover); 
}
.setting-item-control { 
  position: relative; 
}
body:has(.note-title-wrapper:hover) .tooltip, 
body:has(.note-title-cell:hover) .tooltip,
body:has(.task-text:hover) .tooltip {
  text-align: left; 
  padding: 6px 10px; 
  white-space: pre-wrap; 
  max-width: 400px; 
  transition-delay: 0.5s !important; 
  background-color: var(--background-secondary); 
  box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
  border-radius: 15px; 
  border: 1px solid #4a4a4a; 
  font-size: var(--other-note-popup-font-size); 
  color: var(--text-normal); 
  font-weight: normal;
}

/* --- Vertical View --- */
.vertical-calendar-scroller { 
  flex: 1; 
  overflow-y: auto; 
}
.vertical-month-wrapper { 
  margin-bottom: 2rem; 
}
.vertical-month-title {
  font-size: var(--main-month-year-title-font-size);
  font-weight: var(--main-month-year-title-weight);
  position: sticky; 
  top: 0; 
  z-index: 10;
  margin: 0.6rem 0; 
  height: 2rem; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer;
}

.theme-light .vertical-month-title {
    color: var(--month-color-themed);
    background-color: var(--background-primary);
}
.theme-dark .vertical-month-title {
    color: var(--month-color-themed);
    background-color: var(--background-secondary);
   /* color: var(--text-normal);  Ensure text is readable */
}

.period-month-container.vertical-view-active .tabs-content-wrapper { display: none; }
.period-month-container:not(.vertical-view-active) .vertical-calendar-scroller { display: none; }

/* --- Mobile-Specific Overrides --- */
.is-mobile .notes-table { 
  width: 100%; 
  border-collapse: collapse; 
  table-layout: fixed; 
}
.is-mobile .notes-table-row { 
  cursor: pointer; 
  border-bottom: 1px solid var(--background-modifier-border); 
}
.is-mobile .notes-table .note-title-cell, .is-mobile .notes-table .note-date-cell { 
  padding: 0.6rem 0.5rem; 
  vertical-align: top; 
}
.is-mobile .notes-table .note-title-cell { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  white-space: normal; 
  word-break: break-word; 
  font-size: var(--notes-font-size); 
  font-weight: var(--notes-bold); 
}
.is-mobile .notes-table .note-date-cell { 
  width: 85px; 
  text-align: right; 
  white-space: nowrap; 
  font-size: 0.8em; 
  color: var(--text-muted); 
}
.is-mobile .period-calendar-table th, .is-mobile .period-calendar-table .pw-label-cell { 
  /*font-size: 12px; */
  font-size: calc(var(--calendar-label-font-size) * 0.9);
  padding: 0; 
}

.is-mobile .period-calendar-table .day-number { 
    font-size: calc(var(--calendar-day-number-font-size) * 0.9);
}

.period-calendar-table .pw-label-cell .day-number,
.period-calendar-table .week-number-cell .day-number {
    font-size: inherit; /* Inherit the correct font size from the parent cell */
}

/* Default row height */
.period-calendar-table tbody tr {
    height: 36px;
    min-height: 36px;
}

.period-calendar-table tbody td {
    min-height: 36px;
}

/* Adjust row height for condensed layout */
.period-month-container.layout-condensed .period-calendar-table tbody tr {
    height: 30px;
    min-height: 30px;
}

.period-month-container.layout-condensed .period-calendar-table tbody td {
    min-height: 30px;
}

/* Adjust row height for spacious layout */
.period-month-container.layout-spacious .period-calendar-table tbody tr {
    height: 40px;
    min-height: 40px;
}

.period-month-container.layout-spacious .period-calendar-table tbody td {
    min-height: 40px;
}

/* --- Misc --- */
.period-month-container .svg-icon {
  color: var(--icon-color, currentColor);
}

/* --- Unified clear button for all search inputs --- */
.search-input-clear-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;
    background-color: #9c9b9b;
    /* Color is now set directly on the icon rule below */
}

.search-input-clear-btn:hover {
    background-color: #f5f5f5;
}

.search-input-clear-btn .svg-icon {
    width: 13px;
    height: 13px;
    /* FIX: Force the icon color to be dark */
    color: #383838 !important;
}

/* --- Light Theme Overrides --- */
body.theme-light .search-input-clear-btn {
    background-color: #5c5c5c;
}

body.theme-light .search-input-clear-btn:hover {
    background-color: #383838;
}

body.theme-light .search-input-clear-btn .svg-icon {
    /* FIX: Force the icon color to be white in the light theme */
    color: #ffffff !important;
}

/* --- Task Header Icons --- */
.task-group-header .icon {
  display: flex;
  align-items: center;
}
.task-group-header .icon .svg-icon {
  /*width: var(--task-heading-font-size);
  height: var(--task-heading-font-size);
*/
  }

/* --- Tab Icons --- */
.tab-icon {
  width: 1.2em;
  height: 1.2em;
}
.note-tab {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

/* --- Asset List Styles --- */
.asset-thumbnail, .popup-asset-thumbnail {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-s);
  object-fit: cover;
}
.popup-asset-thumbnail {
  width: 22px;
  height: 22px;
}
.asset-icon-container, .asset-thumbnail-container {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.asset-icon-container .svg-icon {
  width: 20px;
  height: 20px;
}
.asset-action-icon {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
}
.asset-action-icon > div {
  position: absolute;
  transition: opacity 0.2s ease-in-out;
}
.asset-action-icon .svg-icon {
  width: 16px;
  height: 16px;
}
.asset-action-icon div:nth-child(2) {
  opacity: 0;
}
.note-row:hover .asset-action-icon div:nth-child(1) {
  opacity: 0;
}
.note-row:hover .asset-action-icon div:nth-child(2) {
  opacity: 1;
}
.asset-action-icon:hover .svg-icon {
    color: var(--text-error);
}

/* --- Asset Grid Styles --- */
.note-list-wrapper.assets-grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    padding-top: 8px;
}
.asset-grid-item {
    /* flex-basis: calc(50% - 8px); */
    display: flex;
    flex-direction: column;
    cursor: pointer;
    border-radius: 12px;
    background-color: var(--background-secondary);
    overflow: hidden;
    border: 1px solid var(--background-modifier-border);
    padding: 8px;
    box-sizing: border-box; /* THIS IS THE CRITICAL MISSING LINE */
}
.asset-grid-preview {
    width: 100%;
    aspect-ratio: 4 / 3;
    background-color: var(--background-modifier-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden; 
    border-radius: 8px;  
}
.asset-grid-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.asset-grid-name {
    padding: 8px 4px 0; /* Adjusted padding */
    margin-top: 8px; /* Adds space between the image and text */
    font-size: 0.9em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-top: 1px solid var(--background-modifier-border);
}

.asset-grid-item:hover {
  background-color: var(--notes-hover-color);
  border-color: rgba(200, 200, 200, 0.75); /* A lighter, semi-transparent gray */
}

/* --- Settings Tabs --- */
.period-settings-container {
  display: flex;
  height: 100%;
}

/* Base style for all navigation buttons in the settings panel */
.period-settings-nav button {
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

/* Highlight style for the currently active settings tab button */
.period-settings-nav button.is-active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent); /* Standard Obsidian variable for contrast */
}

.period-settings-container .setting-item-heading {
    color: var(--text-normal);
}

.period-settings-nav {
  display: flex;
  flex-direction: column;
  padding-right: 1.5rem;
  border-right: 1px solid var(--background-modifier-border);
  width: 160px;
  flex-shrink: 0;
  gap: 4px;
}
.period-settings-nav-button {
      background: none;
      border: none;
      text-align: left;
      padding: 0.75rem 0.5rem;
      margin-bottom: 0.25rem;
      cursor: pointer;
      border-radius: var(--radius-m);
      color: var(--text-muted);
      font-size: var(--font-ui-small);
}
.period-settings-nav-button:hover {
      background-color: var(--background-modifier-hover);
      color: var(--text-normal);
}
.period-settings-nav-button.is-active {
      background-color: var(--interactive-accent);
      color: var(--text-on-accent);
      font-weight: bold;
}
.period-settings-content {
      flex-grow: 1;
      padding-left: 1.5rem;
      overflow-y: auto;
}
.period-settings-content > :first-child {
    /* Remove the browser's default top margin from the header */
    margin-top: 0;
    
    /* Add a small amount of padding to vertically align it with the text inside the buttons */
    padding-top: 6px; 
}
.popup-section-header {
    font-size: 0.8em;
    font-weight: bold;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 10px 8px 4px;
    padding: 0;
}
.popup-separator {
    border-bottom: 1px solid var(--background-modifier-border);
    margin: 6px 8px;
}
.other-notes-popup .popup-section-header:first-child {
    margin-top: 4px;
}
.note-group-header {
    font-size: 0.85em;
    font-weight: bold;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 12px 4px 4px;
}
.note-title-path-wrapper,
.other-notes-popup-item .note-title-path-wrapper {
    flex-grow: 1;    
    display: flex;
    flex-direction: column;
    min-width: 0; 
}
.note-row .note-path,
.other-notes-popup-item .note-path {
    font-size: 0.8em;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

.other-notes-popup-item .note-icon {
    flex-shrink: 0;
    margin-left: 8px; /* Match checkbox width + small gap */
}


/* --- Note Group Collapse Styles --- */
.note-group-container {
  border: 1px solid var(--background-modifier-border); /* Adds a subtle, theme-aware border */
  border-radius: var(--radius-l); /* Rounds the corners of the card */
  padding: 0 8px 8px; /* Adds some internal spacing for the note list */
  margin-bottom: 12px; /* Increases space between cards */
}
.note-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 0.85em;
  font-weight: bold;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 4px 4px;
}

.note-group-header:hover {
  color: var(--text-normal);
}
.note-group-header-content {
  display: flex;
  align-items: center;
  gap: 6px;
}
.note-group-count {
  font-size: 0.9em;
  background-color: var(--background-modifier-border);
  border-radius: 4px;
  padding: 1px 5px;
}
.note-group-collapse-icon .svg-icon {
  transition: transform 0.2s ease-in-out;
  width: 16px;
  height: 16px;
}
.note-group-container.is-collapsed .note-group-collapse-icon .svg-icon {
  transform: rotate(-90deg);
}
.note-list-wrapper {
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, margin-top 0.3s ease-in-out;
  margin-top: 4px;
}
.note-group-container.is-collapsed .note-list-wrapper {
  max-height: 0;
  margin-top: 0;
}

/* --- Pull to Refresh Indicator --- */
.pm-refresh-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--icon-color);
    z-index: 5;
    opacity: 0;
    transform: translateY(-50px) scale(0.7);
    transition: transform 0.3s, opacity 0.3s;
}
.pm-refresh-indicator.is-pulling {
    opacity: 0.8;
}
.pm-refresh-indicator.is-ready {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.pm-refresh-indicator.is-refreshing .svg-icon {
    animation: spin 1.2s linear infinite;
}
/* Re-use the spin animation from the refresh button */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
/* --- Mobile Keyboard Handling --- */
.scratch-content.is-editing-mobile {
    padding-bottom: 45vh; /* 45% of the visible screen height */
}

/* ==========================================================================
   WEEKEND/WEEK HIGHLIGHTING LOGIC
   ========================================================================== */

/* 1. Neutralize weekend shade inside the current week row */
.period-calendar-table tbody tr.current-week-row {
  --weekend-shade-color-themed: transparent;
}

/* 2. Regular weekend shading for SUNDAY-START weeks */
.period-month-container:not(.monday-start).weekend-shading-enabled:not(.has-pw-column):not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(1),
.period-month-container:not(.monday-start).weekend-shading-enabled:not(.has-pw-column):not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(7),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-pw-column:not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(2),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-pw-column:not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(8),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-week-numbers:not(.has-pw-column)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(2),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-week-numbers:not(.has-pw-column)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(8),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-pw-column.has-week-numbers
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(3),
.period-month-container:not(.monday-start).weekend-shading-enabled.has-pw-column.has-week-numbers
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(9) {
  background-color: var(--weekend-shade-color-themed);
}

/* 3. Weekend shading for MONDAY-START weeks */
.period-month-container.monday-start.weekend-shading-enabled:not(.has-pw-column):not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(6),
.period-month-container.monday-start.weekend-shading-enabled:not(.has-pw-column):not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(7),
.period-month-container.monday-start.weekend-shading-enabled.has-pw-column:not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(7),
.period-month-container.monday-start.weekend-shading-enabled.has-pw-column:not(.has-week-numbers)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(8),
.period-month-container.monday-start.weekend-shading-enabled.has-week-numbers:not(.has-pw-column)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(7),
.period-month-container.monday-start.weekend-shading-enabled.has-week-numbers:not(.has-pw-column)
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(8),
.period-month-container.monday-start.weekend-shading-enabled.has-pw-column.has-week-numbers
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(8),
.period-month-container.monday-start.weekend-shading-enabled.has-pw-column.has-week-numbers
  .period-calendar-table tbody tr:not(.current-week-row) td:nth-child(9) {
  background-color: var(--weekend-shade-color-themed);
}

/* 4. Make day-content transparent by default */
.period-calendar-table .day-content {
  background: transparent !important;
}

/* 5. If a cell uses border styling (today/tasks), keep its background transparent */
.period-calendar-table .day-content[style*="border"] {
  background: transparent !important;
}

/* This rule highlights the header cell itself and should work as intended. */
.period-calendar-table th.column-hover {
    background: var(--row-highlight-color-themed);
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
}

/* This rule now targets the <td> element directly, just like the working row hover,
   instead of the .day-content div inside it. */
.period-calendar-table td.column-hover {
    background: var(--row-highlight-color-themed);
}

/* Ensures individual date hover is always on top */
.period-calendar-table td:not(.pw-label-cell):not(.week-number-cell):hover .day-content {
    background-color: var(--date-cell-hover-color-themed) !important;
}

/* 1. Base style for the permanent current week highlight */
.period-calendar-table tr.current-week-row .day-content {
    background-color: var(--row-highlight-color-themed);
}

.period-calendar-table tr.current-week-row td {
    background-color: var(--row-highlight-color-themed);
}
.period-calendar-table tr.row-hover:not(.current-week-row) td {
    background-color: var(--row-highlight-color-themed);
}

.tab-order-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.draggable-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: var(--background-secondary-alt);
  border-radius: 6px;
  border: 1px solid var(--background-modifier-border);
  cursor: grab;
}

.draggable-item.dragging {
  opacity: 0.5;
  background-color: var(--background-modifier-hover);
}

.drag-handle {
  margin-right: 12px;
  color: var(--text-muted);
}

.setting-spacer {
  height: 20px; /* Or use margin-top, e.g., margin-top: 20px; */
}

.note-group-header-content {
  cursor: pointer;
}

.pinned-sort-indicator {
  font-size: 0.85em;
  color: var(--text-muted);
  font-weight: normal;
  margin-left: 6px;
  /* Prevents the indicator from being selected as text when clicking */
  user-select: none; 
}

/* Hide drag handles by default in main UI */
.note-row .drag-handle {
    display: none;
    margin-right: 8px;
    color: var(--text-muted);
    cursor: grab;
}

/* Show drag handles when reorder mode is active */
.pinned-notes-reorder-mode .note-row .drag-handle {
    display: flex;
    align-items: center;
}

/* Visual feedback during drag */
.note-row.dragging {
    opacity: 0.5;
    background-color: var(--background-modifier-hover);
}

/* == --- Theme Settings Tab Layout --- */
/* Main container for each task group row */
.preview-task-group {
    display: flex;
    justify-content: space-between; /* Pushes the title and count apart */
    align-items: center;
    padding: 10px 14px; /* Adjust padding to match main UI */
    margin-bottom: 8px; /* Space between rows */
    border-radius: 8px; /* Slightly more rounded corners */
}

/* Wrapper for the icon and title to keep them together */
.preview-task-content-wrapper {
    display: flex;
    align-items: center;
    gap: 10px; /* Space between the icon and the title text */
}

/* Style for the icon itself */
.preview-task-icon .svg-icon {
    width: 18px; /* Match icon size from main UI */
    height: 18px;
    stroke-width: 2.25; /* A good balance of boldness */
}

/* Style for the title text (e.g., "Overdue") */
.preview-task-title {
    font-size: var(--task-heading-font-size);
}

.theme-list-item:focus {
    border: 1px solid var(--interactive-accent);
    box-shadow: 0 0 5px var(--interactive-accent);
    outline: none; /* Prevents the default browser outline */
}

/* 1. Main container for the entire Themes tab layout */
.theme-settings-container {
    display: flex;
    gap: 20px;
    align-items: flex-start; /* CRITICAL: Aligns the tops of both columns */
}

/* 2. Left column containing the list of themes */
.theme-list-container {
    flex: 1;
}

/* 3. Right column containing the live preview */
.theme-preview-wrapper {
    flex: 2;
    position: sticky; /* Keeps preview visible on scroll */
    top: 20px;
    padding-left: 20px;
    border-left: 1px solid var(--background-modifier-border);
}

/* 4. Align the titles of both columns */
.theme-list-container > h3,
.theme-preview-wrapper > h3 {
    margin-top: 0;
    margin-bottom: 12px;
    font-weight: 600;
}

/* 5. Fix the large gap above the "October 2025" title */
.theme-preview-pane .preview-section-header {
    margin-top: 0 !important;
    padding-top: 0 !important;
}
.theme-preview-pane .preview-section-header h3 {
    margin-top: 0 !important;
}

/* Reduce the space below the task list wrapper in the preview */
.theme-preview-pane .preview-section-wrapper {
  margin-bottom: 8px; /* Default is likely 20px or more */
}

/* Reduce the space above the "DOT COLOR KEY" title */
.theme-preview-pane .preview-dot-key-container {
  margin-top: 10px; /* Default is likely 15px or more */
}

/* 6. General wrapper for sections inside the preview */
.preview-section-wrapper {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 6px;
}

/* 7. NEW: Two-column layout for the dot color key */
.preview-dot-key-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Creates two equal columns */
    gap: 0 20px; /* 0px vertical gap, 20px horizontal gap */
    margin-top: 15px;
    padding-top: 0;
    border-top: none !important; /* Explicitly removes the horizontal line */
}

.preview-dot-key-container h5 {
    grid-column: 1 / -1; /* Makes the "DOT COLOR KEY" title span both columns */
    margin-bottom: 10px;
}

/* Styling for the list of theme files */
.theme-list-item {
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
}

.theme-list-item:hover {
    background-color: var(--background-modifier-hover);
}

.theme-list-item.is-active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
}

/* --- Theme Preview --- */
/* Tab buttons for light/dark mode */
.theme-preview-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.theme-preview-tabs button { padding: 6px 12px; border: none; border-radius: var(--radius-m); cursor: pointer; background-color: var(--background-modifier-hover); color: var(--text-muted); transition: background-color 0.2s ease; }
.theme-preview-tabs button.is-active { background-color: var(--interactive-accent); color: var(--text-on-accent); font-weight: 600; }

/* Main preview pane layout */
.theme-preview-pane { padding: 15px; border-radius: 8px; border: 1px solid var(--background-modifier-border); }

/* Inner wrappers for sections */
.preview-section-wrapper { padding: 10px; border-radius: 6px; margin-bottom: 20px; }

/* Calendar layout styles */
/*
.preview-calendar-grid { width: 100%; border-collapse: collapse; font-size: 11px; }
.preview-calendar-grid th { font-weight: 600; padding-bottom: 8px; }
.preview-calendar-grid td { vertical-align: middle; text-align: center; }
.preview-day-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px 0; border-radius: 6px; height: 45px; }
.preview-day-number { display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 13px; }
.preview-day-number.today { width: 2.2em; height: 2.2em; border-radius: 50%; }
.preview-dots-container { display: flex; gap: 3px; height: 4px; }
.preview-dot { width: 4px; height: 4px; border-radius: 50%; }
*/
/* Base styles for the preview grid container */
.preview-calendar-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
}
.preview-calendar-grid th {
    font-weight: 600;
    padding-bottom: 8px;
}
.preview-calendar-grid td {
    vertical-align: middle;
    text-align: center;
    height: 45px; /* Give the cell a fixed height */
}

/* 
  1. The Preview Day Content Wrapper
  This is now the positioning anchor, just like the main calendar.
*/
.preview-day-content {
    position: relative;
    width: 100%;
    height: 100%;
}

/* 
  2. The Preview Day Number
  Now uses absolute positioning to guarantee it is centered.
*/
.preview-day-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1; /* Sits above the highlight */
    
    font-weight: 500;
    font-size: 13px;
}

/* Style for the "today" highlight in the preview */
.preview-day-number.today {
    width: 2.2em;
    height: 2.2em;
    border-radius: 50%; /* Or 6px for a squircle */
    
    /* Use flex to center the number text INSIDE the highlight */
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 
  3. The Preview Dots Container
  Now uses absolute positioning for perfect alignment.
*/
.preview-dots-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    
    /* 
      This 'top' value positions the dots vertically. 
      It should correspond to the 'normal' layout setting for a good preview.
    */
    top: 30px; 
    
    display: flex;
    gap: 3px;
    z-index: 2; /* Sits on top of the highlight */
}

/* Style for the individual dots in the preview */
.preview-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
}

/* Tasks layout styles */
.preview-task-group { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 6px; font-weight: 500; margin-bottom: 6px; }

.is-mobile .period-calendar-table tbody td.first-date-column::before {
    display: none;
}
.is-mobile .period-calendar-table tbody tr {
    height: auto;
}

.applied-theme-indicator .setting-item-name {
    color: var(--text-normal) !important;
}

.applied-theme-indicator .setting-item-description {
    color: var(--text-muted) !important;
}
.preview-dot-key-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Creates two equal columns */
    gap: 0 20px; /* 0px vertical gap, 20px horizontal gap */
    margin-top: 15px;
    padding-top: 0;
    border-top: none !important; /* Ensures the line is removed */
}
.preview-dot-key-container h5 {
    font-weight: bold;
    margin-bottom: 10px;
}

.preview-dot-key-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.preview-dot-key-swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
}

/* Organizes the header into a flexible container */
.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Creates a vertical stack for the title and path */
.popup-title-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Prevents long text from breaking the layout */
    margin-right: 10px; /* Adds space between the text and the close button */
}

/* Styles the new path element */
.popup-header-path {
    font-size: 0.8em; /* Smaller font for the path */
    color: var(--text-muted); /* Uses the theme's muted text color */
    white-space: nowrap; /* Prevents the path from wrapping */
    overflow: hidden;
    text-overflow: ellipsis; /* Adds "..." to very long paths */
}

/* In the File Info section, allow the path text to wrap */
.other-notes-popup-item .note-title-path-wrapper .note-path {
    white-space: normal; /* Allows text to wrap */
    word-break: break-all; /* Breaks long paths without spaces */
}

/* Styles the container for the 'No backlinks' message and delete button */
.other-notes-popup-item-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--background-secondary-alt); /* A subtle background to distinguish it */
    border-radius: 6px;
    margin-top: 4px;
}

/*
 * Styles the "Delete File" button to be less intrusive.
 * It uses theme variables for a consistent look and feel.
 */
.other-notes-popup-item-actions button.mod-danger {
    background-color: var(--background-modifier-hover);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 5px;
    margin-left: 16px; /* Adds space between the message and the button */
    transition: all 0.2s ease-in-out;
}

/* Adds a more prominent style when hovering over the delete button */
.other-notes-popup-item-actions button.mod-danger:hover {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
}

/*
 * Styles the wrapper for the icon and the "No backlinks" text.
 * This ensures the icon and text are aligned and spaced correctly.
 */
.other-notes-popup-item-actions > div {
    display: flex;
    align-items: center;
    gap: 8px; /* Adds space between the icon and the text */
    color: var(--text-muted); /* Uses a more subtle text color */
}

/* Ensures the full file path in the info section can wrap to multiple lines */
.other-notes-popup-item .note-title-path-wrapper .note-path {
    white-space: normal;
    word-break: break-all;
}

/* Standard clickable cursor for the file info section */
.other-notes-popup-item.is-clickable {
    cursor: pointer;
}

/* Disable hover and pointer for calendar events */
.other-notes-popup-item.is-calendar-event {
    cursor: default; /* Change from pointer to default cursor */
}

.other-notes-popup-item.is-calendar-event:hover {
    background-color: transparent; /* Prevent hover background change */
}

/* Keep hover for regular notes/assets */
.other-notes-popup-item:not(.is-calendar-event):hover {
    background-color: var(--background-modifier-hover);
}

.popup-asset-thumbnail {
    width: 22px;
    height: 22px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px; /* Adds space between thumbnail and text */
}

/* Adjust the main item layout to use flexbox */
.other-notes-popup-item {
    display: flex;
    align-items: center;
}

/* --- Mobile-Specific Popup Styles --- */
@media only screen and (max-width: 600px) {

    .other-notes-popup {
        /* 
         * Sizing:
         * - Make it 90% of the viewport width.
         * - Unset the fixed min-width from the desktop rule.
         * - Ensure it doesn't get wider than 450px.
        */
        width: 90vw !important;
        min-width: unset !important;
        max-width: 450px !important;
        
        /* Positioning: Fix it to the bottom of the screen. */
        position: fixed !important;
        bottom: calc(8px + env(safe-area-inset-bottom)) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        
        /* Appearance: Style it like a modern mobile bottom sheet. */
        max-height: 50vh !important; /* Prevents it from covering the whole screen. */
        border-radius: 12px 12px 12px 12px !important; /* Rounds only the top corners. */
        box-shadow: 0 -4px 16px rgba(0,0,0,0.2) !important; /* Shadow to lift it off the page. */
        
        /* Reset any desktop positioning styles. */
        top: auto !important; 
        margin: 0 !important;
    }

    /* Ensure the scrollable content area has appropriate padding. */
    .popup-content-wrapper {
        padding: 8px 12px !important;
    }
}

.other-notes-popup.is-mobile-popup {
    border-radius: 12px 12px 0 0; /* Rounded top corners */
    box-shadow: 0 -4px 16px rgba(0,0,0,0.2); /* Shadow at the top */
    border-top: 1px solid var(--background-modifier-border);
}

/* --- Popup Actions --- */
.popup-actions-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    margin-top: 4px;
    border-top: 1px solid var(--background-modifier-border);
    background-color: transparent !important;
}

.popup-info-message {
    display: flex;
    align-items: center;
    gap: 8px; /* Space between icon and text */
    font-size: 12px;
    color: var(--text-muted);
    /* Ensure it also has no background */
    background-color: transparent !important;
}

.other-notes-popup-item {
    background-color: transparent;
}

/* Style for the icon button itself */
.popup-action-icon-btn {
    cursor: pointer;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.popup-action-icon-btn .svg-icon {
    width: 16px;
    height: 16px;
    color: var(--text-muted);
}

.popup-action-icon-btn:hover {
    background-color: var(--background-modifier-hover);
}

/* Specific danger state for delete */
.popup-action-icon-btn.mod-danger:hover {
    background-color: var(--color-red);
}

.popup-action-icon-btn.mod-danger:hover .svg-icon {
    color: var(--text-on-accent);
}

/* Style the header when reorder mode is active to give user feedback */
.reorder-mode-active .note-group-header-content {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

/* By default, hide the drag handles on all note rows */
.note-row .drag-handle {
    display: none;
}

/* Only show the drag handle when the container is in reorder mode */
.reorder-mode-active .note-row .drag-handle {
    display: flex;
}


/* --- Main Tab Scroller --- */
.pm-tab-content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto; /* Enables vertical scrolling when content overflows */
}

/* --- Base Widget Container --- */
/* Defines the appearance and INTERNAL spacing of all widgets */
.pm-widget-container {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px; /* Correct internal gap for elements inside a widget */
}

/* --- Main Dashboard Grid Layout --- */
/* This is the master grid that positions all widgets */
.pm-dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px; /* Correct external gap BETWEEN widgets */
    padding: 4px;
}

/* --- Grid Item Sizing --- */
/* This is the key rule: It makes any widget that is NOT a half-width summary widget span the full two columns. */
.pm-dashboard-grid > .pm-widget-container:not(.is-summary-widget) {
    grid-column: span 2;
}

/* --- Widget Header --- */
.pm-widget-container h3 {
    margin: 0 0 8px 0;
    font-size: 0.8em;
    font-weight: bold;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Overdue Task Styling */
.pm-progress-segment.overdue {
    background-color: var(--task-color-overdue);
}
.legend-color-box.overdue {
    background-color: var(--task-color-overdue);
}

/* Heatmap Widget Styles */
.pm-dashboard-grid .heatmap-container {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.pm-dashboard-grid .heatmap-container::-webkit-scrollbar {
    display: none;
}
.pm-dashboard-grid .heatmap-day-labels {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--background-secondary);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 8px 4px 0;
    font-size: 11px;
    color: var(--text-muted);
}
.pm-dashboard-grid .heatmap-day-labels span {
    line-height: 1;
}
.pm-dashboard-grid .heatmap-grid {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: auto repeat(7, 1fr);
    grid-auto-columns: minmax(14px, 1fr);
    gap: 4px;
}
.pm-dashboard-grid .heatmap-month-label {
    white-space: nowrap;
    font-size: 12px;
    color: var(--text-muted);
    align-self: end;
}
.pm-dashboard-grid .heatmap-cell {
    aspect-ratio: 1 / 1;
    border-radius: 3px;
    background-color: var(--background-modifier-border);
}
.pm-dashboard-grid .heatmap-cell.level-1 { background-color: #4A271E; }
.pm-dashboard-grid .heatmap-cell.level-2 { background-color: #D35400; }
.pm-dashboard-grid .heatmap-cell.level-3 { background-color: #F39C12; }
.pm-dashboard-grid .heatmap-cell.level-4 { background-color: #FFB74D; }

/* Widget Header with Toggle */
.pm-widget-header {
    display: flex;
    justify-content: space-between; 
    align-items: center;
    width: 100%;
}

/* Default state for the total count - no pointer */
.heatmap-total-count {
    cursor: default !important;
    text-decoration: none !important;
    font-size: 0.9em;
    font-weight: normal;
    color: var(--text-muted);
}

/* This rule ONLY applies when a link exists, adding the hand pointer and underline */
.heatmap-total-count.is-clickable {
    cursor: pointer !important;
    text-decoration: underline !important;
    text-decoration-style: dotted !important;
    text-underline-offset: 3px;
}

/* Optional: Add a hover effect only when it's clickable */
.heatmap-total-count.is-clickable:hover {
    color: var(--text-accent);
}

/* Change cursor to a hand pointer for interactive heatmap cells */
.heatmap-cell.is-interactive:hover {
    cursor: pointer;
}

/* Task Bar Chart Widgets */
.pm-bar-chart-widget {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    margin-bottom: 12px;
}
.pm-bar-label {
    grid-column: 1;
    font-size: 0.9em;
    font-weight: 500;
}
.pm-bar-display-value {
    grid-column: 2;
    justify-self: end;
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-muted);
}
.pm-bar-track {
    grid-column: 1 / 3;
    grid-row: 2;
    height: 8px;
    background-color: var(--background-modifier-border);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;
}
.pm-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-in-out;
}

/* Dashboard Heatmap Highlights */
.heatmap-cell.heatmap-today-cell {
    border: 1px solid var(--interactive-accent);
    border-radius: 2px;
}
.heatmap-cell.heatmap-current-week-cell {
    background-color: rgba(128, 128, 128, 0.1) !important;
    border-radius: 2px;
}
body.theme-dark .heatmap-cell.heatmap-current-week-cell {
    background-color: rgba(255, 255, 255, 0.05) !important;
}
.heatmap-day-labels .heatmap-today-label,
.heatmap-month-label.heatmap-current-month-label {
    color: var(--text-accent);
    font-weight: 700;
}

/* Progress Bar Widgets */
.pm-progress-bar {
    display: flex;
    width: 100%;
    height: 24px;
    border-radius: 6px;
    overflow: hidden;
    background-color: var(--background-modifier-border);
}
.pm-progress-segment {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.9em;
    transition: width 0.3s ease-in-out;
}
.pm-progress-segment.incomplete {
    background-color: var(--task-color-open);
}
.pm-progress-segment.completed {
    background-color: var(--task-color-completed);
}
.pm-progress-legend {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 0.8em;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
}
.legend-color-box {
    width: 12px;
    height: 12px;
    border-radius: 3px;
}
.legend-color-box.incomplete {
    background-color: var(--task-color-open);
}
.legend-color-box.completed {
    background-color: var(--task-color-completed);
}

/* Draggable List for Settings */
.pm-draggable-widget-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.pm-draggable-widget-item {
    display: flex;
    align-items: center;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    user-select: none;
}
.pm-drag-handle {
    padding: 10px;
    cursor: grab;
    color: var(--text-faint);
}
.pm-setting-wrapper {
    flex-grow: 1;
}
.pm-setting-wrapper .setting-item {
    padding: 8px 0;
    border: none;
}
.pm-setting-wrapper .setting-item-info {
    width: 100%;
}
.pm-draggable-widget-item.dragging {
    opacity: 0.5;
    background: var(--background-modifier-accent);
}
.pm-drag-placeholder {
    background-color: var(--background-modifier-hover);
    border: 2px dashed var(--background-modifier-border);
    border-radius: var(--radius-m);
    margin: 5px 0;
}

.pm-progress-segment.is-interactive:hover {
    cursor: pointer;
    filter: brightness(1.2); /* Optional: makes the bar slightly brighter on hover */
}

.pm-heatmap-config-box {
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-l); /* Uses Obsidian's large radius for a nice card look */
  padding: 16px;
  margin-bottom: 20px;
  background-color: var(--background-secondary); /* A slightly different background to stand out */
}

/* Add a title style for inside the box */
.pm-heatmap-config-box h2 {
  margin-top: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: none;
}

.pm-folder-exclusion-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-border);
}

.pm-widget-header {
    cursor: default !important;
    display: flex;
    align-items: center;
    gap: 8px; /* Creates space between the icon and title */
}

.pm-widget-header .heatmap-collapse-icon,
.pm-widget-header h3,
.pm-widget-header .heatmap-total-count.is-clickable {
  cursor: pointer !important;
}

.pm-widget-header .heatmap-collapse-icon:hover,
.pm-widget-header h3:hover,
.pm-widget-header .heatmap-total-count.is-clickable:hover {
  color: var(--text-accent);
}

.heatmap-collapse-icon {
    cursor: pointer;
    color: var(--text-muted);
    transition: transform 0.2s ease-in-out;
    display: flex;
    align-items: center;
    margin-top: -8px; 
}

.pm-widget-container.is-collapsed .heatmap-collapse-icon {
    transform: rotate(-90deg);
}

.pm-widget-container.is-collapsed .heatmap-container {
    display: none;
}

.pm-widget-header h3 {
    cursor: pointer;
    /* THE FIX: Pushes the title to the left, leaving space on the right */
    margin-right: auto; 
}

/* --- New styles for 2-state summary widgets --- */
.pm-widget-container.is-summary-widget .pm-widget-header {
    display: flex;
    /* This is the key: it forces all items to align to their vertical centers. */
    align-items: center; 
    gap: 6px;
    cursor: pointer;
    margin-bottom: 4px;
}

.summary-toggle-icon {
    color: var(--text-muted);
    transition: transform 0.2s ease-in-out;
    /* We also make the icon a flex container to center the SVG within it */
    display: flex;
    align-items: center;
    justify-content: center;
    /* A fixed size helps maintain consistent spacing */
    width: 18px;
    height: 18px;
    margin-top: -8px;
}

.is-mini .pm-progress-legend {
    display: none;
}

.is-mini .summary-toggle-icon {
    transform: rotate(-90deg); /* Points Left */
}

.is-minimised .bar-and-legend-wrapper {
    display: none;
}

.is-minimised .summary-toggle-icon {
    transform: rotate(180deg); /* Points Up */
}

/* --- Styles for Collapsible Widgets --- */

.pm-widget-header {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}

.widget-toggle-icon {
    color: var(--text-muted);
    transition: transform 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: -8px;
}

.is-collapsed .widget-content-wrapper {
    display: none;
}

.is-collapsed .widget-toggle-icon {
    transform: rotate(-90deg); /* Points left */
}

.pm-composite-bar-wrapper {
    margin-bottom: 8px;
}
.pm-composite-bar-label {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--text-muted);
}
.pm-widget-container.is-summary-widget {
    gap: 0px;
    min-height: 80px;
    justify-content: center;
}
.pm-widget-container.is-summary-widget .task-group-empty-message {
    /* Centers the 'No tasks' message perfectly in the middle of the widget */
    text-align: center;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pm-dashboard-grid {
    align-items: stretch;
}
.pm-widget-container.is-summary-widget.is-minimised {
    
    padding-bottom: 4px;
    gap: 0;
}

.pm-widget-container.is-summary-widget.is-minimised .pm-widget-header {
    margin-bottom: 0;
}

.pm-widget-container.is-collapsed {
    padding-bottom: 4px;
}

.pm-widget-container.is-collapsed .pm-widget-header {
    margin-bottom: 0;
}

.pm-progress-segment.in-progress {
    background-color: var(--task-color-inprogress);
}
.legend-color-box.in-progress {
    background-color: var(--task-color-inprogress);
}

.pm-progress-segment.no-due {
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
}
.legend-color-box.no-due {
    background-color: var(--background-modifier-border);
}


/* --- Task Group Collapse Styles --- */
.task-row {
    display: flex;
    align-items: center;
    padding: 12px 0 8px 0;  /* Increase from 4px to 10px for top/bottom padding */
}

.task-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: var(--task-heading-font-size);
}
.task-group-header-content {
  display: flex;
  align-items: center;
  gap: 6px;
}
.task-group-collapse-icon .svg-icon {
  transition: transform 0.3s ease-in-out;
}
.task-group-container.is-collapsed .task-group-collapse-icon .svg-icon {
  transform: rotate(-180deg);
}
.task-list-wrapper {
  transition: height 0.35s ease-in-out, opacity 0.35s ease-in-out;
  overflow: hidden;
  opacity: 1;
  height: var(--task-list-height, auto);
}

.task-group-container.is-collapsed .task-list-wrapper {
  height: 0;
  opacity: 0;
}

.task-group-empty-message {
  font-style: italic;
  color: var(--text-muted);
  padding: 4px 0;
  font-size: 0.9em;
}
.task-row .task-text {
  flex-grow: 1;
  font-size: var(--task-text-font-size);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-row .task-text,
.other-notes-popup-item .task-text {
    flex: 1;             /* Modern shorthand for flex-grow, shrink, basis */
    display: flex;       /* CRITICAL: Makes this a flex container */
    align-items: center; /* Vertically aligns the text nicely */
    min-width: 0;
    line-height: 1.7;
}

/* Add this rule to handle the paragraph inside */
.other-notes-popup-item .task-text > p {
    width: 100%;
    margin: 0;
}


.other-notes-popup-item .task-checkbox-symbol {
    margin-top: 4px !important;  
    align-self: flex-start;     
}

.task-text.completed {
    text-decoration: line-through;
    opacity: 0.6;
    color: var(--text-muted);
}
    
.tasks-container.show-full-text .task-row {
  align-items: flex-start;
}
.tasks-container.show-full-text .task-text {
  white-space: normal;
  word-break: break-word;
}
.tasks-container.show-full-text .task-row .task-checkbox {
  margin-top: 2px;
}

/* Container for task checkbox */
.task-checkbox-symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4em;
    height: 1.4em;
    position: relative;
    flex-shrink: 0;
    margin: 2px 0 0 0;
    padding: 0;
}

/* Hide everything except the checkbox */
.task-checkbox-symbol .task-list-item {
    list-style: none;
    padding: 0;
    margin: 0;
    display: contents;
    align-items: center;
    justify-content: center;
}

.task-checkbox-symbol li.task-list-item {
    all: unset;
    display: contents; /* Makes it not generate a box */
    margin: 0 !important;
    padding: 0 !important;
    list-style: none;
}

/* Hide the text content after the checkbox */
.task-checkbox-symbol .task-list-item-checkbox ~ * {
    display: none;
}

.task-checkbox-symbol .task-list-item-checkbox {
    margin: 0;
   
}
.asset-grid-preview img {
    object-fit: contain !important;
}

.note-group-container {
  overflow: visible !important;
  max-height: none !important;
}

.asset-grid-preview img {
  object-fit: contain !important;
}
.pinned-notes-empty-message {
    padding: 24px;
    text-align: center;
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.9em;
}

.pinned-notes-empty-message code {
    font-style: normal;
    font-size: 1.1em;
}
body.is-mobile .tabs-content-wrapper {
    padding-bottom: 0 !important;
}
`;

// === Helper Functions and Classes ===
/**
 * Parses an "rgba(r, g, b, a)" string into an object.
 * @param {string} rgbaString The input string.
 * @returns {{r: number, g: number, b: number, a: number} | null}
 */
function parseRgbaString(rgbaString) {
    if (!rgbaString) return null;
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
}

/**
 * Blends two RGBA color objects based on a mix factor.
 * @param {{r,g,b,a}} color1 The start color object.
 * @param {{r,g,b,a}} color2 The end color object.
 * @param {number} factor A value from 0 (100% color1) to 1 (100% color2).
 * @returns {string} The resulting "rgba(...)" string.
 */
function blendRgbaColors(color1, color2, factor) {
    const r = Math.round(color1.r * (1 - factor) + color2.r * factor);
    const g = Math.round(color1.g * (1 - factor) + color2.g * factor);
    const b = Math.round(color1.b * (1 - factor) + color2.b * factor);
    const a = (color1.a * (1 - factor) + color2.a * factor).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * A reusable confirmation modal dialog.
 */
class ConfirmationModal extends Modal {
    constructor(app, title, message, onConfirm, confirmText = "Confirm") {
        super(app);
        this.title = title;
        this.message = message;
        this.onConfirm = onConfirm;
        this.confirmText = confirmText;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: this.title });
        contentEl.createEl("p", { text: this.message });
        const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

        buttonContainer.createEl("button", {
            text: this.confirmText,
            cls: "mod-cta",
        }).addEventListener("click", () => {
            this.close();
            this.onConfirm();
        });

        buttonContainer.createEl("button", {
            text: "Cancel",
        }).addEventListener("click", () => {
            this.close();
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}

/* A modal dialog that presents multiple action choices to the user when creating a new daily note. */
class ActionChoiceModal extends Modal {
    constructor(app, title, message, buttons) {
        super(app);
        this.title = title;
        this.message = message;
        this.buttons = buttons;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.title });
        if (this.message) {
            contentEl.createEl('p', { text: this.message });
        }

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        for (const buttonConfig of this.buttons) {
            const btn = buttonContainer.createEl('button', { text: buttonConfig.text });
            if (buttonConfig.cls) {
                btn.addClass(buttonConfig.cls);
            }
            btn.addEventListener('click', () => {
                this.close();
                if (buttonConfig.action) {
                    buttonConfig.action();
                }
            });
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}

/**
 * Calculates the custom period and week number based on a given start date.
 * A year is divided into 13 periods of 4 weeks each.
 * @param {Date} date - The date to calculate for.
 * @param {string} startOfPeriodsOverride - The start date in "YYYY-MM-DD" format from settings.
 * @returns {{period: number, week: number, weekSinceStart: number}} An object with the period, week, and total weeks since start.
 */
function getPeriodWeek(date = new Date(), startOfPeriodsOverride) {
    const defaultStartString = "2025-03-02";
    let startString = startOfPeriodsOverride || defaultStartString;

    let startMoment = moment(startString, "YYYY-MM-DD", true);

    if (!startMoment.isValid()) {
        console.warn(
            `[Calendar Period Week Notes] Invalid "Start of Period 1" date format: "${startString}". ` +
            `It must be YYYY-MM-DD. Falling back to default date ${defaultStartString}.`
        );
        startMoment = moment(defaultStartString, "YYYY-MM-DD", true);
    }

    // Use moment's built-in diff method to correctly calculate the number of
    // calendar days. This automatically handles Daylight Saving Time and other offsets.
    const daysSinceStart = moment(date).startOf('day').diff(startMoment.startOf('day'), 'days');
    const weekNumber = Math.floor(daysSinceStart / 7);
    const periodIndex = Math.floor(weekNumber / 4);
    const period = ((periodIndex % 13) + 13) % 13 + 1;
    const week = ((weekNumber % 4) + 4) % 4 + 1;

    return { period, week, weekSinceStart: weekNumber + 1 };
}

/**
 * Parses a file's content to find all tasks and their metadata.
 * @param {TFile} file The file to parse.
 * @param {string} content The content of the file.
 * @returns {Array<object>} An array of structured task objects.
 */
function parseTasksFromFile(file, content) {
    const tasks = [];
    const lines = content.split('\n');

    const taskRegex = /^\s*(?:-|\d+\.)\s*\[(.)\]\s*(.*)/;
    const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
    const completionDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
    const tagRegex = /#([a-zA-Z0-9_\-\/]+)/g;

    lines.forEach((line, index) => {
        const match = line.match(taskRegex);
        if (match) {
            const status = match[1];
            const text = match[2];
            const isCompleted = status.toLowerCase() === 'x';

            const dueDateMatch = text.match(dueDateRegex);
            const dueDate = dueDateMatch ? moment(dueDateMatch[1], "YYYY-MM-DD").toDate() : null;

            const completionDateMatch = text.match(completionDateRegex);
            const completionDate = completionDateMatch ? moment(completionDateMatch[1], "YYYY-MM-DD").toDate() : null;

            const tags = Array.from(text.matchAll(tagRegex)).map(m => m[1]);

            let displayText = text.trim();
            // Optionally clean up the display text
            if (!isCompleted) {
                displayText = displayText.replace(completionDateRegex, '').trim();
            }

            tasks.push({
                text: displayText,
                originalText: text, // Keep original text for modifications
                file,
                lineNumber: index,
                dueDate,
                tags,
                status,
                completionDate
            });
        }
    });
    return tasks;
}

/**
 * Formats a date to show time if it's today, otherwise shows the full date.
 * @param {Date} date The date to format.
 * @returns {string} The formatted date string.
 */
function formatDateTime(date) {
    const now = new Date();
    if (isSameDay(date, now)) return moment(date).format('HH:mm');
    return moment(date).format('DD-MM-YYYY');
}

// Utility wrappers around moment.js for consistent date handling.
function formatDate(date, format) { return moment(date).format(format); }
function formatMonthTitle(date, format) { return moment(date).format(format); }
function isSameDay(a, b) { return moment(a).isSame(b, 'day'); }

class ConfirmationModalWithStyles extends ConfirmationModal {
    onOpen() {
        super.onOpen();

        const { contentEl } = this;

        // Style the main content container
        contentEl.style.padding = '20px 24px';
        contentEl.style.textAlign = 'center';

        // Style the title using CSS variables
        const titleEl = contentEl.querySelector('h1, h2');
        if (titleEl) {
            titleEl.style.marginBottom = '16px';
            titleEl.style.fontSize = '1.3rem';
            // Use the primary text color variable
            titleEl.style.color = 'var(--text-normal)';
        }

        // Style the message paragraph using CSS variables
        const messageEl = contentEl.querySelector('p');
        if (messageEl) {
            messageEl.style.lineHeight = '1.6';
            messageEl.style.marginBottom = '24px';
            messageEl.style.fontSize = '1rem';
            // Use the muted text color variable for secondary text
            messageEl.style.color = 'var(--text-muted)';
        }

        // Style the button container
        const buttonContainer = contentEl.querySelector('.modal-button-container');
        if (buttonContainer) {
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '12px';
        }

        // Style the primary confirmation button
        const confirmButton = contentEl.querySelector('.mod-cta');
        if (confirmButton) {
            confirmButton.style.fontWeight = '600';
        }
    }

}

/**
 * A custom input suggester for tags.
 */
class TagSuggest extends AbstractInputSuggest {
    constructor(app, inputEl, view) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.view = view;
        this.allTags = new Set();
    }

    getSuggestions(query) {
        this.refreshAllTags();

        // If the query is empty, show all tags, sorted alphabetically.
        if (!query) {
            return Array.from(this.allTags)
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            //.slice(0, 20);
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
        const finalValue = `#${tag}`;
        this.setValue(finalValue);

        if (this.view.activeTab === 'tasks') {
            this.view.tasksSearchTerm = finalValue;
            this.view.populateTasks();
        } else if (this.view.activeTab === 'notes') {
            this.view.notesSearchTerm = finalValue;
            this.view.populateNotes();
        }

        // This will now work correctly
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
                    task.tags.forEach(tag => this.allTags.add(tag));
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
class FilterSuggest extends AbstractInputSuggest {
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

/**
 * The main view class for the plugin, handling all rendering and user interaction.
 */
class PeriodMonthView extends ItemView {
        
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.themeChangeDebounceTimer = null;
        this.calendarHeaderRowEl = null;
        this.pinnedSortOrder = this.plugin.settings.pinnedNotesSortOrder;
        this.blurActiveInput = this.blurActiveInput.bind(this);
        this.dashboardContentEl = null;
        this.dashboardTaskDebounceTimer = null;
        this.dashboardCreationDebounceTimer = null;
        this.dashboardRefreshTimers = new Map();
        this.fileToHeatmapCache = new Map();
        this.resizeDebounceTimer = null;
        this.statusBarObserver = null;
    
        //pull down to fresh
        this.taskPullStartY = 0;
        this.taskPullDistance = 0;
        this.isTaskPulling = false;

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
        this.notesRefreshDebounceTimer = null;
        this.calendarRefreshDebounceTimer = null;
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
                clearTimeout(this.themeChangeDebounceTimer);
            }
            this.themeChangeDebounceTimer = setTimeout(() => {
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

        this.registerDomEvent(window, 'resize', () => {
            // Clear any existing timer to debounce the event
            if (this.resizeDebounceTimer) {
                clearTimeout(this.resizeDebounceTimer);
            }
            
            // Set a new timer to run the update after a short delay
            this.resizeDebounceTimer = window.setTimeout(() => {
                // Check if the title element exists and then re-render it
                if (this.monthNameEl) {
                    this.updateMonthTitle();
                }
            }, 100); // A 100ms delay is usually sufficient
        });
    }

    /**
     * Renders the task checkbox using native Obsidian task list markup
     * that inherits theme styling.
     * @param {HTMLElement} container The container for the checkbox.
     * @param {object} task The task object containing status information.
     */
    async _renderTaskSymbol(checkboxEl, task) {
        checkboxEl.empty();
        checkboxEl.className = 'task-checkbox-symbol';

        const status = task.status;

        // Create a minimal markdown string with the task
        const markdownText = `- [${status}] `;

        // Use MarkdownRenderer to render it - this will inherit ALL theme styling
        await MarkdownRenderer.render(
            this.app,
            markdownText,
            checkboxEl,
            task.file.path,
            this
        );

        // Find the checkbox that was rendered
        const checkbox = checkboxEl.querySelector('input[type="checkbox"]');
        if (checkbox) {
            // REMOVE the disabled attribute to allow clicks
            checkbox.disabled = false;

            // Add click handler to toggle task status
            checkbox.addEventListener('click', async (e) => {
                // CRITICAL: Prevent the default checkbox toggle behavior
                e.preventDefault();
                e.stopPropagation();

                // Disable the checkbox during the update to prevent double-clicks
                checkbox.disabled = true;

                // Toggle the task completion in the file
                await this.toggleTaskCompletion(task);

                // The file watcher will automatically refresh the view
                // and re-enable the checkbox when renderTaskSymbol is called again
            });
        }
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
        setTimeout(() => {
            const activeEl = document.activeElement;

            // Check if it's an element that can be blurred before calling the method
            if (activeEl instanceof HTMLElement && typeof activeEl.blur === 'function') {
                activeEl.blur();
            }
        }, 0);
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
            this.containerEl.firstElementChild.classList.toggle('calendar-collapsed', shouldBeCollapsed);
        }
    }

    async refreshWithNewSettings(newSettings) {
        this.plugin.settings = newSettings;
        await this.populateNotes();
    }

    updateDynamicPadding() {
        if (Platform.isMobile) return; // Don't run this logic on mobile

        const statusBar = document.querySelector('.status-bar');
        const contentWrapper = this.containerEl.querySelector('.tabs-content-wrapper');

        if (statusBar && contentWrapper) {
            const statusBarHeight = statusBar.offsetHeight;
            contentWrapper.style.paddingBottom = `${statusBarHeight}px`;
        }
    }

    renderTaskSummaryWidget(parent, title, incompleteTasks, completedTasks, overdueTasks = [], inProgressTasks = [], noDueTasks = [], widgetKey) {
    
        const widgetContainer = parent.createDiv({ cls: 'pm-widget-container is-summary-widget' });

        // --- State Management (Your code, unchanged) ---
        const states = ['full', 'mini'];
        let currentState = this.plugin.settings.smallWidgetStates[widgetKey] || 'full';

        // --- UI Elements (Your code, unchanged) ---
        const header = widgetContainer.createDiv({ cls: 'pm-widget-header' });
        const toggleIcon = header.createDiv({ cls: 'summary-toggle-icon' });
        const titleEl = header.createEl('h3', { text: title });

        // --- Core Rendering Logic (MODIFIED) ---
        const totalTasks = (incompleteTasks?.length || 0) + (completedTasks?.length || 0) + (overdueTasks?.length || 0) + (inProgressTasks?.length || 0) + (noDueTasks?.length || 0);
        const isEmpty = totalTasks === 0;

        // --- UI Update and Click Handlers (Your code, unchanged) ---
        const updateView = () => {
            widgetContainer.removeClasses(['is-full', 'is-mini']);
            widgetContainer.addClass(`is-${currentState}`);
            setIcon(toggleIcon, 'chevron-down');

            if (isEmpty && currentState === 'full') {
                widgetContainer.style.minHeight = '85px';
                widgetContainer.style.display = 'flex';
                widgetContainer.style.justifyContent = 'center';
                widgetContainer.style.alignItems = 'center';
            } else {
                widgetContainer.style.minHeight = '';
                widgetContainer.style.display = '';
                widgetContainer.style.justifyContent = '';
                widgetContainer.style.alignItems = '';
            }
        };

        if (isEmpty) {
            widgetContainer.createDiv({ text: 'No tasks in this period.', cls: 'task-group-empty-message' });
        } else {
            const barAndLegendWrapper = widgetContainer.createDiv({ cls: 'bar-and-legend-wrapper' });
            const progressBar = barAndLegendWrapper.createDiv({ cls: 'pm-progress-bar' });
            const legend = barAndLegendWrapper.createDiv({ cls: 'pm-progress-legend' });

            // --- setupSegment function (MODIFIED TO ADD COLORS) ---
            const setupSegment = (tasks, type) => {
                if (!tasks || tasks.length === 0) return;

                const segment = progressBar.createDiv({
                    cls: `pm-progress-segment ${type}`,
                    text: tasks.length,
                });
                segment.style.width = `${(tasks.length / totalTasks) * 100}%`;
                segment.addClass('is-interactive');

                // --- THIS IS THE NEW COLOR LOGIC ---
                let bgColor = '';
                switch(type) {
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
                        // Using a default grey for no-due as it may not be in settings
                        bgColor = 'rgba(158, 158, 158, 0.5)'; 
                        break;
                }
                if (bgColor) {
                    segment.style.backgroundColor = bgColor;
                }
                // --- END OF NEW COLOR LOGIC ---

                // Your mouseenter logic, unchanged
                segment.addEventListener('mouseenter', () => {
                    if (this.isPopupLocked) return;
                    clearTimeout(this.hideTimeout);
                    this.hideFilePopup();

                    const isCompleted = type === 'completed';
                    const isOverdue = type === 'overdue';
                    const isInProgress = type === 'in-progress';
                    const isNoDue = type === 'no-due';

                    let popupTitleText = 'To Do';
                    if (isCompleted) {
                        popupTitleText = 'Done';
                    } else if (isOverdue) {
                        popupTitleText = 'Overdue';
                    } else if (isInProgress) {
                        popupTitleText = 'In Progress';
                    } else if (isNoDue) {
                        popupTitleText = 'No Due Date';
                    } else if (widgetKey === 'futureNoDue' && type === 'incomplete') {
                        popupTitleText = 'Future';
                    }

                    const popupTitle = `${title} - ${popupTitleText}`;

                    this.hoverTimeout = setTimeout(() => {
                        this.showFilePopup(segment, { tasks: tasks }, popupTitle);
                    }, this.plugin.settings.otherNoteHoverDelay);
                });

                // Your mouseleave logic, unchanged
                segment.addEventListener('mouseleave', () => {
                    clearTimeout(this.hoverTimeout);
                    this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                });

                // Your legend logic, unchanged
                let legendText = 'To Do';
                if (widgetKey === 'futureNoDue' && type === 'incomplete') {
                    legendText = 'Future';
                } else if (type === 'completed') {
                    legendText = 'Done';
                } else if (type === 'overdue') {
                    legendText = 'Overdue';
                } else if (type === 'in-progress') {
                    legendText = 'In Progress';
                } else if (type === 'no-due') {
                    legendText = 'No Due Date';
                }

                const legendItem = legend.createDiv({ cls: 'legend-item' });
                // This sets the legend box color via CSS, but the new logic above sets the bar color
                const legendColorBox = legendItem.createDiv({ cls: `legend-color-box ${type}` });
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

        // Your header click listener, unchanged
        header.addEventListener('click', async () => {
            currentState = currentState === 'full' ? 'mini' : 'full';
            this.plugin.settings.smallWidgetStates[widgetKey] = currentState;
            await this.plugin.saveSettings();
            updateView();
        });

        updateView();
    }




    getComputedCssVar(varName) {
        // this.containerEl is the root element of the view
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

        widgetContainer.empty();

        const isCollapsed = this.plugin.settings.collapsedHeatmaps[widgetKey] === true;
        if (isCollapsed) {
            widgetContainer.addClass('is-collapsed');
        }

        let totalCount = 0;
        for (const files of dataMap.values()) {
            totalCount += files.length;
        }

        const header = widgetContainer.createDiv({ cls: 'pm-widget-header' });

        // 1. Collapse Icon
        const collapseIcon = header.createDiv({ cls: 'heatmap-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');

        // 2. Clickable Title
        const titleEl = header.createEl('h3', { text: title });

        // 3. Total Count (moves to the end)
        const totalCountEl = header.createDiv({
            cls: 'heatmap-total-count',
            text: totalCount.toString()
        });
        /*header.createDiv({
            cls: 'heatmap-total-count',
            text: `${totalCount}`
        });
        */

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

        const heatmapContainer = widgetContainer.createDiv({ cls: 'heatmap-container' });

        // Toggle collapse state
        collapseIcon.addEventListener('click', async () => {
            const currentlyCollapsed = widgetContainer.classList.toggle('is-collapsed');
            this.plugin.settings.collapsedHeatmaps[widgetKey] = currentlyCollapsed;
            await this.plugin.saveSettings();
            if (!currentlyCollapsed) {
                setTimeout(() => {
                    const todayCell = heatmapContainer.querySelector('.heatmap-today-cell');
                    if (todayCell) {
                        const scrollPos = todayCell.offsetLeft - (heatmapContainer.offsetWidth / 2) + (todayCell.offsetWidth / 2);
                        heatmapContainer.scrollLeft = scrollPos;
                    }
                }, 50);
            }
        });

        // Scroll to today
        titleEl.addEventListener('click', () => {
            const todayCell = heatmapContainer.querySelector('.heatmap-today-cell');
            if (todayCell) {
                const scrollPos = todayCell.offsetLeft - (heatmapContainer.offsetWidth / 2) + (todayCell.offsetWidth / 2);
                heatmapContainer.scrollLeft = scrollPos;
            }
        });

        const dayLabelsContainer = heatmapContainer.createDiv({ cls: 'heatmap-day-labels' });
        const grid = heatmapContainer.createDiv({ cls: 'heatmap-grid' });
        const today = moment();
        const weekStartsOnMonday = this.plugin.settings.weekStartDay === 'monday';

        const dayLabels = weekStartsOnMonday ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const todayDayIndex = weekStartsOnMonday ? (today.day() + 6) % 7 : today.day();

        dayLabels.forEach((day, index) => {
            const label = dayLabelsContainer.createSpan({ text: day });
            if (index === todayDayIndex) {
                label.addClass('heatmap-today-label');
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
        let lastLabelColumn = 0;

        while (currentDay.isSameOrBefore(endDate, 'day')) {
            const dayOfWeek = weekStartsOnMonday ? (currentDay.weekday() + 6) % 7 : currentDay.weekday();
            const cellDate = currentDay.clone();

            const mapKey = `${cellDate.year()}-${cellDate.month()}`;
            if (!seenMonths.has(mapKey)) {
                seenMonths.add(mapKey);
                if (cellDate.date() < 7) {
                    let labelCol = colIndex;
                    if (labelCol <= lastLabelColumn) {
                        labelCol = lastLabelColumn + 1;
                    }
                    const monthLabel = grid.createDiv({ cls: 'heatmap-month-label', text: cellDate.format('MMM') });
                    if (cellDate.isSame(today, 'month')) {
                        monthLabel.addClass('heatmap-current-month-label');
                    }
                    monthLabel.style.gridRow = '1';
                    monthLabel.style.gridColumn = `${labelCol}`;
                    lastLabelColumn = labelCol;
                }
            }

            const cell = grid.createDiv({ cls: 'heatmap-cell' });
            const weekType = weekStartsOnMonday ? 'isoWeek' : 'week';
            const startOfThisWeek = today.clone().startOf(weekType);
            const endOfThisWeek = today.clone().endOf(weekType);

            if (cellDate.isBetween(startOfThisWeek, endOfThisWeek, 'day', '[]')) {
                cell.addClass('heatmap-current-week-cell');
            }
            if (cellDate.isSame(today, 'day')) {
                cell.addClass('heatmap-today-cell');
            }

            cell.style.gridColumn = `${colIndex}`;
            cell.style.gridRow = `${dayOfWeek + 2}`;

            const dateKey = cellDate.format('YYYY-MM-DD');
            const filesOnDay = dataMap.get(dateKey);
            const count = filesOnDay ? filesOnDay.length : 0;

            if (count > 0) {
                let countForColor = count; // Default to total count
                let colorGradient = colorSource; // Default to provided gradient

                // --- UNIVERSAL FIX ---
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
                    clearTimeout(this.hideTimeout);
                    this.hideFilePopup();
                    this.hoverTimeout = setTimeout(() => {
                        const itemsOnDay = dataMap.get(dateKey) || [];
                        if (itemsOnDay.length === 0) return;
                        let popupData = {};
                        if (itemsOnDay[0].text !== undefined && itemsOnDay[0].lineNumber !== undefined) {
                            // This is a TASK heatmap.
                            popupData = {
                                tasks: itemsOnDay
                            };
                        } else {
                            // This is a FILE heatmap. We need to correctly categorize the files.
                            const dailyNotes = [];
                            const createdNotes = [];
                            const assets = [];

                            itemsOnDay.forEach(file => {
                                if (this.isDailyNote(file)) {
                                    dailyNotes.push(file);
                                } else if (file.path && file.path.toLowerCase().endsWith('.md')) {
                                    // It's a regular markdown note.
                                    createdNotes.push(file);
                                } else {
                                    // It's not a markdown file, so it must be an asset.
                                    assets.push(file);
                                }
                            });

                            // Construct the data object with the correct categories.
                            popupData = {
                                daily: dailyNotes,
                                created: createdNotes,
                                assets: assets
                            };
                        }

                        this.showFilePopup(cell, popupData, cellDate.toDate());
                    }, this.plugin.settings.otherNoteHoverDelay);
                });

                cell.addEventListener('mouseleave', () => {
                    clearTimeout(this.hoverTimeout);
                    this.hideTimeout = setTimeout(() => {
                        this.hideFilePopup();
                    }, this.plugin.settings.popupHideDelay);
                });
            }

            if (dayOfWeek === 6) {
                colIndex++;
            }
            currentDay.add(1, 'day');
        }

        setTimeout(() => {
            const todayCell = grid.querySelector('.heatmap-today-cell');
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
        const currentMonthId = `month-${now.getFullYear()}-${now.getMonth()}`;
        const currentMonthEl = this.verticalScrollerEl?.querySelector(`#${currentMonthId}`);

        if (this.isVerticalView) {
            // Check if the current month is visible in the viewport.
            const isCurrentMonthVisible = this.isElementInViewport(currentMonthEl);

            if (isCurrentMonthVisible) {
                // If visible, TOGGLE popup lock. This is the ONLY action.
                this.isPopupLocked = !this.isPopupLocked;
                this.todayBtn.classList.toggle('popup-locked', this.isPopupLocked);
                //new Notice(`Calendar popups ${this.isPopupLocked ? 'disabled' : 're-enabled'}.`);
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
                    this.todayBtn.classList.toggle('popup-locked', this.isPopupLocked);
                    this.updateTodayBtnAriaLabel();
                    setTimeout(() => {
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
                this.todayBtn.classList.toggle('popup-locked', this.isPopupLocked);
                //new Notice(`Calendar popups ${this.isPopupLocked ? 'disabled' : 're-enabled'}.`);
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
        this.containerEl.style.setProperty('--calendar-label-font-size', labelFontSize);
        this.containerEl.style.setProperty('--calendar-day-number-font-size', dayNumberFontSize);
    }

    async handleFileClick(file, event, navState = {}) {
        if (!file) return;

        // This logic correctly determines if a new tab should be opened based on your settings.
        const isAsset = file.extension.toLowerCase() !== 'md';
        const openInNewTabSetting = isAsset
            ? this.plugin.settings.assetsOpenAction === 'new-tab'
            : this.plugin.settings.notesOpenAction === 'new-tab';

        const forceNewLeaf = event.shiftKey || openInNewTabSetting;

        // --- FIX #1: Provide the correct source path ---
        // The sourcePath MUST be the path of the file containing the link.
        const sourcePath = file.path;

        // --- FIX #2: Construct the correctly structured navigation state ---
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

        const row = container.createDiv({ cls: 'note-row' });
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
            const dragHandle = row.createDiv({ cls: 'drag-handle' });
            setIcon(dragHandle, 'grip-vertical');

            row.addEventListener('dragstart', (e) => {
                this.isDraggingNote = true;
                e.dataTransfer.setData('text/plain', file.path);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => row.addClass('dragging'), 0);
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
        const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });

        if (settings.showNoteStatusDots) {
            const dot = titleWrapper.createDiv({ cls: 'note-status-dot' });
            if (this.isDailyNote(file)) {
                dot.style.backgroundColor = settings.dailyNoteDotColor;
            } else if (this.isWeeklyNote(file)) {
                dot.style.backgroundColor = settings.weeklyNoteDotColor;
            } else {
                dot.addClass(isSameDay(new Date(file.stat.ctime), new Date(file.stat.mtime)) ? 'note-status-dot-created' : 'note-status-dot-modified');
            }
        }

        const titlePathWrapper = titleWrapper.createDiv({ cls: 'note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: file.basename, cls: 'note-title' });
        if (file.parent && file.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: file.parent.path, cls: 'note-path' });
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

        const noteRows = container.querySelectorAll('.note-row');
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
            clearTimeout(this.dailyRefreshTimeout);
        }

        const now = moment();
        const endOfDay = moment().endOf('day');
        // Calculate milliseconds until the end of today, plus one to tick over to the new day
        const msUntilMidnight = endOfDay.diff(now) + 1;

        this.dailyRefreshTimeout = setTimeout(async () => {

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
    getDisplayText() { return "📅 Calendar Period Week Notes"; }
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
                    // FIX: Pass 'event' and the correct number of arguments
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
                    // FIX: Pass 'event' and the correct number of arguments
                    this.addParsedEvent(event, false);
                }
            }
        } catch (error) {
            new Notice('Calendar Period Week Notes - ICS error: ' + error.message, 10000);
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

        // --- FIX FOR MIDNIGHT EVENTS ---
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
                const pwCell = row.createEl("td", { cls: "pw-label-cell" });
                const pwContent = pwCell.createDiv({ cls: "day-content" });
                pwContent.createDiv({ cls: "day-number" }).setText(this.formatPW(periodWeekData.period, periodWeekData.week));

                pwCell.style.cursor = "pointer";

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
                    const dotsContainer = pwContent.createDiv({ cls: 'dots-container' });

                    const layout = this.plugin.settings.calendarLayout || 'normal';
                    dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');
                    dotsContainer.classList.add(`layout-${layout}`);
                    dotsContainer.createDiv({ cls: 'calendar-dot weekly-note-dot' });
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
                const weekCell = row.createEl("td", { cls: "week-number-cell" });
                const weekContent = weekCell.createDiv({ cls: "day-content" });
                weekContent.createDiv({ cls: "day-number" }).setText(weekNum.toString());

                weekCell.style.cursor = "pointer";

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
                    const dotsContainer = weekContent.createDiv({ cls: 'dots-container' });

                    const layout = this.plugin.settings.calendarLayout || 'normal';
                    dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');
                    dotsContainer.classList.add(`layout-${layout}`);

                    dotsContainer.createDiv({ cls: 'calendar-dot weekly-note-dot' });
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

                const contentDiv = cell.createDiv("day-content");
                const dayNumber = contentDiv.createDiv("day-number");
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
                        contentDiv.createDiv({ cls: 'task-count-badge', text: totalTaskCount.toString() });

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

                                contentDiv.classList.add('heatmap-cell');
                                contentDiv.style.setProperty('--heatmap-color', finalColor);

                                // This creates a border using the theme's background color, making a clean gap.
                                const isInHighlightedRow = settings.highlightCurrentWeek &&
                                    row.classList.contains('current-week-row');

                                // Use the row highlight color as border if in highlighted row
                                if (isInHighlightedRow) {
                                    const borderColor = document.body.classList.contains('theme-dark')
                                        ? settings.rowHighlightColorDark
                                        : settings.rowHighlightColorLight;
                                    contentDiv.style.border = `${this.plugin.settings.contentBorderWidth} solid ${borderColor}`;
                                } else {
                                    contentDiv.style.border = `${this.plugin.settings.contentBorderWidth} solid var(--background-secondary)`;
                                }
                                // A slightly smaller radius makes it look neatly inset.
                                contentDiv.style.borderRadius = '8px';
                                contentDiv.style.boxSizing = 'border-box';

                            }
                        }
                    }
                }


                if (isOtherMonth) dayNumber.addClass("day-number-other-month");
                if (isSameDay(dayDate, today) && !isOtherMonth) cell.addClass("today-cell");

                const dotsContainer = contentDiv.createDiv({ cls: 'dots-container' });
                const layout = this.plugin.settings.calendarLayout || 'normal';

                // Ensure no old layout classes are lingering
                dotsContainer.classList.remove('layout-condensed', 'layout-normal', 'layout-spacious');

                // Apply the correct class based on the current setting
                dotsContainer.classList.add(`layout-${layout}`);


                if (dailyNoteExists) { dotsContainer.createDiv({ cls: "period-month-daily-note-dot calendar-dot" }); }
                if (settings.showOtherNoteDot && createdFiles.length > 0) { dotsContainer.createDiv({ cls: 'other-note-dot calendar-dot' }); }
                if (settings.showModifiedFileDot && modifiedFiles.length > 0) { dotsContainer.createDiv({ cls: 'modified-file-dot calendar-dot' }); }

                if (settings.showAssetDot && assetsCreated.length > 0) { dotsContainer.createDiv({ cls: 'asset-dot calendar-dot' }); }
                if (settings.showTaskDot && totalTaskCount > 0) { dotsContainer.createDiv({ cls: 'task-dot calendar-dot' }); }


                if (eventIndicatorStyle === 'dot' && calendarEventCount > 0 || settings.showIcsDot && calendarEventCount > 0) {
                    dotsContainer.createDiv({ cls: 'calendar-dot ics-event-dot' });
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
                            touchTimer = setTimeout(() => {
                                longPressOccurred = true;
                                this.showFilePopup(cell, dataToShow, dayDate, true); // Pass 'true' for mobile
                                e.preventDefault(); // Prevents context menu and text selection
                            }, 500); // 500ms for a long-press
                        }
                    });

                    const cancelLongPress = () => clearTimeout(touchTimer);
                    cell.addEventListener('touchend', cancelLongPress);
                    cell.addEventListener('touchmove', cancelLongPress);

                } else {
                    // --- DESKTOP: Hover for popup ---
                    if (hasPopupContent) {
                        cell.addEventListener('mouseenter', () => {
                            if (this.isPopupLocked) return;
                            clearTimeout(this.hideTimeout);
                            this.hideFilePopup();
                            this.hoverTimeout = setTimeout(() => {
                                this.showFilePopup(cell, dataToShow, dayDate, false); // Pass 'false' for desktop
                            }, this.plugin.settings.otherNoteHoverDelay);
                        });

                        cell.addEventListener('mouseleave', () => {
                            clearTimeout(this.hoverTimeout);
                            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
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
                    const highlightColor = document.body.classList.contains('theme-dark')
                        ? this.plugin.settings.rowHighlightColorDark
                        : this.plugin.settings.rowHighlightColorLight;
                    const row = cell.parentElement;
                    const allRows = Array.from(row.parentElement.children);
                    const rowIndex = allRows.indexOf(row);
                    const colIndex = Array.from(row.children).indexOf(cell);
                    const table = cell.closest('table');
                    for (let j = 0; j <= colIndex; j++) {
                        const cellToHighlight = row.children[j];
                        if (cellToHighlight) cellToHighlight.style.backgroundColor = highlightColor;
                    }
                    for (let i = 0; i < rowIndex; i++) {
                        const priorRow = allRows[i];
                        const cellToHighlight = priorRow.children[colIndex];
                        if (cellToHighlight) cellToHighlight.style.backgroundColor = highlightColor;
                    }
                    if (table) {
                        const headerRow = table.querySelector('thead tr');
                        if (headerRow) {
                            const headerCell = headerRow.children[colIndex];
                            if (headerCell) headerCell.style.backgroundColor = highlightColor;
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
     * Extracts all task lines (e.g., "- [ ] ...") from a string of content.
     * @param {string} content - The markdown content to parse.
     * @returns {string[]} An array of strings, where each string is a task line.
     */
    extractTaskLines(content) {
        const taskLines = [];
        // This regex finds any line that looks like a Markdown task, completed or not.
        const taskRegex = /^\s*(?:-|\d+\.)\s*\[.\]\s*.*/;
        const lines = content.split('\n');
        for (const line of lines) {
            if (taskRegex.test(line)) {
                taskLines.push(line);
            }
        }
        return taskLines;
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

        const isMobile = document.body.classList.contains('is-mobile');
        const displayMode = isMobile ? this.plugin.settings.mobileTabDisplayMode : this.plugin.settings.tabDisplayMode;

        const icons = this.plugin.settings.tabIcons || DEFAULT_SETTINGS.tabIcons;
        const textLabels = {
            scratch: "ScratchPad",
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
            const iconEl = container.createDiv({ cls: 'tab-icon' });
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
    async buildTasksByDateMap() {
        this.tasksByDate.clear();
        this.fileToTaskDates.clear(); // Also clear the tracking map

        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (this.plugin.settings.taskIgnoreFolders.some(folder => file.path.startsWith(folder))) {
                continue;
            }

            const content = await this.app.vault.cachedRead(file);
            const tasks = parseTasksFromFile(file, content); // Use the new helper

            const dateKeysForFile = new Set();

            for (const task of tasks) {
                // We only care about incomplete tasks with due dates for the calendar grid
                if (task.status.toLowerCase() !== 'x' && task.dueDate) {
                    const dateKey = moment(task.dueDate).format("YYYY-MM-DD");
                    if (!this.tasksByDate.has(dateKey)) {
                        this.tasksByDate.set(dateKey, []);
                    }
                    this.tasksByDate.get(dateKey).push(task);
                    dateKeysForFile.add(dateKey);
                }
            }

            if (dateKeysForFile.size > 0) {
                this.fileToTaskDates.set(file.path, dateKeysForFile);
            }
        }
    }

    /**
     * Scans the vault for ALL tasks (complete and incomplete) and populates this.allTasks.
     * This serves as the single source of truth for the tasks dashboard.
     */
    async buildAllTasksList() {
        this.allTasks = []; // Reset the list
        const files = this.app.vault.getMarkdownFiles();
        const taskIgnoreFolders = this.plugin.settings.taskIgnoreFolders.map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');

        for (const file of files) {
            const filePathLower = file.path.toLowerCase();
            if (taskIgnoreFolders.some(folder => filePathLower.startsWith(folder))) {
                continue;
            }

            const content = await this.app.vault.cachedRead(file);
            const tasksFromFile = parseTasksFromFile(file, content); // Assumes you have this global helper
            this.allTasks.push(...tasksFromFile);
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
    const actionsContainer = this.scratchWrapperEl.createDiv({ cls: 'scratchpad-actions-container' });

    // Only show the Preview/Edit toggle button if enabled in settings.
    if (this.plugin.settings.scratchpad?.showPreviewToggle) {
        this.scratchpadViewToggleBtn = actionsContainer.createEl('button', { cls: 'scratchpad-action-btn' });
        this.scratchpadViewToggleBtn.addEventListener('click', () => this.toggleScratchpadView());
    }

    // Only show the Add Task button if enabled in settings.
    if (this.plugin.settings.scratchpad?.showAddTaskButton) {
        this.addTaskBtn = actionsContainer.createEl('button', { cls: 'scratchpad-action-btn' });
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
            this.addTaskBtn.style.display = 'none';
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
            this.addTaskBtn.style.display = 'block';
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
        this.scratchHighlighterEl = this.scratchWrapperEl.createDiv({ cls: 'scratch-base scratch-highlighter' });
        this.noteTextarea = this.scratchWrapperEl.createEl('textarea', { cls: 'scratch-base scratch-content' });

        if (this.app.isMobile) {
            this.noteTextarea.addEventListener('focus', () => {
                this.calendarWasCollapsedForEditing = true;
                this.toggleCalendar(true); // Collapse calendar
                this.noteTextarea.classList.add('is-editing-mobile');
            });

            this.noteTextarea.addEventListener('blur', (e) => {
                // If focus moves to the collapse button, don't auto-expand the calendar
                if (e.relatedTarget === this.collapseBtn) {
                    this.noteTextarea.classList.remove('is-editing-mobile');
                    return; 
                }

                // Otherwise, auto-expand if needed.
                if (this.calendarWasCollapsedForEditing) {
                    this.calendarWasCollapsedForEditing = false;
                    this.toggleCalendar(false); // Expand calendar
                }
                this.noteTextarea.classList.remove('is-editing-mobile');
            });
        }
        
        // Set the textarea value from the pre-processed body content
        this.noteTextarea.value = this.noteText;

        if (wasFocused) {
            this.noteTextarea.focus();
        }

        this.updateScratchpadHighlights();
        this.updateScratchpadSearchCount();

        // Save content on input.
        this.noteTextarea.addEventListener('input', async () => {
            this.noteText = this.noteTextarea.value; // Update the body content property
            await this.saveFixedNote(this.noteText); // Pass the body to the save function
            this.updateScratchpadSearchCount();
            this.updateScratchpadHighlights();
        });

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
        await this.buildTasksByDateMap();
        await this.buildAllTasksList();
        await this.refreshIcsEvents();
        await this.buildWeeklyNotesCache();
        await this.buildHeatmapFileCache();

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

        // CORRECTED: This interval is now safe
        this.registerInterval(setInterval(async () => {
            // Don't refresh if the user is actively typing in the scratchpad
            if (document.activeElement === this.noteTextarea) return;

            const latestFullContent = await this.loadNote();
            const currentFullContent = this.scratchpadFrontmatter + this.noteText;

            // Only refresh if the content has actually changed
            if (latestFullContent !== currentFullContent) {
                const { frontmatter, body } = this.getScratchpadParts(latestFullContent);
                this.scratchpadFrontmatter = frontmatter;
                this.noteText = body;

                // If in EDIT mode, safely update the textarea's value
                if (this.noteTextarea) {
                    this.noteTextarea.value = this.noteText;
                }

                // If in PREVIEW mode, trigger a re-render to show the new content
                if (this.isScratchpadPreview) {
                    this.renderScratchpadContent();
                }

                // Always update dependent UI elements
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
            this.app.workspace.on('pm-dashboard-refresh', this.rebuildDashboards, this)
        );

        // Listener for live dashboard updates
        this.registerEvent(this.app.workspace.on('pm-dashboard-refresh', () => {
            // Only refresh if the dashboard tab is currently active
            if (this.activeTab === 'dashboard') {
                this.populateDashboard();
            }
        }));

        this.registerEvent(
            this.app.metadataCache.on('changed', async (file) => {
                // First, check if the change affected tasks in the file.
                const tasksChanged = await this.updateTasksForFile(file);

                // --- START: NEW/CORRECTED LOGIC ---

                // Determine the type of update. If tasks changed, it's a 'tasks' update.
                // Otherwise, it's a general 'metadata' update (e.g., adding a #pin tag).
                const updateType = tasksChanged ? 'tasks' : 'metadata';

                // Call the main refresh UI handler, passing the file and the type of update.
                this.refreshUI({ file, updateType });

                // --- END: NEW/CORRECTED LOGIC ---

                // The specific logic for dashboard heatmaps can remain, as it's separate.
                if (this.activeTab === 'dashboard' && this.dashboardViewMode === 'creation') {
                    if (this.dashboardCreationDebounceTimer) {
                        clearTimeout(this.dashboardCreationDebounceTimer);
                    }
                    this.dashboardCreationDebounceTimer = setTimeout(() => {
                        const widgetGrid = this.dashboardContentEl.querySelector('.pm-dashboard-grid');
                        if (!widgetGrid) return;

                        const oldMatches = this.fileToHeatmapCache.get(file.path) || new Set();
                        const newMatches = new Set();
                        this.plugin.settings.customHeatmaps.forEach((config, index) => {
                            if (this.matchesHeatmapRule(file, config)) {
                                newMatches.add(index);
                            }
                        });

                        if (newMatches.size > 0) {
                            this.fileToHeatmapCache.set(file.path, newMatches);
                        } else {
                            this.fileToHeatmapCache.delete(file.path);
                        }

                        const allAffected = new Set([...oldMatches, ...newMatches]);
                        allAffected.forEach(index => {
                            const config = this.plugin.settings.customHeatmaps[index];
                            if (config) {
                                this.renderSingleHeatmap(widgetGrid, config, index);
                            }
                        });
                    }, 2500);
                }
            })
        );


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
            this.tasksContentEl.style.transform = `translateY(0px)`;
            this.taskRefreshIndicator.style.transform = `translateY(-50px) scale(0.7)`;
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
                setTimeout(() => {
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
    // In class PeriodMonthView
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

        // --- CORRECTED LOGIC ---
        // Re-load the note from the file and re-process it based on the new setting
        const fullContent = await this.loadNote();
        const { frontmatter, body } = this.getScratchpadParts(fullContent);
        this.scratchpadFrontmatter = frontmatter;
        this.noteText = body;
        
        // Now, trigger the main render function, which will use the updated content
        this.render();
    }


    async rebuildDashboards() {
        if (!this.dashboardContentEl) {
            return; // Safety check
        }

        if (this.dashboardViewMode === 'creation') {
            // Correct: For the creation dashboard, the populate function handles both
            // data gathering and rendering the UI.
            await this.populateCreationDashboard();
        } else { // This handles the 'tasks' dashboard
            // Correct: For the tasks dashboard, these are two separate steps.
            await this.populateTasksDashboard();
        }
    }

    /**
     * Performs a more targeted UI refresh based on which file was changed,
     * avoiding a full re-render when possible.
     * @param {TFile} file The file that was changed.
     */
    async refreshUI(options = {}) {
        const { updateType, file = null } = options;

        // Debounce calendar render as it's the most common update
        clearTimeout(this.calendarRefreshDebounceTimer);
        this.calendarRefreshDebounceTimer = setTimeout(() => {
            if (this.isVerticalView) {
                this.render();
            } else {
                this.renderCalendar();
            }
        }, 300);

        // If the active tab is the dashboard, handle it with specific logic.
        if (this.activeTab === 'dashboard') {
            // If the update was for TASKS, we ONLY refresh the dashboard
            // IF the user is currently looking at the TASKS view.
            if (updateType === 'tasks' && this.dashboardViewMode === 'tasks') {
                clearTimeout(this.dashboardRefreshDebounceTimer);
                this.dashboardRefreshDebounceTimer = setTimeout(() => {
                    this.populateDashboard();
                }, 300);
            }
            // If the update was for CREATION (e.g., a new file was made),
            // we ONLY refresh if the user is looking at the CREATION view.
            else if (updateType === 'creation' && this.dashboardViewMode === 'creation') {
                clearTimeout(this.dashboardRefreshDebounceTimer);
                this.dashboardRefreshDebounceTimer = setTimeout(() => {
                    this.populateDashboard();
                }, 300);
            }
            // For a general update (from settings, etc.), we refresh the visible dashboard.
            else if (updateType === 'general') {
                clearTimeout(this.dashboardRefreshDebounceTimer);
                this.dashboardRefreshDebounceTimer = setTimeout(() => {
                    this.populateDashboard();
                }, 300);
            }
            // IMPORTANT: If none of these conditions are met, we do nothing.
            // This is what stops the creation heatmap from refreshing on a task change.
            return; // Exit to prevent falling through to the general logic below.
        }
        switch (this.activeTab) {
            case 'scratch':
                if (file?.path === this.plugin.settings.fixedNoteFile) {
                    // Re-load the full content from the file
                    const fullContent = await this.loadNote();
                    
                    // Re-parse the content to separate frontmatter and body
                    const { frontmatter, body } = this.getScratchpadParts(fullContent);
                    
                    // Update the stored properties
                    this.scratchpadFrontmatter = frontmatter;
                    this.noteText = body;

                    // Only update the textarea if it exists and its content has actually changed
                    if (this.noteTextarea && this.noteTextarea.value !== this.noteText) {
                        // Preserve the user's cursor position during the update
                        const cursorPos = this.noteTextarea.selectionStart;
                        this.noteTextarea.value = this.noteText;
                        this.noteTextarea.selectionStart = this.noteTextarea.selectionEnd = cursorPos;
                    }
                }
                break;
            case 'notes':
                clearTimeout(this.notesRefreshDebounceTimer);
                this.notesRefreshDebounceTimer = setTimeout(() => this.populateNotes(), 250);
                break;
            case 'tasks':
                clearTimeout(this.taskRefreshDebounceTimer);
                this.taskRefreshDebounceTimer = setTimeout(() => this.populateTasks(), 250);
                break;
            case 'assets':
                this.isUnusedAssetCacheValid = false;
                this.populateAssets();
                break;
        }
    }


    async updateTasksForFile(file) {
        if (!file || !(file instanceof TFile) || !file.path.toLowerCase().endsWith('.md')) {
            return false;
        }

        // --- 1. CAPTURE INITIAL STATE ---
        const initialTasksInFile = this.allTasks.filter(task => task.file.path === file.path);
        const initialTaskCount = initialTasksInFile.length;
        // Create a "fingerprint" of the original tasks' content and status.
        const initialTaskFingerprint = JSON.stringify(initialTasksInFile.map(t => ({ text: t.text, status: t.status })));

        // --- 2. INCREMENTALLY UPDATE DATA MAPS ---
        this.allTasks = this.allTasks.filter(task => task.file.path !== file.path);
        const oldDateKeys = this.fileToTaskDates.get(file.path) || new Set();
        for (const dateKey of oldDateKeys) {
            const tasksOnDate = this.tasksByDate.get(dateKey);
            if (tasksOnDate) {
                const remainingTasks = tasksOnDate.filter(task => task.file.path !== file.path);
                if (remainingTasks.length > 0) {
                    this.tasksByDate.set(dateKey, remainingTasks);
                } else {
                    this.tasksByDate.delete(dateKey);
                }
            }
        }
        this.fileToTaskDates.delete(file.path);

        // --- 3. RE-PROCESS AND CAPTURE FINAL STATE ---
        if (this.plugin.settings.taskIgnoreFolders.some(folder => file.path.startsWith(folder))) {
            return initialTaskCount > 0; // A change occurred if tasks were removed.
        }

        const content = await this.app.vault.cachedRead(file);
        const newTasks = parseTasksFromFile(file, content);
        const finalTaskCount = newTasks.length;

        // Create a "fingerprint" of the new tasks' content and status.
        const finalTaskFingerprint = JSON.stringify(newTasks.map(t => ({ text: t.text, status: t.status })));

        if (finalTaskCount > 0) {
            this.allTasks.push(...newTasks);
            const newDateKeys = new Set();
            for (const task of newTasks) {
                if (task.status.toLowerCase() !== 'x' && task.dueDate) {
                    const dateKey = moment(task.dueDate).format("YYYY-MM-DD");
                    if (!this.tasksByDate.has(dateKey)) {
                        this.tasksByDate.set(dateKey, []);
                    }
                    this.tasksByDate.get(dateKey).push(task);
                    newDateKeys.add(dateKey);
                }
            }
            if (newDateKeys.size > 0) {
                this.fileToTaskDates.set(file.path, newDateKeys);
            }
        }

        // --- 4. RETURN TRUE IF *ANYTHING* MEANINGFUL CHANGED ---
        // A change is either a different number of tasks OR different content/status.
        return initialTaskCount !== finalTaskCount || initialTaskFingerprint !== finalTaskFingerprint;
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
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay

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
        const itemEl = container.createDiv({ cls: 'other-notes-popup-item' });

        if (this.isImageAsset(noteFile)) {
            const thumbnail = itemEl.createEl('img', { cls: 'popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(noteFile);
        } else {
            setIcon(itemEl, 'file-text'); // Fallback to a generic icon
        }

        const titlePathWrapper = itemEl.createDiv({ cls: 'note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: noteFile.basename, cls: 'note-title' });
        if (noteFile.parent && noteFile.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: noteFile.parent.path, cls: 'note-path' });
        }

        /*
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
            const leaves = this.app.workspace.getLeavesOfType("markdown");
            const existingLeaf = leaves.find(leaf => leaf.view.file?.path === noteFile.path);

            if (existingLeaf) {
                this.app.workspace.revealLeaf(existingLeaf);
                // Navigate to the line even if the leaf is already open
                existingLeaf.view.setEphemeralState({ line: targetLine });
            } else {
                const openInNewTab = e.shiftKey || this.plugin.settings.notesOpenAction === 'new-tab';
                const leaf = this.app.workspace.getLeaf(openInNewTab);
                await leaf.openFile(noteFile, { eState: { line: targetLine } });
            }
            
            this.hideFilePopup();
        });
        */
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
        this.popupEl = createDiv({ cls: 'other-notes-popup' });

        // --- 1. Header with Note Basename and Path ---
        const headerRow = this.popupEl.createDiv({ cls: 'popup-header' });
        headerRow.addEventListener('click', () => this.hideFilePopup());

        const titleContainer = headerRow.createDiv({ cls: 'popup-title-container' });
        titleContainer.createEl('div', { text: noteFile.basename, cls: 'popup-header-title' });

        const closeBtn = headerRow.createDiv({ cls: 'popup-close-btn' });
        setIcon(closeBtn, 'x');
        closeBtn.addEventListener('click', () => this.hideFilePopup());

        const contentWrapper = this.popupEl.createDiv({ cls: 'popup-content-wrapper' });
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
        contentWrapper.createEl('h6', { text: 'Details', cls: 'popup-section-header' });
        const infoContainer = contentWrapper.createDiv({ cls: 'other-notes-popup-item is-clickable' });
        infoContainer.addEventListener('click', (e) => {
            this.handleFileClick(noteFile, e); // Use the new handler
            this.hideFilePopup();
        });

        setIcon(infoContainer, 'info');
        const infoWrapper = infoContainer.createDiv({ cls: 'note-title-path-wrapper' });

        const size = this.formatFileSize ? this.formatFileSize(noteFile.stat.size) : 'N/A';
        const created = this.formatDateTime ? this.formatDateTime(new Date(noteFile.stat.ctime)) : 'N/A';
        const modified = this.formatDateTime ? this.formatDateTime(new Date(noteFile.stat.mtime)) : 'N/A';

        infoWrapper.createDiv({ text: `Created: ${created}`, cls: 'note-path' });
        infoWrapper.createDiv({ text: `Modified: ${modified}`, cls: 'note-path' });
        infoWrapper.createDiv({ text: `Size: ${size}`, cls: 'note-path' });
        infoWrapper.createDiv({ text: `Path: ${noteFile.path}`, cls: 'note-path' });

        let tagsText = 'No tags';
        if (cache && cache.tags && cache.tags.length > 0) {
            const tagStrings = cache.tags.map(t => t.tag);
            const uniqueTags = [...new Set(tagStrings)].sort();
            tagsText = uniqueTags.join(', ');
        }
        infoWrapper.createDiv({ text: `Tags: ${tagsText}`, cls: 'note-path' });

        // --- 3. CONDITIONAL SEPARATOR & ASSETS SECTION ---
        // Only add the separator and the assets section if there are assets to show.
        if (hasAdditionalContent) {
            contentWrapper.createDiv({ cls: 'popup-separator' });

            contentWrapper.createEl('h6', { text: 'Assets in Note', cls: 'popup-section-header' });
            linkedAssets.forEach(assetFile => {
                this._createAssetListItem(contentWrapper, assetFile);
            });
        }

        // --- 4. Footer with Actions ---
        const footer = this.popupEl.createDiv({ cls: 'popup-actions-footer' });
        footer.createDiv({ style: 'flex-grow: 1' });
        const deleteBtn = footer.createDiv({ cls: 'popup-action-icon-btn mod-danger' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete File');

        deleteBtn.addEventListener('click', () => {
            this.hideFilePopup();
            this.handleDeleteFile(noteFile);
        });

        // --- 5. Finalize and Display ---
        document.body.appendChild(this.popupEl);
        if (this.positionPopup) {
            this.positionPopup(targetEl);
        }

        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
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

        this.popupEl.style.top = `${finalTop}px`;
        this.popupEl.style.left = `${finalLeft}px`;
    }


    _createAssetListItem(container, assetFile) {
        const itemEl = container.createDiv({ cls: 'other-notes-popup-item is-clickable' });

        // Show a thumbnail preview if it's an image asset
        if (this.isImageAsset(assetFile)) {
            const thumbnail = itemEl.createEl('img', { cls: 'popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(assetFile);
        } else {
            setIcon(itemEl, 'file-text'); // Fallback icon for non-image files
        }

        // Display the asset's name and parent folder path
        const titlePathWrapper = itemEl.createDiv({ cls: 'note-title-path-wrapper' });
        titlePathWrapper.createDiv({ text: assetFile.basename, cls: 'note-title' });
        if (assetFile.parent && assetFile.parent.path !== '/') {
            titlePathWrapper.createDiv({ text: assetFile.parent.path, cls: 'note-path' });
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
        this.popupEl = createDiv({ cls: 'other-notes-popup' });

        // --- 1. Header ---
        const headerRow = this.popupEl.createDiv({ cls: 'popup-header' });
        const titleContainer = headerRow.createDiv({ cls: 'popup-title-container' });
        titleContainer.createEl('div', { text: assetFile.name, cls: 'popup-header-title' });
        const closeBtn = headerRow.createDiv({ cls: 'popup-close-btn' });
        setIcon(closeBtn, 'x');
        headerRow.addEventListener('click', () => this.hideFilePopup());

        const contentWrapper = this.popupEl.createDiv({ cls: 'popup-content-wrapper' });

        // --- 2. Asset Details & Preview ---
        contentWrapper.createEl('h6', { text: 'Details', cls: 'popup-section-header' });
        const infoContainer = contentWrapper.createDiv({ cls: 'other-notes-popup-item' });
        infoContainer.addEventListener('click', (e) => {
            this.handleFileClick(assetFile, e);
            this.hideFilePopup();
        });

        if (this.isImageAsset(assetFile)) {
            const thumbnail = infoContainer.createEl('img', { cls: 'popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(assetFile);
        } else {
            setIcon(infoContainer, 'file-question');
        }
        const infoWrapper = infoContainer.createDiv({ cls: 'note-title-path-wrapper' });
        infoWrapper.createDiv({ text: `Modified: ${this.formatDateTime(new Date(assetFile.stat.mtime))}`, cls: 'note-path' });
        infoWrapper.createDiv({ text: `Size: ${this.formatFileSize(assetFile.stat.size)}`, cls: 'note-path' });
        infoWrapper.createDiv({ text: `Path: ${assetFile.path}`, cls: 'note-path' });

        // --- 3. Backlinks Section ---
        if (backlinks.length > 0) {
            contentWrapper.createDiv({ cls: 'popup-separator' });
            contentWrapper.createEl('h6', { text: `Used in ${backlinks.length} note(s)`, cls: 'popup-section-header' });
            backlinks.forEach(noteFile => {
                this._createBacklinkItem(contentWrapper, noteFile, assetFile);
            });
        }

        // --- 4. Actions Section ---
        const footer = this.popupEl.createDiv({ cls: 'popup-actions-footer' });

        // NEW: Copy Link Button on the far left
        const copyBtn = footer.createDiv({ cls: 'popup-action-icon-btn' });
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
            const infoMessage = footer.createDiv({ cls: 'popup-info-message', style: 'flex-grow: 1; text-align: center;' });
            setIcon(infoMessage, 'info');
            infoMessage.createSpan({ text: 'Not used in any notes.' });
        } else {
            // This spacer pushes the delete button to the far right
            footer.createDiv({ style: 'flex-grow: 1;' });
        }

        // Delete icon button on the far right
        const deleteBtn = footer.createDiv({ cls: 'popup-action-icon-btn mod-danger' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete Asset');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideFilePopup();
            this.handleDeleteFile(assetFile);
        });

        // --- 5. Finalize and Display ---
        document.body.appendChild(this.popupEl);
        this.positionPopup(targetEl);
        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
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
            'Confirm Deletion',
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

            const cancelTimer = () => clearTimeout(touchTimer);
            element.addEventListener('touchend', cancelTimer);
            element.addEventListener('touchmove', cancelTimer);
        } else {
            // 2. Desktop: Check the user's setting.
            if (this.plugin.settings.listPopupTrigger === 'hover') {
                let hoverTimeout;
                element.addEventListener('mouseenter', () => {
                    if (this.isDraggingNote || this.isPopupLocked || this.isMouseDown) return;
                    clearTimeout(this.hideTimeout);
                    this.hideFilePopup();
                    hoverTimeout = window.setTimeout(showPopup, this.plugin.settings.otherNoteHoverDelay);
                });
                element.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimeout);
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
            if (this.isDraggingNote && e.target.closest('.drag-handle')) {
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
            filteredAssets = allAssets.filter(file => file.name.toLowerCase().includes(searchTerm));
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
            { key: 'thisWeek', label: 'This Week' },
            { key: 'lastWeek', label: 'Last Week' },
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
            this.assetsContentEl.createDiv({ text: message, cls: 'task-group-empty-message' });
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
        const groupContainer = this.assetsContentEl.createDiv({ cls: 'note-group-container' });
        
        // Your existing isCollapsed calculation here (from previous changes)
        const isMonthlyGroup = /^\d{4}-\d{2}$/.test(groupInfo.key);
        let isCollapsed;
        if (isMonthlyGroup) {
            isCollapsed = this.collapsedAssetGroups[groupInfo.key] !== false;
        } else {
            isCollapsed = this.collapsedAssetGroups[groupInfo.key] === true;
        }
        if (isCollapsed) groupContainer.addClass('is-collapsed');
        
        // Header creation and click handler (unchanged from previous)
        const header = groupContainer.createDiv({ cls: 'note-group-header' });
        const headerContent = header.createDiv({ cls: 'note-group-header-content' });
        const collapseIcon = headerContent.createDiv({ cls: 'note-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');
        headerContent.createSpan({ text: groupInfo.label });
        header.createDiv({ cls: 'note-group-count', text: assetsInGroup.length.toString() });

        header.addEventListener('click', () => {
            const isCurrentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
            this.collapsedAssetGroups[groupInfo.key] = isCurrentlyCollapsed;
            this.plugin.saveSettings();
            
            // NEW: Re-observe lazy-loaded images after expansion (fixes cutoff/blank images)
            if (!isCurrentlyCollapsed && this.isAssetsGridView) {
                setTimeout(() => {
                    const gridItems = groupContainer.querySelectorAll('.asset-grid-item img[data-src]');
                    gridItems.forEach(img => {
                        if (img.dataset.src) {  // Only observe unloaded images
                            this.assetObserver.observe(img.closest('.asset-grid-item'));
                        }
                    });
                }, 150);  // Slightly longer delay for smooth CSS transition
            }
        });

        const listWrapper = groupContainer.createDiv({ cls: 'note-list-wrapper' });
        
        if (this.isAssetsGridView) {
            listWrapper.addClass('assets-grid-view');
            assetsInGroup.forEach(file => {
                const item = listWrapper.createDiv({ cls: 'asset-grid-item' });
                this.applyPopupTrigger(item, file, 'asset');
                
                const preview = item.createDiv({ cls: 'asset-grid-preview' });
                if (this.isImageAsset(file)) {
                    const thumbnail = preview.createEl('img', { attr: { 'data-src': this.app.vault.getResourcePath(file) } });
                    thumbnail.alt = file.name;  // For accessibility
                    // Observer will load this on visibility
                } else {
                    setIcon(preview, 'file-question');
                }
                item.createDiv({ text: file.name, cls: 'asset-grid-name' });
                
                // NEW: Initially observe all new grid items for lazy loading
                this.assetObserver.observe(item);
            });
        } else {
            // Your list view code unchanged...
            // Paste your existing list view rendering here (e.g., listWrapper.removeClass('assets-grid-view'); assetsInGroup.forEach(file => { const row = ... }); )
            listWrapper.removeClass('assets-grid-view');
            assetsInGroup.forEach(file => {
                const row = listWrapper.createDiv({ cls: 'note-row' });
                this.applyPopupTrigger(row, file, 'asset');

                const isUnused = unusedAssetPaths.has(file.path);
                const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });
                const iconContainer = titleWrapper.createDiv({ cls: 'asset-icon-container' });

                if (this.isImageAsset(file)) {
                    const thumbnail = iconContainer.createEl('img', { cls: 'asset-thumbnail' });
                    thumbnail.src = this.app.vault.getResourcePath(file);
                } else {
                    setIcon(iconContainer, 'file-text');
                }

                iconContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleFileClick(file, e);
                });

                if (isUnused && settings.showUnusedAssetsIndicator) {
                    const actionIconContainer = titleWrapper.createDiv({ cls: 'asset-action-icon' });
                    setIcon(actionIconContainer, 'trash');
                    actionIconContainer.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleDeleteFile(file);
                    });
                }

                titleWrapper.createDiv({ text: file.name, cls: 'note-title' });

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
        const highlightColor = document.body.classList.contains('theme-dark')
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
                cls: isYear ? 'month-title-year' : 'month-title-month',
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
        this.verticalScrollerEl = container.createDiv("vertical-calendar-scroller");

        const initialMonthId = `month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
        const numMonthsAfter = 12;
        for (let i = -6; i <= numMonthsAfter; i++) {
            const monthDate = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() + i, 1);

            // FIX 2: Use the new class property here
            const monthWrapper = this.verticalScrollerEl.createDiv({ cls: "vertical-month-wrapper" });

            monthWrapper.id = `month-${monthDate.getFullYear()}-${monthDate.getMonth()}`;

            // Create the month title heading for the vertical list.
            const monthTitleEl = monthWrapper.createEl("h3", {
                cls: "vertical-month-title",
                // Set the initial text using the simple formatter.
                text: formatMonthTitle(monthDate, this.plugin.settings.monthTitleFormat)
            });
            monthTitleEl.style.cursor = "pointer";

            let hoverTimeout;

            monthTitleEl.addEventListener('mouseenter', () => {
                // After 400ms, use our new helper to build the perfectly consistent, styled title.
                hoverTimeout = setTimeout(() => {
                    this.populateStyledTitle(monthTitleEl, monthDate);
                }, 500);
            });

            monthTitleEl.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
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

            const table = monthWrapper.createEl("table", { cls: "period-calendar-table" });
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
                        headerRow.children[todayHeaderIndex].addClass("today-day-header");
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
            setTimeout(() => {
                this.isProgrammaticScroll = false;
            }, 300);
        });

        // Use a scroll listener to update the main header title.
        this.verticalScrollerEl.addEventListener('scroll', () => {
            // if programmatic scroll is in progress, do nothing
            if (this.isProgrammaticScroll) return;

            clearTimeout(this.titleUpdateTimeout);
            this.titleUpdateTimeout = setTimeout(() => {
                let topmostVisibleMonth = null;
                let smallestTopValue = Infinity;
                const scrollerTop = this.verticalScrollerEl.getBoundingClientRect().top;
                const monthElements = this.verticalScrollerEl.querySelectorAll('.vertical-month-wrapper');

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
        if (this.dailyRefreshTimeout) clearTimeout(this.dailyRefreshTimeout);
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
            cls: "pm-search-input" // Use a consistent class
        });

        // Attach the suggester, passing the onInput callback to be used upon selection.
        if (suggestionItems && suggestionItems.length > 0) {
            new FilterSuggest(this.app, inputEl, suggestionItems, onInput);
        }

        // Create the clear button inside this function
        const clearButton = container.createDiv({ cls: "search-input-clear-btn" });
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
                const firstItem = contentEl.querySelector('.note-row, .task-row');
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
            scratch: "ScratchPad",
            notes: "Recent Notes",
            pinned: "Pinned Notes",
            tasks: "Tasks",
            assets: "Assets",
            dashboard: 'Dashboard'
        };

        for (const key of tabOrder) {
            const tabEl = tabContainer.createDiv({ cls: "note-tab" });
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

                        await this.populateNotes();
                    } else if (key === 'dashboard') {

                        // Toggle between the two dashboard views
                        this.dashboardViewMode = this.dashboardViewMode === 'creation' ? 'tasks' : 'creation';
                        this.getTabLabel(tabEl, 'dashboard');

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
                setTimeout(() => tabEl.classList.add('dragging'), 0);
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
        headers.forEach(th => th.classList.remove('today-day-header'));

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
                targetTh.classList.add('today-day-header');
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
        const container = this.containerEl.createDiv("period-month-container");
        container.addClass(`layout-${this.plugin.settings.calendarLayout}`);
        container.addClass(`today-style-${this.plugin.settings.todayHighlightStyle}`);
        container.toggleClass("hide-grid", !this.plugin.settings.showCalendarGridLines);
        container.classList.toggle("calendar-collapsed", this.isCalendarCollapsed);
        container.toggleClass("vertical-view-active", this.isVerticalView);
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
        const headerDiv = container.createDiv("month-header");

        this.monthNameEl = headerDiv.createDiv({ cls: "month-header-title" });
        this.updateMonthTitle();
        this.monthNameEl.addEventListener('click', () => {
            // SET THE FLAG before switching views
            this.isProgrammaticScroll = true;

            this.isVerticalView = !this.isVerticalView;
            this.render();

            // CLEAR THE FLAG after render and initial scroll complete
            setTimeout(() => {
                this.isProgrammaticScroll = false;
            }, 800);  // Longer delay for initial view render on mobile
        });
        const navDiv = headerDiv.createDiv({ cls: "month-header-nav" });

        const backBtn = navDiv.createEl("button");
        backBtn.setAttribute("aria-label", "Previous month");
        setIcon(backBtn, "chevron-left");
        backBtn.addEventListener('click', () => {
            if (this.isVerticalView) {
                // SET FLAG
                this.isProgrammaticScroll = true;

                this.displayedMonth.setMonth(this.displayedMonth.getMonth() - 1, 1);

                const targetMonthId = `month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
                const targetEl = this.verticalScrollerEl?.querySelector(`#${targetMonthId}`);

                if (targetEl) {
                    targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    this.updateMonthTitle();
                    this.updateTodayBtnAriaLabel();

                    // CLEAR FLAG
                    setTimeout(() => {
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
        setIcon(todayBtn, 'calendar-clock');

        // Apply initial style and ARIA label on render
        if (this.isPopupLocked) {
            this.todayBtn.classList.add('popup-locked');
        }
        this.updateTodayBtnAriaLabel();

        todayBtn.addEventListener('click', () => {

            this.goToCurrentMonth();

        });

        // Ensure the button style is correct on re-render
        if (this.isPopupLocked) {
            this.todayBtn.classList.add('popup-locked');
        }

        const forwardBtn = navDiv.createEl("button");
        forwardBtn.setAttribute("aria-label", "Next month");
        setIcon(forwardBtn, "chevron-right");
        forwardBtn.addEventListener('click', () => {
            if (this.isVerticalView) {
                // SET FLAG
                this.isProgrammaticScroll = true;
                this.displayedMonth.setMonth(this.displayedMonth.getMonth() + 1, 1);

                const targetMonthId = `month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
                const targetEl = this.verticalScrollerEl?.querySelector(`#${targetMonthId}`);

                if (targetEl) {
                    targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    this.updateMonthTitle();
                    this.updateTodayBtnAriaLabel();

                    // CLEAR FLAG
                    setTimeout(() => {
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

        //setIcon(this.collapseBtn, this.isCalendarCollapsed ? "chevron-up" : "chevron-down");
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
            const tableWrapper = container.createDiv({ cls: "calendar-table-wrapper" });
            const table = tableWrapper.createEl("table", { cls: "period-calendar-table" });
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
            setTimeout(() => {
                this.addColumnHighlighting(this.calendarHeaderRowEl, this.calendarBodyEl);
            }, 0);
            // Add this line right here to set the highlight correctly on the first load
            this.updateDayHeaderHighlight();

            // --- Tabs and Content Panels ---
            const tabWrapper = container.createDiv("tabs-content-wrapper");
            const areTabsVisible = Object.values(this.plugin.settings.tabVisibility).some(visible => visible);
            if (!areTabsVisible) {
                tabWrapper.style.display = 'none';
            } else {
                container.addClass("tabs-are-visible");
            }

            const tabHeader = tabWrapper.createDiv("note-tab-header");
            const tabContainer = tabHeader.createDiv("tab-container");
            const searchWrapper = tabHeader.createDiv("search-wrapper");

            const scratchpadSearchContainer = searchWrapper.createDiv({ cls: "pm-search-container" });
            const notesSearchContainer = searchWrapper.createDiv({ cls: "pm-search-container" });
            const assetsSearchContainer = searchWrapper.createDiv({ cls: "pm-search-container" });
            const tasksSearchContainer = searchWrapper.createDiv({ cls: "pm-search-container" });
            const dashboardSearchContainer = searchWrapper.createDiv({ cls: "pm-search-container" }); // <<< ADD THIS LINE

            // -- CONTENT PANELS --
            this.scratchWrapperEl = tabWrapper.createDiv({ cls: "scratchpad-wrapper" });
            this.renderScratchpadContent();

            this.notesContentEl = tabWrapper.createDiv({ cls: "notes-container" });
            this.assetsContentEl = tabWrapper.createDiv({ cls: "notes-container" });
            this.tasksContentEl = tabWrapper.createDiv({ cls: "tasks-container" });
            this.dashboardContentEl = tabWrapper.createDiv({ cls: "pm-tab-content" });

            this.taskRefreshIndicator = tabWrapper.createDiv({ cls: 'pm-refresh-indicator' });
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
                'Search ScratchPad...',
                [], // <-- Ensure this empty array is here
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

            this.dashboardSearchInputEl = this.setupSearchInput( // <<< ADD THIS BLOCK
                dashboardSearchContainer,
                'Filter widgets...',
                [], // No suggestions needed for widget filtering
                (term) => {
                    this.dashboardSearchTerm = term;
                    this.populateDashboard(); // Re-render the dashboard with the filter applied
                }
            );

            this.updateScratchpadSearchCount();
            switchTabs(this.activeTab);
        }
        this.applyFontSettings();
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


    async populateDashboard() {
        if (!this.dashboardContentEl) return;
        this.dashboardContentEl.empty();

        if (this.dashboardViewMode === 'tasks') {
            await this.populateTasksDashboard();
        } else {
            await this.populateCreationDashboard();
        }
    }

    // Renders a single heatmap widget based on the provided configuration.
    async renderSingleHeatmap(widgetGrid, heatmapConfig, index) {
        // Find existing widget or create a new one
        let widgetContainer = widgetGrid.querySelector(`#heatmap-widget-${index}`);
        if (!widgetContainer) {
            widgetContainer = widgetGrid.createDiv({
                cls: 'pm-widget-container',
                attr: { id: `heatmap-widget-${index}` }
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
            // .every() stops on the first 'false', perfect for AND.
            finalMatch = filters.every(rule => this._evaluateSingleRule(file, rule, config.debug));
        } else { // 'OR'
            // .some() stops on the first 'true', perfect for OR.
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


    async populateCreationDashboard() {
        this.dashboardContentEl.empty();
        const widgetGrid = this.dashboardContentEl.createDiv({ cls: 'pm-dashboard-grid' });
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
                    await this.renderSingleHeatmap(widgetGrid, heatmapConfig, index);
                }
            } else {
                const widgetName = DASHBOARDWIDGETS.creation[widgetKey]?.name || '';
                if (searchTerm && !widgetName.toLowerCase().includes(searchTerm)) continue;

                const widgetContainer = widgetGrid.createDiv({ cls: 'pm-widget-container' });

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
                        await this.populateSingleHeatmapWidget(widgetContainer, 'All Files', allFilesMap, gradient, {}, 'allfilesheatmap');
                        break;
                    }
                    case 'dailynotesheatmap': {
                        const gradient = this.createColorGradient(this.plugin.settings.dailyNoteDotColor);
                        const futureEndDate = moment().add(6, 'months').endOf('month');
                        await this.populateSingleHeatmapWidget(widgetContainer, "Daily Notes", dailyNotesMap, gradient, { endDate: futureEndDate }, 'dailynotesheatmap');
                        break;
                    }
                    case 'regularnotesheatmap': {
                        const gradient = this.createColorGradient(this.plugin.settings.noteCreatedColor);
                        await this.populateSingleHeatmapWidget(widgetContainer, 'Regular Notes', regularNotesMap, gradient, {}, 'regularnotesheatmap');
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
        const allTasks = this.allTasks || [];
        const now = moment();
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'x').length;
        const cancelledTasks = allTasks.filter(t => t.status === '-').length;
        const inProgressTasks = allTasks.filter(t => t.status === '/').length;
        const openTasks = totalTasks - completedTasks - cancelledTasks - inProgressTasks;

        const overdueTasksCount = allTasks.filter(t =>
            t.status !== 'x' &&
            t.status !== '-' &&
            t.dueDate &&
            moment(t.dueDate).isBefore(now, 'day')
        ).length;

        return { completedTasks, openTasks, inProgressTasks, overdueTasksCount, cancelledTasks, totalTasks };
    }

    async getTaskSummaryMetrics() {
        const allTasks = this.allTasks;
        const now = moment();

        // --- Define Date Ranges ---
        const todayStart = now.clone().startOf('day');
        const todayEnd = now.clone().endOf('day');
        const tomorrowStart = now.clone().add(1, 'day').startOf('day');
        const tomorrowEnd = now.clone().add(1, 'day').endOf('day');
        const next7DaysStart = now.clone().add(2, 'day').startOf('day');
        const next7DaysEnd = now.clone().add(8, 'day').endOf('day'); // Today + 1 + 7 = 8 days from now

        // --- Initialize Metrics Buckets ---
        const metrics = {
            today: { incomplete: [], completed: [], overdue: [], inProgress: [] },
            tomorrow: { incomplete: [], completed: [], inProgress: [] },
            next7days: { incomplete: [], completed: [], inProgress: [] },
            future: { incomplete: [], inProgress: [] },
            noDue: { incomplete: [], inProgress: [] },
        };

        for (const task of allTasks) {
            const isCompleted = task.status.toLowerCase() === 'x';
            const isInProgress = task.status === '/';
            const dueDate = task.dueDate ? moment(task.dueDate) : null;
            const completionDate = task.completionDate ? moment(task.completionDate) : null;

            if (isCompleted) {
                // Logic for completed tasks
                if (completionDate) {
                    if (completionDate.isBetween(todayStart, todayEnd, null, '[]')) {
                        metrics.today.completed.push(task);
                    } else if (completionDate.isBetween(tomorrowStart, tomorrowEnd, null, '[]')) {
                        metrics.tomorrow.completed.push(task);
                    } else if (completionDate.isBetween(next7DaysStart, next7DaysEnd, null, '[]')) {
                        metrics.next7days.completed.push(task);
                    }
                }
            } else {
                // Logic for incomplete tasks
                if (!dueDate) {
                    if (isInProgress) metrics.noDue.inProgress.push(task);
                    else metrics.noDue.incomplete.push(task);
                } else if (dueDate.isBefore(startOfToday, 'day')) {
                    metrics.today.overdue.push(task);
                } else if (dueDate.isBetween(startOfToday, endOfToday, null, '[]')) {
                    if (isInProgress) metrics.today.inProgress.push(task);
                    else metrics.today.incomplete.push(task);
                } else if (dueDate.isBetween(startOfTomorrow, endOfTomorrow, null, '[]')) {
                    if (isInProgress) metrics.tomorrow.inProgress.push(task);
                    else metrics.tomorrow.incomplete.push(task);
                } else if (dueDate.isBetween(startOfNext7Days, endOfNext7Days, null, '[]')) {
                    if (isInProgress) metrics.next7days.inProgress.push(task);
                    else metrics.next7days.incomplete.push(task);
                } else if (dueDate.isAfter(endOfNext7Days, 'day')) {
                    if (isInProgress) metrics.future.inProgress.push(task);
                    else metrics.future.incomplete.push(task);
                }
            }
        }
        return metrics;
    }


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

    _getFinalWidgetOrder(dashboardType) {
        const visibilityKey = `${dashboardType}DashboardWidgets`;
        const orderKey = `${dashboardType}DashboardOrder`;
        const defaultWidgets = DASHBOARDWIDGETS[dashboardType];

        // FIX: Default to an empty object/array if settings are not yet defined.
        const savedVisibility = this.plugin.settings[visibilityKey] || {};
        const savedOrder = this.plugin.settings[orderKey] || [];

        let allWidgetKeys = Object.keys(defaultWidgets);
        if (dashboardType === 'creation') {
            this.plugin.settings.customHeatmaps?.forEach((_, index) => {
                allWidgetKeys.push(`custom-${index}`);
            });
        }

        // This is now safe as savedOrder is always an array.
        const finalOrder = [...savedOrder];
        allWidgetKeys.forEach(key => {
            if (!finalOrder.includes(key)) {
                finalOrder.push(key);
            }
        });

        // This filter is now safe as savedVisibility is always an object.
        return finalOrder.filter(key => {
            const exists = allWidgetKeys.includes(key);
            const isVisible = savedVisibility[key] !== false; // New widgets will default to visible.
            return exists && isVisible;
        });
    }

    async getTaskMetrics() {
        const allTasks = this.allTasks || [];
        const now = moment();
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'x').length;
        const cancelledTasks = allTasks.filter(t => t.status === '-').length;
        const inProgressTasks = allTasks.filter(t => t.status === '/').length;
        const openTasks = totalTasks - completedTasks - cancelledTasks - inProgressTasks;

        const overdueTasksCount = allTasks.filter(t =>
            t.status !== 'x' &&
            t.status !== '-' &&
            t.dueDate &&
            moment(t.dueDate).isBefore(now, 'day')
        ).length;

        return { completedTasks, openTasks, inProgressTasks, overdueTasksCount, cancelledTasks, totalTasks };
    }

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

    renderEmptyHeatmapWidget(parent, title, message = 'No files found matching the filter criteria.') {
        const widgetContainer = parent.createDiv({ cls: 'pm-widget-container pm-empty-widget' });

        const header = widgetContainer.createDiv({ cls: 'pm-widget-header' });
        header.createEl('h3', { text: title });

        widgetContainer.createDiv({
            text: message,
            cls: 'pm-empty-widget-message'
        });
    }

    async populateTasksDashboard() {
        this.dashboardContentEl.empty();
        const widgetGrid = this.dashboardContentEl.createDiv({ cls: 'pm-dashboard-grid' });
        const searchTerm = this.dashboardSearchTerm.toLowerCase();
        const finalOrder = this.getFinalWidgetOrder('tasks');

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

        // This loop correctly prioritizes the due date.
        for (const task of this.allTasks) {
            const isCompleted = task.status.toLowerCase() === 'x';
            const isInProgress = task.status === '/';
            const dueDate = task.dueDate ? moment(task.dueDate) : null;
            const completionDate = task.completionDate ? moment(task.completionDate) : null;

            if (isCompleted) {
                if (this.plugin.settings.showCompletedTasksToday && completionDate && completionDate.isBetween(startOfToday, endOfToday, null, '[]')) {
                    metrics.today.completed.push(task);
                }
            } else if (dueDate) { // ---> PRIORITY 1: A due date exists.
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
            } else { // ---> PRIORITY 2: No due date exists.
                (isInProgress ? metrics.noDue.inProgress : metrics.noDue.incomplete).push(task);
            }
        }

        // This switch block correctly calls the new rendering function.
        for (const widgetKey of finalOrder) {
            if (!this.plugin.settings.tasksDashboardWidgets[widgetKey]) {
                continue;
            }
            const widgetName = DASHBOARDWIDGETS.tasks[widgetKey]?.name || '';
            if (searchTerm && !widgetName.toLowerCase().includes(searchTerm)) {
                continue;
            }

            switch (widgetKey) {
                case 'today':
                    this.renderTaskSummaryWidget(widgetGrid, 'Today', metrics.today.incomplete, metrics.today.completed, metrics.today.overdue, metrics.today.inProgress, [], 'today');
                    break;
                case 'tomorrow':
                    this.renderTaskSummaryWidget(widgetGrid, 'Tomorrow', metrics.tomorrow.incomplete, [], [], metrics.tomorrow.inProgress, [], 'tomorrow');
                    break;
                case 'next7days':
                    this.renderTaskSummaryWidget(widgetGrid, 'Next 7 Days', metrics.next7days.incomplete, [], [], metrics.next7days.inProgress, [], 'next7days');
                    break;
                case 'futureNoDue': {
                    const combinedIncomplete = metrics.future.incomplete || [];
                    const combinedInProgress = [...(metrics.future.inProgress || []), ...(metrics.noDue.inProgress || [])];
                    this.renderTaskSummaryWidget(widgetGrid, 'Future / No Due', combinedIncomplete, [], [], combinedInProgress, metrics.noDue.incomplete, 'futureNoDue');
                    break;
                }
                case 'upcomingoverdue':
                    const { upcomingMap, overdueMap } = await this.getTaskMaps();
                    const totalDataMap = new Map(upcomingMap);
                    overdueMap.forEach((tasks, date) => {
                        const existingTasks = totalDataMap.get(date) || [];
                        totalDataMap.set(date, existingTasks.concat(tasks));
                    });
                    const upcomingGradient = this.createColorGradient(this.plugin.settings.taskStatusColorOpen);
                    const overdueBaseColor = this.getComputedCssVar('--task-color-overdue');
                    const overdueGradient = this.createColorGradient(overdueBaseColor);
                    const futureEndDate = moment().add(12, 'months').endOf('month');
                    await this.populateSingleHeatmapWidget(
                        widgetGrid.createDiv({ cls: 'pm-widget-container' }),
                        'Upcoming & Overdue Tasks',
                        totalDataMap,
                        upcomingGradient,
                        {
                            endDate: futureEndDate,
                            upcomingMap: upcomingMap,
                            overdueMap: overdueMap,
                            overdueGradient: overdueGradient
                        },
                        'upcomingoverdue'
                    );
                    break;
                case 'taskcompletionheatmap': {
                    const widgetContainer = widgetGrid.createDiv({ cls: 'pm-widget-container' });
                    const completionMap = new Map();
                    this.allTasks.forEach(task => {
                        if (task.status === 'x' && task.completionDate) {
                            const dateKey = moment(task.completionDate).format('YYYY-MM-DD');
                            if (!completionMap.has(dateKey)) completionMap.set(dateKey, []);
                            completionMap.get(dateKey).push(task);
                        }
                    });
                    const gradient = this.createColorGradient(this.plugin.settings.taskStatusColorCompleted);
                    await this.populateSingleHeatmapWidget(widgetContainer, "Task Completion Activity", completionMap, gradient, {}, 'taskcompletionheatmap');
                    break;
                }
                case 'taskstatusoverview':
                    const { completedTasks, openTasks, inProgressTasks, overdueTasksCount, cancelledTasks, totalTasks } = await this.getTaskMetrics();
                    this.renderTaskStatusWidget(widgetGrid, completedTasks, openTasks, inProgressTasks, overdueTasksCount, cancelledTasks, totalTasks, 'taskstatusoverview');
                    break;
            }
        }
    }



    getFinalWidgetOrder(dashboardType) {
        const visibilityKey = `${dashboardType}DashboardWidgets`;
        const orderKey = `${dashboardType}DashboardOrder`;
        const defaultWidgets = DASHBOARDWIDGETS[dashboardType];

        // Safely get settings, defaulting to empty objects/arrays if they don't exist
        const savedVisibility = this.plugin.settings[visibilityKey] || {};
        const savedOrder = this.plugin.settings[orderKey] || [];

        // Get all possible widget keys
        let allWidgetKeys = Object.keys(defaultWidgets);
        if (dashboardType === 'creation') {
            // Also include custom heatmaps for the creation dashboard
            (this.plugin.settings.customHeatmaps || []).forEach((_, index) => {
                allWidgetKeys.push(`custom-${index}`);
            });
        }

        // Merge saved order with all possible keys to ensure new widgets are included
        const finalOrder = [...new Set([...savedOrder, ...allWidgetKeys])];

        // Filter the final list based on visibility settings
        return finalOrder.filter(key => {
            const exists = allWidgetKeys.includes(key);
            // If a widget's visibility is not explicitly set, default to visible (true)
            const isVisible = savedVisibility[key] !== false;
            return exists && isVisible;
        });
    }

    renderTaskStatusWidget(parentContainer, completedTasks, openTasks, inProgressTasks, overdueTasks, cancelledTasks, totalTasks, widgetKey) {
        const statsContainer = parentContainer.createDiv({ cls: 'pm-widget-container' });

        // --- 1. State Management ---
        const isCollapsed = this.plugin.settings.collapsedWidgets[widgetKey] === true;
        if (isCollapsed) {
            statsContainer.addClass('is-collapsed');
        }

        // --- 2. Create UI Elements ---
        const header = statsContainer.createDiv({ cls: 'pm-widget-header' });
        const toggleIcon = header.createDiv({ cls: 'widget-toggle-icon' });
        header.createEl('h3', { text: 'Task Status Overview' });

        // This wrapper will be hidden when collapsed
        const barChartsWrapper = statsContainer.createDiv({ cls: 'widget-content-wrapper' });

        // --- 3. Click Handler to Toggle State ---
        header.addEventListener('click', async () => {
            const currentlyCollapsed = statsContainer.classList.toggle('is-collapsed');
            this.plugin.settings.collapsedWidgets[widgetKey] = currentlyCollapsed;
            await this.plugin.saveSettings();
        });

        // --- 4. Bar Chart Rendering Logic ---
        const renderBars = () => {
            barChartsWrapper.empty();
            this.renderTaskBarChart(barChartsWrapper, 'Cancelled', cancelledTasks, totalTasks, this.plugin.settings.taskStatusColorCancelled);
            this.renderTaskBarChart(barChartsWrapper, 'Overdue', overdueTasks, totalTasks, this.plugin.settings.taskStatusColorOverdue);
            this.renderTaskBarChart(barChartsWrapper, 'In Progress', inProgressTasks, totalTasks, this.plugin.settings.taskStatusColorInProgress);
            this.renderTaskBarChart(barChartsWrapper, 'Open', openTasks, totalTasks, this.plugin.settings.taskStatusColorOpen);
            this.renderTaskBarChart(barChartsWrapper, 'Completed', completedTasks, totalTasks, this.plugin.settings.taskStatusColorCompleted);
        };

        renderBars();

        // --- 5. Set Initial Icon ---
        setIcon(toggleIcon, 'chevron-down');
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
        const widgetEl = parentContainer.createDiv({ cls: 'pm-bar-chart-widget' });

        // Determine what value to display based on the current mode
        const displayValue = this.taskBarChartMode === 'percent'
            ? `${percentage}%`
            : `${value}`;

        // Create the DOM elements
        widgetEl.createEl('div', { text: label, cls: 'pm-bar-label' });
        widgetEl.createEl('div', { text: displayValue, cls: 'pm-bar-display-value' });

        const barTrack = widgetEl.createDiv({ cls: 'pm-bar-track' });
        const barFill = barTrack.createDiv({ cls: 'pm-bar-fill' });

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

    /**
     * Shows a popup listing all notes, tasks, and assets associated with a specific day.
     * @param {HTMLElement} targetEl The calendar day element to position the popup near.
     * @param {object} dataByType An object containing arrays of items to display, keyed by type.
     * @param {Date} date The date for which the popup is being shown.
     */
    showFilePopup(targetEl, dataByType, dateOrTitle, isMobile = false) {
    
        this.hideFilePopup();
        this.popupEl = createDiv({ cls: 'other-notes-popup' });
        const { settings } = this.plugin;

        if (isMobile) {
            this.popupEl.addClass('is-mobile-popup');
        }

        // Add header with a close button and dynamic date/title
        const headerRow = this.popupEl.createDiv({ cls: 'popup-header' });

        // This logic now correctly uses the 'dateOrTitle' parameter to handle
        // both Date objects (from heatmaps) and title strings (from summary widgets).
        let headerText;
        if (typeof dateOrTitle === 'string') {
            headerText = dateOrTitle;
        } else {
            headerText = moment(dateOrTitle).format("dddd, D MMMM YYYY");
        }
        headerRow.createDiv({ cls: 'popup-header-title', text: headerText });

        const closeBtn = headerRow.createDiv({ cls: 'popup-close-btn' });
        setIcon(closeBtn, 'x');
        headerRow.addEventListener('click', () => this.hideFilePopup());

        // Create a scrollable wrapper for the content
        const contentWrapper = this.popupEl.createDiv({ cls: 'popup-content-wrapper' });

        // logic for ICS events
        if (dataByType.ics && dataByType.ics.length > 0) {
            contentWrapper.createEl('h6', { text: "Calendar Events", cls: "popup-section-header" });
            dataByType.ics.forEach(event => {
                const itemEl = contentWrapper.createDiv({ cls: "other-notes-popup-item is-calendar-event" });
                const iconEl = itemEl.createDiv({ cls: 'note-icon' });
                setIcon(iconEl, 'calendar');
                const titleWrapper = itemEl.createDiv({ cls: 'note-title-wrapper' });
                titleWrapper.createDiv({ cls: 'note-title' }).setText(event.summary);
                if (!event.isAllDay && event.startTime && event.endTime) {
                    const timeString = `${event.startTime} - ${event.endTime}`;
                    titleWrapper.createDiv({ text: timeString, cls: 'note-path' });
                }
            });
            const hasOtherContent = (dataByType.tasks && dataByType.tasks.length > 0) || (dataByType.daily && dataByType.daily.length > 0);
            if (hasOtherContent) {
                contentWrapper.createDiv({ cls: "popup-separator" });
            }
        }

        const addFileToList = (container, file, type) => {
            const itemEl = container.createDiv({ cls: 'other-notes-popup-item' });
            const settings = this.plugin.settings;
            const dot = itemEl.createDiv({ cls: 'popup-file-dot' });
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
                const thumbnail = itemEl.createEl('img', { cls: 'popup-asset-thumbnail' });
                thumbnail.src = this.app.vault.getResourcePath(file);
            }
            const titlePathWrapper = itemEl.createDiv({ cls: 'note-title-path-wrapper' });
            const displayName = file.path.toLowerCase().endsWith('.md') ? file.basename : file.name;
            titlePathWrapper.createDiv({ text: displayName, cls: 'note-title' });
            if (file.parent && file.parent.path !== '/') {
                titlePathWrapper.createDiv({ text: file.parent.path, cls: 'note-path' });
            }
            
            itemEl.addEventListener('click', (e) => {
                e.stopPropagation(); 
                e.stopImmediatePropagation();
                this.handleFileClick(file, e, {});
                this.hideFilePopup();
            });
        };

        const addTaskToList = (container, task, view) => {
            const itemEl = container.createDiv({ cls: 'other-notes-popup-item' });
            itemEl.dataset.taskStatus = task.status;

            const checkbox = itemEl.createDiv({ cls: 'task-checkbox-symbol' });
            view._renderTaskSymbol(checkbox, task);
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                checkbox.disabled = true;
                await view.toggleTaskCompletion(task);
            });

            const textSpan = itemEl.createSpan({ cls: 'task-text' });

            // Add completed class if task is completed
            const isCompleted = task.status.toLowerCase() === 'x';
            if (isCompleted) {
                textSpan.classList.add('completed');
            }

            // Render text using MarkdownRenderer
            MarkdownRenderer.render(this.app, task.text, textSpan, task.file.path, this);

             itemEl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();

                view.handleFileClick(task.file, e, { line: task.lineNumber });
                view.hideFilePopup();
            });
        };



        // logic for populating the content
        const allFiles = [...(dataByType.daily || []), ...(dataByType.created || []), ...(dataByType.modified || []), ...(dataByType.assets || [])];
        const hasTasks = dataByType.tasks && dataByType.tasks.length > 0;
        const hasFiles = allFiles.length > 0;

        if (hasTasks) {
            contentWrapper.createEl('h6', { text: 'Tasks', cls: 'popup-section-header' });

            // Sorts the tasks array in place by date, in ascending order.
            dataByType.tasks.sort((a, b) => {
                // Get the due date for task A, or fall back to its file's creation time.
                // Use 0 as a final fallback to prevent errors with items that have no date info.
                const dateA = a.dueDate ? a.dueDate.getTime() : (a.file ? a.file.stat.ctime : 0);

                // Get the due date for task B, with the same fallback logic.
                const dateB = b.dueDate ? b.dueDate.getTime() : (b.file ? b.file.stat.ctime : 0);

                // Subtracting the dates sorts them in ascending (oldest to newest) order.
                return dateA - dateB;
            });

            dataByType.tasks.forEach(task => addTaskToList(contentWrapper, task, this));
        }
        if (hasTasks && hasFiles) {
            contentWrapper.createDiv({ cls: 'popup-separator' });
        }
        if (hasFiles) {
            contentWrapper.createEl('h6', { text: 'Notes & Assets', cls: 'popup-section-header' });

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
        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });

        document.body.appendChild(this.popupEl);

        this.popupEl.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (isMobile) {
            const margin = 8;
            this.popupEl.style.position = 'fixed';
            this.popupEl.style.bottom = `${margin}px`;
            this.popupEl.style.left = `${margin}px`;
            this.popupEl.style.width = `calc(100% - ${margin * 2}px)`;
            this.popupEl.style.maxHeight = '45vh';
            this.popupEl.style.boxSizing = 'border-box';
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
        clearTimeout(this.hoverTimeout);
        clearTimeout(this.hideTimeout);
        if (this.popupEl) {
            this.popupEl.remove();
            this.popupEl = null;
            this.taskRefreshDebounceTimer = null;
            this.dashboardRefreshDebounceTimer = null;
            this.taskCache = new Map();
        }
    }

    updateMonthTitle() {
        this.populateStyledTitle(this.monthNameEl, this.displayedMonth);
    }

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

    updateTodayBtnAriaLabel() {
        const now = new Date();
        const isCurrentMonth = moment(this.displayedMonth).isSame(now, 'month');
        let label;

        if (isCurrentMonth) {
            label = this.isPopupLocked ? 'Popups Disabled. Click to re-enable.' : 'Popups Enabled. Click to disable.';
        } else {
            label = 'Go to Current Month';
        }
        this.todayBtn.setAttribute('aria-label', label);
    }

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
     * @param {HTMLElement} row The row element (e.g., a `.note-row` or `.task-row`).
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

            const container = row.closest('.notes-container, .tasks-container');
            if (!container) return;

            const items = Array.from(container.querySelectorAll('.note-row, .task-row'));
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
            filteredNotes = notesToShow.filter(file => file.basename.toLowerCase().includes(searchTerm));
        } else {
            filteredNotes = notesToShow;
        }

        // --- 3. RENDER THE VIEW ---
        if (this.notesViewMode === 'pinned') {
            const groupContainer = this.notesContentEl.createDiv({ cls: 'note-group-container' });
            // Apply the reorder mode class if it's active
            if (this.isReorderModeActive) {
                groupContainer.addClass('reorder-mode-active');
            }

            const header = groupContainer.createDiv({ cls: 'note-group-header' });
            const headerContent = header.createDiv({ cls: 'note-group-header-content', attr: { 'aria-live': 'polite' } });
            setIcon(headerContent, settings.tabIcons.pinned || 'pin');
            headerContent.createSpan({ text: 'Pinned Notes' });

            const sortIndicator = headerContent.createSpan({ cls: 'pinned-sort-indicator' });
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
                        //new Notice(`Reorder mode ${this.isReorderModeActive ? 'enabled' : 'disabled'}.`);
                        this.populateNotes(); // Re-render to show/hide handles
                    }, 700);
                });
                const cancelTimer = () => clearTimeout(touchTimer);
                headerContent.addEventListener('touchend', cancelTimer);
                headerContent.addEventListener('touchmove', cancelTimer);
            }

            header.createDiv({ cls: 'note-group-count', text: filteredNotes.length.toString() });

            const listWrapper = groupContainer.createDiv({ cls: 'note-list-wrapper' });

            if (filteredNotes.length === 0) {
                const emptyMessageEl = listWrapper.createDiv({ cls: 'pinned-notes-empty-message' });
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
                { key: 'thisWeek', label: 'This Week' },
                { key: 'lastWeek', label: 'Last Week' },
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
                    const groupContainer = this.notesContentEl.createDiv({ cls: 'note-group-container' });

                    // Apply the default collapsed state for monthly groups
                    const isMonthlyGroup = /^\d{4}-\d{2}$/.test(groupInfo.key);
                    let isCollapsed;

                    if (isMonthlyGroup) {
                        isCollapsed = this.collapsedNoteGroups[groupInfo.key] !== false;
                    } else {
                        isCollapsed = this.collapsedNoteGroups[groupInfo.key] === true;
                    }

                    if (isCollapsed) {
                        groupContainer.addClass('is-collapsed');
                    }

                    const header = groupContainer.createDiv({ cls: 'note-group-header' });
                    const headerContent = header.createDiv({ cls: 'note-group-header-content' });
                    const collapseIcon = headerContent.createDiv({ cls: 'note-group-collapse-icon' });
                    setIcon(collapseIcon, 'chevron-down');
                    headerContent.createSpan({ text: groupInfo.label });
                    header.createDiv({ cls: 'note-group-count', text: notesInGroup.length.toString() });

                    header.addEventListener('click', () => {
                        const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
                        this.collapsedNoteGroups[groupInfo.key] = currentlyCollapsed;
                        this.plugin.saveSettings();
                    });

                    const listWrapper = groupContainer.createDiv({ cls: 'note-list-wrapper' });
                    notesInGroup.forEach(file => this.renderNoteItem(file, listWrapper));
                }
            });
        }
    }

    /**
     * Scans the vault for tasks, filters and sorts them, and populates the "Tasks" tab.
     */
    async populateTasks() {
        if (!this.tasksContentEl) return;

        const settings = this.plugin.settings;
        this.tasksContentEl.toggleClass('show-full-text', !settings.taskTextTruncate);

        if (this.taskCache) { this.taskCache.clear(); } else { this.taskCache = new Map(); }

        const taskIgnoreFolders = (settings.taskIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const files = this.app.vault.getMarkdownFiles().filter(file => {
            const filePathLower = file.path.toLowerCase();
            return !taskIgnoreFolders.some(folder => folder && filePathLower.startsWith(folder));
        });

        let allTasks = [];
        const taskRegex = /^\s*(?:-|\d+\.)\s*\[(.)\]\s*(.*)/;
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
        const completionDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
        const tagRegex = /#([a-zA-Z0-9_\-\/]+)/g;

        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            const lines = content.split('\n');

            this.taskCache.set(file.path, this.extractTaskLines(content));

            lines.forEach((line, index) => {
                const match = line.match(taskRegex);
                if (match) {
                    const status = match[1];
                    const text = match[2];
                    const isCompleted = status.toLowerCase() === 'x';
                    const completionDateMatch = text.match(completionDateRegex);
                    const completionDate = completionDateMatch ? moment(completionDateMatch[1], "YYYY-MM-DD").toDate() : null;

                    if (isCompleted && !(settings.showCompletedTasksToday && completionDate && isSameDay(completionDate, new Date()))) {
                        return;
                    }

                    const dueDateMatch = text.match(dueDateRegex);
                    const dueDate = dueDateMatch ? moment(dueDateMatch[1], "YYYY-MM-DD").toDate() : null;
                    const tags = Array.from(text.matchAll(tagRegex)).map(m => m[1]);
                    let displayText = text.trim();
                    if (!isCompleted) {
                        displayText = displayText.replace(completionDateRegex, '').trim();
                    }
                    allTasks.push({ text: displayText, file, lineNumber: index, dueDate, tags, status, completionDate });
                }
            });
        }

        const searchTerm = this.tasksSearchTerm.toLowerCase();
        let filteredTasks;

        if (searchTerm.startsWith('#')) {
            const tagToFilter = searchTerm.substring(1);
            filteredTasks = allTasks.filter(task =>
                task.tags.some(tag => tag.toLowerCase() === tagToFilter)
            );
        } else if (searchTerm) {
            filteredTasks = allTasks.filter(task =>
                task.text.toLowerCase().includes(searchTerm)
            );
        } else {
            filteredTasks = allTasks;
        }


        filteredTasks.sort((a, b) => {
            if (settings.taskSortOrder === 'a-z') return a.text.localeCompare(b.text);
            if (settings.taskSortOrder === 'z-a') return b.text.localeCompare(a.text);
            if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
            return a.dueDate ? -1 : (b.dueDate ? 1 : a.text.localeCompare(b.text));
        });

        // 2. MAP EXISTING DOM GROUPS
        const existingGroups = new Map();
        this.tasksContentEl.querySelectorAll('.task-group-container').forEach(groupEl => {
            if (groupEl.dataset.groupKey) {
                existingGroups.set(groupEl.dataset.groupKey, groupEl);
            }
        });

        // 3. GET NEW GROUP DATA
        const newGroupData = settings.taskGroupBy === 'tag'
            ? this.groupTasksByTag(filteredTasks)
            : this.groupTasksByDate(filteredTasks);

        const groupOrder = Object.keys(newGroupData);

        // 4. RECONCILE GROUPS
        let lastElement = null;
        groupOrder.forEach(groupKey => {
            const groupData = newGroupData[groupKey];
            let groupEl = existingGroups.get(groupKey);

            if (groupEl) {
                const headerContent = groupEl.querySelector('.task-group-header-content span:last-child');
                if (headerContent) headerContent.textContent = `${groupData.title} (${groupData.tasks.length})`;

                this.reconcileTaskList(groupEl.querySelector('.task-list-wrapper'), groupData.tasks);
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

        // 5. REMOVE OLD GROUPS
        existingGroups.forEach(groupEl => groupEl.remove());

        if (this.tasksContentEl.children.length === 0) {
            // Clear any old message and add a new one
            this.tasksContentEl.empty();
            const message = searchTerm ? 'No tasks match your search term.' : 'No tasks found';
            this.tasksContentEl.createDiv({ text: message, cls: 'task-group-empty-message' });
        } else {
            // Remove any "no tasks" message if it exists
            const emptyMessage = this.tasksContentEl.querySelector('.task-group-empty-message');
            if (emptyMessage) emptyMessage.remove();
        }
    }

    getTaskKey(task) {
        return `${task.file.path}:${task.lineNumber}`;
    }

    updateTaskItem(taskRowEl, task) {
        if (taskRowEl.dataset.taskStatus !== task.status) {
            const checkbox = taskRowEl.querySelector('.task-checkbox-symbol');
            if (checkbox) {
                this._renderTaskSymbol(checkbox, task);
            }
            taskRowEl.dataset.taskStatus = task.status;
        }

        const textEl = taskRowEl.querySelector('.task-text');
        const existingText = textEl ? textEl.textContent : '';
        if (textEl && existingText !== task.text) {
            textEl.empty();
            MarkdownRenderer.render(this.app, task.text, textEl, task.file.path, this);
        }
    }

    groupTasksByDate(tasks) {
        const settings = this.plugin.settings;
        const now = moment().startOf('day');
        const groupsData = { overdue: [], today: [], tomorrow: [], next7days: [], future: [], noDate: [] };

        tasks.forEach(task => {
            if (!task.dueDate) { groupsData.noDate.push(task); return; }
            const due = moment(task.dueDate).startOf('day');
            if (due.isBefore(now)) groupsData.overdue.push(task);
            else if (due.isSame(now)) groupsData.today.push(task);
            else if (due.isSame(now.clone().add(1, 'day'))) groupsData.tomorrow.push(task);
            else if (due.isSameOrBefore(now.clone().add(7, 'days'))) groupsData.next7days.push(task);
            else groupsData.future.push(task);
        });

        const icons = settings.taskGroupIcons || DEFAULT_SETTINGS.taskGroupIcons;
        const groupOrder = [
            { key: 'overdue', title: 'Overdue', icon: icons.overdue, color: settings.taskGroupColorOverdue },
            { key: 'today', title: 'Today', icon: icons.today, color: settings.taskGroupColorToday },
            { key: 'tomorrow', title: 'Tomorrow', icon: icons.tomorrow, color: settings.taskGroupColorTomorrow },
            { key: 'next7days', title: 'Next 7 Days', icon: icons.next7days, color: settings.taskGroupColorNext7Days },
            { key: 'future', title: 'Future', icon: icons.future, color: settings.taskGroupColorFuture },
            { key: 'noDate', title: 'No Due Date', icon: icons.noDate, color: settings.taskGroupColorNoDate }
        ];

        const finalGroups = {};
        groupOrder.forEach(g => {
            if (settings.taskDateGroupsToShow.includes(g.key) || g.key === 'noDate') {
                if (groupsData[g.key].length > 0) {
                    finalGroups[g.key] = { ...g, tasks: groupsData[g.key] };
                }
            }
        });
        return finalGroups;
    }

    groupTasksByTag(tasks) {
        const settings = this.plugin.settings;
        const groupedByTag = tasks.reduce((acc, task) => {
            const tags = task.tags.length > 0 ? task.tags : ['#untagged'];
            tags.forEach(tag => {
                const key = tag.toLowerCase();
                if (!acc[key]) acc[key] = {
                    title: tag,
                    icon: settings.taskGroupIcons?.tag || 'tag',
                    color: settings.taskGroupColorTag,
                    tasks: []
                };
                acc[key].tasks.push(task);
            });
            return acc;
        }, {});

        // Sort groups alphabetically by tag name
        const sortedKeys = Object.keys(groupedByTag).sort((a, b) => a.localeCompare(b));
        const sortedGroups = {};
        for (const key of sortedKeys) {
            sortedGroups[key] = groupedByTag[key];
        }
        return sortedGroups;
    }

    renderTaskGroup(key, groupData) {
        const groupContainer = createDiv({ cls: 'task-group-container', attr: { style: `background-color: ${groupData.color}` } });
        groupContainer.dataset.groupKey = key;

        const isCollapsed = this.plugin.settings.collapsedTaskGroups[key];
        if (isCollapsed) groupContainer.addClass('is-collapsed');

        const header = groupContainer.createDiv({ cls: 'task-group-header' });

        header.addEventListener('click', () => {
            // Find the wrapper element for the list
            const taskListWrapper = groupContainer.querySelector('.task-list-wrapper');
            if (!taskListWrapper) return;

            // Check the current state
            const isCurrentlyCollapsed = groupContainer.classList.contains('is-collapsed');

            if (isCurrentlyCollapsed) {
                // --- EXPANDING ---
                // 1. Set the CSS variable to the element's full scroll height.
                //    This gives the 'height' property a specific value to animate *to*.
                const scrollHeight = taskListWrapper.scrollHeight;
                taskListWrapper.style.setProperty('--task-list-height', `${scrollHeight}px`);

                // 2. Remove the class to trigger the transition.
                groupContainer.classList.remove('is-collapsed');

                // After the animation, remove the explicit height to allow for dynamic content.
                setTimeout(() => {
                    taskListWrapper.style.removeProperty('--task-list-height');
                }, 350); 

            } else {
                // --- COLLAPSING ---
                // 1. Set the CSS variable to the element's current rendered height.
                //    This gives the 'height' property a specific value to animate *from*.
                const currentHeight = taskListWrapper.offsetHeight;
                taskListWrapper.style.setProperty('--task-list-height', `${currentHeight}px`);

                // This is a micro-delay to ensure the browser registers the starting height
                // before being told to transition to 0. This is the key to fixing the "instant collapse".
                requestAnimationFrame(() => {
                    // 2. Add the class to trigger the transition to height: 0.
                    groupContainer.classList.add('is-collapsed');
                });
            }

            // Update and save the state
            this.collapsedTaskGroups[key] = !isCurrentlyCollapsed;
            this.plugin.saveSettings();
        });

        const headerContent = header.createSpan({ cls: 'task-group-header-content' });
        const iconEl = headerContent.createSpan({ cls: 'icon' });
        setIcon(iconEl, groupData.icon);
        headerContent.createSpan({ text: `${groupData.title} (${groupData.tasks.length})` });

        const collapseIcon = header.createSpan({ cls: 'task-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');

        const taskListWrapper = groupContainer.createDiv('task-list-wrapper');
        groupData.tasks.forEach(task => {
            const taskEl = this.renderTaskItem(task); // Use the modified renderTaskItem
            taskListWrapper.appendChild(taskEl);
        });

        return groupContainer;
    }

    reconcileTaskList(listWrapperEl, newTasks) {
        const existingTaskRows = new Map();
        listWrapperEl.querySelectorAll('.task-row').forEach(row => {
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

            // Ensure the element is in the correct position
            if (lastElement) {
                lastElement.after(taskEl);
            } else {
                listWrapperEl.prepend(taskEl);
            }
            lastElement = taskEl;
        });

        existingTaskRows.forEach(row => row.remove());
    }


    /**
     * Renders a single task item row in a task group.
     * @param {object} task The task object.
     * @param {HTMLElement} container The parent container for the task row.
     */
    renderTaskItem(task) {
        const taskRow = createDiv({ cls: 'task-row' });
        taskRow.dataset.key = this.getTaskKey(task);
        taskRow.dataset.taskStatus = task.status;
        const searchInputEl = this.tasksSearchInputEl;

        const checkbox = taskRow.createDiv({ cls: 'task-checkbox-symbol' });
        this._renderTaskSymbol(checkbox, task);
        const textEl = taskRow.createSpan({ cls: 'task-text' });

        // On initial render, check if the task is already completed and apply the style.
        if (task.status.toLowerCase() === 'x') {
            textEl.classList.add('completed');
        }

        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();

            // Determine the state *before* the change is made
            const wasCompleted = task.status.toLowerCase() === 'x';

            // Modify the file. This also triggers the background file watcher
            // which will correctly refresh the entire task list after a short delay.
            await this.toggleTaskCompletion(task);

            // --- Provide Instant UI Feedback ---
            // We update the local task object and the DOM immediately so the user
            // sees the change without waiting for the file watcher to finish.

            if (wasCompleted) {
                // If it WAS completed, its new state is INCOMPLETE
                task.status = ' ';
                textEl.classList.remove('completed');
            } else {
                // If it was NOT completed, its new state is COMPLETE
                task.status = 'x';
                textEl.classList.add('completed');
            }

            // Finally, re-render the checkbox symbol itself using the new status
            this._renderTaskSymbol(checkbox, task);
        });

        MarkdownRenderer.render(this.app, task.text, textEl, task.file.path, this);

        taskRow.addEventListener('click', () => this.app.workspace.openLinkText(task.file.path, '', false, { eState: { line: task.lineNumber } }));
        this.addKeydownListeners(taskRow, searchInputEl);

        setTimeout(() => {
            if (this.plugin.settings.taskTextTruncate && textEl.scrollWidth > textEl.clientWidth) {
                const tooltipText = `Task: ${task.text}\n\nFile: ${task.file.path}\nDue: ${task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : 'None'}\nTags: ${task.tags.length > 0 ? task.tags.map(t => '#' + t).join(' ') : 'None'}`;
                textEl.setAttribute('aria-label', tooltipText);
            }
        }, 0);

        return taskRow;
    }

    /**
     * Toggles the completion state of a task by modifying the source Markdown file.
     * @param {object} task The task object to toggle.
     */
    async toggleTaskCompletion(task) {
        const content = await this.app.vault.read(task.file);
        const lines = content.split('\n');
        let line = lines[task.lineNumber];

        const completionDateRegex = /\s*✅\s*\d{4}-\d{2}-\d{2}/;
        const today = moment().format("YYYY-MM-DD");
        const isCompleted = task.status.toLowerCase() === 'x';

        // Find the task marker [.] and replace the character inside
        const taskMarkerRegex = /\[.\]/;

        if (isCompleted) {
            // Mark as incomplete: [x] -> [ ] and remove completion date
            let newLine = line.replace(taskMarkerRegex, '[ ]');
            lines[task.lineNumber] = newLine.replace(completionDateRegex, '').trim();
        } else {
            // Mark as complete: [ ] or [/] or [-] -> [x] and add completion date
            let newLine = line.replace(taskMarkerRegex, '[x]');
            newLine = newLine.replace(completionDateRegex, ''); // Remove any old one first
            lines[task.lineNumber] = `${newLine} ✅ ${today}`;
        }
        await this.app.vault.modify(task.file, lines.join('\n'));
    }

    /**
     * Updates an existing task row in the DOM with new data.
     * @param {HTMLElement} taskRowEl The .task-row element to update.
     * @param {object} task The new task object with updated data.
     */
    updateTaskItem(taskRowEl, task) {
        // Only update if the text content has changed
        const textEl = taskRowEl.querySelector('.task-text');

        // Only update if the status has changed
        if (taskRowEl.dataset.taskStatus !== task.status) {
            const checkbox = taskRowEl.querySelector('.task-checkbox-symbol');
            if (checkbox) {
                this._renderTaskSymbol(checkbox, task);
            }
            taskRowEl.dataset.taskStatus = task.status;

            if (textEl) {
                if (task.status.toLowerCase() === 'x') {
                    textEl.classList.add('completed');
                } else {
                    textEl.classList.remove('completed');
                }
            }
        }

        // A simple check to see if the rendered HTML might be different
        if (textEl && textEl.textContent !== task.text) {
            textEl.empty(); // Clear existing rendered markdown
            MarkdownRenderer.render(this.app, task.text, textEl, task.file.path, this);
        }
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

        // CORRECTED: Combine the stored frontmatter with the current body text
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
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay

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
                await new Promise(resolve => setTimeout(resolve, 200));
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
                    text: hasTemplate ? 'Create with Events & Template' : 'Create with Events',
                    cls: 'mod-cta',
                    action: () => createNote(true)
                }, {
                    // Button 2: Excludes events
                    text: hasTemplate ? 'Create from Template Only' : 'Create Blank Note',
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
                    text: hasTemplate ? 'Create from Template' : 'Create Blank Note',
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


/**
 * The main plugin class that registers the view and settings tab.
 */
class PeriodMonthPlugin extends Plugin {
    tasksAPI;
    themeObserver = null;
    themeChangeDebounceTimer = null;

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addStyle();
        this.updateStyles();
        this.registerView(VIEW_TYPE_PERIOD, leaf => new PeriodMonthView(leaf, this));
        this.addRibbonIcon("calendar-check", "Open Calendar Period Week Notes", () => this.activateView());
        this.addCommand({ id: "open-period-month-view", name: "Open Calendar Period Week Notes", callback: () => this.activateView() });
        await this.resetIcsRefreshInterval();
        this.addSettingTab(new PeriodSettingsTab(this.app, this));

        this.themeObserver = new MutationObserver(() => {
            clearTimeout(this.themeChangeDebounceTimer);
            this.themeChangeDebounceTimer = setTimeout(() => {
                this.updateStyles();
            }, 100);
        });

        this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        this.icsRefreshIntervalId = null;

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
        styleEl.id = 'period-month-plugin-styles';
        styleEl.textContent = PLUGIN_STYLES;
        document.head.appendChild(styleEl);
    }

    /**
     * Updates CSS custom properties (variables) based on the current plugin settings.
     */
    updateStyles() {
        const styleProps = {
            '--header-font-size': this.settings.fontSize,
            '--day-number-font-size': this.settings.dayNumberFontSize,
            '--header-row-font-weight': this.settings.headerRowBold ? 'bold' : 'normal',
            '--pw-column-font-weight': this.settings.pwColumnBold ? 'bold' : 'normal',
            '--month-color-light': this.settings.monthColorLight,
            '--month-color-dark': this.settings.monthColorDark,
            '--year-color-light': this.settings.yearColorLight,
            '--year-color-dark': this.settings.yearColorDark,
            '--current-highlight-label-color-light': this.settings.currentHighlightLabelColorLight,
            '--current-highlight-label-color-dark': this.settings.currentHighlightLabelColorDark,
            '--pw-separator-color': this.settings.pwColumnSeparatorColor,
            '--pw-column-font-color-light': this.settings.pwColumnFontColorLight,
            '--pw-column-font-color-dark': this.settings.pwColumnFontColorDark,
            '--week-number-font-color-light': this.settings.weekNumberFontColorLight,
            '--week-number-font-color-dark': this.settings.weekNumberFontColorDark,
            '--day-header-font-color-light': this.settings.dayHeaderFontColorLight,
            '--day-header-font-color-dark': this.settings.dayHeaderFontColorDark,
            '--day-cell-font-color-light': this.settings.dayCellFontColorLight,
            '--day-cell-font-color-dark': this.settings.dayCellFontColorDark,
            '--other-month-font-color-light': this.settings.otherMonthFontColorLight,
            '--other-month-font-color-dark': this.settings.otherMonthFontColorDark,
            '--scratch-font-family': this.settings.scratchFontFamily,
            '--scratch-font-size': this.settings.scratchFontSize,
            '--scratch-bold': this.settings.scratchBold ? 'bold' : 'normal',
            '--notes-font-size': this.settings.notesFontSize,
            '--notes-bold': this.settings.notesBold ? 'bold' : 'normal',
            '--tab-title-font-size': this.settings.tabTitleFontSize,
            '--tab-title-bold': this.settings.tabTitleBold ? 'bold' : 'normal',
            '--notes-line-height': this.settings.notesLineHeight,
            '--selected-tab-color': this.settings.selectedTabColor,
            '--today-highlight-color-light': this.settings.todayHighlightColorLight,
            '--today-highlight-color-dark': this.settings.todayHighlightColorDark,
            '--notes-hover-color': this.settings.notesHoverColor,
            '--daily-note-dot-color': this.settings.dailyNoteDotColor,
            '--note-created-color': this.settings.noteCreatedColor,
            '--note-modified-color': this.settings.noteModifiedColor,
            '--other-note-dot-color': this.settings.noteCreatedColor,
            '--calendar-grid-gap-width': this.settings.calendarGridGapWidth,
            '--calendar-modified-dot-color': this.settings.noteModifiedColor,
            '--other-note-popup-font-size': this.settings.otherNotePopupFontSize,
            '--calendar-dot-size': this.settings.calendarDotSize + 'px',
            '--nav-button-height': this.settings.navButtonHeight,
            '--date-cell-hover-color-light': this.settings.dateCellHoverColorLight,
            '--date-cell-hover-color-dark': this.settings.dateCellHoverColorDark,
            '--main-month-year-title-font-size': this.settings.mainMonthYearTitleFontSize,
            '--main-month-title-weight': this.settings.mainMonthTitleBold ? 'bold' : 'normal',
            '--main-year-title-weight': this.settings.mainYearTitleBold ? 'bold' : 'normal',
            '--today-highlight-size': this.settings.todayHighlightSize,
            '--task-heading-font-size': this.settings.taskHeadingFontSize,
            '--task-text-font-size': this.settings.taskTextFontSize,
            '--scratchpad-highlight-color': this.settings.scratchpadHighlightColor,
            '--asset-dot-color': this.settings.assetDotColor,
            '--calendar-event-dot-color': this.settings.calendarEventDotColor,
            '--task-dot-color': this.settings.taskDotColor,
            '--task-badge-color': this.settings.taskBadgeColor,
            '--task-badge-font-color': this.settings.taskBadgeFontColor,
            '--task-badge-font-size': this.settings.taskBadgeFontSize,
            '--today-circle-color-light': this.settings.todayCircleColorLight,
            '--today-circle-color-dark': this.settings.todayCircleColorDark,
            '--weekly-note-dot-color': this.settings.weeklyNoteDotColor,
            '--weekend-shade-color-light': this.settings.weekendShadeColorLight,
            '--weekend-shade-color-dark': this.settings.weekendShadeColorDark,
            '--weekly-note-dot-color': this.settings.weeklyNoteDotColor,
            '--row-highlight-color-light': this.settings.rowHighlightColorLight,
            '--row-highlight-color-dark': this.settings.rowHighlightColorDark,
            '--task-color-overdue': this.settings.taskStatusColorOverdue,
            '--task-color-in-progress': this.settings.taskStatusColorInProgress,
            '--task-color-open': this.settings.taskStatusColorOpen,
            '--task-color-completed': this.settings.taskStatusColorCompleted,
            '--task-color-cancelled': this.settings.taskStatusColorCancelled,

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
                    console.log(`Periodic Notes: Automatically refreshing ICS feed (interval: ${intervalMinutes} minutes).`);

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


    onunload() {
        // Clean up when the plugin is disabled.
        const styleEl = document.getElementById('period-month-plugin-styles');
        if (styleEl) styleEl.remove();
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => leaf.detach());

        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }

    }
}

/**
 * The settings tab class for the plugin, responsible for building the settings UI.
 */
class PeriodSettingsTab extends PluginSettingTab {
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
        this.app.workspace.trigger('pm-dashboard-refresh');
    }

    async loadCurrentThemeDefaults() {
        // If a theme is active, try to load its settings
        if (this.plugin.settings.appliedTheme) {
            const themeName = this.plugin.settings.appliedTheme;
            const themePath = `${this.plugin.manifest.dir}/themes/${themeName}.json`;
            try {
                if (await this.app.vault.adapter.exists(themePath)) {
                    const fileContent = await this.app.vault.adapter.read(themePath);
                    const themeSettings = JSON.parse(fileContent);
                    // Merge theme settings over base defaults to get the final defaults
                    this.currentThemeDefaults = { ...DEFAULT_SETTINGS, ...themeSettings };
                } else {
                    // If the theme file is missing, fall back to base defaults
                    console.warn(`Applied theme file "${themeName}.json" not found. Using base defaults.`);
                    this.currentThemeDefaults = { ...DEFAULT_SETTINGS };
                }
            } catch (e) {
                console.error("Error loading theme defaults:", e);
                this.currentThemeDefaults = { ...DEFAULT_SETTINGS };
            }
        } else {
            // If no theme is active, the defaults are just the base defaults
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
     * Renders a single draggable list of widgets.
     */
    renderWidgetSettings(containerEl, title, visibilityKey, orderKey, defaultWidgets) {
        containerEl.createEl('h2', { text: title });
        const draggableContainer = containerEl.createDiv('pm-draggable-widget-list');
        draggableContainer.dataset.orderKey = orderKey;
        draggableContainer.dataset.title = title;

        let allWidgets = { ...defaultWidgets };

        if (!this.plugin.settings[visibilityKey]) {
            this.plugin.settings[visibilityKey] = {};
        }
        const visibilitySettings = this.plugin.settings[visibilityKey];

        if (visibilityKey === 'creationDashboardWidgets') {
            (this.plugin.settings.customHeatmaps || []).forEach((heatmap, index) => {
                allWidgets[`custom-${index}`] = { name: `${heatmap.name} (Custom Heatmap ${index + 1})` };
            });
        }

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

        const getFinalOrder = () => {
            const savedOrder = this.plugin.settings[orderKey] || [];
            const allKeys = Object.keys(allWidgets);
            const finalOrder = [...savedOrder];
            allKeys.forEach(key => {
                if (!finalOrder.includes(key)) {
                    finalOrder.push(key);
                }
            });
            return finalOrder.filter(key => allWidgets[key]);
        };
        const finalOrder = getFinalOrder();

        finalOrder.forEach(key => {
            const widgetEl = draggableContainer.createDiv({ cls: 'pm-draggable-widget-item' });
            widgetEl.dataset.widgetKey = key;
            const name = allWidgets[key]?.name || 'Unknown Widget';
            const dragHandle = widgetEl.createDiv({ cls: 'pm-drag-handle' });
            setIcon(dragHandle, 'grip-vertical');
            const settingWrapper = widgetEl.createDiv({ cls: 'pm-setting-wrapper' });
            new Setting(settingWrapper)
                .setName(name)
                .addToggle(toggle => toggle.setValue(visibilitySettings[key] === true).onChange(async (value) => {
                    visibilitySettings[key] = value;
                    await this.saveAndUpdate();
                }));
            dragHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.draggedItem = widgetEl;
                this.draggedItem.addClass('dragging');
                this.placeholder = document.createElement('div');
                this.placeholder.className = 'pm-drag-placeholder';
                this.placeholder.style.height = `${this.draggedItem.offsetHeight}px`;
                this.draggedItem.parentNode.insertBefore(this.placeholder, this.draggedItem);
            });
        });
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
        const suggestionEl = createDiv({ cls: 'custom-suggestion-container' });
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
                const item = suggestionEl.createDiv({ cls: 'custom-suggestion-item', text: path });

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
        inputEl.addEventListener('blur', () => setTimeout(() => {
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
            containerEl.createEl('p', { text: 'No folders are being ignored.', cls: 'setting-item-description' });
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
        const settingsContainer = containerEl.createDiv({ cls: 'period-settings-container' });
        const navEl = settingsContainer.createDiv({ cls: 'period-settings-nav' });
        this.contentEl = settingsContainer.createDiv({ cls: 'period-settings-content' }); // Assign content area to this.contentEl

        const tabs = {
            general: "General Display",
            functional: "Calendar Functional",
            popup: "Popup Controls",
            dots: "Dot Indicators",
            weeklyNotes: "Weekly Notes",
            tasksIndicator: "Task Indicators",
            tabs: "General Tab",
            scratchpad: "ScratchPad Tab",
            notes: "Notes Tab",
            pinned: 'Pinned Notes Tab',
            assets: "Assets Tab",
            tasks: "Tasks Tab",
            dashboard: 'Dashboard Tab',
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
            const itemEl = container.createDiv({ cls: 'draggable-item' });
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

        containerEl.createEl("h1", { text: "General Display Settings" });

        // --- Titles & Headers Section ---
        new Setting(containerEl).setName("Titles & Headers").setHeading();
        const monthTitleSetting = new Setting(containerEl).setName("Month title format");
        monthTitleSetting.descEl.innerHTML = `
            Set the format for the calendar's month title. Uses <a href="https://momentjs.com/docs/#/displaying/format/">moment.js</a> format strings, e.g.
            <br><code>YYYY</code>: 4-digit year (e.g., 2025)
            <br><code>YY</code>: 2-digit year (e.g., 25)
            <br><code>MMMM</code>: Full month name (e.g., September)
            <br><code>MMM</code>: Short month name (e.g., Sep)
            <br><code>MM</code>: 2-digit month (e.g., 09)
            <br><code>M</code>: Month number (e.g., 9)
        `;

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

        this.createRgbaColorSetting(containerEl, "Month Title Color (Light Mode)", "Color for the main 'Month' title in light mode.", "monthColorLight");
        this.createRgbaColorSetting(containerEl, "Month Title Color (Dark Mode)", "Color for the main 'Month' title in dark mode.", "monthColorDark");

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
            'Year Title Color (Light Mode)',
            'Color for the year text in the main title in light mode.',
            'yearColorLight'
        );
        this.createRgbaColorSetting(
            containerEl,
            'Year Title Color (Dark Mode)',
            'Color for the year text in the main title in dark mode.',
            'yearColorDark'
        );

        new Setting(containerEl).setName("Navigation buttons height").setDesc("Default is 28px.").addText(text => text.setValue(this.plugin.settings.navButtonHeight).onChange(async value => { this.plugin.settings.navButtonHeight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold calendar header").setDesc("Toggles bold font weight for the day names row (Mon, Tue, etc.).").addToggle(toggle => toggle.setValue(this.plugin.settings.headerRowBold).onChange(async value => { this.plugin.settings.headerRowBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Day header row font color (Light Mode)", "Text color for the day names (Sun, Mon, Tue, etc.) in light theme.", "dayHeaderFontColorLight");
        this.createRgbaColorSetting(containerEl, "Day header row font color (Dark Mode)", "Text color for the day names (Sun, Mon, Tue, etc.) in dark theme.", "dayHeaderFontColorDark");

        // --- Calendar Grid Section ---
        new Setting(containerEl).setName("Calendar Grid").setHeading();

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

                // This part is correct: It gives the slider the number it needs.
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
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's Date Cell Highlight (Light Mode)", "Background color for the current day's cell in light mode.", "todayHighlightColorLight");
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's Date Cell Highlight (Dark Mode)", "Background color for the current day's cell in dark mode.", "todayHighlightColorDark");
            } else if (style === 'circle' || style === 'number') {

                this.createRgbaColorSetting(highlightOptionsContainer, "Today's Date Highlight Color (Light Mode)", "Controls the highlight for Circle/Square styles in light mode.", "todayCircleColorLight");
                this.createRgbaColorSetting(highlightOptionsContainer, "Today's Date Highlight Color (Dark Mode)", "Controls the highlight for Circle/Square styles in dark mode.", "todayCircleColorDark");
            }

            if (style === 'circle') {

                todayHighlightSizeSetting.settingEl.style.display = '';
            } else {
                todayHighlightSizeSetting.settingEl.style.display = 'none';

            }
        };

        todayStyleSetting.addDropdown(dropdown => {
            dropdown
                .addOption('none', 'Off (No Highlight)')
                .addOption('cell', 'Highlight Cell')
                .addOption('circle', 'Circle Around Date')
                .addOption('number', 'Square Around Date')
                .setValue(this.plugin.settings.todayHighlightStyle)
                .onChange(async (value) => {
                    this.plugin.settings.todayHighlightStyle = value;
                    await this.saveAndUpdate();
                    renderHighlightOptions(value);
                });
        });

        renderHighlightOptions(this.plugin.settings.todayHighlightStyle);
        // --- End of Corrected Section ---

        new Setting(containerEl).setName("Highlight today's day header").setDesc("Colors the day column header (Sun, Mon, etc.) containing today.").addToggle(toggle => toggle.setValue(this.plugin.settings.highlightTodayDayHeader).onChange(async value => { this.plugin.settings.highlightTodayDayHeader = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Highlight today's P/W or week number").setDesc("Colors the Period/Week or Calendar Week number for the current week.").addToggle(toggle => toggle.setValue(this.plugin.settings.highlightTodayPWLabel).onChange(async value => { this.plugin.settings.highlightTodayPWLabel = value; await this.saveAndUpdate(); }));

        this.createRgbaColorSetting(
            containerEl,
            "Current Day / Week Label Highlight (Light Mode)",
            "Color for the current day's labels, (e.g. SUN, MON) and period week / calendar week labels in light mode.",
            "currentHighlightLabelColorLight"
        );

        this.createRgbaColorSetting(
            containerEl,
            "Current Day / Week Label Highlight (Dark Mode)",
            "Color for the current day's labels, (e.g. SUN, MON) and period week / calendar week labels in dark mode.",
            "currentHighlightLabelColorDark"
        );

        this.createRgbaColorSetting(containerEl, "Date Cell Hover Color (Light Mode)", "Background color when hovering over a date cell in light mode.", "dateCellHoverColorLight");
        this.createRgbaColorSetting(containerEl, "Date Cell Hover Color (Dark Mode)", "Background color when hovering over a date cell in dark mode.", "dateCellHoverColorDark");
        new Setting(containerEl).setName("Bold Period/Week column").setDesc("Toggles bold font weight for the Period/Week column.").addToggle(toggle => toggle.setValue(this.plugin.settings.pwColumnBold).onChange(async value => { this.plugin.settings.pwColumnBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show P/W separator line").setDesc("Display a vertical line between the week columns and the date grid.").addToggle(toggle => toggle.setValue(this.plugin.settings.showPWColumnSeparator).onChange(async value => { this.plugin.settings.showPWColumnSeparator = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "P/W separator line color", "Color of the vertical separator line.", "pwColumnSeparatorColor");
        this.createRgbaColorSetting(containerEl, "Period/Week column font color (Light Mode)", "Text color for the Period/Week column in light theme.", "pwColumnFontColorLight");
        this.createRgbaColorSetting(containerEl, "Period/Week column font color (Dark Mode)", "Text color for the Period/Week column in dark theme.", "pwColumnFontColorDark");
        this.createRgbaColorSetting(containerEl, "Week number column font color (Light Mode)", "Text color for the week number column in light theme.", "weekNumberFontColorLight");
        this.createRgbaColorSetting(containerEl, "Week number column font color (Dark Mode)", "Text color for the week number column in dark theme.", "weekNumberFontColorDark");
    }

    renderFunctionalSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Calendar Functional Settings" });

        // --- Period/Week System Section ---
        new Setting(containerEl).setName("Period/Week System").setHeading();

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
            .setName("Start of Period 1 Week 1")
            .setDesc(`The date for the start of P1W1. This date MUST be a ${requiredDayName} to match your 'Week starts on' setting.`) // Dynamic description
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

        new Setting(containerEl).setName("Period/Week format").setDesc("Choose the display format for the P/W column.").addDropdown(dropdown => dropdown.addOption("P#W#", "P#W#").addOption("P# W#", "P# W#").addOption("# W#", "# W#").addOption("p#w#", "p#p#").addOption("p# w#", "p# w#").addOption("# w#", "# w#").addOption("#-#", "#-#").addOption("# - #", "# - #").addOption("#/#", "#/#").addOption("# / #", "# / #").addOption("#,#", "#,#").addOption("#, #", "#, #").setValue(this.plugin.settings.pwFormat).onChange(async (value) => { this.plugin.settings.pwFormat = value; await this.saveAndUpdate(); }));

        new Setting(containerEl).setName("Show Period/Week column").setDesc("Show or hide the Period/Week column on the left side of the calendar.").addToggle(toggle => toggle.setValue(this.plugin.settings.showPWColumn).onChange(async value => { this.plugin.settings.showPWColumn = value; await this.saveAndUpdate(); }));

        // --- Week Numbers Section ---
        new Setting(containerEl).setName("Week Numbers").setHeading();

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
        new Setting(containerEl).setName("Daily Notes").setHeading();
        new Setting(containerEl).setName("Daily Notes folder").setDesc("Specify the folder where your daily notes are stored and created.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && (!q || f.path.toLowerCase().includes(q))).map(f => f.path)); text.setValue(this.plugin.settings.dailyNotesFolder).onChange(async value => { this.plugin.settings.dailyNotesFolder = value; await this.saveAndUpdate(); }); });
        new Setting(containerEl).setName("Daily Note open behavior").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.dailyNoteOpenAction).onChange(async (value) => { this.plugin.settings.dailyNoteOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Daily note template").setDesc("Path to a template file to use when creating a new daily note.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path)); text.setPlaceholder("Example: Templates/Daily.md").setValue(this.plugin.settings.dailyNoteTemplatePath).onChange(async (value) => { this.plugin.settings.dailyNoteTemplatePath = value; await this.saveAndUpdate(); }); });

        // --- Grid Highlighting Section ---
        new Setting(containerEl).setName("Grid Highlighting").setHeading();
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


        this.createRgbaColorSetting(containerEl, "Grid Highlight Color (Light Mode)", "Color for row/column highlighting on hover in light mode.", "rowHighlightColorLight");
        this.createRgbaColorSetting(containerEl, "Grid Highlight Color (Dark Mode)", "Color for row/column highlighting on hover in dark mode.", "rowHighlightColorDark");

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
            "Weekend shade color (Light Mode)",
            "Background color for Saturday and Sunday columns in light theme.",
            "weekendShadeColorLight"
        );

        this.createRgbaColorSetting(
            containerEl,
            "Weekend shade color (Dark Mode)",
            "Background color for Saturday and Sunday columns in dark theme.",
            "weekendShadeColorDark"
        );

        new Setting(containerEl).setName("Integrate External Calendar Events").setHeading();

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
            .setName('Auto-refresh Interval')
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
            .setName('Calendar Event Indicator')
            .setDesc('Choose how to display external calendar events on the calendar grid. "Dot" shows a separate colored dot, while "Heatmap" and "Badge" will add the event count to the existing task indicators. If you select "Heatmap" or "Badge", ensure that the corresponding task indicator option is also enabled in the "Task Indicators" settings tab. Settings will be applied after closing the settings window.')
            .addDropdown(dropdown => dropdown
                .addOption('dot', 'Dot Only')
                .addOption('heatmap', 'Add to Heatmap')
                .addOption('badge', 'Add to Task Badge')
                .setValue(this.plugin.settings.calendarEventIndicatorStyle || 'dot')
                .onChange(async (value) => {
                    // Step 1: Save the new value
                    this.plugin.settings.calendarEventIndicatorStyle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Calendar Events Placeholder')
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
            .setName('Calendar Event Format')
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
        containerEl.createEl("h1", { text: "Popup Controls" });

        // --- Popups Section ---
        new Setting(containerEl).setName("Popup hover delay").setDesc("How long to wait before showing the note list popup on hover. Default is 800.").addText(text => text.setValue(String(this.plugin.settings.otherNoteHoverDelay)).onChange(async (value) => { this.plugin.settings.otherNoteHoverDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup hide delay").setDesc("How long to wait before hiding the popup after the mouse leaves. Default is 50.").addText(text => text.setValue(String(this.plugin.settings.popupHideDelay)).onChange(async (value) => { this.plugin.settings.popupHideDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup gap").setDesc("The gap (in pixels) between a calendar day and its popup list. Can be negative. Default is -2.").addText(text => text.setValue(String(this.plugin.settings.popupGap)).onChange(async (value) => { this.plugin.settings.popupGap = Number(value) || -2; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup font size").setDesc("The font size for the note names inside the calendar popup. Default is 14px.").addText(text => text.setValue(this.plugin.settings.otherNotePopupFontSize).onChange(async value => { this.plugin.settings.otherNotePopupFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName('Notes & Assets Popup Trigger')
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
        containerEl.createEl("h1", { text: "Dot Indicators" });
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
        new Setting(containerEl).setName("Dot Colors").setHeading();
        this.createRgbaColorSetting(containerEl, "Daily Note", "Used for daily notes.", "dailyNoteDotColor");
        this.createRgbaColorSetting(containerEl, "Created Note", "Uses the created file date for notes, not used for Daily / Weekly Notes.", "noteCreatedColor");
        this.createRgbaColorSetting(containerEl, "Modified Note", "Uses the modified file date for notes, not used for Daily / Weekly Notes.", "noteModifiedColor");
        this.createRgbaColorSetting(containerEl, "Asset Note", "Uses the created file date for newly added assets.", "assetDotColor");
        this.createRgbaColorSetting(containerEl, 'Calendar Event', 'Used for events from your iCal/.ics feed.', 'calendarEventDotColor');
        this.createIgnoredFolderList(containerEl, "Ignore folders for note dots", "Files in these folders will not create 'created' or 'modified' dots on the calendar grid or lists.", 'otherNoteIgnoreFolders');
        this.createIgnoredFolderList(containerEl, "Ignore folders for asset dots", "Assets in these folders will not create dots on the calendar and lists.", 'assetIgnoreFolders');

    }

    renderWeeklyNotesSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Weekly Notes Settings" });

        new Setting(containerEl)
            .setName("Enable Weekly Notes")
            .setDesc("Enable clicking on week numbers to open/create weekly notes and show the dot indicator.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableWeeklyNotes)
                .onChange(async (value) => {
                    this.plugin.settings.enableWeeklyNotes = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Weekly Note Folder")
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
        const weeklyFormatSetting = new Setting(containerEl).setName("Weekly Note Format");
        weeklyFormatSetting.descEl.innerHTML = `
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

        new Setting(containerEl).setName("Dot Indicator").setHeading();

        new Setting(containerEl)
            .setName("Show dot for weekly notes")
            .setDesc("Show a dot in the week number column if a note for that week exists.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showWeeklyNoteDot)
                .onChange(async (value) => {
                    this.plugin.settings.showWeeklyNoteDot = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(containerEl, "Weekly Note Dot Color", "The color of the dot for existing weekly notes.", "weeklyNoteDotColor");
    }

    renderTaskIndicatorSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Calendar Task Indicators" });
        new Setting(containerEl)
            .setName("Task indicator style")
            .setDesc("Choose how to indicate days with tasks on the calendar grid.")
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None')
                .addOption('badge', 'Number Badge')
                .addOption('heatmap', 'Cell Color Heatmap')
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

        this.createRgbaColorSetting(containerEl, "Task Dot Color", "The color of the dot indicating a day has tasks.", "taskDotColor");

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

            this.createRgbaColorSetting(containerEl, "Task badge color", "The background color of the task count badge.", "taskBadgeColor");
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

            containerEl.createEl('p', { text: 'Configure the start, middle, and end points of the dynamic color gradient. Colors will be blended smoothly between these points.', cls: 'setting-item-description' });

            new Setting(containerEl).setName("Gradient Midpoint").setDesc("The number of tasks that should have the exact 'Mid' color. Default is 5.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMidpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMidpoint = Number(value) || 5; await this.saveAndUpdate(); }));
            new Setting(containerEl).setName("Gradient Maxpoint").setDesc("The number of tasks that should have the exact 'End' color. Any day with more tasks will also use the end color. Default is 10.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMaxpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMaxpoint = Number(value) || 10; await this.saveAndUpdate(); }));

            this.createRgbaColorSetting(containerEl, "Heatmap: Start Color (1 Task)", "The color for days with 1 task.", "taskHeatmapStartColor");
            this.createRgbaColorSetting(containerEl, "Heatmap: Mid Color", "The color for days meeting the 'Midpoint' task count.", "taskHeatmapMidColor");
            this.createRgbaColorSetting(containerEl, "Heatmap: End Color", "The color for days meeting the 'Maxpoint' task count.", "taskHeatmapEndColor");
        }
    }

    renderDraggableTabs(container) {
        container.empty(); // Clear the container first

        // Define labels for tabs
        const tabLabels = {
            scratch: 'ScratchPad',
            notes: 'Notes',
            tasks: 'Tasks',
            assets: 'Assets',
            dashboard: 'Dashboard'
        };

        let draggedItem = null; // To keep track of the item being dragged

        this.plugin.settings.tabOrder.forEach((key, index) => {
            const settingItem = container.createDiv('draggable-item');
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
                setTimeout(() => settingItem.addClass('dragging'), 0);
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
                .addOption('text', 'Text Only')
                .addOption('iconAndText', 'Icon and Text')
                .addOption('iconOnly', 'Icon Only')
                .setValue(this.plugin.settings.tabDisplayMode)
                .onChange(async (value) => {
                    this.plugin.settings.tabDisplayMode = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Mobile tab display style")
            .setDesc("Choose a different, often more compact, display style for smaller mobile / tablet screens.")
            .addDropdown(dropdown => dropdown
                .addOption('text', 'Text Only')
                .addOption('iconAndText', 'Icon and Text')
                .addOption('iconOnly', 'Icon Only')
                .setValue(this.plugin.settings.mobileTabDisplayMode)
                .onChange(async (value) => {
                    this.plugin.settings.mobileTabDisplayMode = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl).setName("Tab title font size").setDesc("Font size for the tab titles (ScratchPad, Notes, Tasks). Default is 15px.").addText(text => text.setValue(this.plugin.settings.tabTitleFontSize).onChange(async value => { this.plugin.settings.tabTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold tab titles").setDesc("Toggles bold font weight for the tab titles.").addToggle(toggle => toggle.setValue(this.plugin.settings.tabTitleBold).onChange(async value => { this.plugin.settings.tabTitleBold = value; await this.saveAndUpdate(); }));

        this.createRgbaColorSetting(containerEl, "Active Tab Indicator", "Underline color for the active tab.", "selectedTabColor");

        containerEl.createDiv('setting-spacer');

        new Setting(containerEl)
            .setName('Tab Order')
            .setDesc('Drag and drop the tabs to set their display order.');

        // Create a container for our draggable list
        const tabOrderContainer = containerEl.createDiv('tab-order-container');
        this.renderDraggableTabs(tabOrderContainer);

        containerEl.createDiv('setting-spacer');

        new Setting(containerEl).setName("Tab Visibility").setHeading();

        new Setting(containerEl)
            .setName("Show Tasks tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.tasks)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.tasks = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show ScratchPad tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.scratch)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.scratch = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl)
            .setName("Show Notes tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.notes)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.notes = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show Assets tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.assets)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.assets = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl)
            .setName('Show Dashboard tab')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.dashboard)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.dashboard = value;
                    await this.saveAndUpdate();
                }));

    }

    renderScratchpadSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "ScratchPad Tab Settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        new Setting(containerEl).setName("ScratchPad tab click action").setDesc("What to do when the ScratchPad tab is clicked while it's already active.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.scratchpadOpenAction).onChange(async (value) => { this.plugin.settings.scratchpadOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("ScratchPad note path").setDesc("The full path to the note that the ScratchPad tab will read from and write to.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path)); text.setValue(this.plugin.settings.fixedNoteFile).onChange(async value => { this.plugin.settings.fixedNoteFile = value; await this.saveAndUpdate(); }); });
        new Setting(containerEl).setName("Show preview/edit button").setDesc("Show the button to toggle between plain text editing and a rendered Markdown preview.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchpad?.showPreviewToggle ?? false).onChange(async (value) => { if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {}; this.plugin.settings.scratchpad.showPreviewToggle = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show '+ Task' button").setDesc("Show the button in the scratchpad area to quickly add a new task.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchpad?.showAddTaskButton ?? true).onChange(async (value) => { if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {}; this.plugin.settings.scratchpad.showAddTaskButton = value; await this.saveAndUpdate(); }));

        const taskTitleSetting = new Setting(containerEl).setName("Task Creation Format");
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
        .setDesc('If enabled, the frontmatter properties text (text between ---) at the top of the note will be hidden from the ScratchPad view.')
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

        new Setting(containerEl).setName("ScratchPad font size").setDesc("Font size for the text inside the ScratchPad editor. Default is 14px.").addText(text => text.setValue(this.plugin.settings.scratchFontSize).onChange(async value => { this.plugin.settings.scratchFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold ScratchPad text").setDesc("Toggles bold font weight for the text in the ScratchPad.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchBold).onChange(async value => { this.plugin.settings.scratchBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("ScratchPad font family").setDesc("Examples: monospace, Arial, 'Courier New'. Leave blank to use the editor default.").addText(text => text.setValue(this.plugin.settings.scratchFontFamily).onChange(async (value) => { this.plugin.settings.scratchFontFamily = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl, "Search highlight color", "The background color for the selected search result in the ScratchPad.", "scratchpadHighlightColor");

    }

    renderNotesSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Notes Tab Settings" });
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
        containerEl.createEl('h1', { text: 'Pinned Notes Settings' });
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

        new Setting(containerEl).setName('Sort Order').setHeading();
        new Setting(containerEl)
            .setName('Default sort order')
            .setDesc("Choose the default sort order for pinned notes when the plugin is loaded. To change the order click on the PINNED NOTES title in the main view.")
            .addDropdown(dropdown => dropdown
                .addOption('a-z', 'A-Z (Default)')
                .addOption('z-a', 'Z-A')
                .addOption('custom', 'Custom Order')
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
            .setName('Set Custom Order')
            .setDesc('Drag and drop the notes below to set your preferred manual order.');

        const draggableContainer = containerEl.createDiv('pinned-notes-order-container');
        this.renderDraggablePinnedNotes(draggableContainer);
    }

    renderAssetsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Assets Tab Settings" });
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
        containerEl.createEl("h1", { text: "Tasks Tab Settings" });
        new Setting(containerEl).setName("Display & Sorting").setHeading();
        new Setting(containerEl).setName("Task group heading font size").setDesc("The font size for the date/tag group headings (e.g., 'Overdue', 'Today'). Default is 13px.").addText(text => text.setValue(this.plugin.settings.taskHeadingFontSize).onChange(async value => { this.plugin.settings.taskHeadingFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task text font size").setDesc("The font size for the individual task items in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.taskTextFontSize).onChange(async value => { this.plugin.settings.taskTextFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Truncate long task text").setDesc("If enabled, long tasks will be shortened with '...'. If disabled, they will wrap to multiple lines.").addToggle(toggle => toggle.setValue(this.plugin.settings.taskTextTruncate).onChange(async (value) => { this.plugin.settings.taskTextTruncate = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show completed tasks for Today").setDesc("If enabled, tasks that you marked as complete today will appear in the lists (regardless of their due date).").addToggle(toggle => toggle.setValue(this.plugin.settings.showCompletedTasksToday).onChange(async (value) => { this.plugin.settings.showCompletedTasksToday = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task sort order").setDesc("The default order for tasks within each group.").addDropdown(dropdown => dropdown.addOption('dueDate', 'By Due Date (earliest first)').addOption('a-z', 'A-Z').addOption('z-a', 'Z-A').setValue(this.plugin.settings.taskSortOrder).onChange(async (value) => { this.plugin.settings.taskSortOrder = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Group tasks by").setDesc("Choose how to group tasks in the view. Second-clicking the Tasks tab will also toggle this.").addDropdown(dropdown => dropdown.addOption('date', 'Date (Overdue, Today, etc.)').addOption('tag', 'Tag').setValue(this.plugin.settings.taskGroupBy).onChange(async (value) => { this.plugin.settings.taskGroupBy = value; await this.saveAndUpdate(); this.refreshDisplay(); }));

        if (this.plugin.settings.taskGroupBy === 'date') {
            new Setting(containerEl).setName("Date Groups to Show").setHeading();
            const dateGroups = [{ key: 'overdue', name: 'Overdue' }, { key: 'today', name: 'Today' }, { key: 'tomorrow', name: 'Tomorrow' }, { key: 'next7days', name: 'Next 7 Days' }, { key: 'future', name: 'Future' },];
            dateGroups.forEach(g => { new Setting(containerEl).setName(g.name).addToggle(t => t.setValue(this.plugin.settings.taskDateGroupsToShow.includes(g.key)).onChange(async v => { const groups = this.plugin.settings.taskDateGroupsToShow; if (v && !groups.includes(g.key)) groups.push(g.key); else if (!v) this.plugin.settings.taskDateGroupsToShow = groups.filter(i => i !== g.key); await this.saveAndUpdate(); })); });
        }

        new Setting(containerEl).setName("Content & Appearance").setHeading();
        this.createIgnoredFolderList(containerEl, "Exclude folders from Task search", "Tasks in these folders will not appear in the 'Tasks' list.", 'taskIgnoreFolders');

        containerEl.createEl('h2', { text: 'Task Group Icons' });
        containerEl.createEl('p', { text: 'Customize the icon displayed next to each task group header.', cls: 'setting-item-description' });

        const taskGroupIconSettings = [
            { key: 'overdue', name: 'Overdue icon' },
            { key: 'today', name: 'Today icon' },
            { key: 'tomorrow', name: 'Tomorrow icon' },
            { key: 'next7days', name: 'Next 7 Days icon' },
            { key: 'future', name: 'Future icon' },
            { key: 'noDate', name: 'No Due Date icon' },
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
                .setButtonText('Reset All Task Group Icons')
                .setTooltip('Resets all task group icons to their original values')
                .onClick(async () => {
                    if (confirm('Are you sure you want to reset all task group icons?')) {
                        this.plugin.settings.taskGroupIcons = { ...DEFAULT_SETTINGS.taskGroupIcons };
                        await this.saveAndUpdate();
                        new Notice('All task group icons have been reset.');
                        this.refreshDisplay();
                    }
                }));

        new Setting(containerEl).setName("Task Group Backgrounds").setHeading();
        this.createRgbaColorSetting(containerEl, "Overdue", "Background color for the 'Overdue' task group.", "taskGroupColorOverdue");
        this.createRgbaColorSetting(containerEl, "Today", "Background color for the 'Today' task group.", "taskGroupColorToday");
        this.createRgbaColorSetting(containerEl, "Tomorrow", "Background color for the 'Tomorrow' task group.", "taskGroupColorTomorrow");
        this.createRgbaColorSetting(containerEl, "Next 7 Days", "Background color for the 'Next 7 Days' task group.", "taskGroupColorNext7Days");
        this.createRgbaColorSetting(containerEl, "Future", "Background color for 'Future' task group.", "taskGroupColorFuture");
        this.createRgbaColorSetting(containerEl, "No Due Date", "Background color for the 'No Due Date' task group.", "taskGroupColorNoDate");
        this.createRgbaColorSetting(containerEl, "Tag", "Background color for task groups when grouped by tag.", "taskGroupColorTag");
    }

    /**
     * Renders the entire "Dashboard" settings tab.
     * This is the final, corrected version that handles all events and state properly.
     */
    renderDashboardSettings() {
        const container = this.contentEl;
        container.empty();
        container.createEl('h1', { text: 'Dashboard Tab Settings' });

        this.draggedItem = null;
        this.placeholder = null;

        const handleMouseMove = (e) => {
            if (!this.draggedItem) return;
            const draggableContainer = this.draggedItem.closest('.pm-draggable-widget-list');
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
            const container = this.draggedItem.closest('.pm-draggable-widget-list');
            if (container) {
                const orderKey = container.dataset.orderKey;
                const title = container.dataset.title;
                const newOrder = Array.from(container.children).map(child => child.dataset.widgetKey);
                this.plugin.settings[orderKey] = newOrder;
                await this.saveAndUpdate();
                //new Notice(`${title} order saved.`);
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

        new Setting(container)
            .setName('Default Dashboard View')
            .setDesc('Choose which dashboard to show by default.')
            .addDropdown(dropdown => dropdown
                .addOption('tasks', 'Tasks Dashboard')
                .addOption('creation', 'File Creation Dashboard')
                .setValue(this.plugin.settings.defaultDashboardView)
                .onChange(async (value) => {
                    this.plugin.settings.defaultDashboardView = value;
                    //await this.saveAndUpdate();
                    await this.plugin.saveSettings();
                }));


        new Setting(container)
            .setName('Custom Date Formats for Parsing')
            .setDesc('For the "Date from Note Title" heatmap source. Provide a comma-separated list of formats to check for. The plugin will try them in order. E.g., DD-MM-YYYY,YYYY-MM-DD or MM-DD-YYYY, YYYY-MM-DD.')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD,DD-MM-YYYY')
                .setValue(this.plugin.settings.customDateFormats)
                .onChange(async (value) => {
                    this.plugin.settings.customDateFormats = value;
                    await this.plugin.saveSettings();
                }));

        container.createEl('div', { cls: 'setting-spacer' });
        this.renderWidgetSettings(container, 'Tasks Dashboard Widgets (Order and Toggle Display)', 'tasksDashboardWidgets', 'tasksDashboardOrder', DASHBOARDWIDGETS.tasks);
        container.createEl('div', { cls: 'setting-spacer' });
        
        
        new Setting(container).setName("Task Status Colours").setHeading();

        this.createRgbaColorSetting(
            container,
            "Cancelled",
            "Colour for cancelled tasks in widgets.",
            "taskStatusColorCancelled"
        );

        this.createRgbaColorSetting(
            container,
            "Overdue",
            "Colour for overdue tasks in widgets and heatmaps.",
            "taskStatusColorOverdue"
        );
       
        this.createRgbaColorSetting(
            container,
            "In Progress",
            "Colour for in-progress tasks in widgets.",
            "taskStatusColorInProgress"
        );


        this.createRgbaColorSetting(
            container,
            "Open",
            "Colour for open (to-do) tasks in widgets.",
            "taskStatusColorOpen"
        );

         this.createRgbaColorSetting(
            container,
            "Completed",
            "Colour for completed tasks in widgets and heatmaps.",
            "taskStatusColorCompleted"
        );
        
        container.createEl('div', { cls: 'setting-spacer' });
        
        this.renderWidgetSettings(container, 'Creation Dashboard Widgets (Order and Toggle Display)', 'creationDashboardWidgets', 'creationDashboardOrder', DASHBOARDWIDGETS.creation);
        container.createEl('div', { cls: 'setting-spacer' });
        
        container.createEl('div', { cls: 'setting-spacer' });

        container.createEl('h2', { text: 'Built-in Heatmap Links' });
        container.createEl('p', { text: 'Set a note path to open when clicking the total count on a built-in heatmap widget. Leave empty to disable.', cls: 'setting-item-description' });

        // Get all built-in creation heatmap widgets
        const creationWidgets = DASHBOARDWIDGETS.creation;

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


        container.createEl('div', { cls: 'setting-spacer' });

        const customHeatmapsContainer = container.createDiv();

        // --- Create the Collapsible Guide ---
        const guideContainer = container.createDiv({ cls: 'note-group-container' });

        // Check the saved state and apply 'is-collapsed' class if needed
        if (this.plugin.settings.isHeatmapGuideCollapsed) {
            guideContainer.addClass('is-collapsed');
        }

        // 1. Create the clickable header
        const header = guideContainer.createDiv({ cls: 'note-group-header' });
        const headerContent = header.createDiv({ cls: 'note-group-header-content' });
        const collapseIcon = headerContent.createDiv({ cls: 'note-group-collapse-icon' });
        setIcon(collapseIcon, 'chevron-down');
        headerContent.createSpan({ text: "Custom Heatmap Widget Guide" });

        header.addEventListener('click', () => {
            const isNowCollapsed = guideContainer.classList.toggle('is-collapsed');
            this.plugin.settings.isHeatmapGuideCollapsed = isNowCollapsed;
            this.plugin.saveSettings();
        });

        // 2. Create the content wrapper for the guide text
        const helpContentWrapper = guideContainer.createDiv({ cls: 'note-list-wrapper' });
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
            const filterRow = container.createDiv({ cls: 'pm-filter-row' });

            new Setting(filterRow)
                .setName(`Rule #${filterIndex + 1}`)
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('tag', 'Tag')
                        .addOption('filename', 'Filename')
                        .addOption('filepath', 'File Path')
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
                            if (this.heatmapUpdateTimer) clearTimeout(this.heatmapUpdateTimer);
                            this.heatmapUpdateTimer = setTimeout(async () => {
                                await this.saveAndUpdate();
                            }, 750);
                        });

                    // --- THE CORRECT FIX IS HERE ---
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
                    .setButtonText('Add Filter Rule')
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

            const heatmapBox = container.createDiv({ cls: 'pm-heatmap-config-box' });

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
                .setName('Date Source')
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
                .setName('Months Back')
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
                .setName('Months Forward')
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
                .setName('Note Link Path')
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
            const filtersContainer = heatmapBox.createDiv({ cls: 'pm-filters-container' });
            this.renderFilterRules(heatmap, filtersContainer);



            this.createRgbaColorSetting(heatmapBox, "Heatmap Color", "Set the color for this specific heatmap.", `customHeatmaps.${index}.color`);

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
                    .setButtonText("Delete Heatmap")
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
                .setButtonText("Add Heatmap")
                .setCta()
                .onClick(async () => {
                    // Add the new heatmap to settings
                    this.plugin.settings.customHeatmaps.push({
                        name: 'New Heatmap',
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

                    // --- FIX: Re-render ONLY this section ---
                    //this.renderCustomHeatmapsSection(container);
                    this.renderDashboardSettings();
                }));
    }



    // Add this function inside the PeriodSettingsTab class
    createFolderExclusionUI(containerEl, heatmap, heatmapIndex) {
        const exclusionContainer = containerEl.createDiv({ cls: 'pm-folder-exclusion-container' });
        new Setting(exclusionContainer)
            .setName("Excluded Folders")
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
                                await this.saveAndUpdate(); // 
                                renderExcludedList(); // Re-render only this list
                            }));
                });
            } else {
                excludedListEl.createEl('p', { text: 'No folders are currently excluded.', cls: 'setting-item-description' });
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
        containerEl.createEl('h2', { text: 'Theme Management' });

        // Display an indicator if a theme is currently applied
        if (this.plugin.settings.appliedTheme) {
            new Setting(containerEl)
                .setName('Currently Applied Theme: ' + this.plugin.settings.appliedTheme)
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
                .settingEl.addClass('applied-theme-indicator');
        }

        // Find theme files in the plugin's "themes" directory
        const themesFolderPath = this.plugin.manifest.dir + '/Themes';
        const themeFiles = await this.getThemeFiles(themesFolderPath);

        if (!themeFiles) {
            containerEl.createEl('p', { text: 'The Themes folder could not be found in the plugin directory.' });
            return;
        }

        if (themeFiles.length === 0) {
            containerEl.createEl('p', { text: 'No theme files (.json) were found in the Themes folder.' });
            return;
        }

        // Create the main two-column layout
        const mainContainer = containerEl.createDiv({ cls: 'theme-settings-container' });
        const listContainer = mainContainer.createDiv({ cls: 'theme-list-container' });
        this.previewContainer = mainContainer.createDiv({ cls: 'theme-preview-wrapper' });

        listContainer.createEl('h3', { text: 'Available Themes' });

        // Sort the theme files alphabetically before rendering.
        themeFiles.sort((a, b) => a.localeCompare(b));

        // Create a list item for each theme file
        themeFiles.forEach(file => {
            const themeName = file.split('/').pop().replace('.json', '');
            const itemEl = listContainer.createDiv({ text: themeName, cls: 'theme-list-item' });

            if (themeName === this.plugin.settings.appliedTheme) {
                itemEl.classList.add('is-active');
            }

            // Add a click listener to each theme item to render its preview
            itemEl.addEventListener('click', async () => {
                Array.from(listContainer.querySelectorAll('.theme-list-item')).forEach(child => child.classList.remove('is-active'));
                itemEl.classList.add('is-active');
                this.selectedThemeFile = { name: file };

                try {
                    const fileContent = await this.app.vault.adapter.read(file);
                    const themeSettings = JSON.parse(fileContent);
                    this.renderThemePreview(themeSettings, themeName);
                } catch (e) {
                    new Notice(`Error reading theme file: ${themeName}`);
                    console.error('Theme file read error:', e);
                }
            });
        });

        const themeItems = Array.from(listContainer.querySelectorAll('.theme-list-item'));
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

    async getThemeFiles(themesFolderPath) {
        try {
            if (!await this.app.vault.adapter.exists(themesFolderPath)) return null;
            const list = await this.app.vault.adapter.list(themesFolderPath);
            return list.files.filter(file => file.endsWith('.json'));
        } catch (e) {
            console.error("Error accessing themes folder:", e);
            return null;
        }
    }

    renderInitialPreview() {
        if (!this.previewContainer) return;
        this.previewContainer.empty();
        this.previewContainer.createEl('h3', { text: 'Theme Preview' });
        const placeholder = this.previewContainer.createDiv({ cls: 'theme-preview-placeholder' });
        placeholder.setText('Select a theme to see a preview and apply it.');
    }

    renderThemePreview(settings, fileName) {
        if (!this.previewContainer) return;
        this.previewContainer.empty();

        this.previewContainer.createEl('h3', { text: 'Live Theme Preview' });

        const tabContainer = this.previewContainer.createDiv({ cls: 'theme-preview-tabs' });
        const lightTabBtn = tabContainer.createEl('button', { text: 'Light Mode' });
        lightTabBtn.setAttribute('data-mode', 'light');

        const darkTabBtn = tabContainer.createEl('button', { text: 'Dark Mode' });
        darkTabBtn.setAttribute('data-mode', 'dark');

        const previewContent = this.previewContainer.createDiv();

        const render = (mode) => {
            this.activePreviewMode = mode;
            previewContent.empty();
            previewContent.className = '';
            previewContent.addClass('theme-preview-pane');

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
            this.activePreviewMode = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
        }

        // Trigger the click on the correct button based on the *stored* preview mode.
        if (this.activePreviewMode === 'dark') {
            darkTabBtn.click();
        } else {
            lightTabBtn.click();
        }

        const initialMode = this.activePreviewMode || (document.body.classList.contains('theme-dark') ? 'dark' : 'light');
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
        container.addClass(`theme-preview-pane-${mode}`);

        // --- Calendar Grid Preview ---
        const calendarGridHeader = container.createEl('div', { cls: 'preview-section-header' });

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
        const calendarWrapper = container.createDiv({ cls: `preview-section-wrapper ${mode}` });
        calendarWrapper.style.backgroundColor = isLight ? (settings.backgroundColorLight || '#f5f5f5') : (settings.backgroundColorDark || '#2a2a2a');

        const table = calendarWrapper.createEl('table', { cls: 'preview-calendar-grid' });

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
        const cwContent = cwCell.createDiv({ cls: 'preview-day-content' });
        const cwNumber = cwContent.createDiv({ text: '42', cls: 'preview-day-number' });

        // Style the week number based on theme settings
        if (this.getPreviewColor(settings, 'highlightTodayLabels', true) && this.getPreviewColor(settings, 'highlightTodayPWLabel', true)) {
            cwNumber.style.color = this.getPreviewColor(settings, isLight ? 'todayCircleColorLight' : 'todayCircleColorDark');
        } else {
            cwNumber.style.color = this.getPreviewColor(settings, isLight ? 'weekNumberFontColorLight' : 'weekNumberFontColorDark');
        }

        // Add the exclusive weekly note dot to the CW column
        if (this.getPreviewColor(settings, 'showWeeklyNoteDot', true)) {
            const weeklyDotsContainer = cwContent.createDiv({ cls: 'preview-dots-container' });
            const weeklyNoteDot = weeklyDotsContainer.createDiv({ cls: 'preview-dot' });
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
            const dayContent = td.createDiv({ cls: 'preview-day-content' });
            const dayNumber = dayContent.createDiv({ text: i.toString(), cls: 'preview-day-number' });

            const dotsToShow = dotDistribution.get(i);
            if (dotsToShow && dotsToShow.length > 0) {
                const dotsContainer = dayContent.createDiv({ cls: 'preview-dots-container' });
                dotsToShow.forEach(color => {
                    const dot = dotsContainer.createDiv({ cls: 'preview-dot' });
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

        const tasksWrapper = container.createDiv({ cls: `preview-section-wrapper ${mode}` });
        tasksWrapper.style.backgroundColor = isLight ? (settings.backgroundColorLight || '#f5f5f5') : (settings.backgroundColorDark || '#2a2a2a');

        const taskGroups = [
            { name: "Overdue", colorKey: "taskGroupColorOverdue", count: 2, icon: "alarm-clock-off" },
            { name: "Today", colorKey: "taskGroupColorToday", count: 3, icon: "target" },
            { name: "Tomorrow", colorKey: "taskGroupColorTomorrow", count: 1, icon: "calendar-days" }, // "Tomorrow" maps to "Next 7 Days" icon
            { name: "Future", colorKey: "taskGroupColorFuture", count: 5, icon: "telescope" },
            { name: "No Date", colorKey: "taskGroupColorNoDate", count: 4, icon: "help-circle" }
        ];


        taskGroups.forEach(group => {
            const taskGroupEl = tasksWrapper.createDiv({ cls: 'preview-task-group' });
            taskGroupEl.style.backgroundColor = this.getPreviewColor(settings, group.colorKey);

            // This wrapper keeps the icon and title together on the left
            const contentWrapper = taskGroupEl.createDiv({ cls: 'preview-task-content-wrapper' });

            // Add the group's main icon (e.g., target, telescope)
            const iconEl = contentWrapper.createDiv({ cls: 'preview-task-icon' });
            setIcon(iconEl, group.icon);

            // The text now becomes "Overdue (2)", "Today (3)", etc.
            const titleSpan = contentWrapper.createSpan({
                text: `${group.name} (${group.count})`,
                cls: 'preview-task-title'
            });

            const collapseIconEl = taskGroupEl.createDiv({ cls: 'preview-collapse-icon' });
            setIcon(collapseIconEl, 'chevron-up');

            // Set the text color for all elements inside the group
            const textColor = this.getPreviewColor(settings, isLight ? 'taskGroupTextColorLight' : 'taskGroupTextColorDark');
            contentWrapper.style.color = textColor;
            collapseIconEl.style.color = textColor;
        });


        // --- 3. Create the Dot Color Key ---
        const keyContainer = container.createDiv({ cls: 'preview-dot-key-container' });
        keyContainer.createEl('h5', { text: 'Calendar Grid Dot Color Key' });

        // Create a mapping of the dot colors to their names
        const dotKeyMap = new Map([
            [this.getPreviewColor(settings, 'weeklyNoteDotColor', '#a073f0'), 'Weekly Note'],
            [this.getPreviewColor(settings, 'dailyNoteDotColor', '#4a90e2'), 'Daily Note'],
            [this.getPreviewColor(settings, 'noteCreatedColor', '#4caf50'), 'Created Note'],
            [this.getPreviewColor(settings, 'noteModifiedColor', '#ff9800'), 'Modified Note'],
            [this.getPreviewColor(settings, 'assetDotColor', '#ff0000'), 'Asset'],
            [this.getPreviewColor(settings, 'calendarEventDotColor', '#c864c8'), 'Event'],
            [this.getPreviewColor(settings, 'taskDotColor', '#80128D'), 'Task']
        ]);

        // Loop through the map and create a key item for each dot type
        for (const [color, name] of dotKeyMap.entries()) {
            const keyItem = keyContainer.createDiv({ cls: 'preview-dot-key-item' });
            const keyDot = keyItem.createDiv({ cls: 'preview-dot-key-swatch' });
            keyDot.style.backgroundColor = color;
            keyItem.createSpan({ text: name });
        }
    }

    renderImportExportTab() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Import & Export Settings" });

        // --- EXPORT ---
        new Setting(containerEl)
            .setName("Export Settings")
            .setDesc("Save your plugin settings to a JSON file. Two options: all plugin settings or theme settins only. This is useful for backing up all your settings or sharing your theme configuration with others.")
            .addButton(button => {
                button
                    .setButtonText("Export All Settings")
                    .setIcon("save")
                    .setTooltip("Save all plugin settings to a file")
                    .onClick(() => this.handleExport('all'));

                button.buttonEl.style.cursor = 'pointer';
            })
            .addButton(button => {
                button
                    .setButtonText("Export Theme Only")
                    .setIcon("palette")
                    .setTooltip("Save only colors, fonts, and sizes to a theme file")
                    .onClick(() => this.handleExport('theme'));

                button.buttonEl.style.cursor = 'pointer';
            });

        // --- IMPORT ---
        new Setting(containerEl)
            .setName("Import Settings")
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
            fileName = `calendar-period-week-notes-theme.json`;

        } else { // 'all'
            // Create a copy to avoid modifying the live settings object
            settingsToExport = { ...this.plugin.settings };
            // Add the 'all' settings identifier
            settingsToExport.__exportType = "all";
            fileName = `calendar-period-week-notes-settings.json`;
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
                let title = 'Overwrite Settings?';
                let message = 'This appears to be an older settings file. Are you sure you want to import it? Your current configuration will be overwritten.';
                let confirmText = 'Import';

                // Customize messages based on the export type
                if (exportType === 'theme') {
                    title = 'Import Theme Settings?';
                    message = 'You are about to import a theme file. This will overwrite only your current appearance settings (colors, fonts, etc.).';
                    confirmText = 'Import Theme';
                } else if (exportType === 'all') {
                    title = 'Import All Settings?';
                    message = 'You are about to import a full settings file. This will overwrite your ENTIRE current configuration for this plugin.';
                    confirmText = 'Import All';
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
        containerEl.createEl("h1", { text: "About Calendar Period Week Notes" });

        containerEl.createEl("p", {
            text: "This plugin provides two comprehensive calendar views together with an integrated panel containing a scratchpad area, notes, tasks, and assets."
        });

        new Setting(containerEl)
            .setName("Support the Developer")
            .setDesc("If you find this plugin useful, please consider supporting its development. It's greatly appreciated!")
            .addButton(button => {
                button
                    .setButtonText("☕ Buy Me a Coffee")
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
        containerEl.empty();

        // We are setting the HTML directly to bypass the MarkdownRenderer and avoid plugin conflicts.
        containerEl.innerHTML = `
        <h2>🚀 Quick Start: Initial Setup</h2>
        <hr>
        <p>Welcome, to get the most out of this plugin, it's recommended to configure a few key settings to match your workflow.</p>
        <hr>
        <h3>1. Set Up Your Scratchpad Note</h3>
        <p>The <strong>Scratchpad</strong> tab needs to point to a note file in your vault. By default, it looks for <code>ScratchPad.md</code> in your vault's root.</p>
        <ul>
            <li><strong>Go to:</strong> "ScratchPad Tab" → "ScratchPage note path"></li>
            <li><strong>Action:</strong> Set the <strong>ScratchPad note path</strong> to any note you prefer. If it doesn't exist, the plugin will create it for you.</li>
        </ul>
        <hr>
        <h3>2. Configure Your Daily Notes</h3>
        <p>For calendar and list dots and click-to-open features to work, the plugin needs to know where your daily notes are.</p>
        <ul>
            <li><strong>Go to:</strong> "Calendar Functional" → "Daily Notes"</li>
            <li><strong>Action:</strong> Set your <strong>Daily Notes folder</strong> and <strong>Daily note format</strong> to match setup (e.g., YYYY-MM-DD).</li>
        </ul>
        <hr>
        <h3>3. Define Your Task Format</h3>
        <p>For the plugin to recognise your task due dates, they <strong>must</strong> use the <code>📅</code> emoji for due dates. Download the Tasks plugin for improved compatibility. The following examples show the format of tasks to be used:</p>
        <p><strong>Due Dates:</strong></p>
        <pre>- [ ] My task with a due date 📅 2025-10-26</pre>
        <pre>- [ ] Review project notes #work 📅 2025-11-01</code></pre>
        <p><strong>Completion Dates:</strong></p>
        <pre>- [x] My completed task 📅 2025-10-26 ✅ 2025-09-19</pre>
        <p>NOTE: If you do not use this Task format then you can toggle off the Tasks Tab in the "General Tab" → "Tab Visibility" section.</p>
        <hr>
        <h3>4. (Optional) Set Your Period/Week Start Date</h3>
        <p>If you plan to use the custom Period/Week calendar system (e.g., "P7W4"), you should set its starting date. The period/week calendar system, used by some companies for financial year tracking, assumes 13 periods with 4 weeks in each period.</p>
        <ul>
            <li><strong>Go to:</strong> "Calendar Functional" → "Period/Week System"</li>
            <li><strong>Action:</strong> Set the <strong>Start of Period 1 Week 1</strong> to the Sunday date of your choice.</li>
        </ul>
    `;
    }

}
export default PeriodMonthPlugin;