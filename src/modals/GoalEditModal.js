import { Modal, Setting, Notice, AbstractInputSuggest, TFolder } from 'obsidian';

// --- 1. Define FolderSuggest Helper Class ---
class FolderSuggest extends AbstractInputSuggest {
    constructor(app, textInputEl) {
        super(app, textInputEl);
        this.app = app;
    }

    getSuggestions(inputStr) {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        for (const file of abstractFiles) {
            if (file instanceof TFolder) {
                if (file.path.toLowerCase().includes(lowerCaseInputStr)) {
                    folders.push(file);
                }
            }
        }
        return folders;
    }

    renderSuggestion(file, el) {
        el.setText(file.path);
    }

    selectSuggestion(file) {
        this.textInputEl.value = file.path;
        this.textInputEl.trigger("input");
        this.close();
    }
}

// --- 2. Your GoalEditModal Class ---
export class GoalEditModal extends Modal {
    constructor(app, existingGoal, onSave) {
        super(app);
        this.goal = existingGoal || {
            id: crypto.randomUUID(),
            name: '',
            type: 'task-count',
            target: 1,
            points: 10,
            query: '',
            folder: '', 
            activeDays: [0, 1, 2, 3, 4, 5, 6], 
            vacationMode: false
        };

        this.tempGoal = { ...this.goal };

        // Ensure new fields exist on older goals
        if (!Array.isArray(this.tempGoal.activeDays) || this.tempGoal.activeDays.length === 0) {
            this.tempGoal.activeDays = [0, 1, 2, 3, 4, 5, 6];
        }
        if (typeof this.tempGoal.vacationMode !== 'boolean') {
            this.tempGoal.vacationMode = false;
        }
        
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.goal.name ? 'Edit goal' : 'Create new goal' });

        new Setting(contentEl)
            .setDesc('If you change a folder location, #tags or goal values, it\'s recommended to perform a \'Reset cache\' to recalculate your progress.')

        // 1. Goal Name
        new Setting(contentEl)
            .setName('Goal name')
            .setDesc('e.g., "Morning writing" or "Daily tasks"')
            .addText(text => text
                .setValue(this.tempGoal.name)
                .onChange((value) => {
                    this.tempGoal.name = value;
                }));

        // 2. Goal Type Dropdown
        new Setting(contentEl)
            .setName('Goal type')
            .addDropdown(drop => drop
                .addOption('task-count', 'Task completed')
                .addOption('note-created', 'Note created')
                .addOption('word-count', 'Note word count')
                .setValue(this.tempGoal.type)
                .onChange(value => {
                    this.tempGoal.type = value;
                    
                    // Set sensible defaults
                    if (value === 'note-created') {
                        this.tempGoal.target = 1;
                    } else if (value === 'word-count' && this.tempGoal.target < 100) {
                        this.tempGoal.target = 500;
                    } else if (value === 'task-count' && this.tempGoal.target > 50) {
                        this.tempGoal.target = 3;
                    }

                    this.updatePointsPreview(); 
                    this.display();  
                }));

        // 3. Conditional Input: Tag Query
        if (this.tempGoal.type === 'task-count') {
            new Setting(contentEl)
                .setName('Filter by tag (optional)')
                .setDesc('Only count tasks with this tag (e.g., #gym). Leave blank for all tasks.')
                .addText(text => text
                    .setPlaceholder('#tag')
                    .setValue(this.tempGoal.query)
                    .onChange(value => this.tempGoal.query = value));
        }

        // 4. Conditional Input: Folder Picker WITH DROPDOWN
        if (this.tempGoal.type === 'word-count' || this.tempGoal.type === 'note-created') {
            new Setting(contentEl)
                .setName("Folder location (optional)")
                .setDesc("Leave blank to use your default Daily Notes folder, or specify a folder.")
                .addText(text => {
                    text.setPlaceholder("Example: Journals")
                        .setValue(this.tempGoal.folder || "")
                        .onChange(value => {
                            this.tempGoal.folder = value;
                        });
                    
                    // --- ATTACH FOLDER SUGGESTER HERE ---
                    new FolderSuggest(this.app, text.inputEl);
                });
        }

        // 5. Conditional Input: Target Value
        if (this.tempGoal.type !== 'note-created') {
            new Setting(contentEl)
                .setName("Target value")
                .setDesc(this.tempGoal.type === 'word-count' ? "How many words?" : "How many tasks?")
                .addText(text => text
                    .setValue(String(this.tempGoal.target))
                    .onChange((value) => {
                        this.tempGoal.target = Number(value) || 0;
                        this.updatePointsPreview(); 
                    }));
        }

        // 5.5 Active days picker
        const daysSetting = new Setting(contentEl)
            .setName("Active days")
            .setDesc("Points and penalties only apply on these days.");

        const daysContainer = daysSetting.controlEl.createDiv({
            cls: 'cpwn-goal-days-picker'
        });

        const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        dayLabels.forEach((label, idx) => {
            const dayEl = daysContainer.createSpan({
                text: label,
                cls: 'cpwn-goal-day'
            });

            if (this.tempGoal.activeDays.includes(idx)) {
                dayEl.addClass('is-active');
            }

            dayEl.addEventListener('click', () => {
                const active = this.tempGoal.activeDays;
                const pos = active.indexOf(idx);

                if (pos === -1) {
                    active.push(idx);
                    dayEl.addClass('is-active');
                } else {
                    if (active.length > 1) {
                        active.splice(pos, 1);
                        dayEl.removeClass('is-active');
                    }
                }
            });
        });

        // 5.6 Vacation mode toggle
        new Setting(contentEl)
            .setName("Vacation mode")
            .setDesc("When enabled, missed days for this goal give no penalties.")
            .addToggle(toggle => {
                toggle
                    .setValue(!!this.tempGoal.vacationMode)
                    .onChange((value) => {
                        this.tempGoal.vacationMode = value;
                    });
            });

        // 6. Points Display
        const pointsSetting = new Setting(contentEl)
            .setName("Points reward details")
            .setDesc("Points are calculated automatically based on your target.");

        this.pointsInfoEl = pointsSetting.controlEl.createDiv({ cls: 'cpwn-points-info' });
        this.pointsInfoEl.style.textAlign = 'right';
        this.pointsInfoEl.style.fontSize = '0.9em';
        this.pointsInfoEl.style.color = 'var(--text-accent)';

        this.updatePointsPreview(); 

        // 7. Save Button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("Save goal")
                .setCta()
                .onClick(() => {
                    if (!this.tempGoal.name) {
                        new Notice('Please enter a goal name.');
                        return;
                    }
                    this.onSave(this.tempGoal);
                    this.close();
                }));
    }

    updatePointsPreview() {
        let points = 0;
        let explanation = "";

        if (this.tempGoal.type === 'note-created') {
            points = 30; 
            explanation = "Reward: 30 pts\n(Penalty: -10 pts if missed)";
        } else if (this.tempGoal.type === 'task-count') {
            const count = this.tempGoal.target || 0;
            points = count * 30;
            explanation = `${count} tasks × 30 pts = ${points} pts\n(+2 pts per extra task)\n(Penalty: -10 pts if target not met)`;
        } else if (this.tempGoal.type === 'word-count') {
            const count = this.tempGoal.target || 0;
            points = Math.floor((count / 250) * 30);
            explanation = `${count} words ≈ ${points} pts\n(30 pts per 250 words)\n(Penalty: -10 pts if target not met)`;
        }
    
        if (this.pointsInfoEl) {
             this.pointsInfoEl.innerText = explanation;
             this.pointsInfoEl.style.whiteSpace = 'pre-line'; 
        }

        this.tempGoal.points = points;
    }

    display() {
        this.onOpen();
    }
}
