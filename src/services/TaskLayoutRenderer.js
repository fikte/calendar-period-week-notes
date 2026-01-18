import { setIcon, MarkdownRenderer, moment } from 'obsidian';
import { TASK_LAYOUTS } from '../data/taskLayouts';
import { TaskDataPreprocessor } from './TaskDataPreprocessor';

export class TaskLayoutRenderer {
    constructor(app, view, plugin) {
        this.app = app;
        this.view = view;
        this.plugin = plugin;
    }

    render(container, rawTask, layoutId = 'default', customConfig = null) {

        let layout;

        // 1. Check if we should use the custom layout
        if (layoutId === 'custom' && customConfig) {
            layout = customConfig;
        } else {
            // 2. Fallback to standard layouts
            layout = TASK_LAYOUTS[layoutId] || TASK_LAYOUTS['default'];
        }

        // Safety fallback if customConfig was missing or layoutId invalid
        if (!layout) layout = TASK_LAYOUTS['default'];


        const options = layout.options || { stripTags: true, stripAlerts: true };

        // Process data if it hasn't been processed yet (checks for 'cleanText')
        const data = rawTask.cleanText ? rawTask : TaskDataPreprocessor.process(rawTask, options);

        container.empty();
        container.addClass('cpwn-task-grid-container');
        container.addClass(`cpwn-layout-${layoutId}`);

        //container.style.padding = '8px 4px';
        container.style.setProperty('padding', '6px 12px', 'important');

        container.style.margin = '0';

        const grid = container.createDiv({ cls: 'cpwn-task-grid' });

        const pVal = parseInt(data.priority, 10);
        const hasPriority = [0, 1, 4, 5].includes(pVal);

        if (hasPriority) {
            grid.addClass('has-priority');
        } else {
            grid.addClass('no-priority');
        }

        grid.style.display = 'grid';
        grid.style.gridTemplateAreas = layout.gridTemplate;

        grid.style.gridTemplateColumns = layout.gridColumns.replace(/1fr/g, 'minmax(0, 1fr)');

        grid.style.gap = `var(--cpwn-checkbox-gap, ${layout.gap || '8px'})`;

        grid.style.alignItems = 'center';
        grid.style.width = '100%';

        if (layout.items) {
            // TaskLayoutRenderer.js - Main forEach loop
            layout.items.forEach(config => {
                const isFlow = !!config.isFlow;
                const area = grid.createDiv({
                    cls: `cpwn-area-${config.area} ${isFlow ? 'is-flow' : ''}`
                });

                area.style.gridArea = config.area;
                // CRITICAL: Must be display: flex for gap and flexWrap to work
                area.style.display = 'flex';
                area.style.minWidth = '0';
                area.style.width = '100%';

                if (isFlow) {
                    area.style.flexDirection = 'row';
                    area.style.flexWrap = 'wrap';
                    // Hands alignment control to the individual children (Title, Date, etc.)
                    area.style.alignItems = 'initial';
                    area.style.gap = '4px 8px';
                } else {
                    area.style.flexDirection = config.flow || 'row';
                    area.style.alignItems = config.align || 'center';
                    area.style.gap = '6px';
                }

                // Grid cell alignment (alignment of the area within the grid)
                if (config.align) area.style.alignSelf = config.align;
                if (config.justify) area.style.justifySelf = config.justify;

                this.applyStyles(area, config);

                if (config.items && Array.isArray(config.items)) {
                    this.renderItems(area, config.items, data, { ...config, ...options });
                }
            });
        }
    }

