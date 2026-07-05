import { Modal, Notice, setIcon } from 'obsidian';

export class TodoistTaskModal extends Modal {
    constructor(app, onSubmit) {
        super(app);
        this.onSubmit = onSubmit;
        this.content = '';
        this.description = '';
        this.dueDate = '';
        this.deadlineDate = '';
        this.labels = '';
        this.priority = 1;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('cpwn-todoist-task-modal');

        const root = contentEl.createDiv({ cls: 'cpwn-todoist-task-modal-root task-creation-modal-root' });

        const taskInput = root.createEl('textarea', {
            cls: 'cpwn-todoist-task-name-input',
            attr: { placeholder: 'Task name', rows: '1' }
        });
        taskInput.addEventListener('input', () => {
            this.content = taskInput.value;
        });
        taskInput.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.submit();
            }
        });
        window.setTimeout(() => taskInput.focus(), 0);

        const descriptionInput = root.createEl('textarea', {
            cls: 'cpwn-todoist-task-description-input',
            attr: { placeholder: 'Description', rows: '1' }
        });
        descriptionInput.addEventListener('input', () => {
            this.description = descriptionInput.value;
        });
        descriptionInput.addEventListener('keydown', event => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                this.submit();
            }
        });

        const selectors = root.createDiv({ cls: 'cpwn-todoist-task-selectors' });
        const selectorGroup = selectors.createDiv({ cls: 'cpwn-todoist-task-selectors-group' });

        this.createTextChip(selectorGroup, 'calendar', 'Due date', 'cpwn-todoist-chip-due', value => {
            this.dueDate = value;
        });

        const priorityChip = this.createChip(selectorGroup, 'flag', 'cpwn-todoist-chip-priority');
        const prioritySelect = priorityChip.createEl('select', {
            cls: 'cpwn-todoist-task-chip-select',
            attr: { 'aria-label': 'Priority' }
        });
        [
            ['1', 'Priority 4'],
            ['2', 'Priority 3'],
            ['3', 'Priority 2'],
            ['4', 'Priority 1']
        ].forEach(([value, label]) => {
            const option = prioritySelect.createEl('option', { text: label });
            option.value = value;
        });
        prioritySelect.value = String(this.priority);
        prioritySelect.addEventListener('change', () => {
            this.priority = Number(prioritySelect.value) || 1;
        });

        this.createTextChip(selectorGroup, 'tag', 'Labels (0)', 'cpwn-todoist-chip-labels', value => {
            this.labels = value;
        });

        const optionGroup = selectors.createDiv({ cls: 'cpwn-todoist-task-selectors-group' });
        const moreButton = this.createIconButton(optionGroup, 'more-vertical', 'More options');

        const deadlineRow = root.createDiv({ cls: 'cpwn-todoist-task-extra is-hidden' });
        this.createTextChip(deadlineRow, 'calendar-check', 'Deadline date', 'cpwn-todoist-chip-deadline', value => {
            this.deadlineDate = value;
        });
        moreButton.addEventListener('click', () => {
            if (deadlineRow.hasClass('is-hidden')) {
                deadlineRow.removeClass('is-hidden');
            } else {
                deadlineRow.addClass('is-hidden');
            }
        });

        const notes = root.createDiv({ cls: 'cpwn-todoist-task-notes task-creation-notes' });
        const noteList = notes.createEl('ul');
        noteList.createEl('li', { text: 'A link to this page will be appended to the task name' });

        root.createEl('hr');

        const buttonContainer = root.createDiv({ cls: 'cpwn-todoist-task-controls task-creation-controls' });
        const projectButton = buttonContainer.createEl('button', {
            cls: 'cpwn-todoist-project-button',
            attr: { type: 'button', 'aria-label': 'Todoist project' }
        });
        this.appendIcon(projectButton, 'inbox');
        projectButton.createSpan({ text: 'Inbox' });
        this.appendIcon(projectButton, 'chevron-down');

        const actionContainer = buttonContainer.createDiv({ cls: 'task-creation-action' });
        actionContainer.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());
        const addGroup = actionContainer.createDiv({ cls: 'cpwn-todoist-add-button-group' });
        const submitButton = addGroup.createEl('button', { text: 'Add task', cls: 'mod-cta cpwn-todoist-add-primary' });
        submitButton.addEventListener('click', () => this.submit());
        const addMenuButton = addGroup.createEl('button', {
            cls: 'mod-cta cpwn-todoist-add-menu',
            attr: { type: 'button', 'aria-label': 'Add task options' }
        });
        this.appendIcon(addMenuButton, 'chevron-down');
    }

    createTextChip(containerEl, icon, placeholder, extraClass, onChange) {
        const chip = this.createChip(containerEl, icon, extraClass);
        const input = chip.createEl('input', {
            cls: 'cpwn-todoist-task-chip-input',
            attr: { type: 'text', placeholder }
        });
        input.addEventListener('input', () => onChange(input.value));
        return input;
    }

    createChip(containerEl, icon, extraClass = '') {
        const chip = containerEl.createDiv({ cls: `cpwn-todoist-task-chip ${extraClass}`.trim() });
        this.appendIcon(chip, icon);
        return chip;
    }

    createIconButton(containerEl, icon, label) {
        const button = containerEl.createEl('button', {
            cls: 'cpwn-todoist-icon-button',
            attr: { type: 'button', 'aria-label': label, title: label }
        });
        this.appendIcon(button, icon);
        return button;
    }

    appendIcon(containerEl, icon) {
        const iconEl = containerEl.createSpan({ cls: 'cpwn-todoist-task-icon' });
        setIcon(iconEl, icon);
        return iconEl;
    }

    async submit() {
        const content = this.content.trim();
        if (!content) {
            new Notice('Enter a Todoist task name.');
            return;
        }

        this.close();
        await this.onSubmit({
            content,
            description: this.description.trim(),
            dueDate: this.dueDate.trim(),
            deadlineDate: this.deadlineDate.trim(),
            labels: this.parseLabels(this.labels),
            priority: this.priority
        });
    }

    parseLabels(value) {
        return value
            .split(',')
            .map(label => label.trim())
            .filter(Boolean);
    }

    onClose() {
        this.contentEl.empty();
    }
}
