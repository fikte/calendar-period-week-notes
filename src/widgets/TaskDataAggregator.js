// src/widgets/TaskDataAggregator.js
import { moment } from 'obsidian';

export class TaskDataAggregator {
    /**
     * Filters and groups tasks based on a widget configuration.
     * @param {Array<object>} allTasks - An array of all task objects from your vault.
     * @param {object} config - The widget's configuration object.
     * @returns {Map<string, number>} A map of labels to values (e.g., dates to counts).
     */
    static process(allTasks, config) {
        const { metric, dateRange } = config;
        const now = moment();
        let startDate, endDate;

        // 1. Determine the date range
        if (dateRange.look === 'back') {
            startDate = now.clone().subtract(dateRange.value, dateRange.unit).startOf('day');
            endDate = now.clone().endOf('day');
        } else { // 'forward'
            startDate = now.clone().startOf('day');
            endDate = now.clone().add(dateRange.value, dateRange.unit).endOf('day');
        }

        // 2. Filter tasks by the selected metric and date range
        const filteredTasks = allTasks.filter(task => {
            let dateToTest = null;
            let statusMatch = false;

            // Determine which date to use based on the metric
            switch (metric) {
                case 'completed':
                    dateToTest = task.completionDate;
                    statusMatch = task.status === 'x';
                    break;
                case 'created':
                    dateToTest = task.createdDate;
                    statusMatch = true; // All statuses are relevant for creation date
                    break;
                case 'due':
                case 'overdue':
                    dateToTest = task.dueDate;
                    statusMatch = task.status !== 'x'; // Not completed
                    break;
                default:
                    dateToTest = task.createdDate; // Default to created date
                    statusMatch = true;
            }

            if (metric === 'overdue') {
                return dateToTest && moment(dateToTest).isBefore(now, 'day') && statusMatch;
            }

            return statusMatch && dateToTest && moment(dateToTest).isBetween(startDate, endDate, null, '[]');
        });

        // 3. Group the filtered tasks
        return this.groupTasks(filteredTasks, config);
    }

    /**
     * Groups tasks by the specified dimension (day, tag, etc.).
     * @param {Array<object>} tasks - The tasks to group.
     * @param {object} config - The widget configuration.
     * @returns {Map<string, number>}
     */
    static groupTasks(tasks, config) {
        const groupedData = new Map();
        const { groupBy } = config;

        for (const task of tasks) {
            let keys = [];
            switch (groupBy) {
                case 'day':
                    const dateField = (config.metric === 'completed') ? task.completionDate : (task.dueDate || task.createdDate);
                    if (dateField) keys.push(moment(dateField).format('YYYY-MM-DD'));
                    break;
                case 'tag':
                    if (task.tags && task.tags.length > 0) {
                        keys = task.tags.map(t => t.replace(/^#/, ''));
                    }
                    break;
                case 'priority':
                    if (task.priority) keys.push(task.priority);
                    break;
                default:
                    keys.push('Total');
            }

            for (const key of keys) {
                groupedData.set(key, (groupedData.get(key) || 0) + 1);
            }
        }
        return groupedData;
    }
}

