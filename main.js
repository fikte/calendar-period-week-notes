// Import necessary components from the Obsidian API.
const { Plugin, ItemView, PluginSettingTab, Notice, TFile, TFolder, Setting, Modal, AbstractInputSuggest, moment, MarkdownRenderer, setIcon } = require("obsidian");

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
    tabOrder: ["scratch", "notes", "tasks", "assets"],
    tabIcons: {
        scratch: "pencil",
        notes: "files",
        tasks: "check-circle",
        pinned: "pin",
        assets: "image-file"
    },
    assetsLookbackDays: 7,
    tabVisibility: {
        scratch: true,
        notes: true,
        tasks: true,
        assets: true,
    },

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
    showTaskCountBadge: true,
    taskBadgeFontSize: "9px",
    taskBadgeColor: "rgba(100, 149, 237, 0.6)", // Cornflower Blue
    taskBadgeFontColor: "rgba(255, 255, 255, 1)", // White

    // Daily Notes
    dailyNotesFolder: "Daily Notes",
    dailyNoteDateFormat: "YYYY-MM-DD",
    dailyNoteTemplatePath: "",
    dailyNoteOpenAction: "new-tab",

    //period / week numbers 
    showWeekNumbers: true,
    weekNumberType: "calendar", // 'period' or 'calendar'
    weekNumberColumnLabel: "Wk",

    // Functional
    autoReloadInterval: 5000,
    startOfPeriod1Date: "2025-03-02",
    showPWColumn: false,
    pwFormat: "P#W#",
    enableRowHighlight: true,
    enableColumnHighlight: true,
    enableRowToDateHighlight: false,

    // Colors
    selectedTabColor: "rgba(102, 102, 102, 1)",
    todayHighlightColorLight: "rgba(100, 149, 237, 0.3)", // Light Cornflower Blue
    todayHighlightColorDark: "rgba(102, 102, 102, 1)",   // Grey
    notesHoverColor: "rgba(171, 171, 171, 0.3)",
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
body.is-mobile .month-header-nav button .svg-icon {
  width: 18px;
  height: 18px;
  color: var(--icon-color); /* Explicitly set the color */
  flex-shrink: 0; /* Prevents the icon from being shrunk by the flex container */
}

/* --- Calendar Collapse Animation --- */
.calendar-table-wrapper {
  flex-shrink: 0;
  max-height: 500px; 
  transition: max-height 0.3s ease-in-out, margin-bottom 0.3s ease-in-out;
  overflow: hidden;
  margin-bottom: 0.5rem; /* Specific margin for spacing */
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
  font-weight: var(--header-row-font-weight);
  height: 2.5em;
}
.period-calendar-table td {
  border: 1px solid var(--background-modifier-border);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}
.period-month-container.hide-grid .period-calendar-table td {
  border-color: transparent;
}
.period-month-container.hide-grid.tabs-are-visible:not(.vertical-view-active) .period-calendar-table tbody tr:last-child td {
  border-bottom: 1px solid var(--background-modifier-border);
}
.period-calendar-table td:not(.pw-label-cell):hover {
  background-color: var(--date-cell-hover-color-themed);
}
.period-calendar-table .today-cell {
  background-color: var(--today-highlight-color-themed);
  border-radius: 6px;
  width: 2.8em;
  height: 2.8em;
  margin: auto; /* This centers the highlight in the cell */
}
.period-calendar-table .pw-label-cell,
.period-calendar-table .week-number-cell {
  font-weight: var(--pw-column-font-weight);
  cursor: default;
  font-size: var(--header-font-size);
}

/* --- Calendar Day Content & Dots --- */
.day-content {
  position: relative;
  width: 100%;
  height: 3.5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.day-number {
  font-size: var(--day-number-font-size);
}
.day-number-other-month {
  color: var(--text-faint);
}
.dots-container {
  position: absolute;
  bottom: 4px;
  left: 0;
  display: flex;
  gap: 3px;
  align-items: center;
  width: 100%;
  justify-content: center;
  flex-wrap: nowrap;
}
.calendar-dot {
  width: var(--calendar-dot-size);
  height: var(--calendar-dot-size);
  border-radius: 50%;
}
.other-note-dot { background-color: var(--other-note-dot-color); }
.modified-file-dot { background-color: var(--calendar-modified-dot-color); }
.asset-dot { background-color: var(--asset-dot-color); }
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
  border-bottom: 1px solid var(--background-modifier-border);
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

/* --- Search Inputs (Notes, Tasks, Scratchpad) --- */
.notes-search-container, .tasks-search-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}
.notes-search-input, .tasks-search-input {
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
  color: var(--text-normal);
  width: 100%;
  padding: 2px 24px 2px 8px;
  box-sizing: border-box;
}
.notes-search-clear-btn, .tasks-search-clear-btn {
  position: absolute;
  right: 8px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: var(--font-ui-small);
  visibility: hidden;
}
.notes-search-clear-btn:hover, .tasks-search-clear-btn:hover {
  color: var(--text-normal);
}

/* --- Scratchpad Search (Responsive Flexbox Fix) --- */
.scratchpad-search-container {
    position: relative; /* Establishes a positioning context */
    display: flex;
    align-items: center;
    width: 100%;
}

.scratchpad-search-input {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    width: 100%;
    padding: 2px 8px; /* Padding will be adjusted by JS */
    box-sizing: border-box;
}

.scratchpad-search-controls {
    position: absolute; /* Position controls on top of the input */
    right: 8px;
    display: flex;
    gap: 4px;
    align-items: center;
}
.scratchpad-search-controls button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 4px;
}
.scratchpad-search-controls button:hover {
  color: var(--text-normal);
}
.scratchpad-search-count {
  color: var(--text-muted);
  font-size: 0.9em;
  margin-right: 4px;
  white-space: nowrap;
}

/* --- Scratchpad Content & Buttons --- */
.scratchpad-wrapper {
  flex: 1 1 auto;
  display: grid;
  width: 100%;
  height: 100%;
  position: relative;
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
  padding: 4px; /* Use equal padding for a square look */
  line-height: 1;
  display: flex; /* Use flex to center the icon */
  align-items: center;
  justify-content: center;
}

.scratchpad-action-btn .svg-icon {
    width: 16px; /* Set a fixed size for small UI icons */
    height: 16px;
}
.scratchpad-action-btn:hover {
  background-color: var(--background-modifier-border);
}

/* --- Scratchpad Textarea & Highlighter --- */
.scratch-base {
  margin: 0;
  padding: 0.5rem;
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
}
.note-row, .task-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1em;
  padding: 4px;
  margin-bottom: 2px;
  border-radius: var(--radius-s);
  cursor: pointer;
  outline: none;
  width: 100%;
  box-sizing: border-box;
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
  align-items: center; 
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
.task-group-header {
  display: flex;
  align-items: center; 
  gap: 6px;
  font-weight: bold;
  margin-bottom: 6px;
  font-size: var(--task-heading-font-size);
  color: var(--text-normal);
}

