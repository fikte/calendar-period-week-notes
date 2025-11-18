// src/modals/WidgetBuilderModal.js
import { Modal, DropdownComponent, Notice, Setting, Menu, moment, setIcon  } from 'obsidian';
import { DEFAULT_SETTINGS } from '../data/constants.js';

export class WidgetBuilderModal extends Modal {
    constructor(app, plugin, widgetConfig, saveCallback) {
        super(app);
        this.plugin = plugin;
        this.config = JSON.parse(JSON.stringify(widgetConfig));
        this.saveCallback = saveCallback;
        this.excludedTagsSettingEl = null;
    }

    toggleExcludedTagsVisibility() {
        if (this.excludedTagsSettingEl) {
            const shouldShow = this.config.groupBy === 'tag';
            this.excludedTagsSettingEl.style.display = shouldShow ? 'flex' : 'none';
        }
    }

    getIconOptions() {
        return [
            { value: '', name: '— None —' },
            { value: 'alert-triangle', name: 'Alert Triangle' },
            { value: 'arrow-big-down', name: 'Arrow Big Down' },
            { value: 'arrow-big-up', name: 'Arrow Big Up' },
            { value: 'arrow-down', name: 'Arrow Down' },
            { value: 'arrow-up', name: 'Arrow Up' },
            { value: 'bell', name: 'Bell' },
            { value: 'check', name: 'Check' },
            { value: 'check-check', name: 'Check Check' },
            { value: 'check-line', name: 'Check Line' },
            { value: 'circle-question-mark', name: 'Circle Question Mark' },
            { value: 'flag', name: 'Flag' },
            { value: 'flag-off', name: 'Flag Off' },
            { value: 'flame', name: 'Flame' },
            { value: 'inbox', name: 'Inbox' },
            { value: 'lightbulb', name: 'Light Bulb' },
            { value: 'minus', name: 'Minus' },
            { value: 'star', name: 'Star' },
            { value: 'sticky-note', name: 'Sticky Note' },
            { value: 'toggle-left', name: 'Toggle Left' },
            { value: 'toggle-right', name: 'Toggle Right' }
        ];
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('cpwn-pm-widget-builder-modal');
        contentEl.createEl('h2', { text: this.config.widgetKey.startsWith('custom-') ? 'Edit custom widget' : 'Create custom widget' });


        let legendPositionSettingEl;
        let legendPositionDropdown;

        const updateLegendOptions = () => {
            if (!legendPositionDropdown) return; // Do nothing if the dropdown doesn't exist yet

            if (!this.config.legend) {
                this.config.legend = { display: true, position: 'top' };
            }

            const isPieChart = this.config.chartType === 'pie';
            const currentPosition = this.config.legend.position || 'top';
            const newOptions = { top: 'Top', bottom: 'Bottom' };

            if (isPieChart) {
                newOptions.left = 'Left';
                newOptions.right = 'Right';
            }

            // Clear and add the correct options
            legendPositionDropdown.selectEl.innerHTML = '';
            legendPositionDropdown.addOptions(newOptions);

            // Reset position if the old one is invalid
            if (Object.keys(newOptions).includes(currentPosition)) {
                legendPositionDropdown.setValue(currentPosition);
            } else {
                this.config.legend.position = 'top';
                legendPositionDropdown.setValue('top');
            }
        };
        // --- General Settings ---
        new Setting(contentEl)
            .setName('Widget name')
            .setDesc('The name that is displayed above the widget. Leave blank to not display a name.')
            .addText(text => text
                .setPlaceholder('e.g., Completed Tasks (Last 30 Days)')
                .setValue(this.config.widgetName || '')
                .onChange(value => this.config.widgetName = value)
            );


        new Setting(contentEl)
            .setName('Append time period to name')
            .setDesc('If enabled, the selected date range will be shown in the widget name.')
            .addToggle(toggle => toggle
                .setValue(this.config.appendTimePeriod === true)
                .onChange(value => {
                    this.config.appendTimePeriod = value;
                })
            );

        new Setting(contentEl)
            .setName("Override show name")
            .setDesc("Override the global setting and choose if this widget shows a name.")
            .addToggle(toggle =>
                toggle.setValue(this.config.overrideShowTitle ?? null)
                    .onChange(async value => {
                        this.config.overrideShowTitle = value; // can be true, false, or null (falls back to master)
                    })
            );

        new Setting(contentEl)
            .setName("Override show chevron")
            .setDesc("Override the global setting and choose if this widget shows a toggle chevron.")
            .addToggle(toggle =>
                toggle.setValue(this.config.overrideShowChevron ?? null)
                    .onChange(async value => {
                        this.config.overrideShowChevron = value;

                    })
            );

        new Setting(contentEl)
            .setName('Widget size')
            .addDropdown(dropdown => dropdown
                .addOption('mini', 'Quarter (1/4 width)')
                .addOption('small-medium', 'Third (1/3 width)')
                .addOption('small', 'Half (1/2 width)')
                .addOption('medium', 'Full (100% width)')
                .addOption('large', 'Full (Tall)')
                .setValue(this.config.size || 'medium')
                .onChange(value => this.config.size = value)
            );

        // --- Chart & Data Configuration ---
        new Setting(contentEl)
            .setName('Chart type')
            .setDesc('Select the type of chart to display. Note for the KPI stat, only one metric is supported. Any additional metrics will be ignored.')
            .addDropdown(dropdown => dropdown
                .addOption('line', 'Line chart')
                .addOption('cumulative', 'Cumulative line chart')
                .addOption('bar', 'Bar chart')
                .addOption('pie', 'Pie chart')
                .addOption('radar', 'Radar chart')
                .addOption('kpi', 'KPI (single stat)')
                .setValue(this.config.chartType || 'line')
                .onChange(value => {
                    this.config.chartType = value;
                    updateLegendOptions();
                    updateConditionalSettings();
                    this.chartTypeDropdown = dropdown;
                    if (value === 'kpi') {
                        kpiSettingsContainer.style.display = 'block';
                    } else {
                        kpiSettingsContainer.style.display = 'none';
                    }

                })
            );

        // 1. Priority Multi-Select Setting
        const kpiSettingsContainer = contentEl.createDiv('kpi-settings-container');

        new Setting(kpiSettingsContainer)
            .setName("Filter by priority")
            .setDesc("Toggle which priorities to include in the count. If none are active, all priorities are included.");

        // Create a setting for each priority
        const priorities = [
            { key: '0', name: 'Highest' },
            { key: '1', name: 'High' },
            { key: '2', name: 'Medium' },
            { key: '3', name: 'Normal' },
            { key: '4', name: 'Low' },
            { key: '5', name: 'Lowest' }
        ];

        if (typeof this.config.kpiPriorities !== 'object' || this.config.kpiPriorities === null) {
            this.config.kpiPriorities = {};
        }

        priorities.forEach(p => {
            new Setting(kpiSettingsContainer)
                .setName(p.name)
                .addToggle(toggle => toggle
                    .setValue(this.config.kpiPriorities[p.key] || false)
                    .onChange(async (value) => {
                        this.config.kpiPriorities[p.key] = value;
                    }));
        });

        const iconSetting = new Setting(kpiSettingsContainer)
            .setName("KPI stat icon")
            .setDesc("Select an icon to display next to the kpi count.");

        // The controlEl is the container on the right side of the setting.
        // We'll use flexbox to align the preview and dropdown within it.
        iconSetting.controlEl.style.display = 'flex';
        iconSetting.controlEl.style.alignItems = 'center';
        iconSetting.controlEl.style.gap = '8px';

        // Create the icon preview element FIRST, so it appears on the left.
        const iconPreview = iconSetting.controlEl.createDiv({ cls: 'cpwn-pm-icon-preview' });

        const updateIconPreview = (iconName, iconColor) => {
            iconPreview.empty();
            if (iconName) {
                setIcon(iconPreview, iconName);
                const svg = iconPreview.querySelector('svg');
                if (svg && iconColor) {
                    svg.style.color = iconColor;
                }
            }
        };

        const iconOptions = this.getIconOptions();

        // Create the dropdown component
        const iconDropdown = new DropdownComponent(iconSetting.controlEl);
        iconOptions.forEach(option => {
            iconDropdown.addOption(option.value, option.name);
        });
        iconDropdown.setValue(this.config.kpiIcon || '');
        iconDropdown.onChange(async (value) => {
            this.config.kpiIcon = value;
            updateIconPreview(this.config.kpiIcon, this.config.kpiIconColor);
        });

        // Initialize preview with current icon
        updateIconPreview(this.config.kpiIcon, this.config.kpiIconColor);

        // NEW: Add custom icon override setting below
        const overrideSetting = new Setting(kpiSettingsContainer)
            .setName("Custom icon override")
            .setDesc("Enter any Lucide icon name to override the dropdown selection. Leave blank to use dropdown.");

        // Set up flexbox for the override control
        overrideSetting.controlEl.style.display = 'flex';
        overrideSetting.controlEl.style.alignItems = 'center';
        overrideSetting.controlEl.style.gap = '8px';

        // Create the icon preview element FIRST
        const overrideIconPreview = overrideSetting.controlEl.createDiv({ cls: 'cpwn-pm-icon-preview' });

        // Create the text input
        overrideSetting.addText(text => text
            .setPlaceholder('e.g., rocket, heart, shield')
            .setValue(this.config.kpiIconOverride || '')
            .onChange(async (value) => {
                this.config.kpiIconOverride = value.trim();
                // Update the override preview
                const iconToShow = this.config.kpiIconOverride || this.config.kpiIcon;
                overrideIconPreview.empty();
                if (iconToShow) {
                    setIcon(overrideIconPreview, iconToShow);
                    const svg = overrideIconPreview.querySelector('svg');
                    if (svg && this.config.kpiIconColor) {
                        svg.style.color = this.config.kpiIconColor;
                    }
                }
            })
        );

        // Initialize override preview
        const initialOverrideIcon = this.config.kpiIconOverride || this.config.kpiIcon;
        if (initialOverrideIcon) {
            setIcon(overrideIconPreview, initialOverrideIcon);
            const svg = overrideIconPreview.querySelector('svg');
            if (svg && this.config.kpiIconColor) {
                svg.style.color = this.config.kpiIconColor;
            }
        }

        // --- 2. Initial State ---
        // Set the initial state of the icon preview when the settings are first opened.
        updateIconPreview(this.config.kpiIcon, this.config.kpiIconColor);


        if (this.config.chartType === 'kpi') {
            kpiSettingsContainer.style.display = 'block';
        } else {
            kpiSettingsContainer.style.display = 'none';
        }

        // This container will hold our conditional settings
        const conditionalSettingsContainer = contentEl.createDiv();

        const updateConditionalSettings = () => {
            conditionalSettingsContainer.empty(); // Clear previous settings

            // --- Conditional settings for Line/Cumulative charts ---
            if (['line', 'cumulative'].includes(this.config.chartType)) {
                new Setting(conditionalSettingsContainer)
                    .setName('Show today marker')
                    .setDesc('Adds a vertical line to indicate the current day.')
                    .addToggle(toggle => {
                        toggle
                            .setValue(this.config.todayMarker?.show || false)
                            .onChange(value => {
                                if (!this.config.todayMarker) {
                                    // Find the default widget config to get the default color
                                    const defaultWidget = DEFAULT_SETTINGS.tasksStatsWidgets.find(w => w.chartType === 'line');
                                    const color = defaultWidget?.todayMarker?.color || 'rgba(134, 169, 222, 0.75)'; // Fallback color
                                    this.config.todayMarker = {
                                        show: false,
                                        color: color
                                    };
                                }
                                this.config.todayMarker.show = value;
                                updateConditionalSettings(); // Re-run to show/hide the color picker
                            });
                    });

                // Only show the color picker if the "Show Today Marker" toggle is on
                if (this.config.todayMarker?.show) {
                    const defaultWidget = DEFAULT_SETTINGS.tasksStatsWidgets.find(w => w.chartType === 'line');
                    const defaultColor = defaultWidget?.todayMarker?.color || 'rgba(134, 169, 222, 0.75)';
                    this.createWidgetColorSetting(
                        conditionalSettingsContainer,
                        'Today marker color',
                        'Sets the color and transparency of the marker.',
                        'todayMarker.color',
                        defaultColor
                    );
                }

                if ('cumulative' === this.config.chartType) {

                    // Initialize the projection object if it doesn't exist
                    if (!this.config.projection) {
                        this.config.projection = {
                            show: false,
                            label: 'Projected',
                            color: 'rgba(128, 128, 128, 0.7)'
                        };
                    }

                    new Setting(conditionalSettingsContainer)
                        .setName('Show projected task completion line')
                        .setDesc('Adds a dotted line to the chart showing the cumulative total of completed and upcoming due tasks. Enable this when you have have a date range that includes future dates.')
                        .addToggle(toggle => {
                            toggle
                                .setValue(this.config.projection?.show || false)
                                .onChange(value => {
                                    if (!this.config.projection) {
                                        // Find the default widget config to get the default color
                                        const defaultWidget = DEFAULT_SETTINGS.tasksStatsWidgets.find(w => w.chartType === 'line');
                                        const color = defaultWidget?.projection?.color || 'rgba(134, 169, 222, 0.75)'; // Fallback color
                                        this.config.projection = {
                                            show: false,
                                            color: color
                                        };
                                    }
                                    this.config.projection.show = value;
                                    updateConditionalSettings(); // Re-run to show/hide the color picker
                                });



                        });

                    // Only show the label and color settings if the projection is enabled
                    if (this.config.projection?.show) {
                        new Setting(conditionalSettingsContainer)
                            .setName('Projection label')
                            .setDesc('The label for the projected line in the chart legend.')
                            .addText(text => {
                                text
                                    .setPlaceholder('Projected')
                                    .setValue(this.config.projection.label)
                                    .onChange(async (value) => {
                                        this.config.projection.label = value;
                                    });
                            });

                        // Only show the color picker if the "projected" toggle is on
                        const defaultWidget = DEFAULT_SETTINGS.tasksStatsWidgets.find(w => w.chartType === 'line');
                        const defaultColor = defaultWidget?.projection?.color || 'rgba(134, 169, 222, 0.75)';
                        this.createWidgetColorSetting(
                            conditionalSettingsContainer,
                            'Projection dotted line color',
                            'Sets the color and transparency of the projected dotted line.',
                            'projection.color',
                            defaultColor
                        );
                    }
                }
            }
        };

        // Initial call to set the correct state when the modal opens
        updateConditionalSettings();
        contentEl.createEl('h3', { text: 'Metrics' });

        // Ensure metrics array exists
        if (!this.config.metrics) {
            this.config.metrics = [{ label: 'Metric 1', type: 'completed', color: '#888888' }];
        }

        const metricsContainer = contentEl.createDiv();
        this.config.metrics.forEach((metric, index) => {
            // --- Row 1: Label, Type, and Remove Button ---
            const metricSetting = new Setting(metricsContainer)
                .setName(`Metric ${index + 1}`)
                .addText(text => text
                    .setPlaceholder('Label (e.g., Completed)')
                    .setValue(metric.label)
                    .onChange(value => {
                        metric.label = value;
                    })
                )
                .addDropdown(dropdown => dropdown
                    .addOption('created', 'Created tasks')
                    .addOption('open', 'Open tasks')
                    .addOption('in-progress', 'In-progress tasks')
                    .addOption('due', 'Due tasks')
                    .addOption('someday', 'Someday (No due date)')
                    .addOption('overdue', 'Overdue tasks')
                    .addOption('cancelled', 'Cancelled tasks')
                    .addOption('completed', 'Completed tasks')
                    .setValue(metric.type)
                    .onChange(value => {
                        metric.type = value;
                        metric.color = this.getDefaultColorForType(value);
                        this.onOpen();
                    })
                )
                .addButton(button => button
                    .setIcon('trash')
                    .setTooltip('Remove metric')
                    .onClick(() => {
                        this.config.metrics.splice(index, 1);
                        this.onOpen(); // Re-render the modal to remove the metric row
                    })
                );

            // --- Row 2: The Advanced Color Picker ---
            const colorConfigKey = `metrics[${index}].color`;

            this.createWidgetColorSetting(
                metricsContainer,      // Add it to the main container
                '',                    // No name, so it aligns with controls
                '',                    // No description
                colorConfigKey,        // The exact path to the color value
                metric.color
            );
        });

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Add metric')
                .onClick(() => {
                    const defaultType = 'completed'; // The default metric type

                    const defaultColor = this.getDefaultColorForType(defaultType);

                    const newMetric = {
                        label: `Metric ${this.config.metrics.length + 1}`,
                        type: defaultType,
                        color: defaultColor // Assign the looked-up color
                    };

                    this.config.metrics.push(newMetric);
                    this.onOpen();
                }));

