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
    
- **Flexible Week Start**: Choose between Sunday or Monday as the first day of the week.
    
- **Multiple Views**: Toggle between a traditional **monthly calendar** and a continuous **vertical scroll** view by clicking the month title.
    
- **Collapsible Calendar**: Hide or show the calendar grid using the chevron button in the header for more workspace.
    
- **Dot Indicators**: See which days have activity at a glance:
    
    - 🔵 Daily Notes
        
    - 🟣 Weekly Notes
        
    - 🟢 New Notes
        
    - 🟠 Modified Notes
        
    - 🔴 New Assets (images, PDFs, etc.)
        
    - ⚫ Calendar Events (from external ICS feed)
        
    - 🔢 A badge or heatmap showing the number of open tasks due on that day.
        
- **Interactive Popups**: Hover over any day with a dot to see a popup listing the specific notes, tasks, assets, and calendar events for that day, with clickable links.
    
- **Smart Highlighting**: Customize how you highlight dates, with options to highlight the current week, day column, or a complex grid up to the hovered date.
    
- **Week Numbers**: Optionally display standard ISO week numbers or weeks based on your Period/Week system.
    
- **Weekly Notes**: Create and manage weekly notes with customizable naming formats and templates. Weekly note existence is indicated by a dot on the week number.
    

### 🧩 Integrated Tabbed Dashboard

A fully functional panel right below your calendar, with draggable tabs to organize your workflow.

- 📝 **Scratchpad Tab**: A persistent note file for quick thoughts and fleeting ideas.
    
    - Toggle between **edit** and **Markdown preview** mode.
        
    - **Find-as-you-type search** with result highlighting.
        
    - A quick-add button to insert new tasks using a customizable format with date placeholders (`{today}`, `{monday}`, `|` for cursor position, etc.).
        
    - **Double-click** the tab to open the scratchpad file in a full editor tab.
        
- 📂 **Notes & Pinned Tab**: 
    
    - View a sorted list of recently created or modified notes.
        
    - **Double-click** the tab to switch to **"Pinned" mode**, showing only notes with a specific tag (e.g., `#pin`).
        
    - Detailed tooltips on hover show file path, dates, size, and tags.
        
    - Notes are organized into collapsible groups with counts.
        
    - Integrated search functionality with real-time filtering.
        
- ✔️ **Tasks Tab**: A complete task management system that scans your entire vault.
    
    - **Group tasks** by due date (`Overdue`, `Today`, `Tomorrow`, `Next 7 Days`, `Future`, `No Date`) or by `#tag`.
        
    - Toggle grouping by **double-clicking** the Tasks tab.
        
    - Check off tasks directly from the list, and the underlying Markdown file is updated instantly.
        
    - Click any task to jump directly to its line in the source file.
        
    - **Custom task status icons**: Support for extended task types including in-progress, cancelled, forwarded, important, starred, and more.
        
    - **Collapsible task groups** with customizable icons and background colors.
        
    - **Sort options**: Sort by due date, A-Z, or Z-A within each group.
        
    - **Completed tasks** can be shown or hidden for today.
        
    - **Integrated search** to filter tasks in real-time.
        
- 🖼️ **Assets Tab**: Keep track of non-Markdown files.
    
    - View recently added images, PDFs, audio files, and more.
        
    - See image **thumbnails** directly in the list.
        
    - **Toggle between list and grid view** by double-clicking the Assets tab.
        
    - **Unused Asset Indicator**: An icon appears next to any asset not linked from any note, helping you clean up your vault.
        
    - **Delete Unused Assets**: Securely delete unlinked assets directly from the asset list after a confirmation.
        
    - **Backlinks Popup**: Hover over an asset's icon to see a popup of all notes that link to it.
        
    - **Collapsible asset groups** organized by type or date.
  

### 📅 External Calendar Events Integration 

- **ICS Feed Support**: Integrate external calendars (Google Calendar, Outlook, etc.) via ICS URL.
    
- **Auto-refresh**: Configurable refresh intervals (15 minutes to 12 hours).
    
- **Event Display Options**: Show events as dots, heatmap, or badges on the calendar grid.
    
- **Template Insertion**: Automatically insert calendar events into daily notes using customizable format placeholders.
    
- **Event Popup**: View event details in the date hover popup.
      
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
        
    - Click the chevron button to collapse/expand the calendar grid.
        
    - Click on the week number to open (or create) a weekly note.
        
3. **Use the Tabs**:
    
    - Click a tab to switch panels.
        
    - Drag and drop tabs to reorder them.
        
    - **Double-click** special tabs for alternate functions:
        
        - **Scratchpad Tab**: Opens the scratchpad note file in a full editor tab.
            
        - **Notes Tab**: Toggles between "Recent" and "Pinned" views.
            
        - **Tasks Tab**: Toggles grouping between "Date" and "Tag".
            
        - **Assets Tab**: Toggle between two-column grid and list view for assets.
            