    renderItems(container, items, data, areaConfig = {}) {
        // 1. Pre-calculate which items are actually "Visible" based on task data
        const visibleItems = items.map(item => {
            const type = typeof item === 'string' ? item : item.type;
            const itemConfig = typeof item === 'object' ? item : {};

            let shouldRender = true;
            switch (type) {
                case 'priority': shouldRender = data.priority !== 2; break;
                case 'tags': shouldRender = data.tags && data.tags.length > 0; break;
                case 'due_date': shouldRender = !!(data.due?.moment || data.dueDate); break;
                case 'start_date': shouldRender = !!data.start?.moment?.isValid(); break;
                case 'scheduled_date': shouldRender = !!data.scheduled?.moment?.isValid(); break;
                case 'completion_date': shouldRender = !!data.doneDate?.moment?.isValid(); break;
                case 'alert': shouldRender = !!data.alert; break;
                case 'recurrence': shouldRender = !!data.recurrence; break;
                case 'id': shouldRender = !!data.id; break;
                case 'depends_on': shouldRender = data.dependsOn && data.dependsOn.length > 0; break;
            }

            return { item, type, itemConfig, shouldRender };
        }).filter(i => i.shouldRender);

        // 2. Iterate through only the visible items
        visibleItems.forEach((visibleEntry, index) => {
            const { item, type, itemConfig } = visibleEntry;

            const isFlow = !!areaConfig.isFlow;
            //const canBeInline = !['title', 'subgrid'].includes(type);

            const config = {
                textStyle: itemConfig.textStyle || areaConfig.textStyle,
                fontSize: itemConfig.fontSize || areaConfig.fontSize,
                color: itemConfig.color || areaConfig.color,
                ...itemConfig
            };

            //if (isFlow) {
            // DEFINITIVE FIX 4: Every single child item must be inline
            //    config.style = (config.style || '') + '; display: inline !important; width: auto !important;';
            //}

            if (isFlow) {
                if (type === 'title') {
                    config.style = (config.style || '') + '; display: inline !important;';
                } else {
                    // REMOVE 'vertical-align: baseline' from here! 
                    // Let applyStyles handle the alignment from the user's config.
                    config.style = (config.style || '') + '; display: inline-flex !important;';
                }
            }

            if (areaConfig.colorCheckboxByPriority) {
                config.colorCheckboxByPriority = true;
            }

            // --- SMART SEPARATOR HIDING ---
            if (type === 'separator') {
                if (itemConfig.forceDisplay) {
                    this.renderSeparator(container, config);
                    return;
                }

                const txt = (itemConfig.text || '').trim();
                const isBracket = ['(', '[', '{', '<', ')', ']', '}', '>'].includes(txt);

                // 1. Logic for Brackets (Brackets only care about one neighbor)
                if (isBracket) {
                    if (['(', '[', '{', '<'].includes(txt)) {
                        const next = visibleItems[index + 1];
                        // Content is valid if it's NOT a separator/spacer
                        const hasNextContent = next && !['separator', 'spacer'].includes(next.type);
                        if (!hasNextContent) return;
                    }
                    if ([')', ']', '}', '>'].includes(txt)) {
                        const prev = visibleItems[index - 1];
                        // Content is valid if it's NOT a separator/spacer
                        const hasPrevContent = prev && !['separator', 'spacer'].includes(prev.type);
                        if (!hasPrevContent) return;
                    }
                }
                // 2. Logic for General Separators (Preserved Exactly)
                else {
                    const prev = visibleItems[index - 1];
                    const next = visibleItems[index + 1];

                    // Hide if there's nothing valid before it OR nothing valid after it
                    const hasValidPrev = prev && !['separator', 'spacer'].includes(prev.type);
                    const hasValidNext = next && !['separator', 'spacer'].includes(next.type);

                    if (!hasValidPrev || !hasValidNext) return; // Skip rendering the dash
                }
            }



            switch (type) {
                case 'checkbox': this.renderCheckbox(container, data, config); break;
                case 'priority': this.renderPriority(container, data, config); break;
                case 'title': this.renderTitle(container, data, config); break;
                case 'tags': this.renderTags(container, data, config); break;
                case 'due_date': this.renderDueDate(container, data, config); break;
                case 'start_date': this.renderStartDate(container, data, config); break;
                case 'scheduled_date': this.renderScheduledDate(container, data, config); break;
                case 'alert': this.renderAlert(container, data, config); break;
                case 'container': this.renderContainer(container, config, data); break;
                case 'subgrid': this.renderSubgrid(container, itemConfig, data, config); break;
                case 'spacer': this.renderSpacer(container, config); break;
                case 'completion_date': this.renderCompletionDate(container, data, config); break;
                case 'recurrence': this.renderRecurrence(container, data, config); break;
                case 'id': this.renderId(container, data, config); break;
                case 'depends_on': this.renderDependsOn(container, data, config); break;
                case 'source': this.renderSource(container, data, config); break;
                case 'separator': this.renderSeparator(container, config); break;
            }
        });
    }

