# Release Notes

## Todoist Sync integration and task dashboard improvements

This release expands Calendar Period Week Notes with optional Todoist task support through the third-party Todoist Sync community plugin.

### New

- Added optional Todoist Sync task provider support.
- Added a task source setting with three modes:
  - Obsidian Tasks
  - Todoist Sync
  - Obsidian Tasks and Todoist Sync
- Added Todoist Sync setup guidance inside the plugin settings.
- Added Todoist task creation from the Tasks tab with a `+` button.
- Uses Todoist Sync's native add-task modal when Todoist Sync is installed and ready.
- Added support for completing Todoist tasks directly from the Calendar Period Week Notes task list.
- Added Todoist task descriptions as secondary text below the Todoist task title.
- Added Todoist task grouping into the existing date groups:
  - Overdue
  - Today
  - Tomorrow
  - Next 7 days
  - Future
  - Someday
- Added support for all active Todoist tasks when the Todoist filter setting is left blank.
- Added an in-place Todoist task refresh while the Tasks tab is open so external Todoist app changes can appear without clearing the whole list.

### Improved

- Task list refreshes now reconcile in place instead of blanking and rebuilding the full task list.
- Completing a Todoist task now removes only the affected task/group from the visible list.
- Todoist task additions from the native Todoist Sync modal refresh the task list after the modal closes.
- Obsidian Tasks due-date handling is more robust when due dates are exposed as `dueDate` instead of `due.moment`.
- Task sorting, task date grouping and calendar task indicators now use the same due-date fallback logic.
- Todoist task created dates now use Todoist's `addedAt` field when available.
- Todoist task source availability is checked before showing the Tasks tab add button.

### Requirements

Todoist support requires the third-party Todoist Sync community plugin:

- Repository: https://github.com/jamiebrynes7/obsidian-todoist-plugin
- Documentation: https://jamiebrynes7.github.io/obsidian-todoist-plugin/docs/overview

Todoist Sync is not bundled with Calendar Period Week Notes. Users must install, enable and configure Todoist Sync separately before selecting Todoist Sync as a task source.

### Notes

- Completed-history widgets still require Obsidian Tasks data.
- Leave the Todoist filter blank to show all active Todoist tasks.
- Add a Todoist filter only when you intentionally want to narrow the Todoist tasks shown in Calendar Period Week Notes.