---

## 🔧 Settings

The plugin offers extensive options to tailor its appearance and functionality.

### General Display

| Setting | Description | Default Value |
| --- | --- | --- |
| **Calendar font size** | Font size for day names and P/W column. | `13px` |
| **Day number font size** | Font size for the date numbers in calendar cells. | `15px` |
| **Navigation buttons height** | The height of the `←`, `Today`, and `→` buttons. | `28px` |
| **Bold calendar header** | Toggles bold font weight for the day names row. | `false` |
| **Bold Period/Week column** | Toggles bold font weight for the P/W column. | `false` |
| **Show calendar grid lines** | Toggles the visibility of borders between calendar days. | `false` |
| **Show P/W separator line** | Display a vertical line between the Period/Week column and the first date column. | `true` |
| **P/W separator line color** | Color of the vertical line between Period/Week and date columns. | `rgba(128, 128, 128, 0.3)` |
| **Month title format** | Sets the display format for the main month title using moment.js tokens. | `MMM YYYY` |
| **Month title font size** | The font size of the main "Month Year" title. | `20px` |
| **Bold month title** | Toggles bold font weight for the main title. | `false` |
| **Month Title Color (Light)** | The color of the main title for light theme. | `rgba(51, 51, 51, 1)` |
| **Month Title Color (Dark)** | The color of the main title for dark theme. | `rgba(255, 255, 255, 1)` |
| **Calendar layout** | Choose between Normal, Condensed, Spacious, or Super Condensed layout for day cells. | `normal` |
| **Week start day** | Choose between Sunday or Monday as the first day of the week. | `sunday` |

### Tabs Configuration

| Setting | Description | Default Value |
| --- | --- | --- |
| **Tab title font size** | Font size for the tab titles. | `14px` |
| **Bold tab titles** | Toggles bold font weight for tab titles. | `false` |
| **Active Tab Indicator** | The color of the underline for the currently active tab. | `rgba(102, 102, 102, 1)` |
| **Tab Order** | A comma-separated list to define the order of tabs. | `scratch,notes,tasks,assets` |
| **Tab Visibility** | Individual toggles to show or hide the Scratch, Notes, Tasks, and Assets tabs. | All `true` |
| **Desktop tab display** | Choose between `Icon Only`, `Text Only`, or `Icon and Text`. | `iconOnly` |
| **Mobile tab display** | Choose between `Icon Only`, `Text Only`, or `Icon and Text`. | `iconOnly` |
| **Tab Icons** | Customize the icon for each tab. | Scratch: `pencil`<br>Notes: `files`<br>Tasks: `check-circle`<br>Pinned: `pin`<br>Assets: `image-file` |

### Calendar Functional Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **Start of Period 1 Week 1** | The date that anchors the entire Period/Week calculation system. Must match your Week Start Day. | `2025-03-02` |
| **Period/Week format** | The display format for the P/W column (e.g., `P#W#`, `P# W#`, `#-#`). | `P#W#` |
| **Show Period/Week column** | Toggles the visibility of the P/W column. | `false` |
| **Show week number column** | Toggles the visibility of a separate week number column. | `true` |
| **Week number type** | Choose between `Period System Week` or `Calendar Year Week (ISO)`. | `calendar` |
| **Week number column label** | Customize the label for the week number column. | `CW` |
| **Daily Notes folder** | The vault path where daily notes are stored. | `Daily Notes` |
| **Daily Note date format** | The date format for daily note filenames. | `YYYY-MM-DD` |
| **Daily Note open behavior** | Open daily notes in a `new-tab` or the `current-tab`. | `new-tab` |
| **Daily note template** | Path to a template file to use when creating new daily notes. | `""` |
| **Auto-reload interval** | Time in milliseconds between automatic data refreshes. | `5000` |

### Grid Highlighting