    renderContainer(parent, config, data) {
        const isFlow = !!config.isFlow;

        // CHANGE: Create a span for flow, and a div for standard flex rows
        const wrapper = isFlow
            ? parent.createSpan({ cls: 'cpwn-nested-container is-flow' })
            : parent.createDiv({ cls: 'cpwn-nested-container' });

        if (isFlow) {
            // In flow mode, we want the container to not force a line break
            wrapper.style.display = 'inline';
            wrapper.style.width = 'auto';
        } else {
            // Standard behavior: preserve your original flex logic
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = config.flow || 'row';
            wrapper.style.alignItems = config.align || 'center';
            wrapper.style.justifyContent = config.justify || 'flex-start';
            wrapper.style.gap = config.gap || '6px';
            wrapper.style.width = '100%';
            wrapper.style.minWidth = '0';
        }



        if (config.indent) {
            // Apply a padding-left that matches the standard offset
            // You can use a CSS variable or hardcoded value
            wrapper.style.paddingLeft = 'var(--cpwn-content-indent, 42px)';
        }

        // If you already support config.style, keep this:
        if (config.style) {
            wrapper.setAttr('style', wrapper.getAttr('style') + '; ' + config.style);
        }

        this.renderItems(wrapper, config.items || [], data, config);
    }

    renderSubgrid(parent, itemConfig, data, inheritedConfig) {
        const subgrid = parent.createDiv({ cls: 'cpwn-subgrid-container' });

        subgrid.style.display = 'grid';
        subgrid.style.gridTemplateAreas = itemConfig.gridTemplate;

        // CRITICAL FIX: Force nested grid to shrink
        subgrid.style.gridTemplateColumns = itemConfig.gridColumns.replace(/1fr/g, 'minmax(0, 1fr)');

        subgrid.style.gap = itemConfig.gap || '4px';
        subgrid.style.alignItems = 'start';
        subgrid.style.width = '100%';
        subgrid.style.minWidth = '0'; // Prevent grid blowout

        if (itemConfig.items) {
            itemConfig.items.forEach(areaConfig => {
                const area = subgrid.createDiv({ cls: `cpwn-sub-area-${areaConfig.area}` });
                area.style.gridArea = areaConfig.area;

                // FLEXBOX LAYOUT CONTROLS
                area.style.display = 'flex';
                const flowDirection = areaConfig.flow || 'row';
                area.style.flexDirection = flowDirection;

                // FIX: Ensure nested areas shrink
                area.style.minWidth = '0';
                area.style.maxWidth = '100%';

                // Alignment
                if (areaConfig.align) area.style.alignItems = areaConfig.align;
                if (areaConfig.justify) area.style.justifyContent = areaConfig.justify;

                // WRAPPING LOGIC:
                // If it's a row, we MUST wrap to avoid overflow.
                if (areaConfig.flexWrap) {
                    area.style.flexWrap = areaConfig.flexWrap;
                } else if (flowDirection === 'row') {
                    area.style.flexWrap = 'wrap';
                }

                area.style.gap = '6px';

                this.applyStyles(area, areaConfig);
                this.renderItems(area, areaConfig.items, data, inheritedConfig);
            });
        }
    }

    renderTitle(parent, data, config = {}) {
        // 1. Identify context
        const isFlow = parent.hasClass('is-flow') || parent.closest('.is-flow');
        const wrapper = parent.createDiv({ cls: 'cpwn-task-title-wrapper' });

        // 2. Original Alignment Logic
        if (config.align) wrapper.style.alignSelf = config.align;

        // 3. Original DONE status logic
        if (data.status.type === 'DONE') {
            wrapper.addClass('cpwn-text-muted');
            wrapper.style.opacity = '0.7';
            wrapper.addClass('is-completed');
        }

        // 4. Original Custom Styles (Font, Color, etc.)
        this.applyStyles(wrapper, config);

        if (isFlow) {
            // DEFINITIVE FIX 2: Wrapper must be inline
            wrapper.style.display = 'inline';
            wrapper.style.width = 'auto';
            wrapper.style.marginRight = '4px';
        }

        const component = this.view || this.plugin;
        if (component) {
            MarkdownRenderer.render(this.app, data.cleanText, wrapper, data.path, component).then(() => {
                if (isFlow) {
                    const p = wrapper.querySelector('p');
                    if (p) {
                        // DEFINITIVE FIX 3: Generated p-tag must be inline
                        p.style.display = 'inline';
                        p.style.margin = '0';
                    }
                }
            });
        }
    }


