# 📅 Obsidian Calendar Period Week Notes

A powerhouse daily and weekly planning dashboard for Obsidian. This plugin combines a highly customizable calendar with an integrated tabbed interface for your scratchpad, recent notes, tasks, and assets, giving you a complete overview of your vault at a glance.

Move beyond simple daily notes with a unique **Period/Week** numbering system, interactive **popups**, and a deeply integrated **task manager**.

<img width="458" height="330" alt="image" src="https://github.com/user-attachments/assets/26127fb2-434d-41d0-a6a7-6eea96d8a87c" />

_The main calendar grid with period / week column, dot indicators, and heat map for the number of tasks for a date._

<img width="457" height="950" alt="image" src="https://github.com/user-attachments/assets/c7f8a318-1bb5-4a4e-9d7c-104665070356" />

_The vertical calendar grid which allows you to scroll up and down to see previous dates and forward dates up to the next year._

<img width="456" height="1065" alt="image" src="https://github.com/user-attachments/assets/19f5899c-386c-4a19-9590-f548dffc0f10" />

_The main interface showing the calendar with the calendar week column, dot indicators, and the integrated tabs for ScratchPad, Notes, Tasks, and Assets._

<img width="457" height="337" alt="image" src="https://github.com/user-attachments/assets/cfaf1407-206d-42e8-ae8a-7e62d1764acc" />

_The main interface showing in light appearance with the calendar week column, heat map for tasks, and the integrated tab buttons for Tasks, ScratchPad, Pinned Notes and Assets._

<img width="797" height="882" alt="image" src="https://github.com/user-attachments/assets/63015011-b52f-462c-a945-e1d838aee2ed" />
<img width="380" height="748" alt="image" src="https://github.com/user-attachments/assets/ddffdc98-9323-4831-885c-4b12b2c52113" />

_The Themes settings tab provides the ability to view different themes in light and dark app appearances and then apply with one click. Navigate up and down the different themes with the arrow keys and left / right to toggle between light and dark appearance._

<img width="1194" height="656" alt="image" src="https://github.com/user-attachments/assets/14722219-a54a-4928-8c84-c92a1364d261" />

_Some of the available themes._

---

## ✨ Features

### 🗓️ Dynamic Calendar View

-   **Dual Calendar Layouts**: Instantly switch between a traditional **monthly grid** and a continuous **vertical scroll** view by clicking the month title.
-   **Custom Period/Week System**: Structure your year with a 13-period, 4-week system. Set your own start date for P1W1.
-   **Flexible Week Start**: Choose either Sunday or Monday as the first day of the week.
-   **Collapsible Grid**: Hide or show the main calendar grid using the chevron button in the header to maximize workspace.
-   **At-a-Glance Dot Indicators**: See daily activity with colored dots:
    -   🔵 Daily Notes
    -   🟣 Weekly Notes
    -   🟢 New Notes (non-daily)
    -   🟠 Modified Notes (non-daily)
    -   🔴 New Assets (images, PDFs, etc.)
    -   ⚫ Calendar Events (from external ICS feed)
-   **Enhanced Task & Event Indicators**: Visualize your workload with multiple styles:
    -   **Badge**: A numerical count of open tasks/events for the day.
    -   **Heatmap**: The cell background color changes based on the number of tasks/events.
    -   **Dot**: A single, customizable dot to indicate any tasks/events.
    -   **Custom Task Statuses**: Go beyond a simple checkbox. Use symbols like `/` for in-progress, `>` for forwarded, `!` for important, or `?` for questions, all with customizable icons.
-   **Interactive & Mobile-Friendly Popups**:
    -   On desktop, hover over any day to see a detailed popup listing the specific notes, tasks, assets, and calendar events for that day, with clickable links.
    -   On mobile, **long-press a date** to open the popup as a convenient bottom sheet, and **tap the date** to open the daily note.
