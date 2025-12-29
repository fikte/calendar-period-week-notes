import { Modal, Setting, Notice, TFolder, setIcon } from 'obsidian';

export class FileCreationHeatmapModal extends Modal {
    constructor(app, heatmap, onSubmit, onDelete) {
        super(app);
        this.heatmap = heatmap || {};
        this.onSubmit = onSubmit;
        this.onDelete = onDelete;
        
        // Deep clone
        this.tempHeatmap = JSON.parse(JSON.stringify(this.heatmap));

        // --- 1. DATA SANITIZATION ON LOAD ---
        this.tempHeatmap.name = this.tempHeatmap.name || 'New Heatmap';
        
        if (!Array.isArray(this.tempHeatmap.excludeFolders)) {
             this.tempHeatmap.excludeFolders = [];
        }
        if (typeof this.tempHeatmap.exclude === 'string' && this.tempHeatmap.exclude.trim().length > 0) {
             const split = this.tempHeatmap.exclude.split(',').map(s => s.trim()).filter(s => s);
             if (this.tempHeatmap.excludeFolders.length === 0) {
                 this.tempHeatmap.excludeFolders = split;
             }
        }

        this.tempHeatmap.logic = this.tempHeatmap.logic || 'AND';
        this.tempHeatmap.filters = Array.isArray(this.tempHeatmap.filters) ? this.tempHeatmap.filters : [];
        
        if (this.tempHeatmap.filters.length > 0 && !this.tempHeatmap.filterType) {
            this.tempHeatmap.filterType = this.tempHeatmap.filters[0].type;
            this.tempHeatmap.filterValue = this.tempHeatmap.filters[0].value;
            this.tempHeatmap.filterOperator = this.tempHeatmap.filters[0].operator;
        }

        let source = this.tempHeatmap.dateSource;
        if (source === 'note_title' || source === 'date_from_title') source = 'dateFromTitle';
        if (source === 'file_creation') source = 'fileCreation';
        if (source === 'file_modification') source = 'fileModification';
        if (source === 'frontmatter') source = 'dateFromFrontmatter';
        this.tempHeatmap.dateSource = source || 'fileCreation';

        this.tempHeatmap.monthsBack = (this.tempHeatmap.monthsBack !== undefined) ? this.tempHeatmap.monthsBack : 11;
        this.tempHeatmap.monthsForward = (this.tempHeatmap.monthsForward !== undefined) ? this.tempHeatmap.monthsForward : 0;
        this.tempHeatmap.color = this.tempHeatmap.color || 'rgba(255, 0, 0, 1.00)';
    }