    renderCheckbox(parent, data, config = {}) {
        const symbol = data.status.symbol || ' ';

        parent.addClass('task-list-item');
        parent.setAttribute('data-task', symbol);

        const cb = parent.createEl('input', {
            type: 'checkbox',
            cls: 'task-list-item-checkbox cpwn-task-checkbox'
        });

        if (data.status.type === 'DONE' || symbol !== ' ') {
            cb.checked = true;
            cb.addClass('is-checked');
        }

        cb.setAttribute('data-task', symbol);

        // Styling Adjustments
        cb.style.marginTop = '4px';

        if (config.colorCheckboxByPriority) {
            const pColors = {
                0: 'rgba(255, 0, 0, 0.7)', 1: 'rgba(252, 101, 0, 0.7)',
                4: 'rgba(0, 255, 13, 0.7)', 5: 'rgba(17, 101, 255, 0.7)',
            };
            const pColor = pColors[data.priority];
            if (pColor) {
                cb.style.setProperty('--checkbox-color', pColor);
                cb.addClass('is-colored-priority');
            }
        }

        if (this.view && this.view.toggleTaskCompletion) {
            cb.addEventListener('click', (e) => {
                e.preventDefault(); // Stop native toggle so your logic handles it
                e.stopPropagation();
                this.view.toggleTaskCompletion(data);
            });
        }
    }


    renderPriority(parent, data, config = {}) {
        if (data.priority === 2) return;
        const isFlow = parent.hasClass('is-flow') || !!parent.closest('.is-flow');
        const pEl = parent.createSpan({ cls: 'cpwn-priority-icon' });
        this.applyStyles(pEl, config, isFlow);

        //if (config.align) {
        //    pEl.style.alignSelf = config.align;
        //}

        const map = {
            0: { icon: 'chevrons-up', color: 'var(--text-error)' },
            1: { icon: 'chevron-up', color: 'var(--text-error)' },
            4: { icon: 'chevron-down', color: 'var(--text-accent)' },
            5: { icon: 'chevrons-down', color: 'var(--text-faint)' }
        };
        const p = map[data.priority];
        if (p) {
            setIcon(pEl, p.icon);
            if (!config.textStyle && !config.color) {
                pEl.style.color = p.color;
            }
        }
    }

