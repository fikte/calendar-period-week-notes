# Version Change History 

v1.7.0
Major new feature: Task Style Layouts  
- Choose one of 19 different task layout styles or create your own with a new drag drop user interface in the Task tab settings. Style and create your own task layout that applies across all task views, Task tab and popup windows
- Added the ability to change the date format of the dates shown in the task layout, e.g. YYYY-MM-DD,  DD-MM-YYYY etc

Note highlight colours: 
- Added the ability to add a highlight colour to a note which is displayed as a bar to the left side of the note row. To add a colour from the notes / pinned notes tab right click a note and choose the colour to apply. The highlight will show in popup windows and in the notes / pinned notes tab area. To remove, right click the note row again to click on the colour again. 
- In the note / pinned note tab, there's the ability to filter notes by highlight colour. Just click into the text box and a list of highlight colours which match notes will be displayed. Alternatively, type c:red for example to filter in the filter text box  

New Core Widget - Goal momentum
- A new core widget to show your goal progression over time. You can scroll the entire history for your progression or click the month title when it's showing the latest day on the chart to then automatically scroll the chart from the beginning to the current week. Enable this new widget and choose where to place it in the Dashboard tab settings screen. Note: it's recommended to click the "Rebuild full history" button in the Goals tab to ensure all days are calculated correctly - this to fix a previous bug where the dates were being over calculated.  

Other: 
- Added ability to add schedule vacation dates to pause goals

Minor fixes: 
- On an operating system date change when the app is open, it now automatically updates the dashboard view if visible
- For the file creation heat map, now only shows the file notes, previously also included completed tasks for that day 
- CSS fix to showing line chart legends being displayed over the widget bounding box
- CSS improvements to the dashboard widget chevon and name positions  
- Fix to the weekly momentum chart which in some scenarios would not show when the widget was in a collapsed state to a then being visible  


v1.6.0
- New set alert date and time on tasks which will then show an alert icon in the header of this plugin - it will be displayed after the Month Year title. Click to pause the shaking icon. Hover over the icon to see which tasks are currently alerting. 
- Popup windows and Task tab now shows an icon on the right of the task description to indicate if a task has an time alert set.
- Changed the emoji's for displaying task priorities to use the Lucide icons. 
- See my Templater JavaScript template code which makes it super quick to create or edit a task with Tags, Alert date and Time, Created Date and Due Date. Configurable to work with Tasks emojis or the Dataview date formats 

v1.5.0
- Major new feature: Set your own goals for Tasks, Note creation, (e.g. Daily Note / Journal) and Words written. Track the goals daily with 15 achievement levels including seeing how you've progressed over the last 7 days. Pause goals when you're on vacation. For this new feature and for all task features, Calendar Period Week Notes plugin requires the Tasks plugin to be installed with every task having a creation, due and completion date. 

v1.4.0
- Major new feature: Custom task chart widgets. Create your own custom task widget charts to be displayed on the task dashboard: radar, line, bar, pie and kpi stats.
- This version requires the Tasks plugin to be enabled in your Obsidian client to make use of the tasks tab and task dashboard views. For the best experience also each task to have a created date, due date and completed date for every task.

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
