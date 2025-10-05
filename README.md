# 📅 Obsidian Calendar Period Week Notes

A powerhouse daily and weekly planning dashboard for Obsidian. This plugin combines a highly customizable calendar with an integrated tabbed interface for your scratchpad, recent notes, tasks, and assets, giving you a complete overview of your vault at a glance.

Move beyond simple daily notes with a unique **Period/Week** numbering system, interactive **popups**, and a deeply integrated **task manager**.


<img width="451" height="409" alt="image" src="https://github.com/user-attachments/assets/a2a779c2-b6c2-4e3e-b4b4-1df7a8c53005" />

_The main calendar grid with period / week column, dot indicators, and heat map for the number of tasks for a date._

<img width="524" height="983" alt="image" src="https://github.com/user-attachments/assets/875cbed1-d3ef-4732-be15-a1254bf18662" />

_The main interface showing the calendar with period / week column, dot indicators, and the integrated tabs for ScratchPad, Notes, Tasks, and Assets._

<img width="522" height="971" alt="image" src="https://github.com/user-attachments/assets/46a9a9b1-f096-499b-8946-078fb8fcffee" />

_The main interface showing the calendar with period / week column, dot indicators, and the integrated tabs for ScratchPad, Notes, Tasks, and Assets._

<img width="1307" height="1014" alt="image" src="https://github.com/user-attachments/assets/9ec24c67-df3d-4c38-897a-09eb2c19c062" />

_The main interface showing the calendar with period / week column, dot indicators, and the integrated tabs for ScratchPad, Notes, Tasks, and Assets. The main Obsidian window showing the preview markup from the ScratchPad textarea._

<img width="523" height="1176" alt="image" src="https://github.com/user-attachments/assets/42aa3b5c-efdc-4a5c-b9e4-64092d81c376" />

_The calendar view shown in the vertical scrolling mode. Also configured in the settings this is showing the ISO week numbers. Click or tap the top month title text to flip between the two calendar views._

---

## ✨ Features

### 🗓️ Dynamic Calendar View

- **Custom Period/Week System**: Track your year in 13 periods of 4 weeks, perfect for structured planning cycles.
    
- **Multiple Views**: Toggle between a traditional **monthly calendar** and a continuous **vertical scroll** view by clicking the month title.
    
- **Dot Indicators**: See which days have activity at a glance:
    
    - 🔵 Daily Notes
        
    - 🟢 New Notes
        
    - 🟠 Modified Notes
        
    - 🔴 New Assets (images, PDFs, etc.)
        
    - 🔢 A badge showing the number of open tasks due on that day.
        
- **Interactive Popups**: Hover over any day with a dot to see a popup listing the specific notes, tasks, and assets for that day, with clickable links.
    
- **Smart Highlighting**: Customize how you highlight dates, with options to highlight the current week, day column, or a complex grid up to the hovered date.
    
- **Week Numbers**: Optionally display standard ISO week numbers or weeks based on your Period/Week system.
    

### 🧩 Integrated Tabbed Dashboard

A fully functional panel right below your calendar, with draggable tabs to organize your workflow.

- 📝 **Scratchpad Tab**: A persistent note file for quick thoughts and fleeting ideas.
    
    - Toggle between **edit** and **Markdown preview** mode.
        
    - **Find-as-you-type search** with result highlighting.
        
    - A quick-add button to insert new tasks using a customizable format with date placeholders (`{today}`, `{monday}`, `|` for cursor position, etc.).
        
- 📂 **Notes & Pinned Tab**:
    
    - View a sorted list of recently created or modified notes.
        
    - Double-click the tab to switch to **"Pinned" mode**, showing only notes with a specific tag (e.g., `#pin`).
        
    - Detailed tooltips on hover show file path, dates, size, and tags.
        
- ✔️ **Tasks Tab**: A complete task management system that scans your entire vault.
    
    - **Group tasks** by due date (`Overdue`, `Today`, `Tomorrow`, etc.) or by `#tag`.
        
    - Toggle grouping by double-clicking the Tasks tab.
        
    - Check off tasks directly from the list, and the underlying Markdown file is updated instantly.
        
    - Click any task to jump directly to its line in the source file.
        
- 🖼️ **Assets Tab**: Keep track of non-Markdown files.
    
    - View recently added images, PDFs, audio files, and more.
        
    - See image **thumbnails** directly in the list.
        
    - **Unused Asset Indicator**: An icon appears next to any asset not linked from any note, helping you clean up your vault.
        
    - **Delete Unused Assets**: Securely delete unlinked assets directly from the asset list after a confirmation.
        
    - **Backlinks Popup**: Hover over an asset's icon to see a popup of all notes that link to it.
        