| Setting | Description | Default Value |
| --- | --- | --- |
| **Enable row highlight** | Highlights the entire week's row when hovering over the P/W label. | `true` |
| **Enable column highlight** | Highlights the entire day column when hovering over the day name label. | `true` |
| **Enable complex grid highlight** | When hovering over a date, highlights all cells in its row and column. | `false` |
| **Highlight current week** | Highlights the entire row of the current week. | `false` |
| **Grid Highlight Color (Light)** | The color used for the row/column/grid hover effects in light mode. | `rgba(163, 163, 163, 0.2)` |
| **Grid Highlight Color (Dark)** | The color used for the row/column/grid hover effects in dark mode. | `rgba(51, 51, 51, 1)` |
| **Today highlight style** | Choose between `none`, `circle`, `cell`, or `number` style for highlighting today's date. | `circle` |
| **Today circle color** | The color used for today's highlight circle/number. | `rgba(40, 120, 240, 1)` |
| **Today cell color (Light)** | Background color for today's cell highlight in light mode. | `rgba(255, 255, 0, 0.3)` |
| **Today cell color (Dark)** | Background color for today's cell highlight in dark mode. | `rgba(102, 102, 102, 1)` |
| **Date cell hover color (Light)** | Background color when hovering over a date in light mode. | `rgba(0, 0, 0, 0.075)` |
| **Date cell hover color (Dark)** | Background color when hovering over a date in dark mode. | `rgba(51, 51, 51, 1)` |

### Weekly Notes Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **Enable weekly notes** | Toggle weekly notes functionality on or off. | `true` |
| **Weekly note folder** | The vault path where weekly notes are stored. | `Weekly Notes` |
| **Weekly note format** | The filename format using placeholders: `YYYY`, `MM`, `PN`, `PW`, `WKP`, `WKC`. | `YYYY-[W]WKC` |
| **Weekly note template** | Path to a template file to use when creating new weekly notes. | `""` |
| **Show weekly note dot** | Show a dot on the week number when a weekly note exists. | `true` |
| **Weekly note dot color** | The color of the weekly note indicator dot. | `rgba(160, 115, 240, 1)` |

### Calendar Dot Indicators & Popups

| Setting | Description | Default Value |
| --- | --- | --- |
| **Show dot for created notes** | Show a dot on days a non-daily note was created. | `true` |
| **Show dot for modified notes** | Show a dot on days a non-daily note was modified. | `true` |
| **Show dot for new assets** | Show a dot on days an asset was added to the vault. | `true` |
| **Calendar dot size** | The size of the dots in pixels. | `4` |
| **Daily Note dot color** | Color for daily note dots. | `rgba(74, 144, 226, 1)` |
| **Weekly Note dot color** | Color for weekly note dots. | `rgba(160, 115, 240, 1)` |
| **Created Note dot color** | Color for created note dots. | `rgba(76, 175, 80, 1)` |
| **Modified Note dot color** | Color for modified note dots. | `rgba(255, 152, 0, 1)` |
| **Asset dot color** | Color for asset dots. | `rgba(255, 0, 0, 1)` |
| **Calendar Event dot color** | Color for calendar event dots. | `rgba(148, 148, 148, 1)` |
| **Popup hover delay** | Delay in ms before showing the details popup. | `100` |
| **Popup hide delay** | Delay in ms before hiding the popup after mouse leaves. | `100` |
| **Popup font size** | The font size of text inside the hover popup. | `13px` |
| **Ignore folders for dots** | Define folder paths to exclude from creating dots. | `[]` |

### External Calendar (ICS) Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **ICS URL** | External calendar ICS feed URL from Google Calendar, Outlook, etc. | `""` |
| **Show ICS dot** | Show a dot for external calendar events on the calendar. | `true` |
| **ICS refresh interval** | How often to refresh the ICS feed in minutes. | `60` |
| **Calendar events placeholder** | The placeholder text in daily note templates for event insertion. | `%%CALENDAR_EVENTS%%` |
| **Calendar events format** | Template format for events using placeholders: `{{summary}}`, `{{startTime}}`, `{{endTime}}`. | `- {{startTime}} - {{endTime}}: {{summary}}` |
| **Calendar event indicator style** | Choose between `dot`, `heatmap`, or `badge` for displaying events. | `dot` |

### Task Indicators

| Setting | Description | Default Value |
| --- | --- | --- |
| **Task indicator style** | Choose between `none`, `badge`, or `heatmap`. | `heatmap` |
| **Show task dot** | Show a separate dot for tasks. | `false` |
| **Task dot color** | The color of the task dot. | `rgba(200, 100, 200, 1)` |
| **Task badge font size** | Font size for the task count badge. | `9px` |
| **Task badge background color** | Background color for the task count badge. | `rgba(100, 149, 237, 0.6)` |
| **Task badge font color** | Text color for the task count badge. | `rgba(255, 255, 255, 1)` |
| **Heatmap start color** | Color for days with 1 task. | `rgba(100, 149, 237, 0.3)` |
| **Heatmap mid color** | Color for days with midpoint tasks. | `rgba(255, 127, 80, 0.45)` |
| **Heatmap end color** | Color for days with maximum tasks. | `rgba(255, 71, 71, 0.6)` |
| **Heatmap midpoint** | Number of tasks for the mid color. | `5` |
| **Heatmap maximum** | Number of tasks for the end color. | `10` |

