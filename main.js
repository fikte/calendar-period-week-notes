const { Plugin, ItemView, PluginSettingTab, Notice, TFile, TFolder, Setting, Modal, AbstractInputSuggest } = require("obsidian");

const VIEW_TYPE_PERIOD = "calendar-period-week";

const DEFAULT_SETTINGS = {
    fontSize: "13px", 
    dayNumberFontSize: "15px", 
    headerRowBold: false, 
    pwColumnBold: false, 
    monthColor: "#ffffff",
    monthTitleFormat: "MMM YYYY",
    dailyNotesFolder: "Daily Notes", 
    dailyNoteDateFormat: "YYYY-MM-DD",
    fixedNoteFile: "ScratchPad.md", 
    showPWColumn: true,
    autoReloadInterval: 5000, 
    startOfPeriod1Date: "2025-03-02",
    ignoreFolders: [], 
    notesFontSize: "14px", 
    notesBold: false, 
    scratchFontSize: "14px",
    scratchBold: false,
    scratchFontFamily: "",
    tabTitleFontSize: "14px",
    tabTitleBold: false,
    notesLineHeight: 1.2, 
    notesLookbackDays: 7,
    showNoteStatusDots: true,
    showNoteTooltips: true,
    showOtherNoteDot: true, 
    showModifiedFileDot: true, 
    otherNoteDotColor: "#4caf50",
    otherNoteHoverDelay: 100, 
    popupHideDelay: 500, 
    popupGap: -2, 
    dailyNoteTemplatePath: "", 
    otherNotePopupFontSize: "13px",
    otherNoteIgnoreFolders: [],
    calendarDotSize: 4,
    selectedTabColor: "#666666",
    todayHighlightColor: "#666666",
    notesHoverColor: "#333333",
    notesHoverColor: "#333333",
    dailyNoteDotColor: "#4a90e2",
    noteCreatedColor: "#4caf50",
    noteModifiedColor: "#ff9800",
    calendarModifiedDotColor: "#ff9800",
};

const PLUGIN_STYLES = `
.period-month-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.5rem;
}
.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem;
}
.month-header-title {
  font-size: var(--font-ui-large);
  color: var(--month-color);
  white-space: nowrap;
}
.month-header-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
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
.period-calendar-table .pw-label-cell {
  font-weight: bold;
}
.period-calendar-table td {
  border: 1px solid var(--background-modifier-border);
  height: 3.5em;
  cursor: pointer;
}
.period-calendar-table .today-cell {
  background-color: var(--today-highlight-color);
}
.day-content {
  position: relative;
  width: 100%;
  height: 100%;
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
  display: flex;
  gap: 4px;
  align-items: center;
}
/*  Combined dot base styles */
.calendar-dot {
  width: var(--calendar-dot-size);
  height: var(--calendar-dot-size);
  border-radius: 50%;
}
.other-note-dot {
  background-color: var(--other-note-dot-color);
}
/*  Style for the modified file dot */
.modified-file-dot {
  background-color: var(--calendar-modified-dot-color);
}
.period-month-daily-note-dot {
  background-color: var(--daily-note-dot-color, var(--text-accent));
}
.period-month-daily-note-dot-other-month {
  opacity: 0.4;
}
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
}

.note-tab {
    flex: 1 1 0; /* Default state: grow and share space equally */
    text-align: center;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-size: var(--tab-title-font-size);
    font-weight: var(--tab-title-bold);
    transition: flex 0.2s ease-out; /* Adds a smooth animation to the resize */
    white-space: nowrap;
}
.note-tab:hover {
  background-color: var(--background-modifier-hover);
}
.note-tab.active {
  border-bottom-color: var(--selected-tab-color);
  font-weight: bold;
}
.scratch-content {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  resize: none;
  border: none;
  background-color: transparent;
  font-family: var(--scratch-font-family);
  font-size: var(--scratch-font-size);
  font-weight: var(--scratch-bold);
  padding: 0.5rem;
}
.notes-container {
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px;
}
/* --- Note Status Dot --- */
.note-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0; /* Prevent dot from shrinking */
}
.note-status-dot-created {
  background-color: var(--note-created-color);
}
.note-status-dot-modified {
  background-color: var(--note-modified-color);
}
/* --- Default styles for Desktop --- */
.note-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem;
  border-radius: var(--radius-s);
  margin-bottom: 2px;
  cursor: pointer;
}
.note-row:hover {
  background-color: var(--notes-hover-color);
}
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
.note-row .note-mod-date {
  margin-left: 10px;
  white-space: nowrap;
  font-size: 0.8em;
  color: var(--text-muted);
}
/* --- Simplified Table Layout for Mobile App --- */
.is-mobile .notes-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.is-mobile .notes-table-row {
  cursor: pointer;
  border-bottom: 1px solid var(--background-modifier-border);
}
.is-mobile .notes-table-row:hover {
  background-color: var(--notes-hover-color);
}
.is-mobile .notes-table .note-title-cell,
.is-mobile .notes-table .note-date-cell {
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
/* --- Mobile Calendar Table Adjustments --- */
.is-mobile .period-calendar-table th,
.is-mobile .period-calendar-table .pw-label-cell {
  font-size: 12px;
  padding: 2px 0;
}
.is-mobile .period-calendar-table .day-number {
  font-size: 13px;
}
/* --- Tooltip Style Override --- */
body.period-month-tooltip-active .tooltip {
  text-align: left;
  padding: 6px 10px;
  white-space: pre-wrap;
  max-width: 350px;
}
/* --- Other Notes Popup --- */
.other-notes-popup {
  position: absolute;
  z-index: 100;
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}
/*  For showing dot next to file name */
.other-notes-popup-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--other-note-popup-font-size);
}
.other-notes-popup-item:hover {
  background-color: var(--background-modifier-hover);
}
/*  Style for dot inside the popup */
.popup-file-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
/*  Styles for the custom template suggester */
.setting-item-control {
  position: relative;
}
.custom-suggestion-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
}
.custom-suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: var(--font-ui-small);
}
.custom-suggestion-item:hover {
  background-color: var(--background-modifier-hover);
}
/*  Styles for the Notes tab search input, now in the header */
.note-tab-header {
  align-items: center; /* Vertically align tabs and search box */
}
/*  Search container needs to be a positioning context */
.note-tab.shrunken {
    flex: 0 1 auto; /* Shrunken state: don't grow, just take up necessary space */
}

.notes-search-container-header {
    flex-grow: 1; /* Let the search box take all available space when visible */
    display: flex;
    align-items: center;
    padding: 0 8px;
}
/*  Added right-padding to make space for the clear button */
.notes-search-input {
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
  color: var(--text-normal);
  width: 100%;
  padding: 4px 24px 4px 8px; /* Right padding is now larger */
  box-sizing: border-box;
}
/*  Styles for the search clear button */
.notes-search-clear-btn {
  position: relative;
  right: 15px;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-muted);
  font-size: var(--font-ui-small);
  line-height: 0.1;
  visibility: hidden; /* Hidden by default, shown via JS */
}
.notes-search-clear-btn:hover {
  color: var(--text-normal);
}
.period-calendar-table th, .period-calendar-table td {
    text-align: center;
    vertical-align: middle;
    padding: 0;
    font-size: var(--header-font-size);
}
/*  This rule makes the header row's bold property configurable */
.period-calendar-table th {
    font-weight: var(--header-row-font-weight);
}
/*  This rule now uses a variable instead of being hardcoded */
.period-calendar-table .pw-label-cell {
    font-weight: var(--pw-column-font-weight);
}
`;

