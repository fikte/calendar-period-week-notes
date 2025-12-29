// src/data/constants.js
export const VIEW_TYPE_PERIOD = "calendar-period-week";

export const DASHBOARDWIDGETS = {
    tasks: {
        weeklyGoalPoints: { name: 'Week goal momentum', size: 'medium' },
        goalStatusList: { name: 'Daily goals', size: 'medium' },
        goalStatusListCondensed: { name: 'Daily goals', size: 'small' },
        weeklyGoalPointsCondensed: { name: 'Week goal momentum', size: 'small' },
        swipeableMomentum: { name: 'Goal momentum', size: 'large' },
        today: { name: 'Today', size: 'small' },
        tomorrow: { name: 'Tomorrow', size: 'small' },
        next7days: { name: 'Next 7 days', size: 'small' },
        futureNoDue: { name: 'Future / No due', size: 'small' },
        upcomingoverdue: { name: 'Upcoming & overdue tasks', size: 'medium' },
        taskstatusoverview: { name: 'Task status overview', size: 'large' },
        taskcompletionheatmap: { name: 'Task completion activity', size: 'medium' },
    },
    creation: {
        allfilesheatmap: { name: 'All files' },
        dailynotesheatmap: { name: 'Daily notes' },
        regularnotesheatmap: { name: 'Regular notes' },
        assetsheatmap: { name: 'Assets' }
    }
};

export const PINNED_HIGHLIGHT_COLORS = 
    [
        { id: 'red',    label: 'Red',    rgba: 'rgba(255,0,0,0.35)' },
        { id: 'orange', label: 'Orange', rgba: 'rgba(255,165,0,0.35)' },
        { id: 'yellow', label: 'Yellow', rgba: 'rgba(255,235,59,0.35)' },
        { id: 'green',  label: 'Green',  rgba: 'rgba(76,175,80,0.35)' },
        { id: 'blue',   label: 'Blue',   rgba: 'rgba(33,150,243,0.35)' },
        { id: 'teal',   label: 'Teal',   rgba: 'rgba(0,150,136,0.35)' },
        { id: 'purple', label: 'Purple', rgba: 'rgba(156,39,176,0.35)' },
        { id: 'pink',   label: 'Pink',   rgba: 'rgba(233,30,99,0.35)' },
        { id: 'brown',  label: 'Brown',  rgba: 'rgba(121,85,72,0.35)' },
        { id: 'black',  label: 'Black',  rgba: 'rgba(0,0,0,0.35)' },
        { id: 'gray',   label: 'Gray',   rgba: 'rgba(158,158,158,0.35)' },
        { id: 'white',  label: 'White',  rgba: 'rgba(255,255,255,0.35)' },
    ];


// Define the default settings for the plugin. This object is used as a fallback and for resetting configurations.
export const DEFAULT_SETTINGS = {
    // General Display
    appliedTheme: "Default-developer", 
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
    tabOrder: ["dashboard", "tasks", "scratch", "notes", "assets"],
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
    defaultDashboardView: 'tasks',
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
    fixedNoteFile: "Scratchpad.md",
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

    pinnedNoteColorMode: 'row',    // 'row' | 'bar' | 'border' - update 23-12-2025 - just bar atm
    pinnedNoteColorsByPath: {},    // { [file.path]: colorId }
    
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
    taskBarChartDefaultMode: 'count',
    taskLayout: 'default', 
    taskLayoutId: 'default', // Current selection
    customTaskLayout: null,
    useSystemNotifications: false,

    // Task Dashboard Colors
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
    highlightCurrentWeek: false,

    // Colors
    selectedTabColor: "rgba(102, 102, 102, 1)",
    todayHighlightColorLight: "rgba(133, 186, 255, 1)",
    todayHighlightColorDark: "rgba(82, 157, 255, 1)",
    notesHoverColor: "rgba(171, 171, 171, 0.15)",
    dailyNoteDotColor: "rgba(74, 144, 226, 1)",
    noteCreatedColor: "rgba(76, 175, 80, 1)",
    noteModifiedColor: "rgba(255, 152, 0, 1)",
    rowHighlightColorLight: "rgba(163, 163, 163, 0.2)", // Lighter Grey
    rowHighlightColorDark: "rgba(51, 51, 51, 0.7)",     // Dark Grey
    dateCellHoverColorLight: "rgba(105, 105, 105, 0.75)",     // Light Grey
    dateCellHoverColorDark: "rgba(51, 51, 51, 1)",
    assetDotColor: "rgba(255, 0, 0, 1)",
    todayHighlightStyle: "cell", // 'cell' or 'circle'
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
    taskDateGroupsToShow: ["overdue", "today", "tomorrow", "next7days", "future", "noDate"],
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
        tag: "tag",
        completedcheck: "check-check"
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

    tasksDashboardOrder: ['goalStatusList', 'weeklyGoalPoints', 'swipeableMomentum', 'goalStatusListCondensed', 'weeklyGoalPointsCondensed', 'today', 'tomorrow', 'next7days', 'futureNoDue', 'upcomingoverdue', 'taskcompletionheatmap', 'taskstatusoverview'],
    tasksDashboardWidgets: {
        goalStatusList: false,
        weeklyGoalPoints: false,
        swipeableMomentum: false,
        goalStatusListCondensed: false,
        weeklyGoalPointsCondensed: false,
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
    goals: [
        {
            id: 'core-daily-note',
            name: 'Daily note created',
            type: 'note-created',
            target: 1,
            points: 30,
            core: true,
            enabled: true
        },
        {
            id: 'core-words-written',
            name: 'Words written',
            type: 'word-count',
            target: 200,
            points: 24,
            core: true,
            enabled: true
        },
        {
            id: 'core-tasks-completed',
            name: 'Tasks completed',
            type: 'task-count',
            target: 1,
            points: 30,
            core: true,
            enabled: true
        }
    ],
    goalScoreHistory: {},
    vacationRanges: [],
    vacationHistory: {},
    tasksStatsWidgets: [
        {
            widgetKey: 'weeklyGoalPoints',
            widgetName: 'Weekly goal momentum (Full)',
            type: 'goal-widget'
        },
        {
            widgetKey: 'goalStatusList',
            widgetName: 'Goal status',
            type: 'goal-widget'
        },
        {
            widgetKey: 'weeklyGoalPointsCondensed',
            widgetName: 'Weekly goal points (Condensed)',
            type: 'goal-widget'
        },
        {
            widgetKey: 'goalStatusListCondensed',
            widgetName: 'Goal status (Condensed)',
            type: 'goal-widget'
        },
        {
            widgetKey: 'swipeableMomentum',
            widgetName: 'All goal momentum (Full)',
            type: 'goal-widget'
        }

    ]
    
};
