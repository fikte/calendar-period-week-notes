// Import necessary components from the Obsidian API.
const { Plugin, ItemView, PluginSettingTab, Notice, TFile, TFolder, Setting, Modal, Menu, AbstractInputSuggest, moment, MarkdownRenderer, setIcon} = require("obsidian");

// Define a unique type for this plugin's view.
const VIEW_TYPE_PERIOD = "calendar-period-week";

// Define the default settings for the plugin. This object is used as a fallback and for resetting configurations.
const DEFAULT_SETTINGS = {
    // General Display
    fontSize: "13px",
    dayNumberFontSize: "15px",
    navButtonHeight: "28px",
    headerRowBold: false,
    pwColumnBold: false,
    showCalendarGridLines: false,
    monthColorLight: "rgba(51, 51, 51, 1)", // Dark Grey for light mode
    monthColorDark: "rgba(255, 255, 255, 1)", // White for dark mode
    monthTitleFormat: "MMM YYYY",
    mainMonthYearTitleFontSize:"20px",
    mainMonthYearTitleBold: false,
    tabTitleFontSize: "14px",
    tabTitleBold: false,
    tabDisplayMode: "iconOnly", 
    mobileTabDisplayMode: "iconOnly", 
    collapsedNoteGroups: {},
    tabOrder: ["scratch", "notes", "tasks", "assets"],
    tabIcons: {
        scratch: "pencil",
        notes: "files",
        tasks: "check-circle",
        pinned: "pin",
        assets: "image-file"
    },
    assetsLookbackDays: 7,
    assetsDefaultView: 'grid',
    tabVisibility: {
        scratch: true,
        notes: true,
        tasks: true,
        assets: true,
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
        showPreviewToggle: false,
        showAddTaskButton: true,
        taskFormat: "- [ ] #Tag | 📅 {friday}"
    },

    // Notes Tab
    ignoreFolders: [],
    pinTag: "pin",
    notesViewMode: "recent",
    notesFontSize: "14px",
    notesBold: false,
    notesOpenAction: "new-tab",
    notesLineHeight: 1.2,
    notesLookbackDays: 7,
    showNoteStatusDots: true,
    showNoteTooltips: true,

    //Assets 
    hiddenAssetTypes: "base,canvas",
    showUnusedAssetsIndicator: true, 
    assetsOpenAction: "new-tab",
    
    // Calendar Dots & Popups
    showOtherNoteDot: true,
    showModifiedFileDot: true,
    otherNoteIgnoreFolders: [],
    otherNoteHoverDelay: 100,
    popupHideDelay: 100,
    popupGap: -2,
    otherNotePopupFontSize: "13px",
    calendarDotSize: 4,
    showAssetDot: true,
    assetDotColor: "rgba(255, 0, 0, 1)", // Red
    assetIgnoreFolders: [],

    // Task Count Badge
    taskIndicatorStyle: "heatmap", // 'none', 'badge', or 'heatmap'
    taskBadgeFontSize: "9px",
    taskBadgeColor: "rgba(100, 149, 237, 0.6)", // Cornflower Blue
    taskBadgeFontColor: "rgba(255, 255, 255, 1)", // White
    taskHeatmapStartColor: "rgba(100, 149, 237, 0.3)", // Cornflower Blue
    taskHeatmapMidColor: "rgba(255, 127, 80, 0.45)",    // Coral
    taskHeatmapEndColor: "rgba(255, 71, 71, 0.6)",     // Red
    taskHeatmapMidpoint: 5,
    taskHeatmapMaxpoint: 10,
    showTaskDot: false, 
    taskDotColor: "rgba(200, 100, 200, 1)", 

    // Daily Notes
    dailyNotesFolder: "Daily Notes",
    dailyNoteDateFormat: "YYYY-MM-DD",
    dailyNoteTemplatePath: "",
    dailyNoteOpenAction: "new-tab",

    //period / week numbers 
    showWeekNumbers: true,
    weekNumberType: "calendar", // 'period' or 'calendar'
    weekNumberColumnLabel: "CW",

    // Functional
    autoReloadInterval: 5000,
    startOfPeriod1Date: "2025-03-02",
    showPWColumn: false,
    pwFormat: "P#W#",
    enableRowHighlight: true,
    enableColumnHighlight: true,
    enableRowToDateHighlight: false,
    highlightCurrentWeek: false,

    // Colors
    selectedTabColor: "rgba(102, 102, 102, 1)",
    todayHighlightColorLight: "rgba(255, 255, 0, 0.3)", // Light yellow
    todayHighlightColorDark: "rgba(102, 102, 102, 1)",   // Grey
    notesHoverColor: "rgba(171, 171, 171, 0.15)",
    dailyNoteDotColor: "rgba(74, 144, 226, 1)",
    noteCreatedColor: "rgba(76, 175, 80, 1)",
    noteModifiedColor: "rgba(255, 152, 0, 1)",
    otherNoteDotColor: "rgba(76, 175, 80, 1)",
    calendarModifiedDotColor: "rgba(255, 152, 0, 1)",
    rowHighlightColorLight: "rgba(100, 149, 237, 0.2)", // Lighter Cornflower Blue
    rowHighlightColorDark: "rgba(51, 51, 51, 1)",     // Dark Grey
    dateCellHoverColorLight: "rgba(0, 0, 0, 0.075)",     // Light Grey
    dateCellHoverColorDark: "rgba(51, 51, 51, 1)", 
    assetDotColor: "rgba(255, 0, 0, 1)",
    todayHighlightStyle: "circle", // 'cell' or 'circle'
    todayCircleColor: "rgba(40, 120, 240, 1)", // Cornflower Blue
    
    // Weekly Notes (NEW)
    enableWeeklyNotes: true,
    weeklyNoteFolder: "Weekly Notes",
    weeklyNoteFormat: "YYYY-[W]CW", // e.g., 2025-W38
    weeklyNoteTemplate: "",
    showWeeklyNoteDot: true,
    weeklyNoteDotColor: "rgba(160, 115, 240, 1)",

    // Tasks Tab Settings
    taskIgnoreFolders: [],
    taskSortOrder: "dueDate",
    taskGroupBy: "date",
    taskDateGroupsToShow: ["overdue", "today", "tomorrow", "next7days", "future"],
    taskTextTruncate: true,
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
    taskGroupColorOverdue: "rgba(255, 71, 71, 0.15)",
    taskGroupColorToday: "rgba(255, 165, 0, 0.15)",
    taskGroupColorTomorrow: "rgba(64, 158, 255, 0.15)",
    taskGroupColorNext7Days: "rgba(77, 171, 185, 0.15)",
    taskGroupColorFuture: "rgba(128, 128, 128, 0.15)",
    taskGroupColorNoDate: "rgba(105, 180, 105, 0.15)",
    taskGroupColorTag: "rgba(105, 105, 105, 0.15)",
    showPreviewToggle: true, 
    showAddTaskButton: true,
    collapsedTaskGroups: {},
    collapsedAssetGroups: {},
};

