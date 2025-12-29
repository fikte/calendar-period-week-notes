/**
 * =============================================================================
 * TASK LAYOUT CONFIGURATION GUIDE
 * =============================================================================
 * 
 * This file defines how tasks are visually arranged using CSS Grid.
 * Think of each layout as a "recipe" that tells the system:
 *   1. Where to place components (checkbox, title, tags, etc.)
 *   2. How they align (top, center, bottom)
 *   3. Whether to strip metadata from the title text
 * 
 * =============================================================================
 * STEP 1: UNDERSTAND THE GRID TEMPLATE
 * =============================================================================
 * 
 * The `gridTemplate` is like a visual blueprint of your layout.
 * Each word represents a named area that components can be placed into.
 * 
 * EXAMPLE 1: Single Row
 * gridTemplate: '"checkbox priority title meta"'
 * 
 *   This creates ONE row with 4 columns:
 *   +----------+----------+-----------------+------+
 *   | checkbox | priority |      title      | meta |
 *   +----------+----------+-----------------+------+
 * 
 * EXAMPLE 2: Two Rows
 * gridTemplate: `
 *   "checkbox priority title  meta"
 *   "checkbox .        tags   tags"
 * `
 * 
 *   This creates TWO rows:
 *   +----------+----------+-----------------+------+
 *   | checkbox | priority |      title      | meta |  <- Row 1
 *   | checkbox | (empty)  |   tags (spans)        |  <- Row 2
 *   +----------+----------+-----------------+------+
 * 
 *   Notice:
 *   - "checkbox" appears in BOTH rows = it spans vertically
 *   - "tags" appears TWICE in Row 2 = it spans horizontally
 *   - "." = empty cell (forces alignment)
 * 
 * =============================================================================
 * STEP 2: DEFINE COLUMN WIDTHS
 * =============================================================================
 * 
 * The `gridColumns` property controls how wide each column is.
 * 
 * SYNTAX: 'width1 width2 width3'
 * 
 * Common Values:
 * - 'auto'   = Just wide enough to fit content (e.g., checkbox)
 * - '1fr'    = Takes up remaining space flexibly (e.g., title text)
 * - '24px'   = Fixed width (e.g., icon)
 * - 'minmax(50px, 1fr)' = Minimum 50px, but can grow
 * 
 * EXAMPLE:
 * gridColumns: 'auto 24px 1fr auto'
 *   -> Column 1 (checkbox): Just big enough for checkbox
 *   -> Column 2 (priority): Fixed 24px for icon (or invisible spacer)
 *   -> Column 3 (title): Expands to fill available space
 *   -> Column 4 (meta): Just big enough for metadata icons
 * 
 * =============================================================================
 * STEP 3: SET GAP (SPACING)
 * =============================================================================
 * 
 * The `gap` property controls spacing between grid cells.
 * 
 * SYNTAX:
 * - '8px'        = Same gap horizontally and vertically
 * - '4px 12px'   = 4px vertical gap, 12px horizontal gap
 * 
 * =============================================================================
 * STEP 4: CONFIGURE GLOBAL OPTIONS
 * =============================================================================
 * 
 * options: {
 *   stripTags: boolean,   // Remove #tags from title text?
 *   stripAlerts: boolean  // Remove ⏰ 00:00 from title text?
 * }
 * 
 * WHY USE THIS?
 * If you display tags as separate pills in your layout, you probably want to
 * strip them from the title text to avoid duplication.
 * 
 * If you DON'T show tags anywhere in the layout, set `stripTags: false` so
 * they remain visible in the title.
 * 
 * =============================================================================
 * STEP 5: DEFINE AREAS (items array)
 * =============================================================================
 * 
 * Each object in the `items` array places components into a grid area.
 * 
 * PROPERTIES:
 * 
 * area: 'name'
 *   -> Must match a name from your `gridTemplate`
 * 
 * align: 'start' | 'center' | 'end'
 *   -> Vertical alignment within the grid cell
 *   -> 'start' = Top, 'center' = Middle, 'end' = Bottom
 * 
 * justify: 'start' | 'center' | 'end'
 *   -> Horizontal alignment within the grid cell
 *   -> 'start' = Left, 'center' = Middle, 'end' = Right
 * 
 * flow: 'row' | 'column'
 *   -> Direction items flow inside this area
 *   -> 'row' = Left to right (default)
 *   -> 'column' = Top to bottom (stacked)
 * 
 * textStyle: 'normal' | 'muted' | 'accent' | 'error'
 *   -> Color style applied to ALL items in this area (cascades down)
 * 
 * fontSize: 'small' | 'medium' | 'normal' | 'large'
 *   -> Font size applied to ALL items in this area (cascades down)
 * 
 * color: '#ff0000' | 'var(--text-accent)'
 *   -> Direct color override (CSS color value)
 * 
 * backgroundColor: 'rgba(255, 0, 0, 0.1)', 
 * Note for the backgroundColor, this applis to the tags property only. It overides the background color of the pill
 * 
 * items: [ ... ]
 *   -> List of components to render in this area (see STEP 6)
 * 
 * =============================================================================
 * STEP 6: AVAILABLE COMPONENTS
 * =============================================================================
 * 
 * Use these inside the `items: [ ... ]` array:
 * 
 * STRING COMPONENTS (Simple):
 * - 'checkbox'   -> The task completion checkbox
 * - 'priority'   -> Priority icon (⏫ 🔼 🔽 ⏬) or invisible spacer if none
 * - 'tags'       -> Tag pills (#tag1 #tag2)
 * - 'alert'      -> Alarm clock icon + time (⏰ 09:00)
 * - 'due_date'   -> Calendar icon + date (📅 03/12)
 * 
 * OBJECT COMPONENTS (Advanced):
 * - { type: 'title', textStyle: 'normal', fontSize: 'medium' }
 *     -> The main task description
 *     -> Supports textStyle, fontSize, color overrides
 * 
 * - { type: 'alert', textStyle: 'muted', fontSize: 'small' }
 *     -> Alert with custom styling
 * 
 * =============================================================================
 * QUICK REFERENCE: COMMON PATTERNS
 * =============================================================================
 * 
 * PATTERN 1: Simple Single Row (Priority + Title)
 * gridTemplate: '"checkbox priority title meta"'
 * gridColumns: 'auto 24px 1fr auto'
 * 
 * PATTERN 2: Title on Top, Tags Below (Aligned)
 * gridTemplate: `
 *   "checkbox priority title  meta"
 *   "checkbox .        tags   tags"
 * `
 * gridColumns: 'auto 24px 1fr auto'
 * 
 * PATTERN 3: Dashboard View (Strict Columns)
 * gridTemplate: '"checkbox date priority title tags"'
 * gridColumns: 'auto 80px 24px 1fr auto'
 * 
 * =============================================================================
 */