        // --- Legend Settings ---
        contentEl.createEl('h3', { text: 'Legend' });
        new Setting(contentEl)
            .setName('Display legend')
            .setDesc('Toggle the visibility of the chart legend. Note for the KPI stat, the legend is always hidden.')
            .addToggle(toggle => toggle
                .setValue(this.config.legend?.display ?? true)
                .onChange(value => {
                    if (!this.config.legend) this.config.legend = { display: true, position: 'top' };
                    this.config.legend.display = value;
                    // Just show or hide the setting. No need to rebuild anything.
                    legendPositionSettingEl.style.display = value ? 'flex' : 'none';
                }));

        // Create the legend position setting and CAPTURE its references
        const legendPositionSetting = new Setting(contentEl)
            .setName('Legend position')
            .addDropdown(dropdown => {
                legendPositionDropdown = dropdown; // Capture dropdown component
                dropdown.onChange(value => {
                    if (!this.config.legend) this.config.legend = {};
                    this.config.legend.position = value;
                });
            });

        // Capture the parent element for showing/hiding
        legendPositionSettingEl = legendPositionSetting.settingEl;
        updateLegendOptions();

        this.renderDateRangeControls(contentEl.createDiv());

        // --- Grouping & Axes (Not applicable for KPI/Pie) ---
        new Setting(contentEl)
            .setName('Group data by')
            .setDesc('Choose how to group the data points on the chart. Note the group data by does not apply to pie chart or kpi stat widgets.')
            .addDropdown(dropdown => dropdown
                .addOption('day', 'Day')
                .addOption('week', 'Week')
                .addOption('month', 'Month')
                .addOption('tag', 'Tag')
                .addOption('priority', 'Priority')
                .setValue(this.config.groupBy || 'day')
                .onChange(value => {
                    this.config.groupBy = value;
                }
                ));