// A string containing all the CSS for the plugin. It's injected into the document head on load.
const PLUGIN_STYLES = `
body.theme-light {
    --month-color-themed: var(--month-color-light);
    --today-highlight-color-themed: var(--today-highlight-color-light);
    --date-cell-hover-color-themed: var(--date-cell-hover-color-light);
}
body.theme-dark {
    --month-color-themed: var(--month-color-dark);
    --today-highlight-color-themed: var(--today-highlight-color-dark);
    --date-cell-hover-color-themed: var(--date-cell-hover-color-dark);
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
  font-weight: var(--main-month-year-title-weight); 
  color: var(--month-color-themed);
  white-space: nowrap;
  cursor: pointer;
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
.period-calendar-table td {
  cursor: pointer;
  overflow: hidden;
  position: relative;
}
.period-month-container:not(.hide-grid) .period-calendar-table td {
    border: 1px solid var(--background-modifier-border);
}

.period-month-container.hide-grid.tabs-are-visible:not(.vertical-view-active) .period-calendar-table tbody tr:last-child td {
  border-bottom: 1px solid var(--background-modifier-border);
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

.period-calendar-table td:not(.pw-label-cell):hover .day-content {
  background-color: var(--date-cell-hover-color-themed);
  border-radius: 6px;
}
body .period-month-container.today-style-cell .today-cell .day-content {
  background-color: var(--today-highlight-color-themed);
  border-radius: 6px;
}
.period-month-container.today-style-circle .today-cell {
    position: relative; 
}
.period-month-container.today-style-circle .today-cell .day-number {
    
    background-color: var(--today-circle-color);
    /*color: var(--text-on-accent);*/
    position: relative;
    z-index: 2;
    border-radius: 50%; /* Make it a circle */
    width: 1.6em;        /* Ensure equal width */
    height: 1.6em;       /* Ensure equal height */
    display: flex;       /* Use flexbox for centering */
    align-items: center; /* Center vertically */
    justify-content: center; /* Center horizontally */
    margin: auto;        /* Center the circle in its parent */
}

.period-month-container.today-style-number .today-cell .day-number {
    /*color: var(--text-on-accent);*/
    background-color: var(--today-circle-color);
    border-radius: 6px; /* A slightly smaller corner radius */
    padding: 1px 3px; /* Minimal padding for a tight fit */
    display: inline-block;
    position: relative;
    z-index: 2; /* Ensures it's drawn on top of the heatmap */
}

.period-calendar-table .pw-label-cell,
.period-calendar-table .week-number-cell {
  font-weight: var(--pw-column-font-weight);
  cursor: default;
  font-size: var(--header-font-size);
  position: relative;
}

.week-dots-container {
    position: absolute;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
}

/* --- Calendar Layout Styles --- */
.period-month-container.layout-spacious .day-content {
    height: 3.4em;
}
.period-month-container.layout-normal .day-content {
    height: 3.0em;
}
.period-month-container.layout-condensed .day-content {
    height: 2.6em; /* Even smaller height */
    
}


/* Layout-specific rules for both dot containers */
.period-month-container.layout-spacious .dots-container,
.period-month-container.layout-normal .week-dots-container {
    bottom: 4px;
}
.period-month-container.layout-normal .dots-container,
.period-month-container.layout-normal .week-dots-container {
    bottom: 2px;
}
.period-month-container.layout-condensed .dots-container,
.period-month-container.layout-condensed .week-dots-container {
    bottom: 1px; /* Moves dots closer to the bottom edge */
}


/* The weekly dot now just sets the color and re-uses .calendar-dot for its size */
.weekly-note-dot {
    background-color: var(--weekly-note-dot-color);
}

/* --- Calendar Day Content & Dots (REFACTORED) --- */
.day-content {
    display: grid; 
    grid-template-rows: auto 1fr minmax(10px, auto); /* 3 rows: badge(auto), number(fills space), dots(auto) */
    grid-template-areas:  /* Name the grid areas for clarity */
        "badge"
        "number"
        "dots";
    height: 3.5em;
    position: relative; /* Keep for popups */
    border-radius: 6px;
    box-sizing: border-box;
    transition: background-color 0.2s ease-in-out;
}

.day-number {
    grid-area: number; /* Place in the 'number' area */
    align-self: center;  /* Center vertically in its row */
    justify-self: center; /* Center horizontally */
    font-size: var(--day-number-font-size);
}

.day-number-other-month {
    opacity: 0.6;
}

.dots-container {
    grid-area: dots; /* Place in the 'dots' area */
    align-self: end; /* Align to the bottom of its row */
    padding-bottom: 4px; /* Creates space from the bottom edge */
    
    /* Simplified styles, as absolute positioning is no longer needed */
    display: flex;
    gap: 3px;
    justify-content: center;
    width: 100%;
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
}
.note-tab-header {
  display: flex;
  flex-shrink: 0;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
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
  padding: 4px 4px 48px;
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
.note-row:hover, .task-row:hover, .note-row:focus, .task-row:focus {
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

/* --- Task Group Collapse Styles --- */
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
  overflow: hidden; /* Keep overflow hidden */
  transition: max-height 0.3s ease-in-out, margin-top 0.3s ease-in-out; /* Animate max-height instead */
  max-height: 1000px; /* A large value that can contain all possible tasks */
  margin-top: 6px;
}

.task-group-container.is-collapsed .task-list-wrapper {
  max-height: 0; /* Animate the height to zero */
  margin-top: 0;
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
.task-row .task-text.completed {
  text-decoration: line-through;
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

/* --- Popups & Tooltips --- */
.other-notes-popup, .custom-suggestion-container {
  position: absolute; 
  z-index: 100; 
  background-color: var(--background-secondary); 
  border: 1px solid #4a4a4a; 
  border-radius: 15px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
  padding: 8px; 
  max-height: 200px; 
  overflow-y: auto;
  max-width: 600px;
}
.custom-suggestion-container { 
  z-index: 999; 
  margin-top: 4px; 
}
.other-notes-popup-item {
  display: flex; 
  align-items: flex-start; 
  gap: 8px; 
  padding: 8px; 
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer; 
  white-space: normal;
  word-break: break-word; 
  text-overflow: ellipsis; 
  font-size: var(--other-note-popup-font-size);
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
  padding: 0 0.5rem; 
}
.vertical-month-wrapper { 
  margin-bottom: 2rem; 
}
.vertical-month-title {
  font-size: var(--main-month-year-title-font-size);
  font-weight: var(--main-month-year-title-weight);
  color: var(--month-color-themed);
  position: sticky; 
  top: 0; 
  background-color: var(--background-secondary);
  z-index: 10;
  margin: 0.6rem 0; 
  height: 2rem; 
  display: flex; 
  align-items: center; 
  justify-content: center;
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
  font-size: 12px; 
  padding: 2px 0; 
}
.is-mobile .period-calendar-table .day-number { 
  font-size: 13px; 
}

.period-calendar-table .pw-label-cell .day-number,
.period-calendar-table .week-number-cell .day-number {
    font-size: inherit; /* Inherit the correct font size from the parent cell */
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
    color: var(--icon-color);
    background-color: var(--background-modifier-hover);
    cursor: pointer;
    visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transition: background-color 0.1s ease-in-out;
}
.search-input-clear-btn:hover {
    color: var(--icon-color-hover);
    background-color: var(--background-modifier-border);
}
.search-input-clear-btn .svg-icon {
    width: 14px;
    height: 14px;
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
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 8px;
}
.asset-grid-item {
    flex-basis: calc(50% - 8px); 
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
  border-color: rgba(200, 200, 200, 0.75); /* A lighter, semi-transparent gray */
}

/* --- Settings Tabs --- */
.period-settings-container {
  display: flex;
  height: 100%;
}
.period-settings-nav {
  display: flex;
  flex-direction: column;
  padding-right: 1.5rem;
  border-right: 1px solid var(--background-modifier-border);
  width: 170px;
  flex-shrink: 0;
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

/* --- Final & Unified Task Styling --- */
.task-checkbox-symbol {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.35em;
    height: 1.35em;
    font-size: 1em;
    cursor: pointer;
    flex-shrink: 0;
    border: 1px solid var(--text-faint);
    border-radius: 50%;
    transition: all 0.1s ease-in-out;
    background-color: var(--background-primary);
}
.task-row:hover .task-checkbox-symbol,
.other-notes-popup-item:hover .task-checkbox-symbol {
    border-color: var(--text-normal);
}
.task-checkbox-symbol:has(.svg-icon) {
    border-color: transparent !important;
}
.task-checkbox-symbol.is-completed {
    background-color: var(--interactive-accent);
    border-color: var(--interactive-accent) !important;
}
.task-checkbox-symbol .svg-icon {
    width: 100%;
    height: 100%;
    padding: 0.1em;
    fill: currentColor;
}
.task-checkbox-symbol.is-completed .svg-icon {
    color: var(--text-on-accent) !important;
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
  max-height: 2000px; /* A large value to accommodate many notes */
  margin-top: 4px;
}
.note-group-container.is-collapsed .note-list-wrapper {
  max-height: 0;
  margin-top: 0;
}

/* Colors for custom icons */
.task-row .task-checkbox-symbol .svg-icon[data-lucide="map-pin"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="map-pin"] { color: var(--text-accent) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="flame"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="flame"] { color: var(--text-warning) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="slash"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="slash"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="piggy-bank"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="piggy-bank"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="thumbs-up"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="thumbs-up"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="trophy"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="trophy"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="arrow-up"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="arrow-up"] { color: var(--text-success) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="thumbs-down"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="thumbs-down"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="arrow-down"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="arrow-down"] { color: var(--text-error) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="star"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="star"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="lightbulb"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="lightbulb"] { color: var(--color-yellow) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="bookmark"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="bookmark"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="info"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="info"] { color: var(--color-blue) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="help-circle"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="help-circle"] { color: var(--color-cyan) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="key"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="key"] { color: goldenrod !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="minus"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="minus"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="quote"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="quote"] { color: var(--text-muted) !important; }
.task-row .task-checkbox-symbol .svg-icon[data-lucide="arrow-right"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="arrow-right"],
.task-row .task-checkbox-symbol .svg-icon[data-lucide="arrow-left"],
.other-notes-popup-item .task-checkbox-symbol .svg-icon[data-lucide="arrow-left"] { color: var(--text-normal) !important; }

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

/**
 * Provides autocomplete suggestions for Markdown file paths in a text input.
 */
class TemplateFileSuggest extends AbstractInputSuggest {
    constructor(app, inputEl) {
        super(app, inputEl);
    }

    getSuggestions(query) {
        const markdownFiles = this.app.vault.getMarkdownFiles();
        const lowerCaseQuery = query.toLowerCase();
        if (!lowerCaseQuery) return markdownFiles;
        return markdownFiles.filter(file => file.path.toLowerCase().includes(lowerCaseQuery));
    }

    renderSuggestion(file, el) { el.setText(file.path); }

    selectSuggestion(file) {
        this.inputEl.value = file.path;
        this.inputEl.dispatchEvent(new Event("input")); 
        this.close();
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
    // --- FIX END ---

    const weekNumber = Math.floor(daysSinceStart / 7);
    const periodIndex = Math.floor(weekNumber / 4);
    
    const period = ((periodIndex % 13) + 13) % 13 + 1;
    const week = ((weekNumber % 4) + 4) % 4 + 1;

    return { period, week, weekSinceStart: weekNumber + 1 };
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


/**
 * The main view class for the plugin, handling all rendering and user interaction.
 */
class PeriodMonthView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;

        // --- State Management ---
        this.displayedMonth = new Date(); // The month currently shown in the calendar.
        this.isVerticalView = false;      // Toggles between single-month and vertical scroll view.
        this.isCalendarCollapsed = false; // Toggles the visibility of the calendar grid.
        this.isScratchpadPreview = false; // Toggles scratchpad between edit and preview mode.
        this.activeTab = null;            // Tracks the currently selected tab ('scratch', 'notes', etc.).
        
        // --- Search and Data States ---
        this.notesViewMode = this.plugin.settings.notesViewMode;
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
        this.tasksByDate = new Map();
        this.taskCache = new Map(); // Caches task content of files to detect changes.
        this.isAssetsGridView = this.plugin.settings.assetsDefaultView === 'grid';
        
        // --- UI and Event Handling ---
        this.scratchWrapperEl = null;
        this.scratchpadViewToggleBtn = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.popupEl = null;
        this.taskRefreshDebounceTimer = null;
        this.calendarRefreshDebounceTimer = null;
        this.titleUpdateTimeout = null;
        //this.isAssetsGridView = false;
        this.existingWeeklyNotes = new Set();

        this.taskStatusIconMap = {
            // Standard Tasks
            '/': 'slash',       // In Progress
            '-': 'minus',       // Cancelled
            '>': 'arrow-right', // Forwarded
            '<': 'arrow-left',  // Scheduling
            // Extended Tasks from your list
            '?': 'help-circle', // Question
            '!': 'flame',       // Important
            '*': 'star',        // Star
            '"': 'quote',       // Quote
            'l': 'map-pin',     // Location
            'b': 'bookmark',    // Bookmark
            'i': 'info',        // Information
            'S': 'piggy-bank',  // Savings
            'I': 'lightbulb',   // Idea
            'p': 'thumbs-up',   // Pros
            'c': 'thumbs-down', // Cons
            'f': 'flame',       // Fire (using 'flame' as 'siren' can be too strong)
            'k': 'key',         // Key
            'w': 'trophy',      // Win
            'u': 'arrow-up',    // Up
            'd': 'arrow-down',  // Down
        };
    }

    _renderTaskSymbol(checkboxEl, task) {
        checkboxEl.empty();
        checkboxEl.className = 'task-checkbox-symbol'; // Reset classes

        const status = task.status;
        const iconName = this.taskStatusIconMap[status];

        // Case 1: Task is completed
        if (status.toLowerCase() === 'x') {
            setIcon(checkboxEl, 'check');
            checkboxEl.addClass('is-completed');
            checkboxEl.style.width = '1.25em';
            checkboxEl.style.height = '1.25em';
            
            checkboxEl.style.backgroundColor = 'var(--interactive-accent)';
            checkboxEl.style.border = 'none';
            checkboxEl.style.borderRadius = '50%';

            // --- THIS IS THE CORRECTED STYLING FOR THE TICK ---
            const svgEl = checkboxEl.querySelector('.svg-icon');
            if (svgEl) {
                svgEl.style.width = '75%';
                svgEl.style.height = '75%';
                svgEl.style.fill = 'none'; // Do not fill the shape
                svgEl.style.stroke = 'var(--text-on-accent)'; // Use high-contrast color for the line
                svgEl.style.strokeWidth = '3px'; // Make the line thick and clear
                svgEl.style.color = 'unset'; // Unset color to prevent conflicts
            }
        
        // Case 2: Task has a custom icon
        } else if (iconName) {
            setIcon(checkboxEl, iconName);
            const color = this.getIconColor(iconName);
            const svgEl = checkboxEl.querySelector('.svg-icon');
            if (svgEl) {
                svgEl.style.color = color;
                svgEl.style.fill = 'currentColor';
                svgEl.style.stroke = 'none';
            }
            checkboxEl.style.width = '1.25em';
            checkboxEl.style.height = '1.25em';
            checkboxEl.style.backgroundColor = 'transparent';
            checkboxEl.style.border = 'none';
            checkboxEl.style.borderRadius = '0';

        // Case 3: Default task (e.g., incomplete)
        } else {
            checkboxEl.setText(status.trim() || ' ');
            checkboxEl.style.width = '1.15em';
            checkboxEl.style.height = '1.15em';
            checkboxEl.style.backgroundColor = 'transparent';
            checkboxEl.style.color = 'var(--text-normal)';
            checkboxEl.style.borderRadius = '50%';
            checkboxEl.style.border = '1px solid var(--text-faint)';
        }
    }

    getIconColor(iconName) {
        switch (iconName) {
            case 'map-pin':
                return 'var(--text-accent)'; // Red
            case 'flame':
                return 'var(--text-warning)'; // Orange
            case 'slash':
            case 'piggy-bank':
            case 'thumbs-up':
            case 'trophy':
            case 'arrow-up':
                return 'var(--text-success)'; // Green
            case 'thumbs-down':
            case 'arrow-down':
                return 'var(--text-error)'; // Muted Red
            case 'star':
            case 'lightbulb':
                return 'var(--color-yellow)'; // Yellow
            case 'bookmark':
            case 'info':
                return 'var(--color-blue)'; // Blue
            case 'help-circle':
                return 'var(--color-cyan)'; // Cyan
            case 'key':
                return 'goldenrod'; // Gold
            case 'minus':
            case 'quote':
                return 'var(--text-muted)'; // Grey
            default:
                return 'var(--text-normal)'; // Default color for arrows, etc.
        }
    }

    // ADD THIS ENTIRE NEW METHOD TO YOUR PeriodMonthView CLASS
    animateTaskGroup(taskListWrapper, expand) {
        // Stop any existing animation on this element
        if (taskListWrapper.animation) {
            taskListWrapper.animation.cancel();
        }

        let startHeight, endHeight;
        if (expand) {
            startHeight = 0;
            // Temporarily set display to calculate the full height
            taskListWrapper.style.display = 'grid';
            taskListWrapper.style.height = 'auto';
            endHeight = taskListWrapper.scrollHeight;
            taskListWrapper.style.height = '0px';
        } else {
            startHeight = taskListWrapper.scrollHeight;
            endHeight = 0;
        }

        // Use the Web Animations API for a smooth transition
        taskListWrapper.animation = taskListWrapper.animate([
            { height: `${startHeight}px`, opacity: expand ? 0 : 1 },
            { height: `${endHeight}px`, opacity: expand ? 1 : 0 }
        ], {
            duration: 350, // You can change this value (in milliseconds)
            easing: 'ease-in-out',
            fill: 'forwards'
        });

        // When the animation finishes, set the final style
        taskListWrapper.animation.onfinish = () => {
            if (expand) {
                taskListWrapper.style.height = 'auto'; // Allow content to reflow
            } else {
                taskListWrapper.style.display = 'none';
            }
        };
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
    
    // In PeriodMonthView, REPLACE your entire openWeeklyNote method with this one:
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
            MM: String(dateInfo.month+1).padStart(2, '0'),
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
                    MM: String(dateInfoForWeek.month+1).padStart(2, '0'),
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
                if (weeklyNoteExists && settings.showWeeklyNoteDot && !settings.showWeekNumbers) {
                    const dotsContainer = pwContent.createDiv({ cls: 'dots-container' });
                    dotsContainer.createDiv({ cls: 'calendar-dot weekly-note-dot' });
                }
                pwCell.addEventListener('click', clickHandler);
                pwCell.addEventListener('mouseenter', () => { if (this.plugin.settings.enableRowHighlight) { const highlightColor = document.body.classList.contains('theme-dark') ? this.plugin.settings.rowHighlightColorDark : this.plugin.settings.rowHighlightColorLight; row.style.backgroundColor = highlightColor; } });
                pwCell.addEventListener('mouseleave', () => { row.style.backgroundColor = ''; });
            }

            if (settings.showWeekNumbers) {
                const weekNum = settings.weekNumberType === 'period' ? periodWeekData.weekSinceStart : isoWeek;
                const weekCell = row.createEl("td", { cls: "week-number-cell" });
                const weekContent = weekCell.createDiv({ cls: "day-content" });
                weekContent.createDiv({ cls: "day-number" }).setText(weekNum.toString());
                
                weekCell.style.cursor = "pointer";
                if (weeklyNoteExists && settings.showWeeklyNoteDot) {
                    const dotsContainer = weekContent.createDiv({ cls: 'dots-container' });
                    dotsContainer.createDiv({ cls: 'calendar-dot weekly-note-dot' });
                }
                weekCell.addEventListener('click', clickHandler);
                weekCell.addEventListener('mouseenter', () => { if (this.plugin.settings.enableRowHighlight) { const highlightColor = document.body.classList.contains('theme-dark') ? this.plugin.settings.rowHighlightColorDark : this.plugin.settings.rowHighlightColorLight; row.style.backgroundColor = highlightColor; } });
                weekCell.addEventListener('mouseleave', () => { row.style.backgroundColor = ''; });
            }

            for (let d = 0; d < 7; d++) {
                const dayDate = new Date(currentDay);
                dayDate.setDate(currentDay.getDate() + d);
                const isOtherMonth = dayDate.getMonth() !== month;
                const cell = row.createEl("td");
                const contentDiv = cell.createDiv("day-content");
                const dayNumber = contentDiv.createDiv("day-number");
                dayNumber.textContent = dayDate.getDate().toString();
                const dateKey = moment(dayDate).format("YYYY-MM-DD");
                const tasksForDay = this.tasksByDate.get(dateKey) || [];
                const taskCount = tasksForDay.length;
                
                const isToday = isSameDay(dayDate, today)
                if (taskCount > 0) {
                    if (settings.taskIndicatorStyle === 'badge') {
                        contentDiv.createDiv({ cls: 'task-count-badge', text: taskCount.toString() });
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
                                if (taskCount >= maxPoint) { finalColor = settings.taskHeatmapEndColor; }
                                else if (taskCount >= midPoint) { const factor = (taskCount - midPoint) / (maxPoint - midPoint); finalColor = blendRgbaColors(midColor, endColor, factor); }
                                else { const divisor = midPoint - 1; const factor = divisor > 0 ? (taskCount - 1) / divisor : 1; finalColor = blendRgbaColors(startColor, midColor, factor); }
                                contentDiv.style.backgroundColor = finalColor;
                                // This creates a border using the theme's background color, making a clean gap.
                                contentDiv.style.border = `0.5px solid var(--background-secondary)`;
                                // A slightly smaller radius makes it look neatly inset.
                                contentDiv.style.borderRadius = '8px'; 
                                contentDiv.style.boxSizing = 'border-box';
                            
                            }
                        }
                    }
                }
                if (isOtherMonth) dayNumber.addClass("day-number-other-month");
                if (isSameDay(dayDate, today)) cell.addClass("today-cell");
                const createdFiles = this.createdNotesMap.get(dateKey) || [];
                const modifiedFiles = this.modifiedNotesMap.get(dateKey) || [];
                const dailyNoteFileName = formatDate(dayDate, format);
                const dailyNoteExists = existingNotes.has(dailyNoteFileName);
                const dotsContainer = contentDiv.createDiv({ cls: 'dots-container' });
                if (dailyNoteExists) { dotsContainer.createDiv({ cls: "period-month-daily-note-dot calendar-dot" }); }
                if (settings.showOtherNoteDot && createdFiles.length > 0) { dotsContainer.createDiv({ cls: 'other-note-dot calendar-dot' }); }
                if (settings.showModifiedFileDot && modifiedFiles.length > 0) { dotsContainer.createDiv({ cls: 'modified-file-dot calendar-dot' }); }
                const assetsCreated = this.assetCreationMap.get(dateKey) || [];
                if (settings.showAssetDot && assetsCreated.length > 0) { dotsContainer.createDiv({ cls: 'asset-dot calendar-dot' }); }
                if (settings.showTaskDot && taskCount > 0) { dotsContainer.createDiv({ cls: 'task-dot calendar-dot' }); }
                const hasPopupContent = dailyNoteExists || tasksForDay.length > 0 || createdFiles.length > 0 || modifiedFiles.length > 0 || assetsCreated.length > 0;
                if (hasPopupContent) {
                    cell.addEventListener('mouseenter', () => {
                        this.hideFilePopup();
                        clearTimeout(this.hideTimeout);
                        this.hoverTimeout = setTimeout(() => {
                            const dailyNoteFile = dailyNoteExists ? this.app.vault.getAbstractFileByPath(folder ? `${folder}/${dailyNoteFileName}.md` : `${dailyNoteFileName}.md`) : null;
                            const dataToShow = {
                                tasks: tasksForDay,
                                daily: dailyNoteFile ? [dailyNoteFile] : [],
                                created: settings.showOtherNoteDot ? createdFiles : [],
                                modified: settings.showModifiedFileDot ? modifiedFiles : [],
                                assets: settings.showAssetDot ? assetsCreated : [],
                            };
                            this.showFilePopup(cell, dataToShow);
                        }, this.plugin.settings.otherNoteHoverDelay);
                    });
                    cell.addEventListener('mouseleave', () => {
                        clearTimeout(this.hoverTimeout);
                        this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                    });
                }
                cell.addEventListener("click", () => this.openDailyNote(dayDate));
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
        if (settings.highlightCurrentWeek) {
            const highlightedRow = targetBodyEl.querySelector('.current-week-row');
            if (highlightedRow) {
                const highlightColor = document.body.classList.contains('theme-dark') 
                    ? settings.rowHighlightColorDark 
                    : settings.rowHighlightColorLight;
                
                const cells = highlightedRow.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.backgroundColor = highlightColor;
                });
            }
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

    /**
      * Adds a right-click context menu to a file row for deletion.
      * @param {HTMLElement} element The row element to attach the listener to.
      * @param {TFile} file The file associated with the row.
      * @param {() => void} refreshCallback The function to call to refresh the list after deletion.
      */
     addFileContextMenu(element, file, refreshCallback) {
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const menu = new Menu();

            menu.addItem((item) =>
                item
                .setTitle("Delete file")
                .setIcon("trash")
                .onClick(() => {
                        new ConfirmationModal(
                            this.app,
                            "Confirm Deletion",
                            `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
                            async () => {
                                try {
                                    await this.app.vault.trash(file, true); // true for permanent system trash
                                    new Notice(`Deleted: ${file.name}`);
                                    refreshCallback(); // Refresh the specific list
                                } catch (err) {
                                    new Notice(`Error deleting file: ${err.message}`);
                                    console.error(err);
                                }
                            },
                            "Yes, delete it"
                        ).open();
                })
            );

            menu.showAtMouseEvent(event);
        });
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
                    this.isCalendarCollapsed = true;
                    this.containerEl.firstElementChild.classList.add("calendar-collapsed");
                }
                // Swipe Down on Header: Show Calendar
                else if (dragTarget === headerEl && deltaY < 0 && this.isCalendarCollapsed) {
                    this.isCalendarCollapsed = false;
                    this.containerEl.firstElementChild.classList.remove("calendar-collapsed");
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
     * Displays a popup list of notes that link to a specific asset.
     * @param {HTMLElement} targetEl - The element to position the popup relative to.
     * @param {TFile} assetFile - The asset whose backlinks should be displayed.
     */
    async showBacklinksPopup(targetEl, assetFile) {
        this.hideFilePopup(); // Hide any other popups
        const backlinks = await this.findAssetBacklinks(assetFile);

        // If there are no backlinks, show a brief notice instead of an empty popup.
        if (backlinks.length === 0) {
            new Notice("No backlinks found for this asset.");
            return;
        }

        this.popupEl = createDiv({ cls: 'other-notes-popup' });
        
        // The 'noteFile' here is the markdown file that contains the link to the asset
        backlinks.forEach(noteFile => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });
            setIcon(itemEl, 'file-text');
            
            const titlePathWrapper = itemEl.createDiv({ cls: 'note-title-path-wrapper' });
            titlePathWrapper.createDiv({ text: noteFile.basename, cls: "note-title" });
            if (noteFile.parent && noteFile.parent.path !== '/') {
                titlePathWrapper.createDiv({ text: noteFile.parent.path, cls: 'note-path' });
            }

            itemEl.addEventListener('click', async () => {
                // Find the line number of the asset within the selected note
                const cache = this.app.metadataCache.getFileCache(noteFile);
                let targetLine = 0;
                if (cache) {
                    const allLinks = [...(cache.embeds || []), ...(cache.links || [])];
                    for (const ref of allLinks) {
                        const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
                        if (linkedFile && linkedFile.path === assetFile.path) {
                            targetLine = ref.position.start.line;
                            break; // Stop after finding the first match
                        }
                    }
                }

                // Open the note and scroll to the target line
                const openInNewTab = this.plugin.settings.notesOpenAction === 'new-tab';
                const leaf = this.app.workspace.getLeaf(openInNewTab);
                await leaf.openFile(noteFile, { eState: { line: targetLine } });
                this.hideFilePopup();
            });
        });

        // Add mouse listeners to the popup itself to prevent it from closing immediately.
        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });

        document.body.appendChild(this.popupEl);
        
        // --- Popup positioning logic ---
        const popupRect = this.popupEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = this.plugin.settings.popupGap;
        let finalTop = targetRect.bottom + margin;
        if (finalTop + popupRect.height > viewportHeight) finalTop = targetRect.top - popupRect.height - margin;
        if (finalTop < 0) finalTop = margin;
        let finalLeft = targetRect.left;
        if (finalLeft + popupRect.width > viewportWidth) finalLeft = targetRect.right - popupRect.width;
        if (finalLeft < 0) finalLeft = margin;

        this.popupEl.style.top = `${finalTop}px`;
        this.popupEl.style.left = `${finalLeft}px`;
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
            tasks: "Tasks", // This is a fallback
            assets: "Assets"
        };
        
        let iconName = '';
        let text = '';
    
        if (key === 'notes') {
            const mode = this.notesViewMode;
            iconName = mode === 'pinned' ? icons.pinned : icons.notes;
            text = mode === 'pinned' ? textLabels.pinned : textLabels.notes;
        } 
        else if (key === 'tasks') {
            // --- THIS IS THE CORRECTED LOGIC ---
            const groupBy = this.plugin.settings.taskGroupBy;
            iconName = groupBy === 'tag' ? 'circle-check' : icons.tasks;
            text = groupBy === 'tag' ? "Tasks by Tag" : "Tasks by Date";
            // --- END OF CORRECTION ---
        } 
        else if (key === 'assets') { 
            iconName = this.isAssetsGridView ? 'image' : 'file-image';
            text = textLabels[key];
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

            const weekdays = {'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6};
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
        this.tasksByDate = new Map();
        const taskLineRegex = /^\s*(?:-|\d+\.)\s*\[([^xX])\]\s*(.*)/;
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
    
        const files = this.app.vault.getMarkdownFiles();
    
        for (const file of files) {
            if (this.plugin.settings.taskIgnoreFolders.some(folder => file.path.startsWith(folder))) {
                continue;
            }
    
            const content = await this.app.vault.cachedRead(file);
            const lines = content.split('\n');
    
            lines.forEach((line, index) => {
                const taskMatch = line.match(taskLineRegex);
                if (taskMatch) {
                    const status = taskMatch[1]; // Capture the status character
                    const taskText = taskMatch[2];
                    const dateMatch = taskText.match(dueDateRegex);
    
                    if (dateMatch) {
                        const dateKey = dateMatch[1];
                        if (!this.tasksByDate.has(dateKey)) {
                            this.tasksByDate.set(dateKey, []);
                        }
                        this.tasksByDate.get(dateKey).push({
                            text: taskText.trim(),
                            file: file,
                            lineNumber: index,
                            status: status // THIS LINE FIXES THE BUG
                        });
                    }
                }
            });
        }
    }

    /**
     * Shows a confirmation modal and handles the permanent deletion of an asset file.
     * @param {TFile} file - The asset file to delete.
     */
    async handleDeleteAsset(file) {
        new ConfirmationModal(
            this.app,
            "Confirm Deletion",
            `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
            async () => {
                try {
                    await this.app.vault.trash(file, true); // `true` for permanent deletion.
                    new Notice(`Deleted asset: ${file.name}`);
                    // Refresh data maps and UI components that depend on asset data.
                    await this.buildAssetCreationMap();
                    await this.buildTasksByDateMap();
                    this.populateAssets();
                    this.renderCalendar();
                } catch (err) {
                    new Notice(`Error deleting file: ${err.message}`);
                    console.error(err);
                }
            }
        , "Yes, delete it").open();
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
        const actionsContainer = this.scratchWrapperEl.createDiv({ 
            cls: "scratchpad-actions-container" 
        });
    
        // Only show the Preview/Edit toggle button if enabled in settings.
        if (this.plugin.settings.scratchpad?.showPreviewToggle) {
            this.scratchpadViewToggleBtn = actionsContainer.createEl("button", { 
                cls: "scratchpad-action-btn" 
            });
            this.scratchpadViewToggleBtn.addEventListener("click", () => this.toggleScratchpadView());
        }
    
        // Only show the Add Task button if enabled in settings.
        if (this.plugin.settings.scratchpad?.showAddTaskButton) {
            this.addTaskBtn = actionsContainer.createEl("button", { 
                cls: "scratchpad-action-btn"
            });
            setIcon(this.addTaskBtn, "plus");
            this.addTaskBtn.setAttribute("aria-label", "Add new task");
            this.addTaskBtn.addEventListener("click", () => this.addNewTaskToScratchpad());
        }
    
    
        if (this.isScratchpadPreview && this.plugin.settings.scratchpad?.showPreviewToggle) {
            // --- CONFIGURE UI FOR PREVIEW MODE ---
            if (this.scratchpadViewToggleBtn) {
                setIcon(this.scratchpadViewToggleBtn, "edit"); // Switch to Edit icon
                this.scratchpadViewToggleBtn.setAttribute("aria-label", "Edit mode");
            }
            if (this.addTaskBtn) this.addTaskBtn.style.display = 'none';
    
            // Disable search controls in preview mode.
            if (this.scratchpadSearchInputEl) this.scratchpadSearchInputEl.disabled = true;
            if (this.scratchpadSearchControlsEl) {
                Array.from(this.scratchpadSearchControlsEl.children).forEach(child => {
                    if (child.matches('button')) child.disabled = true;
                });
            }
            
            // Render the content as Markdown.
            this.scratchWrapperEl.addClass("markdown-preview-view");
            const markdownContent = await this.loadNote();
            const file = this.app.vault.getAbstractFileByPath(this.plugin.settings.fixedNoteFile);
            if (file) {
                MarkdownRenderer.render(this.app, markdownContent, this.scratchWrapperEl, file.path, this);
            }
    
        } else {
            // --- CONFIGURE UI FOR EDIT MODE ---
            if (this.scratchpadViewToggleBtn) {
                setIcon(this.scratchpadViewToggleBtn, "eye"); // Switch to Preview icon
                this.scratchpadViewToggleBtn.setAttribute("aria-label", "Preview mode");
            }
            if (this.addTaskBtn) this.addTaskBtn.style.display = 'block';
    
            // Enable search controls in edit mode.
            if (this.scratchpadSearchInputEl) this.scratchpadSearchInputEl.disabled = false;
            if (this.scratchpadSearchControlsEl) {
                Array.from(this.scratchpadSearchControlsEl.children).forEach(child => {
                    if (child.matches('button')) child.disabled = false;
                });
            }
            
            this.scratchWrapperEl.removeClass("markdown-preview-view");
            // The highlighter is a div that sits behind the textarea to show search matches.
            this.scratchHighlighterEl = this.scratchWrapperEl.createDiv({ cls: "scratch-base scratch-highlighter" });
            this.noteTextarea = this.scratchWrapperEl.createEl("textarea", { cls: "scratch-base scratch-content" });
            
            this.noteTextarea.value = this.noteText;
            if (wasFocused) this.noteTextarea.focus();
            this.updateScratchpadHighlights();
            
            // Save content on input.
            this.noteTextarea.addEventListener("input", async () => {
                this.noteText = this.noteTextarea.value;
                await this.saveFixedNote(this.noteText);
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
        await this.buildTasksByDateMap(); 
        await this.buildWeeklyNotesCache();
        this.noteText = await this.loadNote();
        this.render();
    
        // --- Register events and intervals ---
        const intervalMs = this.plugin.settings.autoReloadInterval || 5000;
    
        this.registerInterval(setInterval(async () => {
            if (document.activeElement === this.noteTextarea) {
                return; // Don't reload if the user is actively typing here.
            }
            
            const latest = await this.loadNote();
            if (latest !== this.noteText && this.noteTextarea) {
                this.noteText = latest;
                this.noteTextarea.value = latest;
            }
        }, intervalMs));
    
        this.registerInterval(setInterval(() => {
            if (this.notesContentEl && this.notesContentEl.style.display !== "none") this.populateNotes();
        }, 5000));
    
        const createOrModifyHandler = async (file) => {
            if (!(file instanceof TFile)) return;
        
            if (this.isWeeklyNote(file)) {
                this.existingWeeklyNotes.add(file.path);
            }
        
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(file.path);
                this.addFileToMaps(file);
            } else {
                this.removeFileFromAssetMap(file.path);
                this.addFileToAssetMap(file);
            }
            this.refreshUI(file);
        };
        
        const deleteHandler = async (file) => {
            if (!(file instanceof TFile)) return;
        
            // Remove from weekly notes cache if it was one
            if (this.existingWeeklyNotes.has(file.path)) {
                this.existingWeeklyNotes.delete(file.path);
            }
        
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(file.path);
            } else {
                this.removeFileFromAssetMap(file.path);
            }
            this.refreshUI(file);
        };
        
        const renameHandler = async (file, oldPath) => {
            if (!(file instanceof TFile)) return;
            
            // Handle weekly note cache updates
            if (this.existingWeeklyNotes.has(oldPath)) {
                this.existingWeeklyNotes.delete(oldPath);
            }
            if (this.isWeeklyNote(file)) {
                this.existingWeeklyNotes.add(file.path);
            }
        
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(oldPath);
                this.addFileToMaps(file);
            } else {
                this.removeFileFromAssetMap(oldPath);
                this.addFileToAssetMap(file);
            }
            this.refreshUI(file);
        };
    
        this.registerEvent(this.app.vault.on("modify", createOrModifyHandler));
        this.registerEvent(this.app.vault.on("create", createOrModifyHandler));
        this.registerEvent(this.app.vault.on("delete", deleteHandler));
        this.registerEvent(this.app.vault.on("rename", renameHandler));
    
        // --- THIS IS THE FINAL, WORKING CLICK HANDLER ---
        /*this.registerDomEvent(this.containerEl, 'click', (event) => {
            const header = event.target.closest('.task-group-header');
            if (header) {
                const groupContainer = header.closest('.task-group-container');
                if (groupContainer) {
                    const taskListWrapper = groupContainer.querySelector('.task-list-wrapper');
                    if (taskListWrapper) {
                        // Check if the group is currently collapsed or in the process of collapsing
                        const isCollapsed = groupContainer.classList.contains('is-collapsed');
                        
                        // Toggle the state and run the correct animation
                        if (isCollapsed) {
                            groupContainer.classList.remove('is-collapsed');
                            this.animateTaskGroup(taskListWrapper, true); // Expand
                        } else {
                            groupContainer.classList.add('is-collapsed');
                            this.animateTaskGroup(taskListWrapper, false); // Collapse
                        }
                    }
                }
            }
        });*/
        
    }

    /**
     * Forces a full rebuild of all data maps and a complete re-render of the view.
     * Useful after major setting changes.
     */
    async rebuildAndRender() {
        await this.buildCreatedNotesMap();
        await this.buildModifiedNotesMap();
        await this.buildAssetCreationMap();
        await this.buildWeeklyNotesCache();
        this.render();
    }

    /**
     * Performs a more targeted UI refresh based on which file was changed,
     * avoiding a full re-render when possible.
     * @param {TFile} file The file that was changed.
     */
    async refreshUI(file) {
        // If the scratchpad file was modified, update its content.
        const scratchpadPath = this.plugin.settings.fixedNoteFile;
        if (this.activeTab === 'scratch' && file?.path === scratchpadPath) {
            this.noteText = await this.loadNote();
            if(this.noteTextarea) this.noteTextarea.value = this.noteText;
        }

        // If a file was changed and the Tasks tab is active, check if its task content changed.
        // This is debounced to avoid excessive refreshes during rapid edits.
        if (this.activeTab === 'tasks' && file instanceof TFile) {
            clearTimeout(this.taskRefreshDebounceTimer);

            this.taskRefreshDebounceTimer = setTimeout(async () => {
                const oldTasks = (this.taskCache && this.taskCache.get(file.path)) || [];
                const content = await this.app.vault.cachedRead(file);
                const newTasks = this.extractTaskLines(content);

                // Only refresh if the number of tasks or their content has changed.
                if (oldTasks.length !== newTasks.length || oldTasks.join('\n') !== newTasks.join('\n')) {
                    await this.populateTasks();
                }
            }, 3500);
        }

        // If the Assets tab is active, refresh it.
        if (this.activeTab === 'assets') {
            await this.populateAssets();
        }

        // Always rebuild the task map and re-render the calendar, as any file change could affect them.
        // Debounce the calendar refresh to avoid race conditions with file system writes
        clearTimeout(this.calendarRefreshDebounceTimer);
        this.calendarRefreshDebounceTimer = setTimeout(async () => {
            await this.buildTasksByDateMap();
            this.renderCalendar();
        }, 400); // A 400ms delay is enough to ensure file is saved
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
        // Process the format to get both the text and the final cursor position.
        const processedResult = this.processDatePlaceholders(taskFormatSetting);
        const textToInsert = processedResult.text;
        
        const currentText = this.noteTextarea.value;
        const selectionStart = this.noteTextarea.selectionStart;

        // Intelligently add a newline if the cursor isn't at the start of a new line.
        const textBeforeCursor = currentText.substring(0, selectionStart);
        const finalInsertionText = (textBeforeCursor.length > 0 && !textBeforeCursor.endsWith("\n")) 
            ? "\n" + textToInsert 
            : textToInsert;
        
        const textAfterCursor = currentText.substring(selectionStart);
        const newText = textBeforeCursor + finalInsertionText + textAfterCursor;
        
        this.noteTextarea.value = newText;
        this.noteTextarea.focus();
        
        // Set the cursor position using the offset from our processing result.
        const newCursorPosition = selectionStart + finalInsertionText.length - (textToInsert.length - processedResult.cursorOffset);
        this.noteTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // Manually trigger a save and UI update.
        this.noteText = newText;
        await this.saveFixedNote(this.noteText);
        this.updateScratchpadSearchCount();
        this.updateScratchpadHighlights();
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

    /**
     * Renders the list of recent assets in the "Assets" tab.
     */
    async populateAssets() {
        if (!this.assetsContentEl) return;
        this.assetsContentEl.empty();
      
        const settings = this.plugin.settings;
        const unusedAssetPaths = settings.showUnusedAssetsIndicator ? await this.getUnusedAssetPaths() : new Set();
        const cutoff = moment().startOf('day').subtract(settings.assetsLookbackDays - 1, 'days').valueOf();
        const ignoreFolders = (settings.assetIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const hiddenTypes = (settings.hiddenAssetTypes || "").split(',').map(ext => ext.trim().toLowerCase()).filter(ext => ext.length > 0);
          
        const allAssets = this.app.vault.getFiles()
            .filter(file =>
                !file.path.toLowerCase().endsWith('.md') &&
                !hiddenTypes.includes(file.extension.toLowerCase()) &&
                !ignoreFolders.some(f => file.path.toLowerCase().startsWith(f)) &&
                (file.stat.mtime >= cutoff || file.stat.ctime >= cutoff)
            )
            .sort((a,b) => b.stat.mtime - a.stat.mtime);
  
        const searchTerm = this.assetsSearchTerm.toLowerCase();
        const filteredAssets = searchTerm ? allAssets.filter(file => file.name.toLowerCase().includes(searchTerm)) : allAssets;
        const searchInputEl = this.assetsSearchInputEl;
      
        const groups = { today: [], yesterday: [], thisWeek: [], lastWeek: [], thisMonth: [], older: [] };
        const now = moment();
        filteredAssets.forEach(file => {
            const modTime = moment(file.stat.mtime);
            if (modTime.isSame(now, 'day')) groups.today.push(file);
            else if (modTime.isSame(now.clone().subtract(1, 'day'), 'day')) groups.yesterday.push(file);
            else if (modTime.isSame(now, 'week')) groups.thisWeek.push(file);
            else if (modTime.isSame(now.clone().subtract(1, 'week'), 'week')) groups.lastWeek.push(file);
            else if (modTime.isSame(now, 'month')) groups.thisMonth.push(file);
            else groups.older.push(file);
        });

        const groupOrder = [
            { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' },
            { key: 'thisWeek', label: 'This Week' }, { key: 'lastWeek', label: 'Last Week' },
            { key: 'thisMonth', label: 'This Month' }, { key: 'older', label: 'Older' },
        ];

        if (filteredAssets.length === 0) {
            this.assetsContentEl.createDiv({ text: 'No assets found.', cls: 'task-group-empty-message' });
            return;
        }

        groupOrder.forEach(groupInfo => {
            const assetsInGroup = groups[groupInfo.key];
            if (assetsInGroup.length > 0) {
                const groupContainer = this.assetsContentEl.createDiv({ cls: 'note-group-container' });
                const isCollapsed = this.collapsedAssetGroups[groupInfo.key];
                if (isCollapsed) groupContainer.addClass('is-collapsed');

                const header = groupContainer.createDiv({ cls: 'note-group-header' });
                const headerContent = header.createDiv({ cls: 'note-group-header-content' });
                const collapseIcon = headerContent.createDiv({ cls: 'note-group-collapse-icon' });
                setIcon(collapseIcon, 'chevron-down');
                headerContent.createSpan({ text: groupInfo.label });
                header.createDiv({ cls: 'note-group-count', text: assetsInGroup.length });

                header.addEventListener('click', () => {
                    const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
                    this.collapsedAssetGroups[groupInfo.key] = currentlyCollapsed;
                    this.plugin.saveSettings();
                });

                const listWrapper = groupContainer.createDiv({ cls: 'note-list-wrapper' });

                if (this.isAssetsGridView) {
                    listWrapper.addClass('assets-grid-view');
                    assetsInGroup.forEach(file => {
                        const item = listWrapper.createDiv("asset-grid-item");
                        item.setAttribute('aria-label', file.path);
                        
                        const preview = item.createDiv("asset-grid-preview");
                        if (this.isImageAsset(file)) {
                            const thumbnail = preview.createEl('img');
                            thumbnail.src = this.app.vault.getResourcePath(file);
                        } else {
                            setIcon(preview, 'file-question');
                        }

                        const nameEl = item.createDiv({ text: file.name, cls: "asset-grid-name" });

                        // --- NEW CLICK LISTENERS ---

                        // 1. Clicking the image preview opens the asset file.
                        preview.addEventListener("click", (e) => {
                            e.stopPropagation();
                            const openInNewTab = this.plugin.settings.assetsOpenAction === 'new-tab';
                            this.app.workspace.getLeaf(openInNewTab).openFile(file);
                        });

                        // 2. Clicking the name finds and opens the note the asset is on.
                        nameEl.addEventListener("click", async (e) => {
                            e.stopPropagation();
                            const backlinks = await this.findAssetBacklinks(file);
                            if (backlinks.length === 1) {
                                const noteFile = backlinks[0];
                                const cache = this.app.metadataCache.getFileCache(noteFile);
                                let targetLine = 0;
                                if (cache) {
                                    const allLinks = [...(cache.embeds || []), ...(cache.links || [])];
                                    for (const ref of allLinks) {
                                        const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
                                        if (linkedFile && linkedFile.path === file.path) {
                                            targetLine = ref.position.start.line;
                                            break;
                                        }
                                    }
                                }
                                const openInNewTab = this.plugin.settings.notesOpenAction === 'new-tab';
                                const leaf = this.app.workspace.getLeaf(openInNewTab);
                                await leaf.openFile(noteFile, { eState: { line: targetLine } });
                            } else if (backlinks.length > 1) {
                                this.showBacklinksPopup(nameEl, file);
                            } else {
                                new Notice("This asset is not used in any notes.");
                            }
                        });

                        this.addFileContextMenu(item, file, () => this.populateAssets());
                    });
                } else {
                    listWrapper.removeClass('assets-grid-view');
                    assetsInGroup.forEach(file => {
                        const row = listWrapper.createDiv("note-row");
                        const isUnused = unusedAssetPaths.has(file.path);
                
                        const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });
                        
                        const iconContainer = titleWrapper.createDiv({ cls: 'asset-icon-container' });
                        if (this.isImageAsset(file)) {
                            const thumbnail = iconContainer.createEl('img', { cls: 'asset-thumbnail' });
                            thumbnail.src = this.app.vault.getResourcePath(file);
                        }

                        // --- CLICK ICON TO OPEN ASSET ---
                        iconContainer.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevents the row's click listener from also firing
                            const openInNewTab = this.plugin.settings.assetsOpenAction === 'new-tab';
                            this.app.workspace.getLeaf(openInNewTab).openFile(file);
                        });
                
                        if (isUnused && settings.showUnusedAssetsIndicator) {
                            const actionIconContainer = titleWrapper.createDiv({ cls: 'asset-action-icon' });
                            const unlinkIcon = actionIconContainer.createDiv();
                            setIcon(unlinkIcon, 'unlink');
                            const deleteIcon = actionIconContainer.createDiv();
                            setIcon(deleteIcon, 'trash');
                            actionIconContainer.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.handleDeleteAsset(file);
                            });
                        }
                
                        const titleEl = titleWrapper.createDiv({ text: file.name, cls: "note-title" });
                        titleEl.setAttribute('aria-label', file.path);
                
                        const metaContainer = row.createDiv({ cls: 'note-meta-container' });
                        metaContainer.createSpan({ text: this.formatFileSize(file.stat.size), cls: "note-file-size" });
                        metaContainer.createSpan({ text: formatDateTime(new Date(file.stat.mtime)), cls: "note-mod-date" });
                        
                        // --- CLICK ROW TO FIND NOTE(S) ---
                        row.addEventListener("click", async () => {
                            const backlinks = await this.findAssetBacklinks(file);
                            if (backlinks.length === 1) {
                                // If there's only one backlink, find its line number and scroll to it.
                                const noteFile = backlinks[0];
                                const cache = this.app.metadataCache.getFileCache(noteFile);
                                let targetLine = 0;
                                if (cache) {
                                    const allLinks = [...(cache.embeds || []), ...(cache.links || [])];
                                    for (const ref of allLinks) {
                                        const linkedFile = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
                                        if (linkedFile && linkedFile.path === file.path) {
                                            targetLine = ref.position.start.line;
                                            break;
                                        }
                                    }
                                }
                                const openInNewTab = this.plugin.settings.notesOpenAction === 'new-tab';
                                const leaf = this.app.workspace.getLeaf(openInNewTab);
                                await leaf.openFile(noteFile, { eState: { line: targetLine } });

                            } else if (backlinks.length > 1) {
                                this.showBacklinksPopup(row, file);
                            } else {
                                new Notice("This asset is not used in any notes.");
                            }
                        });

                        this.addKeydownListeners(row, searchInputEl);
                        this.addFileContextMenu(row, file, () => this.populateAssets());
                    });
                }
            }
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
     * Adds mouse hover listeners to calendar header cells to highlight the entire column.
     * @param {HTMLTableRowElement} headerRow The <thead> row element.
     * @param {HTMLTableSectionElement} tableBody The <tbody> element.
     */
    addColumnHighlighting(headerRow, tableBody) {
        if (!this.plugin.settings.enableColumnHighlight) return;
        const headerCells = headerRow.querySelectorAll('th');
        headerCells.forEach((th, colIndex) => {
            if (th.textContent.trim() === "") return;
            
            th.addEventListener('mouseenter', () => {
                const highlightColor = document.body.classList.contains('theme-dark')
                   ? this.plugin.settings.rowHighlightColorDark
                   : this.plugin.settings.rowHighlightColorLight;
                th.style.backgroundColor = highlightColor;
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const cell = row.children[colIndex];
                    if (cell) cell.style.backgroundColor = highlightColor;
                });
            });
            th.addEventListener('mouseleave', () => {
                th.style.backgroundColor = ''; // Always clear the header's highlight
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const cell = row.children[colIndex];
                    if (cell) {
                        // Check if the cell is in the permanently highlighted row
                        if (this.plugin.settings.highlightCurrentWeek && row.classList.contains('current-week-row')) {
                            // If yes, restore the permanent highlight color
                            const permanentColor = document.body.classList.contains('theme-dark')
                                ? this.plugin.settings.rowHighlightColorDark
                                : this.plugin.settings.rowHighlightColorLight;
                            cell.style.backgroundColor = permanentColor;
                        } else {
                            // Otherwise, clear the hover highlight as before
                            cell.style.backgroundColor = '';
                        }
                    }
                });
            });
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
        const scroller = container.createDiv("vertical-calendar-scroller");
        const initialMonthId = `month-${this.displayedMonth.getFullYear()}-${this.displayedMonth.getMonth()}`;
        
        // Render a range of months around the currently displayed month.
        const numMonthsBefore = 6;
        const numMonthsAfter = 12;
        for (let i = -numMonthsBefore; i <= numMonthsAfter; i++) {
            const monthDate = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() + i, 1);
            const monthWrapper = scroller.createDiv({ cls: "vertical-month-wrapper" });
            monthWrapper.id = `month-${monthDate.getFullYear()}-${monthDate.getMonth()}`;
            monthWrapper.createEl("h3", { 
                cls: "vertical-month-title",
                text: formatMonthTitle(monthDate, this.plugin.settings.monthTitleFormat)
            });
            const table = monthWrapper.createEl("table", { cls: "period-calendar-table" });
            const thead = table.createEl("thead");
            const headerRow = thead.createEl("tr");
            if (this.plugin.settings.showPWColumn) {
                headerRow.createEl("th", { text: " " });
            }
            if (this.plugin.settings.showWeekNumbers) headerRow.createEl("th", { text: this.plugin.settings.weekNumberColumnLabel });
            for (let d = 0; d < 7; d++) {
                headerRow.createEl("th", { text: new Date(1970, 0, d + 4).toLocaleDateString(undefined, { weekday: "short" }) });
            }
            const tbody = table.createEl("tbody");
            this.generateMonthGrid(monthDate, tbody);
            this.addColumnHighlighting(headerRow, tbody);
        }

        // After the layout is ready, scroll the initial month into view.
        this.app.workspace.onLayoutReady(() => {
            const initialEl = scroller.querySelector(`#${initialMonthId}`);
            if (initialEl) {
                initialEl.scrollIntoView({ block: "start" });
            }
        });

        // Use a scroll listener to update the main header title to match the topmost visible month.
        scroller.addEventListener('scroll', () => {
            clearTimeout(this.titleUpdateTimeout);
            this.titleUpdateTimeout = setTimeout(() => {
                let topmostVisibleMonth = null;
                let smallestTopValue = Infinity;
                const scrollerTop = scroller.getBoundingClientRect().top;
                const monthElements = scroller.querySelectorAll('.vertical-month-wrapper');
                for (const monthEl of monthElements) {
                    const monthTop = monthEl.getBoundingClientRect().top;
                    if (monthTop >= scrollerTop && monthTop < smallestTopValue) {
                        smallestTopValue = monthTop;
                        topmostVisibleMonth = monthEl;
                    }
                }
                if (topmostVisibleMonth) {
                    const [_, year, month] = topmostVisibleMonth.id.split('-').map(Number);
                    if (this.displayedMonth.getFullYear() !== year || this.displayedMonth.getMonth() !== month) {
                         this.displayedMonth = new Date(year, month, 1);
                         this.updateMonthTitle();
                    }
                }
            }, 100);
        });
    }

    async onclose() { this.intersectionObserver?.disconnect(); }
    
    /**
     * A helper function to create a standardized search input with a clear button and keyboard navigation.
     * @param {HTMLElement} container The parent element.
     * @param {string} placeholder The placeholder text for the input.
     * @param {HTMLElement} clearButton The 'x' button element.
     * @param {(term: string) => void} onInput The callback function to execute on input.
     * @returns {HTMLInputElement} The created input element.
     */
    /**
    * A helper function to create a standardized search input with a clear button.
    * @param {HTMLElement} container The parent element.
    * @param {string} placeholder The placeholder text for the input.
    * @param {(term: string) => void} onInput The callback function to execute on input.
    * @returns {HTMLInputElement} The created input element.
    */
    setupSearchInput(container, placeholder, onInput) {
        const inputEl = container.createEl("input", {
            type: "text",
            placeholder: placeholder,
            cls: "pm-search-input" // Use a consistent class
        });
    
        // Create the clear button inside this function
        const clearButton = container.createDiv({ cls: "search-input-clear-btn" });
        setIcon(clearButton, "x");

        clearButton.addEventListener('click', () => {
            inputEl.value = "";
            inputEl.dispatchEvent(new Event('input'));
            inputEl.focus();
        });

        inputEl.addEventListener("input", (e) => {
            const term = e.target.value;
            clearButton.style.visibility = term ? 'visible' : 'hidden';
            onInput(term);
        });

        inputEl.addEventListener("keydown", (e) => {
            if (e.key === 'Escape') {
            e.preventDefault();
            inputEl.value = "";
            inputEl.dispatchEvent(new Event('input'));
            } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const contentEl = this.activeTab === 'notes' ? this.notesContentEl : this.tasksContentEl;
            const firstItem = contentEl.querySelector('.note-row, .task-row');
            if (firstItem) firstItem.focus();
            }
        });
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
            assets: "Assets"
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
    
            tabEl.addEventListener("click", async () => {
                if (this.activeTab === key) {
                    // This is a second click on an already active tab, which triggers a special action.
                    if (key === 'scratch') {
                        this.openScratchpadFile();
                    } else if (key === 'tasks') {
                        // --- THIS IS THE CORRECTED LOGIC BLOCK ---
                        const currentGroupBy = this.plugin.settings.taskGroupBy;
                        const newGroupBy = currentGroupBy === 'date' ? 'tag' : 'date';
                        this.plugin.settings.taskGroupBy = newGroupBy;
                        
                        await this.plugin.saveData(this.plugin.settings);
                        
                        // THIS IS THE CRITICAL LINE THAT WAS MISSING
                        this.getTabLabel(tabEl, 'tasks');
                        
                        await this.populateTasks();
                        
                        //new Notice(`Tasks now grouped by ${newGroupBy}.`);
                        // --- END OF CORRECTION ---
    
                    } else if (key === 'assets') {
                        this.isAssetsGridView = !this.isAssetsGridView;
                        this.getTabLabel(tabEl, 'assets');
                        await this.populateAssets(); 
                        const viewMode = this.isAssetsGridView ? 'grid' : 'list';
                       // new Notice(`Assets view changed to ${viewMode} mode.`);
                    } else if (key === 'notes') {
                        this.notesViewMode = this.notesViewMode === 'recent' ? 'pinned' : 'recent';
                        this.plugin.settings.notesViewMode = this.notesViewMode;
                        await this.plugin.saveData(this.plugin.settings);
                        
                        this.getTabLabel(tabEl, 'notes');
                        const newTooltip = this.notesViewMode === 'pinned' ? tooltipLabels.pinned : tooltipLabels.notes;
                        tabEl.setAttribute('aria-label', newTooltip);
                        
                        await this.populateNotes();
                    }
                } else {
                    // This is a first click, just switch to the tab.
                    switchTabs(key);
                }
            });
    
            // --- HTML5 Drag and Drop Listeners for reordering tabs ---
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

    /**
     * The main render function for the entire view. It builds the DOM from scratch.
     */
    render() {
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
        
        // --- Header and Navigation ---
        const headerDiv = container.createDiv("month-header");
        this.monthNameEl = headerDiv.createDiv({ cls: "month-header-title" });
        this.updateMonthTitle();
        this.monthNameEl.addEventListener("click", () => {
            this.isVerticalView = !this.isVerticalView;
            this.render();
        });
        const navDiv = headerDiv.createDiv({ cls: "month-header-nav" });
    
        const backBtn = navDiv.createEl("button");
        backBtn.setAttribute("aria-label", "Previous month");
        setIcon(backBtn, "chevron-left");
        backBtn.addEventListener("click", () => this.isVerticalView ? (this.displayedMonth.setMonth(this.displayedMonth.getMonth() - 1, 1), this.render()) : this.changeMonth(-1));
    
        const todayBtn = navDiv.createEl("button");
        todayBtn.setAttribute("aria-label", "Go to today");
        setIcon(todayBtn, "calendar-clock");
        todayBtn.addEventListener("click", () => this.isVerticalView ? (this.displayedMonth = new Date(), this.render()) : this.changeMonth(0, true));
        
        const forwardBtn = navDiv.createEl("button");
        forwardBtn.setAttribute("aria-label", "Next month");
        setIcon(forwardBtn, "chevron-right");
        forwardBtn.addEventListener("click", () => this.isVerticalView ? (this.displayedMonth.setMonth(this.displayedMonth.getMonth() + 1, 1), this.render()) : this.changeMonth(1));
        
        const collapseBtn = navDiv.createEl("button");
        this.collapseBtn = collapseBtn; 
        collapseBtn.setAttribute("aria-label", "Toggle calendar visibility");
        
        setIcon(this.collapseBtn, this.isCalendarCollapsed ? "chevron-up" : "chevron-down");
     
        this.collapseBtn.addEventListener("click", () => {
            this.isCalendarCollapsed = !this.isCalendarCollapsed;
            this.containerEl.firstElementChild.classList.toggle("calendar-collapsed", this.isCalendarCollapsed);
        });
    
        // --- Calendar Rendering (Vertical or Horizontal) ---
        if (this.isVerticalView) {
            this.renderVerticalCalendar(container);
        } else {
            const tableWrapper = container.createDiv({ cls: "calendar-table-wrapper" });
            const table = tableWrapper.createEl("table", { cls: "period-calendar-table" });
            this.attachSwipeListeners(tableWrapper, headerDiv);
            const headerRow = table.createEl("thead").createEl("tr");
            if (this.plugin.settings.showPWColumn) headerRow.createEl("th", { text: " " });
            if (this.plugin.settings.showWeekNumbers) headerRow.createEl("th", { text: this.plugin.settings.weekNumberColumnLabel });
            const startDayOffset = this.plugin.settings.weekStartDay === 'monday' ? 1 : 0;
            for (let d = 0; d < 7; d++) {
                headerRow.createEl("th", { text: moment().day(d + startDayOffset).format("ddd") });
            }
            
            this.calendarBodyEl = table.createEl("tbody");
            this.renderCalendar();
            this.addColumnHighlighting(headerRow, this.calendarBodyEl);
            
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
    
            // -- CONTENT PANELS --
            this.scratchWrapperEl = tabWrapper.createDiv({ cls: "scratchpad-wrapper" });
            this.renderScratchpadContent(); 
    
            this.notesContentEl = tabWrapper.createDiv({ cls: "notes-container" });
            this.assetsContentEl = tabWrapper.createDiv({ cls: "notes-container" });
            this.tasksContentEl = tabWrapper.createDiv({ cls: "tasks-container" });
            
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
    
                scratchpadSearchContainer.style.display = (tab === "scratch") ? "flex" : "none";
                notesSearchContainer.style.display = (tab === "notes") ? "flex" : "none";
                assetsSearchContainer.style.display = (tab === "assets") ? "flex" : "none";
                tasksSearchContainer.style.display = (tab === "tasks") ? "flex" : "none";
                    
                // Populate the content of the newly activated tab.
                if (tab === "notes") this.populateNotes();
                if (tab === "assets") this.populateAssets();
                if (tab === "tasks") this.populateTasks();
            };
    
            const tabElements = this.setupDraggableTabs(tabContainer, switchTabs);
    
            // -- SEARCH LOGIC --
            this.scratchpadSearchInputEl = this.setupSearchInput(scratchpadSearchContainer, "Search ScratchPad...", (term) => {
                this.scratchpadSearchTerm = term;
                this.updateScratchpadHighlights();
            });
            
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
    
    
            const notesPlaceholder = this.notesViewMode === 'pinned' ? 'Filter notes...' : 'Filter notes...';
            this.notesSearchInputEl = this.setupSearchInput(notesSearchContainer, notesPlaceholder, (term) => {
                this.notesSearchTerm = term;
                this.populateNotes();
            });
    
            this.assetsSearchInputEl = this.setupSearchInput(assetsSearchContainer, "Filter assets...", (term) => {
                this.assetsSearchTerm = term;
                this.populateAssets();
            });
    
            this.tasksSearchInputEl = this.setupSearchInput(tasksSearchContainer, "Filter tasks...", (term) => {
                this.tasksSearchTerm = term;
                this.populateTasks();
            });
            
            this.updateScratchpadSearchCount();
            switchTabs(this.activeTab);
        }
    }
    
    /**
     * Finds and highlights the next or previous occurrence of the search term in the scratchpad textarea.
     * @param {'next' | 'prev'} direction The direction to search.
     */
    highlightInScratchpad(direction = 'next') {
        this.noteTextarea.focus();
        const text = this.noteTextarea.value;
        const term = this.scratchpadSearchTerm;
        if (!term) return;

        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        let matchIndex = -1;

        if (direction === 'next') {
            const searchFrom = this.noteTextarea.selectionEnd;
            matchIndex = lowerText.indexOf(lowerTerm, searchFrom);
            if (matchIndex === -1) { // Wrap around to the start if no match is found.
                matchIndex = lowerText.indexOf(lowerTerm);
            }
        } else { // 'prev'
            const searchFrom = this.noteTextarea.selectionStart > 0 ? this.noteTextarea.selectionStart - 1 : text.length;
            matchIndex = lowerText.lastIndexOf(lowerTerm, searchFrom);
            if (matchIndex === -1) { // Wrap around to the end.
                matchIndex = lowerText.lastIndexOf(lowerTerm);
            }
        }

        if (matchIndex !== -1) {
            // Select the found text and scroll it into view.
            this.noteTextarea.setSelectionRange(matchIndex, matchIndex + term.length);
            const lineHeight = parseFloat(getComputedStyle(this.noteTextarea).lineHeight);
            const lines = text.substring(0, matchIndex).split('\n').length;
            this.noteTextarea.scrollTop = (lines - 1) * lineHeight;
        } else {
            new Notice("No matches found");
        }
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
     */
     showFilePopup(targetEl, dataByType) {
      this.hideFilePopup();
      this.popupEl = createDiv({ cls: 'other-notes-popup' });
      const { settings } = this.plugin;

      // --- Helper function for rendering file/asset items ---
      const addFileToList = (file, type) => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });

            // This part for the dot/thumbnail stays the same
            if (type === 'asset' && this.isImageAsset(file)) {
            const thumbnail = itemEl.createEl('img', { cls: 'popup-asset-thumbnail' });
            thumbnail.src = this.app.vault.getResourcePath(file);
            } else {
            const dot = itemEl.createDiv({ cls: 'popup-file-dot' });
            if (type === 'daily') dot.style.backgroundColor = settings.dailyNoteDotColor;
            else if (type === 'created') dot.style.backgroundColor = settings.otherNoteDotColor;
            else if (type === 'modified') dot.style.backgroundColor = settings.calendarModifiedDotColor;
            else if (type === 'asset') dot.style.backgroundColor = settings.assetDotColor;
            }
        
            // NEW: Create a wrapper for the title and path
            const titlePathWrapper = itemEl.createDiv({ cls: 'note-title-path-wrapper' });
            const displayName = file.path.toLowerCase().endsWith('.md') ? file.basename : file.name;
            titlePathWrapper.createDiv({ text: displayName, cls: "note-title" });
            
            // Add the parent folder path
            if (file.parent && file.parent.path !== '/') {
                titlePathWrapper.createDiv({ text: file.parent.path, cls: 'note-path' });
            }

            itemEl.addEventListener('click', () => {
            this.app.workspace.openLinkText(file.path, "", settings.notesOpenAction === 'new-tab');
            this.hideFilePopup();
            });
        };
    
        // --- Helper function for rendering interactive task items ---
        const addTaskToList = (task) => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });
            itemEl.dataset.taskStatus = task.status;
  
            const checkbox = itemEl.createDiv({ cls: 'task-checkbox-symbol' });
            this._renderTaskSymbol(checkbox, task); // This is the crucial call
  
            checkbox.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.toggleTaskCompletion(task);
                
                task.status = (task.status.toLowerCase() === 'x') ? ' ' : 'x';
                this._renderTaskSymbol(checkbox, task); // Re-render the symbol for instant feedback
                
                await this.buildTasksByDateMap();
                this.renderCalendar();
            });
  
            const textSpan = itemEl.createSpan({ cls: 'task-text' });
            MarkdownRenderer.render(this.app, task.text, textSpan, task.file.path, this);
  
            itemEl.addEventListener('click', () => {
                this.app.workspace.openLinkText(task.file.path, '', false, { eState: { line: task.lineNumber } });
                this.hideFilePopup();
            });
        };
        
        // --- NEW Structured Rendering Logic ---
        const allFiles = [
            ...(dataByType.daily || []),
            ...(dataByType.created || []),
            ...(dataByType.modified || []),
            ...(dataByType.assets || [])
        ];
        const hasTasks = dataByType.tasks && dataByType.tasks.length > 0;
        const hasFiles = allFiles.length > 0;

        if (hasTasks) {
            this.popupEl.createEl('h6', { text: 'Tasks', cls: 'popup-section-header' });
            dataByType.tasks.forEach(task => addTaskToList(task));
        }

        if (hasTasks && hasFiles) {
            this.popupEl.createDiv({ cls: 'popup-separator' });
        }

        if (hasFiles) {
            this.popupEl.createEl('h6', { text: 'Notes & Assets', cls: 'popup-section-header' });
            (dataByType.daily || []).forEach(file => addFileToList(file, 'daily'));
          (dataByType.created || []).forEach(file => addFileToList(file, 'created'));
          (dataByType.modified || []).forEach(file => addFileToList(file, 'modified'));
          (dataByType.assets || []).forEach(file => addFileToList(file, 'asset'));
        }

      if (!this.popupEl.hasChildNodes()) {
         this.hideFilePopup();
         return;
      }
    
      this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
      this.popupEl.addEventListener('mouseleave', () => {
         this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
      });
    
      document.body.appendChild(this.popupEl);

      // --- Smart Positioning Logic ---
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
            this.taskCache = new Map();
        }
    }

    updateMonthTitle() { if (this.monthNameEl) this.monthNameEl.textContent = formatMonthTitle(this.displayedMonth, this.plugin.settings.monthTitleFormat); }
    changeMonth(offset, toToday = false) { if(toToday) this.displayedMonth = new Date(); else this.displayedMonth.setMonth(this.displayedMonth.getMonth() + offset, 1); this.updateMonthTitle(); this.renderCalendar(); }
    
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
    
        // --- (Logic for fetching notes remains the same) ---
        if (this.notesViewMode === 'pinned') {
            const pinTag = `#${settings.pinTag.toLowerCase()}`;
            notesToShow = this.app.vault.getMarkdownFiles().filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                return cache?.tags?.some(tag => tag.tag.toLowerCase() === pinTag);
            }).sort((a, b) => a.basename.localeCompare(b.basename));
        } else {
            const cutoff = moment().subtract(settings.notesLookbackDays, 'days').valueOf();
            notesToShow = this.app.vault.getMarkdownFiles()
                .filter(file => !settings.ignoreFolders.some(f => file.path.startsWith(f)) && (file.stat.mtime >= cutoff || file.stat.ctime >= cutoff))
                .sort((a,b) => b.stat.mtime - a.stat.mtime);
        }
        
        const searchTerm = this.notesSearchTerm.toLowerCase();
        const filteredNotes = searchTerm ? notesToShow.filter(file => file.basename.toLowerCase().includes(searchTerm)) : notesToShow;
        const searchInputEl = this.notesSearchInputEl;
    
        // --- (Tooltip and Grouping logic remains the same) ---
        const createTooltipText = (file) => {
            const ctime = new Date(file.stat.ctime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
            const mtime = new Date(file.stat.mtime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
            const size = (file.stat.size / 1024).toFixed(2) + ' KB';
            const path = file.path;
            const tagsCache = this.app.metadataCache.getFileCache(file)?.tags;
            let tags = "No tags";
            if (tagsCache && tagsCache.length > 0) {
               tags = [...new Set(tagsCache.map(t => t.tag))].join(' ');
            }
            return `Created: ${ctime}\nModified: ${mtime}\nSize: ${size}\nPath: ${path}\nTags: ${tags}`;
         };
   
         const addTooltip = (element, file) => {
            if (this.plugin.settings.showNoteTooltips) {
               element.setAttribute('aria-label', createTooltipText(file));
            }
         };
        const groups = { today: [], yesterday: [], thisWeek: [], lastWeek: [], thisMonth: [], older: [] };
        const now = moment();
        filteredNotes.forEach(file => {
            const modTime = moment(file.stat.mtime);
            if (modTime.isSame(now, 'day')) groups.today.push(file);
            else if (modTime.isSame(now.clone().subtract(1, 'day'), 'day')) groups.yesterday.push(file);
            else if (modTime.isSame(now, 'week')) groups.thisWeek.push(file);
            else if (modTime.isSame(now.clone().subtract(1, 'week'), 'week')) groups.lastWeek.push(file);
            else if (modTime.isSame(now, 'month')) groups.thisMonth.push(file);
            else groups.older.push(file);
        });
        const groupOrder = [
            { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' },
            { key: 'thisWeek', label: 'This Week' }, { key: 'lastWeek', label: 'Last Week' },
            { key: 'thisMonth', label: 'This Month' }, { key: 'older', label: 'Older' },
        ];
    
        // --- Corrected Rendering Logic ---
        groupOrder.forEach(groupInfo => {
            const notesInGroup = groups[groupInfo.key];
            if (notesInGroup.length > 0) {
                
                const groupContainer = this.notesContentEl.createDiv({ cls: 'note-group-container' });
                const isCollapsed = this.collapsedNoteGroups[groupInfo.key];
                if (isCollapsed) groupContainer.addClass('is-collapsed');
    
                const header = groupContainer.createDiv({ cls: 'note-group-header' });
                const headerContent = header.createDiv({ cls: 'note-group-header-content' });
                
                const collapseIcon = headerContent.createDiv({ cls: 'note-group-collapse-icon' });
                setIcon(collapseIcon, 'chevron-down');
                headerContent.createSpan({ text: groupInfo.label });
                header.createDiv({ cls: 'note-group-count', text: notesInGroup.length });
    
                header.addEventListener('click', () => {
                    const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
                    this.collapsedNoteGroups[groupInfo.key] = currentlyCollapsed;
                    this.plugin.saveSettings();
                });
    
                const listWrapper = groupContainer.createDiv({ cls: 'note-list-wrapper' });
    
                notesInGroup.forEach(file => {
                    const row = listWrapper.createDiv("note-row"); // Append to listWrapper, NOT this.notesContentEl
                    const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });
                    addTooltip(titleWrapper, file);
    
                    if (settings.showNoteStatusDots) {
                        const dot = titleWrapper.createDiv({ cls: `note-status-dot` });
                        if (this.isDailyNote(file)) dot.style.backgroundColor = settings.dailyNoteDotColor;
                        else if (this.isWeeklyNote(file)) dot.style.backgroundColor = settings.weeklyNoteDotColor;
                        else dot.addClass(isSameDay(new Date(file.stat.ctime), new Date(file.stat.mtime)) ? "note-status-dot-created" : "note-status-dot-modified");
                    }
    
                    const titlePathWrapper = titleWrapper.createDiv({ cls: 'note-title-path-wrapper' });
                    titlePathWrapper.createDiv({ text: file.basename, cls: "note-title" });
                    if (file.parent && file.parent.path !== '/') titlePathWrapper.createDiv({ text: file.parent.path, cls: 'note-path' });
                    
                    row.createDiv({ text: formatDateTime(new Date(file.stat.mtime)), cls: "note-mod-date" });
                
                    this.registerDomEvent(row, "click", () => {
                        // Get all markdown tabs and find one with the matching file path
                        const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
                        const existingLeaf = markdownLeaves.find(leaf => leaf.view.file?.path === file.path);

                        if (existingLeaf) {
                            // If found, make that tab active
                            this.app.workspace.setActiveLeaf(existingLeaf);
                        } else {
                            // Otherwise, open the file according to the user's settings
                            const openInNewTab = this.plugin.settings.notesOpenAction === 'new-tab';
                            this.app.workspace.getLeaf(openInNewTab).openFile(file);
                        }
                    });

                    this.addKeydownListeners(row, searchInputEl);
                    this.addFileContextMenu(row, file, () => this.populateNotes());



                });
            }
        });
    
        if (filteredNotes.length === 0) {
            this.notesContentEl.createDiv({ text: 'No notes found.', cls: 'task-group-empty-message' });
        }
    }
    
    

    /**
     * Scans the vault for tasks, filters and sorts them, and populates the "Tasks" tab.
     */
    async populateTasks() {
        if (!this.tasksContentEl) return;
        const settings = this.plugin.settings;
        this.tasksContentEl.toggleClass('show-full-text', !settings.taskTextTruncate);

        // 1. GATHER NEW DATA (Same as your original logic)
        const taskIgnoreFolders = (settings.taskIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const files = this.app.vault.getMarkdownFiles().filter(file => !taskIgnoreFolders.some(f => file.path.toLowerCase().startsWith(f)));

        let allTasks = [];
        const taskRegex = /^\s*(?:-|\d+\.)\s*\[(.)\]\s*(.*)/;
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
        const completionDateRegex = /✅\s*(\d{4}-\d{2}-\d{2})/;
        const tagRegex = /#([a-zA-Z0-9_\-\/]+)/g;

        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            const lines = content.split('\n');
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
        let filteredTasks = allTasks.filter(task => !searchTerm || task.text.toLowerCase().includes(searchTerm));
        
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
            const message = searchTerm ? 'No tasks match your search term.' : 'No tasks found.';
            this.tasksContentEl.createDiv({ text: message, cls: 'task-group-empty-message' });
        } else {
            // Remove any "no tasks" message if it exists
            const emptyMessage = this.tasksContentEl.querySelector('.task-group-empty-message');
            if (emptyMessage) emptyMessage.remove();
        }
    }


    // In your PeriodMonthView class
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
            const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
            this.plugin.settings.collapsedTaskGroups[key] = currentlyCollapsed;
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


    renderTasksByTag(tasks, settings) { // Receives 'settings' as an argument
        // The duplicate declaration that caused the error has been removed.
        tasks = tasks.filter(task => {
            const isCompleted = task.status && task.status.toLowerCase() === 'x';
            if (!isCompleted) return true;
            return settings.showCompletedTasksToday && task.completionDate && isSameDay(task.completionDate, new Date());
        });
        
        const groupedByTag = tasks.reduce((acc, task) => {
            const tags = task.tags.length > 0 ? task.tags : ['#untagged'];
            tags.forEach(tag => {
                if (!acc[tag]) acc[tag] = [];
                acc[tag].push(task);
            });
            return acc;
        }, {});
    
        Object.keys(groupedByTag).sort().forEach(tag => {
            const tasksInGroup = groupedByTag[tag];
    
            const groupContainer = this.tasksContentEl.createDiv({ cls: 'task-group-container', attr: { style: `background-color: ${settings.taskGroupColorTag}` } });
            
            const isCollapsed = this.collapsedTaskGroups[tag];
            if (isCollapsed) groupContainer.addClass('is-collapsed');
            
            const header = groupContainer.createDiv({ cls: 'task-group-header' });
            
            header.addEventListener('click', () => {
                const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
                this.collapsedTaskGroups[tag] = currentlyCollapsed;
                this.plugin.saveSettings();
            });

            const headerContent = header.createSpan({ cls: 'task-group-header-content' });
            const tagIconName = settings.taskGroupIcons?.tag || 'tag';
            const iconEl = headerContent.createSpan({ cls: 'icon' });
            setIcon(iconEl, tagIconName);
            headerContent.createSpan({ text: `${tag} (${tasksInGroup.length})` });
    
            const collapseIcon = header.createSpan({ cls: 'task-group-collapse-icon' });
            setIcon(collapseIcon, 'chevron-down');
            
            const taskListWrapper = groupContainer.createDiv('task-list-wrapper');
            
            if (tasksInGroup.length > 0) {
                tasksInGroup.forEach(task => this.renderTaskItem(task, taskListWrapper));
            } else {
                taskListWrapper.createDiv({ text: 'No tasks with this tag.', cls: 'task-group-empty-message' });
                groupContainer.addClass('is-collapsed');
                taskListWrapper.style.display = 'none';
            }
        });
    
        if (tasks.length === 0) this.tasksContentEl.createDiv({ text: 'No tasks found.', cls: 'task-group-empty-message' });
    }

    renderTasksByDate(tasks, settings) { // Receives 'settings' as an argument
        // The duplicate declaration that caused the error has been removed.
        const now = moment().startOf('day');
        let groups = { overdue: [], today: [], tomorrow: [], next7days: [], future: [], noDate: [] };
    
        tasks.forEach(task => {
            if (!task.dueDate) {
                groups.noDate.push(task);
                return;
            }
            const due = moment(task.dueDate).startOf('day');
            if (due.isBefore(now)) groups.overdue.push(task);
            else if (due.isSame(now)) groups.today.push(task);
            else if (due.isSame(now.clone().add(1, 'day'))) groups.tomorrow.push(task);
            else if (due.isSameOrBefore(now.clone().add(7, 'days'))) groups.next7days.push(task);
            else groups.future.push(task);
        });
    
        for (const groupKey in groups) {
            groups[groupKey] = groups[groupKey].filter(task => {
                const isCompleted = task.status && task.status.toLowerCase() === 'x';
                if (!isCompleted) return true;
                return settings.showCompletedTasksToday && task.completionDate && isSameDay(task.completionDate, new Date());
            });
        }
    
        const icons = settings.taskGroupIcons || DEFAULT_SETTINGS.taskGroupIcons;
        const groupOrder = [
            { key: 'overdue', title: 'Overdue', icon: icons.overdue, color: settings.taskGroupColorOverdue },
            { key: 'today', title: 'Today', icon: icons.today, color: settings.taskGroupColorToday },
            { key: 'tomorrow', title: 'Tomorrow', icon: icons.tomorrow, color: settings.taskGroupColorTomorrow },
            { key: 'next7days', title: 'Next 7 Days', icon: icons.next7days, color: settings.taskGroupColorNext7Days },
            { key: 'future', title: 'Future', icon: icons.future, color: settings.taskGroupColorFuture },
            { key: 'noDate', title: 'No Due Date', icon: icons.noDate, color: settings.taskGroupColorNoDate }
        ];
    
        let totalTasksRendered = 0;
        groupOrder.forEach(g => {
            if (settings.taskDateGroupsToShow.includes(g.key) || g.key === 'noDate') {
                const tasksInGroup = groups[g.key];
                totalTasksRendered += tasksInGroup.length;
    
                const groupContainer = this.tasksContentEl.createDiv({ cls: 'task-group-container', attr: { style: `background-color: ${g.color}` } });
                
                const isCollapsed = this.collapsedTaskGroups[g.key];
                if (isCollapsed) groupContainer.addClass('is-collapsed');

                const header = groupContainer.createDiv({ cls: 'task-group-header' });
                
                header.addEventListener('click', () => {
                    const currentlyCollapsed = groupContainer.classList.toggle('is-collapsed');
                    this.collapsedTaskGroups[g.key] = currentlyCollapsed;
                    this.plugin.saveSettings();
                });

                const headerContent = header.createSpan({ cls: 'task-group-header-content' });
                const iconEl = headerContent.createSpan({ cls: 'icon' });
                setIcon(iconEl, g.icon);
                headerContent.createSpan({ text: `${g.title} (${tasksInGroup.length})` });
    
                const collapseIcon = header.createSpan({ cls: 'task-group-collapse-icon' });
                setIcon(collapseIcon, 'chevron-down');
    
                const taskListWrapper = groupContainer.createDiv('task-list-wrapper');
                if (tasksInGroup.length > 0) {
                    tasksInGroup.forEach(task => this.renderTaskItem(task, taskListWrapper));
                } else {
                    taskListWrapper.createDiv({ text: `No ${g.title.toLowerCase()} tasks.`, cls: 'task-group-empty-message' });
                    groupContainer.addClass('is-collapsed');
                    taskListWrapper.style.display = 'none';
                }
            }
        });
    
        if (totalTasksRendered === 0 && this.tasksSearchTerm) {
            this.tasksContentEl.createDiv({ text: 'No tasks match your search term.', cls: 'task-group-empty-message' });
        }
    }
    
    /**
     * Renders a single task item row in a task group.
     * @param {object} task The task object.
     * @param {HTMLElement} container The parent container for the task row.
     */
    renderTaskItem(task) {
        const taskRow = createDiv({ cls: 'task-row' }); // Use createDiv, not container.createDiv
        taskRow.dataset.key = this.getTaskKey(task);
        taskRow.dataset.taskStatus = task.status;
        const searchInputEl = this.tasksSearchInputEl;

        const checkbox = taskRow.createDiv({ cls: 'task-checkbox-symbol' });
        this._renderTaskSymbol(checkbox, task);

        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.toggleTaskCompletion(task);
            this.populateTasks(); 
        });

        const textEl = taskRow.createSpan({ cls: 'task-text' });
        MarkdownRenderer.render(this.app, task.text, textEl, task.file.path, this);

        taskRow.addEventListener('click', () => this.app.workspace.openLinkText(task.file.path, '', false, { eState: { line: task.lineNumber } }));
        this.addKeydownListeners(taskRow, searchInputEl);

        setTimeout(() => {
            if (this.plugin.settings.taskTextTruncate && textEl.scrollWidth > textEl.clientWidth) {
                const tooltipText = `Task: ${task.text}\n\nFile: ${task.file.path}\nDue: ${task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : 'None'}\nTags: ${task.tags.length > 0 ? task.tags.map(t => '#' + t).join(' ') : 'None'}`;
                textEl.setAttribute('aria-label', tooltipText);
            }
        }, 0);

        return taskRow; // This is the crucial addition
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
        // Only update if the status has changed
        if (taskRowEl.dataset.taskStatus !== task.status) {
            const checkbox = taskRowEl.querySelector('.task-checkbox-symbol');
            if (checkbox) {
                this._renderTaskSymbol(checkbox, task);
            }
            taskRowEl.dataset.taskStatus = task.status;
        }

        // Only update if the text content has changed
        const textEl = taskRowEl.querySelector('.task-text');
        // A simple check to see if the rendered HTML might be different
        if (textEl && textEl.textContent !== task.text) { 
            textEl.empty(); // Clear existing rendered markdown
            MarkdownRenderer.render(this.app, task.text, textEl, task.file.path, this);
        }
    }
    
    /**
     * Opens the scratchpad note in a new or current tab.
     */
    async openScratchpadFile() {
        const path = this.plugin.settings.fixedNoteFile;
        // First, try to find an already open leaf for this file.
        let targetLeaf = this.app.workspace.getLeavesOfType("markdown").find(leaf => leaf.view.file?.path === path);
        if (targetLeaf) { this.app.workspace.revealLeaf(targetLeaf); return; }
        
        let file = this.app.vault.getAbstractFileByPath(path);
        // If the file doesn't exist, create it.
        if (!file) file = await this.app.vault.create(path, "").catch(() => new Notice(`Failed to create scratchpad: ${path}`));
        
        if (file instanceof TFile) this.app.workspace.getLeaf(this.plugin.settings.scratchpadOpenAction === 'new-tab').openFile(file);
    }
    
    /**
     * Saves text content to the scratchpad note file.
     * @param {string} text The text to save.
     */
    async saveFixedNote(text) {
        const path = this.plugin.settings.fixedNoteFile;
        const folderPath = path.substring(0, path.lastIndexOf("/"));
        // Create parent folder if it doesn't exist.
        if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
            await this.app.vault.createFolder(folderPath).catch(err => console.error("Error creating folder:", err));
        }
        let file = this.app.vault.getAbstractFileByPath(path);
        if(!file) await this.app.vault.create(path, text);
        else if (file instanceof TFile) await this.app.vault.modify(file, text);
    }

    /**
     * Loads the content of the scratchpad note file.
     * @returns {Promise<string>} The content of the note, or an empty string if it doesn't exist.
     */
    async loadNote() {
        const path = this.plugin.settings.fixedNoteFile;
        const file = this.app.vault.getAbstractFileByPath(path);
        if(file instanceof TFile) return await this.app.vault.read(file);
        return "";
    }

    /**
     * Opens a daily note for a given date, creating it from a template if it doesn't exist.
     * @param {Date} date The date for the daily note.
     */
    async openDailyNote(date) {
        const folder = this.plugin.settings.dailyNotesFolder || "";
        const format = this.plugin.settings.dailyNoteDateFormat || "YYYY-MM-DD";
        const fileName = formatDate(date, format);
        const path = folder ? `${folder}/${fileName}.md` : `${fileName}.md`;
        
        // Find and reveal the leaf if the note is already open.
        let targetLeaf = this.app.workspace.getLeavesOfType("markdown").find(leaf => leaf.view.file?.path === path);
        if (targetLeaf) {
            this.app.workspace.revealLeaf(targetLeaf);
            return;
        }
        
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
            const openInNewTab = this.plugin.settings.dailyNoteOpenAction === 'new-tab';
            await this.app.workspace.getLeaf(openInNewTab).openFile(file);
        } else {
            // If the file doesn't exist, prompt the user to create it.
            const friendlyDate = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            new ConfirmationModal(this.app, "Create daily note?", `A daily note for ${friendlyDate} does not exist. Would you like to create it?`,
                async () => {
                    try {
                        let fileContent = "";
                        const customTemplatePath = this.plugin.settings.dailyNoteTemplatePath;
                        const templateFile = customTemplatePath ? this.app.vault.getAbstractFileByPath(customTemplatePath) : null;
                        if (templateFile instanceof TFile) {
                            fileContent = await this.app.vault.read(templateFile);
                        } else if (customTemplatePath) {
                            new Notice(`Template not found: ${customTemplatePath}`);
                        }
                        const newFile = await this.app.vault.create(path, fileContent);
                        const openInNewTab = this.plugin.settings.dailyNoteOpenAction === 'new-tab';
                        await this.app.workspace.getLeaf(openInNewTab).openFile(newFile);
                    } catch (e) {
                        new Notice("Failed to create daily note.");
                    }
                }
            , "Yes, create it").open();
        }
    }
}