.task-group-empty-message {
  font-style: italic;
  color: var(--text-muted);
  padding: 4px 0;
  font-size: 0.9em;
}
.task-row .task-checkbox {
  cursor: pointer;
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
  padding: 4px 8px; 
  border-radius: 4px; 
  cursor: pointer; 
  white-space: normal; /* Allow text to wrap */
  word-break: break-word; 
  text-overflow: ellipsis; 
  font-size: var(--other-note-popup-font-size);
}
.other-notes-popup-item .svg-icon {
  flex-shrink: 0; /* Prevents the icon from shrinking */
  width: 1.2em;
  height: 1.2em;
}
.other-notes-popup-item:hover { 
  background-color: var(--background-modifier-hover); 
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
  background-color: var(--background-primary); 
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

/* --- Misc --- */
.period-month-container .svg-icon {
  color: var(--icon-color, currentColor);
}
.scratchpad-search-controls { display: none; }

/* --- Task Header Icons --- */
.task-group-header .icon {
  display: flex;         /* Use flexbox for alignment */
  align-items: center;   /* Vertically center the SVG inside */
}

.task-group-header .icon .svg-icon {
  width: var(--task-heading-font-size);  /* Make icon width match text size */
  height: var(--task-heading-font-size); /* Make icon height match text size */
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
.asset-delete-btn-left {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
}

.asset-delete-btn-left .svg-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.asset-delete-btn-left:hover .svg-icon {
  color: var(--text-error);
}
.task-count-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: var(--task-badge-color);
  color: var(--task-badge-font-color);
  font-size: var(--task-badge-font-size);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 4px rgba(0,0,0,0.2);
}
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
.asset-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Start with zero width and invisible */
  width: 0;
  padding: 0;
  margin-left: 0;
  opacity: 0;
  overflow: hidden;

  /* Animate the changes */
  transition: width 0.2s ease-out, opacity 0.2s ease-out, margin-left 0.2s ease-out, padding 0.2s ease-out;
}

.note-row:hover .asset-delete-btn {
  /* Expand to full size on hover */
  width: 20px;
  padding: 2px;
  margin-left: 8px;
  opacity: 1;
}

.asset-delete-btn .svg-icon {
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  flex-shrink: 0; /* Prevent icon from being squished during animation */
}

