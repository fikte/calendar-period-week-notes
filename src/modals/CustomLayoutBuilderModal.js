import { Modal, Setting, setIcon } from 'obsidian';

const AVAILABLE_ITEMS = [
    { type: 'priority', label: 'Priority', icon: 'alert-triangle' },
    { type: 'title', label: 'Task Text', icon: 'type' },
    { type: 'due_date', label: 'Due Date', icon: 'calendar' },
    { type: 'start_date', label: 'Start Date', icon: 'calendar-plus' },
    { type: 'scheduled_date', label: 'Scheduled', icon: 'calendar-clock' },
    { type: 'completion_date', label: 'Completion Date', icon: 'check-square' },
    { type: 'alert', label: 'Alert', icon: 'alarm-clock' },
    { type: 'recurrence', label: 'Recurrence', icon: 'rotate-cw' },
    { type: 'id', label: 'Task ID', icon: 'fingerprint' },
    { type: 'depends_on', label: 'Depends On', icon: 'link' },
    { type: 'tags', label: 'Tags', icon: 'hash' },
    { type: 'source', label: 'File / Source', icon: 'file-text' },
    { type: 'spacer', label: 'Spacer (Push Right)', icon: 'arrow-right' },
    { type: 'separator', label: 'Text / Separator', icon: 'type' }

];

export class CustomLayoutBuilderModal extends Modal {
    constructor(app, existingConfig, onSave) {
        super(app);
        this.onSave = onSave;
        this.activePopover = null;
        this.colorCheckboxByPriority = false;

        this.rows = {
            row1: { items: [], align: 'center', justify: 'start' },
            row2: { items: [], align: 'center', justify: 'start' },
            row3: { items: [], align: 'center', justify: 'start' },
            row4: { items: [], align: 'center', justify: 'start' },
            row5: { items: [], align: 'center', justify: 'start' },
            row6: { items: [], align: 'center', justify: 'start' }
        };

        if (existingConfig && existingConfig.items) {
            this.loadFromConfig(existingConfig);
            if (existingConfig.options && existingConfig.options.colorCheckboxByPriority) {
                this.colorCheckboxByPriority = true;
            }
        } else {
            // Default Starter Template
            this.rows.row1.items = [{ type: 'priority' }, { type: 'title' }];
            this.rows.row2.items = [
                { type: 'due_date', fontSize: 'small', textStyle: 'muted' },
                { type: 'spacer' },
                { type: 'tags', fontSize: 'small', textStyle: 'muted' }
            ];
        }
    }

    loadFromConfig(config) {
        try {
            const contentArea = config.items.find(i => i.area === 'content');
            if (contentArea && contentArea.items) {
                ['row1', 'row2', 'row3', 'row4', 'row5', 'row6'].forEach((key, idx) => {
                    const rowConfig = contentArea.items[idx];
                    if (rowConfig) {
                        this.rows[key].items = rowConfig.items || [];
                        this.rows[key].align = rowConfig.align || 'center';
                        this.rows[key].justify = rowConfig.justify || 'start';
                        this.rows[key].indent = rowConfig.indent || false;
                        this.rows[key].isFlow = rowConfig.isFlow || false;
                    }
                });
            }
        } catch (e) { console.error(e); }
    }

    onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass('cpwn-custom-layout-modal');

        contentEl.empty();
        contentEl.addClass('cpwn-layout-builder');

        contentEl.createEl('h2', { text: 'Custom layout builder' });
        contentEl.createEl('p', {
            text: 'Drag items to rows. Click any item to edit style or remove it.',
            cls: 'setting-item-description'
        });

        const container = contentEl.createDiv({ cls: 'cpwn-builder-container' });

        // Split into two dedicated wrappers so we can re-render the sidebar
        this.sidebarContainer = container.createDiv({ cls: 'cpwn-builder-sidebar-wrapper' });
        this.canvasContainer = container.createDiv({ cls: 'cpwn-builder-canvas-wrapper' });

