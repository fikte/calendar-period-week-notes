// src/modals/ConfirmationModal.js
import { Modal } from 'obsidian';

/**
 * A reusable confirmation modal dialog.
 */
export class ConfirmationModal extends Modal {
    constructor(app, title, message, onConfirm, confirmText = "Confirm") {
        super(app);
        this.title = title;
        this.message = message;
        this.onConfirm = onConfirm;
        this.confirmText = confirmText;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: this.title });
        contentEl.createEl("p", { text: this.message });
        const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

        buttonContainer.createEl("button", {
            text: this.confirmText,
            cls: "mod-cta",
        }).addEventListener("click", () => {
            this.close();
            this.onConfirm();
        });

        buttonContainer.createEl("button", {
            text: "Cancel",
        }).addEventListener("click", () => {
            this.close();
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}

export class ConfirmationModalWithStyles extends ConfirmationModal {
    onOpen() {
        super.onOpen();

        const { contentEl } = this;

        // Style the main content container
        contentEl.style.padding = '20px 24px';
        contentEl.style.textAlign = 'center';

        // Style the title using CSS variables
        const titleEl = contentEl.querySelector('h1, h2');
        if (titleEl) {
            titleEl.style.marginBottom = '16px';
            titleEl.style.fontSize = '1.3rem';
            // Use the primary text color variable
            titleEl.style.color = 'var(--text-normal)';
        }

        // Style the message paragraph using CSS variables
        const messageEl = contentEl.querySelector('p');
        if (messageEl) {
            messageEl.style.lineHeight = '1.6';
            messageEl.style.marginBottom = '24px';
            messageEl.style.fontSize = '1rem';
            // Use the muted text color variable for secondary text
            messageEl.style.color = 'var(--text-muted)';
        }

        // Style the button container
        const buttonContainer = contentEl.querySelector('.modal-button-container');
        if (buttonContainer) {
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '12px';
        }

        // Style the primary confirmation button
        const confirmButton = contentEl.querySelector('.mod-cta');
        if (confirmButton) {
            confirmButton.style.fontWeight = '600';
        }
    }
}

