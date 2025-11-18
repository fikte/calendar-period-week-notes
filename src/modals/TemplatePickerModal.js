// src/modals/TemplatePickerModal.js
import { Modal } from 'obsidian';

export class TemplatePickerModal extends Modal {
    constructor(app, plugin, onSelect) {
        super(app);
        this.plugin = plugin;
        this.onSelect = onSelect;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('cpwn-template-picker-modal');

        contentEl.createEl('h2', { text: 'Choose a widget template' });

        const templates = await this.plugin.loadTemplates();

        const grid = contentEl.createDiv({ cls: 'cpwn-template-grid' });

        for (const template of templates) {
            const card = grid.createDiv({ cls: 'cpwn-template-card' });

            // Preview chart
            const previewContainer = card.createDiv({ cls: 'cpwn-template-preview' });
            this.renderMiniChart(previewContainer, template);

            // Template info
            card.createEl('h3', { text: template.name });
            card.createEl('p', { text: template.description, cls: 'cpwn-template-desc' });

            // Select button
            const btn = card.createEl('button', { text: 'Use template', cls: 'mod-cta' });
            btn.addEventListener('click', () => {
                this.onSelect(template.widgetConfig);
                this.close();
            });
        }
    }

    renderMiniPieChart(ctx, template, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const datasets = template.previewData.datasets || [];

        // Calculate total
        const total = datasets.reduce((sum, ds) => sum + (ds.data[0] || 0), 0);

        if (total === 0) return;

        let currentAngle = -Math.PI / 2; // Start at top

        for (const dataset of datasets) {
            const value = dataset.data[0] || 0;
            const sliceAngle = (value / total) * Math.PI * 2;
            const color = dataset.color || '#888888';

            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            currentAngle += sliceAngle;
        }
    }


    renderMiniChart(container, template) {
        const canvas = container.createEl('canvas', { cls: 'cpwn-mini-chart' });
        const ctx = canvas.getContext('2d');

        const width = canvas.width = 200;
        const height = canvas.height = 100;

        const chartType = template.widgetConfig.chartType || 'line';

        if (chartType === 'kpi') {
            this.renderMiniKpiChart(ctx, template, width, height);
        }
        else if (chartType === 'radar') {
            this.renderMiniRadarChart(ctx, template, width, height);
        } else if (chartType === 'pie') {
            this.renderMiniPieChart(ctx, template, width, height);
        } else {
            this.renderMiniLineChart(ctx, template, width, height);
        }
    }

    renderMiniKpiChart(ctx, template, width, height) {
        ctx.clearRect(0, 0, width, height); // Clear canvas before drawing

        ctx.font = "48px sans-serif";             // Font size and family
        ctx.fillStyle = template.previewData.datasets[0].color || "#4caf50";;                    // Text color (KPI color if you wish)
        ctx.textAlign = "center";                 // Center horizontally
        ctx.textBaseline = "middle";              // Center vertically

        ctx.fillText(template.previewData.datasets[0].data[0], width / 2, height / 2); // Draw text at exact center

    }

    renderMiniLineChart(ctx, template, width, height) {
        const padding = 10;

        const datasets = template.previewData.datasets || [{
            data: template.previewData.values,
            color: '#4caf50'
        }];

        let max = 0;
        for (const dataset of datasets) {
            const dataMax = Math.max(...dataset.data);
            if (dataMax > max) max = dataMax;
        }

        for (const dataset of datasets) {
            const data = dataset.data;
            const color = dataset.color || '#4caf50';

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((val, i) => {
                const x = padding + (i / (data.length - 1)) * (width - padding * 2);
                const y = height - padding - ((val / max) * (height - padding * 2));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();
        }
    }

    renderMiniRadarChart(ctx, template, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        const datasets = template.previewData.datasets || [];
        const dataLength = datasets[0]?.data.length || 0;

        if (dataLength === 0) return;

        let max = 0;
        for (const dataset of datasets) {
            const dataMax = Math.max(...dataset.data);
            if (dataMax > max) max = dataMax;
        }

        // Draw concentric circles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axis lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < dataLength; i++) {
            const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Draw datasets
        for (const dataset of datasets) {
            const data = dataset.data;
            const color = dataset.color || '#4caf50';

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((val, i) => {
                const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2;
                const scaledRadius = (val / max) * radius;
                const x = centerX + Math.cos(angle) * scaledRadius;
                const y = centerY + Math.sin(angle) * scaledRadius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