// === Helper Functions and Classes ===
// A modal for confirming actions
class ConfirmationModal extends Modal {
    constructor(app, title, message, onConfirm) {
      super(app);
      this.title = title;
      this.message = message;
      this.onConfirm = onConfirm;
    }
  
    onOpen() {
      const { contentEl } = this;
      contentEl.createEl("h1", { text: this.title });
      contentEl.createEl("p", { text: this.message });
  
      const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });
  
      buttonContainer.createEl("button", {
        text: "Yes, create it",
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

// This class has been updated to correctly handle clicks
class TemplateFileSuggest extends AbstractInputSuggest {
    constructor(app, inputEl) {
        super(app, inputEl);
    }

    getSuggestions(query) {
        const markdownFiles = this.app.vault.getMarkdownFiles();
        const lowerCaseQuery = query.toLowerCase();

        if (!lowerCaseQuery) {
            // Show all markdown files if the query is empty
            return markdownFiles;
        }

        return markdownFiles.filter(file => 
            file.path.toLowerCase().includes(lowerCaseQuery)
        );
    }

    renderSuggestion(file, el) {
        el.setText(file.path);
    }

    selectSuggestion(file) {
        // Set the input field's value to the selected file's path
        this.inputEl.value = file.path;
        
        // Use dispatchEvent to reliably trigger the 'input' event, which saves the setting
        this.inputEl.dispatchEvent(new Event("input")); 
        
        // Close the suggestion box
        this.close();
    }
}


function getPeriodWeek(date = new Date(), startOfPeriodsOverride) {
    const startOfPeriods = startOfPeriodsOverride ? new Date(startOfPeriodsOverride) : new Date("2025-03-03");

    // Calculate the difference in days from the start date (can be negative).
    const daysSinceStart = Math.floor((date - startOfPeriods) / (1000 * 60 * 60 * 24));
    
    // The week number relative to the start date (can be negative).
    const weekNumber = Math.floor(daysSinceStart / 7);

    // Calculate the period number (1-13) using a formula that handles negative numbers correctly.
    const periodIndex = Math.floor(weekNumber / 4);
    const period = ((periodIndex % 13) + 13) % 13 + 1;

    // Calculate the week number (1-4) using a formula that handles negative numbers correctly.
    const week = ((weekNumber % 4) + 4) % 4 + 1;

    return { period, week, weekSinceStart: weekNumber + 1 };
}

function generatePeriodCalendar(startOfPeriodsOverride) {
    const startOfPeriods = startOfPeriodsOverride ? new Date(startOfPeriodsOverride) : new Date("2025-03-03");
    const calendar = [];
    let current = new Date(startOfPeriods);
    const totalWeeks = 156;
    for (let i = 0; i < totalWeeks; i++) {
        const period = (Math.floor(i / 4) % 13) + 1;
        const week = (i % 4) + 1;
        const start = new Date(current);
        const end = new Date(current);
        end.setDate(current.getDate() + 6);
        calendar.push({ period, week, start, end });
        current.setDate(current.getDate() + 7);
    }
    return calendar;
}

function formatDateTime(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const hh = ("0" + date.getHours()).slice(-2);
    const mm = ("0" + date.getMinutes()).slice(-2);

    if (isSameDay(dateOnly, today)) {
        return `${hh}:${mm}`;
    } else {
        const YYYY = date.getFullYear();
        const MM = ("0" + (date.getMonth() + 1)).slice(-2);
        const DD = ("0" + date.getDate()).slice(-2);
        return `${DD}-${MM}-${YYYY}`;
    }
}

function formatDate(date, format) {
    const YYYY = date.getFullYear();
    const MM = ("0" + (date.getMonth() + 1)).slice(-2);
    const DD = ("0" + date.getDate()).slice(-2);
    return format.replace("YYYY", YYYY).replace("MM", MM).replace("DD", DD);
}

function formatMonthTitle(date, format) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const replacements = {
        'YYYY': year,
        'YY': String(year).slice(-2),
        'MMMM': new Intl.DateTimeFormat('default', { month: 'long' }).format(date),
        'MMM': new Intl.DateTimeFormat('default', { month: 'short' }).format(date),
        'MM': String(month + 1).padStart(2, '0'),
        'M': month + 1
    };

    // This regular expression finds all known format tokens.
    // The order (longest to shortest) ensures it correctly matches 'MMM' before 'M'.
    const tokenRegex = /MMMM|MMM|YYYY|YY|MM|M/g;

    // The .replace() method with a function allows us to safely
    // look up and substitute each token in a single pass.
    return format.replace(tokenRegex, (match) => {
        // For each token found (e.g., "MMM"), return its value from the replacements map.
        return replacements[match];
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

class PeriodMonthView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.displayedMonth = new Date();
        this.noteText = "";
        this.activeTab = "scratch";
        this.notesSearchTerm = ""; 
        this.createdNotesMap = new Map();
        this.modifiedNotesMap = new Map();
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.popupEl = null;
    }

    getViewType() { return VIEW_TYPE_PERIOD; }
    getDisplayText() { return "📅 Calendar Notes Tracker"; }
    getIcon() { return "calendar"; }

    async onOpen() {
        await this.buildCreatedNotesMap();
        await this.buildModifiedNotesMap();
        this.noteText = await this.loadNote();
        this.render();

        const intervalMs = this.plugin.settings.autoReloadInterval || 5000;

        this.registerInterval(setInterval(async () => {
            const latest = await this.loadNote();
            if (latest !== this.noteText && this.noteTextarea) {
                this.noteText = latest;
                this.noteTextarea.value = latest;
            }
        }, intervalMs));

        this.registerInterval(setInterval(() => {
            if (this.notesContentEl && this.notesContentEl.style.display !== "none") {
                this.populateNotes();
            }
        }, 5000));

        this.registerEvent(this.app.vault.on("modify", async (file) => {
            await this.buildModifiedNotesMap();
            this.renderCalendar();
        }));
        this.registerEvent(this.app.vault.on("create", async (file) => {
            await this.buildCreatedNotesMap();
            this.renderCalendar();
        }));
        this.registerEvent(this.app.vault.on("delete", async (file) => {
            await this.buildCreatedNotesMap();
            await this.buildModifiedNotesMap();
            this.renderCalendar();
        }));
        this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
            await this.buildCreatedNotesMap();
            await this.buildModifiedNotesMap();
            this.renderCalendar();
        }));
    }

    async buildCreatedNotesMap() {
        this.createdNotesMap.clear();
        const dailyNoteFolder = this.plugin.settings.dailyNotesFolder;
        const otherNoteIgnoreFolders = (this.plugin.settings.otherNoteIgnoreFolders || []).map(f => f.toLowerCase());
        const allNotes = this.app.vault.getMarkdownFiles();

        for (const file of allNotes) {
            const filePathLower = file.path.toLowerCase();

            if (dailyNoteFolder && filePathLower.startsWith(dailyNoteFolder.toLowerCase() + "/")) {
                continue;
            }
            if (otherNoteIgnoreFolders.some(folder => folder && filePathLower.startsWith(folder + "/"))) {
                continue;
            }

            const cdate = new Date(file.stat.ctime);
            const dateKey = `${cdate.getFullYear()}-${String(cdate.getMonth() + 1).padStart(2, '0')}-${String(cdate.getDate()).padStart(2, '0')}`;
            
            if (!this.createdNotesMap.has(dateKey)) {
                this.createdNotesMap.set(dateKey, []);
            }
            this.createdNotesMap.get(dateKey).push(file);
        }
    }
    
    async buildModifiedNotesMap() {
        this.modifiedNotesMap.clear();
        const dailyNoteFolder = this.plugin.settings.dailyNotesFolder;
        const otherNoteIgnoreFolders = (this.plugin.settings.otherNoteIgnoreFolders || []).map(f => f.toLowerCase());
        const allNotes = this.app.vault.getMarkdownFiles();

        for (const file of allNotes) {
            const filePathLower = file.path.toLowerCase();

            if (dailyNoteFolder && filePathLower.startsWith(dailyNoteFolder.toLowerCase() + "/")) {
                continue;
            }
            
            if (otherNoteIgnoreFolders.some(folder => folder && filePathLower.startsWith(folder + "/"))) {
                continue;
            }

            const cdate = new Date(file.stat.ctime);
            const mdate = new Date(file.stat.mtime);

            if (!isSameDay(cdate, mdate)) {
                const dateKey = `${mdate.getFullYear()}-${String(mdate.getMonth() + 1).padStart(2, '0')}-${String(mdate.getDate()).padStart(2, '0')}`;
                if (!this.modifiedNotesMap.has(dateKey)) {
                    this.modifiedNotesMap.set(dateKey, []);
                }
                if (!this.modifiedNotesMap.get(dateKey).some(f => f.path === file.path)) {
                    this.modifiedNotesMap.get(dateKey).push(file);
                }
            }
        }
    }
    
    render() {
        this.containerEl.empty();
        const container = this.containerEl.createDiv("period-month-container");

        const headerDiv = container.createDiv("month-header");
        this.monthNameEl = headerDiv.createDiv({ cls: "month-header-title" });
        this.updateMonthTitle();

        const navDiv = headerDiv.createDiv({ cls: "month-header-nav" });
        const prevBtn = navDiv.createEl("button", { text: "←" });
        const todayBtn = navDiv.createEl("button", { text: "Today" });
        const nextBtn = navDiv.createEl("button", { text: "→" });

        prevBtn.addEventListener("click", () => this.changeMonth(-1));
        todayBtn.addEventListener("click", () => this.changeMonth(0, true));
        nextBtn.addEventListener("click", () => this.changeMonth(1));

        const table = container.createEl("table", { cls: "period-calendar-table" });
        const thead = table.createEl("thead");
        const headerRow = thead.createEl("tr");
        if (this.plugin.settings.showPWColumn) {
            headerRow.createEl("th", { text: " " });
        }
        for (let d = 0; d < 7; d++) {
            headerRow.createEl("th", { text: new Date(1970, 0, d + 4).toLocaleDateString(undefined, { weekday: "short" }) });
        }
        this.calendarBodyEl = table.createEl("tbody");
        this.renderCalendar();

        const tabWrapper = container.createDiv("tabs-content-wrapper");
        const tabHeader = tabWrapper.createDiv("note-tab-header");

        const scratchTab = tabHeader.createDiv({ cls: "note-tab", text: "ScratchPad" });
        const notesTab = tabHeader.createDiv({ cls: "note-tab", text: "Notes" });

        const searchInputContainer = tabHeader.createDiv({ cls: "notes-search-container-header" });
        const searchInputEl = searchInputContainer.createEl("input", {
            type: "text",
            placeholder: "Search recent notes...",
            cls: "notes-search-input"
        });
        searchInputEl.value = this.notesSearchTerm;
        
        const clearButton = searchInputContainer.createEl("div", {
            text: "✕",
            cls: "notes-search-clear-btn"
        });
        clearButton.style.visibility = this.notesSearchTerm ? 'visible' : 'hidden';

        const scratchContent = tabWrapper.createEl("textarea", { cls: "scratch-content" });
        this.noteTextarea = scratchContent;
        scratchContent.value = this.noteText;

        const notesContent = tabWrapper.createDiv({ cls: "notes-container" });
        this.notesContentEl = notesContent;
        
        const switchTabs = (tab) => {
            this.activeTab = tab;
            scratchTab.toggleClass("active", tab === "scratch");
            notesTab.toggleClass("active", tab === "notes");
            
            scratchContent.style.display = (tab === "scratch") ? "block" : "none";
            notesContent.style.display = (tab === "notes") ? "block" : "none";
            searchInputContainer.style.display = (tab === "notes") ? "flex" : "none";
            
            if (tab === "notes") this.populateNotes();
        };
        
        clearButton.addEventListener('click', () => {
            this.notesSearchTerm = "";
            searchInputEl.value = "";
            clearButton.style.visibility = 'hidden';
            this.populateNotes();
            searchInputEl.focus();
        });

        searchInputEl.addEventListener("input", (e) => {
            const term = e.target.value;
            this.notesSearchTerm = term;
            clearButton.style.visibility = term ? 'visible' : 'hidden';
            this.populateNotes();
        });

        // --- MODIFIED --- This click handler now checks if the file is already open
        scratchTab.addEventListener("click", async () => {
            if (this.activeTab === "scratch") {
                const path = this.plugin.settings.fixedNoteFile;
                let file = this.app.vault.getAbstractFileByPath(path);

                if (!file) {
                    try {
                        file = await this.app.vault.create(path, "");
                    } catch (e) {
                        new Notice(`Failed to create scratchpad file: ${path}`);
                        return;
                    }
                }

                if (file instanceof TFile) {
                    // --- NEW CHECK ---
                    // Check if the file is already open in any tab.
                    let isAlreadyOpen = false;
                    this.app.workspace.getLeavesOfType("markdown").forEach(leaf => {
                        if (leaf.view.file?.path === file.path) {
                            isAlreadyOpen = true;
                        }
                    });

                    // Only open the file if it's not already open.
                    if (!isAlreadyOpen) {
                        this.app.workspace.getLeaf(true).openFile(file);
                    }
                    // --- END NEW CHECK ---
                }
            } else {
                // Otherwise, just switch to the tab
                switchTabs("scratch");
            }
        });
        // --- END MODIFICATION ---

        notesTab.addEventListener("click", () => switchTabs("notes"));
        switchTabs(this.activeTab);

        scratchContent.addEventListener("input", async () => {
            this.noteText = scratchContent.value;
            await this.saveFixedNote(this.noteText);
        });
    }

    renderCalendar() {
        if (!this.calendarBodyEl) return;
        this.calendarBodyEl.empty();
        const tbody = this.calendarBodyEl;

        const { settings } = this.plugin;
        const today = new Date();
        const year = this.displayedMonth.getFullYear();
        const month = this.displayedMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const folder = settings.dailyNotesFolder || "";
        const format = settings.dailyNoteDateFormat || "DD-MM-YYYY";
        const existingNotes = new Set(
            this.app.vault.getMarkdownFiles()
                .filter(file => !folder || file.path.startsWith(folder + "/"))
                .map(file => file.basename)
        );

        let currentDay = new Date(firstDayOfMonth);
        currentDay.setDate(1 - (firstDayOfMonth.getDay() || 7)); // Adjust for weeks starting on Monday

        while (currentDay <= lastDayOfMonth || tbody.children.length < 6) {
            const row = tbody.createEl("tr");
            
            if (settings.showPWColumn) {
                // Calculate Period/Week on the fly for the current row's date
                const pwData = getPeriodWeek(new Date(currentDay), settings.startOfPeriod1Date);
                const labelText = `P${pwData.period} W${pwData.week}`;
                row.createEl("td", { text: labelText, cls: "pw-label-cell" });
            }

            for (let d = 0; d < 7; d++) {
                const date = new Date(currentDay);
                date.setDate(currentDay.getDate() + d);
                const isOtherMonth = date.getMonth() !== month;
                const cell = row.createEl("td");
                const contentDiv = cell.createDiv("day-content");
                const dayNumber = contentDiv.createDiv("day-number");
                dayNumber.textContent = date.getDate().toString();

                if (isOtherMonth) dayNumber.addClass("day-number-other-month");
                if (isSameDay(date, today)) cell.addClass("today-cell");
                
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const createdFiles = this.createdNotesMap.get(dateKey) || [];
                const modifiedFiles = this.modifiedNotesMap.get(dateKey) || [];
                const dailyNoteFileName = formatDate(date, format);
                const dailyNoteExists = existingNotes.has(dailyNoteFileName);

                const dotsContainer = contentDiv.createDiv({ cls: 'dots-container' });

                if (settings.showOtherNoteDot && createdFiles.length > 0) {
                    dotsContainer.createDiv({ cls: 'other-note-dot calendar-dot' });
                }
                if (settings.showModifiedFileDot && modifiedFiles.length > 0) {
                    dotsContainer.createDiv({ cls: 'modified-file-dot calendar-dot' });
                }
                if (dailyNoteExists) {
                    const dot = dotsContainer.createDiv({cls: "period-month-daily-note-dot calendar-dot"});
                    if (isOtherMonth) dot.addClass("period-month-daily-note-dot-other-month");
                }

                const hasPopupContent = dailyNoteExists || (settings.showOtherNoteDot && createdFiles.length > 0) || (settings.showModifiedFileDot && modifiedFiles.length > 0);
                
                if (hasPopupContent) {
                    cell.addEventListener('mouseenter', () => {
                        this.hideFilePopup();
                        clearTimeout(this.hideTimeout);
                        this.hoverTimeout = setTimeout(() => {
                            const dailyNoteFile = dailyNoteExists 
                                ? this.app.vault.getAbstractFileByPath(folder ? `${folder}/${dailyNoteFileName}.md` : `${dailyNoteFileName}.md`)
                                : null;
                            
                            const filesToShow = {
                                daily: dailyNoteFile ? [dailyNoteFile] : [],
                                created: settings.showOtherNoteDot ? createdFiles : [],
                                modified: settings.showModifiedFileDot ? modifiedFiles : []
                            };
                            this.showFilePopup(cell, filesToShow);
                        }, this.plugin.settings.otherNoteHoverDelay);
                    });

                    cell.addEventListener('mouseleave', () => {
                        clearTimeout(this.hoverTimeout);
                        this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
                    });
                }
                
                cell.addEventListener("click", () => this.openDailyNote(date));
            }
            
            currentDay.setDate(currentDay.getDate() + 7);
            if (currentDay.getFullYear() > year + 1) break;
            if (currentDay.getMonth() > month && currentDay.getFullYear() >= year && tbody.children.length >= 6) break;
        }
    }
    
    showFilePopup(targetEl, filesByType) {
        this.hideFilePopup();
        
        this.popupEl = createDiv({ cls: 'other-notes-popup' });
        const { settings } = this.plugin;
        
        const addFileToList = (file, type) => {
            const itemEl = this.popupEl.createDiv({ cls: 'other-notes-popup-item' });
            
            const dot = itemEl.createDiv({ cls: 'popup-file-dot' });
            if (type === 'daily') dot.style.backgroundColor = settings.dailyNoteDotColor;
            else if (type === 'created') dot.style.backgroundColor = settings.otherNoteDotColor;
            else if (type === 'modified') dot.style.backgroundColor = settings.calendarModifiedDotColor;
            
            itemEl.createSpan({ text: file.basename });
            
            itemEl.addEventListener('click', () => {
                this.app.workspace.openLinkText(file.path, "", false);
                this.hideFilePopup();
            });
        };
        
        filesByType.daily.forEach(file => addFileToList(file, 'daily'));
        filesByType.created.forEach(file => addFileToList(file, 'created'));
        filesByType.modified.forEach(file => addFileToList(file, 'modified'));

        if (!this.popupEl.hasChildNodes()) {
            this.hideFilePopup();
            return;
        }

        this.popupEl.addEventListener('mouseenter', () => clearTimeout(this.hideTimeout));
        this.popupEl.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => this.hideFilePopup(), this.plugin.settings.popupHideDelay);
        });

        this.popupEl.style.visibility = 'hidden';
        document.body.appendChild(this.popupEl);

        const popupRect = this.popupEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = this.plugin.settings.popupGap;

        let finalTop = targetRect.bottom + margin;
        if (finalTop + popupRect.height > viewportHeight) {
            finalTop = targetRect.top - popupRect.height - margin;
        }
        if (finalTop < margin) {
            finalTop = margin;
        }
        
        let finalLeft = targetRect.left;
        if (finalLeft + popupRect.width > viewportWidth - margin) {
            finalLeft = targetRect.right - popupRect.width;
        }
        if (finalLeft < margin) {
            finalLeft = margin;
        }

        this.popupEl.style.top = `${finalTop}px`;
        this.popupEl.style.left = `${finalLeft}px`;
        this.popupEl.style.visibility = 'visible';
    }

    hideFilePopup() {
        clearTimeout(this.hoverTimeout);
        clearTimeout(this.hideTimeout);
        if (this.popupEl) {
            this.popupEl.remove();
            this.popupEl = null;
        }
    }

    updateMonthTitle() {
        if (this.monthNameEl) {
            const format = this.plugin.settings.monthTitleFormat || 'MMMM YYYY';
            this.monthNameEl.textContent = formatMonthTitle(this.displayedMonth, format);
        }
    }
    
    changeMonth(offset, toToday = false) {
        if (toToday) {
            this.displayedMonth = new Date();
        } else {
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() + offset, 1);
        }
        this.updateMonthTitle();
        this.renderCalendar();
    }

    async populateNotes() {
        if (!this.notesContentEl) return;
        this.notesContentEl.empty();
    
        const ignoreFolders = this.plugin.settings.ignoreFolders || [];
        const lookbackDays = this.plugin.settings.notesLookbackDays || 7;
        const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
        const dailyNoteFolder = this.plugin.settings.dailyNotesFolder || "";
        
        const allNotes = this.app.vault.getMarkdownFiles()
            .filter(file => 
                !ignoreFolders.some(f => file.path.startsWith(f)) &&
                (file.stat.mtime >= cutoff || file.stat.ctime >= cutoff)
            )
            .sort((a,b) => b.stat.mtime - a.stat.mtime);
    
        const searchTerm = this.notesSearchTerm?.toLowerCase() || "";
        const filteredNotes = searchTerm 
            ? allNotes.filter(file => file.basename.toLowerCase().includes(searchTerm))
            : allNotes;

        const isMobile = document.body.classList.contains('is-mobile');

        const createTooltipText = (file) => {
            const ctime = new Date(file.stat.ctime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
            const mtime = new Date(file.stat.mtime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
            const size = formatFileSize(file.stat.size);
            const path = file.path;
            const tagsCache = this.app.metadataCache.getFileCache(file)?.tags;

            let tags = "No tags";
            if (tagsCache && tagsCache.length > 0) {
                // Get all tag strings from the cache
                const allTags = tagsCache.map(t => t.tag);
                // Use a Set to automatically get only the unique tags
                const uniqueTags = [...new Set(allTags)];
                // Join the unique tags into a single string
                tags = uniqueTags.join(' ');
            }
            
            return `Created: ${ctime}\nModified: ${mtime}\nSize: ${size}\nPath: ${path}\nTags: ${tags}`;
        };

        const addTooltip = (element, file) => {
            if (this.plugin.settings.showNoteTooltips) {
                element.setAttribute('aria-label', createTooltipText(file));
                element.setAttribute('data-tooltip-position', 'top');

                element.addEventListener('mouseenter', () => {
                    document.body.classList.add('period-month-tooltip-active');
                });
                element.addEventListener('mouseleave', () => {
                    document.body.classList.remove('period-month-tooltip-active');
                });
            }
        };

        if (isMobile) {
            const table = this.notesContentEl.createEl("table", { cls: "notes-table" });
            const tbody = table.createTBody();
            filteredNotes.forEach(file => {
                const row = tbody.createEl("tr", { cls: "notes-table-row" });
                const titleCell = row.createEl("td", { cls: "note-title-cell" });

                if (this.plugin.settings.showNoteStatusDots) {
                    const dot = titleCell.createDiv({ cls: `note-status-dot` });
                    const isDailyNote = dailyNoteFolder && file.path.startsWith(dailyNoteFolder + "/");

                    if (isDailyNote) {
                        dot.style.backgroundColor = this.plugin.settings.dailyNoteDotColor;
                    } else {
                        const creationDate = new Date(file.stat.ctime);
                        const modificationDate = new Date(file.stat.mtime);
                        const statusClass = isSameDay(creationDate, modificationDate) 
                            ? "note-status-dot-created" 
                            : "note-status-dot-modified";
                        dot.addClass(statusClass);
                    }
                    addTooltip(dot, file);
                }
                titleCell.createSpan({ text: file.basename });

                const dateCell = row.createEl("td", { text: formatDateTime(new Date(file.stat.mtime)), cls: "note-date-cell" });
                row.addEventListener("click", () => this.app.workspace.openLinkText(file.path, "", false));
            });
        } else {
            filteredNotes.forEach(file => {
                const row = this.notesContentEl.createDiv("note-row");
                const titleWrapper = row.createDiv({ cls: 'note-title-wrapper' });

                if (this.plugin.settings.showNoteStatusDots) {
                    const dot = titleWrapper.createDiv({ cls: `note-status-dot` });
                    const isDailyNote = dailyNoteFolder && file.path.startsWith(dailyNoteFolder + "/");

                    if (isDailyNote) {
                        dot.style.backgroundColor = this.plugin.settings.dailyNoteDotColor;
                    } else {
                        const creationDate = new Date(file.stat.ctime);
                        const modificationDate = new Date(file.stat.mtime);
                        const statusClass = isSameDay(creationDate, modificationDate) 
                            ? "note-status-dot-created" 
                            : "note-status-dot-modified";
                        dot.addClass(statusClass);
                    }
                    addTooltip(dot, file);
                }
                titleWrapper.createDiv({ text: file.basename, cls: "note-title" });

                row.createDiv({ text: formatDateTime(new Date(file.stat.mtime)), cls: "note-mod-date" });
                row.addEventListener("click", () => this.app.workspace.openLinkText(file.path, "", false));
            });
        }
    }

    async saveFixedNote(text) {
        const path = this.plugin.settings.fixedNoteFile;
        const folderPath = path.substring(0, path.lastIndexOf("/"));
        if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
            await this.app.vault.createFolder(folderPath).catch(() => {});
        }
        let file = this.app.vault.getAbstractFileByPath(path);
        if(!file) await this.app.vault.create(path, text);
        else if (file instanceof TFile) await this.app.vault.modify(file, text);
    }

    async loadNote() {
        const path = this.plugin.settings.fixedNoteFile;
        const file = this.app.vault.getAbstractFileByPath(path);
        if(file instanceof TFile) return await this.app.vault.read(file);
        return "";
    }

    async openDailyNote(date) {
        const folder = this.plugin.settings.dailyNotesFolder || "";
        const format = this.plugin.settings.dailyNoteDateFormat || "DD-MM-YYYY";
        const fileName = formatDate(date, format);
        const path = folder ? `${folder}/${fileName}.md` : `${fileName}.md`;

        const file = this.app.vault.getAbstractFileByPath(path);

        if (file) {
            const newLeaf = this.app.workspace.getLeaf(true);
            await newLeaf.openFile(file);
        } else {
            const friendlyDate = date.toLocaleDateString(undefined, { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });

            new ConfirmationModal(
                this.app,
                "Create daily note?",
                `A daily note for ${friendlyDate} does not exist. Would you like to create it?`,
                async () => {
                    try {
                        const customTemplatePath = this.plugin.settings.dailyNoteTemplatePath;
                        let fileContent = "";
                        let templateFound = false;

                        if (customTemplatePath) {
                            const templateFile = this.app.vault.getAbstractFileByPath(customTemplatePath);
                            if (templateFile instanceof TFile) {
                                fileContent = await this.app.vault.read(templateFile);
                                templateFound = true;
                            } else {
                                new Notice(`Template not found at path in plugin settings: ${customTemplatePath}`, 7000);
                            }
                        } 
                        else {
                            const coreSettings = this.app.vault.config?.dailyNotes || {};
                            const coreTemplatePath = coreSettings.template;

                            if (coreTemplatePath) {
                                const templateFile = this.app.vault.getAbstractFileByPath(coreTemplatePath);
                                if (templateFile instanceof TFile) {
                                    fileContent = await this.app.vault.read(templateFile);
                                    templateFound = true;
                                }
                            }
                        }

                        if (!templateFound && !customTemplatePath) {
                             new Notice("No template specified in settings. Creating a blank note.", 5000);
                        }
                        
                        const newFile = await this.app.vault.create(path, fileContent);
                        
                        const newLeaf = this.app.workspace.getLeaf(true);
                        await newLeaf.openFile(newFile);

                    } catch (e) {
                        console.error("Failed to create daily note:", e);
                        new Notice("Failed to create daily note.");
                    }
                }
            ).open();
        }
    }
}