        new Setting(contentEl)
            .setName('Include/Exclude tags')
            .setDesc('Enter tags to include. Prefix with "-" to exclude a tag. Leave blank for all tags. e.g., #work, -#personal')
            .addTextArea(text => text
                .setPlaceholder('#include, -#exclude')
                .setValue(this.config.tags || '')
                .onChange(value => {
                    this.config.tags = value;
                }));


        // --- Action Buttons ---
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Save widget')
                .setCta()
                .onClick(async () => {
                    if (this.config.chartType !== 'bar') {
                        delete this.config.axisLabels;
                    }
                    await this.saveCallback(this.config);
                    this.close();
                }))
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => {
                    this.close();
                }));
    }
    onClose() {
        this.contentEl.empty();
    }

    getDefaultColorForType = (metricType) => {
        // A mapping from the metric dropdown options to the correct setting key suffix.
        const keyMap = {
            'cancelled': 'Cancelled',
            'someday': 'Cancelled',
            'overdue': 'Overdue',
            'in-progress': 'Inprogress',
            'created': 'Open',
            'open': 'Open',
            'due': 'Open',
            'completed': 'Completed'
        };

        // Find the correct suffix (e.g., 'Open') from the map.
        const keySuffix = keyMap[metricType];

        // If the metricType is not in our map (e.g., 'by-tag'), do nothing.
        if (!keySuffix) {
            // Find the metric in the config to get its current color.
            const metric = this.config.metrics.find(m => m.type === metricType);
            return metric ? metric.color : '#888888';
        }

        // Build the final setting key, e.g., "taskStatusColor" + "Open" -> "taskStatusColorOpen"
        const settingKey = `taskStatusColor${keySuffix}`;

        // Safely access the key directly from the main plugin settings.
        if (this.plugin.settings && this.plugin.settings[settingKey]) {
            return this.plugin.settings[settingKey];
        }
        // Return a default grey color if the setting is not found.
        return '#888888';
    };

    /**
     * Attaches a compact, inline RGBA color picker to an existing Setting control element.
     * @param {object} metric The metric object from the settings array (e.g., this.plugin.settings.pieChartMetrics[i]).
     * @param {string} propertyName The key of the color property on the metric object (e.g., 'color').
     * @param {string} defaultValue The default color to use for resetting.
     */
    createInlineColorPicker(controlEl, metric, propertyName, defaultValue) {
        // Make sure parseRgba and buildRgba are accessible here
        const parseRgba = (rgbaString) => {
            if (!rgbaString) return { color: '#000000', alpha: 1 };
            const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!match) return { color: rgbaString, alpha: 1 };
            const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
            const color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            return { color: color, alpha: match[4] !== undefined ? parseFloat(match[4]) : 1 };
        };

        const buildRgba = (hex, alpha) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) return 'rgba(0,0,0,1)';
            const r = parseInt(result[1], 16), g = parseInt(result[2], 16), b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const pickerContainer = controlEl.createDiv({ cls: 'cpwn-pm-inline-color-picker' });

        let colorPicker;

        const initialValue = metric[propertyName] || defaultValue;
        const { color: initialColor, alpha: initialAlpha } = parseRgba(initialValue);

        // Create a color input element directly
        colorPicker = pickerContainer.createEl('input', { type: 'color' });
        colorPicker.value = initialColor;

        // --- Create a popover for the slider and buttons ---
        const popover = new Menu();
        let isPopoverOpen = false;

        // Add Slider
        popover.addItem((item) => {
            item.setTitle('Opacity');
            const sliderEl = item.settingEl.createEl('input', {
                type: 'range',
                min: '0', max: '1', step: '0.05', value: String(initialAlpha)
            });
            sliderEl.style.width = '150px';
            sliderEl.oninput = async () => {
                const newRgba = buildRgba(colorPicker.value, sliderEl.value);
                metric[propertyName] = newRgba;
                colorPicker.style.backgroundColor = newRgba;
                await this.plugin.saveSettings();
                this.display(); // Refresh settings tab
            };
        });

        // Add Buttons to Popover
        popover.addSeparator();
        popover.addItem((item) => {
            item.setTitle('Copy')
                .setIcon('copy')
                .onClick(() => {
                    navigator.clipboard.writeText(metric[propertyName]);
                    new Notice('Color copied');
                });
        });
        popover.addItem((item) => {
            item.setTitle('Paste')
                .setIcon('paste')
                .onClick(async () => {
                    const text = await navigator.clipboard.readText();
                    metric[propertyName] = text;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh
                });
        });
        popover.addItem((item) => {
            item.setTitle('Reset')
                .setIcon('rotate-cw')
                .onClick(async () => {
                    metric[propertyName] = defaultValue;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh
                });
        });

        // --- Event listener to open the popover ---
        colorPicker.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the default color picker from opening immediately
            if (isPopoverOpen) return;
            popover.showAtMouseEvent(e);
            isPopoverOpen = true;
            popover.onHide(() => isPopoverOpen = false);
        });

        // We still need the hidden input for the main color selection
        colorPicker.addEventListener('input', async () => {
            const currentAlpha = parseRgba(metric[propertyName]).alpha;
            const newRgba = buildRgba(colorPicker.value, currentAlpha);
            metric[propertyName] = newRgba;
            colorPicker.style.backgroundColor = newRgba;
            await this.plugin.saveSettings();
            this.display();
        });

        // Set initial background color
        colorPicker.style.backgroundColor = initialValue;
        controlEl.appendChild(pickerContainer);
    }

    /**
     * Creates a complete RGBA color setting for the widget configuration.
     * @param {HTMLElement} containerEl The parent element for this setting.
     * @param {string} name The display name of the setting.
     * @param {string} desc The description for the setting.
     * @param {string} configKey The path to the value within `this.config` (e.g., 'metrics[0].color').
     * @param {string} defaultValue The default color value for the reset button.
     */
    createWidgetColorSetting(containerEl, name, desc, configKey, defaultValue) {
        const getWidgetConfigValue = (path) => {
            if (!path) return undefined;
            // This regex converts path['key'] or path[0] to path.key or path.0
            // and is robust enough for what we need.
            const keys = path.replace(/\[(\w+)\]/g, '.$1').replace(/\["(\w+)"\]/g, '.$1').replace(/\[\'(\w+)\'\]/g, '.$1').split('.');
            return keys.reduce((o, k) => (o || {})[k], this.config);
        };

        const setWidgetConfigValue = (path, value) => {
            if (!path) return;
            const keys = path.replace(/\[(\w+)\]/g, '.$1').replace(/\["(\w+)"\]/g, '.$1').replace(/\[\'(\w+)\'\]/g, '.$1').split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((o, k) => o[k] = o[k] || {}, this.config);
            target[lastKey] = value;
        };

        const parseRgba = (rgbaString) => {
            if (!rgbaString) return { color: '#000000', alpha: 1 };
            const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!match) return { color: rgbaString.startsWith('#') ? rgbaString : '#000000', alpha: 1 };
            const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
            const color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            return { color: color, alpha: match[4] !== undefined ? parseFloat(match[4]) : 1 };
        };

        const buildRgba = (hex, alpha) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) return 'rgba(0,0,0,1)';
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const setting = new Setting(containerEl)
            .setName(name)
            .setDesc(desc);

        let colorPicker;
        let slider;

        const initialValue = getWidgetConfigValue(configKey) || defaultValue;
        const { color: initialColor, alpha: initialAlpha } = parseRgba(initialValue);

        setting.addColorPicker(picker => {
            colorPicker = picker;
            picker
                .setValue(initialColor)
                .onChange(async (newColor) => {
                    const currentAlpha = slider ? slider.getValue() : 1;
                    const newRgba = buildRgba(newColor, currentAlpha);
                    setWidgetConfigValue(configKey, newRgba);
                    if (picker.colorEl) picker.colorEl.style.backgroundColor = newRgba;
                });
        });

        setting.addSlider(sliderComponent => {
            slider = sliderComponent;
            slider
                .setLimits(0, 1, 0.05)
                .setValue(initialAlpha)
                .setDynamicTooltip()
                .onChange(async (newAlpha) => {
                    const currentColor = colorPicker ? colorPicker.getValue() : '#000000';
                    const newRgba = buildRgba(currentColor, newAlpha);
                    setWidgetConfigValue(configKey, newRgba);
                    if (colorPicker && colorPicker.colorEl) colorPicker.colorEl.style.backgroundColor = newRgba;

                });
        });

        if (colorPicker && colorPicker.colorEl) {
            colorPicker.colorEl.style.backgroundColor = initialValue;
        }

        setting.addExtraButton(button => button.setIcon('copy').setTooltip('Copy color').onClick(() => {
            navigator.clipboard.writeText(getWidgetConfigValue(configKey));
            new Notice('Color copied');
        }));

        setting.addExtraButton(button => button.setIcon('paste').setTooltip('Paste color').onClick(async () => {
            const text = await navigator.clipboard.readText();
            if (!text.startsWith('rgba') && !text.startsWith('#')) {
                new Notice('Invalid color format in clipboard.');
                return;
            }
            setWidgetConfigValue(configKey, text);
            this.onOpen(); // Refresh modal to show changes
        }));

        setting.addExtraButton(button => button.setIcon('rotate-cw').setTooltip('Reset').onClick(async () => {
            setWidgetConfigValue(configKey, defaultValue);
            this.onOpen(); // Refresh modal
        }));
    }

    /**
     * Renders all date range controls.
     * @param {HTMLElement} parentContainer The container to render into.
     */
    renderDateRangeControls(parentContainer) {
        // Keep your initialization logic
        if (!this.config.dateRange) {
            this.config.dateRange = {
                look: 'back',
                value: 30,
                unit: 'days'
            };
        }
        if (!this.config.dateRange.forward) {
            this.config.dateRange.forward = {
                value: 0,
                unit: 'days'
            };
        }
        if (!this.config.dateRange.startDate) {
            this.config.dateRange.startDate = '';
        }
        if (this.config.dateRange.look === 'fixedStart' && this.config.dateRange.endDate === undefined) {
            this.config.dateRange.endDate = 'today';
        }

        // Single point of clearing the container
        parentContainer.empty();

        // Store reference
        this.dateRangeSection = parentContainer;

        // Main Date Range Dropdown 
        //const dateRangeSetting = 
        new Setting(parentContainer)
            .setName('Date range')
            .setDesc('Select a predefined range or a custom period. Note if the metric selected is \'Someday\', the date range will not apply.')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('all', 'All dates')
                    .addOption('back', 'Look back (custom)')
                    .addOption('forward', 'Look forward (custom)')
                    .addOption('custom', 'Custom range (back & forward)')
                    .addOption('fixedStart', 'Fixed start date')
                    .setValue(this.config.dateRange.look)
                    .onChange(value => {
                        this.config.dateRange.look = value;
                        // Trigger a full, clean re-render
                        this.renderDateRangeControls(parentContainer);
                    });
            });

        const lookValue = this.config.dateRange.look;

        // --- Conditional Controls ---
        // All subsequent controls are attached directly to parentContainer
        if (lookValue === 'back' || lookValue === 'forward') {
            const periodName = lookValue === 'back' ? 'Look back period' : 'Look forward period';
            new Setting(parentContainer)
                .setName(periodName)
                .addText(text => text
                    .setPlaceholder('30')
                    .setValue(this.config.dateRange.value || '30')
                    .onChange(value => this.config.dateRange.value = value))
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'days': 'Days',
                        'weeks': 'Weeks',
                        'months': 'Months'
                    })
                    .setValue(this.config.dateRange.unit || 'days')
                    .onChange(value => this.config.dateRange.unit = value));
        } else if (lookValue === 'custom') {
            new Setting(parentContainer)
                .setName('Look back period')
                .addText(text => text
                    .setPlaceholder('30')
                    .setValue(this.config.dateRange.value || '30')
                    .onChange(value => this.config.dateRange.value = value))
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'days': 'Days',
                        'weeks': 'Weeks',
                        'months': 'Months'
                    })
                    .setValue(this.config.dateRange.unit || 'days')
                    .onChange(value => this.config.dateRange.unit = value));

            new Setting(parentContainer)
                .setName('Look forward period')
                .addText(text => text
                    .setPlaceholder('7')
                    .setValue(this.config.dateRange.forward.value || '7')
                    .onChange(value => this.config.dateRange.forward.value = value))
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'days': 'Days',
                        'weeks': 'Weeks',
                        'months': 'Months'
                    })
                    .setValue(this.config.dateRange.forward.unit || 'days')
                    .onChange(value => this.config.dateRange.forward.unit = value));
        } else if (lookValue === 'fixedStart') {
            new Setting(parentContainer)
                .setName('Start date')
                .setDesc('Select a fixed start date.')
                .then(setting => {
                    const dateInput = createEl('input', {
                        type: 'date'
                    });
                    dateInput.addClass('text-input');
                    if (this.config.dateRange.startDate) {
                        dateInput.value = moment(this.config.dateRange.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
                    }
                    dateInput.addEventListener('change', (e) => {
                        const newDate = moment(e.target.value, 'YYYY-MM-DD');
                        if (newDate.isValid()) {
                            this.config.dateRange.startDate = newDate.format('YYYY-MM-DD');
                        }
                    });
                    setting.controlEl.appendChild(dateInput);
                });

            new Setting(parentContainer)
                .setName('End date')
                .setDesc("Select 'Today', 'Look forward' or 'Auto look ahead'. For 'Look forward' a number of options to set an end date for the chart will be available. For 'Auto look ahead' the chart will auto end at the last date in the dataset plus 2 weeks.")
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('today', 'Today')
                        .addOption('forward', 'Look forward')
                        .addOption('autoLookAhead', 'Auto look ahead')
                        .setValue(this.config.dateRange.endDate === 'forward' ? 'forward' : 'today')
                        .setValue(this.config.dateRange.endDate || 'today') 
                        .onChange(value => {
                            this.config.dateRange.endDate = value;
                            // Just trigger a re-render. Do NOT empty the container here.
                            this.renderDateRangeControls(parentContainer);
                        });
                });

            if (this.config.dateRange.endDate === 'forward') {
                new Setting(parentContainer) // Corrected from this.dateRangeSettingsEl
                    .setName('Look forward from')
                    .setDesc('Look forward from the fixed start date or from the current rolling date.')
                    .addDropdown(dropdown => {
                        dropdown
                            .addOption('startDate', 'Start date')
                            .addOption('currentDate', 'Current date')
                            .setValue(this.config.lookForwardFrom || 'startDate')
                            .onChange(value => {
                                this.config.lookForwardFrom = value;
                            });
                    });

                new Setting(parentContainer) // Corrected from controlsContainer
                    .setName('Look forward period')
                    .addText(text => text
                        .setPlaceholder('30')
                        .setValue(this.config.dateRange.forward?.value || '30')
                        .onChange(value => {
                            if (!this.config.dateRange.forward) this.config.dateRange.forward = {};
                            this.config.dateRange.forward.value = value;
                        }))
                    .addDropdown(dropdown => dropdown
                        .addOptions({
                            'days': 'Days',
                            'weeks': 'Weeks',
                            'months': 'Months'
                        })
                        .setValue(this.config.dateRange.forward?.unit || 'days')
                        .onChange(value => {
                            if (!this.config.dateRange.forward) this.config.dateRange.forward = {};
                            this.config.dateRange.forward.unit = value;
                        }));
            }
        }
    }
    onClose() {
        this.contentEl.empty();
    }
}
