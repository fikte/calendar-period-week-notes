// src/widgets/CssChartRenderer.js
export class CssChartRenderer {
    constructor(container) {
        this.container = container;
        this.cleanup();
    }

    cleanup() {
        if (this.container) {
            this.container.empty();
        }
    }

    onunload() {
        // Remove the tooltip when the widget is closed
        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }

    }

    /**
     * Creates a smooth SVG path (Catmull-Rom spline) from a series of points.
     * @param {number[][]} points - An array of [x, y] coordinates.
     * @param {number} tension - The "tension" of the curve. 1 is standard.
     * @param {number} maxY - The maximum Y value (the floor of the chart).
     * @returns {string} The 'd' attribute for a SVG <path> element.
     */
    getPathDataForBezierCurve(points, tension = 1, maxY = Infinity) {
        if (points.length < 2) return '';

        let path = `M ${points[0][0]},${points[0][1]}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 > points.length - 1 ? points.length - 1 : i + 2];

            const cp1x = p1[0] + (p2[0] - p0[0]) / 6 * tension;
            const cp2x = p2[0] - (p3[0] - p1[0]) / 6 * tension;

            const cp1y = Math.min(maxY, p1[1] + (p2[1] - p0[1]) / 6 * tension);
            const cp2y = Math.min(maxY, p2[1] - (p3[1] - p1[1]) / 6 * tension);

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
        }
        return path;
    }

    /**
     * Finds "nice" numbers for chart axes.
     * @param {number} min The minimum value.
     * @param {number} max The maximum value.
     * @param {number} ticks The desired number of ticks.
     * @returns {number[]} An array of nice numbers for the axis.
     */
    getNiceNumbers(min, max, ticks = 5) {
        if (max === 0) return Array.from({ length: ticks }, (_, i) => i * 0).reverse();

        const range = max - min;
        if (range === 0) return [min];

        const tickSpacing = range / (ticks - 1);
        const niceTickSpacings = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2500, 5000, 10000];
        const niceTick = niceTickSpacings.find(nice => nice > tickSpacing) || niceTickSpacings[niceTickSpacings.length - 1];

        const start = Math.floor(min / niceTick) * niceTick;
        const labels = [];
        let currentValue = max;
        while (currentValue > min) {
            labels.push(currentValue);
            currentValue -= niceTick;
        }
        labels.push(start);

        // Ensure we have a consistent number of labels if possible
        while (labels.length < ticks) {
            const last = labels[labels.length - 1];
            if (last - niceTick < 0) break;
            labels.push(last - niceTick);
        }
        const finalLabels = Array.from(new Set(labels.filter(l => l >= 0))).sort((a, b) => a - b);
        if (finalLabels.length > 2 && finalLabels[0] !== 0) {
            finalLabels.unshift(0);
        }

        const finalMax = Math.ceil(max / niceTick) * niceTick;
        const results = [];
        for (let i = 0; i <= finalMax; i += niceTick) {
            results.push(i);
        }
        if (results.length < 2) return [0, max];

        return results;
    }
    /**
     * Renders a legend for the chart.
     * @param {HTMLElement} parent - The container to append the legend to.
     * @param {Array<object>} datasets - The array of datasets.
     */
    renderLegend(parent, datasets) {
        const legendEl = parent.createDiv({ cls: 'cpwn-pm-chart-legend' });
        datasets.forEach(ds => {
            const legendItem = legendEl.createDiv({ cls: 'cpwn-pm-legend-item' });
            const colorBox = legendItem.createDiv({ cls: 'cpwn-pm-legend-color' });
            colorBox.style.backgroundColor = ds.color;
            legendItem.createSpan({ text: ds.label });
        });
    }

    /**
     * Renders a flexible horizontal bar chart.
     * - For grouped data (by tag/priority), it creates sections for each group with metric bars inside.
     * - For non-grouped data, it renders a simple list of metric bars.
     *
     * @param {object} chartData The chart data containing datasets and labels.
     * @param {object} config The chart configuration object.
     */
    renderBarChart(chartData, config) {
        this.cleanup();
        const chartContainer = this.container.createDiv({ cls: 'cpwn-pm-css-chart-container cpwn-chart-type-bar-horizontal' });

        if (config && typeof config.title === 'string' && config.title.trim() !== '') {
            chartContainer.createEl('h4', { text: config.title });
        }

        if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
            chartContainer.createDiv({ text: 'No data available.' });
            return;
        }

        const barChart = chartContainer.createDiv({ cls: 'cpwn-pm-bar-chart-horizontal' });

        // --- RENDER GROUPED DATA ---
        if (config.groupBy === 'tag' || config.groupBy === 'priority') {
            const allValues = chartData.datasets.flatMap(ds => ds.data);
            const maxValue = Math.max(...allValues, 1); // Use max across all data for consistent scaling

            chartData.labels.forEach((groupLabel, i) => {
                // Create a container for the group)
                const groupContainer = barChart.createDiv({ cls: 'cpwn-pm-bar-chart-group' });
                groupContainer.createDiv({ cls: 'cpwn-pm-bar-chart-group-label', text: groupLabel });

                // Render a bar for each metric within this group
                chartData.datasets.forEach(dataset => {
                    const value = dataset.data[i] || 0;
                    const metricLabel = dataset.label;
                    const color = dataset.color;
                    const percentage = (value / maxValue) * 100;

                    const widgetEl = groupContainer.createDiv({ cls: 'cpwn-pm-task-status-widget' });
                    const topRow = widgetEl.createDiv({ cls: 'cpwn-pm-task-status-top-row' });
                    topRow.createDiv({ cls: 'cpwn-pm-task-status-label', text: metricLabel });
                    topRow.createDiv({ cls: 'cpwn-pm-task-status-value', text: String(value) });

                    const barContainer = widgetEl.createDiv({ cls: 'cpwn-pm-task-status-bar-container' });
                    const barTrack = barContainer.createDiv({ cls: 'cpwn-pm-task-status-bar-track' });
                    const barFill = barTrack.createDiv({ cls: 'cpwn-pm-task-status-bar-fill' });

                    barFill.style.width = `${percentage}%`;
                    if (color) {
                        barFill.style.backgroundColor = color;
                    }
                });
            });
        }
        // --- RENDER NON-GROUPED DATA ---
        else {
            const items = chartData.datasets.map(ds => ({
                label: ds.label,
                value: ds.data.reduce((a, b) => a + b, 0),
                color: ds.color
            }));

            const maxValue = Math.max(...items.map(item => item.value), 1);

            for (const item of items) {
                const percentage = (item.value / maxValue) * 100;
                const widgetEl = barChart.createDiv({ cls: 'cpwn-pm-task-status-widget' });
                const topRow = widgetEl.createDiv({ cls: 'cpwn-pm-task-status-top-row' });
                topRow.createDiv({ cls: 'cpwn-pm-task-status-label', text: item.label });
                topRow.createDiv({ cls: 'cpwn-pm-task-status-value', text: String(item.value) });

                const barContainer = widgetEl.createDiv({ cls: 'cpwn-pm-task-status-bar-container' });
                const barTrack = barContainer.createDiv({ cls: 'cpwn-pm-task-status-bar-track' });
                const barFill = barTrack.createDiv({ cls: 'cpwn-pm-task-status-bar-fill' });

                barFill.style.width = `${percentage}%`;
                if (item.color) {
                    barFill.style.backgroundColor = item.color;
                }
            }
        }
    }


    /**
     * Renders a pie chart widget with size-aware layouts.
     * @param {Array} data The data for the chart's slices.
     * @param {String} type The chart type ('pie' or 'doughnut').
     * @param {String} title The chart's title.
     * @param {Object} legendConfig Configuration for the legend.
     * @param {Array} datasets (Currently unused in this refined version but kept for signature consistency).
     * @param {String} widgetSize The explicit size of the widget ('mini', 'small', 'medium', 'large').
     */
    renderPieChart(data, type, title, legendConfig, datasets, widgetSize) {
        // 1. --- SETUP ---
        this.container.empty();
        this.container.removeClasses(['cpwn-pm-widget-pie', 'cpwn-legend-right', 'cpwn-legend-top', 'cpwn-legend-bottom', 'is-pie-only']);
        this.container.addClass('cpwn-pm-widget-pie');

        legendConfig = legendConfig || { display: true, position: 'right' };
        const showLegend = legendConfig.display;
        // Default to 'right' if the position isn't specified
        const legendPosition = legendConfig.position || 'right';

        // Add the correct class to the main container. This is what the CSS will use.
        if (showLegend) {
            this.container.addClass(`cpwn-legend-${legendPosition}`);
            console.log(legendPosition);
        } else {
            // This class is for when the legend is off (e.g., mini/small widgets)
            this.container.addClass('is-pie-only');
        }

        if (title) {
            this.container.createEl('h4', { text: title, cls: 'cpwn-pm-chart-title' });
        }
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            this.container.createDiv({ text: 'No data available.' });
            return;
        }

        // --- 2. THE SINGLE WRAPPER ---
        // This wrapper holds the chart and, if needed, the legend.
        const chartWrapper = this.container.createDiv({ cls: 'cpwn-pm-pie-chart-wrapper' });

        // --- 3. RENDER THE PIE ---
        const pie = chartWrapper.createDiv({ cls: 'cpwn-pm-pie-chart' });
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('viewBox', '-1 -1 2 2');
        svg.style.transform = 'rotate(-90deg)';
        pie.appendChild(svg);

        let cumulativePercent = 0;
        data.forEach(item => {
            const percent = item.value / total;
            const startAngle = cumulativePercent * 2 * Math.PI;
            const endAngle = (cumulativePercent + percent) * 2 * Math.PI;
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const startX = Math.cos(startAngle);
            const startY = Math.sin(startAngle);
            const endX = Math.cos(endAngle);
            const endY = Math.sin(endAngle);
            const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', item.color);
            path.classList.add('cpwn-pm-pie-slice');
            path.style.cursor = 'pointer';
            path.style.transition = 'opacity 0.2s ease';

            // HOVER EVENT LISTENERS
            path.addEventListener('mouseenter', () => {
                path.style.opacity = '0.7';
            });

            path.addEventListener('mouseleave', () => {
                path.style.opacity = '1';
            });

            svg.appendChild(path);

            path.addEventListener('mousemove', (e) => {
                if (!this.tooltipEl) this.tooltipEl = document.body.createDiv({ cls: 'cpwn-pm-chart-tooltip' });
                this.tooltipEl.style.opacity = '1';
                this.tooltipEl.style.left = `${e.clientX + 15}px`;
                this.tooltipEl.style.top = `${e.clientY + 15}px`;
                this.tooltipEl.empty();
                this.tooltipEl.createDiv({ cls: 'cpwn-pm-tooltip-title', text: 'Tasks' });
                const content = this.tooltipEl.createDiv({ cls: 'cpwn-pm-tooltip-content' });
                const itemEl = content.createDiv({ cls: 'cpwn-pm-tooltip-item' });
                itemEl.createDiv({ cls: 'cpwn-pm-tooltip-color', style: `background-color: ${item.color}` });
                itemEl.createSpan({ text: `${item.label}: ${item.value}` });
            });
            path.addEventListener('mouseleave', () => { if (this.tooltipEl) this.tooltipEl.style.opacity = '0'; });
            cumulativePercent += percent;
        });

        // --- 4. RENDER THE LEGEND (If needed) ---
        if (showLegend) {
            this.renderLegend(chartWrapper, data);
        }
    }

    renderRadarChart(datasets, labels, config, legendConfig) {
        this.cleanup();
        const chartContainer = this.container.createDiv('cpwn-pm-css-chart-container');

        if (legendConfig?.display && legendConfig.position === 'top') {
            this.renderLegend(chartContainer, datasets);
        }

        const svgNs = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('class', 'cpwn-pm-radar-chart');
        svg.setAttribute('viewBox', '0 0 400 400');
        svg.style.overflow = 'visible';
        chartContainer.appendChild(svg);

        const centerX = 200;
        const centerY = 200;
        const maxRadius = 150;
        const numAxes = labels.length;

        if (numAxes === 0) {
            chartContainer.createDiv().setText('No data available.');
            return;
        }

        const allValues = datasets.flatMap(ds => ds.data);
        const maxValue = Math.max(...allValues, 0) || 1;

        // Draw grid lines
        for (let i = 1; i <= 5; i++) {
            const radius = (maxRadius / 5) * i;
            const circle = document.createElementNS(svgNs, 'circle');
            Object.entries({
                cx: centerX, cy: centerY, r: radius, class: 'grid-line',
                fill: 'none', stroke: 'var(--background-modifier-border)',
                'stroke-width': '1', 'stroke-dasharray': '2,2',
            }).forEach(([k, v]) => circle.setAttribute(k, v));
            svg.appendChild(circle);
        }

        // Draw axes and labels
        for (let i = 0; i < numAxes; i++) {
            const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + maxRadius * Math.cos(angle);
            const y = centerY + maxRadius * Math.sin(angle);

            const line = document.createElementNS(svgNs, 'line');
            Object.entries({
                x1: centerX, y1: centerY, x2: x, y2: y,
                stroke: 'var(--text-muted)', 'stroke-width': '1', opacity: '0.3',
            }).forEach(([k, v]) => line.setAttribute(k, v));
            svg.appendChild(line);

            let displayLabel = labels[i];
            if (config.groupBy === 'week') {
                try {
                    const match = labels[i].match(/(\d{4})-W(\d{2})/);
                    if (match) {
                        const date = moment().isoWeekYear(parseInt(match[1], 10)).isoWeek(parseInt(match[2], 10)).startOf('isoWeek');
                        if (date.isValid()) displayLabel = date.format('MMM D');
                    }
                } catch (e) { /* Keep original label */ }
            }

            const labelX = centerX + (maxRadius + 25) * Math.cos(angle);
            const labelY = centerY + (maxRadius + 25) * Math.sin(angle);
            const text = document.createElementNS(svgNs, 'text');
            Object.entries({
                x: labelX, y: labelY, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
                class: 'cpwn-axis-label', fill: 'var(--text-muted)', 'font-size': '12px',
            }).forEach(([k, v]) => text.setAttribute(k, v));
            text.textContent = displayLabel;
            svg.appendChild(text);
        }

        const pointElements = []; // Array to store all point elements for highlighting

        // Draw data paths and points for each metric
        datasets.forEach((ds, datasetIndex) => {
            pointElements.push([]); // Add a new row for this dataset
            const points = ds.data.map((value, i) => {
                const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
                const radius = (value / maxValue) * maxRadius;
                return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)];
            });

            const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

            const areaPath = document.createElementNS(svgNs, 'path');
            Object.entries({ d: pathData, fill: ds.color, opacity: '0.2', stroke: 'none' }).forEach(([k, v]) => areaPath.setAttribute(k, v));
            svg.appendChild(areaPath);

            const borderPath = document.createElementNS(svgNs, 'path');
            Object.entries({ d: pathData, fill: 'none', stroke: ds.color, 'stroke-width': '0' }).forEach(([k, v]) => borderPath.setAttribute(k, v));
            svg.appendChild(borderPath);

            // Draw data points and store them
            points.forEach((p, pointIndex) => {
                const circle = document.createElementNS(svgNs, 'circle');
                Object.entries({
                    cx: p[0], cy: p[1], r: 4, fill: ds.color,
                    stroke: 'var(--background-primary)', 'stroke-width': 1.0,
                    style: 'transition: r 0.15s ease-out;', // Smooth transition for radius change
                }).forEach(([k, v]) => circle.setAttribute(k, v));
                svg.appendChild(circle);
                pointElements[datasetIndex][pointIndex] = circle; // Store for highlighting
            });
        });

        // --- Start of Tooltip and Interaction Logic ---

        const hoverIndicator = document.createElementNS(svgNs, 'circle');
        Object.entries({
            r: 5, fill: 'var(--interactive-accent)', stroke: 'var(--background-primary)', 'stroke-width': 2,
            class: 'hover-indicator', style: 'display: none; pointer-events: none;',
        }).forEach(([k, v]) => hoverIndicator.setAttribute(k, v));
        svg.appendChild(hoverIndicator);

        const tooltipGroup = document.createElementNS(svgNs, 'g');
        tooltipGroup.setAttribute('class', 'tooltip-group');
        tooltipGroup.style.cssText = 'display: none; pointer-events: none;';

        const tooltipRect = document.createElementNS(svgNs, 'rect');
        Object.entries({ class: 'tooltip-rect', fill: 'rgba(26, 26, 26, 0.95)', stroke: 'none', rx: 6, ry: 6 }).forEach(([k, v]) => tooltipRect.setAttribute(k, v));
        const tooltipText = document.createElementNS(svgNs, 'text');
        Object.entries({ class: 'tooltip-text', fill: '#ffffff', 'font-size': '12px' }).forEach(([k, v]) => tooltipText.setAttribute(k, v));
        tooltipGroup.appendChild(tooltipRect);
        tooltipGroup.appendChild(tooltipText);
        svg.appendChild(tooltipGroup);






        const interactionRect = document.createElementNS(svgNs, 'rect');
        Object.entries({ x: 0, y: 0, width: 400, height: 400, fill: 'transparent' }).forEach(([k, v]) => interactionRect.setAttribute(k, v));
        svg.appendChild(interactionRect);

        let activeIndex = -1;

        interactionRect.addEventListener('mousemove', e => {
            const rect = svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            let angle = Math.atan2(dy, dx) + Math.PI / 2;
            if (angle < 0) angle += 2 * Math.PI;

            const sectionAngle = (2 * Math.PI) / numAxes;
            const closestIndex = Math.floor((angle + sectionAngle / 2) / sectionAngle) % numAxes;

            if (closestIndex !== activeIndex) {
                // De-highlight previous points
                if (activeIndex !== -1) {
                    pointElements.forEach(datasetPoints => datasetPoints[activeIndex]?.setAttribute('r', '4'));
                }

                activeIndex = closestIndex;

                // Highlight new points
                if (activeIndex !== -1) {
                    pointElements.forEach(datasetPoints => datasetPoints[activeIndex]?.setAttribute('r', '6'));

                    const indicatorAngle = (activeIndex / numAxes) * 2 * Math.PI - Math.PI / 2;
                    hoverIndicator.setAttribute('cx', (centerX + maxRadius * Math.cos(indicatorAngle)).toString());
                    hoverIndicator.setAttribute('cy', (centerY + maxRadius * Math.sin(indicatorAngle)).toString());
                    hoverIndicator.style.display = 'block';
                }

                // Build tooltip
                tooltipText.innerHTML = '';
                const weekIdentifier = labels[activeIndex];
                const dateText = moment(weekIdentifier, 'YYYY-[W]WW').format('MMM D');
                const weekNumText = `(W${weekIdentifier.slice(-2)})`;
                const fullLabel = `${dateText}, ${weekNumText}`;

                const titleTspan = document.createElementNS(svgNs, 'tspan');
                Object.entries({ x: 0, dy: '1.2em', 'font-weight': 'bold', 'font-size': '12px', fill: 'var(--text-muted)' }).forEach(([k, v]) => titleTspan.setAttribute(k, v));
                titleTspan.textContent = fullLabel;
                tooltipText.appendChild(titleTspan);

                //const spacer = document.createElementNS(svgNs, 'tspan');
                //Object.entries({ x: 0, dy: '0.8em' }).forEach(([k,v]) => spacer.setAttribute(k,v));
                //spacer.textContent = ' ';
                //tooltipText.appendChild(spacer);

                datasets.forEach((ds, i) => {
                    const tspan = document.createElementNS(svgNs, 'tspan');
                    Object.entries({ x: 0, dy: '1.3em' }).forEach(([k, v]) => tspan.setAttribute(k, v));
                    tspan.innerHTML = `<tspan fill="${ds.color}">● </tspan><tspan>${ds.label}: </tspan><tspan font-weight="600">${ds.data[activeIndex]}</tspan>`;
                    tooltipText.appendChild(tspan);
                });

                tooltipGroup.style.display = 'block';
                const bbox = tooltipText.getBBox();
                Object.entries({ x: bbox.x - 8, y: bbox.y - 8, width: bbox.width + 16, height: bbox.height + 16 }).forEach(([k, v]) => tooltipRect.setAttribute(k, v));
            }

            let tooltipX = mouseX + 20;
            const bbox = tooltipGroup.getBBox();
            if (tooltipX + bbox.width > 400) tooltipX = mouseX - bbox.width - 20;
            tooltipGroup.setAttribute('transform', `translate(${tooltipX}, ${mouseY})`);
        });

        interactionRect.addEventListener('mouseleave', () => {
            if (activeIndex !== -1) {
                pointElements.forEach(datasetPoints => datasetPoints[activeIndex]?.setAttribute('r', '4'));
            }
            activeIndex = -1;
            tooltipGroup.style.display = 'none';
            hoverIndicator.style.display = 'none';
        });

        if (legendConfig?.display && legendConfig.position === 'bottom') {
            this.renderLegend(chartContainer, datasets);
        }
    }


    // Renders a line chart with an optional "today" marker.
    renderLineChart(datasets, labels, config, legendConfig = {}, rawData, dateRange) {
        this.cleanup();
        const chartContainer = this.container.createDiv({ cls: 'cpwn-pm-css-chart-container' });

        if (legendConfig?.display && legendConfig.position === 'top') {
            this.renderLegend(chartContainer, datasets);
        }

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute('class', 'cpwn-pm-line-chart');

        const isMedium = config.size === 'medium';
        const viewBoxHeight = isMedium ? 175 : 300; // Medium charts will be less tall
        svg.setAttribute('viewBox', `0 0 500 ${viewBoxHeight}`);
        svg.style.overflow = 'visible';
        chartContainer.appendChild(svg);

        const allValues = datasets.flatMap(ds => ds.data);
        const maxValue = Math.max(...allValues, 0);

        if (!allValues.length || maxValue === 0) {
            chartContainer.createDiv({ text: 'No data available.', cls: 'cpwn-pm-empty-widget-message' });
            return;
        }

        const showBottomLegend = legendConfig?.display && legendConfig.position === 'bottom';

        // Check if we'll be showing year labels (when chart spans multiple years)
        const firstDate = moment(labels[0], ['YYYY-MM-DD', 'YYYY-[W]WW']);
        const lastDate = moment(labels[labels.length - 1], ['YYYY-MM-DD', 'YYYY-[W]WW']);
        const spansMultipleYears = firstDate.isValid() && lastDate.isValid() && firstDate.year() !== lastDate.year();

        // Adjust bottom padding based on whether we show year labels
        let bottomPadding = 20;
        if (showBottomLegend) {
            bottomPadding = 50;
        } else if (spansMultipleYears) {
            bottomPadding = 45; // Extra space when year labels are present
        }

        const padding = {
            top: 20,
            right: 20,
            bottom: bottomPadding,
            left: 30
        };

        const chartWidth = 500 - padding.left - padding.right;
        const chartHeight = viewBoxHeight - padding.top - padding.bottom;

        // Y-Axis
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * chartHeight;
            const line = document.createElementNS(svgNs, 'line');
            Object.entries({ x1: padding.left, y1: y, x2: 500 - padding.right, y2: y, class: 'grid-line' }).forEach(([key, val]) => line.setAttribute(key, val));
            svg.appendChild(line);

            const labelValue = maxValue * (1 - i / 4);
            const text = document.createElementNS(svgNs, 'text');
            Object.entries({ x: padding.left - 8, y: y, class: 'cpwn-axis-label', 'text-anchor': 'end', 'dominant-baseline': 'middle' }).forEach(([key, val]) => text.setAttribute(key, val));
            text.textContent = (labelValue < 1 && labelValue > 0) ? labelValue.toFixed(1) : Math.round(labelValue);
            svg.appendChild(text);
        }

        // --- NEW: Today Marker Logic ---
        // NEW Today Marker Logic
        if (config.todayMarker?.show && labels && labels.length > 0) {
            const today = moment();
            const dateFormats = ['YYYY-MM-DD', 'YYYY-[W]WW', 'YYYY-MM'];

            // Get first and last dates from labels
            const firstDate = moment(labels[0], dateFormats);
            const lastDate = moment(labels[labels.length - 1], dateFormats);

            // Check if today falls within the chart's date range
            if (today.isSameOrAfter(firstDate, 'day') && today.isSameOrBefore(lastDate, 'day')) {
                const totalDays = lastDate.diff(firstDate, 'days');
                const daysFromStart = today.diff(firstDate, 'days');

                // Calculate proportional position
                const proportion = totalDays > 0 ? daysFromStart / totalDays : 0;
                const x = padding.left + (proportion * chartWidth);

                const todayLine = document.createElementNS(svgNs, 'line');
                Object.entries({
                    x1: x,
                    y1: padding.top,
                    x2: x,
                    y2: padding.top + chartHeight,
                    stroke: config.todayMarker.color || 'var(--interactive-accent)',
                    'stroke-width': 1.5,
                    'stroke-dasharray': '4, 4',
                    'class': 'cpwn-pm-today-marker',
                }).forEach(([k, v]) => todayLine.setAttribute(k, v));
                svg.appendChild(todayLine);
            }
        }


        // X-Axis
        if (labels.length > 1) {
            const xAxisLabelsGroup = document.createElementNS(svgNs, 'g');
            xAxisLabelsGroup.setAttribute('class', 'x-axis-labels');
            svg.appendChild(xAxisLabelsGroup);

            const dateFormats = ['YYYY-MM-DD', 'YYYY-[W]WW'];

            // For cumulative charts with fixedStart, use the config's date range instead of data range
            let firstDate, lastDate;
            if (config.isCumulative && dateRange) {
                // Use the date range from the data configuration
                firstDate = dateRange.startDate;
                lastDate = dateRange.endDate;
            } else {
                firstDate = moment(labels[0], dateFormats);
                lastDate = moment(labels[labels.length - 1], dateFormats);
            }

            if (config.isCumulative && rawData && rawData.length > 0) {
                // Use the actual start/end from the raw data configuration
                const allDates = rawData.map(item => moment(item.date, dateFormats)).filter(d => d.isValid());
                if (allDates.length > 0) {
                    firstDate = moment.min(allDates);
                    lastDate = moment.max(allDates);
                } else {
                    firstDate = moment(labels[0], dateFormats);
                    lastDate = moment(labels[labels.length - 1], dateFormats);
                }
            } else {
                firstDate = moment(labels[0], dateFormats);
                lastDate = moment(labels[labels.length - 1], dateFormats);
            }

            const durationInDays = lastDate.diff(firstDate, 'days');
            const spansMultipleYears = firstDate.year() !== lastDate.year();
            let previousYear = null;
            const labelFormat = (durationInDays > 90) ? 'MMM' : 'D MMM';
            const maxLabels = 7;
            const step = Math.ceil(labels.length / maxLabels);

            for (let i = 0; i < labels.length; i += step) {
                const x = padding.left + (i / (labels.length - 1)) * chartWidth;

                // For cumulative charts with dateRange, calculate proportional dates
                let labelDate;
                if (config.isCumulative && dateRange) {
                    // Calculate date proportionally from firstDate to lastDate
                    const totalDays = lastDate.diff(firstDate, 'days');
                    const dayOffset = Math.round((i / (labels.length - 1)) * totalDays);
                    labelDate = firstDate.clone().add(dayOffset, 'days');
                } else {
                    labelDate = moment(labels[i], dateFormats);
                }

                const currentYear = labelDate.year();

                const dateText = document.createElementNS(svgNs, 'text');
                Object.entries({ x, y: padding.top + chartHeight + 20, class: 'cpwn-axis-label', 'text-anchor': 'middle' }).forEach(([k, v]) => dateText.setAttribute(k, v));
                dateText.textContent = labelDate.format(labelFormat);
                xAxisLabelsGroup.appendChild(dateText);

                if (spansMultipleYears && currentYear !== previousYear) {
                    const yearText = document.createElementNS(svgNs, 'text');
                    Object.entries({ x, y: padding.top + chartHeight + 35, class: 'cpwn-axis-label cpwn-year-label', 'text-anchor': 'middle' }).forEach(([k, v]) => yearText.setAttribute(k, v));
                    yearText.textContent = currentYear;
                    xAxisLabelsGroup.appendChild(yearText);
                    previousYear = currentYear;
                }
            }
        }

        // Data Lines
        datasets.forEach(ds => {

            if (!ds.data || !ds.data.length) return;

            const path = document.createElementNS(svgNs, 'path');



            // 1. Check if the current dataset is the projected line by comparing its label.
            const isProjection = config.projection?.show && ds.label === config.projection.label;
            if (isProjection) {
                path.setAttribute('class', 'line-path-projection-line');

                // 2. If it is, apply the special dotted line styling directly from the config.
                path.style.stroke = config.projection.color || 'var(--text-accent)';
                //path.setAttribute('stroke-dasharray', '5,5');
                // path.setAttribute('stroke-width', 3.5); // <-- Add this line
                //path.style.fill = 'none'; // Ensure the dotted line is never filled
            } else {
                // 3. Otherwise, it's a regular line, so apply its standard styling.
                path.setAttribute('class', 'line-path');
                path.style.stroke = ds.color || 'var(--text-accent)';
            }

            // Guard against trying to draw a line with a single point.
            if (ds.data.length < 2) {
                // Optionally render a single point if you wish, otherwise skip.
                return;
            }

            const points = ds.data.map((val, i) => {
                const x = padding.left + (i / (labels.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
                return [x, y];
            });

            const xAxisY = padding.top + chartHeight;
            const pathData = this.getPathDataForBezierCurve(points, 1, xAxisY);
            path.setAttribute('d', pathData);

            // This handles the fill for Area charts, but does not affect the line itself.
            if (config.chartType === 'area' && !isProjection) {
                const fillPath = document.createElementNS(svgNs, 'path');
                const fillPathData = pathData + ` L ${points[points.length - 1][0]},${xAxisY} L ${points[0][0]},${xAxisY} Z`;
                fillPath.setAttribute('d', fillPathData);
                fillPath.setAttribute('class', 'area-fill');
                fillPath.style.fill = ds.color;
                svg.insertBefore(fillPath, svg.firstChild);
            }

            svg.appendChild(path);

        });

        // Hover Interaction Logic
        if (labels.length > 0) {
            const hoverLine = document.createElementNS(svgNs, 'line');
            hoverLine.setAttribute('class', 'hover-line');
            hoverLine.setAttribute('y1', padding.top);
            hoverLine.setAttribute('y2', padding.top + chartHeight);
            hoverLine.style.display = 'none';
            svg.appendChild(hoverLine);

            const hoverPoints = datasets.map(ds => {
                const point = document.createElementNS(svgNs, 'circle');
                point.setAttribute('class', 'hover-point');
                point.setAttribute('r', '4');
                point.style.stroke = ds.color;
                point.style.display = 'none';
                svg.appendChild(point);
                return point;
            });

            const tooltipGroup = document.createElementNS(svgNs, 'g');
            tooltipGroup.setAttribute('class', 'tooltip-group');
            tooltipGroup.style.display = 'none';
            const tooltipRect = document.createElementNS(svgNs, 'rect');
            const tooltipText = document.createElementNS(svgNs, 'text');
            tooltipText.setAttribute('class', 'tooltip-text');
            tooltipGroup.appendChild(tooltipRect);
            tooltipGroup.appendChild(tooltipText);
            svg.appendChild(tooltipGroup);

            const interactionRect = document.createElementNS(svgNs, 'rect');
            Object.entries({ x: padding.left, y: padding.top, width: chartWidth, height: chartHeight, fill: 'transparent' }).forEach(([k, v]) => interactionRect.setAttribute(k, v));
            svg.appendChild(interactionRect);

            let activeIndex = -1;
            interactionRect.addEventListener('mousemove', (e) => {
                const CTM = svg.getScreenCTM();
                if (!CTM) return;
                const mouseX = (e.clientX - CTM.e) / CTM.a;
                const closestIndex = Math.max(0, Math.min(labels.length - 1, Math.round(((mouseX - padding.left) / chartWidth) * (labels.length - 1))));

                if (closestIndex !== activeIndex) {
                    activeIndex = closestIndex;
                    const x = padding.left + (activeIndex / (labels.length - 1)) * chartWidth;

                    hoverLine.setAttribute('x1', x);
                    hoverLine.setAttribute('x2', x);
                    hoverLine.style.display = 'block';

                    tooltipText.textContent = ''; // Clear previous text

                    // NEW: Add the date as the first line (title)
                    const dateTspan = document.createElementNS(svgNs, 'tspan');
                    dateTspan.setAttribute('x', 0);
                    dateTspan.setAttribute('dy', '1.2em');
                    dateTspan.setAttribute('class', 'tooltip-title');
                    dateTspan.style.fontWeight = 'bold';
                    dateTspan.style.fontSize = '14px';
                    dateTspan.style.fill = 'var(--text-muted)'; // Slightly muted color

                    // Format the date nicely based on groupBy
                    let dateLabel = labels[activeIndex];
                    if (config.groupBy === 'week') {
                        try {
                            const match = dateLabel.match(/(\d{4})-W(\d{2})/);
                            if (match) {
                                const year = parseInt(match[1], 10);
                                const week = parseInt(match[2], 10);
                                const weekStart = moment().isoWeekYear(year).isoWeek(week).startOf('isoWeek');
                                dateLabel = `${weekStart.format('MMM D, YYYY')}, (W${week})`;
                            }
                        } catch (e) {
                            // Keep original if parsing fails
                        }
                    } else if (config.groupBy === 'day') {
                        const dayMoment = moment(dateLabel, 'YYYY-MM-DD');
                        if (dayMoment.isValid()) {
                            dateLabel = dayMoment.format('MMM D, YYYY');
                        }
                    } else if (config.groupBy === 'month') {
                        const monthMoment = moment(dateLabel, 'YYYY-MM');
                        if (monthMoment.isValid()) {
                            dateLabel = monthMoment.format('MMMM YYYY');
                        }
                    }

                    dateTspan.textContent = dateLabel;
                    tooltipText.appendChild(dateTspan);

                    // NEW: Add a spacer line for visual separation
                    const spacerTspan = document.createElementNS(svgNs, 'tspan');
                    spacerTspan.setAttribute('x', 0);
                    spacerTspan.setAttribute('dy', '0.8em');
                    spacerTspan.textContent = ''; // Empty line for spacing
                    tooltipText.appendChild(spacerTspan);

                    // Add each dataset's value below the date with better spacing
                    datasets.forEach((ds, i) => {
                        const y = padding.top + (chartHeight - (ds.data[activeIndex] / maxValue) * chartHeight);
                        hoverPoints[i].setAttribute('cx', x);
                        hoverPoints[i].setAttribute('cy', y);
                        hoverPoints[i].style.display = 'block';

                        const tspan = document.createElementNS(svgNs, 'tspan');
                        tspan.setAttribute('x', 0);
                        tspan.setAttribute('dy', i === 0 ? '1.2em' : '1.3em'); // Less spacing for first item after gap

                        const circle = document.createElementNS(svgNs, 'tspan');
                        circle.setAttribute('fill', ds.color);
                        circle.textContent = '● ';

                        const label = document.createElementNS(svgNs, 'tspan');
                        label.setAttribute('class', 'tooltip-value-label');
                        label.textContent = `${ds.label}: `;

                        const value = document.createElementNS(svgNs, 'tspan');
                        value.setAttribute('class', 'tooltip-value');
                        value.setAttribute('font-weight', '600'); // Make values slightly bolder
                        value.textContent = ds.data[activeIndex];

                        tspan.appendChild(circle);
                        tspan.appendChild(label);
                        tspan.appendChild(value);
                        tooltipText.appendChild(tspan);
                    });


                    tooltipGroup.style.display = 'block';
                    const bbox = tooltipText.getBBox();
                    tooltipRect.setAttribute('x', bbox.x - 8);
                    tooltipRect.setAttribute('y', bbox.y - 8);
                    tooltipRect.setAttribute('width', bbox.width + 16);
                    tooltipRect.setAttribute('height', bbox.height + 16);

                    let tooltipX = x + 15;
                    if (tooltipX + bbox.width > 500) {
                        tooltipX = x - bbox.width - 30;
                    }
                    tooltipGroup.setAttribute('transform', `translate(${tooltipX}, ${padding.top + 5})`);
                }
            });

            interactionRect.addEventListener('mouseleave', () => {
                activeIndex = -1;
                hoverLine.style.display = 'none';
                hoverPoints.forEach(p => p.style.display = 'none');
                tooltipGroup.style.display = 'none';
            });
        }

        if (legendConfig?.display && legendConfig.position === 'bottom') {
            this.renderLegend(chartContainer, datasets);
        }
    }

    /**
    * Renders a bespoke cumulative area chart for Goal Momentum.
    * Strictly follows Obsidian UI guidelines (CSS classes, textContent).
    */
    renderWeeklyGoalMomentum(chartData, options = {}) {
        this.cleanup();
        const chartContainer = this.container.createDiv({ cls: 'cpwn-pm-css-chart-container' });

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");

        svg.setAttribute('viewBox', '0 0 300 125');
        svg.setAttribute('preserveAspectRatio', 'none');

        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');


        chartContainer.appendChild(svg);

        const dataset = chartData.datasets[0];
        if (!dataset || dataset.data.length < 2) {
            chartContainer.createDiv({ text: "Not enough data", cls: "cpwn-muted-text" });
            return;
        }

        const rawData = dataset.data;
        const minVal = Math.min(...rawData);
        const maxVal = Math.max(...rawData);
        const range = (maxVal - minVal) === 0 ? 10 : (maxVal - minVal);

        const padding = { top: 15, right: 10, bottom: 10, left: 10 };
        const width = 300 - padding.left - padding.right;
        const height = 120 - padding.top - padding.bottom;

        // Map values to coordinates
        const points = rawData.map((val, i) => {
            const x = padding.left + (i / (rawData.length - 1)) * width;
            // Normalize Y: Lowest value sits at bottom (y = height + top)
            const normalizedVal = val - minVal;
            const y = padding.top + height - (normalizedVal / range) * height;
            return { x, y, val };
        });

        // 1. Grid Lines (Stop at the dot)
        points.forEach((p) => {
            const gridLine = document.createElementNS(svgNs, 'line');
            gridLine.classList.add('cpwn-chart-grid-line');
            gridLine.setAttribute('x1', p.x);
            gridLine.setAttribute('y1', p.y); // Start EXACTLY at the dot
            gridLine.setAttribute('x2', p.x);
            gridLine.setAttribute('y2', padding.top + height); // Go down to bottom axis
            gridLine.setAttribute('stroke-opacity', '0.3'); // Subtle opacity via attribute
            svg.appendChild(gridLine);
        });

        // 2. Gradient Definition
        const defs = document.createElementNS(svgNs, 'defs');
        const gradientId = 'goalMomentumGradient-' + Math.random().toString(36).substr(2, 9);
        const gradient = document.createElementNS(svgNs, 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS(svgNs, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--interactive-accent)');
        stop1.setAttribute('stop-opacity', '0.5');

        const stop2 = document.createElementNS(svgNs, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--interactive-accent)');
        stop2.setAttribute('stop-opacity', '0.05');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // 3. Draw Paths
        const lineD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
        const areaD = `${lineD} L ${points[points.length - 1].x},${padding.top + height} L ${points[0].x},${padding.top + height} Z`;

        const areaPath = document.createElementNS(svgNs, 'path');
        areaPath.classList.add('cpwn-chart-area-fill');
        areaPath.setAttribute('d', areaD);
        areaPath.setAttribute('fill', `url(#${gradientId})`);
        svg.appendChild(areaPath);

        const linePath = document.createElementNS(svgNs, 'path');
        linePath.classList.add('cpwn-chart-line-stroke');
        linePath.setAttribute('d', lineD);
        svg.appendChild(linePath);

        // 4. Dots & Hit Targets
        points.forEach((p, i) => {
            const circle = document.createElementNS(svgNs, 'circle');
            circle.classList.add('cpwn-chart-dot');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '3.5');
            svg.appendChild(circle);

            // Invisible Hit Target
            const hitTarget = document.createElementNS(svgNs, 'rect');
            hitTarget.classList.add('cpwn-chart-hit-target');
            hitTarget.setAttribute('x', p.x - 10);
            hitTarget.setAttribute('y', padding.top);
            hitTarget.setAttribute('width', 20);
            hitTarget.setAttribute('height', height);

            // Tooltip Events (Using Arrow Functions to fix 'this' context)
            hitTarget.addEventListener('mouseenter', (e) => {
                const label = chartData.labels[i];
                const score = p.val.toLocaleString();

                // 1. Create a container div
                const content = document.createElement('div');

                // 2. Header
                const header = content.createDiv({ cls: 'cpwn-chart-tt-header' });
                header.style.fontWeight = 'bold';
                header.style.marginBottom = '6px';
                header.style.fontSize = '1.1em'; // Make header slightly larger too
                header.setText(`${label}: ${score} pts`);

                // 3. Breakdown
                if (chartData.breakdowns && chartData.breakdowns[i]) {
                    const bd = chartData.breakdowns[i];

                    if (bd.goals || bd.allMet || bd.streak || bd.multiplier) {
                        const bdContainer = content.createDiv({ cls: 'cpwn-chart-tt-breakdown' });
                        Object.assign(bdContainer.style, {
                            fontSize: '1em', // CHANGED: Was 0.85em. Now 1em (standard size)
                            opacity: '1',    // CHANGED: Increased opacity for better readability
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            marginTop: '6px',
                            paddingTop: '6px'
                        });

                        // Helper for rows with STRICT ALIGNMENT & LARGER TEXT
                        const addRow = (name, val) => {
                            const row = bdContainer.createDiv();
                            row.style.display = 'flex';
                            row.style.justifyContent = 'space-between';
                            row.style.alignItems = 'center';
                            row.style.marginBottom = '3px'; // Slightly more breathing room

                            // Left side (Label)
                            const left = row.createDiv();
                            left.style.display = 'flex';
                            left.style.alignItems = 'center';
                            left.createSpan({ text: name });

                            // Right side (Value)
                            const valSpan = row.createSpan({ text: `+${val}` });
                            valSpan.style.fontWeight = 'bold'; // Make the numbers pop
                            valSpan.style.color = 'var(--text-accent)';
                            valSpan.style.fontFamily = 'var(--font-monospace)';
                            // Optional: make the numbers specifically larger?
                            // valSpan.style.fontSize = '1.1em'; 
                        };

                        if (bd.goals > 0) addRow('Goals', bd.goals);
                        if (bd.allMet > 0) addRow('All Met', bd.allMet);
                        if (bd.streak > 0) addRow('Streak', bd.streak);
                        if (bd.multiplier > 0) addRow('Multiplier', bd.multiplier);
                    }
                }

                this.showTooltip(e, content);
                circle.setAttribute('r', '5.5');
            });

            hitTarget.addEventListener('mousemove', (e) => {
                this.moveTooltip(e);
            });

            hitTarget.addEventListener('mouseleave', () => {
                this.hideTooltip();
                circle.setAttribute('r', '3.5'); // Reset
            });

            svg.appendChild(hitTarget);
        });

        const labelClass = options.labelClass || 'cpwn-axis-label';

        // 5. X-Axis Labels
        chartData.labels.forEach((label, i) => {
            const text = document.createElementNS(svgNs, 'text');
            text.classList.add(labelClass);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('x', points[i].x);
            text.setAttribute('y', 127);
            text.textContent = label; // Use textContent
            svg.appendChild(text);
        });

    }

    showTooltip(e, content) {
        // Create tooltip element if it doesn't exist
        if (!this.tooltipEl) {
            this.tooltipEl = document.body.createDiv({ cls: 'cpwn-chart-tooltip' });
            this.tooltipEl.style.position = 'absolute';
            this.tooltipEl.style.zIndex = '1000';
            this.tooltipEl.style.pointerEvents = 'none'; // Prevent tooltip from blocking mouse
            this.tooltipEl.style.backgroundColor = 'var(--background-primary)';
            this.tooltipEl.style.border = '1px solid var(--background-modifier-border)';
            this.tooltipEl.style.padding = '8px';
            this.tooltipEl.style.borderRadius = '4px';
            this.tooltipEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        }

        // Clear previous content
        this.tooltipEl.empty();

        // Append new content safely
        if (typeof content === 'string') {
            this.tooltipEl.setText(content);
        } else if (content instanceof HTMLElement) {
            this.tooltipEl.appendChild(content);
        }

        // Position the tooltip
        this.moveTooltip(e);

        // Ensure it's visible
        this.tooltipEl.style.display = 'block';
    }

    /**
     * Updates the tooltip position to follow the mouse.
     * Adds smart positioning to prevent overflow on the right edge.
     * @param {MouseEvent} e - The mouse movement event.
     */
    moveTooltip(e) {
        if (!this.tooltipEl) return;

        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 1. Calculate initial position (e.g., 15px offset from cursor)
        let left = e.clientX + 15;
        let top = e.clientY + 15;

        // 2. Right Boundary Check
        // If the tooltip's right edge exceeds the viewport width...
        if (left + tooltipRect.width > viewportWidth - 10) { // 10px buffer
            // ...flip it to the left side of the cursor
            left = e.clientX - tooltipRect.width - 15;
        }

        // 3. Left Boundary Check (Safety net)
        // If flipping it left pushed it off the left edge (very narrow screen)...
        if (left < 10) {
            left = 10; // Anchor it to the left edge with padding
        }

        // 4. Bottom Boundary Check
        // If the tooltip's bottom edge exceeds the viewport height...
        if (top + tooltipRect.height > viewportHeight - 10) {
            // ...flip it to above the cursor
            top = e.clientY - tooltipRect.height - 15;
        }

        // 5. Top Boundary Check (Safety net)
        // If flipping it up pushed it off the top edge...
        if (top < 10) {
            top = 10; // Anchor to top edge
        }

        // 6. Apply coordinates
        this.tooltipEl.style.left = `${left}px`;
        this.tooltipEl.style.top = `${top}px`;
    }

    /*
    moveTooltip(e) {
        if (this.tooltipEl) {
            const tooltipRect = this.tooltipEl.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const offset = 15; // Base offset from cursor

            let left = e.pageX + offset;
            let top = e.pageY + offset;

            // Check for right overflow
            if (left + tooltipRect.width > viewportWidth - 20) { // 20px buffer
                // Flip to left side of cursor
                left = e.pageX - tooltipRect.width - offset;
            }

            // Optional: Check for bottom overflow (flip up)
            const viewportHeight = window.innerHeight;
            if (top + tooltipRect.height > viewportHeight - 20) {
                top = e.pageY - tooltipRect.height - offset;
            }

            this.tooltipEl.style.left = `${left}px`;
            this.tooltipEl.style.top = `${top}px`;
        }
    }
    */

    /**
     * Hides the tooltip from view.
     */
    hideTooltip() {
        if (this.tooltipEl) {
            this.tooltipEl.style.display = 'none';
        }
    }

}