        // Initial renders
        this.refreshSidebar();
        this.renderCanvas(this.canvasContainer);

        const footer = contentEl.createDiv({ cls: 'modal-button-container' });
        new Setting(footer)
            .addButton(btn => btn.setButtonText('Cancel').onClick(() => this.close()))
            .addButton(btn =>
                btn.setButtonText('Save Layout')
                    .setCta()
                    .onClick(() => this.saveAndClose())
            );
    }

    refreshSidebar() {
        if (!this.sidebarContainer) return;
        this.sidebarContainer.empty();
        this.renderSidebar(this.sidebarContainer);
    }


    // In CustomLayoutBuilderModal.js

    renderSidebar(parent) {
        const sidebar = parent.createDiv({ cls: 'cpwn-builder-sidebar' });

        sidebar.createEl('h4', { text: 'Layout options' });

        const optionsContainer = sidebar.createDiv({ cls: 'cpwn-sidebar-options' });
        optionsContainer.style.marginBottom = '20px'; // Spacing

        // Create Toggle
        new Setting(optionsContainer)
            .setName('Color checkbox by priority')
            .setDesc('Tint the checkbox border based on task priority')
            .addToggle(toggle => {
                toggle
                    .setValue(this.colorCheckboxByPriority)
                    .onChange(val => {
                        this.colorCheckboxByPriority = val;
                        // Optional: Visual feedback?
                    });
            });


        sidebar.createEl('h4', { text: 'Items' });

        // 1. Scan current layout to find used types
        const usedTypes = new Set();
        Object.values(this.rows).forEach(row => {
            row.items.forEach(item => usedTypes.add(item.type));
        });

        AVAILABLE_ITEMS.forEach(item => {
            const el = sidebar.createDiv({ cls: 'cpwn-draggable-item' });

            // 2. Check if item is used
            const isUsed = usedTypes.has(item.type);

            // Optional: Allow duplicates for specific types like Spacer?
            // If you want Spacer to be reusable, skip this check for 'spacer'
            if (isUsed && item.type !== 'spacer') {
                el.addClass('is-used');
                // Optional: Make it non-draggable if you want to enforce uniqueness
                // el.draggable = false; 
                // el.style.opacity = '0.5';
                // el.style.cursor = 'not-allowed';
            }

            el.draggable = true; // Keep draggable if you allow duplicates, otherwise logic above

            const icon = el.createSpan({ cls: 'cpwn-item-icon' });
            setIcon(icon, item.icon);
            el.createSpan({ text: item.label });

            // Visual indicator (optional checkmark)
            if (isUsed && item.type !== 'spacer') {
                const check = el.createSpan({ cls: 'cpwn-item-used-indicator' });
                setIcon(check, 'check');
            }

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(item));
            });
        });
    }


    renderCanvas(parent) {
        const canvas = parent.createDiv({ cls: 'cpwn-builder-canvas' });
        this.createDropZone(canvas, 'Row 1 (Top)', 'row1');
        this.createDropZone(canvas, 'Row 2', 'row2');
        this.createDropZone(canvas, 'Row 3', 'row3');
        this.createDropZone(canvas, 'Row 4', 'row4');
        this.createDropZone(canvas, 'Row 5', 'row5');
        this.createDropZone(canvas, 'Row 6 (Bottom)', 'row6');
    }

    createDropZone(parent, label, rowKey) {
        const container = parent.createDiv({ cls: 'cpwn-row-container' });

        const header = container.createDiv({ cls: 'cpwn-row-header-controls' });
        header.createSpan({ text: label, cls: 'cpwn-row-label' });

        const controls = header.createDiv({ cls: 'cpwn-align-controls' });

        if (['row2', 'row3', 'row4', 'row5', 'row6'].includes(rowKey)) {
            const indentLabel = controls.createEl('label', {
                cls: 'cpwn-indent-label',
                style: 'display:flex; align-items:center; font-size:11px; margin-right:8px; gap:4px; cursor:pointer;'
            });

            const cb = indentLabel.createEl('input', { type: 'checkbox' });
            cb.checked = this.rows[rowKey].indent === true;
            cb.onchange = (e) => this.rows[rowKey].indent = e.target.checked;

            indentLabel.createSpan({ text: 'Indent' });
        }

        // Horizontal Align
        const justifySelect = controls.createEl('select', { cls: 'cpwn-align-select' });
        justifySelect.title = "Horizontal Alignment";
        [
            { v: 'start', l: 'Left' },
            { v: 'center', l: 'Center' },
            { v: 'end', l: 'Right' },
            { v: 'space-between', l: 'Spread' }
        ].forEach(o => {
            const opt = justifySelect.createEl('option', { text: o.l, value: o.v });
            if (this.rows[rowKey].justify === o.v) opt.selected = true;
        });
        justifySelect.onchange = (e) => this.rows[rowKey].justify = e.target.value;

        const flowLabel = controls.createEl('label', {
            cls: 'cpwn-flow-label',
            style: 'display:flex; align-items:center; font-size:11px; margin-right:8px; gap:4px; cursor:pointer;'
        });

        const flowCb = flowLabel.createEl('input', { type: 'checkbox' });
        flowCb.checked = this.rows[rowKey].isFlow === true;
        flowCb.onchange = (e) => {
            this.rows[rowKey].isFlow = e.target.checked;

            // 2. Re-render the visual items for this specific zone
            this.renderZoneItems(zone, rowKey);

            // 3. Trigger the preview update (if your system uses this.updatePreview)
            // Make sure to add a safety check if tempLayout exists
            if (this.tempLayout && this.tempLayout.items) {
                const areaConfig = this.tempLayout.items.find(area => area.area === rowKey);
                if (areaConfig) {
                    areaConfig.isFlow = e.target.checked;
                }
            }
        };

        flowLabel.createSpan({ text: 'Flow' });

        // Vertical Align
        const alignSelect = controls.createEl('select', { cls: 'cpwn-align-select' });
        alignSelect.title = "Vertical Alignment";
        [
            { v: 'center', l: 'Middle' },
            { v: 'start', l: 'Top' },
            { v: 'end', l: 'Bottom' },
            { v: 'baseline', l: 'Text base' }
        ].forEach(o => {
            const opt = alignSelect.createEl('option', { text: o.l, value: o.v });
            if (this.rows[rowKey].align === o.v) opt.selected = true;
        });
        alignSelect.onchange = (e) => this.rows[rowKey].align = e.target.value;

        const zone = container.createDiv({ cls: 'cpwn-drop-zone' });
        zone.dataset.rowKey = rowKey;

        this.renderZoneItems(zone, rowKey);

        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.addClass('cpwn-drag-over'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.removeClass('cpwn-drag-over');

            const rawData = e.dataTransfer.getData('application/json');
            if (!rawData) return;

            const data = JSON.parse(rawData);
            let itemToMove = null;

            // --- STEP 1: Identify the Item ---
            if (data.isMove) {
                // Existing item: Get it from source
                const sourceRow = this.rows[data.originalRow];
                itemToMove = sourceRow.items[data.originalIndex];

                // Remove from source array immediately
                if (itemToMove) {
                    sourceRow.items.splice(data.originalIndex, 1);
                }
            } else {
                // New item from sidebar
                itemToMove = { type: data.type };
            }

            if (!itemToMove) return; // Safety bail

            // --- STEP 2: Calculate Drop Index ---
            // We find the element under the mouse to know where to insert
            const siblings = [...zone.querySelectorAll('.cpwn-placed-item')];

            // Find the sibling that is physically *after* our mouse cursor
            // If we find one, we insert before it. If not, we append to end.
            const afterElement = siblings.find(child => {
                const rect = child.getBoundingClientRect();
                return e.clientX < (rect.left + rect.width / 2);
                //const centerX = rect.left + rect.width / 2;
                //return e.clientX < centerX; // Mouse is to the left of this item's center
            });

            // Calculate the new index
            // If we found an element, get its index (from the DOM list). 
            // Since we already removed the item from the array (if it was in this row),
            // the DOM might still have the 'ghost' of the dragged item if we didn't refresh yet,
            // but typically this calculation works well for "drop targets".
            // let newIndex;
            let newIndex = afterElement ? siblings.indexOf(afterElement) : this.rows[rowKey].items.length;

            // --- STEP 3: Insert & Render ---
            // Insert at specific index
            this.rows[rowKey].items.splice(newIndex, 0, itemToMove);

            // Re-render THIS row
            this.renderZoneItems(zone, rowKey);
            this.refreshSidebar();

            // Re-render SOURCE row (if different)
            if (data.isMove && data.originalRow !== rowKey) {
                const otherZone = this.contentEl.querySelector(`div[data-row-key="${data.originalRow}"]`);
                if (otherZone) this.renderZoneItems(otherZone, data.originalRow);
            }
        });
    }

    // 1. Helper to close existing popups (PREVENTS CRASHES)
    closeActivePopover() {
        if (this.activePopover) {
            this.activePopover.remove();
            this.activePopover = null;
        }
        // Remove the document listener if it exists
        if (this._outsideClickListener) {
            document.removeEventListener('click', this._outsideClickListener);
            this._outsideClickListener = null;
        }
    }

    renderZoneItems(zone, rowKey) {
        zone.empty();

        if (!this.rows[rowKey] || !this.rows[rowKey].items) return;

        if (this.rows[rowKey].items.length === 0) {
            const placeholder = zone.createDiv({
                cls: 'cpwn-builder-placeholder',
                text: 'Drop items here'
            });
            placeholder.style.color = 'var(--text-faint)';
            placeholder.style.fontSize = '11px';
            placeholder.style.pointerEvents = 'none'; // Important: don't block the drop
            return;
        }

        this.rows[rowKey].items.forEach((item, idx) => {
            const el = zone.createDiv({ cls: 'cpwn-placed-item' });

            // 1. Apply Size & Style Classes
            if (item.fontSize === 'tiny') el.addClass('cpwn-font-tiny');
            if (item.fontSize === 'small') el.addClass('cpwn-font-small');
            if (item.fontSize === 'large') el.addClass('cpwn-font-large');
            if (item.textStyle === 'muted') el.addClass('cpwn-item-style-muted');

            // 2. Apply Text Color (Directly)
            if (item.color) {
                el.style.color = item.color;
            } else {
                el.style.color = '';
            }

            // 3. Apply Background Color (Tags only)
            if (item.type === 'tags' && item.backgroundColor) {
                let bg = item.backgroundColor;
                const alpha = item.bgOpacity !== undefined ? item.bgOpacity : 1;

                // Inline Hex to RGBA
                if (alpha < 1 && /^#([A-Fa-f0-9]{3}){1,2}$/.test(bg)) {
                    let c = bg.substring(1).split('');
                    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                    c = '0x' + c.join('');
                    bg = 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
                }

                el.style.backgroundColor = bg;
                el.style.borderRadius = '12px'; // Make it look like a pill
                el.style.border = 'none';      // Remove default border
            } else {
                el.style.backgroundColor = '';
                el.style.border = '';
            }

            // 4. Apply Global Opacity
            if (item.opacity) {
                el.style.opacity = item.opacity;
            } else {
                el.style.opacity = '';
            }


            // 5. CONTENT
            const def = AVAILABLE_ITEMS.find(i => i.type === item.type);
            if (item.type === 'spacer') {
                el.addClass('cpwn-item-spacer');
                el.setText('↔ Spacer');
            } else if (item.type === 'separator') {
                // NEW: Render the separator text
                el.addClass('cpwn-item-separator'); // Optional styling class
                el.setText(item.text || '-');       // Show the text (default to -)
                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
                el.style.padding = '0 4px';
            } else {
                // Render Icon + Label for better preview
                // el.setText(def ? def.label : item.type); <-- OLD

                // NEW: Icon + Text
                const iconSpan = el.createSpan({ cls: 'cpwn-builder-icon' });
                setIcon(iconSpan, def ? def.icon : 'box');
                iconSpan.style.marginRight = '6px';
                iconSpan.style.width = '1em'; // Prevent icon jumping

                el.createSpan({ text: def ? def.label : item.type });

                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
            }

            // 6. INTERACTIONS
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openStylePopover(item, el, () => {
                    this.renderZoneItems(zone, rowKey);
                });
            });

            el.draggable = true;
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    type: item.type,
                    originalIndex: idx,
                    originalRow: rowKey,
                    isMove: true
                }));
            });
        });
    }

    openStylePopover(item, targetEl, onUpdate) {
        // 1. Close existing
        if (this.activePopover) {
            this.activePopover.remove();
            this.activePopover = null;
        }

        // 2. Create Popover (Start Hidden for Measurement)
        //const popover = document.body.createDiv({ cls: 'cpwn-popup' });
        const popover = this.modalEl.createDiv({ cls: 'cpwn-popup' });
        this.activePopover = popover;

        // HIDE initially to calculate size without flashing
        popover.style.visibility = 'hidden';
        popover.style.display = 'block';
        popover.style.position = 'fixed';
        popover.style.zIndex = '9999';

        // 3. Render All Content First (So we have dimensions)
        this.renderPopoverContent(popover, item, onUpdate);

        // 4. Calculate Position with Collision Detection
        const rect = targetEl.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const popRect = popover.getBoundingClientRect();

        // Default: Below the target
        let top = rect.bottom + scrollY + 8;
        let left = rect.left + scrollX;

        // CHECK RIGHT EDGE
        if (rect.left + popRect.width > viewportWidth - 10) {
            // Align right edge of popup with right edge of target (or viewport)
            left = (rect.right + scrollX) - popRect.width;

            // Safety: don't go off left screen
            if (left < 10) left = 10;
        }

        // CHECK BOTTOM EDGE
        // If the popup goes below the viewport, flip it to ABOVE the target
        if (rect.bottom + popRect.height + 20 > viewportHeight) {
            top = (rect.top + scrollY) - popRect.height - 8;
        }

        // Apply Calculated Positions
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
        popover.style.visibility = 'visible'; // Show it now

        // 5. Stop Propagation
        const stop = (e) => e.stopPropagation();
        popover.addEventListener('mousedown', stop);
        popover.addEventListener('click', stop);

        // 6. Global Close Listener
        const closeFn = () => {
            if (this.activePopover) { this.activePopover.remove(); this.activePopover = null; }
            document.removeEventListener('click', closeFn);
        };

        setTimeout(() => {
            document.addEventListener('click', closeFn);
        }, 50);
    }


    // --- Helper to render content (Keeps your exact UI logic) ---
    renderPopoverContent(popover, item, onUpdate) {
        const prettyTitle = item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ');
        popover.createDiv({
            text: prettyTitle,
            cls: 'cpwn-custom-layout-section-header',
            style: 'border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 8px; margin-bottom: 10px;'
        });

        if (item.type === 'separator') {
            const textLabel = popover.createDiv({ text: 'Content', cls: 'cpwn-custom-layout-section-header' });

            const input = popover.createEl('input', {
                type: 'text',
                value: item.text || '-'
            });
            input.style.width = '100%';
            input.style.marginBottom = '12px';

            input.oninput = (e) => {
                item.text = e.target.value;
            };

            input.onchange = (e) => {
                onUpdate();
            };

            // --- NEW: Force Display Toggle ---
            const visibilityLabel = popover.createDiv({
                text: 'Visibility',
                cls: 'cpwn-custom-layout-section-header',
                style: 'margin-top: 4px; margin-bottom: 4px;'
            });

            const toggleRow = popover.createDiv({
                style: 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px;'
            });

            const forceCb = toggleRow.createEl('input', { type: 'checkbox' });
            forceCb.checked = item.forceDisplay === true;

            toggleRow.createSpan({
                text: 'Always show (ignore neighbors)',
                style: 'font-size: 11px; color: var(--text-muted);'
            });

            forceCb.onchange = (e) => {
                item.forceDisplay = e.target.checked;
                onUpdate();
            };
        }

        // Helper: Segmented Control
        const createSegmentedControl = (label, options, currentVal, onSelect) => {
            const wrapper = popover.createDiv({ style: 'margin-bottom: 12px;' });
            wrapper.createDiv({ text: label, cls: 'cpwn-custom-layout-section-header' });
            const group = wrapper.createDiv({ cls: 'cpwn-btn-group' });

            options.forEach(opt => {
                const btn = group.createEl('button', { text: opt.label });
                if (currentVal === opt.value) btn.addClass('is-active');

                btn.onclick = () => {
                    group.querySelectorAll('button').forEach(b => b.removeClass('is-active'));
                    btn.addClass('is-active');
                    onSelect(opt.value);
                    onUpdate();
                };
            });
        };

        // 1. Size
        createSegmentedControl('Size',
            [
                { label: 'Tiny', value: 'tiny' },
                { label: 'Small', value: 'small' },
                { label: 'Normal', value: undefined },
                { label: 'Large', value: 'large' }
            ],
            item.fontSize, (val) => item.fontSize = val
        );

        // 2. Style
        createSegmentedControl('Style',
            [{ label: 'Normal', value: undefined }, { label: 'Muted', value: 'muted' }],
            item.textStyle, (val) => item.textStyle = val
        );

        // 3. Text Color
        createSegmentedControl('Text Color',
            [
                { label: 'Default', value: undefined },
                { label: 'Accent', value: 'var(--text-accent)' },
                { label: 'Muted', value: 'var(--text-muted)' }
            ],
            item.color, (val) => item.color = val
        );

        // 4. Custom Color & Opacity Row (FOR TEXT)
        const customLabel = popover.createDiv({ text: 'Text color & opacity', cls: 'cpwn-custom-layout-section-header' });
        const customRow = popover.createDiv({
            cls: 'cpwn-color-row',
            style: 'display: flex; align-items: center; gap: 8px;'
        });

        // A. Real Color Picker (Text)
        const colorPreview = customRow.createDiv({ cls: 'cpwn-color-preview' });
        colorPreview.style.position = 'relative';
        colorPreview.style.width = '24px';
        colorPreview.style.height = '24px';
        colorPreview.style.borderRadius = '50%'; // CIRCLE
        colorPreview.style.backgroundColor = item.color || 'var(--text-normal)';
        colorPreview.style.border = '1px solid var(--background-modifier-border)';

        const colorInput = colorPreview.createEl('input', { type: 'color' });
        colorInput.style.opacity = '0';
        colorInput.style.position = 'absolute';
        colorInput.style.top = '0'; colorInput.style.left = '0';
        colorInput.style.width = '100%'; colorInput.style.height = '100%';
        colorInput.style.cursor = 'pointer';

        if (item.color && item.color.startsWith('#')) {
            colorInput.value = item.color;
        }

        colorInput.oninput = (e) => {
            item.color = e.target.value;
            colorPreview.style.backgroundColor = item.color;
            onUpdate();
        };

        // B. Text Opacity Slider
        const sliderTxtContainer = customRow.createDiv({
            cls: 'cpwn-slider-container',
            style: 'display: flex; align-items: center; gap: 6px; flex-grow: 1;'
        });

        const opacityTxtSlider = sliderTxtContainer.createEl('input', { type: 'range', cls: 'cpwn-slider' });
        opacityTxtSlider.style.flexGrow = '1';
        opacityTxtSlider.min = "0.1"; opacityTxtSlider.max = "1"; opacityTxtSlider.step = "0.1";
        // Use 'opacity' property for text/global
        opacityTxtSlider.value = item.opacity || "1";

        const sliderTxtValueLabel = sliderTxtContainer.createSpan({
            text: `${Math.round((item.opacity || 1) * 100)}%`,
            style: 'min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; font-size: 11px; color: var(--text-muted);'
        });

        opacityTxtSlider.oninput = (e) => {
            const val = e.target.value;
            item.opacity = val;
            sliderTxtValueLabel.setText(`${Math.round(val * 100)}%`);
            onUpdate();
        };

        // C. Clear Button (NEW)
        const clearTxtBtn = customRow.createEl('button', { text: 'Clear' });
        clearTxtBtn.style.fontSize = '11px';
        clearTxtBtn.style.padding = '2px 8px';
        clearTxtBtn.style.height = '24px';
        clearTxtBtn.onclick = () => {
            delete item.color;
            delete item.opacity;

            // Reset visual state
            colorPreview.style.backgroundColor = 'var(--text-normal)'; // or transparent
            opacityTxtSlider.value = "1";
            sliderTxtValueLabel.setText('100%');
            onUpdate();
        };

        // 5. Background Color & Opacity (ONLY FOR TAGS)
        if (item.type === 'tags') {
            const bgLabel = popover.createDiv({
                text: 'Tag pill background',
                cls: 'cpwn-custom-layout-section-header',
                style: 'margin-top: 12px;'
            });

            const bgRow = popover.createDiv({
                cls: 'cpwn-color-row',
                style: 'display: flex; align-items: center; gap: 8px;'
            });

            // A. Background Color Picker
            const bgPreview = bgRow.createDiv({ cls: 'cpwn-color-preview' });
            bgPreview.style.position = 'relative';
            bgPreview.style.width = '24px';
            bgPreview.style.height = '24px';
            bgPreview.style.borderRadius = '50%'; // CIRCLE
            bgPreview.style.backgroundColor = item.backgroundColor || 'var(--background-modifier-border)';
            bgPreview.style.border = '1px solid var(--background-modifier-border)';

            const bgInput = bgPreview.createEl('input', { type: 'color' });
            bgInput.style.opacity = '0';
            bgInput.style.position = 'absolute';
            bgInput.style.top = '0'; bgInput.style.left = '0';
            bgInput.style.width = '100%'; bgInput.style.height = '100%';
            bgInput.style.cursor = 'pointer';

            if (item.backgroundColor && item.backgroundColor.startsWith('#')) {
                bgInput.value = item.backgroundColor;
            }

            bgInput.oninput = (e) => {
                item.backgroundColor = e.target.value;
                bgPreview.style.backgroundColor = item.backgroundColor;
                onUpdate();
            };

            // B. Background Opacity Slider (SEPARATE PROPERTY: bgOpacity)
            const bgSliderContainer = bgRow.createDiv({
                cls: 'cpwn-slider-container',
                style: 'display: flex; align-items: center; gap: 6px; flex-grow: 1;'
            });

            const bgOpacitySlider = bgSliderContainer.createEl('input', {
                type: 'range',
                cls: 'cpwn-slider'
            });
            bgOpacitySlider.style.flexGrow = '1';
            bgOpacitySlider.min = "0.1"; bgOpacitySlider.max = "1"; bgOpacitySlider.step = "0.1";
            // Use 'bgOpacity' property specifically for background
            bgOpacitySlider.value = item.bgOpacity || "1";

            const bgSliderValueLabel = bgSliderContainer.createSpan({
                text: `${Math.round((item.bgOpacity || 1) * 100)}%`,
                style: 'min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; font-size: 11px; color: var(--text-muted);'
            });

            bgOpacitySlider.oninput = (e) => {
                const val = e.target.value;
                item.bgOpacity = val;
                bgSliderValueLabel.setText(`${Math.round(val * 100)}%`);
                onUpdate();
            };

            // C. Clear Button
            const clearBtn = bgRow.createEl('button', { text: 'Clear' });
            clearBtn.style.fontSize = '11px';
            clearBtn.style.padding = '2px 8px';
            clearBtn.style.height = '24px';
            clearBtn.onclick = () => {
                delete item.backgroundColor;
                delete item.bgOpacity; // Clear specific opacity

                // Reset visual state
                bgPreview.style.backgroundColor = 'var(--background-modifier-border)';
                bgOpacitySlider.value = "1";
                bgSliderValueLabel.setText('100%');
                onUpdate();
            };
        }

        // Footer
        const footer = popover.createDiv({ cls: 'cpwn-footer' });

        const doneBtn = footer.createEl('button', { text: 'Done' });
        doneBtn.onclick = () => {
            if (this.activePopover) { this.activePopover.remove(); this.activePopover = null; }
        };

        const removeBtn = footer.createEl('button', { text: 'Remove', cls: 'cpwn-btn-danger' });
        removeBtn.onclick = () => {
            for (const rKey in this.rows) {
                const idx = this.rows[rKey].items.indexOf(item);
                if (idx > -1) {
                    this.rows[rKey].items.splice(idx, 1);
                    break;
                }
            }
            if (this.activePopover) { this.activePopover.remove(); this.activePopover = null; }
            this.refreshSidebar();
            onUpdate();
        };
    }

    saveAndClose() {
        const newConfig = {
            id: 'custom',
            name: 'Custom layout',
            // 1. Define the main 3-column grid
            gridTemplate: '"checkbox content meta"',
            // 2. Force content to take ALL available space
            gridColumns: 'min-content 1fr min-content',
            // gap: '4px',
            options: { stripTags: true, stripAlerts: true, colorCheckboxByPriority: this.colorCheckboxByPriority },
            items: [
                { area: 'checkbox', align: 'start', items: ['checkbox'] },
                {
                    area: 'content',
                    align: 'start',
                    flow: 'column',
                    gap: '4px',
                    // This makes sure the content area itself is full width
                    style: 'width: 100%; min-width: 0;',
                    items: [
                        this.buildRowConfig(this.rows.row1),
                        this.buildRowConfig(this.rows.row2),
                        this.buildRowConfig(this.rows.row3),
                        this.buildRowConfig(this.rows.row4),
                        this.buildRowConfig(this.rows.row5),
                        this.buildRowConfig(this.rows.row6)
                    ].filter(r => r.items.length > 0)
                },
                // 3. Keep 'meta' explicitly defined but empty if you aren't using it
                // This prevents the grid from breaking
                { area: 'meta', align: 'end', items: [] }
            ]
        };

        this.onSave(newConfig);
        this.close();
    }


    buildRowConfig(rowState) {
        const isFlow = !!rowState.isFlow;

        return {
            type: 'container',
            flow: 'row',
            align: rowState.align,
            justify: rowState.justify,
            indent: rowState.indent,
            isFlow: isFlow,
            gap: '6px',
            style: isFlow ? '' : 'width: 100%;',
            //style: 'width: 100%;', // Keeps the container full width
            items: rowState.items.map(item => {
                if (item.type === 'spacer') {
                    // FORCE the style in the JSON.
                    // We use !important to override any renderer defaults.
                    return {
                        type: 'spacer',
                        flexible: true,
                        style: 'flex-grow: 1 !important; width: auto !important; display: flex !important;'
                    };
                }
                // Pass other items through
                return { ...item };
            })
        };
    }


    onClose() {
        this.closeActivePopover();
        this.contentEl.empty();
    }
}