-   **Advanced Highlighting**: Customize how dates are highlighted, with options for the current week row, day column on hover, or even shading for weekends.
-   **Week Numbers**: Display standard ISO week numbers or week numbers based on your custom Period/Week system in a dedicated column.
-   **Weekly Notes**: Create and manage weekly notes, indicated by a dot on the week number. Features fully customizable naming formats and template support.

### 🧩 Integrated & Draggable Tabbed Dashboard

A powerful panel located directly below the calendar. All tabs can be reordered via drag-and-drop.

-   **📝 Scratchpad Tab**: A persistent note file for quick thoughts.
    -   Toggle between **edit** and **Markdown preview** mode.
    -   **Find-as-you-type search** with result highlighting.
    -   A quick-add button to insert new tasks using a customizable format with dynamic date placeholders (`{today}`, `{friday}`) and cursor positioning (`|`).
    -   **Click the tab** while it's active to open the scratchpad file in a full editor tab.
-   **📂 Notes & Pinned Tab**: A unified tab for browsing notes.
    -   **Click the tab** to toggle between **"Recent"** mode and **"Pinned"** mode.
    -   **Recent Mode**: View a sorted list of recently created or modified notes within a configurable lookback period, grouped by date (Today, Yesterday, etc.).
    -   **Pinned Mode**: Shows only notes with a specific tag (e.g., `#pin`).
    -   **Custom Sorting**: Sort pinned notes alphabetically, or activate a **custom drag-and-drop order** by holding `Alt` (Windows/Linux) or `Option` (macOS).
    -   Detailed tooltips on hover show file path, dates, size, and tags.
-   **✔️ Tasks Tab**: A complete task management system that scans your entire vault.
    -   **Group tasks** by due date (`Overdue`, `Today`, `Tomorrow`...) or by `#tag`.
    -   Toggle the grouping method by **clicking the tab** while it's active.
    -   **Animated Groups**: Task groups smoothly expand and collapse with an animation.
    -   Check off tasks directly from the list to update the underlying Markdown file instantly.
    -   Click any task to jump directly to its line in the source file.
    -   Collapsible task groups with customizable icons and background colors.
    -   Sort tasks within each group by due date or alphabetically.
-   **🖼️ Assets Tab**: Keep track of all non-Markdown files like images, PDFs, and audio.
    -   **Toggle between list and grid view** by clicking the tab while it's active.
    -   See image **thumbnails** directly in the list or grid.
    -   **Unused Asset Indicator**: An icon appears next to any asset not linked from any note, helping you clean up your vault.
    -   **Backlinks Popup**: Hover over an asset's icon to see a popup of all notes that link to it.

### 📅 External Calendar Integration

-   **ICS Feed Support**: Integrate external calendars (Google Calendar, Outlook, etc.) by providing an `.ics` URL.
-   **Auto-Refresh**: Set a configurable refresh interval (from 15 minutes to 12 hours) to keep events up to date.
-   **Intelligent Template Insertion**:
    -   When creating a daily note for a day with events, a dialog will ask if you want to include them.
    -   Events are inserted into your daily note using a placeholder (`%%CALENDAR_EVENTS%%`) and a fully customizable format.
    -   **Handles All-Day Events**: Correctly formats all-day events by replacing start/end times with "All-day".
-   **Event Display**: View event details in the date hover popup and visualize them on the calendar grid using a dot, or by contributing to the task heatmap/badge count.

### 🎨 Powerful Theming Engine

-   **16 Pre-built Themes**: Instantly change the look and feel with a diverse collection of themes, ranging from minimalist and dark to bright and colorful, designed to complement your main Obsidian theme.
-   **Create & Customize**: Every color in the plugin is customizable. Build your own theme from scratch or tweak an existing one to perfectly match your preferences.
-   **Share Your Creations**: Use the **Export Theme Only** function in the settings to save your colors to a JSON file. This allows for easy backups and sharing with the community.

