// src/data/templates.js

import kpi from '../templates/kpi-due.json';
import cumulative from '../templates/cumulative-created-vs-completed.json';
import line from '../templates/line-7-day-completion.json';
import pie from '../templates/pie-30-day-status.json';
import radar from '../templates/radar-created-vs-completed.json';

// Export all imported templates as a single array.
export const BUNDLED_TEMPLATES = [
    kpi,
    cumulative,
    line,
    pie,
    radar,
];


