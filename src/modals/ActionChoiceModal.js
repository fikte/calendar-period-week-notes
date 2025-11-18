// src/modals/ActionChoiceModal.js
import { Modal } from 'obsidian';

/* A modal dialog that presents multiple action choices to the user when creating a new daily note. */
export class ActionChoiceModal extends Modal {
    constructor(app, title, message, buttons) {
        super(app);
        this.title = title;
        this.message = message;
        this.buttons = buttons;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: this.title });
        if (this.message) {
            contentEl.createEl('p', { text: this.message });
        }
        const buttonContainer = contentEl.createEl('div', { cls: 'modal-button-container' });


        for (const buttonConfig of this.buttons) {
            const btn = buttonContainer.createEl('button', { text: buttonConfig.text });
            if (buttonConfig.cls) {
                btn.addClass(buttonConfig.cls);
            }
            btn.addEventListener('click', () => {
                this.close();
                if (buttonConfig.action) {
                    buttonConfig.action();
                }
            });
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