### ScratchPad Tab Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **ScratchPad note path** | The full vault path to the note file used by the scratchpad. | `ScratchPad.md` |
| **Scratchpad open action** | Choose between `new-tab` or `current-tab` when double-clicking the tab. | `new-tab` |
| **Show preview/edit button** | Shows the button to toggle between plain text and Markdown preview. | `false` |
| **Show '+ Task' button** | Shows the button to quickly add a new task. | `true` |
| **Task Creation Format** | The template string for the '+ Task' button with placeholders like `{today}`, `{friday}`, `\|` for cursor. | `- [ ] #Tag \| 📅 {friday}` |
| **ScratchPad font size** | Customize the font size used in the scratchpad editor. | `14px` |
| **ScratchPad font family** | Customize the font family used in the scratchpad editor. | `""` (uses default) |
| **Bold ScratchPad text** | Toggles bold font weight for scratchpad text. | `false` |
| **Search highlight color** | The background color for highlighted search terms. | `rgba(255, 165, 0, 0.4)` |

### Notes Tab Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **Notes tab open behavior** | Open notes in a `new-tab` or the `current-tab`. | `new-tab` |
| **Pinned notes tag** | The tag (without '#') used to identify notes for the "Pinned" view. | `pin` |
| **Notes lookback days** | How many days back to look for recent notes. | `7` |
| **Show note status dots** | Shows a colored dot next to each note in the list. | `true` |
| **Show note tooltips** | Show a detailed tooltip on hover with file metadata. | `true` |
| **Notes list font size** | Font size for note titles in the list. | `14px` |
| **Bold note titles** | Toggles bold font weight for note titles. | `false` |
| **Note/Task Hover Color** | Background color when hovering over items in lists. | `rgba(171, 171, 171, 0.15)` |
| **Ignore folders in Notes tab** | Define folder paths to exclude from the "Recent Notes" list. | `[]` |

### Assets Tab Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **Asset open behavior** | Open assets in a `new-tab` or the `current-tab`. | `new-tab` |
| **Assets lookback days** | How many days back to look for recent assets. | `7` |
| **Default assets view** | Choose between `list` or `grid` view. | `grid` |
| **Hidden asset file types** | Comma-separated list of file extensions to hide. | `base,canvas` |
| **Show indicator for unused assets** | Shows an icon next to assets that are not linked from any note. | `true` |

### Tasks Tab Settings

| Setting | Description | Default Value |
| --- | --- | --- |
| **Task heading font size** | Font size for group headings. | `13px` |
| **Task text font size** | Font size for individual task items. | `14px` |
| **Truncate long task text** | If enabled, long task text is shortened with `...`. | `false` |
| **Show completed tasks for Today** | If enabled, completed tasks due today will still appear. | `true` |
| **Task sort order** | Default sorting for tasks within each group (`dueDate`, `a-z`, `z-a`). | `dueDate` |
| **Group tasks by** | The default grouping method (`date` or `tag`). | `date` |
| **Date Groups to Show** | Toggles to show/hide specific date groups (Overdue, Today, Tomorrow, Next 7 Days, Future, No Date). | All enabled |
| **Task Group Icons** | Customize the icon for each task group header. | Overdue: `alarm-clock-off`<br>Today: `target`<br>Tomorrow: `arrow-right`<br>Next 7 Days: `calendar-days`<br>Future: `telescope`<br>No Date: `help-circle`<br>Tag: `tag` |
| **Task Group Backgrounds** | Individual RGBA color pickers for each task group. | Overdue: `rgba(255, 71, 71, 0.15)`<br>Today: `rgba(255, 165, 0, 0.15)`<br>Tomorrow: `rgba(64, 158, 255, 0.15)`<br>Next 7 Days: `rgba(77, 171, 185, 0.15)`<br>Future: `rgba(128, 128, 128, 0.15)`<br>No Date: `rgba(105, 180, 105, 0.15)`<br>Tag: `rgba(105, 105, 105, 0.15)` |
| **Exclude folders from Task search** | Define folder paths to exclude from the task search. | `[]` |

### Import & Export

| Setting | Description |
| --- | --- |
| **Export All Settings** | Save your complete plugin configuration to a JSON file. |
| **Export Theme Only** | Save only colors, fonts, and sizes to a theme file. |
| **Import from File** | Load settings from a JSON file (with confirmation). |

---

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [GitHub issues page](https://github.com/fikte/calendar-period-week-notes/issues).

[Buy me a coffee](https://buymeacoffee.com/fikte)

<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/ff04322a-0e76-4095-a5ce-93853723617e" />

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.