// === Plugin ===
class PeriodMonthPlugin extends Plugin {
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        
        this.addStyle();
        this.updateStyles();

        this.registerView(VIEW_TYPE_PERIOD, leaf => new PeriodMonthView(leaf, this));
        this.addRibbonIcon("calendar", "Open Calendar Notes Tracker", () => this.activateView());
        this.addCommand({ id: "open-period-month-view", name: "Open Calendar Notes Tracke", callback: () => this.activateView() });
        this.addSettingTab(new PeriodSettingsTab(this.app, this));
        this.activateView();
    }

    addStyle() {
        const styleEl = document.createElement('style');
        styleEl.id = 'period-month-plugin-styles';
        styleEl.textContent = PLUGIN_STYLES;
        document.head.appendChild(styleEl);
    }
    
    updateStyles() {
        const styleProps = {
            '--header-font-size': this.settings.fontSize,
            '--day-number-font-size': this.settings.dayNumberFontSize,
            '--header-row-font-weight': this.settings.headerRowBold ? 'bold' : 'normal', 
            '--pw-column-font-weight': this.settings.pwColumnBold ? 'bold' : 'normal',   
            '--month-color': this.settings.monthColor,
            '--scratch-font-family': this.settings.scratchFontFamily,
            '--scratch-font-size': this.settings.scratchFontSize,
            '--scratch-bold': this.settings.scratchBold ? 'bold' : 'normal',
            '--notes-font-size': this.settings.notesFontSize,
            '--notes-bold': this.settings.notesBold ? 'bold' : 'normal',
            '--tab-title-font-size': this.settings.tabTitleFontSize,
            '--tab-title-bold': this.settings.tabTitleBold ? 'bold' : 'normal',
            '--notes-line-height': this.settings.notesLineHeight,
            '--selected-tab-color': this.settings.selectedTabColor,
            '--today-highlight-color': this.settings.todayHighlightColor,
            '--notes-hover-color': this.settings.notesHoverColor,
            '--daily-note-dot-color': this.settings.dailyNoteDotColor,
            '--note-created-color': this.settings.noteCreatedColor,
            '--note-modified-color': this.settings.noteModifiedColor,
            '--other-note-dot-color': this.settings.otherNoteDotColor,
            '--calendar-modified-dot-color': this.settings.calendarModifiedDotColor, 
            '--other-note-popup-font-size': this.settings.otherNotePopupFontSize,
            '--calendar-dot-size': this.settings.calendarDotSize + 'px'
        };
        for (const key in styleProps) {
            document.documentElement.style.setProperty(key, styleProps[key]);
        }
    }

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
        const styleEl = document.getElementById('period-month-plugin-styles');
        if (styleEl) styleEl.remove();
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => leaf.detach());
    }
}

