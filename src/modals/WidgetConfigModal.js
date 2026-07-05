// src/modals/WidgetConfigModal.js
import { Modal, Setting } from 'obsidian';

export class WidgetConfigModal extends Modal {
    constructor(app, widgetKey, plugin, onSave) {
        super(app);
        this.widgetKey = widgetKey;
        this.plugin = plugin;
        this.onSave = onSave;
        
        // Load existing overrides or defaults
        this.overrides = this.plugin.settings.widgetOverrides?.[this.widgetKey] || {};
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Configure Core Widget' });

        // 1. Custom Title
        new Setting(contentEl)
            .setName('Custom Title')
            .setDesc('Leave blank to use the default title.')
            .addText(text => text
                .setPlaceholder('Default')
                .setValue(this.overrides.customTitle || '')
                .onChange(value => {
                    this.overrides.customTitle = value;
                }));

        // 2. Override Title Visibility
        new Setting(contentEl)
            .setName('Show Title')
            .setDesc('Override the global setting for this specific widget.')
            .addDropdown(dropdown => dropdown
                .addOption('default', 'Default (Global)')
                .addOption('show', 'Always Show')
                .addOption('hide', 'Always Hide')
                .setValue(this.overrides.showTitle || 'default')
                .onChange(value => {
                    this.overrides.showTitle = value;
                }));

        // 3. Override Chevron Visibility
        new Setting(contentEl)
            .setName('Show Chevron')
            .setDesc('Override the global setting for this specific widget.')
            .addDropdown(dropdown => dropdown
                .addOption('default', 'Default (Global)')
                .addOption('show', 'Always Show')
                .addOption('hide', 'Always Hide')
                .setValue(this.overrides.showChevron || 'default')
                .onChange(value => {
                    this.overrides.showChevron = value;
                }));

        // 4. Save Button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Save')
                .setCta()
                .onClick(async () => {
                    // Initialize overrides object if missing
                    if (!this.plugin.settings.widgetOverrides) {
                        this.plugin.settings.widgetOverrides = {};
                    }
                    
                    // Save to settings
                    this.plugin.settings.widgetOverrides[this.widgetKey] = this.overrides;
                    await this.plugin.saveSettings();
                    
                    // Trigger callback to refresh UI
                    if (this.onSave) this.onSave();
                    
                    this.close();
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}