.asset-thumbnail-container {
  width: 28px;
  height: 28px;
  flex-shrink: 0; /* Prevents the container from shrinking */
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-icon-container {
  width: 28px;
  height: 28px;
  flex-shrink: 0; /* Prevents the container from shrinking */
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-thumbnail {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-s);
  object-fit: cover;
}

/* Styles the 'unlink' icon when it's inside the container */
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

/* By default, the trash icon is hidden */
.asset-action-icon div:nth-child(2) {
  opacity: 0;
}

/* On row hover, hide the unlink icon and show the trash icon */
.note-row:hover .asset-action-icon div:nth-child(1) {
  opacity: 0;
}
.note-row:hover .asset-action-icon div:nth-child(2) {
  opacity: 1;
}

/* Color the trash icon red on direct hover for better feedback */
.asset-action-icon:hover .svg-icon {
    color: var(--text-error);
}


.note-row:hover .asset-delete-btn {
  /* Expand to full size on hover */
  width: 20px;
  padding: 2px;
  margin-left: 8px;
  opacity: 1;
}

.asset-delete-btn .svg-icon {
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.asset-delete-btn:hover .svg-icon {
  color: var(--text-error);
}
`;

// === Helper Functions and Classes ===

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
 * @param {string} startOfPeriodsOverride - The start date in "YYYY-MM-DD" format.
 * @returns {{period: number, week: number, weekSinceStart: number}} An object with the period, week, and total weeks since start.
 */
function getPeriodWeek(date = new Date(), startOfPeriodsOverride) {
    const startString = startOfPeriodsOverride || "2025-03-02";
    const [startYear, startMonth, startDay] = startString.split('-').map(Number);

    // Use UTC to avoid timezone-related calculation errors.
    const startOfPeriodsUTC = Date.UTC(startYear, startMonth - 1, startDay);
    const currentAsUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceStart = Math.floor((currentAsUTC - startOfPeriodsUTC) / msPerDay);

    const weekNumber = Math.floor(daysSinceStart / 7);
    const periodIndex = Math.floor(weekNumber / 4);
    
    // Use modulo to cycle through periods (1-13) and weeks (1-4).
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
        
        // --- Caching and Data Maps ---
        // These maps store pre-processed data to avoid re-scanning the vault on every render.
        this.noteText = "";
        this.allTasks = [];
        this.createdNotesMap = new Map();
        this.modifiedNotesMap = new Map();
        this.assetCreationMap = new Map();
        this.tasksByDate = new Map();
        this.taskCache = new Map(); // Caches task content of files to detect changes.
        
        // --- UI and Event Handling ---
        this.scratchWrapperEl = null;
        this.scratchpadViewToggleBtn = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.popupEl = null;
        this.taskRefreshDebounceTimer = null;
        this.titleUpdateTimeout = null;
    }

    getViewType() { return VIEW_TYPE_PERIOD; }
    getDisplayText() { return "📅 Calendar Period Week Notes"; }
    getIcon() { return "calendar-check"; }
    
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
        
        backlinks.forEach(file => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });
            setIcon(itemEl, 'file-text');
            itemEl.createSpan({ text: file.basename });
            itemEl.addEventListener('click', () => {
                this.app.workspace.openLinkText(file.path, "", this.plugin.settings.notesOpenAction === 'new-tab');
                this.hideFilePopup();
            });
        });

        // Add mouse listeners to the popup itself to prevent it from closing immediately.
        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });

        document.body.appendChild(this.popupEl);
        
        // --- Re-use the exact positioning logic from the calendar popup ---
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
            tasks: "Tasks",
            assets: "Assets"
        };
        
        let iconName = '';
        let text = '';

        // The "notes" tab can represent either recent notes or pinned notes, so its label is dynamic.
        if (key === 'notes') {
            const mode = this.notesViewMode;
            iconName = mode === 'pinned' ? icons.pinned : icons.notes;
            text = mode === 'pinned' ? textLabels.pinned : textLabels.notes;
        } else {
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
        const taskLineRegex = /^\s*(?:-|\d+\.)\s*\[ \]\s*(.*)/; // Matches open tasks only
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
        
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            // Skip files in ignored folders.
            if (this.plugin.settings.taskIgnoreFolders.some(folder => file.path.startsWith(folder))) {
                continue;
            }

            const content = await this.app.vault.cachedRead(file);
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const taskMatch = line.match(taskLineRegex);
                if (taskMatch) {
                    const taskText = taskMatch[1];
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
                            completed: false
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
        this.noteText = await this.loadNote();
        this.render();

        // --- Register events and intervals ---
        const intervalMs = this.plugin.settings.autoReloadInterval || 5000;

        // Periodically check if the scratchpad file was modified externally.
        this.registerInterval(setInterval(async () => {
            const latest = await this.loadNote();
            if (latest !== this.noteText && this.noteTextarea) {
                this.noteText = latest;
                this.noteTextarea.value = latest;
            }
        }, intervalMs));

        // Periodically refresh the notes list.
        this.registerInterval(setInterval(() => {
            if (this.notesContentEl && this.notesContentEl.style.display !== "none") this.populateNotes();
        }, 5000));

        // Handler for file creation and modification events.
        const createOrModifyHandler = async (file) => {
            if (!(file instanceof TFile)) return;
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(file.path);
                this.addFileToMaps(file);
            } else {
                this.removeFileFromAssetMap(file.path);
                this.addFileToAssetMap(file);
            }
            this.refreshUI(file);
        };

        // Handler for file deletion events.
        const deleteHandler = async (file) => {
            if (!(file instanceof TFile)) return;
            if (file.path.toLowerCase().endsWith('.md')) {
                this.removeFileFromMaps(file.path);
            } else {
                this.removeFileFromAssetMap(file.path);
            }
            this.refreshUI(file);
        };

        // Handler for file rename events.
        const renameHandler = async (file, oldPath) => {
            if (!(file instanceof TFile)) return;
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
    }

    /**
     * Forces a full rebuild of all data maps and a complete re-render of the view.
     * Useful after major setting changes.
     */
    async rebuildAndRender() {
        await this.buildCreatedNotesMap();
        await this.buildModifiedNotesMap();
        await this.buildAssetCreationMap();
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
        await this.buildTasksByDateMap();
        this.renderCalendar();
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
    
        // Get the set of unused assets if the setting is enabled.
        const unusedAssetPaths = settings.showUnusedAssetsIndicator
            ? await this.getUnusedAssetPaths()
            : new Set();
    
        const cutoff = moment().startOf('day').subtract(settings.assetsLookbackDays - 1, 'days').valueOf();
        const ignoreFolders = (settings.assetIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const hiddenTypes = (settings.hiddenAssetTypes || "")
            .split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => ext.length > 0);
            
        // Filter and sort all assets based on settings.
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
    
        filteredAssets.forEach(file => {
            const row = this.assetsContentEl.createDiv("note-row");
            const isUnused = unusedAssetPaths.has(file.path);

            const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });

            // This container for the icon is our primary hover target for the backlinks popup.
            const iconContainer = titleWrapper.createDiv({ cls: 'asset-icon-container' });

            // Display a thumbnail for images.
            if (this.isImageAsset(file)) {
                const thumbnail = iconContainer.createEl('img', { cls: 'asset-thumbnail' });
                thumbnail.src = this.app.vault.getResourcePath(file);
            }

            // Add event listeners to the icon container for the backlinks popup.
            iconContainer.addEventListener('mouseenter', () => {
                clearTimeout(this.hideTimeout);
                this.hoverTimeout = setTimeout(() => {
                    this.showBacklinksPopup(iconContainer, file);
                }, 50); 
            });
            iconContainer.addEventListener('mouseleave', () => {
                clearTimeout(this.hoverTimeout);
                this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
            });

            // If the asset is unused, add the interactive delete icon.
            if (isUnused && settings.showUnusedAssetsIndicator) {
                const actionIconContainer = titleWrapper.createDiv({ cls: 'asset-action-icon' });
                const unlinkIcon = actionIconContainer.createDiv();
                setIcon(unlinkIcon, 'unlink'); // The default icon.
                const deleteIcon = actionIconContainer.createDiv();
                setIcon(deleteIcon, 'trash'); // The icon shown on hover.
                actionIconContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleDeleteAsset(file);
                });
            }

            // The filename always comes after the icons.
            const titleEl = titleWrapper.createDiv({ text: file.name, cls: "note-title" });
            titleEl.setAttribute('aria-label', file.path);

            // Right side: Metadata (file size, modification date).
            const metaContainer = row.createDiv({ cls: 'note-meta-container' });
            metaContainer.createSpan({ text: this.formatFileSize(file.stat.size), cls: "note-file-size" });
            metaContainer.createSpan({ text: formatDateTime(new Date(file.stat.mtime)), cls: "note-mod-date" });
            
            row.addEventListener("click", () => {
                let existingLeaf = null;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view.file?.path === file.path) {
                        existingLeaf = leaf;
                    }
                });
    
                if (existingLeaf) {
                    this.app.workspace.revealLeaf(existingLeaf);
                } else {
                    const openInNewTab = this.plugin.settings.assetsOpenAction === 'new-tab';
                    this.app.workspace.openLinkText(file.path, "", openInNewTab);
                }
            });
            this.addKeydownListeners(row, searchInputEl);
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
                th.style.backgroundColor = '';
                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const cell = row.children[colIndex];
                    if (cell) cell.style.backgroundColor = '';
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
    setupSearchInput(container, placeholder, clearButton, onInput) {
        const inputEl = container.createEl("input", {
            type: "text",
            placeholder: placeholder,
            cls: "notes-search-input"
        });

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

        // Add keyboard shortcuts for clearing (Escape) and navigating to the list (ArrowDown).
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

            // Set the initial tooltip.
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
                        // Toggle task grouping between 'date' and 'tag'.
                        const currentGroupBy = this.plugin.settings.taskGroupBy;
                        const newGroupBy = currentGroupBy === 'date' ? 'tag' : 'date';
                        this.plugin.settings.taskGroupBy = newGroupBy;
                        
                        await this.plugin.saveData(this.plugin.settings);
                        await this.populateTasks();
                        
                        new Notice(`Tasks now grouped by ${newGroupBy}.`);
                    } else if (key === 'notes') {
                        // Toggle the notes view mode between 'recent' and 'pinned'.
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
                
                // Show a visual indicator on the left or right side of the target tab.
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
                
                // Update the tab order in settings.
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
                
                // Reorder the DOM elements to match the new order.
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
        collapseBtn.setAttribute("aria-label", "Toggle calendar visibility");
        setIcon(collapseBtn, this.isCalendarCollapsed ? "chevron-down" : "chevron-up");
        collapseBtn.addEventListener("click", () => {
            this.isCalendarCollapsed = !this.isCalendarCollapsed;
            this.render(); 
        });

        // --- Calendar Rendering (Vertical or Horizontal) ---
        if (this.isVerticalView) {
            this.renderVerticalCalendar(container);
        } else {
            const tableWrapper = container.createDiv({ cls: "calendar-table-wrapper" });
            const table = tableWrapper.createEl("table", { cls: "period-calendar-table" });
            const headerRow = table.createEl("thead").createEl("tr");
            if (this.plugin.settings.showPWColumn) headerRow.createEl("th", { text: " " });
            if (this.plugin.settings.showWeekNumbers) headerRow.createEl("th", { text: this.plugin.settings.weekNumberColumnLabel });
            for (let d = 0; d < 7; d++) headerRow.createEl("th", { text: moment().day(d).format("ddd") });
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

            // -- SEARCH BARS --
            const scratchpadSearchContainer = searchWrapper.createDiv({ cls: "scratchpad-search-container" });
            this.scratchpadSearchInputEl = scratchpadSearchContainer.createEl("input", { 
                type: "text", 
                placeholder: "Find in scratchpad...", 
                cls: "scratchpad-search-input" 
            });

            this.scratchpadSearchControlsEl = scratchpadSearchContainer.createDiv({cls: "scratchpad-search-controls"});
            this.scratchpadSearchCountEl = this.scratchpadSearchControlsEl.createEl("span", { cls: "scratchpad-search-count" });
            this.scratchpadSearchControlsEl.createEl("button", {text: "↓"}).addEventListener('click', () => this.highlightInScratchpad('next'));
            this.scratchpadSearchControlsEl.createEl("button", {text: "↑"}).addEventListener('click', () => this.highlightInScratchpad('prev'));

            const notesSearchContainer = searchWrapper.createDiv({ cls: "notes-search-container" });
            const notesClearButton = notesSearchContainer.createEl("div", { text: "✕", cls: "notes-search-clear-btn" });
            const assetsSearchContainer = searchWrapper.createDiv({ cls: "notes-search-container" });
            const assetsClearButton = assetsSearchContainer.createEl("div", { text: "✕", cls: "notes-search-clear-btn" });
            const tasksSearchContainer = searchWrapper.createDiv({ cls: "tasks-search-container" });
            const tasksClearButton = tasksSearchContainer.createEl("div", { text: "✕", cls: "tasks-search-clear-btn" });
            
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
                this.assetsContentEl.style.display = (tab === "assets") ? "block" : "none";
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
            this.scratchpadSearchInputEl.addEventListener("input", (e) => {
                this.scratchpadSearchTerm = e.target.value;
                this.updateScratchpadSearchCount();
                this.updateScratchpadHighlights();
                });
                this.scratchpadSearchInputEl.addEventListener("keydown", (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.highlightInScratchpad(e.shiftKey ? 'prev' : 'next');
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.scratchpadSearchInputEl.value = "";
                    this.scratchpadSearchInputEl.dispatchEvent(new Event('input'));
                }
                });
            
            this.noteTextarea.value = this.noteText;
            this.noteTextarea.addEventListener("input", async () => {
                this.noteText = this.noteTextarea.value;
                await this.saveFixedNote(this.noteText);
                this.updateScratchpadSearchCount();
                this.updateScratchpadHighlights();
            });

            this.noteTextarea.addEventListener('scroll', () => {
                if (this.scratchHighlighterEl) {
                    this.scratchHighlighterEl.scrollTop = this.noteTextarea.scrollTop;
                    this.scratchHighlighterEl.scrollLeft = this.noteTextarea.scrollLeft;
                }
            });

            const notesPlaceholder = this.notesViewMode === 'pinned' ? 'Search pinned notes...' : 'Search recent notes...';
            this.notesSearchInputEl = this.setupSearchInput(notesSearchContainer, notesPlaceholder, notesClearButton, (term) => {
                this.notesSearchTerm = term;
                this.populateNotes();
            });

            this.assetsSearchInputEl = this.setupSearchInput(assetsSearchContainer, "Search recent assets...", assetsClearButton, (term) => {
                this.assetsSearchTerm = term;
                this.populateAssets();
            });

            this.tasksSearchInputEl = this.setupSearchInput(tasksSearchContainer, "Filter tasks...", tasksClearButton, (term) => {
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
    renderCalendar() { if (this.calendarBodyEl) { this.calendarBodyEl.empty(); this.generateMonthGrid(this.displayedMonth, this.calendarBodyEl); } }
    
    /**
     * Generates the grid of days for a given month and populates it in the target table body.
     * @param {Date} dateForMonth A date within the month to be rendered.
     * @param {HTMLTableSectionElement} targetBodyEl The `<tbody>` element to populate.
     */
    generateMonthGrid(dateForMonth, targetBodyEl) {
        const { settings } = this.plugin;
        const today = new Date();
        const year = dateForMonth.getFullYear();
        const month = dateForMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const folder = settings.dailyNotesFolder || "";
        const format = settings.dailyNoteDateFormat || "YYYY-MM-DD";
        const existingNotes = new Set(this.app.vault.getMarkdownFiles().filter(file => !folder || file.path.startsWith(folder + "/")).map(file => file.basename));
        
        let currentDay = new Date(firstDayOfMonth);
        currentDay.setDate(1 - currentDay.getDay()); // Start from the Sunday of the first week.

        const requiredRows = 6; // Always render 6 rows for a consistent layout.
        for(let i = 0; i < requiredRows; i++) {
            const row = targetBodyEl.createEl("tr");

            // --- Period/Week Column ---
            if (settings.showPWColumn) {
                const pwData = getPeriodWeek(new Date(currentDay), settings.startOfPeriod1Date);
                const labelText = this.formatPW(pwData.period, pwData.week);
                const pwCell = row.createEl("td", { text: labelText, cls: "pw-label-cell" });
                pwCell.addEventListener('mouseenter', () => {
                    if (this.plugin.settings.enableRowHighlight) {
                        const highlightColor = document.body.classList.contains('theme-dark')
                            ? this.plugin.settings.rowHighlightColorDark
                            : this.plugin.settings.rowHighlightColorLight;
                        row.style.backgroundColor = highlightColor;
                    }    
                });
                pwCell.addEventListener('mouseleave', () => { row.style.backgroundColor = ''; });
            }

            // --- Week Number Column ---
            if (settings.showWeekNumbers) {
                const weekDate = new Date(currentDay);
                let weekNum;
                if (settings.weekNumberType === 'period') {
                    weekNum = getPeriodWeek(weekDate, settings.startOfPeriod1Date).weekSinceStart;
                } else { // 'calendar' (ISO week)
                    const mondayOfWeek = new Date(weekDate);
                    mondayOfWeek.setDate(weekDate.getDate() + 1);
                    weekNum = moment(mondayOfWeek).isoWeek();
                }
                const weekCell = row.createEl("td", { text: weekNum, cls: "week-number-cell" });
 
               // Add the row highlight event listeners
               weekCell.addEventListener('mouseenter', () => {
                   if (this.plugin.settings.enableRowHighlight) {
                       const highlightColor = document.body.classList.contains('theme-dark')
                           ? this.plugin.settings.rowHighlightColorDark
                           : this.plugin.settings.rowHighlightColorLight;
                       row.style.backgroundColor = highlightColor;
                   }
               });
               weekCell.addEventListener('mouseleave', () => {
                  row.style.backgroundColor = '';
                });
            }

            // --- Day Cells ---
            for (let d = 0; d < 7; d++) {
                const date = new Date(currentDay);
                date.setDate(currentDay.getDate() + d);
                const isOtherMonth = date.getMonth() !== month;
                const cell = row.createEl("td");
                const contentDiv = cell.createDiv("day-content");
                const dayNumber = contentDiv.createDiv("day-number");
                dayNumber.textContent = date.getDate().toString();

                const dateKey = moment(date).format("YYYY-MM-DD");
                const tasksForDay = this.tasksByDate.get(dateKey) || [];

                // --- Task Count Badge ---
                if (settings.showTaskCountBadge && tasksForDay.length > 0) {
                    contentDiv.createDiv({
                        cls: 'task-count-badge',
                        text: tasksForDay.length.toString()
                    });
                }
                
                if (isOtherMonth) dayNumber.addClass("day-number-other-month");
                if (isSameDay(date, today)) cell.addClass("today-cell");

                // --- Dot Indicators ---
                const createdFiles = this.createdNotesMap.get(dateKey) || [];
                const modifiedFiles = this.modifiedNotesMap.get(dateKey) || [];
                const dailyNoteFileName = formatDate(date, format);
                const dailyNoteExists = existingNotes.has(dailyNoteFileName);
                const dotsContainer = contentDiv.createDiv({ cls: 'dots-container' });

                if (dailyNoteExists) {
                    dotsContainer.createDiv({cls: "period-month-daily-note-dot calendar-dot"});
                }
                if (settings.showOtherNoteDot && createdFiles.length > 0) {
                    dotsContainer.createDiv({ cls: 'other-note-dot calendar-dot' });
                }
                if (settings.showModifiedFileDot && modifiedFiles.length > 0) {
                    dotsContainer.createDiv({ cls: 'modified-file-dot calendar-dot' });
                }
                const assetsCreated = this.assetCreationMap.get(dateKey) || [];
                if (settings.showAssetDot && assetsCreated.length > 0) {
                    dotsContainer.createDiv({ cls: 'asset-dot calendar-dot' });
                }

                // --- Popup Logic ---
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
                cell.addEventListener("click", () => this.openDailyNote(date));
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
     * Shows a popup listing all notes, tasks, and assets associated with a specific day.
     * @param {HTMLElement} targetEl The calendar day element to position the popup near.
     * @param {object} dataByType An object containing arrays of items to display, keyed by type.
     */
    showFilePopup(targetEl, dataByType) {
        this.hideFilePopup();
        this.popupEl = createDiv({ cls: 'other-notes-popup' });
        const { settings } = this.plugin;

        const addFileToList = (file, type) => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });

            // If it's an image asset, show a thumbnail; otherwise, show a colored dot.
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
            
            const displayName = file.path.toLowerCase().endsWith('.md') ? file.basename : file.name;
            itemEl.createSpan({ text: displayName });

            itemEl.addEventListener('click', () => {
                this.app.workspace.openLinkText(file.path, "", settings.notesOpenAction === 'new-tab');
                this.hideFilePopup();
            });
        };
        
        const addTaskToList = (task) => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });
            setIcon(itemEl, 'check-circle');
            itemEl.createSpan({ text: task.text });

            itemEl.addEventListener('click', () => {
                // Open the file and navigate to the specific line of the task.
                this.app.workspace.openLinkText(task.file.path, '', false, { eState: { line: task.lineNumber } });
                this.hideFilePopup();
            });
        };

        (dataByType.tasks || []).forEach(task => addTaskToList(task));
        (dataByType.daily || []).forEach(file => addFileToList(file, 'daily'));
        (dataByType.created || []).forEach(file => addFileToList(file, 'created'));
        (dataByType.modified || []).forEach(file => addFileToList(file, 'modified'));
        (dataByType.assets || []).forEach(file => addFileToList(file, 'asset'));

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

        if (this.notesViewMode === 'pinned') {
            // --- PINNED NOTES LOGIC ---
            const pinTag = `#${settings.pinTag.toLowerCase()}`;
            notesToShow = this.app.vault.getMarkdownFiles().filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                return cache?.tags?.some(tag => tag.tag.toLowerCase() === pinTag);
            }).sort((a, b) => a.basename.localeCompare(b.basename));

        } else {
            // --- RECENT NOTES LOGIC ---
            const cutoff = moment().subtract(settings.notesLookbackDays, 'days').valueOf();
            notesToShow = this.app.vault.getMarkdownFiles()
                .filter(file => !settings.ignoreFolders.some(f => file.path.startsWith(f)) && (file.stat.mtime >= cutoff || file.stat.ctime >= cutoff))
                .sort((a,b) => b.stat.mtime - a.stat.mtime);
        }
        
        const searchTerm = this.notesSearchTerm.toLowerCase();
        const filteredNotes = searchTerm ? notesToShow.filter(file => file.basename.toLowerCase().includes(searchTerm)) : notesToShow;
        
        const searchInputEl = this.notesSearchInputEl;

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

        filteredNotes.forEach(file => {
            const row = this.notesContentEl.createDiv("note-row");
            const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });
            addTooltip(titleWrapper, file);
            if (settings.showNoteStatusDots) {
                const dot = titleWrapper.createDiv({ cls: `note-status-dot` });
            
                // Use a special color for daily notes.
                if (this.isDailyNote(file)) {
                    dot.style.backgroundColor = settings.dailyNoteDotColor;
                } else {
                    // Otherwise, use the standard created/modified colors.
                    dot.addClass(isSameDay(new Date(file.stat.ctime), new Date(file.stat.mtime)) ? "note-status-dot-created" : "note-status-dot-modified");
                }
            }
            titleWrapper.createDiv({ text: file.basename, cls: "note-title" });
            row.createDiv({ text: formatDateTime(new Date(file.stat.mtime)), cls: "note-mod-date" });
            
            row.addEventListener("click", () => {
                let existingLeaf = null;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view.file?.path === file.path) {
                        existingLeaf = leaf;
                    }
                });
    
                if (existingLeaf) {
                    this.app.workspace.revealLeaf(existingLeaf);
                } else {
                    const openInNewTab = this.plugin.settings.notesOpenAction === 'new-tab';
                    this.app.workspace.openLinkText(file.path, "", openInNewTab);
                }
            });
            this.addKeydownListeners(row, searchInputEl);
        });
    }


    /**
     * Scans the vault for tasks, filters and sorts them, and populates the "Tasks" tab.
     */
    async populateTasks() {
        if (!this.tasksContentEl) return;
        this.tasksContentEl.empty();
        const settings = this.plugin.settings;
        
        this.tasksContentEl.toggleClass('show-full-text', !settings.taskTextTruncate);
        
        // Clear and rebuild the task cache.
        if (this.taskCache) {
            this.taskCache.clear();
        } else {
            this.taskCache = new Map();
        }

        const taskIgnoreFolders = (settings.taskIgnoreFolders || []).map(f => f.toLowerCase().endsWith('/') ? f.toLowerCase() : f.toLowerCase() + '/');
        const files = this.app.vault.getMarkdownFiles().filter(file => {
            const filePathLower = file.path.toLowerCase();
            return !taskIgnoreFolders.some(folder => folder && filePathLower.startsWith(folder));
        });

        let allTasks = [];
        // Regex captures the completion status ('x' or ' ') and the task text.
        const taskRegex = /^\s*(?:-|\d+\.)\s*\[(.)\]\s*(.*)/;
        const dueDateRegex = /📅\s*(\d{4}-\d{2}-\d{2})/;
        const tagRegex = /#([a-zA-Z0-9_\-\/]+)/g;
        
        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            const lines = content.split('\n');
            
            // Cache the raw task lines from this file for later comparison in refreshUI.
            this.taskCache.set(file.path, this.extractTaskLines(content));

            lines.forEach((line, index) => {
                const match = line.match(taskRegex);
                if (match) {
                    const completed = match[1].trim().toLowerCase() === 'x';
                    let text = match[2];
                    const dueDateMatch = text.match(dueDateRegex);
                    const dueDate = dueDateMatch ? moment(dueDateMatch[1], "YYYY-MM-DD").toDate() : null;
                    const tags = Array.from(text.matchAll(tagRegex)).map(m => m[1]);
                    allTasks.push({ text: text.trim(), file, lineNumber: index, dueDate, tags, completed });
                }
            });
        }
        
        const searchTerm = this.tasksSearchTerm.toLowerCase();
        let filteredTasks = allTasks;
        if (searchTerm) {
            filteredTasks = allTasks.filter(task => task.text.toLowerCase().includes(searchTerm));
        }
        
        // Sort tasks based on user preference.
        filteredTasks.sort((a, b) => {
            if (settings.taskSortOrder === 'a-z') return a.text.localeCompare(b.text);
            if (settings.taskSortOrder === 'z-a') return b.text.localeCompare(a.text);
            // Default sort is by due date.
            if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
            return a.dueDate ? -1 : (b.dueDate ? 1 : a.text.localeCompare(b.text));
        });

        if (settings.taskGroupBy === 'tag') this.renderTasksByTag(filteredTasks);
        else this.renderTasksByDate(filteredTasks);
    }
    
    /**
     * Renders tasks grouped by their tags.
     * @param {Array} tasks The list of tasks to render.
     */
    renderTasksByTag(tasks) {
        const settings = this.plugin.settings;

        // Filter out completed tasks, unless they are due today and the setting is enabled.
        tasks = tasks.filter(task => {
            if (!task.completed) {
                return true;
            }
            if (settings.showCompletedTasksToday && task.dueDate && isSameDay(task.dueDate, new Date())) {
                return true;
            }
            return false;
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
            const groupContainer = this.tasksContentEl.createDiv({ cls: 'task-group-container', attr: { style: `background-color: ${this.plugin.settings.taskGroupColorTag}` } });
            const header = groupContainer.createDiv({ cls: 'task-group-header' });
            const tagIconName = this.plugin.settings.taskGroupIcons?.tag || 'tag';
            const iconEl = header.createSpan({ cls: 'icon' });
            setIcon(iconEl, tagIconName);
            header.createSpan({ text: `${tag} (${groupedByTag[tag].length})` });
            groupedByTag[tag].forEach(task => this.renderTaskItem(task, groupContainer));
        });

        if (tasks.length === 0) this.tasksContentEl.createDiv({ text: 'No tasks found.', cls: 'task-group-empty-message' });
    }
    
    /**
     * Renders tasks grouped by date categories (Overdue, Today, etc.).
     * @param {Array} tasks The list of tasks to render.
     */
    renderTasksByDate(tasks) {
        const { settings } = this.plugin;
        const now = moment().startOf('day');
        let groups = { overdue: [], today: [], tomorrow: [], next7days: [], future: [], noDate: [] };
        
        // Categorize each task into a date group.
        tasks.forEach(task => {
            if (!task.dueDate) {
                groups.noDate.push(task);
                return;
            }
            const due = moment(task.dueDate).startOf('day');
            if (due.isBefore(now)) {
                groups.overdue.push(task);
            } else if (due.isSame(now)) {
                groups.today.push(task);
            } else if (due.isSame(now.clone().add(1, 'day'))) {
                groups.tomorrow.push(task);
            } else if (due.isSameOrBefore(now.clone().add(7, 'days'))) {
                groups.next7days.push(task);
            } else {
                groups.future.push(task);
            }
        });

        // --- Filter out completed tasks based on settings ---
        groups.overdue = groups.overdue.filter(task => !task.completed);
        groups.tomorrow = groups.tomorrow.filter(task => !task.completed);
        groups.next7days = groups.next7days.filter(task => !task.completed);
        groups.future = groups.future.filter(task => !task.completed);
        groups.noDate = groups.noDate.filter(task => !task.completed);

        if (!settings.showCompletedTasksToday) {
            groups.today = groups.today.filter(task => !task.completed);
        }

        const icons = this.plugin.settings.taskGroupIcons || DEFAULT_SETTINGS.taskGroupIcons;
        const groupOrder = [
            { key: 'overdue', title: 'Overdue', icon: icons.overdue, color: settings.taskGroupColorOverdue },
            { key: 'today', title: 'Today', icon: icons.today, color: settings.taskGroupColorToday },
            { key: 'tomorrow', title: 'Tomorrow', icon: icons.tomorrow, color: settings.taskGroupColorTomorrow },
            { key: 'next7days', title: 'Next 7 Days', icon: icons.next7days, color: settings.taskGroupColorNext7Days },
            { key: 'future', title: 'Future', icon: icons.future, color: settings.taskGroupColorFuture },
            { key: 'noDate', title: 'No Due Date', icon: icons.noDate, color: settings.taskGroupColorNoDate }
        ];

        let totalTasksInVault = 0;
        groupOrder.forEach(g => {
            if (settings.taskDateGroupsToShow.includes(g.key) || g.key === 'noDate') {
                const tasksInGroup = groups[g.key];
                totalTasksInVault += tasksInGroup.length;
                const groupContainer = this.tasksContentEl.createDiv({ cls: 'task-group-container', attr: { style: `background-color: ${g.color}` } });
                const header = groupContainer.createDiv({ cls: 'task-group-header' });
                const iconEl = header.createSpan({ cls: 'icon' });
                setIcon(iconEl, g.icon);
                header.createSpan({ text: `${g.title} (${tasksInGroup.length})` });
                if (tasksInGroup.length > 0) {
                    tasksInGroup.forEach(task => this.renderTaskItem(task, groupContainer));
                } else {
                    groupContainer.createDiv({ text: `No ${g.title.toLowerCase()} tasks.`, cls: 'task-group-empty-message' });
                }
            }
        });

        if (totalTasksInVault === 0 && this.tasksSearchTerm) {
            this.tasksContentEl.createDiv({ text: 'No tasks match your search term.', cls: 'task-group-empty-message' });
        }
    }
    
    /**
     * Renders a single task item row in a task group.
     * @param {object} task The task object.
     * @param {HTMLElement} container The parent container for the task row.
     */
    renderTaskItem(task, container) {
        const taskRow = container.createDiv({ cls: 'task-row' });
        const searchInputEl = this.tasksSearchInputEl;
        
        const checkbox = taskRow.createEl('input', { type: 'checkbox', cls: 'task-checkbox' });
        checkbox.checked = task.completed;
        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent the row's click event from firing.
            await this.toggleTaskCompletion(task);
        });
        
        const textEl = taskRow.createSpan({ text: task.text, cls: 'task-text' });
        if (task.completed) {
            textEl.addClass('completed');
        }

        taskRow.addEventListener('click', () => this.app.workspace.openLinkText(task.file.path, '', false, { eState: { line: task.lineNumber } }));
        
        this.addKeydownListeners(taskRow, searchInputEl);
        
        // Add a tooltip for truncated task text.
        setTimeout(() => {
            if (this.plugin.settings.taskTextTruncate && textEl.scrollWidth > textEl.clientWidth) {
                const tooltipText = `Task: ${task.text}\n\nFile: ${task.file.path}\nDue: ${task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : 'None'}\nTags: ${task.tags.length > 0 ? task.tags.map(t => '#' + t).join(' ') : 'None'}`;
                textEl.setAttribute('aria-label', tooltipText);
            }
        }, 0);
    }

    /**
     * Toggles the completion state of a task by modifying the source Markdown file.
     * @param {object} task The task object to toggle.
     */
    async toggleTaskCompletion(task) {
        const content = await this.app.vault.read(task.file);
        const lines = content.split('\n');
        const line = lines[task.lineNumber];

        if (line.includes('[ ]')) {
            lines[task.lineNumber] = line.replace('[ ]', '[x]');
        } else if (line.includes('[x]')) {
            lines[task.lineNumber] = line.replace('[x]', '[ ]');
        }        
        await this.app.vault.modify(task.file, lines.join('\n'));
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
            '--task-badge-color': this.settings.taskBadgeColor, 
            '--task-badge-font-color': this.settings.taskBadgeFontColor, 
            '--task-badge-font-size': this.settings.taskBadgeFontSize,
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
    constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

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
    createRgbaColorSetting(name, desc, settingKey) {
        const setting = new Setting(this.containerEl).setName(name).setDesc(desc);
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
                this.display(); 
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
                            this.display();
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
                        this.display();
                    }
                });
        });
    }

    /**
     * Builds and renders the entire settings tab UI.
     */
    display() {
        const { containerEl } = this;
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
        new Setting(containerEl).setName("Month title font size").setDesc("Font size for the main 'Month Year' title at the top of the calendar. Default is 20px.").addText(text => text.setValue(this.plugin.settings.mainMonthYearTitleFontSize).onChange(async value => { this.plugin.settings.mainMonthYearTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold month title").setDesc("Toggles bold font weight for the main 'Month Year' title.").addToggle(toggle => toggle.setValue(this.plugin.settings.mainMonthYearTitleBold).onChange(async value => { this.plugin.settings.mainMonthYearTitleBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting("Month Title Color (Light Mode)", "Color for the main 'Month Year' title in light mode.", "monthColorLight");
        this.createRgbaColorSetting("Month Title Color (Dark Mode)", "Color for the main 'Month Year' title in dark mode.", "monthColorDark");       
        new Setting(containerEl).setName("Navigation buttons height").setDesc("The height of the navigation buttons (←, Today, →) next to the month title. Default is 28px.").addText(text => text.setValue(this.plugin.settings.navButtonHeight).onChange(async value => { this.plugin.settings.navButtonHeight = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold calendar header").setDesc("Toggles bold font weight for the day names row (Mon, Tue, etc.) in the calendar.").addToggle(toggle => toggle.setValue(this.plugin.settings.headerRowBold).onChange(async value => { this.plugin.settings.headerRowBold = value; await this.saveAndUpdate(); }));

        // --- Calendar Grid Section ---
        new Setting(containerEl).setName("Calendar Grid").setHeading();
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
        this.createRgbaColorSetting("Today's Date Highlight (Light Mode)", "Background color for the current day's cell in light mode.", "todayHighlightColorLight");
        this.createRgbaColorSetting("Today's Date Highlight (Dark Mode)", "Background color for the current day's cell in dark mode.", "todayHighlightColorDark");
               

        this.createRgbaColorSetting("Date Cell Hover (Light Mode)", "Background color when hovering over a date cell in light mode.", "dateCellHoverColorLight");
        this.createRgbaColorSetting("Date Cell Hover (Dark Mode)", "Background color when hovering over a date cell in dark mode.", "dateCellHoverColorDark");
       
        
        // --- Tabs Section ---
        new Setting(containerEl).setName("Tabs").setHeading();
    
        new Setting(containerEl).setName("Tab title font size").setDesc("Font size for the tab titles (ScratchPad, Notes, Tasks). Default is 14px.").addText(text => text.setValue(this.plugin.settings.tabTitleFontSize).onChange(async value => { this.plugin.settings.tabTitleFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold tab titles").setDesc("Toggles bold font weight for the tab titles.").addToggle(toggle => toggle.setValue(this.plugin.settings.tabTitleBold).onChange(async value => { this.plugin.settings.tabTitleBold = value; await this.saveAndUpdate(); }));
        
        this.createRgbaColorSetting("Active Tab Indicator", "Underline color for the active tab.", "selectedTabColor");
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
                this.display();
            }));

        containerEl.createEl("h1", { text: "Calendar Functional Settings" });

        // --- Period/Week System Section ---
        new Setting(containerEl).setName("Period/Week System").setHeading();

        
        new Setting(containerEl).setName("Start of Period 1 Week 1").setDesc("The date for the start of P1W1. This is the anchor for all Period/Week calculations. Must be a Sunday.").addText(text => { text.inputEl.type = "date"; text.setValue(this.plugin.settings.startOfPeriod1Date).onChange(async value => { this.plugin.settings.startOfPeriod1Date = value; await this.saveAndUpdate(); }); });
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
        this.createRgbaColorSetting("Grid Highlight Color (Light Mode)", "Color for row/column highlighting on hover in light mode.", "rowHighlightColorLight");
        this.createRgbaColorSetting("Grid Highlight Color (Dark Mode)", "Color for row/column highlighting on hover in dark mode.", "rowHighlightColorDark");

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
        this.createRgbaColorSetting("Daily Note Dot", "Dot for daily notes on the calendar and note lists .", "dailyNoteDotColor");
        this.createRgbaColorSetting("Created Note Dot", "Dot on calendar and note lists for non-daily, newly created notes.", "otherNoteDotColor");
        this.createRgbaColorSetting("Modified Note Dot", "Dot on calendar and note lists for non-daily, modified notes.", "calendarModifiedDotColor");
        this.createRgbaColorSetting("Asset Note Dot", "Dot on calendar and note lists for newly added assets.", "assetDotColor");

        // --- Popups Section ---
        new Setting(containerEl).setName("Popups").setHeading();
        new Setting(containerEl).setName("Popup hover delay").setDesc("How long to wait before showing the note list popup on hover. Default is 100ms.").addText(text => text.setValue(String(this.plugin.settings.otherNoteHoverDelay)).onChange(async (value) => { this.plugin.settings.otherNoteHoverDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup hide delay").setDesc("How long to wait before hiding the popup after the mouse leaves. Default is 100ms.").addText(text => text.setValue(String(this.plugin.settings.popupHideDelay)).onChange(async (value) => { this.plugin.settings.popupHideDelay = Number(value) || 100; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup gap").setDesc("The gap (in pixels) between a calendar day and its popup list. Can be negative. Default is -2.").addText(text => text.setValue(String(this.plugin.settings.popupGap)).onChange(async (value) => { this.plugin.settings.popupGap = Number(value) || -2; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Popup font size").setDesc("The font size for the note names inside the calendar popup. Default is 13px.").addText(text => text.setValue(this.plugin.settings.otherNotePopupFontSize).onChange(async value => { this.plugin.settings.otherNotePopupFontSize = value; await this.saveAndUpdate(); }));
        this.createIgnoredFolderList(containerEl, "Ignore folders for calendar grid dots", "Files in these folders will not create 'created' or 'modified' dots on the calendar.", 'otherNoteIgnoreFolders');
        this.createIgnoredFolderList(containerEl, "Ignore folders for asset dots", "Assets in these folders will not create dots on the calendar.", 'assetIgnoreFolders');

        
        containerEl.createEl("h1", { text: "Calendar Task Indicators" });

        new Setting(containerEl)
            .setName("Show task count on calendar")
            .setDesc("Display a badge with the number of open tasks for each day.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTaskCountBadge)
                .onChange(async (value) => {
                    this.plugin.settings.showTaskCountBadge = value;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("Task badge font size")
            .setDesc("The font size for the number inside the task badge. Default is 10px.")
            .addText(text => text
                .setValue(this.plugin.settings.taskBadgeFontSize)
                .onChange(async (value) => {
                    this.plugin.settings.taskBadgeFontSize = value;
                    await this.saveAndUpdate();
                }));

        this.createRgbaColorSetting("Task badge color", "The background color of the task count badge.", "taskBadgeColor");
        this.createRgbaColorSetting("Task badge font color", "The color of the number inside the task count badge.", "taskBadgeFontColor");
        
        
        // --- Scratchpad Settings Section ---
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
        this.createRgbaColorSetting("Search highlight color", "The background color for the selected search result in the ScratchPad.", "scratchpadHighlightColor");

        // --- Notes Tab Settings Section ---
        containerEl.createEl("h1", { text: "Notes Tab Settings" });
        new Setting(containerEl).setName("Functionality").setHeading();
        new Setting(containerEl)
            .setName("Pinned notes tag")
            .setDesc("The tag to use for pinned notes, without the '#'. Default is '#pin'.")
            .addText(text => text
                .setValue(this.plugin.settings.pinTag)
                .onChange(async (value) => {
                    this.plugin.settings.pinTag = value;
                    await this.saveAndUpdate();
                }));
        new Setting(containerEl).setName("Notes tab open behavior").setDesc("Choose how to open notes when clicked from the notes list.").addDropdown(dropdown => dropdown.addOption('new-tab', 'Open in a new tab').addOption('current-tab', 'Open in the current tab').setValue(this.plugin.settings.notesOpenAction).onChange(async (value) => { this.plugin.settings.notesOpenAction = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes lookback days").setDesc("How many days back the Notes tab should look for created or modified notes. Default is 7.").addText(text => text.setValue(String(this.plugin.settings.notesLookbackDays)).onChange(async value => { this.plugin.settings.notesLookbackDays = Number(value) || 7; await this.saveAndUpdate(); }));
        
        new Setting(containerEl).setName("Appearance").setHeading();
        new Setting(containerEl).setName("Show note status dots").setDesc("Show a colored dot next to each note, indicating if it was recently created or modified.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteStatusDots).onChange(async value => { this.plugin.settings.showNoteStatusDots = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting("Created Note Dot", "Color for the dot on recently created notes in the list.", "noteCreatedColor");
        this.createRgbaColorSetting("Modified Note Dot", "Color for the dot on recently modified notes in the list.", "noteModifiedColor");
        new Setting(containerEl).setName("Show note tooltips").setDesc("Show a detailed tooltip on hover, containing note path, dates, size, and tags.").addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteTooltips).onChange(async value => { this.plugin.settings.showNoteTooltips = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Notes list font size").setDesc("Font size for note titles in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.notesFontSize).onChange(async value => { this.plugin.settings.notesFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Bold note titles").setDesc("Toggles bold font weight for note titles in the list.").addToggle(toggle => toggle.setValue(this.plugin.settings.notesBold).onChange(async value => { this.plugin.settings.notesBold = value; await this.saveAndUpdate(); }));
        this.createRgbaColorSetting("Note/Task Hover Color", "Background color when hovering a note or task in a list.", "notesHoverColor");
        
        this.createIgnoredFolderList(containerEl, "Ignore folders in Notes tab", "Files in these folders will not appear in the 'Notes' list.", 'ignoreFolders');
        

        // --- Assets Tab Settings Section ---
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

        // --- Tasks Tab Settings Section ---
        containerEl.createEl("h1", { text: "Tasks Tab Settings" });

        new Setting(containerEl).setName("Display & Sorting").setHeading();
        new Setting(containerEl).setName("Task group heading font size").setDesc("The font size for the date/tag group headings (e.g., 'Overdue', 'Today'). Default is 13px.").addText(text => text.setValue(this.plugin.settings.taskHeadingFontSize).onChange(async value => { this.plugin.settings.taskHeadingFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Task text font size").setDesc("The font size for the individual task items in the list. Default is 14px.").addText(text => text.setValue(this.plugin.settings.taskTextFontSize).onChange(async value => { this.plugin.settings.taskTextFontSize = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Truncate long task text").setDesc("If enabled, long tasks will be shortened with '...'. If disabled, they will wrap to multiple lines.").addToggle(toggle => toggle.setValue(this.plugin.settings.taskTextTruncate).onChange(async (value) => { this.plugin.settings.taskTextTruncate = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Show completed tasks for Today").setDesc("If enabled, completed tasks with today's due date will also appear in the 'Today' and 'Tag' group views.").addToggle(toggle => toggle.setValue(this.plugin.settings.showCompletedTasksToday).onChange(async (value) => {this.plugin.settings.showCompletedTasksToday = value;await this.saveAndUpdate();}));
        new Setting(containerEl).setName("Task sort order").setDesc("The default order for tasks within each group.").addDropdown(dropdown => dropdown.addOption('dueDate', 'By Due Date (earliest first)').addOption('a-z', 'A-Z').addOption('z-a', 'Z-A').setValue(this.plugin.settings.taskSortOrder).onChange(async (value) => { this.plugin.settings.taskSortOrder = value; await this.saveAndUpdate(); }));
        new Setting(containerEl).setName("Group tasks by").setDesc("Choose how to group tasks in the view. Second-clicking the Tasks tab will also toggle this.").addDropdown(dropdown => dropdown.addOption('date', 'Date (Overdue, Today, etc.)').addOption('tag', 'Tag').setValue(this.plugin.settings.taskGroupBy).onChange(async (value) => { this.plugin.settings.taskGroupBy = value; await this.saveAndUpdate(); this.display(); }));
        
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
        
        new Setting(containerEl).addButton(button => button.setButtonText("Reset Icons to Default").setIcon("rotate-ccw").setTooltip("Resets all task group icons to their original values").onClick(async () => { this.plugin.settings.taskGroupIcons = { ...DEFAULT_SETTINGS.taskGroupIcons }; await this.saveAndUpdate(); this.display(); }));

        new Setting(containerEl).setName("Task Group Backgrounds").setHeading();
        this.createRgbaColorSetting("Overdue", "Background color for the 'Overdue' task group.", "taskGroupColorOverdue");
        this.createRgbaColorSetting("Today", "Background color for the 'Today' task group.", "taskGroupColorToday");
        this.createRgbaColorSetting("Tomorrow", "Background color for the 'Tomorrow' task group.", "taskGroupColorTomorrow");
        this.createRgbaColorSetting("Next 7 Days", "Background color for the 'Next 7 Days' task group.", "taskGroupColorNext7Days");
        this.createRgbaColorSetting("Future", "Background color for 'Future' task group.", "taskGroupColorFuture");
        this.createRgbaColorSetting("No Due Date", "Background color for the 'No Due Date' task group.", "taskGroupColorNoDate");
        this.createRgbaColorSetting("Tag", "Background color for task groups when grouped by tag.", "taskGroupColorTag");
    }
} 

module.exports = PeriodMonthPlugin;