// === Settings Tab ===
class PeriodSettingsTab extends PluginSettingTab {
    constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

    // This function is now a method of the class, making it accessible to all other methods.
    async saveAndUpdate() {
        await this.plugin.saveData(this.plugin.settings);
        this.plugin.updateStyles();
        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_PERIOD).forEach(leaf => {
            if (leaf.view instanceof PeriodMonthView) {
                Promise.all([
                    leaf.view.buildCreatedNotesMap(),
                    leaf.view.buildModifiedNotesMap()
                ]).then(() => leaf.view.render());
            }
        });
    }

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
        inputEl.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionEl.style.display = 'none';
            }, 150);
        });
    }

    createIgnoredFolderList(containerEl, name, desc, settingKey) {
        new Setting(containerEl).setName(name).setDesc(desc).setHeading();

        const ignoredFolders = this.plugin.settings[settingKey];

        if (ignoredFolders.length > 0) {
            ignoredFolders.forEach((folder, index) => {
                new Setting(containerEl)
                    .setName(folder)
                    .addButton(button => {
                        button.setIcon("trash")
                            .setTooltip("Remove folder")
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
                const getFolders = (query) => {
                    return this.app.vault.getAllLoadedFiles()
                        .filter(f => f instanceof TFolder && (!query || f.path.toLowerCase().includes(query)))
                        .map(f => f.path);
                };
                this.createPathSuggester(text.inputEl, getFolders);
                text.setPlaceholder("Enter folder path to ignore...");
            })
            .addButton(button => {
                button.setButtonText("Add")
                    .setTooltip("Add this folder to the ignore list")
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

    display() {
        const { containerEl } = this;
        containerEl.empty();
        
        containerEl.createEl("h1", { text: "General Display Settings" });

        const monthTitleSetting = new Setting(containerEl)
            .setName("Month title format");

        monthTitleSetting.descEl.innerHTML = `
            Set the format for the calendar's month title. Available tokens:
            <br><code>YYYY</code>: 4-digit year (e.g., 2025)
            <br><code>YY</code>: 2-digit year (e.g., 25)
            <br><code>MMMM</code>: Full month name (e.g., September)
            <br><code>MMM</code>: Short month name (e.g., Sep)
            <br><code>MM</code>: 2-digit month (e.g., 09)
            <br><code>M</code>: Month number (e.g., 9)
        `;

        monthTitleSetting.addText(text => text
            .setPlaceholder("MMMM YYYY")
            .setValue(this.plugin.settings.monthTitleFormat)
            .onChange(async (value) => {
                this.plugin.settings.monthTitleFormat = value;
                await this.saveAndUpdate();
            }));

        new Setting(containerEl)
            .setName("Bold toggle for calendar header row")
            .setDesc("Bold toggle for the days of the week in the calendar grid (e.g., Sun, Mon)")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.headerRowBold)
                .onChange(async value => {
                    this.plugin.settings.headerRowBold = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Bold toggle for Period/Week calendar column")
            .setDesc("Bold toggle for the period / week column in the calendar grid.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.pwColumnBold)
                .onChange(async value => {
                    this.plugin.settings.pwColumnBold = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Calendar grid row header / period week # column font size")
            .setDesc("Change the font size of the calendar header row and period week column. Default is 13px. e.g., 12px or 1em")
            .addText(text => text.setValue(this.plugin.settings.fontSize)
                .onChange(async value => { this.plugin.settings.fontSize = value; await this.saveAndUpdate(); }));
        
        new Setting(containerEl)
            .setName("Calendar grid day number font size")
            .setDesc("Change the font size of the calendar grid days. Dafault is 15px. e.g., 13px or 1em")
            .addText(text => text.setValue(this.plugin.settings.dayNumberFontSize)
                .onChange(async value => { this.plugin.settings.dayNumberFontSize = value; await this.saveAndUpdate(); }));
        
        new Setting(containerEl)
            .setName("Calendar dot size")
            .setDesc("The size of the dots on the calendar in pixels. Default is 5.")
            .addText(text => text.setValue(String(this.plugin.settings.calendarDotSize))
                .onChange(async (value) => {
                    this.plugin.settings.calendarDotSize = Number(value) || 5;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("Tab title font size")
            .setDesc("Font size for the 'ScratchPad' and 'Notes' tab titles. Default is 15px. e.g., 13px or 1em")
            .addText(text => text.setValue(this.plugin.settings.tabTitleFontSize)
                .onChange(async value => { this.plugin.settings.tabTitleFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("Tab title bold")
            .setDesc("Make the tab titles bold (the active tab will always be bold).")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.tabTitleBold)
                .onChange(async value => { this.plugin.settings.tabTitleBold = value; await this.saveAndUpdate(); }));

        containerEl.createEl("h1", { text: "ScratchPad Settings" });

        new Setting(containerEl)
            .setName("ScratchPad note location")
            .setDesc("Select path and note where the scratchpad note is stored. Start typing for suggestions.")
            .addText(text => {
                const getMarkdownFiles = (query) => {
                    return this.app.vault.getMarkdownFiles()
                        .filter(f => !query || f.path.toLowerCase().includes(query))
                        .map(f => f.path);
                };
                this.createPathSuggester(text.inputEl, getMarkdownFiles);

                text.setValue(this.plugin.settings.fixedNoteFile)
                    .onChange(async value => { this.plugin.settings.fixedNoteFile = value; await this.saveAndUpdate(); });
            });
        
        new Setting(containerEl)
            .setName("ScratchPad font size")
            .setDesc("Change the font size of the ScratchPad tab area. Default is 14px. e.g., 13px or 1em")
            .addText(text => text.setValue(this.plugin.settings.scratchFontSize)
                .onChange(async value => { this.plugin.settings.scratchFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("ScratchPad bold text")
            .setDesc("Make the text in the ScratchPad bold.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.scratchBold)
                .onChange(async value => { this.plugin.settings.scratchBold = value; await this.saveAndUpdate(); }));
        
        new Setting(containerEl)
            .setName("ScratchPad font family")
            .setDesc("Set the font for the ScratchPad. Default is blank and will use your theme font. Examples: monospace, Arial, 'Courier New'")
            .addText(text => text.setValue(this.plugin.settings.scratchFontFamily)
                .onChange(async (value) => {
                    this.plugin.settings.scratchFontFamily = value;
                    await this.saveAndUpdate();
                }));

        containerEl.createEl("h1", { text: "Notes Tab Settings" });
        
        new Setting(containerEl)
            .setName("Show note status dots")
            .setDesc("Show a colored dot next to each note indicating if it was recently created or modified.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteStatusDots)
                .onChange(async value => {
                    this.plugin.settings.showNoteStatusDots = value;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("Show note info tooltips")
            .setDesc("Show a detailed tooltip when hovering over the status dots in the notes tab list view.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showNoteTooltips)
                .onChange(async value => {
                    this.plugin.settings.showNoteTooltips = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Notes tab font size")
            .setDesc("Change the font size of the Notes tab note list. Default is 14px. e.g., 13px or 1em")
            .addText(text => text.setValue(this.plugin.settings.notesFontSize)
                .onChange(async value => { this.plugin.settings.notesFontSize = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("Notes tab bold text")
            .setDesc("Make the note titles in the list bold.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.notesBold)
                .onChange(async value => { this.plugin.settings.notesBold = value; await this.saveAndUpdate(); }));

        new Setting(containerEl)
            .setName("Notes tab lookback # of days")
            .setDesc("How many days back to look for recently created / modified notes. Default is 7.")
            .addText(text => text.setValue(String(this.plugin.settings.notesLookbackDays))
                .onChange(async value => { this.plugin.settings.notesLookbackDays = Number(value) || 5; await this.saveAndUpdate(); }));

        this.createIgnoredFolderList(
            containerEl,
            "Ignore folders in Notes tab",
            "Files from these folders will not appear in the 'Notes' list.",
            'ignoreFolders'
        );

        containerEl.createEl("h1", { text: "Calendar Dot Indicators" });

        new Setting(containerEl)
            .setName("Show dot for created files")
            .setDesc("On the calendar grid, show a dot on days where non-daily notes were created.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showOtherNoteDot)
                .onChange(async value => {
                    this.plugin.settings.showOtherNoteDot = value;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Show dot for modified files")
            .setDesc("On the calendar grid, show a dot on days where non-daily files were modified (but not created on that day).")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showModifiedFileDot)
                .onChange(async value => {
                    this.plugin.settings.showModifiedFileDot = value;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("File list hover delay")
            .setDesc("The time to wait before showing the file list popup when hovering over the calendar grid (in milliseconds). Default is 100.")
            .addText(text => text
                .setValue(String(this.plugin.settings.otherNoteHoverDelay))
                .onChange(async (value) => {
                    this.plugin.settings.otherNoteHoverDelay = Number(value) || 100;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("Popup hide delay")
            .setDesc("The time to wait before hiding the file list after the mouse moves away (in milliseconds). Default is 500.")
            .addText(text => text
                .setValue(String(this.plugin.settings.popupHideDelay))
                .onChange(async (value) => {
                    this.plugin.settings.popupHideDelay = Number(value) || 500;
                    await this.saveAndUpdate();
                }));
        
        new Setting(containerEl)
            .setName("Popup gap")
            .setDesc("The distance in pixels between the calendar date and the popup. A negative or smaller number makes it easier to move the mouse into the popup. Default is -2.")
            .addText(text => text
                .setValue(String(this.plugin.settings.popupGap))
                .onChange(async (value) => {
                    this.plugin.settings.popupGap = Number(value) || -2;
                    await this.saveAndUpdate();
                }));

        new Setting(containerEl)
            .setName("Popup file list font size")
            .setDesc("Calendar grid popup font size. Default is 13px. e.g., 13px or 1em")
            .addText(text => text.setValue(this.plugin.settings.otherNotePopupFontSize)
                .onChange(async value => {
                    this.plugin.settings.otherNotePopupFontSize = value;
                    await this.saveAndUpdate();
                }));

        this.createIgnoredFolderList(
            containerEl,
            "Ignore folders for calendar grid dots",
            "Files from these folders will not create 'created' or 'modified' dots on the calendar.",
            'otherNoteIgnoreFolders'
        );

        containerEl.createEl("h1", { text: "Functional Settings" });
        new Setting(containerEl)
            .setName("Start of Period 1 Week 1 date")
            .setDesc("The date when period 1, week 1 begins. NOTE: must be a Sunday date.")
            .addText(text => { text.inputEl.type = "date"; text.setValue(this.plugin.settings.startOfPeriod1Date)
                .onChange(async value => { this.plugin.settings.startOfPeriod1Date = value; await this.saveAndUpdate(); })});

        new Setting(containerEl)
            .setName("Daily Notes folder")
            .setDesc("Path to your daily notes folder. Start typing for suggestions.")
            .addText(text => {
                const getFolders = (query) => {
                    return this.app.vault.getAllLoadedFiles()
                        .filter(f => f instanceof TFolder && (!query || f.path.toLowerCase().includes(query)))
                        .map(f => f.path);
                };
                this.createPathSuggester(text.inputEl, getFolders);

                text.setValue(this.plugin.settings.dailyNotesFolder)
                    .onChange(async value => { this.plugin.settings.dailyNotesFolder = value; await this.saveAndUpdate(); });
            });
        
        new Setting(containerEl)
            .setName("Daily note template")
            .setDesc("Optional: Set a specific template to use when creating a Daily Note. Start typing to see autocomplete suggestions.")
            .addText(text => {
                const getMarkdownFiles = (query) => {
                    return this.app.vault.getMarkdownFiles()
                        .filter(f => !query || f.path.toLowerCase().includes(query))
                        .map(f => f.path);
                };
                this.createPathSuggester(text.inputEl, getMarkdownFiles);

                text.setPlaceholder("Example: Templates/Daily Template.md")
                    .setValue(this.plugin.settings.dailyNoteTemplatePath)
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNoteTemplatePath = value;
                        await this.saveAndUpdate();
                    });
            });
            
        

        new Setting(containerEl)
            .setName("Show Period Week column on the calendar")
            .setDesc("Display the Period and Week column in the calendar grid.")
            .addToggle(toggle => toggle.setValue(this.plugin.settings.showPWColumn)
                .onChange(async value => { this.plugin.settings.showPWColumn = value; await this.saveAndUpdate(); }));

        containerEl.createEl("h1", { text: "Color Settings" });

        const createColorSetting = (name, desc, settingKey) => {
            new Setting(containerEl)
                .setName(name)
                .setDesc(desc)
                .addColorPicker(picker => {
                    picker
                        .setValue(this.plugin.settings[settingKey])
                        .onChange(async value => {
                            this.plugin.settings[settingKey] = value;
                            await this.saveAndUpdate();
                        });
                })
                .addExtraButton(button => {
                    button
                        .setIcon("rotate-ccw")
                        .setTooltip("Reset to default")
                        .onClick(async () => {
                            this.plugin.settings[settingKey] = DEFAULT_SETTINGS[settingKey];
                            await this.saveAndUpdate();
                            this.display();
                        });
                });
        };

        createColorSetting("Created calendar popup note dot color", "The color of the dot for non-daily, newly created files.", "otherNoteDotColor");
        createColorSetting("Modified calendar popup note dot color", "The color of the dot for non-daily, modified files.", "calendarModifiedDotColor");
        createColorSetting("Daily note calendar popup note and notes area dot color", "The color of the dot on the calendar for daily notes and in the notes area list.", "dailyNoteDotColor");
        createColorSetting("Created notes area note dot color", "Dot color in the notes area list for recently created notes.", "noteCreatedColor");
        createColorSetting("Modified notes area note dot color", "Dot color in the notes area list for recently modified notes.", "noteModifiedColor");
        createColorSetting("Month title color", "Color for the month and year title top left of the plugin.", "monthColor");
        createColorSetting("Today's date highlight color", "The background color for the current day in the calendar grid.", "todayHighlightColor");
        createColorSetting("Selected tab color", "The color of the active tab's underline for the Sractchpad and Notes.", "selectedTabColor");
        createColorSetting("Notes hover color", "The background color for a note in the notes list area when hovered.", "notesHoverColor");
    }
}

module.exports = PeriodMonthPlugin;