| # | Theme               | #  | Theme     |
|:--|:--------------------|:---|:----------|
| 1 | Autumn              | 9  | Izzy      |
| 2 | Beach               | 10 | Kate      |
| 3 | Calm                | 11 | Pride     |
| 4 | Christmas           | 12 | Scary     |
| 5 | Default-Developer   | 13 | Sky       |
| 6 | Default             | 14 | Spring    |
| 7 | Garden              | 15 | Summer    |
| 8 | Halloween           | 16 | Winter    |


### ⚙️ Deep Customization

-   **Tabbed Settings**: A clean, organized settings interface with dedicated tabs for every feature.
-   **Import/Export**: Save and load your complete plugin configuration to a JSON file for backup or sharing.

---

## 🚀 Installation

### From Community Plugins

1.  Open **Settings** > **Community Plugins**.
2.  Make sure "Restricted mode" is **off**.
3.  Click **Browse** community plugins and search for this plugin's name.
4.  Click **Install**, then **Enable**.

### Manual Installation

1.  Download the latest release from the [GitHub releases page](https://github.com/fikte/calendar-period-week-notes/releases/).
2.  Unzip the downloaded file.
3.  Copy the unzipped folder into your vault's plugin folder: `<VaultFolder>/.obsidian/plugins/`.
4.  Reload Obsidian, then go to **Settings** > **Community Plugins** and enable it.

---

## 💡 How to Use

1.  **Open the View**: Click the `📅` icon in the left ribbon or use the command palette (`Ctrl/Cmd + P`) and search for "Open Calendar Period Week Notes".
2.  **Navigate the Calendar**:
    -   On desktop, click a date to open its daily note. On mobile, **tap** a date to open the note.
    -   On desktop, hover a date to see the details popup. On mobile, **long-press** the date.
    -   Use the `←` and `→` arrows to change the month. Click the `Today` button to return to the current month.
    -   Click the month title (e.g., "October 2025") to switch between monthly and vertical views.
    -   Click the chevron button to collapse/expand the calendar grid.
    -   Click on a week number to open (or create) a weekly note.
3.  **Use the Tabs**:
    -   Click a tab to switch panels.
    -   Drag and drop tabs to reorder them.
    -   **Click a tab that is already active** for special functions:
        -   **Scratchpad Tab**: Opens the scratchpad note file in a full editor tab.
        -   **Notes Tab**: Toggles between "Recent" and "Pinned" views.
        -   **Tasks Tab**: Toggles grouping between "Date" and "Tag".
        -   **Assets Tab**: Toggles between grid and list view.
4.  **Reorder Pinned Notes**: In the Pinned Notes view, click the header to cycle the sort order to `Custom`. Then, hold `Alt` (Windows/Linux) or `Option` (macOS) and drag notes to set your preferred order.

---

## 🔧 Settings

The plugin offers extensive options organized into the following tabs.

### General Display

| Setting                                     | Description                                                                     | Default Value                           |
| :------------------------------------------ | :------------------------------------------------------------------------------ | :-------------------------------------- |
| **Month title format**                      | Format for the main title using moment.js tokens (`MMMM YYYY`).                 | `MMMM YYYY`                             |
| **Month title font size**                   | Font size for the main "Month Year" title.                                      | `20px`                                  |
| **Bold month title**                        | Toggles bold font weight for the main title.                                    | `false`                                 |
| **Month Title Color (Light/Dark)**          | Color for the main title in light and dark themes.                              | `rgba(51,51,51,1)` / `rgba(255,255,255,1)` |
| **Navigation buttons height**               | The height of the `←`, `Today`, and `→` buttons.                                | `28px`                                  |
| **Bold calendar header**                    | Toggles bold font weight for the day names row (Mon, Tue, etc.).                | `false`                                 |
| **Day header row font color (Light/Dark)**  | Text color for the day names in light and dark themes.                          | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |
| **Calendar grid layout**                    | Choose between `spacious`, `normal`, or `condensed` layout.                     | `normal`                                |
| **Calendar grid labels font size**          | Font size for day names and week/period columns.                                | `12px`                                  |
| **Calendar grid day numbers font size**     | Font size for the date numbers in calendar cells.                               | `15px`                                  |
| **Date cell font color (Light/Dark)**       | Text color for date numbers in light and dark themes.                           | `rgba(51,51,51,1)` / `rgba(255,255,255,1)` |
| **Other month date font color (Light/Dark)** | Text color for dates outside the current month.                                 | `rgba(150,150,150,0.5)` / `rgba(150,150,150,0.5)` |
| **Show calendar grid lines**                | Toggles visibility of borders between calendar days.                            | `true`                                  |
| **Calendar grid gap width**                 | Width of the border between cells (e.g., `1px`).                                | `1px`                                   |
| **Today's date style**                      | How to indicate the current day: `Off`, `Highlight Cell`, `Circle`, `Square`.     | `circle`                                |
| **Today's Highlight Color**                 | Controls the highlight for Circle and Square styles.                            | `rgba(40,120,240,1)`                    |
| **Today's Date Highlight (Light/Dark)**     | Background color for the `Highlight Cell` style.                                | `rgba(255,255,0,0.3)` / `rgba(255,255,0,0.3)` |
| **Highlight today's day header**            | Colors the day column header (e.g., 'Mon') containing today.                    | `true`                                  |
| **Highlight today's PW or week number**     | Colors the P/W or Week number for the current week.                             | `true`                                  |
| **Date Cell Hover Color (Light/Dark)**      | Background color when hovering over a date cell.                                | `rgba(0,0,0,0.075)` / `rgba(51,51,51,1)` |
| **Bold Period/Week column**                 | Toggles bold font weight for the P/W column.                                    | `false`                                 |
| **Show PW separator line**                  | Displays a vertical line between week columns and the date grid.                | `true`                                  |
| **PW separator line color**                 | Color of the vertical separator line.                                           | `rgba(128,128,128,0.3)`                 |
| **Period/Week column font color (Light/Dark)** | Text color for the P/W column.                                               | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |
| **Week number column font color (Light/Dark)** | Text color for the week number column.                                       | `rgba(51,51,51,1)` / `rgba(255,255,255,0.7)` |

### Calendar Functional

| Setting                             | Description                                                                                                                                                                          | Default Value                                   |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **Week starts on**                  | Choose between `Monday` or `Sunday`.                                                                                                                                                 | `sunday`                                        |
| **Start of Period 1 Week 1**        | The anchor date for the P/W system. Must match your "Week starts on" day.                                                                                                            | `2025-03-02`                                    |
| **Period/Week format**              | Display format for the P/W column (e.g., `P#W#`, `P# W#`, `#-#`).                                                                                                                      | `P#W#`                                          |
| **Show Period/Week column**         | Toggles the visibility of the P/W column.                                                                                                                                            | `false`                                         |
| **Show week number column**         | Toggles the visibility of the week number column.                                                                                                                                    | `true`                                          |
| **Week number type**                | Choose `Period System Week` or `Calendar Year Week (ISO)`.                                                                                                                           | `calendar`                                      |
| **Week number column label**        | Text label for the week number column header.                                                                                                                                        | `W#`                                            |
| **Daily Notes folder**              | The vault path where daily notes are stored.                                                                                                                                         | `Daily Notes`                                   |
| **Daily Note open behavior**        | Open daily notes in a `new-tab` or `current-tab`.                                                                                                                                    | `new-tab`                                       |
| **Daily Note template**             | Path to a template file for new daily notes.                                                                                                                                         | `""`                                            |
| **Enable row highlight**            | Highlights the week's row when hovering the P/W label.                                                                                                                               | `true`                                          |
| **Enable column highlight**         | Highlights the day's column when hovering the day name label.                                                                                                                        | `true`                                          |
| **Enable complex grid highlight**   | When hovering a date, highlights cells in its row and column.                                                                                                                        | `false`                                         |
| **Always highlight current week**   | Keeps the row for the current week permanently highlighted.                                                                                                                          | `false`                                         |
| **Grid Highlight Color (Light/Dark)** | Color for row/column hover effects.                                                                                                                                                  | `rgba(163,163,163,0.2)` / `rgba(51,51,51,1)`     |
| **Highlight weekends**              | Shades Saturday and Sunday columns.                                                                                                                                                  | `true`                                          |
| **Weekend shade color (Light/Dark)**| Background color for weekend columns.                                                                                                                                                | `rgba(0,0,0,0.03)` / `rgba(255,255,255,0.03)`    |
| **External calendar URL (.ics)**    | URL for an external .ics calendar feed.                                                                                                                                              | `""`                                            |
| **Auto-refresh Interval**           | How often to refresh the external calendar (in minutes).                                                                                                                             | `60`                                            |
| **Calendar Event Indicator**        | Display events as `Dot Only`, `Add to Heatmap` or `Add to Task Badge`.                                                                                                                 | `dot`                                           |
| **Calendar Events Placeholder**     | Placeholder in daily notes for event insertion (e.g., `%%CALENDAR_EVENTS%%`).                                                                                                          | `%%CALENDAR_EVENTS%%`                           |
| **Calendar Event Format**           | Template for each event. Use `{{summary}}`, `{{startTime}}`, and `{{endTime}}`. `All-day` is used for all-day events.                                                                  | `- {{startTime}} - {{endTime}}: {{summary}}`      |

### Calendar Dots

| Setting                                 | Description                                                                              | Default Value                     |
| :-------------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------- |
| **Show dot for created notes**          | Show a dot on days a non-daily note was created.                                         | `true`                              |
| **Show dot for modified notes**         | Show a dot on days a non-daily note was modified.                                        | `true`                              |
| **Show dot for new assets**             | Show a dot on days an asset was added.                                                   | `true`                              |
| **Show dot for external ics events**    | Show a dot for events from an external calendar.                                         | `true`                              |
| **Calendar dot size**                   | The size of the dots in pixels.                                                          | `4`                               |
| **Daily Note Dot Color**                | Color for daily note dots.                                                               | `rgba(74, 144, 226, 1)`           |
| **Created Note Dot Color**              | Color for created note dots.                                                             | `rgba(76, 175, 80, 1)`            |
| **Modified Note Dot Color**             | Color for modified note dots.                                                            | `rgba(255, 152, 0, 1)`            |
| **Asset Dot Color**                     | Color for new asset dots.                                                                | `rgba(255, 0, 0, 1)`              |
| **Calendar Event Dot Color**            | Color for external calendar event dots.                                                  | `rgba(148, 148, 148, 1)`          |
| **Popup hover delay**                   | Delay in ms before showing the details popup on hover.                                   | `100`                               |
| **Popup hide delay**                    | Delay in ms before hiding the popup after mouse leaves.                                  | `100`                               |
| **Popup gap**                           | Gap in pixels between a calendar day and its popup (can be negative).                    | `-2`                                |
| **Popup font size**                     | Font size of text inside the hover popup.                                                | `13px`                              |
| **Ignore folders for note dots**        | Folder paths to exclude from creating created/modified dots.                             | `[]`                                |
| **Ignore folders for asset dots**       | Folder paths to exclude from creating asset dots.                                        | `[]`                                |

### Weekly Notes

| Setting                  | Description                                                                                                   | Default Value                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------------------- |
| **Enable weekly notes**  | Toggle weekly notes functionality.                                                                            | `true`                              |
| **Weekly note folder**   | The vault path where weekly notes are stored.                                                                 | `Weekly Notes`                    |
| **Weekly note format**   | Filename format. Placeholders: `YYYY`, `MM`, `PN` (Period), `PW` (Week of Period), `WKP` (Week of Period Year), `WKC` (ISO Week). | `YYYY-[W]WKC`                     |
| **Weekly note template** | Path to a template file for new weekly notes.                                                                 | `""`                                |
| **Show weekly note dot** | Show a dot on the week number when a weekly note exists.                                                      | `true`                              |
| **Weekly Note Dot Color**| Color of the weekly note indicator dot.                                                                       | `rgba(160, 115, 240, 1)`          |

### Task Indicators

| Setting                       | Description                                                              | Default Value                                   |
| :---------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------- |
| **Task indicator style**      | Choose between `none`, `badge`, or `heatmap`.                            | `heatmap`                                       |
| **Show dot for tasks**        | Show a separate dot for tasks (can be used with other styles).           | `false`                                         |
| **Task Dot Color**            | The color of the task dot.                                               | `rgba(200, 100, 200, 1)`                        |
| **Task badge font size**      | Font size for the task count badge.                                      | `9px`                                           |
| **Task badge background color** | Background color for the task count badge.                             | `rgba(100, 149, 237, 0.6)`                      |
| **Task badge font color**     | Text color for the task count badge.                                     | `rgba(255, 255, 255, 1)`                        |
| **Heatmap content border width** | Width of the border inside heatmap cells (e.g., `1px`).               | `1px`                                           |
| **Heatmap Start Color**       | Color for days with 1 task.                                              | `rgba(100, 149, 237, 0.3)`                      |
| **Heatmap Mid Color**         | Color for days with midpoint tasks.                                      | `rgba(255, 127, 80, 0.45)`                      |
| **Heatmap End Color**         | Color for days with maximum tasks.                                       | `rgba(255, 71, 71, 0.6)`                        |
| **Gradient Midpoint**         | Number of tasks to trigger the mid color.                                | `5`                                             |
| **Gradient Maxpoint**         | Number of tasks to trigger the end color.                                | `10`                                            |

### Tabs

| Setting                  | Description                                                                     | Default Value                           |
| :----------------------- | :------------------------------------------------------------------------------ | :-------------------------------------- |
| **Tab title font size**  | Font size for the tab titles.                                                   | `14px`                                  |
| **Bold tab titles**      | Toggles bold font weight for tab titles.                                        | `false`                                 |
| **Active Tab Indicator** | The color of the underline for the currently active tab.                          | `rgba(102, 102, 102, 1)`                |
| **Tab Order**            | A draggable list to define the order of tabs.                                   | `scratch,notes,tasks,assets`            |
| **Tab Visibility**       | Individual toggles to show or hide each tab.                                    | All `true`                              |
| **Desktop tab display**  | Choose between `Icon Only`, `Text Only`, or `Icon and Text`.                    | `iconOnly`                              |
| **Mobile tab display**   | Choose between `Icon Only`, `Text Only`, or `Icon and Text`.                    | `iconOnly`                              |
| **Tab Icons**            | Customize the icon for each tab (e.g., Scratch, Notes, Tasks, Pinned, Assets).  | *Varies*                                |

### ScratchPad Tab

| Setting                  | Description                                                                     | Default Value                           |
| :----------------------- | :------------------------------------------------------------------------------ | :-------------------------------------- |
| **ScratchPad note path** | The full vault path to the note file used by the scratchpad.                    | `ScratchPad.md`                         |
| **Click tab action**     | Choose `new-tab` or `current-tab` when clicking the active tab.                 | `new-tab`                               |
| **Show preview button**  | Shows button to toggle between plain text and Markdown preview.                 | `false`                                 |
| **Show '+ Task' button** | Shows button to quickly add a new task.                                         | `true`                                  |
| **Task Creation Format** | Template for '+ Task' button with placeholders like `{today}` and `|`.           | `- [ ] #Tag | 📅 {friday}`              |
| **ScratchPad font size** | Customize the font size used in the scratchpad editor.                          | `14px`                                  |
| **ScratchPad font family** | Customize the font family (leave blank for default).                            | `""`                                    |
| **Bold ScratchPad text** | Toggles bold font weight for scratchpad text.                                   | `false`                                 |
| **Search highlight color**| Background color for highlighted search terms.                                | `rgba(255, 165, 0, 0.4)`                |

### Notes Tab

| Setting                      | Description                                                              | Default Value                           |
| :--------------------------- | :----------------------------------------------------------------------- | :-------------------------------------- |
| **Notes tab open behavior**  | Open notes in a `new-tab` or `current-tab`.                              | `new-tab`                               |
| **Show note status dots**    | Shows a colored dot next to each note in the list.                       | `true`                                  |
| **Show note tooltips**       | Show a detailed tooltip on hover with file metadata.                     | `true`                                  |
| **Notes list font size**     | Font size for note titles in the list.                                   | `14px`                                  |
| **Bold note titles**         | Toggles bold font weight for note titles in the list.                    | `false`                                 |
| **Created Note Dot Color**   | Color for the dot on recently created notes.                             | `rgba(76, 175, 80, 1)`                  |
| **Modified Note Dot Color**  | Color for the dot on recently modified notes.                            | `rgba(255, 152, 0, 1)`                  |
| **Note/Task Hover Color**    | Background color when hovering over items in lists.                      | `rgba(171, 171, 171, 0.15)`             |
| **Notes lookback days**      | How many days back to look for recent notes.                             | `7`                                     |
| **Ignore folders**           | Folder paths to exclude from the "Recent Notes" list.                    | `[]`                                    |

### Pinned Notes Tab

| Setting                         | Description                                                                 | Default Value |
| :------------------------------ | :-------------------------------------------------------------------------- | :------------ |
| **Pinned notes tag**            | The tag (without '#') used to identify notes for the "Pinned" view.         | `pin`         |
| **Default sort order**          | Default sort order for pinned notes: `a-z` or `custom`.                     | `a-z`         |
| **Set Custom Order**            | A draggable list to set the manual order of pinned notes.                   | *N/A*         |

### Assets Tab

| Setting                           | Description                                                              | Default Value        |
| :-------------------------------- | :----------------------------------------------------------------------- | :------------------- |
| **Asset open behavior**           | Open assets in a `new-tab` or `current-tab`.                             | `new-tab`            |
| **Assets lookback days**          | How many days back to look for recent assets.                            | `7`                  |
| **Default assets view**           | Choose between `list` or `grid` view.                                    | `grid`               |
| **Hidden asset file types**       | Comma-separated list of file extensions to hide (e.g., `base,canvas`).   | `base,canvas`        |
| **Show indicator for unused assets** | Shows an icon next to assets not linked from any note.                  | `true`               |

### Tasks Tab

| Setting                           | Description                                                                     | Default Value                                   |
| :-------------------------------- | :------------------------------------------------------------------------------ | :---------------------------------------------- |
| **Task heading font size**        | Font size for group headings (e.g., 'Today', 'Overdue').                        | `13px`                                          |
| **Task text font size**           | Font size for individual task items.                                            | `14px`                                          |
| **Truncate long task text**       | If enabled, long task text is shortened with `...`.                             | `false`                                         |
| **Show completed tasks for Today**| If enabled, completed tasks due today will still appear.                        | `true`                                          |
| **Task sort order**               | Default sorting for tasks within each group (`dueDate`, `a-z`, `z-a`).          | `dueDate`                                       |
| **Group tasks by**                | The default grouping method (`date` or `tag`).                                  | `date`                                          |
| **Date Groups to Show**           | Toggles to show/hide specific date groups.                                      | All enabled                                     |
| **Task Group Icons**              | Customize the icon for each task group header.                                  | *Varies*                                        |
| **Task Group Backgrounds**        | Individual RGBA color pickers for each task group.                              | *Varies*                                        |
| **Exclude folders from Task search** | Folder paths to exclude from the task search.                               | `[]`                                            |

### Import & Export

| Setting                 | Description                                                 |
| :---------------------- | :---------------------------------------------------------- |
| **Export All Settings** | Save your complete plugin configuration to a JSON file.     |
| **Export Theme Only**   | Save only colors, fonts, and sizes to a theme file.         |
| **Import from File**    | Load settings from a JSON file (with confirmation).         |

---

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [GitHub issues page](https://github.com/fikte/calendar-period-week-notes/issues).

[Buy me a coffee](https://buymeacoffee.com/fikte)

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.








