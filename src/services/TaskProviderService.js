import moment from 'moment';

export class TaskProviderService {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.todoistQueryUnsubscribe = null;
        this.todoistChangeUnsubscribe = null;
        this.closedTodoistTaskIds = new Set();
    }

    getConfiguredSources() {
        const source = this.plugin.settings.taskSource || 'obsidian';
        return {
            useObsidian: source === 'obsidian' || source === 'both',
            useTodoist: source === 'todoist' || source === 'both'
        };
    }

    async getTasks() {
        const { useObsidian, useTodoist } = this.getConfiguredSources();
        const tasks = [];

        if (useObsidian) {
            tasks.push(...this.getObsidianTasks());
        }

        if (useTodoist) {
            tasks.push(...await this.getTodoistTasks());
        }

        return tasks;
    }

    getObsidianTasks() {
        const tasksPlugin = this.app.plugins.plugins['obsidian-tasks-plugin'];
        if (!tasksPlugin || typeof tasksPlugin.getTasks !== 'function') {
            console.warn('[CPWN] Obsidian Tasks plugin not found or not ready.');
            return [];
        }

        try {
            return tasksPlugin.getTasks().map(task => this.normalizeObsidianTask(task));
        } catch (error) {
            console.error('[CPWN] Error reading Obsidian Tasks tasks.', error);
            return [];
        }
    }

    normalizeObsidianTask(task) {
        const path = task.path || task.file?.path || '';
        const dueMoment = this.getDateMoment(task.due, task.dueDate);
        const createdMoment = this.getDateMoment(task.created, task.createdDate);
        const doneMoment = this.getDateMoment(task.done, task.doneDate);

        return {
            ...task,
            source: 'obsidian-tasks',
            cpwnId: `obsidian:${path}:${task.lineNumber ?? ''}`,
            path,
            file: task.file || (path ? { path } : null),
            tags: task.tags || [],
            due: dueMoment ? this.withMoment(task.due, dueMoment) : task.due,
            dueDate: dueMoment ? dueMoment.format('YYYY-MM-DD') : task.dueDate,
            created: createdMoment ? this.withMoment(task.created, createdMoment) : task.created,
            createdDate: createdMoment ? createdMoment.format('YYYY-MM-DD') : task.createdDate,
            done: doneMoment ? this.withMoment(task.done, doneMoment) : task.done,
            doneDate: doneMoment ? doneMoment.format('YYYY-MM-DD') : task.doneDate
        };
    }

    getDateMoment(...candidates) {
        for (const candidate of candidates) {
            if (!candidate) continue;

            const raw = candidate?.moment || candidate;
            if (moment.isMoment(raw)) {
                if (raw.isValid()) return raw.clone();
                continue;
            }

            const parsed = moment(raw, ['YYYY-MM-DD', moment.ISO_8601], true);
            if (parsed.isValid()) return parsed;

            const fallback = moment(new Date(raw));
            if (fallback.isValid()) return fallback;
        }

        return null;
    }

    withMoment(original, dateMoment) {
        const base = original && typeof original === 'object' && !moment.isMoment(original)
            ? original
            : {};
        return {
            ...base,
            moment: dateMoment.clone()
        };
    }

    getTodoistPlugin() {
        return this.app.plugins.plugins['todoist-sync-plugin'];
    }

    async getTodoistTasks() {
        const todoistService = this.getTodoistPlugin()?.services?.todoist;
        if (!todoistService || typeof todoistService.subscribe !== 'function') {
            console.warn('[CPWN] Todoist Sync plugin not found or not ready.');
            return [];
        }

        const rawFilter = this.plugin.settings.todoistFilter;
        const filter = typeof rawFilter === 'string' && rawFilter.trim()
            ? rawFilter.trim()
            : undefined;

        if (!filter) {
            const allActiveTasks = await this.getAllActiveTodoistTasks(todoistService);
            if (allActiveTasks) {
                return allActiveTasks;
            }
        }

        return new Promise((resolve) => {
            let settled = false;
            let unsubscribe = null;

            const finish = (tasks) => {
                if (settled) return;
                settled = true;
                resolve((tasks || [])
                    .filter(task => !this.closedTodoistTaskIds.has(task.id))
                    .map(task => this.normalizeTodoistTask(task)));
            };

            try {
                const result = todoistService.subscribe(filter, (subscriptionResult) => {
                    if (subscriptionResult?.type === 'success') {
                        finish(subscriptionResult.tasks || []);
                    } else if (subscriptionResult?.type === 'error') {
                        console.error('[CPWN] Todoist task query failed.', subscriptionResult);
                        finish([]);
                    }
                });

                unsubscribe = result?.[0];
                const refresh = result?.[1];
                if (this.todoistQueryUnsubscribe && this.todoistQueryUnsubscribe !== unsubscribe) {
                    this.todoistQueryUnsubscribe();
                }
                this.todoistQueryUnsubscribe = unsubscribe;

                if (typeof refresh === 'function') {
                    Promise.resolve(refresh()).catch(error => {
                        console.error('[CPWN] Todoist task refresh failed.', error);
                        finish([]);
                    });
                } else {
                    finish([]);
                }
            } catch (error) {
                console.error('[CPWN] Todoist task integration failed.', error);
                if (typeof unsubscribe === 'function') unsubscribe();
                finish([]);
            }

            window.setTimeout(() => finish([]), 5000);
        });
    }

    async getAllActiveTodoistTasks(todoistService) {
        const api = todoistService?.api;
        if (!api || typeof api.withInner !== 'function') {
            return null;
        }

        try {
            const tasks = await api.withInner(innerApi => innerApi.getTasks());
            return (tasks || [])
                .filter(task => !this.closedTodoistTaskIds.has(task.id))
                .map(task => this.normalizeTodoistTask(task));
        } catch (error) {
            console.error('[CPWN] Todoist all-active task query failed.', error);
            return null;
        }
    }

    subscribeTodoistChanges(onChange) {
        const { useTodoist } = this.getConfiguredSources();
        if (!useTodoist) return null;

        const todoistService = this.getTodoistPlugin()?.services?.todoist;
        if (!todoistService) {
            return null;
        }

        return this.subscribeTodoistQuerySignal(todoistService, onChange);
    }

    subscribeTodoistQuerySignal(todoistService, onChange) {
        if (typeof todoistService.subscribe !== 'function') {
            return null;
        }

        const rawFilter = this.plugin.settings.todoistFilter;
        const signalFilter = typeof rawFilter === 'string' && rawFilter.trim()
            ? rawFilter.trim()
            : 'today | overdue | no date';

        let skipNextCallback = false;
        try {
            const result = todoistService.subscribe(signalFilter, (subscriptionResult) => {
                if (subscriptionResult?.type !== 'success') return;
                if (skipNextCallback) {
                    skipNextCallback = false;
                    return;
                }
                onChange?.();
            });

            const unsubscribe = result?.[0];
            const refresh = result?.[1];

            if (this.todoistChangeUnsubscribe && this.todoistChangeUnsubscribe !== unsubscribe) {
                this.todoistChangeUnsubscribe();
            }
            this.todoistChangeUnsubscribe = unsubscribe;

            if (typeof refresh === 'function') {
                skipNextCallback = true;
                Promise.resolve(refresh()).catch(error => {
                    console.error('[CPWN] Todoist change subscription refresh failed.', error);
                    skipNextCallback = false;
                });
            }

            return unsubscribe;
        } catch (error) {
            console.error('[CPWN] Todoist change subscription failed.', error);
            return null;
        }
    }

    unsubscribeTodoistChanges() {
        if (this.todoistChangeUnsubscribe) {
            this.todoistChangeUnsubscribe();
            this.todoistChangeUnsubscribe = null;
        }
    }

    normalizeTodoistTask(task) {
        const dueMoment = this.getTodoistDueMoment(task);
        const createdMoment = task.createdAt || task.addedAt ? moment(task.createdAt || task.addedAt) : null;
        const tags = (task.labels || []).map(label => {
            if (typeof label === 'string') return label.startsWith('#') ? label : `#${label}`;
            const name = label?.name || label?.id || '';
            return name ? (name.startsWith('#') ? name : `#${name}`) : '';
        }).filter(Boolean);

        const priorityMap = { 4: 0, 3: 1, 2: 4, 1: 5 };
        const content = task.content || 'Todoist task';
        const todoistDescription = task.description || '';

        return {
            source: 'todoist',
            cpwnId: `todoist:${task.id}`,
            id: task.id,
            todoistId: task.id,
            original: task,
            description: content,
            content,
            todoistDescription,
            status: { type: 'TODO', symbol: ' ' },
            isDone: false,
            due: dueMoment ? { moment: dueMoment } : null,
            dueDate: dueMoment ? dueMoment.format('YYYY-MM-DD') : null,
            done: null,
            doneDate: null,
            created: createdMoment?.isValid() ? { moment: createdMoment } : null,
            createdDate: createdMoment?.isValid() ? createdMoment.format('YYYY-MM-DD') : null,
            tags,
            priority: priorityMap[task.priority] ?? 5,
            path: '',
            file: null,
            lineNumber: null,
            project: task.project,
            section: task.section,
            recurrenceRule: task.due?.isRecurring ? 'Todoist recurring task' : null
        };
    }

    getTodoistDueMoment(task) {
        const due = task?.due;
        if (!due) return null;
        const rawDate = due.datetime || due.date;
        if (!rawDate) return null;
        const parsed = moment(rawDate);
        return parsed.isValid() ? parsed : null;
    }

    async toggleTask(task) {
        if (task.source === 'todoist') {
            const todoistService = this.getTodoistPlugin()?.services?.todoist;
            if (!todoistService?.actions?.closeTask) {
                throw new Error('Todoist Sync plugin API not found.');
            }
            this.markTodoistTaskClosed(task.todoistId || task.id);
            await todoistService.actions.closeTask(task.todoistId || task.id);
            return;
        }

        throw new Error('Unsupported task source.');
    }

    async createTodoistTask(content, options = {}) {
        const todoistService = this.getTodoistPlugin()?.services?.todoist;
        if (!todoistService?.actions?.createTask) {
            throw new Error('Todoist Sync plugin API not found.');
        }

        const params = {};
        if (options.description) {
            params.description = options.description;
        }
        if (options.dueDate) {
            params.dueDate = options.dueDate;
        }
        if (options.deadlineDate) {
            params.deadlineDate = options.deadlineDate;
        }
        if (Array.isArray(options.labels) && options.labels.length) {
            params.labels = options.labels;
        }
        if (options.priority) {
            params.priority = Number(options.priority) || 1;
        }

        const task = await todoistService.actions.createTask(content, params);
        if (task?.id) {
            this.closedTodoistTaskIds.delete(task.id);
        }
        return task;
    }

    markTodoistTaskClosed(taskId) {
        if (!taskId) return;
        this.closedTodoistTaskIds.add(taskId);
        window.setTimeout(() => {
            this.closedTodoistTaskIds.delete(taskId);
        }, 5 * 60 * 1000);
    }

    unload() {
        if (this.todoistQueryUnsubscribe) {
            this.todoistQueryUnsubscribe();
            this.todoistQueryUnsubscribe = null;
        }
        this.unsubscribeTodoistChanges();
    }
}