### ⚙️ Deep Customization

Almost every visual and functional element can be tailored to your liking. See the detailed settings section below for a full list.

---

## 🚀 Installation

### From Community Plugins

1. Open **Settings** > **Community Plugins**.
    
2. Make sure "Restricted mode" is **off**.
    
3. Click **Browse** community plugins and search for "Calendar Period Week Notes".
    
4. Click **Install**, then **Enable**.
    

### Manual Installation

1. Download the latest release from the [GitHub releases page](https://github.com/fikte/calendar-period-week-notes/releases/).
    
2. Unzip the downloaded file.
    
3. Copy the `calendar-period-week-notes` folder into your vault's plugin folder: `<VaultFolder>/.obsidian/plugins/`.
    
4. Reload Obsidian, then go to **Settings** > **Community Plugins** and enable it.
    

---

## 💡 How to Use

1. **Open the View**: Click the `📅` icon in the left ribbon or use the command palette (`Ctrl/Cmd + P`) and search for "Open Calendar Period Week Notes".
    
2. **Navigate the Calendar**:
    
    - Click on any date to open (or create) the daily note for that day.
        
    - Hover over a date with dots to see the details popup.
        
    - Use the `←` and `→` arrows to change the month.
        
    - Click the month title (e.g., "September 2025") to switch to the vertical scroll view.
        
3. **Use the Tabs**:
    
    - Click a tab to switch panels.
        
    - Drag and drop tabs to reorder them.
        
    - **Double-click** special tabs for alternate functions:
        
        - **Notes Tab**: Toggles between "Recent" and "Pinned" views.
            
        - **Tasks Tab**: Toggles grouping between "Date" and "Tag".
            
        - **Scratchpad Tab**: Opens the scratchpad note file in a full editor tab.
          
        - **Assets Tab✱: Toggle between two column and list view for assets. 
            

---

## 🔧 Settings

The plugin offers extensive options to tailor its appearance and functionality.

### General Display & Tabs

|Setting|Description|Default Value|
|---|---|---|
|**Month title format**|Sets the display format for the main month title using [moment.js](https://momentjs.com/docs/#/displaying/format/) tokens.|`MMM YYYY`|
|**Month title font size**|The font size of the main "Month Year" title.|`20px`|
|**Bold month title**|Toggles bold font weight for the main title.|`false`|
|**Month Title Color**|The color of the main title. Includes an opacity slider.|`rgba(255, 255, 255, 1)`|
|**Navigation buttons height**|The height of the `←`, `Today`, and `→` buttons.|`28px`|
|**Bold calendar header**|Toggles bold font weight for the day names row (Mon, Tue, etc.).|`false`|
|**Show calendar grid lines**|Toggles the visibility of borders between calendar days.|`false`|
|**Tab title font size**|Font size for the tab titles (ScratchPad, Notes, etc.).|`14px`|
|**Bold tab titles**|Toggles bold font weight for tab titles.|`false`|
|**Active Tab Indicator**|The color of the underline for the currently active tab.|`rgba(102, 102, 102, 1)`|
|**Tab Order**|A comma-separated list to define the order of tabs. Can also be set by dragging.|`scratch,notes,tasks,assets`|
|**Tab Visibility**|Individual toggles to show or hide the Scratch, Notes, Tasks, and Assets tabs.|All `true`|
|**Desktop/Mobile tab display**|Choose between `Icon Only`, `Text Only`, or `Icon and Text` for tabs on different screen sizes.|`iconOnly`|
|**Tab Icons**|Customize the Lucide icon name for each tab (Scratch, Notes, Tasks, Pinned, Assets).|Various|

Export to Sheets

### Calendar Functional Settings

|Setting|Description|Default Value|
|---|---|---|
|**Start of Period 1 Week 1**|The Sunday date that anchors the entire Period/Week calculation system.|`2025-03-02`|
|**Period/Week format**|The display format for the P/W column (e.g., `P#W#`, `p# w#`, `#-#`).|`P#W#`|
|**Show Period/Week column**|Toggles the visibility of the P/W column.|`false`|
|**Show week number column**|Toggles the visibility of a separate week number column.|`true`|
|**Week number type**|Choose between `Period System Week` or `Calendar Year Week (ISO)`.|`calendar`|
|**Daily Notes folder**|The vault path where daily notes are stored.|`Daily Notes`|
|**Daily Note open behavior**|Open daily notes in a `new-tab` or the `current-tab`.|`new-tab`|
|**Daily note template**|Path to a template file to use when creating new daily notes.|`""`|
|**Enable row highlight**|Highlights the entire week's row when hovering over the P/W label.|`true`|
|**Enable column highlight**|Highlights the entire day column when hovering over the day name label, (e.g. Mon).|`true`|
|**Enable complex grid highlight**|When hovering over a date, highlights all the cells in it's row and column up to that date.|`false`|
|**Grid Highlight Color**|The color used for the row/column/grid hover effects.|`rgba(51, 51, 51, 1)`|

Export to Sheets

### Calendar Dot Indicators & Popups

|Setting|Description|Default Value|
|---|---|---|
|**Show dot for created notes**|Show a dot on days a non-daily note was created.|`true`|
|**Show dot for modified notes**|Show a dot on days a non-daily note was modified.|`true`|
|**Show dot for new assets**|Show a dot on days an asset was added to the vault.|`true`|
|**Calendar dot size**|The size of the dots in pixels.|`4`|
|**Dot Colors**|Individual RGBA color pickers for Daily Note, Created Note, Modified Note, and Asset dots.|Various|
|**Popup hover/hide delay**|The delay in milliseconds before showing or hiding the details popup.|`100`|
|**Popup font size**|The font size of text inside the hover popup.|`13px`|
|**Ignore folders for dots**|Define folder paths to exclude from creating created/modified/asset dots.|`[]`|

Export to Sheets

### ScratchPad Tab Settings

|Setting|Description|Default Value|
|---|---|---|
|**ScratchPad note path**|The full vault path to the note file used by the scratchpad.|`ScratchPad.md`|
|**Show preview/edit button**|Shows the button to toggle between plain text and Markdown preview.|`false`|
|**Show '+ Task' button**|Shows the button to quickly add a new task.|`true`|
|**Task Creation Format**|The template string for the '+ Task' button, with placeholder support.|`- [ ] #Tag | 📅 {friday}`|
|**ScratchPad font size/family**|Customize the font used in the scratchpad editor.|`14px` / `""`|
|**Bold ScratchPad text**|Toggles bold font weight for scratchpad text.|`false`|
|**Search highlight color**|The background color for highlighted search terms.|`rgba(255, 165, 0, 0.4)`|

### Notes & Assets Tab Settings

|Setting|Description|Default Value|
|---|---|---|
|**Pinned notes tag**|The tag (without '#') used to identify notes for the "Pinned" view.|`pin`|
|**Notes lookback days**|How many days back to look for recent notes.|`7`|
|**Show note status dots**|Shows a colored dot (created/modified) next to each note in the list.|`true`|
|**Show note tooltips**|Show a detailed tooltip on hover with file metadata.|`true`|
|**Assets lookback days**|How many days back to look for recent assets.|`7`|
|**Hidden asset file types**|Comma-separated list of file extensions to hide from the Assets tab.|`base,canvas`|
|**Show indicator for unused assets**|Shows an icon next to assets that are not linked from any note.|`true`|
|**Note/Task Hover Color**|The background color when hovering over an item in the Notes, Tasks, or Assets list.|`rgba(51, 51, 51, 1)`|
|**Ignore folders in Notes tab**|Define folder paths to exclude from the "Recent Notes" list.|`[]`|

### Tasks Tab Settings

|Setting|Description|Default Value|
|---|---|---|
|**Task heading/text font size**|Font size for group headings and individual task items.|`13px` / `14px`|
|**Truncate long task text**|If enabled, long task text is shortened with `...`.|`true`|
|**Show completed tasks for Today**|If enabled, completed tasks due today will still appear in the list.|`true`|
|**Task sort order**|Default sorting for tasks within each group (`By Due Date`, `A-Z`, `Z-A`).|`dueDate`|
|**Group tasks by**|The default grouping method (`Date` or `Tag`).|`date`|
|**Date Groups to Show**|Toggles to show/hide specific date groups (Overdue, Today, Tomorrow, etc.).|All enabled|
|**Task Group Icons**|Customize the Lucide icon name for each task group header.|Various|
|**Task Group Backgrounds**|Individual RGBA color pickers for the background of each task group.|Various|
|**Exclude folders from Task search**|Define folder paths to exclude from the task search.|`[]`|


---

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Feel free to check  [GitHub issues page](https://github.com/fikte/calendar-period-week-notes/issues)


[Buy me a coffee](https://buymeacoffee.com/fikte)

<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/ff04322a-0e76-4095-a5ce-93853723617e" />


## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.