/**
 * The main plugin class that registers the view and settings tab.
 */
class PeriodMonthPlugin extends Plugin {
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addStyle();
        this.updateStyles();
        this.registerView(VIEW_TYPE_PERIOD, leaf => new PeriodMonthView(leaf, this));
        this.addRibbonIcon("calendar-check", "Open Calendar Period Week Notes", () => this.activateView());
        this.addCommand({ id: "open-period-month-view", name: "Open Calendar Period Week Notes", callback: () => this.activateView() });
        this.addSettingTab(new PeriodSettingsTab(this.app, this));
        this.activateView();
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
            '--other-note-dot-color': this.settings.otherNoteDotColor,
            '--calendar-modified-dot-color': this.settings.calendarModifiedDotColor, 
            '--other-note-popup-font-size': this.settings.otherNotePopupFontSize,
            '--calendar-dot-size': this.settings.calendarDotSize + 'px',
            '--nav-button-height': this.settings.navButtonHeight,
            '--date-cell-hover-color-light': this.settings.dateCellHoverColorLight,
            '--date-cell-hover-color-dark': this.settings.dateCellHoverColorDark,
            '--main-month-year-title-font-size': this.settings.mainMonthYearTitleFontSize,
            '--main-month-year-title-weight': this.settings.mainMonthYearTitleBold ? 'bold' : 'normal',
            '--task-heading-font-size': this.settings.taskHeadingFontSize,
            '--task-text-font-size': this.settings.taskTextFontSize,
            '--scratchpad-highlight-color': this.settings.scratchpadHighlightColor,
            '--asset-dot-color': this.settings.assetDotColor,
            '--task-dot-color': this.settings.taskDotColor,
            '--task-badge-color': this.settings.taskBadgeColor, 
            '--task-badge-font-color': this.settings.taskBadgeFontColor, 
            '--task-badge-font-size': this.settings.taskBadgeFontSize,
            '--today-circle-color': this.settings.todayCircleColor,
            '--weekly-note-dot-color': this.settings.weeklyNoteDotColor,
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