    renderTags(parent, data, config = {}) {
        if (!data.tags || !data.tags.length) return;
        const isFlow = parent.hasClass('is-flow') || !!parent.closest('.is-flow');

        // 1. Create Container
        const container = parent.createSpan({ cls: 'cpwn-tags-container' });

        // Apply container-level alignment config
        //if (config.align) container.style.alignSelf = config.align;
        //if (config.justify) container.style.justifyContent = config.justify;
        this.applyStyles(container, config, isFlow);
        container.style.display = 'inline-flex';
        container.style.gap = '4px';

        // 3. Render Each Tag
        data.tags.forEach(tag => {
            const pill = container.createSpan({ cls: 'cpwn-task-tag-pill', text: tag });

            // B. BACKGROUND COLOR LOGIC
            if (config.backgroundColor) {
                // Determine opacity: Use 'bgOpacity' if present, otherwise default to 1
                const alpha = config.bgOpacity !== undefined ? config.bgOpacity : 1;

                if (alpha < 1) {
                    // --- INLINE HEX TO RGBA CONVERSION ---
                    let hex = config.backgroundColor;
                    let c;
                    let bg = hex; // default fallback

                    // Check for valid hex format (#RRGGBB or #RGB)
                    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                        c = hex.substring(1).split('');
                        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                        c = '0x' + c.join('');

                        // Construct RGBA string
                        bg = 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
                    }
                    pill.style.backgroundColor = bg;
                } else {
                    pill.style.backgroundColor = config.backgroundColor;
                }
                pill.style.border = 'none'; // Remove default border for custom bg
            } else {
                // Fallback: Use Obsidian's default tag style
                pill.addClass('tag');
            }

            // C. TEXT COLOR LOGIC
            if (config.color) {
                // Using !important to ensure user-configured color overrides any other theme defaults if they have explicity set tag text colors
                pill.style.setProperty('color', config.color, 'important');

            }

            // D. GLOBAL/TEXT OPACITY LOGIC
            // This handles the generic 'opacity' slider (affects whole element or text)
            if (config.opacity) {
                pill.style.opacity = config.opacity;
            }

            // E. APPLY REMAINING STYLES (Font Size, etc.)
            // We clone config but remove the props we already handled manually
            const pillConfig = {
                ...config,
                color: undefined,
                backgroundColor: undefined,
                opacity: undefined
            };
            this.applyStyles(pill, pillConfig);
        });
    }


    /**
     * Helper to render standardized date badges.
     * @param {HTMLElement} parent - The container to append to.
     * @param {string} text - The date string to display.
     * @param {string} iconName - The Lucide icon name (e.g., 'calendar').
     * @param {string} className - CSS class for the wrapper (e.g., 'cpwn-due-date').
     * @param {object} config - The layout config object (for alignment/color).
     * @param {object} options - Overrides for specific styling (gap, iconSize).
     */
    renderDateBadge(parent, text, iconName, className, config, options = {}) {
        // PRESERVED: Original options destructuring
        const {
            iconSize,
            gap,
            iconFontSize = 'var(--font-text-size)'
        } = options;

        const badge = parent.createSpan({ cls: `${className} cpwn-date-badge` });

        // 1. Set the display type for the badge
        badge.style.display = 'inline-flex';

        // PRESERVED: Original gap logic
        badge.style.gap = gap || '2px';

        // 2. NEW: Respect User's Alignment choice internally
        if (config.align) {
            const internalMap = {
                'center': 'center',
                'start': 'flex-start',
                'end': 'flex-end',
                'baseline': 'baseline'
            };
            badge.style.alignItems = internalMap[config.align] || 'center';
        }

        // 3. PRESERVED & FIXED: Apply alignment and user-defined colors/styles
        // Passing true as the third argument to applyStyles (if you updated it) 
        // or relying on its internal logic to handle the vertical-align mapping.
        if (config.align) badge.style.alignSelf = config.align;
        this.applyStyles(badge, config);

        // 4. PRESERVED: Icon Container logic
        const iconSpan = badge.createSpan({ cls: 'cpwn-meta-icon' });
        iconSpan.style.display = 'inline-flex';

        // PRESERVED: Reset font context for the icon
        iconSpan.style.fontSize = iconFontSize;

        // PRESERVED: Manual dimensions if passed in options
        if (iconSize) {
            iconSpan.style.height = iconSize;
            iconSpan.style.width = iconSize;
        }

        // 5. PRESERVED: Final Icon and Text rendering
        setIcon(iconSpan, iconName);
        badge.createSpan({ text: text });
    }

    renderDueDate(parent, data, config = {}) {
        let dateMoment = null;
        if (data.due && data.due.moment) {
            dateMoment = data.due.moment;
        } else if (data.dueDate) {
            dateMoment = moment(data.dueDate, ['YYYY-MM-DD', moment.ISO_8601]);
            if (!dateMoment.isValid()) dateMoment = moment(new Date(data.dueDate));
        }

        if (!dateMoment || !dateMoment.isValid()) return;

        const dateFormat = this.view?.plugin?.settings?.taskDateFormat || 'YYYY-MM-DD';
        const formattedText = dateMoment.format(dateFormat);

        // Usage: Standard gap (4px) and icon size (1em)
        this.renderDateBadge(parent, formattedText, 'calendar', 'cpwn-due-date', config);
    }

    renderStartDate(parent, data, config = {}) {
        if (!data.start || !data.start.moment || !data.start.moment.isValid()) return;

        const dateFormat = this.view?.plugin?.settings?.taskDateFormat || 'YYYY-MM-DD';
        const formattedText = data.start.moment.format(dateFormat);

        this.renderDateBadge(parent, formattedText, 'calendar-plus', 'cpwn-start-date', config);
    }

    renderScheduledDate(parent, data, config = {}) {
        if (!data.scheduled || !data.scheduled.moment || !data.scheduled.moment.isValid()) return;

        const dateFormat = this.view?.plugin?.settings?.taskDateFormat || 'YYYY-MM-DD';
        const formattedText = data.scheduled.moment.format(dateFormat);

        this.renderDateBadge(parent, formattedText, 'calendar-clock', 'cpwn-scheduled-date', config);
    }

    renderCompletionDate(parent, data, config = {}) {
        if (!data.doneDate || !data.doneDate.moment || !data.doneDate.moment.isValid()) return;

        const dateFormat = this.view?.plugin?.settings?.taskDateFormat || 'YYYY-MM-DD';
        const formattedText = data.doneDate.moment.format(dateFormat);

        this.renderDateBadge(parent, formattedText, 'check-square', 'cpwn-completion-date', config);
    }

    renderAlert(parent, data, config = {}) {
        if (!data.alert) return;

        // 1. Retrieve the date format from settings using the same chain as your completion date method
        const dateFormat = this.view?.plugin?.settings?.taskDateFormat || 'YYYY-MM-DD';

        // 2. Determine raw strings for logic comparison
        let displayText = data.alert.time;
        const alertDateRaw = data.alert.date; // Original YYYY-MM-DD string
        let dueDateString = null;

        if (data.due && data.due.moment) {
            dueDateString = data.due.moment.format('YYYY-MM-DD');
        } else if (data.dueDate) {
            const m = moment(data.dueDate, ['YYYY-MM-DD', moment.ISO_8601]);
            if (m.isValid()) dueDateString = m.format('YYYY-MM-DD');
            else dueDateString = data.dueDate;
        }

        // 3. Format the alert date for display
        let formattedAlertDate = alertDateRaw;
        if (alertDateRaw) {
            const alertMoment = moment(alertDateRaw, 'YYYY-MM-DD');
            if (alertMoment.isValid()) {
                formattedAlertDate = alertMoment.format(dateFormat);
            }
        }

        // 4. Update displayText with the formatted date string
        if (alertDateRaw && dueDateString && alertDateRaw !== dueDateString) {
            displayText = `${formattedAlertDate} ${data.alert.time}`;
        } else if (alertDateRaw && !dueDateString) {
            displayText = `${formattedAlertDate} ${data.alert.time}`;
        }

        // 5. Render the badge
        this.renderDateBadge(parent, displayText, 'bell', 'cpwn-alert-badge', config, { gap: '3px' });
    }


    renderRecurrence(parent, data, config = {}) {
        if (!data.recurrence) return;
        const isFlow = parent.hasClass('is-flow') || parent.closest('.is-flow');
        const el = parent.createSpan({ cls: 'cpwn-recurrence' });

        // 1. Set display and wrap behavior
        el.style.display = 'inline-flex';
        el.style.gap = '4px';
        el.style.whiteSpace = 'nowrap';

        // 2. Map User choice to INTERNAL alignment (Icon vs Text)
        if (config.align) {
            const internalMap = {
                'center': 'center',
                'start': 'flex-start',
                'end': 'flex-end',
                'baseline': 'baseline'
            };
            el.style.alignItems = internalMap[config.align] || 'center';
        }

        // 3. Map User choice to EXTERNAL alignment (Badge vs Task Row)
        // applyStyles handles the vertical-align/align-self mapping automatically
        this.applyStyles(el, config);

        const iconSpan = el.createSpan({ cls: 'cpwn-meta-icon' });
        iconSpan.style.display = 'inline-flex';
        // REMOVED: hardcoded verticalAlign: 'middle'

        setIcon(iconSpan, 'rotate-cw');
        el.createSpan({ text: data.recurrence });
    }




    renderDependsOn(parent, data, config = {}) {
        if (!data.dependsOn || data.dependsOn.length === 0) return;

        const el = parent.createSpan({ cls: 'cpwn-depends-on' });
        this.applyStyles(el, config);

        const iconSpan = el.createSpan({ cls: 'cpwn-meta-icon' });
        setIcon(iconSpan, 'link');


        el.createSpan({ text: data.dependsOn.join(', ') });
    }

    renderId(parent, data, config = {}) {
        if (!data.id) return;
        const isFlow = parent.hasClass('is-flow') || !!parent.closest('.is-flow');
        const el = parent.createSpan({ cls: 'cpwn-task-id' });

        el.style.display = 'inline-flex';
        el.style.alignItems = 'center'; // Internal alignment

        this.applyStyles(el, config, isFlow);

        // Icon: Fingerprint (or use 'hash')
        const iconSpan = el.createSpan({ cls: 'cpwn-meta-icon' });
        iconSpan.style.display = 'inline-flex';
        setIcon(iconSpan, 'fingerprint'); // 'hash' is another good option

        // Text
        el.createSpan({ text: data.id });
    }

    renderSource(parent, data, config = {}) {
        if (!data.path) return;

        // Clean filename: "Folder/File.md" -> "File"
        const filename = data.path.split('/').pop().replace('.md', '');

        const el = parent.createSpan({ cls: 'cpwn-task-source' });
        this.applyStyles(el, config);

        const iconSpan = el.createSpan({ cls: 'cpwn-meta-icon' });
        setIcon(iconSpan, 'file-text');

        const link = el.createSpan({ text: filename, cls: 'cpwn-source-link' });
        link.style.cursor = 'pointer';
        //link.style.textDecoration = 'underline';

        link.addEventListener('click', (e) => {
            e.stopPropagation();
            // Open the file
            this.app.workspace.openLinkText(data.path, '', false);
        });
    }


    renderSpacer(parent, config = {}) {
        const spacer = parent.createSpan({ cls: 'cpwn-layout-spacer' });

        const isFlexible =
            config.flexible === true ||
            (config.style && typeof config.style === 'string' && config.style.includes('flex-grow'));

        if (isFlexible) {
            spacer.addClass('is-flexible');
            // Styles are now handled by CSS .is-flexible
        } else {
            // Legacy / Fixed Width behavior
            // Only set dynamic width via JS
            const width = config.width || '24px';
            spacer.style.width = width;
            spacer.style.minWidth = width;
        }
    }

    renderSeparator(parent, config = {}) {
        const isFlow = parent.hasClass('is-flow') || parent.closest('.is-flow');
        const el = parent.createSpan({
            cls: 'cpwn-layout-separator',
            text: config.text || '-'
        });

        el.style.whiteSpace = 'pre-wrap';

        if (isFlow) {
            // Fix 1: True inline behavior
            el.style.display = 'inline';
            el.style.width = 'auto';
            el.style.margin = '1px'; // DISABLE NEGATIVE MARGINS FOR FLOW
        } else {
            el.style.display = 'inline-flex';
            el.style.flexShrink = '1px';
        }

        this.applyStyles(el, config);
        if (config.align) el.style.alignSelf = config.align;

        // Fix 2: Wrap your tightening logic in an !isFlow check
        if (!isFlow) {
            if (!config.style || !config.style.includes('margin')) {
                const txt = (config.text || '');
                if (['(', '[', '{', '<'].includes(txt.trim())) {
                    if (!txt.endsWith(' ')) el.style.marginRight = '-5px';
                }
                if ([')', ']', '}', '>', ',', ';'].includes(txt.trim())) {
                    if (!txt.startsWith(' ')) el.style.marginLeft = '-5px';
                }
            }
        }
    }



    // --- Helper to Apply Styles ---
    applyStyles(el, config, isFlowOverride = null) {
        if (!config.color && config.textStyle) {
            el.addClass(`cpwn-text-${config.textStyle}`);
        }
        if (config.fontSize) {
            el.addClass(`cpwn-font-${config.fontSize}`);
        }

        if (config.align) {
            // Use the override if provided, otherwise fallback to DOM check
            const isFlow = isFlowOverride !== null
                ? isFlowOverride
                : (el.hasClass('is-flow') || !!el.closest('.is-flow'));

            if (isFlow) {
                const alignMap = {
                    'center': 'middle',
                    'start': 'top',
                    'end': 'bottom',
                    'baseline': 'baseline'
                };
                el.style.verticalAlign = alignMap[config.align] || config.align;
                // Ensure alignSelf doesn't interfere
                el.style.alignSelf = 'auto';
            } else {
                el.style.alignSelf = config.align;
                el.style.verticalAlign = 'normal';
            }
        }

        if (config.color) {
            el.style.color = config.color;

            // If it's an icon (like priority), we might need to color the SVG path or container
            if (el.tagName === 'svg' || el.querySelector('svg')) {
                el.style.fill = config.color;
            }
        }

        if (config.opacity) {
            el.style.opacity = config.opacity;
        }



        if (config.style) {
            // We MUST append to existing styles to avoid breaking display:flex/grid
            const currentStyle = el.getAttribute('style') || '';
            // Prevent duplicate semicolons just in case
            const separator = currentStyle.trim().endsWith(';') ? ' ' : '; ';
            el.setAttribute('style', currentStyle + separator + config.style);
        }

    }
}