    onOpen() {
        this.modalEl.addClass('cpwn-settings-modal'); 

        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: `Edit: ${this.tempHeatmap.name}` });

        new Setting(contentEl).setName('Name').addText(t => t.setValue(this.tempHeatmap.name).onChange(v => this.tempHeatmap.name = v));
        new Setting(contentEl).setName('Override show name').addToggle(t => t.setValue(this.tempHeatmap.overrideShowTitle).onChange(v => this.tempHeatmap.overrideShowTitle = v));
        new Setting(contentEl).setName('Override show chevron').addToggle(t => t.setValue(this.tempHeatmap.overrideShowChevron).onChange(v => this.tempHeatmap.overrideShowChevron = v));

        new Setting(contentEl).setName('Date source').addDropdown(d => d
            .addOption('fileCreation', 'File Creation Date')
            .addOption('fileModification', 'File Modification Date')
            .addOption('dateFromTitle', 'Date from Note Title')
            .addOption('dateFromFrontmatter', 'Date from Frontmatter')
            .setValue(this.tempHeatmap.dateSource).onChange(v => this.tempHeatmap.dateSource = v));

        new Setting(contentEl).setName('Months back').addText(t => t.setValue(String(this.tempHeatmap.monthsBack)).onChange(v => this.tempHeatmap.monthsBack = Number(v)));
        new Setting(contentEl).setName('Months forward').addText(t => t.setValue(String(this.tempHeatmap.monthsForward)).onChange(v => this.tempHeatmap.monthsForward = Number(v)));

        new Setting(contentEl).setName('Note link path').addText(text => {
            this.createPathSuggester(text.inputEl, (q) => this.app.vault.getFiles().filter(f => !q || f.path.toLowerCase().includes(q.toLowerCase())).map(f => f.path));
            text.setValue(this.tempHeatmap.linkPath || '').onChange(v => this.tempHeatmap.linkPath = v);
        });

        contentEl.createEl('h3', { text: 'Filter logic', cls: 'cpwn-setting-header' }); 
        new Setting(contentEl).setName('Combine logic').addDropdown(d => d
            .addOption('AND', 'All rules must match (AND)')
            .addOption('OR', 'Any rule can match (OR)')
            .setValue(this.tempHeatmap.logic).onChange(v => this.tempHeatmap.logic = v));

        const filtersContainer = contentEl.createDiv({ cls: 'cpwn-pm-filters-container' });
        this.renderFilterRules(filtersContainer);
        
        new Setting(contentEl).addButton(btn => btn.setButtonText('Add filter rule').onClick(() => {
            this.tempHeatmap.filters.push({ type: 'filepath', operator: 'contains', value: '' });
            this.renderFilterRules(filtersContainer);
        }));

        this.renderColorSetting(contentEl);
        this.createFolderExclusionUI(contentEl);

        new Setting(contentEl).setName('Enable debug logging').addToggle(t => t.setValue(this.tempHeatmap.debug).onChange(v => this.tempHeatmap.debug = v));

        
        // --- FOOTER CONTAINER (GRID LAYOUT) ---
        const footer = contentEl.createDiv({ 
            cls: 'cpwn-modal-footer'
        });
        
        // CSS GRID: 
        footer.style.cssText = `
            display: grid; 
            grid-template-columns: 1fr auto; 
            align-items: center; 
            width: 100%; 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 1px solid var(--background-modifier-border);
        `;

        // 1. LEFT SIDE (Delete Button)
        const leftGroup = footer.createDiv();
        
        // Only render button if delete callback exists
        if (this.onDelete) {
            const deleteBtn = leftGroup.createEl('button', { 
                text: 'Delete heatmap', 
                cls: 'mod-warning' 
            });
            deleteBtn.style.whiteSpace = 'nowrap';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Delete heatmap "${this.tempHeatmap.name || 'this heatmap'}"?`)) { 
                    this.close(); 
                    setTimeout(() => { this.onDelete(); }, 300);
                }
            });
        }

        // 2. RIGHT SIDE (Cancel & Save)
        const rightGroup = footer.createDiv({ 
            style: 'display: flex; gap: 10px; padding-left: 10px;' 
        });

        const cancelBtn = rightGroup.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = rightGroup.createEl('button', { 
            text: 'Save', 
            cls: 'mod-cta' 
        });

        saveBtn.style.marginLeft = '12px'; 

        saveBtn.addEventListener('click', () => {
             const final = { ...this.tempHeatmap };
             // [Your existing sanitization logic here...]
             if (!Array.isArray(final.excludeFolders)) final.excludeFolders = [];
             final.exclude = final.excludeFolders.join(',');
             if (!final.logic) final.logic = 'AND';
             final.filters = final.filters.map(f => {
                 const type = f.type || 'filepath';
                 let op = f.operator;
                 if (type === 'tag' || type === 'filetype') {
                     if (op !== 'equals' && op !== 'not_equals') op = 'equals';
                 } else {
                     if (!op) op = 'contains';
                 }
                 return { type: String(type), operator: String(op), value: String(f.value || '') };
             });

             if (final.filters.length > 0) {
                 final.filterType = final.filters[0].type;
                 final.filterOperator = final.filters[0].operator;
                 final.filterValue = final.filters[0].value;
             } else {
                 final.filterType = 'filepath'; final.filterOperator = 'contains'; final.filterValue = '';
             }
            
             this.close(); 
             setTimeout(() => { this.onSubmit(final); }, 300); 
        });
    }

    renderFilterRules(container) {
        container.empty();
        this.tempHeatmap.filters.forEach((filter, index) => {
            const filterRow = container.createDiv({ cls: 'cpwn-pm-filter-row' });
            const rowSetting = new Setting(filterRow).setName(`Rule #${index+1}`);
            rowSetting.addDropdown(d => {
                d.addOption('tag', 'Tag').addOption('filename', 'Filename').addOption('filepath', 'File path').addOption('filetype', 'File type')
                 .setValue(filter.type).onChange(v => { 
                     filter.type = v; 
                     if (v === 'tag' || v === 'filetype') { filter.operator = 'equals'; } else { filter.operator = 'contains'; }
                     this.renderFilterRules(container); 
                 });
            });
            rowSetting.addDropdown(d => {
                const ops = { contains: 'contains', not_contains: 'does not contain', equals: 'equals', not_equals: 'does not equal', starts_with: 'starts with', ends_with: 'ends with', matches_regex: 'matches regex', not_matches_regex: 'does not match regex' };
                if (filter.type === 'tag' || filter.type === 'filetype') { d.addOption('equals', 'is'); d.addOption('not_equals', 'is not'); }
                else { for(let k in ops) d.addOption(k, ops[k]); }
                const validOps = (filter.type === 'tag' || filter.type === 'filetype') ? ['equals', 'not_equals'] : Object.keys(ops);
                if (!validOps.includes(filter.operator)) { filter.operator = validOps[0]; }
                d.setValue(filter.operator).onChange(v => filter.operator = v);
            });
            rowSetting.addText(t => {
                t.setPlaceholder('Value...').setValue(filter.value || '').onChange(v => filter.value = v);
                if (filter.type === 'filepath') {
                    this.createPathSuggester(t.inputEl, (q) => this.app.vault.getAllLoadedFiles().filter(f => !q || f.path.toLowerCase().includes(q.toLowerCase())).map(f => f.path));
                }
            });
            rowSetting.addButton(b => b.setButtonText('-').onClick(() => {
                this.tempHeatmap.filters.splice(index, 1); this.renderFilterRules(container);
            }));
        });
    }

    createFolderExclusionUI(container) {
        container.createEl('h3', { text: 'Excluded folders' });
        container.createEl('p', { text: 'Files in these folders will be ignored.', cls: 'setting-item-description' });
        const listEl = container.createDiv(); 
        const renderList = () => {
            listEl.empty();
            if (this.tempHeatmap.excludeFolders.length === 0) {
                listEl.createEl('div', { text: 'No folders are currently excluded.', cls: 'cpwn-setting-item-description', style: 'margin-bottom:10px;' });
            } else {
                this.tempHeatmap.excludeFolders.forEach((folder, index) => {
                    new Setting(listEl).setName(folder).addButton(b => b.setIcon('trash').onClick(() => {
                        this.tempHeatmap.excludeFolders.splice(index, 1); renderList();
                    }));
                });
            }
        };
        renderList();
        const addSetting = new Setting(container);
        let input;
        addSetting.addText(t => {
            input = t; t.setPlaceholder('Enter folder path...');
            this.createPathSuggester(t.inputEl, (q) => this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && (!q || f.path.toLowerCase().includes(q.toLowerCase()))).map(f => f.path));
        });
        addSetting.addButton(b => b.setButtonText('Add').onClick(() => {
            if(input.getValue().trim()) { this.tempHeatmap.excludeFolders.push(input.getValue().trim()); renderList(); input.setValue(''); }
        }));
    }

    renderColorSetting(container) {
        const setting = new Setting(container).setName('Heatmap color').setDesc('Set color.');
        const parseRgba = (str) => {
            if(!str) return { color: '#ff0000', alpha: 1 };
            const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if(!m) return { color: str.startsWith('#')?str:'#ff0000', alpha: 1 };
            const hex = "#" + [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2,'0')).join('');
            return { color: hex, alpha: m[4] !== undefined ? parseFloat(m[4]) : 1 };
        };
        const buildRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
        };
        let { color: hex, alpha } = parseRgba(this.tempHeatmap.color);
        let pickerEl, sliderEl;
        setting.addColorPicker(picker => {
            pickerEl = picker; picker.setValue(hex).onChange(v => { hex = v; this.tempHeatmap.color = buildRgba(hex, alpha); if(picker.colorEl) picker.colorEl.style.backgroundColor = this.tempHeatmap.color; });
        });
        setting.addSlider(slider => {
            sliderEl = slider; slider.setLimits(0, 1, 0.05).setValue(alpha).onChange(v => { alpha = v; this.tempHeatmap.color = buildRgba(hex, alpha); if(pickerEl.colorEl) pickerEl.colorEl.style.backgroundColor = this.tempHeatmap.color; });
        });
        if(pickerEl && pickerEl.colorEl) pickerEl.colorEl.style.backgroundColor = this.tempHeatmap.color;
        setting.addExtraButton(b => b.setIcon('copy').onClick(() => { window.navigator.clipboard.writeText(this.tempHeatmap.color); new Notice('Copied!'); }));
        setting.addExtraButton(b => b.setIcon('paste').onClick(async () => {
            const t = await window.navigator.clipboard.readText(); if(t) { 
                const p = parseRgba(t); hex=p.color; alpha=p.alpha; this.tempHeatmap.color = t;
                if(pickerEl) { pickerEl.setValue(hex); if(pickerEl.colorEl) pickerEl.colorEl.style.backgroundColor=t; }
                if(sliderEl) sliderEl.setValue(alpha);
            }
        }));
        setting.addExtraButton(b => b.setIcon('rotate-ccw').onClick(() => {
            hex='#ff0000'; alpha=1; this.tempHeatmap.color='rgba(255,0,0,1.00)';
            if(pickerEl) { pickerEl.setValue(hex); if(pickerEl.colorEl) pickerEl.colorEl.style.backgroundColor=this.tempHeatmap.color; }
            if(sliderEl) sliderEl.setValue(alpha);
        }));
    }

    createPathSuggester(inputEl, getSuggestions) {
        const parent = inputEl.parentElement; parent.style.position = 'relative';
        let suggestionEl = parent.querySelector('.cpwn-custom-suggestion-container');
        if (!suggestionEl) {
            suggestionEl = createDiv({ cls: 'cpwn-custom-suggestion-container' });
            suggestionEl.style.display = 'none'; suggestionEl.style.top = '100%'; suggestionEl.style.right = '0'; suggestionEl.style.left = 'auto';
            parent.appendChild(suggestionEl);
        }
        const show = () => {
            const q = inputEl.value.toLowerCase(); 
            if (!q.trim()) { suggestionEl.style.display = 'none'; return; }
            const res = getSuggestions(q); suggestionEl.empty();
            if(!res.length) { suggestionEl.style.display='none'; return; }
            suggestionEl.style.display='block';
            res.slice(0, 10).forEach(path => {
                const item = suggestionEl.createDiv({ cls: 'cpwn-custom-suggestion-item', text: path });
                item.onmousedown = (e) => { e.preventDefault(); inputEl.value = path; inputEl.dispatchEvent(new Event('input')); suggestionEl.style.display='none'; };
            });
        };
        inputEl.oninput = show; inputEl.onfocus = show; inputEl.onblur = () => setTimeout(() => { if(suggestionEl) suggestionEl.style.display='none'; }, 200);
    }
    
    onClose() { this.contentEl.empty(); }
}
