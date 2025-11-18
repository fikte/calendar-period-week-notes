// src/modals/SectionHeaderModal.js
import { Modal, Setting } from 'obsidian';

export class SectionHeaderModal extends Modal {
    constructor(app, plugin, onSave, existingConfig = null) {
        super(app);
        this.plugin = plugin;
        this.onSave = onSave;

        // Merge existingConfig with defaults to ensure all fields are present
        const defaultConfig = {
            name: 'New section',
            icon: '',
            iconColor: 'rgba(74, 144, 226, 1)',
            textColor: 'rgba(255, 255, 255, 1)',
            fontWeight: 'bold',
            fontSize: 16,
            isVisible: true,
            showChevron: 'global',
            textAlign: 'left'
        };

        // If existingConfig exists, merge it with defaults
        this.config = existingConfig
            ? { ...defaultConfig, ...existingConfig }
            : defaultConfig;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Create section header' });

        // Section Name
        new Setting(contentEl)
            .setName('Section name')
            .setDesc('Enter a name for this section')
            .addText(text => text
                .setPlaceholder('My section')
                .setValue(this.config.name)
                .onChange(value => {
                    this.config.name = value;
                }));

        new Setting(contentEl)
            .setName('Visible')
            .setDesc('Toggle whether this section header is visible on the dashboard. Having the section header enabled but hidden allows you to use it for grouping widgets without affecting if a section header that\s above is being toggled to show and hide over time, i.e. this section of grouped widgets will always be visible.')
            .addToggle(toggle => toggle
                .setValue(this.config.isVisible ?? true) // Default to true if not set
                .onChange(value => {
                    this.config.isVisible = value;
                }));


        new Setting(contentEl)
            .setName('Show collapse chevron')
            .setDesc(`Control the expand/collapse chevron. Global setting: ${this.plugin.settings.showSectionHeaderChevrons ? 'ON' : 'OFF'}`)
            .addDropdown(dropdown => dropdown
                .addOption('global', 'Use global setting')
                .addOption('show', 'Always show')
                .addOption('hide', 'Always hide')
                .setValue(this.config.showChevron || 'global')
                .onChange(value => {
                    this.config.showChevron = value;
                }));

        // Icon Selection - SIMPLIFIED VERSION
        new Setting(contentEl)
            .setName('Section icon')
            .setDesc('Choose an icon for this section')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('', '— None —')
                    .addOptions({
                        'folder': 'Folder',
                        'layers': 'Layers',
                        'package': 'Package',
                        'box': 'Box',
                        'grid': 'Grid',
                        'list': 'List',
                        'layout-dashboard': 'Dashboard',
                        'folder-open': 'Folder open'
                    })
                    .setValue(this.config.icon)
                    .onChange(value => {
                        this.config.icon = value;
                    });
            });

        // Icon Color
        this.createColorSetting(contentEl, 'Icon color', 'iconColor');

        // Text Color
        this.createColorSetting(contentEl, 'Text color', 'textColor');

        new Setting(contentEl)
            .setName('Text alignment')
            .setDesc('Choose the alignment of the section header text and icon')
            .addDropdown(dropdown => dropdown
                .addOption('left', 'Left')
                .addOption('center', 'Center')
                .addOption('right', 'Right')
                .setValue(this.config.textAlign || 'left')
                .onChange(value => {
                    this.config.textAlign = value;
                }));

        // Font Weight
        new Setting(contentEl)
            .setName('Font style')
            .setDesc('Choose the font style')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('normal', 'Normal')
                    .addOption('bold', 'Bold')
                    .addOption('italic', 'Italic')
                    .setValue(this.config.fontWeight)
                    .onChange(value => {
                        this.config.fontWeight = value;
                    });
            });

        // Font Size
        new Setting(contentEl)
            .setName('Font size')
            .setDesc('Set the font size (px)')
            .addSlider(slider => {
                slider
                    .setLimits(12, 24, 1)
                    .setValue(this.config.fontSize)
                    .setDynamicTooltip()
                    .onChange(value => {
                        this.config.fontSize = value;
                    });
            });

        // Save Button
        new Setting(contentEl)
            .addButton(button => {
                button
                    .setButtonText('Save')
                    .setCta()
                    .onClick(() => {
                        this.onSave(this.config);
                        this.close();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('Cancel')
                    .onClick(() => {
                        this.close();
                    });
            });
    }

    createColorSetting(container, name, configKey) {
        let colorPicker, slider;
        const { color: initialColor, alpha: initialAlpha } = this.parseRgba(this.config[configKey]);

        const setting = new Setting(container)
            .setName(name);

        setting.addColorPicker(picker => {
            colorPicker = picker;
            picker
                .setValue(initialColor)
                .onChange(newColor => {
                    const currentAlpha = slider ? slider.getValue() : 1;
                    this.config[configKey] = `rgba(${parseInt(newColor.slice(1, 3), 16)}, ${parseInt(newColor.slice(3, 5), 16)}, ${parseInt(newColor.slice(5, 7), 16)}, ${currentAlpha})`;
                });
        });

        setting.addSlider(sliderComponent => {
            slider = sliderComponent;
            slider
                .setLimits(0, 1, 0.05)
                .setValue(initialAlpha)
                .setDynamicTooltip()
                .onChange(newAlpha => {
                    const currentColor = colorPicker ? colorPicker.getValue() : '#000000';
                    this.config[configKey] = `rgba(${parseInt(currentColor.slice(1, 3), 16)}, ${parseInt(currentColor.slice(3, 5), 16)}, ${parseInt(currentColor.slice(5, 7), 16)}, ${newAlpha})`;
                });
        });
    }

    parseRgba(rgbaString) {
        if (!rgbaString) return { color: '#000000', alpha: 1 };
        const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return { color: '#000000', alpha: 1 };
        const color = '#' + ((1 << 24) + (parseInt(match[1]) << 16) + (parseInt(match[2]) << 8) + parseInt(match[3])).toString(16).slice(1);
        return { color, alpha: match[4] !== undefined ? parseFloat(match[4]) : 1 };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

