[Contributing to this plugin](https://github.com/fikte/calendar-period-week-notes?tab=readme-ov-file#contributing-to-calendar-period-week-notes)

--- 

# 📅 Obsidian Calendar Period Week Notes

v1.3.0 adds a new **Dashboard Tab with Task / File Creation Widgets and Heatmaps**. See screenshots and read more about this major new feature below. 

---
A powerhouse daily and weekly planning plugin for Obsidian which combines a highly customizable calendar with an integrated tabbed interface for your scratchpad, recent notes, tasks, assets and a dashboard containing a number of widgets giving you a complete overview of your vault at a glance.

Move beyond simple daily notes with a unique **Period/Week** system for those who have their financial year mapped out over 13 periods of 4 weeks, (or simply use the standard calendar week numbering), interactive **popups**, and a deeply integrated **task manager**.

<img width="434" height="341" alt="image" src="https://github.com/user-attachments/assets/91de85b9-0603-48e7-a2b0-4dbc273cc9da" />

_The main calendar grid with period / week column, dot indicators, and heat map for the number of tasks for a date._

<img width="434" height="987" alt="image" src="https://github.com/user-attachments/assets/e1784fc4-f62f-462b-a6b8-4d9021256923" />

_The vertical calendar grid which allows you to scroll up and down to see previous dates and forward dates up to the next year._

<img width="435" height="1153" alt="image" src="https://github.com/user-attachments/assets/6d92b769-c685-4869-8d0f-8b14df235745" />

_The main interface showing the calendar with the calendar week column, dot indicators, and the integrated tabs for ScratchPad, Notes, Tasks, and Assets._

<img width="435" height="339" alt="image" src="https://github.com/user-attachments/assets/1805df7b-9bc2-4254-bb20-48ace45333e7" />

_The main interface showing in light appearance with the calendar week column, heat map for tasks, and the integrated tab buttons for Tasks, ScratchPad, Pinned Notes and Assets._

<img width="797" height="882" alt="image" src="https://github.com/user-attachments/assets/63015011-b52f-462c-a945-e1d838aee2ed" />
<img width="380" height="748" alt="image" src="https://github.com/user-attachments/assets/ddffdc98-9323-4831-885c-4b12b2c52113" />

_The Themes settings tab provides the ability to view different themes in light and dark app appearances and then apply with one click. Navigate up and down the different themes with the arrow keys and left / right to toggle between light and dark appearance._

<img width="1194" height="656" alt="image" src="https://github.com/user-attachments/assets/14722219-a54a-4928-8c84-c92a1364d261" />

_Some of the available 16 themes or make your own theme and share with others from the plugin settings._

<img width="483" height="1211" alt="image" src="https://github.com/user-attachments/assets/8ccc2fa1-33ca-4f91-be65-ebe7fd78c4dc" />

_NEW: Dashboard Task Tab showing summary and heatmap of tasks acrosss your notes._ 

<img width="484" height="1196" alt="image" src="https://github.com/user-attachments/assets/1d403326-dc32-4d47-95c2-87b9ddd3a259" />

_NEW: Dashboard File Creation Tab showing summary and heatmap of files acrosss your vault._ 

<img width="598" height="930" alt="image" src="https://github.com/user-attachments/assets/d46f0d94-5600-417c-bd5b-ebc20ce09e96" />

_NEW: Dashboard Custom Heatmaps - create your own configurable heatmaps with powerful filters in the new Dashboard Settings area._ 

<img width="484" height="222" alt="image" src="https://github.com/user-attachments/assets/3ea2d72d-4ca8-49a8-8974-c8ea45a93d31" />

_NEW: Dashboard Custom Heatmaps - example of a custom heatmap showing in the Dashboard tab._ 


---

# Calendar Period Week Notes

A powerful calendar and dashboard system for Obsidian, designed for deep customization and integration with your notes, tasks, and files. It combines a dynamic calendar with a configurable dashboard featuring task summaries, file creation heatmaps, and much more.

---

## ✨ Features

### 📊 The All-New Dashboard

The plugin now features a powerful, customizable dashboard grid that can be switched between two primary modes by clicking its tab. All widgets are collapsible and their order can be rearranged via drag-and-drop in the settings.

-   **Two Main Views**:
    -   **Tasks Dashboard**: Get an at-a-glance overview of your productivity.
    -   **Creation Dashboard**: Visualize your note and file creation activity over time.
-   **Tasks Dashboard Widgets**:
    -   **Task Summary Widgets**: See summaries for `Today`, `Tomorrow`, `Next 7 Days`, and `Future & No Due Date`, with progress bars showing `Incomplete`, `In-Progress`, `Completed`, and `Overdue` tasks.
    -   **Mini & Collapsed States**: Click the header to collapse a widget, or use the toggle to switch to a compact "mini" view.
    -   **Weekly/Monthly Task Metrics**: View bar charts summarizing task completion and creation over the current week and month.
-   **Creation Dashboard Widgets**:
    -   **Custom Heatmaps**: Create an unlimited number of personalized heatmap widgets to track file activity. Each heatmap is deeply configurable:
        -   **Date Source**: Track files by `creation date` or by a `date in the note title`.
        -   **Custom Filters**: Combine multiple rules (`tag`, `filename`, `path`, `filetype`) using `AND`/`OR` logic.
        -   **Date Range**: Set custom time windows using "Months Back" and "Months Forward" fields.
        -   **Color & Links**: Assign a unique color and link the widget's total count to a summary note.
        -   **Debug Mode**: A special mode to help you troubleshoot your filter rules.
    -   **All Files Heatmap**: A default widget that shows all note and asset creation activity across your vault.

### 🗓️ Dynamic Calendar View

-   **Dual Calendar Layouts**: Instantly switch between a traditional **monthly grid** and a continuous **vertical scroll** view by clicking the month title.
-   **Enhanced Mobile Experience**:
    -   **Swipe Gestures**: Intuitively swipe up on the grid to collapse it, swipe down on the header to expand it, and swipe down on the grid itself to switch to the vertical view.
    -   **Optimized Interaction**: On mobile, **long-press a date** to open the details popup and **tap the date** to open the daily note. The calendar also auto-collapses when you focus a search bar to maximize screen space.
-   **Custom Period/Week System**: Structure your year with a 13-period, 4-week system. Set your own start date for P1W1.
-   **Flexible Week Start**: Choose either Sunday or Monday as the first day of the week.
-   **At-a-Glance Dot Indicators**: See daily activity with fully customizable colored dots for daily notes, weekly notes, new/modified notes, new assets, and external calendar events.
-   **Task & Event Indicators**: Visualize your workload with multiple styles:
    -   **Badge**: A numerical count of open tasks/events.
    -   **Heatmap**: The cell background color changes based on the number of tasks/events.
    -   **Dot**: A single, customizable dot.
    -   **Custom Task Statuses**: Go beyond `[x]`. Use symbols like `/` (in-progress), `>` (forwarded), `!` (important), or `?` (questions), all with customizable icons.
-   **Advanced Highlighting**: Customize highlighting for the current week row, day column on hover, or use the **Complex** mode to highlight both the row and column up to the hovered date.
-   **Weekly Notes**: Create and manage weekly notes with customizable naming formats, template support, and a dot indicator on the week number.

### 🧩 Integrated & Draggable Tab Panels

A powerful set of panels located below the calendar. All tabs can be reordered via drag-and-drop.

-   **📊 Dashboard Tab**: The entry point to the new dashboard system. **Click the tab** while it's active to toggle between the **Tasks** and **Creation** dashboard views.
-   **📝 Scratchpad Tab**:
    -   Toggle between **edit** and **Markdown preview** mode.
    -   Quickly add tasks using a customizable format with dynamic date placeholders (`{today}`, `{friday}`).
    -   **Shift-click the tab** to open the scratchpad file in a full editor tab.
-   **📂 Notes & Pinned Tab**:
    -   **Click the tab** to toggle between **"Recent"** and **"Pinned"** mode.
    -   **Pinned Mode**: Shows notes with a specific tag (e.g., `#pin`).
    -   **Custom Drag-and-Drop Sorting**: Activate a custom sort order and reorder pinned notes by holding `Alt`/`Option`.
    -   **Right-Click Popups**: Choose to trigger popups on right-click (or long-press on mobile) instead of hover.
-   **✔️ Tasks Tab**:
    -   **Group tasks** by due date (`Overdue`, `Today`...) or by `#tag`. Toggle the grouping method by **clicking the tab**.
    -   **Animated Groups**: Task groups smoothly expand and collapse.
    -   Check off tasks directly from the list to update the source file instantly.
-   **🖼️ Assets Tab**:
    -   **Toggle between list and grid view** by clicking the tab.
    -   **Unused Asset Indicator**: An icon highlights assets not linked from any note.
    -   **Backlinks Popup**: Hover over an asset's icon to see all notes that link to it.

### 🎨 Powerful Theming & Deep Customization

-   **16 Pre-built Themes**: Instantly change the look and feel with a diverse collection of themes.
-   **Total Customization**: Every color, font, icon, and size is customizable through the settings.
-   **Import/Export**: Save and load your complete plugin configuration or just your theme colors to a JSON file.
-   **Draggable Order**: Reorder tabs and dashboard widgets to create your perfect layout.
-   **Visibility Toggles**: Hide any tab or dashboard widget you don't use.
-   **Custom Icons**: Change the icons for tabs and task groups to any Lucide icon name.

---

## 🚀 Installation

### From Community Plugins

1.  Open **Settings** > **Community Plugins**.
2.  Make sure "Restricted mode" is **off**.
3.  Click **Browse** and search for "Calendar Period Week Notes".
4.  Click **Install**, then **Enable**.

### Manual Installation

1.  Download the zip file containing the `main.js`, `manifest.json` and Theme files from the latest [GitHub release](https://github.com/fikte/calendar-period-week-notes/releases/).
2.  Create a new folder named `Calendar Period Week Notes` inside your vault's plugin folder: `<VaultFolder>/.obsidian/plugins/`, (you may need to show hidden files for your operating system to view this)
3.  Copy the downloaded files into this new folder.
4.  Reload Obsidian, then go to **Settings** > **Community Plugins** and enable it.

The folder structure should be: 

```
<VaultFolder>/.obsidian/plugins/Calendar Period Week Notes/
├── main.js 
├── manifest.json
├── Themes/
│ ├── Autumn.json
│ ├── Beach.json
│ ├── Calm.json
│ ├── Christmas.json
│ ├── Default-Developer.json
│ ├── Default.json
│ ├── Garden.json
│ ├── Halloween.json
│ ├── Izzy.json
│ ├── Kate.json
│ ├── Pride.json
│ ├── Scary.json
│ ├── Sky.json
│ ├── Spring.json
│ ├── Summer.json
│ ├── Winter.json
```

---

## 💡 How to Use

1.  **Open the View**: Click the `📅` icon in the left ribbon or use the command palette (`Ctrl/Cmd + P`).
2.  **Navigate the Calendar**:
    -   On desktop, click a date to open its daily note. On mobile, **tap** a date.
    -   On desktop, hover a date to see the details popup. On mobile, **long-press** the date.
    -   Click the month title (e.g., "October 2025") to switch between monthly and vertical views.
    -   **On mobile**, swipe up on the grid to collapse it or swipe down on the header to expand it.
3.  **Use the Tabs**:
    -   Click a tab to switch panels. Drag and drop tabs to reorder them.
    -   **Click a tab that is already active** for special functions:
        -   **Dashboard Tab**: Toggles between the **Tasks** and **Creation** dashboards.
        -   **Scratchpad Tab**: (Shift-click) Opens the scratchpad file in a new editor.
        -   **Notes Tab**: Toggles between "Recent" and "Pinned" views.
        -   **Tasks Tab**: Toggles grouping between "Date" and "Tag".
        -   **Assets Tab**: Toggles between grid and list view.
4.  **Reorder Pinned Notes**: In the Pinned Notes view, set the sort order to `Custom`. Then, hold `Alt` (Windows/Linux) or `Option` (macOS) and drag notes.

---

## 🔧 Settings

The plugin offers extensive options organized into the following tabs.

### General Display

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Month title format** | Format for the main title using moment.js tokens (`MMMM YYYY`). | `MMMM YYYY` |
| **Month title font size** | Font size for the main "Month Year" title. | `20px` |
| **Bold month title** | Toggles bold font weight for the main title. | `false` |
| **Month Title Color (Light/Dark)** | Color for the main title in light and dark themes. | `rgba(51,51,51,1)` / `rgba(255,255,255,1)` |
| **Navigation buttons height** | The height of the `←`, `Today`, and `→` buttons. | `28px` |
| **Bold calendar header** | Toggles bold font weight for the day names row (Mon, Tue, etc.). | `false` |
| **Day header row font color (Light/Dark)** | Text color for the day names in light and dark themes. | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |
| **Calendar grid layout** | Choose between `spacious`, `normal`, or `condensed` layout. | `normal` |
| **Calendar grid labels font size** | Font size for day names and week/period columns. | `12px` |
| **Calendar grid day numbers font size** | Font size for the date numbers in calendar cells. | `15px` |
| **Date cell font color (Light/Dark)** | Text color for date numbers in light and dark themes. | `rgba(51,51,51,1)` / `rgba(255,255,255,1)` |
| **Other month date font color (Light/Dark)** | Text color for dates outside the current month. | `rgba(150,150,150,0.5)` / `rgba(150,150,150,0.5)` |
| **Show calendar grid lines** | Toggles visibility of borders between calendar days. | `true` |
| **Calendar grid gap width** | Width of the border between cells (e.g., `1px`). | `1px` |
| **Today's date style** | How to indicate the current day: `Off`, `Highlight Cell`, `Circle`, `Square`. | `circle` |
| **Today's circle highlight size** | Adjust the size of the `Circle` highlight style (in `em`). | `2.4em` |
| **Today's Date Highlight (Light/Dark)** | Background color for the `Highlight Cell` style. | `rgba(255,255,0,0.3)` / `rgba(255,255,0,0.3)` |
| **Today's Circle/Square Color (Light/Dark)** | Controls the highlight color for `Circle` and `Square` styles. | `rgba(40,120,240,1)` / `rgba(40,120,240,1)` |
| **Highlight today's day header** | Colors the day column header (e.g., 'Mon') containing today. | `true` |
| **Highlight today's PW or week number** | Colors the P/W or Week number for the current week. | `true` |
| **Current Day Label Highlight (Light/Dark)** | Color for today's day/week labels. | `rgba(40,120,240,1)` / `rgba(40,120,240,1)` |
| **Date Cell Hover Color (Light/Dark)** | Background color when hovering over a date cell. | `rgba(0,0,0,0.075)` / `rgba(51,51,51,1)` |
| **Bold Period/Week column** | Toggles bold font weight for the P/W column. | `false` |
| **Show PW separator line** | Displays a vertical line between week columns and the date grid. | `true` |
| **PW separator line color** | Color of the vertical separator line. | `rgba(128,128,128,0.3)` |
| **Period/Week column font color (Light/Dark)** | Text color for the P/W column. | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |
| **Week number column font color (Light/Dark)** | Text color for the week number column. | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |

### Calendar Functional

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Week starts on** | Choose between `Monday` or `Sunday`. | `sunday` |
| **Start of Period 1 Week 1** | The anchor date for the P/W system. Must match your "Week starts on" day. | `2025-03-02` |
| **Period/Week format** | Display format for the P/W column (e.g., `P#W#`, `P# W#`, `p#w#`). | `P#W#` |
| **Show Period/Week column** | Toggles the visibility of the P/W column. | `false` |
| **Show week number column** | Toggles the visibility of the week number column. | `true` |
| **Week number type** | Choose `Period System Week` or `Calendar Year Week (ISO)`. | `calendar` |
| **Week number column label** | Text label for the week number column header. | `W#` |
| **Daily Notes folder** | The vault path where daily notes are stored. | `Daily Notes` |
| **Daily Note open behavior** | Open daily notes in a `new-tab` or `current-tab`. | `new-tab` |
| **Daily Note template** | Path to a template file for new daily notes. | `""` |
| **Enable row highlight** | Highlights the week's row when hovering the P/W label. | `true` |
| **Enable column highlight** | Highlights the day's column when hovering the day name label. | `true` |
| **Enable complex grid highlight** | When hovering a date, highlights cells in its row and column. | `false` |
| **Always highlight current week** | Keeps the row for the current week permanently highlighted. | `false` |
| **Grid Highlight Color (Light/Dark)** | Color for row/column hover effects. | `rgba(163,163,163,0.2)` / `rgba(51,51,51,1)` |
| **Highlight weekends** | Shades Saturday and Sunday columns. | `true` |
| **Weekend shade color (Light/Dark)**| Background color for weekend columns. | `rgba(0,0,0,0.03)` / `rgba(255,255,255,0.03)` |
| **External calendar URL (.ics)** | URL for an external .ics calendar feed. | `""` |
| **Auto-refresh Interval** | How often to refresh the external calendar (15 min, 30 min, 1 hr, 3 hr, 6 hr, 12 hr). | `60` |
| **Calendar Event Indicator** | Display events as `Dot Only`, `Add to Heatmap` or `Add to Task Badge`. | `dot` |
| **Calendar Events Placeholder** | Placeholder in daily notes for event insertion (e.g., `%%CALENDAR_EVENTS%%`). | `%%CALENDAR_EVENTS%%` |
| **Calendar Event Format** | Template for each event. Use `{{summary}}`, `{{startTime}}`, `{{endTime}}`. | `- {{startTime}} - {{endTime}}: {{summary}}` |

### Popup Indicators

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Popup Hover Delay** | How long to wait before showing a popup on hover (in milliseconds). | `800` |
| **Popup Hide Delay** | How long to wait before hiding a popup after the mouse leaves (in milliseconds). | `50` |
| **Popup Gap** | The gap in pixels between a calendar day and its popup. Can be negative. | `-2` |
| **Popup Font Size** | The font size for text inside popups. | `14px` |
| **Notes & Assets Popup Trigger** | Choose how popups appear in lists: `Hover` (desktop) or `Right-click` (long-press on mobile). | `hover` |

### Dot Indicators

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Show dot for created notes** | Show a dot on days a non-daily note was created. | `true` |
| **Show dot for modified notes** | Show a dot on days a non-daily note was modified. | `true` |
| **Show dot for new assets** | Show a dot on days an asset was added. | `true` |
| **Show dot for external ics events** | Show a dot for events from an external calendar. | `true` |
| **Calendar dot size** | The size of the dots in pixels. | `4` |
| **Daily Note Dot Color** | Color for daily note dots. | `rgba(74, 144, 226, 1)` |
| **Created Note Dot Color** | Color for created note dots. | `rgba(76, 175, 80, 1)` |
| **Modified Note Dot Color** | Color for modified note dots. | `rgba(255, 152, 0, 1)` |
| **Asset Dot Color** | Color for new asset dots. | `rgba(255, 0, 0, 1)` |
| **Calendar Event Dot Color** | Color for external calendar event dots. | `rgba(148, 148, 148, 1)` |
| **Ignore folders for note dots** | Folder paths to exclude from creating created/modified dots. | `[]` |
| **Ignore folders for asset dots** | Folder paths to exclude from creating asset dots. | `[]` |

### Weekly Notes

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Enable weekly notes** | Toggle weekly notes functionality. | `true` |
| **Weekly note folder** | The vault path where weekly notes are stored. | `Weekly Notes` |
| **Weekly note format** | Filename format. Placeholders: `YYYY`, `MM`, `PN`, `PW`, `WKP`, `WKC`. | `YYYY-[W]WKC` |
| **Weekly note template** | Path to a template file for new weekly notes. | `""` |
| **Show weekly note dot** | Show a dot on the week number when a weekly note exists. | `true` |
| **Weekly Note Dot Color**| Color of the weekly note indicator dot. | `rgba(160, 115, 240, 1)` |

### Task Indicators

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Task indicator style** | Choose between `none`, `badge`, or `heatmap`. | `heatmap` |
| **Show dot for tasks** | Show a separate dot for tasks (can be used with other styles). | `false` |
| **Task Dot Color** | The color of the task dot. | `rgba(200, 100, 200, 1)` |
| **Task badge font size** | Font size for the task count badge. | `11px` |
| **Task badge background color** | Background color for the task count badge. | `rgba(100, 149, 237, 0.6)` |
| **Task badge font color** | Text color for the task count badge. | `rgba(255, 255, 255, 1)` |
| **Heatmap content border width** | Width of the border inside heatmap cells (e.g., `1px`). | `1px` |
| **Heatmap Start Color** | Color for days with 1 task. | `rgba(100, 149, 237, 0.3)` |
| **Heatmap Mid Color** | Color for days with midpoint tasks. | `rgba(255, 127, 80, 0.45)` |
| **Heatmap End Color** | Color for days with maximum tasks. | `rgba(255, 71, 71, 0.6)` |
| **Gradient Midpoint** | Number of tasks to trigger the mid color. | `5` |
| **Gradient Maxpoint** | Number of tasks to trigger the end color. | `10` |

### Dashboard

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Default Dashboard View** | Choose which dashboard to show by default. | `tasks` |
| **Widgets Order** | Draggable lists to set the display order for Tasks and Creation widgets. | *Varies* |
| **Widget Visibility** | Toggles to show or hide each widget (Task Summaries, Charts, Heatmaps). | All `true` |
| **Custom Date Formats** | Comma-separated list of formats for parsing dates from note titles. | `YYYY-MM-DD` |
| **Task Status Colors** | Custom colors for `Cancelled`, `Overdue`, `In Progress`, and `Open` tasks in widgets. | *Varies* |
| **Custom Heatmaps** | Interface to add, delete, and configure custom heatmap widgets, including name, color, filters (tag, filename, path), date source, date range, and link path. | `[]` |

### General Tabs

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Tab title font size** | Font size for the tab titles. | `14px` |
| **Bold tab titles** | Toggles bold font weight for tab titles. | `false` |
| **Active Tab Indicator** | The color of the underline for the currently active tab. | `rgba(102, 102, 102, 1)` |
| **Tab Order** | A draggable list to define the order of tabs. | `dashboard,scratch,notes,tasks,assets` |
| **Tab Visibility** | Individual toggles to show or hide each tab. | All `true` |
| **Desktop tab display** | Choose `Icon Only`, `Text Only`, or `Icon and Text`. | `iconOnly` |
| **Mobile tab display** | Choose `Icon Only`, `Text Only`, or `Icon and Text`. | `iconOnly` |
| **Tab Icons** | Customize the Lucide icon for each tab. | *Varies* |

### ScratchPad Tab

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **ScratchPad note path** | The full vault path to the note file used by the scratchpad. | `ScratchPad.md` |
| **Click tab action** | What to do when the active tab is **Shift-clicked**: `new-tab` or `current-tab`. | `new-tab` |
| **Show preview button** | Shows button to toggle between plain text and Markdown preview. | `false` |
| **Show '+ Task' button**| Shows button to quickly add a new task. | `true` |
| **Task Creation Format** | Template for '+ Task' button with placeholders like `{today}` and `|`. | `- [ ] #Tag | 📅 {friday}` |
| **ScratchPad font size** | Customize the font size used in the scratchpad editor. | `14px` |
| **ScratchPad font family**| Customize the font family (leave blank for default). | `""` |
| **Bold ScratchPad text** | Toggles bold font weight for scratchpad text. | `false` |
| **Search highlight color**| Background color for highlighted search terms. | `rgba(255, 165, 0, 0.4)` |

### Notes Tab

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Notes tab open behavior** | Open notes in a `new-tab` or `current-tab`. (Shift-click always opens in new tab). | `new-tab` |
| **Show note status dots** | Shows a colored dot next to each note in the list. | `true` |
| **Show note tooltips** | Show a detailed tooltip on hover with file metadata. | `true` |
| **Notes list font size** | Font size for note titles in the list. | `14px` |
| **Bold note titles** | Toggles bold font weight for note titles in the list. | `false` |
| **Created Note Dot Color** | Color for the dot on recently created notes. | `rgba(76, 175, 80, 1)` |
| **Modified Note Dot Color** | Color for the dot on recently modified notes. | `rgba(255, 152, 0, 1)` |
| **Note/Task Hover Color** | Background color when hovering over items in lists. | `rgba(171, 171, 171, 0.15)` |
| **Notes lookback days** | How many days back to look for recent notes. | `7` |
| **Ignore folders** | Folder paths to exclude from the "Recent Notes" list. | `[]` |

### Pinned Notes Tab

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Pinned notes tag** | The tag (without '#') used to identify notes for the "Pinned" view. | `pin` |
| **Default sort order** | Default sort order for pinned notes: `a-z`, `z-a`, or `custom`. | `a-z` |
| **Set Custom Order** | A draggable list to set the manual order of pinned notes. | *N/A* |

### Assets Tab

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Asset open behavior** | Open assets in a `new-tab` or `current-tab`. | `new-tab` |
| **Assets lookback days**| How many days back to look for recent assets. | `7` |
| **Default assets view** | Choose between `list` or `grid` view. | `grid` |
| **Hidden asset file types**| Comma-separated list of file extensions to hide (e.g., `base,canvas`). | `base,canvas` |
| **Show indicator for unused assets**| Shows an icon next to assets not linked from any note. | `true` |

### Tasks Tab

| Setting | Description | Default Value |
| :--- | :--- | :--- |
| **Task heading font size** | Font size for group headings (e.g., 'Today', 'Overdue'). | `13px` |
| **Task text font size** | Font size for individual task items. | `14px` |
| **Truncate long task text**| If enabled, long task text is shortened with `...`. | `false` |
| **Show completed tasks for Today**| If enabled, completed tasks due today will still appear. | `true` |
| **Task sort order** | Default sorting for tasks within each group (`dueDate`, `a-z`, `z-a`). | `dueDate` |
| **Group tasks by** | The default grouping method (`date` or `tag`). | `date` |
| **Date Groups to Show** | Toggles to show/hide specific date groups. | All enabled |
| **Task Group Icons** | Customize the icon for each task group header. | *Varies* |
| **Task Group Backgrounds**| Individual RGBA color pickers for each task group. | *Varies* |
| **Exclude folders from Task search** | Folder paths to exclude from the task search. | `[]` |

### Import & Export

| Setting | Description |
| :--- | :--- |
| **Export All Settings** | Save your complete plugin configuration to a JSON file. |
| **Export Theme Only** | Save only colors, fonts, and sizes to a theme file. |
| **Import from File** | Load settings from a JSON file (with confirmation). |

---

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [GitHub issues page](https://github.com/fikte/calendar-period-week-notes/issues).

[Buy me a coffee](https://buymeacoffee.com/fikte)

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

---

# Version Change History 

v.1.3.0 
- Major new feature: Addition of a new Dashboard Tab which enables two views, file creation heatmap grids and also Tasks overview / heatmap grids. For the file creation heatmap view four grids are provided: Regular Notes, Daily Notes, Assets and All Files. 
  For the file creation heatmaps, you also have the ability to create / configure your own based on Filename, File path, File type and Tags. The query can be set to AND / OR to build up some powerful queryies with also the ability to filters types such as equals, contains, is, is not etc and also use Regular Expressions. This is a great way to create the note heatmaps that are unique to you. If you don't want to see the core heatmaps, you can toggle these off from being displayed.  

- The filter / search text boxes for tasks, notes and assets have been improved to add auto Tag select feature: 
	- In the tasks and notes tab filter text box, you can now filter by tags by clicking into the text box or by typing a # and a list of tags will be displayed below the text box. Using the arrow down key also shows the tag list too. The tag list that appears in the drop down list are tags that are representative of the notes or tasks that are listed. i.e. selecting a tag will not yield zero notes returned.
	- In the Assets filter text box, arrow down or start to type s and "search:unlinked" autocomplete search term will show. Selecting "search:unlinked" will filter the assets that do not appear on in any notes - this provides an easier way to find unlinked assets allowing these to be deleted as required.
- If you hold down the shift key and click the ScratchPad Tab icon, this will now automatically load the ScratchPad note in a new note tab, or if it's already open, bring it to focus. When holding down the shift key, the ScratchPad will also not show if it already does not have focus 
- For the notes and assets tabs, added a setting to choose if the popups are shown on mouse hover or via a mouse right click. Choosing the right click option makes it easier to scroll the notes or assets lists. NOTE: In the mobile app the touch to hold to show popup is always active regardless of option selected, (hover or right click). 
- On mobile and in the Notes Pinned view on the custom sort order view, you now touch and hold the "PINNED NOTES" header to enable the ability to drag to order the notes. To disable just touch and hold again the "PINNED NOTES" header.
- In the asset popup window, added a copy link button in the popup footer on the left side which makes it easier to add the asset to a note file
- In the vertical calendar view, when scrolling to past / future months the main header month year header title used to change with the scroll. For a consistent UI the main month year title now remains static showing the current month making going back to the current month easier. To navigate back to the main calendar view with a past or future month, click on that month title in the vertical calendar grid view.  
- You can now exit the vertical calendar view and going back to the main calendar view by pressing the "esc" key 
- If the custom sort order in the pinned notes view on one device is updated, (e.g. mobile device), the custom order will now automatically update on another device, (e.g. desktop app), automatically when open. 
- Added the asset dot back in the calendar grid popup window.
- Improved the position of the popup window when using a mobile device. 
- Removed the ability to choose your own tab icons in the General Tab settings

v1.2.6
- Major update for to viewing and applying different Themes. This plugin now comes with 16 different themes which can be viewed and applied in the new Themes tab, found in the plugin settings. This new settings tab also enables a view of the theme for light and dark modes before you apply. Arrow keys also navigate between themes, (up and down), and also light and dark appearances, (left and right). Be sure to check out the "Default - Developer" theme - this is the theme I use in dark mode appearance only every day! 
- Overhaul of the popup windows when hovering over notes and assets in those respective tabs to make these more functional and informative. You can also now delete a note / asset from the popup window, see back linked notes, and see what notes assets are on - all from this new popup window 
- In settings you can now copy and paste colours to other colour settings. This makes it super easy to style your theme across all the different settings 
- In the mobile apps you can now swipe down on the single calendar grid to show the vertical calendar view. Swiping up on the single calendar grid will hide it which makes it easy to see more tasks, scratchpad, notes and asset areas. To shoe the calendar again tap the toggle button top right of the plugin or swipe down on the header area.  
- Added a light and dark theme colour option for the circle / square today highlight 
- Added a light and dark theme colour option for period week/calendar week and day row labels today highlight
- In the vertical calendar view added the ability to tap on any of the month year headings which will take the user back to the main calendar grid view for that month. Also when hovering for 400ms the style of the year month will match the main calendar grid view
- When using the mobile app and the scratchpad text area or any of the search / filter text boxes have edit focus, the calendar grid will collapse automatically. When you've finished editing, swipe down on the month / year header or tap on the show calendar toggle button and the keyboard will disappear automatically   
- Workaround for mobile devices whereby when tapping on the scratchpad tab icon for a second time to load it in the main app window, the scratchpad note did not always have focus  
- Grid spacing improved for both desktop and mobile 
- Fixed an issue in the notes tab where in some cases the date format was not set correctly 
- Improved the import settings / theme prompt message 

v1.2.5
- In the pinned notes tab, you can now sort by A-Z, Z-A or a custom sort order of the notes. To change the custom sort order head to the settings to drag and drop notes in the order you want them within the Pinned Notes Tab. To see the different sort orders for the pinned notes, within the main Pinned Notes are, tap on the PINNED NOTES title to cycle through the views. You can also change the custom order within the main plugin pinned notes tab - when on the custom order view, hold down the option key on a mac or ctrl key on windows, and then drag the note to the position required. 
- Added the ability to turn off the calendar grid popup windows - useful if you just want to see dates and hover the mouse over them. To disable popups tap on the 'Go to today' calendar button, (the centre button in the button group top right of the plugin). When popups are disabled the button will have your obsidian accent colour, tap the button again to turn on the popup windows again, (the button will have no colour applied)
- Ability to set the font colour and transparency of the day row, period/week and calendar week labels. Separate colours for light and dark themes. 
- Ability to set the font colour and transparency of the day grid cells. Separate colours for light and dark themes. 
- Option to show the current period/week, calendar week column and current day row labels to be the same colour as the today date highlight colour.
- Option to highlight the weekend columns and set the colour for light and dark theme. 
- Theme export function updated with all the new font sizes, colour settings. 
- Improvements to the Help page layout in settings.
- Improved the spacing to make this a uniform gaps within on the calendar grid for spacious, normal and condensed views.
- Improved ordering the tabs in General Tab settings screen from a text based comma separated list to be a drag and drop way of ordering. You can still order by dragging and dropping on the main plugin UI as well. 
- Grid day labels are now uppercase. 
- Some other minor tweaks to the plugin UI and settings tabs. 

v1.2.4
- Add a calendar feed URL in the “Calendar Functional” settings tab to pull the feed events into the calendar view. The days with events can be displayed as a dot on the respective grid day and / or added to the task heat map or number accent. Hovering over the date in the grid will display the event details in the popup. 
- When creating a daily note by clicking twice on the calendar grid, you now have the option to add the calendar events for that day to the daily note. This requires templater plugin and works by adding predefined text in the template that will be replaced, e.g. %%CALENDAR_EVENTS%%. This is configurable in the “Calendar Functional” settings together with the format on how you would like the events to be listed  
- Added icons for other document types, (e.g. pdf, word), in the asset tab view.
- Fixed an issue if the font size for the week column was set very low the grid size would also shrink to be too small. The grid now has a minimum height. 
- Fixed an issue where the scratchpad would sometimes lose focus when editing.
- Added an option to show a vertical line between the period/week or calendar week column and the first month date column. The line colour is also colour / transparency configurable.
- Removed the thin horizontal line that was between the calendar grid and the tab icons.
- Some other small fixes and UI refinements.


---


# Contributing to Calendar Period Week Notes

Thank you for your interest in contributing to the Calendar Period Week Notes plugin for Obsidian! This guide provides all the information you need to set up your development environment, make changes, and build the plugin.

## Development Environment Setup

To get started, you'll need to set up your local environment. This involves cloning the repository and installing the necessary dependencies.

### Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   **Node.js**: You can download it from [nodejs.org](https://nodejs.org).
*   **npm** (or a similar package manager like Yarn or pnpm): npm is included with the Node.js installation.
*   **Git**: For version control.
*   **Obsidian**: The desktop application is required for testing the plugin.

### Getting Started

Follow these steps to set up your development environment:

1.  **Clone the Repository**:
    First, open your terminal and clone the repository into a local directory.

    ```
    git clone https://github.com/your-username/calendar-period-week-notes.git
    ```

2.  **Navigate to the Project Directory**:
    Change into the newly created directory.

    ```
    cd calendar-period-week-notes
    ```

3.  **Install Dependencies**:
    Run the following command to install all the required packages listed in `package.json`.

    ```
    npm install
    ```

4.  **Set Up for Testing in Obsidian**:
    To test the plugin, you need to load it into your Obsidian vault. The recommended approach is to clone this repository directly into your vault's plugin directory:
    ```
    git clone https://github.com/your-username/calendar-period-week-notes.git /path/to/your/vault/.obsidian/plugins/calendar-period-week-notes
    ```
    After cloning, go to **Settings** > **Community Plugins** in Obsidian, and enable the "Calendar Period Week Notes" plugin.

## Project Structure

A `src` folder is used to keep the project's source code organized and separate from configuration files and build outputs.

Your project structure should look something like this:

```
Calendar Period Week Notes/
├── src/
│ ├── main.js # The main entry point for the plugin
├── manifest.json # The plugin manifest
├── package.json
├── rollup.config.js # The Rollup configuration file
└── README.md
├── Themes/
│ ├── Autumn.json
│ ├── Beach.json
│ ├── Calm.json
│ ├── Christmas.json
│ ├── Default-Developer.json
│ ├── Default.json
│ ├── Garden.json
│ ├── Halloween.json
│ ├── Izzy.json
│ ├── Kate.json
│ ├── Pride.json
│ ├── Scary.json
│ ├── Sky.json
│ ├── Spring.json
│ ├── Summer.json
│ ├── Winter.json
```

All your development work, including new JavaScript files and styles, should be done within the `src` directory.

## Building the Plugin

The `npm run build` command is used to compile your source code from the `src` folder into a production-ready `main.js` file that Obsidian can use.

*   **To perform a one-time build**:
    ```
    npm run build
    ```
*   **To build and watch for changes**:
    For continuous development, you can use the `dev` script, which will automatically rebuild the plugin whenever you save a file.
    ```
    npm run dev
    ```

These commands trigger the build process defined in your `package.json`, which uses Rollup to bundle, transpile, and minify the code.

## Handling External Libraries (ical.js)

This plugin uses `ical.js` to parse calendar data. To include this library in the final `main.js` bundle, we use **Rollup** with specific plugins.

### Rollup Configuration

Your `rollup.config.js` file is the key to bundling external libraries. To properly include `ical.js`, you'll need the following plugins:
*   **@rollup/plugin-node-resolve**: Helps Rollup find third-party modules in your `node_modules` folder.
*   **@rollup/plugin-commonjs**: Converts CommonJS modules (like `ical.js`) into ES6, so they can be included in the bundle.

Here is a sample `rollup.config.js` that bundles `ical.js` correctly:

```
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  output: {
    dir: '.', 
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default', 
  },
  external: ['obsidian'],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
  ],
};
```

By listing `'obsidian'` as an `external` dependency, you tell Rollup not to include it in the final bundle, as it is provided by the Obsidian application at runtime. Since `ical.js` is *not* listed as external, the `resolve` and `commonjs` plugins will process it and merge its code directly into your `main.js` file.