    onunload() {
        // Clean up when the plugin is disabled.
        const styleEl = document.getElementById('period-month-plugin-styles');
        if (styleEl) styleEl.remove();
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => leaf.detach());
    }
}

/**
 * The settings tab class for the plugin, responsible for building the settings UI.
 */
class PeriodSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.activeTab = 'general'; // Default tab
        this.scrollPosition = 0;
    }

    refreshDisplay() {
        if (this.contentEl) {
            this.scrollPosition = this.contentEl.scrollTop;
        }
        this.display();
    }

    /**
     * A helper function to save settings and trigger a full UI refresh in any open views.
     */
    async saveAndUpdate() {
        await this.plugin.saveData(this.plugin.settings);
        this.plugin.updateStyles();
        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => {
            if (leaf.view instanceof PeriodMonthView) {
                leaf.view.rebuildAndRender();
            }
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
    createRgbaColorSetting(containerEl,name, desc, settingKey) {
        const setting = new Setting(containerEl).setName(name).setDesc(desc);
        let colorPicker;
        
        const setupComponents = () => {
            const initialValues = this.parseRgba(this.plugin.settings[settingKey]);
            setting.controlEl.empty();

            setting.addColorPicker(picker => {
                colorPicker = picker;
                picker.setValue(initialValues.color)
                    .onChange(async newColor => {
                        const currentAlpha = this.parseRgba(this.plugin.settings[settingKey]).alpha;
                        const newRgba = this.buildRgba(newColor, currentAlpha);
                        this.plugin.settings[settingKey] = newRgba;
                        if (picker.colorEl) picker.colorEl.style.backgroundColor = newRgba;
                        await this.saveAndUpdate();
                    });
            });

            setting.addSlider(slider => {
                slider.setLimits(0, 1, 0.05).setValue(initialValues.alpha).setDynamicTooltip()
                    .onChange(async newAlpha => {
                        const currentColor = this.parseRgba(this.plugin.settings[settingKey]).color;
                        const newRgba = this.buildRgba(currentColor, newAlpha);
                        this.plugin.settings[settingKey] = newRgba;
                        if (colorPicker && colorPicker.colorEl) colorPicker.colorEl.style.backgroundColor = newRgba;
                        await this.saveAndUpdate();
                    });
            });

            if (colorPicker && colorPicker.colorEl) {
                colorPicker.colorEl.style.backgroundColor = this.plugin.settings[settingKey];
            }
        };

        setupComponents();

        setting.addExtraButton(button => {
            button.setIcon("rotate-ccw").setTooltip("Reset to default").onClick(async () => {
                this.plugin.settings[settingKey] = DEFAULT_SETTINGS[settingKey];
                await this.saveAndUpdate();
                this.refreshDisplay();
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
        suggestionEl.style.display = 'none';
        inputEl.parentElement.appendChild(suggestionEl);
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
                const item = suggestionEl.createDiv({ cls: 'custom-suggestion-item', text: path });
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
        inputEl.addEventListener('blur', () => setTimeout(() => { suggestionEl.style.display = 'none'; }, 150));
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

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // Main container for the tabbed layout
        const settingsContainer = containerEl.createDiv({ cls: "period-settings-container" });
        const navEl = settingsContainer.createDiv({ cls: "period-settings-nav" });
        this.contentEl = settingsContainer.createDiv({ cls: "period-settings-content" });

        const tabs = {
            general: "General Display",
            functional: "Calendar Functional",
            dots: "Calendar Dots",
            weeklyNotes: "Weekly Notes",
            tasksIndicator: "Task Indicators",
            tabs: "General Tab",
            scratchpad: "ScratchPad Tab",
            notes: "Notes Tab",
            assets: "Assets Tab",
            tasks: "Tasks Tab",
            importExport: "Import / Export",
            startHere: "Help",
            about: "About"
        };

        // Create navigation buttons
        for (const [key, name] of Object.entries(tabs)) {
            const navButton = navEl.createEl('button', {
                text: name,
                cls: 'period-settings-nav-button'
            });
            if (this.activeTab === key) {
                navButton.addClass('is-active');
            }
            navButton.addEventListener('click', () => {
                this.activeTab = key;
                // Re-render the entire display to update active state and content
                this.refreshDisplay();
            });
        }
        
        // Render the content for the active tab
        this.renderContentForActiveTab();
        // Restore scroll position after re-rendering
        if (this.contentEl && this.scrollPosition) {
           this.contentEl.scrollTop = this.scrollPosition;
        }
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
            case 'assets':
                this.renderAssetsSettings();
                break;
            case 'tasks':
                this.renderTasksSettings();
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
        new Setting(containerEl).setName("Month title font size").setDesc("Font size for the main 'Month Year' title at the top of the calendar. Default is 20px.").addText(text => text.setValue(this.plugin.settings.mainMonthYearTitleFontSize).onChange(async value => { this.plugin.settings.mainMonthYearTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold month title").setDesc("Toggles bold font weight for the main 'Month Year' title.").addToggle(toggle => toggle.setValue(this.plugin.settings.mainMonthYearTitleBold).onChange(async value => { this.plugin.settings.mainMonthYearTitleBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl,"Month Title Color (Light Mode)", "Color for the main 'Month Year' title in light mode.", "monthColorLight");
        this.createRgbaColorSetting(containerEl,"Month Title Color (Dark Mode)", "Color for the main 'Month Year' title in dark mode.", "monthColorDark");       
        new Setting(containerEl).setName("Navigation buttons height").setDesc("The height of the navigation buttons (←, Today, →) next to the month title. Default is 28px.").addText(text => text.setValue(this.plugin.settings.navButtonHeight).onChange(async value => { this.plugin.settings.navButtonHeight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold calendar header").setDesc("Toggles bold font weight for the day names row (Mon, Tue, etc.) in the calendar.").addToggle(toggle => toggle.setValue(this.plugin.settings.headerRowBold).onChange(async value => { this.plugin.settings.headerRowBold = value; await this.saveAndUpdate(); }));

        // --- Calendar Grid Section ---
        new Setting(containerEl).setName("Calendar Grid").setHeading();
        
        new Setting(containerEl)
        .setName("Calendar grid layout")
        .setDesc("Choose between a spacious, normal or condensed layout for the calendar grid.")
        .addDropdown(dropdown => dropdown
            .addOption('spacious', 'Spacious')
            .addOption('normal', 'Normal')
            .addOption('condensed', 'Condensed')
            //.addOption('super-condensed', 'Super Condensed') 
            .setValue(this.plugin.settings.calendarLayout)
            .onChange(async (value) => {
                this.plugin.settings.calendarLayout = value;
                await this.saveAndUpdate();
            }));
        
        new Setting(containerEl)
            .setName("Show calendar grid lines")
            .setDesc("Toggle the visibility of the border lines between calendar days.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCalendarGridLines)
                .onChange(async (value) => {
                this.plugin.settings.showCalendarGridLines = value;
                await this.saveAndUpdate();
                }));
        new Setting(containerEl).setName("P/W column font size").setDesc("Font size for the Period/Week column labels. Default is 13px.").addText(text => text.setValue(this.plugin.settings.fontSize).onChange(async value => { this.plugin.settings.fontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold P/W column").setDesc("Toggles bold font weight for the Period/Week column in the calendar.").addToggle(toggle => toggle.setValue(this.plugin.settings.pwColumnBold).onChange(async value => { this.plugin.settings.pwColumnBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Day number font size").setDesc("Font size for the day numbers (1, 2, 3...) within the calendar grid. Default is 15px.").addText(text => text.setValue(this.plugin.settings.dayNumberFontSize).onChange(async value => { this.plugin.settings.dayNumberFontSize = value; await this.saveAndUpdate(); }));
        
        new Setting(containerEl)
        .setName("Today's date style")
        .setDesc("Choose how to indicate the current day on the calendar.")
        .addDropdown(dropdown => dropdown
            .addOption('none', 'Off (No Highlight)') 
            .addOption('cell', 'Highlight Cell')
            .addOption('circle', 'Circle Around Date')
            .addOption('number', 'Square Around Date')
            .setValue(this.plugin.settings.todayHighlightStyle)
            .onChange(async (value) => {
                this.plugin.settings.todayHighlightStyle = value;
                await this.saveAndUpdate();
                this.refreshDisplay();
            }));
        
        if (this.plugin.settings.todayHighlightStyle === 'cell') {

            this.createRgbaColorSetting(containerEl,"Today's Date Highlight (Light Mode)", "Background color for the current day's cell in light mode.", "todayHighlightColorLight");
            this.createRgbaColorSetting(containerEl,"Today's Date Highlight (Dark Mode)", "Background color for the current day's cell in dark mode.", "todayHighlightColorDark");
        }
        

        // Show the single highlight color picker if 'circle' OR 'number' style is selected
        if (this.plugin.settings.todayHighlightStyle === 'circle' || this.plugin.settings.todayHighlightStyle === 'number') {
            this.createRgbaColorSetting(containerEl, "Today's Highlight Color", "Controls the highlight for the 'Square' and 'Number Only' styles.", "todayCircleColor");
        }

        this.createRgbaColorSetting(containerEl,"Date Cell Hover (Light Mode)", "Background color when hovering over a date cell in light mode.", "dateCellHoverColorLight");
        this.createRgbaColorSetting(containerEl,"Date Cell Hover (Dark Mode)", "Background color when hovering over a date cell in dark mode.", "dateCellHoverColorDark");
       
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

        
        this.createRgbaColorSetting(containerEl,"Grid Highlight Color (Light Mode)", "Color for row/column highlighting on hover in light mode.", "rowHighlightColorLight");
        this.createRgbaColorSetting(containerEl,"Grid Highlight Color (Dark Mode)", "Color for row/column highlighting on hover in dark mode.", "rowHighlightColorDark");

    }

    renderDotsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Calendar Dot Indicators" });
        // --- Dot Functionality Section ---
        new Setting(containerEl).setName("Functionality & Style").setHeading();
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
        new Setting(containerEl).setName("Calendar dot size").setDesc("The size (in pixels) of the colored dots that appear under calendar days. Default is 4.").addText(text => text.setValue(String(this.plugin.settings.calendarDotSize)).onChange(async (value) => { this.plugin.settings.calendarDotSize = Number(value) || 4; await this.saveAndUpdate(); }));
        
        // --- Dot Colors Section ---
        new Setting(containerEl).setName("Dot Colors").setHeading();
        this.createRgbaColorSetting(containerEl,"Daily Note Dot", "Dot for daily notes on the calendar and note lists .", "dailyNoteDotColor");
        this.createRgbaColorSetting(containerEl,"Created Note Dot", "Dot on calendar and note lists for non-daily, newly created notes.", "otherNoteDotColor");
        this.createRgbaColorSetting(containerEl,"Modified Note Dot", "Dot on calendar and note lists for non-daily, modified notes.", "calendarModifiedDotColor");
        this.createRgbaColorSetting(containerEl,"Asset Note Dot", "Dot on calendar and note lists for newly added assets.", "assetDotColor");

        // --- Popups Section ---
        new Setting(containerEl).setName("Popups").setHeading();
        new Setting(containerEl).setName("Popup hover delay").setDesc("How long to wait before showing the note list popup on hover. Default is 100ms.").addText(text => text.setValue(String(this.plugin.settings.otherNoteHoverDelay)).onChange(async (value) => { this.plugin.settings.otherNoteHoverDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup hide delay").setDesc("How long to wait before hiding the popup after the mouse leaves. Default is 100ms.").addText(text => text.setValue(String(this.plugin.settings.popupHideDelay)).onChange(async (value) => { this.plugin.settings.popupHideDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup gap").setDesc("The gap (in pixels) between a calendar day and its popup list. Can be negative. Default is -2.").addText(text => text.setValue(String(this.plugin.settings.popupGap)).onChange(async (value) => { this.plugin.settings.popupGap = Number(value) || -2; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup font size").setDesc("The font size for the note names inside the calendar popup. Default is 13px.").addText(text => text.setValue(this.plugin.settings.otherNotePopupFontSize).onChange(async value => { this.plugin.settings.otherNotePopupFontSize = value; await this.saveAndUpdate(); }));
        this.createIgnoredFolderList(containerEl, "Ignore folders for calendar grid dots", "Files in these folders will not create 'created' or 'modified' dots on the calendar.", 'otherNoteIgnoreFolders');
        this.createIgnoredFolderList(containerEl, "Ignore folders for asset dots", "Assets in these folders will not create dots on the calendar.", 'assetIgnoreFolders');

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
                .setDesc("The font size for the number inside the task badge. Default is 9px.")
                .addText(text => text
                    .setValue(this.plugin.settings.taskBadgeFontSize)
                    .onChange(async (value) => {
                        this.plugin.settings.taskBadgeFontSize = value;
                        await this.saveAndUpdate();
                    }));

            this.createRgbaColorSetting(containerEl,"Task badge color", "The background color of the task count badge.", "taskBadgeColor");
            this.createRgbaColorSetting(containerEl,"Task badge font color", "The color of the number inside the task count badge.", "taskBadgeFontColor");
        }

        if (this.plugin.settings.taskIndicatorStyle === 'heatmap') {
            containerEl.createEl('p', { text: 'Configure the start, middle, and end points of the dynamic color gradient. Colors will be blended smoothly between these points.', cls: 'setting-item-description' });

            new Setting(containerEl).setName("Gradient Midpoint").setDesc("The number of tasks that should have the exact 'Mid' color. Default is 5.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMidpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMidpoint = Number(value) || 5; await this.saveAndUpdate(); }));
            new Setting(containerEl).setName("Gradient Maxpoint").setDesc("The number of tasks that should have the exact 'End' color. Any day with more tasks will also use the end color. Default is 10.").addText(text => text.setValue(String(this.plugin.settings.taskHeatmapMaxpoint)).onChange(async (value) => { this.plugin.settings.taskHeatmapMaxpoint = Number(value) || 10; await this.saveAndUpdate(); }));

            this.createRgbaColorSetting(containerEl,"Heatmap: Start Color (1 Task)", "The color for days with 1 task.", "taskHeatmapStartColor");
            this.createRgbaColorSetting(containerEl,"Heatmap: Mid Color", "The color for days meeting the 'Midpoint' task count.", "taskHeatmapMidColor");
            this.createRgbaColorSetting(containerEl,"Heatmap: End Color", "The color for days meeting the 'Maxpoint' task count.", "taskHeatmapEndColor");
        }
        
        new Setting(containerEl)
            .setName("Task badge font size")
            .setDesc("The font size for the number inside the task badge. Default is 10px.")
            .addText(text => text
                .setValue(this.plugin.settings.taskBadgeFontSize)
                .onChange(async (value) => {
                    this.plugin.settings.taskBadgeFontSize = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting(containerEl,"Task badge color", "The background color of the task count badge.", "taskBadgeColor");
        this.createRgbaColorSetting(containerEl,"Task badge font color", "The color of the number inside the task count badge.", "taskBadgeFontColor");
        
    }

    renderTabsSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "General Tab Settings" });
        new Setting(containerEl).setName("Tab title font size").setDesc("Font size for the tab titles (ScratchPad, Notes, Tasks). Default is 14px.").addText(text => text.setValue(this.plugin.settings.tabTitleFontSize).onChange(async value => { this.plugin.settings.tabTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold tab titles").setDesc("Toggles bold font weight for the tab titles.").addToggle(toggle => toggle.setValue(this.plugin.settings.tabTitleBold).onChange(async value => { this.plugin.settings.tabTitleBold = value; await this.saveAndUpdate(); }));
        
        this.createRgbaColorSetting(containerEl,"Active Tab Indicator", "Underline color for the active tab.", "selectedTabColor");
        new Setting(containerEl).setName("Tab Order").setDesc("Enter the desired tab order, separated by commas (e.g., tasks,scratch,notes). You can also drag-and-drop the tabs in the plugin view.").addText(text => text.setValue(this.plugin.settings.tabOrder.join(', ')).onChange(async (value) => {
            const validKeys = ["scratch", "notes", "assets", "tasks"];
            const newOrder = value.split(',').map(s => s.trim()).filter(s => validKeys.includes(s));
            const uniqueOrder = [...new Set(newOrder)];
            validKeys.forEach(key => { if (!uniqueOrder.includes(key)) { uniqueOrder.push(key); } });
            this.plugin.settings.tabOrder = uniqueOrder;
            await this.saveAndUpdate();
        }));
        new Setting(containerEl).setName("Tab Visibility").setHeading();
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
            .setName("Show Tasks tab")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.tabVisibility.tasks)
                .onChange(async (value) => {
                    this.plugin.settings.tabVisibility.tasks = value;
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
            .setName("Desktop tab name display style")
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
            .setName("Mobile tab name display style")
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
        
        new Setting(containerEl).setName("Tab Icons").setHeading();

        const tabIconSettings = [
            { key: 'scratch', name: 'ScratchPad' },
            { key: 'notes', name: 'Notes' },
            { key: 'tasks', name: 'Tasks' },
            { key: 'pinned', name: 'Pinned View' },
            { key: 'assets', name: 'Assets View' },
        ];
        tabIconSettings.forEach(s => {
            new Setting(containerEl).setName(`${s.name} tab icon`).setDesc("Enter any Lucide icon name.")
            .addText(text => text
                .setValue(this.plugin.settings.tabIcons[s.key] || DEFAULT_SETTINGS.tabIcons[s.key])
                .onChange(async (value) => {
                    this.plugin.settings.tabIcons[s.key] = value;
                    await this.saveAndUpdate();
                }));
        });

        
        new Setting(containerEl).addButton(button => button
            .setButtonText("Reset Tab Icons")
            .setTooltip("Resets tab icons to their original values")
            .onClick(async () => {
                this.plugin.settings.tabIcons = { ...DEFAULT_SETTINGS.tabIcons }; 
                await this.saveAndUpdate();
                this.refreshDisplay();
            }));

    }

    renderScratchpadSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "ScratchPad Tab Settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        new Setting(containerEl).setName("ScratchPad tab click action").setDesc("What to do when the ScratchPad tab is clicked while it's already active.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.scratchpadOpenAction).onChange(async (value) => { this.plugin.settings.scratchpadOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("ScratchPad note path").setDesc("The full path to the note that the ScratchPad tab will read from and write to.").addText(text => { this.createPathSuggester(text.inputEl, (q) => this.app.vault.getMarkdownFiles().filter(f => !q || f.path.toLowerCase().includes(q)).map(f => f.path)); text.setValue(this.plugin.settings.fixedNoteFile).onChange(async value => { this.plugin.settings.fixedNoteFile = value; await this.saveAndUpdate(); }); });
        
        new Setting(containerEl)
            .setName("Show preview/edit button")
            .setDesc("Show the button to toggle between plain text editing and a rendered Markdown preview.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.scratchpad?.showPreviewToggle ?? false)
                .onChange(async (value) => {
                    if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {};
                    this.plugin.settings.scratchpad.showPreviewToggle = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show '+ Task' button")
            .setDesc("Show the button in the scratchpad area to quickly add a new task.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.scratchpad?.showAddTaskButton ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.scratchpad) this.plugin.settings.scratchpad = {};
                    this.plugin.settings.scratchpad.showAddTaskButton = value;
                    await this.saveAndUpdate();
                }));
        
            const  taskTitleSetting = new Setting(containerEl).setName("Task Creation Format");
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
        new Setting(containerEl).setName("ScratchPad font size").setDesc("Font size for the text inside the ScratchPad editor. Default is 14px.").addText(text => text.setValue(this.plugin.settings.scratchFontSize).onChange(async value => { this.plugin.settings.scratchFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold ScratchPad text").setDesc("Toggles bold font weight for the text in the ScratchPad.").addToggle(toggle => toggle.setValue(this.plugin.settings.scratchBold).onChange(async value => { this.plugin.settings.scratchBold = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("ScratchPad font family").setDesc("Examples: monospace, Arial, 'Courier New'. Leave blank to use the editor default.").addText(text => text.setValue(this.plugin.settings.scratchFontFamily).onChange(async (value) => { this.plugin.settings.scratchFontFamily = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl,"Search highlight color", "The background color for the selected search result in the ScratchPad.", "scratchpadHighlightColor");

    }

    renderNotesSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Notes Tab Settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        
        new Setting(containerEl).setName("Notes tab open behavior").setDesc("Choose how to open notes when clicked from the notes list.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.notesOpenAction).onChange(async (value) => { this.plugin.settings.notesOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes lookback days").setDesc("How many days back the Notes tab should look for created or modified notes. Default is 7.").addText(text => text.setValue(String(this.plugin.settings.notesLookbackDays)).onChange(async value => { this.plugin.settings.notesLookbackDays = Number(value) || 7; await this.saveAndUpdate(); }));
        new Setting(containerEl)
            .setName("Pinned notes tag")
            .setDesc("The tag to use for pinned notes, without the '#'. Default is 'pin'.")
            .addText(text => text
                .setValue(this.plugin.settings.pinTag)
                .onChange(async (value) => {
                    this.plugin.settings.pinTag = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl).setName("Appearance").setHeading();
        new Setting(containerEl).setName("Show note status dots").setDesc("Show a colored dot next to each note, indicating if it was recently created or modified.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteStatusDots).onChange(async value => { this.plugin.settings.showNoteStatusDots = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl,"Created Note Dot", "Color for the dot on recently created notes in the list.", "noteCreatedColor");
        this.createRgbaColorSetting(containerEl,"Modified Note Dot", "Color for the dot on recently modified notes in the list.", "noteModifiedColor");
        new Setting(containerEl).setName("Show note tooltips").setDesc("Show a detailed tooltip on hover, containing note path, dates, size, and tags.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteTooltips).onChange(async value => { this.plugin.settings.showNoteTooltips = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes list font size").setDesc("Font size for note titles in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.notesFontSize).onChange(async value => { this.plugin.settings.notesFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold note titles").setDesc("Toggles bold font weight for note titles in the list.").addToggle(toggle => toggle.setValue(this.plugin.settings.notesBold).onChange(async value => { this.plugin.settings.notesBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting(containerEl,"Note/Task Hover Color", "Background color when hovering a note or task in a list.", "notesHoverColor");
        
        this.createIgnoredFolderList(containerEl, "Ignore folders in Notes tab", "Files in these folders will not appear in the 'Notes' list.", 'ignoreFolders');
        
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
            .setDesc("How many days back the Assets tab should look for created or modified notes. Default is 7.")
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
        
        new Setting(containerEl).setName("Show indicator for unused assets").setDesc("An icon will appear next to assets that are not linked or embedded in any note, allowing for deletion.").addToggle(toggle => toggle.setValue(this.plugin.settings.showUnusedAssetsIndicator).onChange(async (value) => {this.plugin.settings.showUnusedAssetsIndicator = value;await this.saveAndUpdate();}));

    }

    renderTasksSettings() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Tasks Tab Settings" });
        new Setting(containerEl).setName("Display & Sorting").setHeading();
        new Setting(containerEl).setName("Task group heading font size").setDesc("The font size for the date/tag group headings (e.g., 'Overdue', 'Today'). Default is 13px.").addText(text => text.setValue(this.plugin.settings.taskHeadingFontSize).onChange(async value => { this.plugin.settings.taskHeadingFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task text font size").setDesc("The font size for the individual task items in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.taskTextFontSize).onChange(async value => { this.plugin.settings.taskTextFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Truncate long task text").setDesc("If enabled, long tasks will be shortened with '...'. If disabled, they will wrap to multiple lines.").addToggle(toggle => toggle.setValue(this.plugin.settings.taskTextTruncate).onChange(async (value) => { this.plugin.settings.taskTextTruncate = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show completed tasks for Today").setDesc("If enabled, tasks that you marked as complete today will appear in the lists (regardless of their due date).").addToggle(toggle => toggle.setValue(this.plugin.settings.showCompletedTasksToday).onChange(async (value) => {this.plugin.settings.showCompletedTasksToday = value;await this.saveAndUpdate();}));
        new Setting(containerEl).setName("Task sort order").setDesc("The default order for tasks within each group.").addDropdown(dropdown => dropdown.addOption('dueDate', 'By Due Date (earliest first)').addOption('a-z', 'A-Z').addOption('z-a', 'Z-A').setValue(this.plugin.settings.taskSortOrder).onChange(async (value) => { this.plugin.settings.taskSortOrder = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Group tasks by").setDesc("Choose how to group tasks in the view. Second-clicking the Tasks tab will also toggle this.").addDropdown(dropdown => dropdown.addOption('date', 'Date (Overdue, Today, etc.)').addOption('tag', 'Tag').setValue(this.plugin.settings.taskGroupBy).onChange(async (value) => { this.plugin.settings.taskGroupBy = value; await this.saveAndUpdate(); this.refreshDisplay(); }));
        
        if (this.plugin.settings.taskGroupBy === 'date') {
            new Setting(containerEl).setName("Date Groups to Show").setHeading();
            const dateGroups = [{ key: 'overdue', name: 'Overdue' },{ key: 'today', name: 'Today' },{ key: 'tomorrow', name: 'Tomorrow' },{ key: 'next7days', name: 'Next 7 Days' },{ key: 'future', name: 'Future' },];
            dateGroups.forEach(g => { new Setting(containerEl).setName(g.name).addToggle(t => t.setValue(this.plugin.settings.taskDateGroupsToShow.includes(g.key)).onChange(async v => { const groups = this.plugin.settings.taskDateGroupsToShow; if (v && !groups.includes(g.key)) groups.push(g.key); else if (!v) this.plugin.settings.taskDateGroupsToShow = groups.filter(i => i !== g.key); await this.saveAndUpdate(); })); });
        }
        
        new Setting(containerEl).setName("Content & Appearance").setHeading();
        this.createIgnoredFolderList(containerEl, "Exclude folders from Task search", "Tasks in these folders will not appear in the 'Tasks' list.", 'taskIgnoreFolders');
        
        new Setting(containerEl).setName("Task Group Icons").setDesc("Customize the icon displayed next to each task group header.").setHeading();
        
        const iconSettings = [
            { key: 'overdue', name: 'Overdue' },
            { key: 'today', name: 'Today' },
            { key: 'tomorrow', name: 'Tomorrow' },
            { key: 'next7days', name: 'Next 7 Days' },
            { key: 'future', name: 'Future' },
            { key: 'noDate', name: 'No Due Date' },
            { key: 'tag', name: 'Tag Group' },
        ];
        iconSettings.forEach(s => { 
            new Setting(containerEl).setName(`${s.name} icon`).setDesc("Enter any Lucide icon name.")
            .addText(text => text
                .setValue(this.plugin.settings.taskGroupIcons[s.key] || DEFAULT_SETTINGS.taskGroupIcons[s.key])
                .onChange(async (value) => { 
                    this.plugin.settings.taskGroupIcons[s.key] = value; 
                    await this.saveAndUpdate(); 
                })); 
        });
        
        new Setting(containerEl).addButton(button => button.setButtonText("Reset Icons to Default").setIcon("rotate-ccw").setTooltip("Resets all task group icons to their original values").onClick(async () => { this.plugin.settings.taskGroupIcons = { ...DEFAULT_SETTINGS.taskGroupIcons }; await this.saveAndUpdate(); this.refreshDisplay(); }));

        new Setting(containerEl).setName("Task Group Backgrounds").setHeading();
        this.createRgbaColorSetting(containerEl,"Overdue", "Background color for the 'Overdue' task group.", "taskGroupColorOverdue");
        this.createRgbaColorSetting(containerEl,"Today", "Background color for the 'Today' task group.", "taskGroupColorToday");
        this.createRgbaColorSetting(containerEl,"Tomorrow", "Background color for the 'Tomorrow' task group.", "taskGroupColorTomorrow");
        this.createRgbaColorSetting(containerEl,"Next 7 Days", "Background color for the 'Next 7 Days' task group.", "taskGroupColorNext7Days");
        this.createRgbaColorSetting(containerEl,"Future", "Background color for 'Future' task group.", "taskGroupColorFuture");
        this.createRgbaColorSetting(containerEl,"No Due Date", "Background color for the 'No Due Date' task group.", "taskGroupColorNoDate");
        this.createRgbaColorSetting(containerEl,"Tag", "Background color for task groups when grouped by tag.", "taskGroupColorTag");
    }


    renderImportExportTab() {
        const containerEl = this.contentEl;
        containerEl.createEl("h1", { text: "Import & Export Settings" });

        // --- EXPORT ---
        new Setting(containerEl)
            .setName("Export Settings")
            .setDesc("Save your plugin settings to a JSON file. This is useful for backups or sharing your configuration with others.")
            .addButton(button => {
                button
                    .setButtonText("Export All Settings")
                    .setIcon("save")
                    .setTooltip("Save all plugin settings to a file")
                    .onClick(() => this.handleExport('all'));
                
                // Add this line to set the cursor style
                button.buttonEl.style.cursor = 'pointer';
            })
            .addButton(button => {
                button
                    .setButtonText("Export Theme Only")
                    .setIcon("palette")
                    .setTooltip("Save only colors, fonts, and sizes to a theme file")
                    .onClick(() => this.handleExport('theme'));
                
                // Add this line to set the cursor style
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
                
                // Add this line to set the cursor style
                button.buttonEl.style.cursor = 'pointer';
            });
    }

    /**
     * Handles the export functionality.
     * @param {'all' | 'theme'} type The type of export to perform.
     */
    handleExport(type) {
        let settingsToExport;
        let fileName = `period-week-notes-settings.json`;

        if (type === 'theme') {
            const themeKeys = [
                'fontSize', 'dayNumberFontSize', 'navButtonHeight', 'headerRowBold', 'pwColumnBold',
                'monthColorLight', 'monthColorDark', 'mainMonthYearTitleFontSize', 'mainMonthYearTitleBold',
                'tabTitleFontSize', 'tabTitleBold', 'selectedTabColor', 'todayHighlightColorLight',
                'todayHighlightColorDark', 'notesHoverColor', 'dailyNoteDotColor', 'noteCreatedColor',
                'noteModifiedColor', 'otherNoteDotColor', 'calendarModifiedDotColor', 'rowHighlightColorLight',
                'rowHighlightColorDark', 'dateCellHoverColorLight', 'dateCellHoverColorDark', 'assetDotColor',
                'todayHighlightStyle', 'todayCircleColor', 'weeklyNoteDotColor', 'scratchFontSize', 'scratchBold',
                'scratchFontFamily', 'scratchpadHighlightColor', 'notesFontSize', 'notesBold', 'notesLineHeight',
                'showNoteStatusDots', 'otherNotePopupFontSize', 'calendarDotSize', 'taskIndicatorStyle',
                'taskBadgeFontSize', 'taskBadgeColor', 'taskBadgeFontColor', 'taskHeatmapStartColor',
                'taskHeatmapMidColor', 'taskHeatmapEndColor', 'taskHeadingFontSize', 'taskTextFontSize',
                'taskGroupColorOverdue', 'taskGroupColorToday', 'taskGroupColorTomorrow',
                'taskGroupColorNext7Days', 'taskGroupColorFuture', 'taskGroupColorNoDate', 'taskGroupColorTag'
            ];
            settingsToExport = {};
            for (const key of themeKeys) {
                settingsToExport[key] = this.plugin.settings[key];
            }
            fileName = `period-week-notes-theme.json`;
        } else {
            settingsToExport = this.plugin.settings;
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

                // Basic validation to see if it's a valid settings file
                if (!importedSettings.hasOwnProperty('fontSize') && !importedSettings.hasOwnProperty('fixedNoteFile')) {
                    new Notice('Error: This does not appear to be a valid settings file.', 5000);
                    return;
                }

                new ConfirmationModal(this.app,
                    'Overwrite Settings?',
                    'Are you sure you want to import these settings? Your current configuration will be overwritten.',
                    async () => {
                        // Merge imported settings into the current settings
                        this.plugin.settings = Object.assign({}, this.plugin.settings, importedSettings);
                        await this.saveAndUpdate();
                        this.refreshDisplay(); // Re-render the settings tab
                        new Notice('Settings imported successfully!');
                    }
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
                        // Make sure to replace "your-username" with your actual username!
                        window.open("https://buymeacoffee.com/fikte");
                    });
                // This makes the button more prominent
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
            <li><strong>Go to:</strong> <code>ScratchPad Tab</code> and look for <code>ScratchPage note path</code></li>
            <li><strong>Action:</strong> Set the <strong>ScratchPad note path</strong> to any note you prefer. If it doesn't exist, the plugin will create it for you.</li>
        </ul>
        <hr>
        <h3>2. Configure Your Daily Notes</h3>
        <p>For calendar dots and click-to-open features to work, the plugin needs to know where your daily notes are.</p>
        <ul>
            <li><strong>Go to:</strong> <code>Calendar Functional -> Daily Notes</code></li>
            <li><strong>Action:</strong> Set your <strong>Daily Notes folder</strong> and <strong>Daily note format</strong> to match your existing setup (e.g., <code>YYYY-MM-DD</code>).</li>
        </ul>
        <hr>
        <h3>3. Define Your Task Format</h3>
        <p>This is the most important step for task management. For the plugin to recognize your tasks due dates, they <strong>must</strong> use the <code>📅</code> emoji for due dates.</p>
        <p><strong>Due Dates:</strong></p>
        <pre><code>- [ ] My task with a due date 📅 2025-10-26
- [ ] Review project notes #work 📅 2025-11-01</code></pre>
        <p><strong>Completion Dates:</strong></p>
        <pre><code>- [x] My completed task 📅 2025-10-26 ✅ 2025-09-19</code></pre>
        <p>NOTE: If you do not use this Task format then you can toggle off the <code>Tasks Tab</code> in <code>General Tab -> </code>Tab Visibility<code> section.</p>
        <hr>
        <h3>4. (Optional) Set Your Period/Week Start Date</h3>
        <p>If you plan to use the custom P/W calendar system (e.g., "P7W4"), you should set its starting point.</p>
        <ul>
            <li><strong>Go to:</strong> <code>Calendar Functional -> Period/Week System</code></li>
            <li><strong>Action:</strong> Set the <strong>Start of Period 1 Week 1</strong> to a Sunday of your choice.</li>
        </ul>
    `;
}


}
module.exports = PeriodMonthPlugin;