export const TASK_LAYOUTS = {
    // -------------------------------------------------------------------------
    // 1. CLASSIC (Single Row)
    // -------------------------------------------------------------------------

    'default': {
        id: 'default',
        name: 'Style 1 (due, alert then tags)',
        description: 'Standard layout. Metadata aligned to the right.',
        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0px', // NO GAP HERE. We control spacing manually.

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"`,
                        gridColumns: 'auto 1fr',
                        gap: '4px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                flexWrap: 'wrap',
                                fontSize: "small",
                                textStyle: "muted",
                                opacity: '0.7',
                                items: [
                                    { type: 'due_date' },
                                    { type: 'alert' },
                                    { type: 'tags' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    'default-v1': {
        id: 'default-v1',
        name: 'Style 2 (due / alert left, tags right)',
        description: 'Standard layout. Tags moved to far right.',

        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                items: [
                    {
                        type: 'subgrid',
                        // CHANGE 1: Defined 3 columns for the bottom row
                        // Col 1: Priority width (auto)
                        // Col 2: Meta/Dates (auto - takes only what it needs)
                        // Col 3: Tags (1fr - takes remaining space)
                        gridTemplate: `"priority title title"
                                       ". meta tags"`,

                        gridColumns: 'auto auto 1fr',
                        gap: '4px',

                        items: [
                            // Top Row
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },

                            // Bottom Row - Left Side (Dates & Alerts)
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                fontSize: 'small',
                                textStyle: 'muted',
                                opacity: '0.7',
                                items: [
                                    { type: 'due_date' },
                                    { type: 'alert', color: 'var(--text-accent)' },
                                ]
                            },

                            // Bottom Row - Right Side (Tags)
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'end', // Pushes content to the right
                                fontSize: 'small',
                                textStyle: 'muted',
                                opacity: '0.7',
                                items: [
                                    { type: 'tags' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },


    'default-v2': {
        id: 'default-v2',
        name: 'Style 3 (alert left, tags right)',
        description: 'Standard layout. Tags moved to far right.',

        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                items: [
                    {
                        type: 'subgrid',
                        // CHANGE 1: Defined 3 columns for the bottom row
                        // Col 1: Priority width (auto)
                        // Col 2: Meta/Dates (auto - takes only what it needs)
                        // Col 3: Tags (1fr - takes remaining space)
                        gridTemplate: `"priority title title"
                                       ". meta tags"`,

                        gridColumns: 'auto auto 1fr',
                        gap: '4px',

                        items: [
                            // Top Row
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },

                            // Bottom Row - Left Side (Dates & Alerts)
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                fontSize: 'small',
                                textStyle: 'muted',
                                opacity: '0.7',
                                items: [
                                    { type: 'alert', color: 'var(--text-accent)', },
                                ]
                            },

                            // Bottom Row - Right Side (Tags)
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'end', // Pushes content to the right
                                fontSize: 'small',
                                textStyle: 'muted',
                                opacity: '0.7',
                                items: [
                                    { type: 'tags', align: 'end' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },


    'default-v3': {
        id: 'default-v3',
        name: 'Style  4 (tags left, alert / due right)',
        description: 'Standard layout. Tags moved to far right.',

        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                items: [
                    {
                        type: 'subgrid',
                        // CHANGE 1: Defined 3 columns for the bottom row
                        // Col 1: Priority width (auto)
                        // Col 2: Meta/Dates (auto - takes only what it needs)
                        // Col 3: Tags (1fr - takes remaining space)
                        gridTemplate: `"priority title title"
                                       ". tags meta"`,

                        gridColumns: 'auto auto 1fr',
                        gap: '4px',

                        items: [
                            // Top Row
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },

                            // Bottom Row - Right Side (Tags)
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'start', // Pushes content to the right
                                opacity: '0.7',
                                fontSize: 'small',
                                items: [
                                    { type: 'tags', align: 'end' }
                                ]
                            },
                            // Bottom Row - Left Side (Dates & Alerts)
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'end',
                                opacity: '0.7',
                                fontSize: 'small',
                                items: [
                                    { type: 'alert', color: 'var(--text-accent)' },
                                    { type: 'due_date' },
                                ]
                            }

                        ]
                    }
                ]
            }
        ]
    },


    'default-v4': {
        id: 'default-v4',
        name: 'Style 5 (due left, tags right)',
        description: 'Title slides left if no priority. Tags are justified to the far right.',

        // Main Grid Structure
        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '4px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            // 1. Checkbox
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },

            // 2. Main Content Area
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // ROW 1: Priority + Title (Flex Container)
                    // This correctly handles the title shifting left when no icon is present.
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start',
                        justify: 'start',
                        gap: '0',
                        items: [
                            { type: 'priority' },
                            {
                                type: 'title',
                                textStyle: 'normal',
                                align: 'start',
                                justify: 'start'
                            }
                        ]
                    },

                    // ROW 2: Meta (Left) + Tags (Right) - Using SUBGRID for full width
                    {
                        type: 'subgrid',
                        gridTemplate: '"meta tags"', // Two columns
                        gridColumns: 'auto 1fr',     // Meta takes its needed width, Tags takes ALL remaining space
                        gap: '8px',
                        items: [
                            // LEFT SIDE: Meta group
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start', // Aligns content to the start of the 'meta' grid area
                                items: [
                                    { type: 'alert', color: 'var(--text-accent)', fontSize: 'small' },
                                ]
                            },

                            // RIGHT SIDE: Tags group
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'end', // CRITICAL: Justifies the #Tim tag to the END of the 'tags' grid area
                                items: [
                                    { type: 'tags', fontSize: 'small', textStyle: 'muted' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },



    'default-v5': {
        id: 'default-v5',
        name: 'Style 6 (tags left, due right)',
        description: 'Title slides left if no priority. Tags are justified to the far right.',

        // Main Grid Structure
        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '4px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            // 1. Checkbox
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },

            // 2. Main Content Area
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // ROW 1: Priority + Title (Flex Container)
                    // This correctly handles the title shifting left when no icon is present.
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start',
                        justify: 'start',
                        gap: '0',
                        items: [
                            { type: 'priority' },
                            {
                                type: 'title',
                                textStyle: 'normal',
                                align: 'start',
                                justify: 'start'
                            }
                        ]
                    },

                    // ROW 2: Meta (Left) + Tags (Right) - Using SUBGRID for full width
                    {
                        type: 'subgrid',
                        gridTemplate: '"tags meta"', // Two columns
                        gridColumns: 'auto 1fr',     // Meta takes its needed width, Tags takes ALL remaining space
                        gap: '8px',
                        items: [
                            // LEFT SIDE: Tags group
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'right',
                                items: [
                                    { type: 'tags', fontSize: 'small', textStyle: 'muted' }
                                ]
                            },

                            // RIGHT SIDE: Meta group
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'end',
                                items: [
                                    { type: 'alert', color: 'var(--text-accent)', fontSize: 'small' },
                                ]
                            }


                        ]
                    }
                ]
            }
        ]
    },


    'default-v6': {
        id: 'default-v6',
        name: 'Style 7 (dates left, tags right)',
        description: 'Title slides left if no priority. Tags are justified to the far right.',

        // Main Grid Structure
        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '4px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            // 1. Checkbox
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },

            // 2. Main Content Area
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // ROW 1: Priority + Title (Flex Container)
                    // This correctly handles the title shifting left when no icon is present.
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start',
                        justify: 'start',
                        gap: '0',
                        items: [
                            { type: 'priority' },
                            {
                                type: 'title',
                                textStyle: 'normal',
                                align: 'start',
                                justify: 'start'
                            }
                        ]
                    },

                    // ROW 2: Meta (Left) + Tags (Right) - Using SUBGRID for full width
                    {
                        type: 'subgrid',
                        gridTemplate: '"meta tags"', // Two columns
                        gridColumns: 'auto 1fr',     // Meta takes its needed width, Tags takes ALL remaining space
                        gap: '8px',
                        items: [
                            // LEFT SIDE: Meta group
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start', // Aligns content to the start of the 'meta' grid area
                                items: [
                                    { type: 'due_date', textStyle: 'muted', fontSize: 'small' },
                                    { type: 'alert', color: 'var(--text-accent)', fontSize: 'small' },
                                ]
                            },

                            // RIGHT SIDE: Tags group
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'end', // CRITICAL: Justifies the #Tim tag to the END of the 'tags' grid area
                                items: [
                                    { type: 'tags', fontSize: 'small', textStyle: 'muted' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },


    'default-v7': {
        id: 'default-v7',
        name: 'Style 8 (tags left, dates right)',
        description: 'Title slides left if no priority. Tags are justified to the far right.',

        // Main Grid Structure
        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '4px',

        options: { stripTags: true, stripAlerts: true },

        items: [
            // 1. Checkbox
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },

            // 2. Main Content Area
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // ROW 1: Priority + Title (Flex Container)
                    // This correctly handles the title shifting left when no icon is present.
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start',
                        justify: 'start',
                        gap: '0',
                        items: [
                            { type: 'priority' },
                            {
                                type: 'title',
                                textStyle: 'normal',
                                align: 'start',
                                justify: 'start'
                            }
                        ]
                    },

                    // ROW 2: Meta (Left) + Tags (Right) - Using SUBGRID for full width
                    {
                        type: 'subgrid',
                        gridTemplate: '"tags meta"', // Two columns
                        gridColumns: 'auto 1fr',     // Meta takes its needed width, Tags takes ALL remaining space
                        gap: '8px',
                        items: [
                            // LEFT SIDE: Tags group
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'right',
                                items: [
                                    { type: 'tags', fontSize: 'small', textStyle: 'muted' }
                                ]
                            },

                            // RIGHT SIDE: Meta group
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'end',
                                items: [
                                    { type: 'due_date', textStyle: 'muted', fontSize: 'small' },
                                    { type: 'alert', color: 'var(--text-accent)', fontSize: 'small' },
                                ]
                            }


                        ]
                    }
                ]
            }
        ]
    },


    'multi-v1': {
        id: 'multi-v1',
        name: 'Style 9 (multi line, muted)',
        description: 'Tight top section. Larger gap before tags.',

        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0',

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // 1. TOP BLOCK (Priority + Title)
                    {
                        type: 'subgrid',
                        gridTemplate: '"priority title"',
                        // "min-content" ensures the column is exactly the width of the icon
                        gridColumns: 'min-content 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                        ]
                    },

                    // 2. META BLOCK (Alerts)
                    {
                        type: 'subgrid',
                        // Use 2 columns. The first (.) is empty space to match the priority icon above.
                        gridTemplate: '". meta"',
                        gridColumns: 'min-content 1fr', // MUST match the top block columns exactly
                        gap: '2px', // Match the gap of the top block
                        items: [
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'due_date', align: 'start', fontSize: 'small' },
                                    { type: 'alert', align: 'start', color: 'var(--text-accent)', fontSize: 'small' }

                                ]
                            }
                        ]
                    },

                    // 3. TAGS BLOCK
                    {
                        type: 'subgrid',
                        gridTemplate: '". tags"',
                        gridColumns: 'min-content 1fr', // MUST match the top block columns exactly
                        gap: '2px', // Match the gap of the top block
                        items: [
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'tags', align: 'start', fontSize: 'small', textStyle: 'muted' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    'multi-v2': {
        id: 'multi-v2',
        name: 'Style 10 (multi line, accent)',
        description: 'Tight top section. Larger gap before tags.',

        gridTemplate: '"checkbox content meta"',
        gridColumns: '15px 1fr auto',
        gap: '0',

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '0',
                items: [
                    // 1. TOP BLOCK (Priority + Title)
                    {
                        type: 'subgrid',
                        gridTemplate: '"priority title"',
                        // "min-content" ensures the column is exactly the width of the icon
                        gridColumns: 'min-content 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                        ]
                    },

                    // 2. META BLOCK (Alerts)
                    {
                        type: 'subgrid',
                        // Use 2 columns. The first (.) is empty space to match the priority icon above.
                        gridTemplate: '". meta"',
                        gridColumns: 'min-content 1fr', // MUST match the top block columns exactly
                        gap: '2px', // Match the gap of the top block
                        items: [
                            {
                                area: 'meta',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'due_date', align: 'start', fontSize: 'small' },
                                    { type: 'alert', align: 'start', color: 'var(--text-accent)', fontSize: 'small' }

                                ]
                            }
                        ]
                    },

                    // 3. TAGS BLOCK
                    {
                        type: 'subgrid',
                        gridTemplate: '". tags"',
                        gridColumns: 'min-content 1fr', // MUST match the top block columns exactly
                        gap: '2px', // Match the gap of the top block
                        items: [
                            {
                                area: 'tags',
                                flow: 'row',
                                align: 'center',
                                justify: 'start',
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'tags', align: 'start', color: 'black', fontSize: 'small', textStyle: 'muted', backgroundColor: 'var(--text-accent)' }   // Force left

                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },




    'tags-new-line': {
        id: 'tags-new-line',
        name: 'Style 11 (tags bottom left aligned)',
        description: 'Title top. Meta middle. Tags bottom. EVERYTHING LEFT ALIGNED.',

        gridTemplate: '"checkbox content"',
        gridColumns: 'auto 1fr',
        gap: '2px',
        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start', // Parent column aligns children to start (left)
                flow: 'column',

                items: [
                    // ROW 1: Title & Priority
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start', // Keep vertical center for icon+text
                        justify: 'start', // Explicitly justify start
                        gap: '4px',
                        items: [
                            { type: 'priority' },
                            { type: 'title', textStyle: 'normal', align: 'start' }
                        ]
                    },

                    // ROW 2: Alerts & Dates
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start',
                        justify: 'start', // Explicitly justify start
                        gap: '4px',
                        items: [
                            { type: 'alert', color: 'var(--text-accent)', fontSize: 'small' },
                            { type: 'due_date', color: 'var(--text-muted)', fontSize: 'small' }
                        ]
                    },

                    // ROW 3: Tags
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'start', // Vertical center
                        justify: 'start', // Horizontal start (Left)
                        gap: '4px',
                        items: [
                            { type: 'tags', fontSize: 'small', textStyle: 'muted', align: 'start' }
                        ]
                    }
                ]
            }
        ]
    },





    'dynamic-v1': {
        id: 'dynamic-v1',
        name: 'Style 12 (due, alert accent, tags)',
        description: 'Pixel-perfect alignment for title and tags. Tags positioned on the last row. Alerts on the right. ',

        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '0', // NO GAP HERE. We control spacing manually.

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"`,
                        gridColumns: 'auto 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                            {
                                area: 'meta',
                                flow: 'row',         // Ensure horizontal flow
                                align: 'center',     // Align items vertically
                                justify: 'start',    // Align to left (next to dot)
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'due_date', align: 'start', textStyle: 'muted', fontSize: 'small' },
                                    { type: 'alert', align: 'start', color: 'var(--text-accent)', fontSize: 'small' },
                                    { type: 'tags', align: 'start', fontSize: 'small', textStyle: 'muted' }   // Force left
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },


    'dynamic-v3': {
        id: 'dynamic-v3',
        name: 'Style 13 (tasks & tags accent)',
        description: 'Pixel-perfect alignment for title and tags. Tags positioned on the last row. Alerts on the right. ',

        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '0', // NO GAP HERE. We control spacing manually.

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"`,
                        gridColumns: 'auto 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                            {
                                area: 'meta',
                                flow: 'row',         // Ensure horizontal flow
                                align: 'center',     // Align items vertically
                                justify: 'start',    // Align to left (next to dot)
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'alert', align: 'start', color: 'var(--text-accent)', fontSize: 'small' }, // Force left
                                    { type: 'tags', align: 'start', color: 'black', fontSize: 'small', textStyle: 'muted', backgroundColor: 'var(--text-accent)' }   // Force left
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    'dynamic-v4': {
        id: 'dynamic-v4',
        name: 'Style 14 (tasks & tags muted)',
        description: 'Pixel-perfect alignment for title and tags. Tags positioned on the last row. Alerts on the right. ',

        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '0', // NO GAP HERE. We control spacing manually.

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"`,
                        gridColumns: 'auto 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                            {
                                area: 'meta',
                                flow: 'row',         // Ensure horizontal flow
                                align: 'start',     // Align items vertically
                                justify: 'start',    // Align to left (next to dot)
                                flexWrap: 'wrap',
                                fontSize: 'small',
                                items: [
                                    { type: 'alert', color: 'var(--text-accent)' },
                                    { type: 'tags', textStyle: 'muted', }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    'dynamic-v5': {
        id: 'dynamic-v5',
        name: 'Style 15 (tasks & tags muted)',
        description: 'Pixel-perfect alignment for title and tags. Tags positioned on the last row. Alerts on the right. ',

        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '0', // NO GAP HERE. We control spacing manually.

        options: { stripTags: true, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"
                                       ". tags"`,
                        gridColumns: 'auto 1fr',
                        gap: '2px',
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },
                            {
                                area: 'meta',
                                flow: 'row',         // Ensure horizontal flow
                                align: 'center',     // Align items vertically
                                justify: 'start',    // Align to left (next to dot)
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'alert', align: 'start', color: 'var(--text-accent)', fontSize: 'small' },
                                    { type: 'due_date', align: 'start', fontSize: 'small' }
                                ]
                            },
                            {
                                styles: { marginTop: '8px' },
                                area: 'tags',
                                flow: 'row',         // Ensure horizontal flow
                                align: 'center',     // Align items vertically
                                justify: 'start',    // Align to left (next to dot)
                                flexWrap: 'wrap',
                                items: [
                                    { type: 'tags', align: 'start', fontSize: 'small', textStyle: 'muted' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },


    'tags-first-inline': {
        id: 'tags-first-inline',
        name: 'Style 16 (tags first (inline))',
        description: 'Tags appear before the title. Metadata floats right.',

        // Main Grid: Checkbox | Content
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '2px',

        options: {
            stripTags: false,
            stripAlerts: true
        },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                flow: 'column',
                gap: '4px',
                items: [
                    // SINGLE COMPOSITE ROW
                    // Contains: Priority -> Tags -> Title -> (Gap) -> Metadata
                    {
                        type: 'container',
                        flow: 'row',
                        align: 'baseline', // Align text baselines
                        justify: 'start',
                        flexWrap: 'wrap',  // Allow wrapping
                        gap: '6px',        // Gap between tags/title/meta
                        items: [
                            // 1. Priority (Optional, if present)
                            { type: 'priority' },

                            // 3. Title
                            { type: 'title', textStyle: 'normal' },
                        ]
                    }
                ]
            },

            {
                area: 'meta',
                align: 'start',
                justify: 'end',
                items: [{ type: 'alert', color: 'var(--text-accent)', fontSize: 'small' }],



            }
        ]
    },


    // -------------------------------------------------------------------------
    // 3. COMPACT MULTILINE
    // -------------------------------------------------------------------------
    'compact': {
        id: 'compact',
        name: 'Style 17 (compact multiline)',
        description: 'Good for narrow screens. Title on top, metadata below.',
        gridTemplate: `
            "checkbox priority title"
            "checkbox .        meta"
        `,
        gridColumns: 'auto auto 1fr',
        gap: '2px',

        options: {
            stripTags: true,
            stripAlerts: true
        },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox'],
                style: 'margin-right: 4px; margin-top: 2px;',
            },
            {
                area: 'priority',
                align: 'start',
                items: ['priority'],
                style: 'margin-right: 4px; margin-top: 2px;',
            },
            {
                area: 'title',
                align: 'start',
                items: [
                    { type: 'title', textStyle: 'normal' }
                ]
            },
            {
                area: 'meta',
                align: 'start',
                textStyle: 'muted',
                fontSize: 'small',
                items: ['due_date', 'alert', 'tags']
            }
        ]
    },


    // -------------------------------------------------------------------------
    // 5. MINIMAL (No Metadata - Tags Remain in Text)
    // -------------------------------------------------------------------------
    'minimal': {
        id: 'minimal',
        name: 'Style 18 (minimal change)',
        description: 'Only checkbox and title. Tags remain in text.',
        gridTemplate: '"checkbox priority title"',
        gridColumns: 'auto auto 1fr',
        gap: '12px',

        options: {
            stripTags: false,
            stripAlerts: true
        },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                // ADDED: Push the checkbox down by ~4-6px to align with the taller text line
                style: 'margin-right: 8px; margin-top: 4px;',
                items: ['checkbox'],
            },
            {
                area: 'priority',
                align: 'start',
                // ADDED: Push priority icon down too so it matches the checkbox
                style: 'margin-top: 4px;',
                items: ['priority']
            },
            {
                area: 'title',
                align: 'start',
                style: 'line-height: 1.6em;', 
                items: [
                    { type: 'title', textStyle: 'muted' }
                ]
            }
        ]

    },



    'minimal-v2': {
        id: 'minimal-v2',
        name: 'Style 19 (minimal change v2)',
        description: 'Only checkbox and title. Tags/alerts remain in text. ',

        // Main Grid: Checkbox | Content Area | Meta
        gridTemplate: '"checkbox content meta"',
        gridColumns: 'auto 1fr auto',
        gap: '0', // NO GAP HERE. We control spacing manually.

        options: { stripTags: false, stripAlerts: true },

        items: [
            {
                area: 'checkbox',
                align: 'start',
                items: ['checkbox']
            },
            {
                area: 'content',
                align: 'start',
                // This area has its own internal grid
                style: 'line-height: 1.6em;', 

                items: [
                    {
                        type: 'subgrid',
                        gridTemplate: `"priority title"
                                       ". meta"`,
                        gridColumns: 'auto 1fr',
                        gap: '2px',
                        
                        items: [
                            { area: 'priority', items: ['priority'] },
                            { area: 'title', items: [{ type: 'title', textStyle: 'normal' }] },

                        ]
                    }
                ]
            }
        ]
    },
};
