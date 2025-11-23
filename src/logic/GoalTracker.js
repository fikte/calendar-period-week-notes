import { moment, TFile } from 'obsidian';

export class GoalTracker {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;

        if (!this.settings.goalScoreHistory) {
            this.settings.goalScoreHistory = {};
        }
        if (!this.settings.vacationHistory) {
            this.settings.vacationHistory = {};
        }
    }

    /**
     * Checks a single goal and returns its status, including current progress.
     * @param {object} goal - The goal configuration object.
     * @param {moment.Moment} date - The date to check against.
     * @param {Array} allTasks - The complete list of tasks.
     * @returns {Promise<{isMet: boolean, current: number}>}
     */
    async checkGoal(goal, date, allTasks) {
        let result = { isMet: false, current: 0 };

        switch (goal.type) {
            case 'note-created':
                result = await this.checkNoteCreated(date, goal.folder);
                break;
            case 'word-count':
                result = await this.checkWordCount(date, goal.folder, goal.target);
                break;
            case 'task-count':
                result = this.checkTaskCount(date, allTasks, goal.query, goal.target);
                break;
        }
        return result;
    }

    /**
     * Calculates the total score for a day with bonuses, active-day rules,
     * vacation mode, and persistent caching.
     * @param {moment.Moment} date - The date to score.
     * @param {Array} allTasks - The complete list of tasks.
     * @returns {Promise<{date: string, totalPoints: number, results: Array<object>, allMet: boolean, level: number, levelTitle: string, levelIcon: string}>}
     */
    async calculateDailyScore(date, allTasks = []) {

        if (this.settings.vacationModeGlobal) {
            // Vacation applies to all goals, skip scoring
            return {
                date: date.format('YYYY-MM-DD'),
                totalPoints: 0,
                results: [],
                allMet: false,
                level: 0,
                levelTitle: '',
                levelIcon: ''
            };
        }

        const isoKey = date.format('YYYY-MM-DD');

        const todayStart = moment().startOf('day');
        const dateStart = date.clone().startOf('day');
        const canUseCache = dateStart.isBefore(todayStart, 'day');

        // 0. Return cached snapshot if available
        if (canUseCache &&
            this.settings.goalScoreHistory &&
            this.settings.goalScoreHistory[isoKey]) {
            return this.settings.goalScoreHistory[isoKey];
        }

        // Ensure containers exist
        if (!this.settings.goalScoreHistory) this.settings.goalScoreHistory = {};
        if (!this.settings.vacationHistory) this.settings.vacationHistory = {};

        const vacationForDay = this.settings.vacationHistory[isoKey] || {};

        let totalPoints = 0;
        const results = [];

        const goals = this.settings.goals || [];
        const weekdayIndex = date.isoWeekday() - 1; // 0=Mon .. 6=Sun

        let activeGoalsCount = 0;
        let metGoalsCount = 0;

        const activeGoals = (this.settings.goals || []).filter(g => !!g.enabled);

        for (const goal of activeGoals) {
            const activeDays = Array.isArray(goal.activeDays) && goal.activeDays.length > 0
                ? goal.activeDays
                : [0, 1, 2, 3, 4, 5, 6];

            const isActiveToday = activeDays.includes(weekdayIndex);

            // Historical vacation: if this goal was ever on vacation for this date,
            // keep that regardless of the current toggle state.
            const isVacationToday =
                !!vacationForDay[goal.id] || !!goal.vacationMode === true;

            // If the goal is in vacationMode *now* and the day is being scored,
            // persist that into vacationHistory so future recalcs remember it.
            if (isActiveToday && goal.vacationMode) {
                if (!this.settings.vacationHistory[isoKey]) {
                    this.settings.vacationHistory[isoKey] = {};
                }
                this.settings.vacationHistory[isoKey][goal.id] = true;
            }

            let result = { isMet: false, current: 0 };
            if (isActiveToday && !isVacationToday) {
                result = await this.checkGoal(goal, date, allTasks);
                activeGoalsCount++;
            } else if (isActiveToday && isVacationToday) {
                // still "active" for display purposes but we won't penalise
                result = await this.checkGoal(goal, date, allTasks);
                activeGoalsCount++;
            }

            let goalPoints = 0;

            if (isActiveToday && result.isMet && !isVacationToday) {
                metGoalsCount++;

                const baseValue = parseInt(goal.points || 0);
                goalPoints = baseValue;

                if (goal.type === 'task-count') {
                    const extra = Math.max(0, result.current - goal.target);
                    if (extra > 0) {
                        goalPoints += extra * 2;
                    }
                }
            } else if (isActiveToday && !result.isMet && !isVacationToday) {
                // PENALTY for missing a goal, unless vacation is recorded
                goalPoints = -10;
            } else {
                // Not active today or vacation → neutral
                goalPoints = 0;
            }

            totalPoints += goalPoints;

            //MERCY RULE 
            // If user met NO goals at all, assume it was a non-tracking day (e.g. before install)
            // and reset negative scores to 0.
            if (metGoalsCount === 0 && totalPoints < 0) {
                totalPoints = 0;
            }

            results.push({
                id: goal.id,
                name: goal.name,
                isMet: isActiveToday ? result.isMet : false,
                isActiveToday,
                isVacationToday,
                points: goalPoints,
                target: goal.target,
                current: result.current,
                type: goal.type
            });
        }

        // 2. "All Goals Met" Daily Bonus (only active goals count)
        const allGoalsMet = activeGoalsCount > 0 && metGoalsCount === activeGoalsCount;
        if (allGoalsMet) {
            totalPoints += 100;
        }

        // 3. Small Goal Count Multiplier (1–2 active goals)
        if (activeGoalsCount > 0 && activeGoalsCount < 3) {
            totalPoints = Math.floor(totalPoints * 1.5);
        }

        // 4. Streak Bonus (Check Yesterday Only, using active goals)
        if (allGoalsMet) {
            const yesterday = date.clone().subtract(1, 'days');
            const yesterdayResults = await this.calculateDailyScoreSimple(yesterday, allTasks);
            if (yesterdayResults.allMet) {
                totalPoints += 50;
            }
        }

        // 5. Get Achievement Level for this day's score
        const achievement = this.getAchievementLevel(totalPoints);

        const resultObj = {
            date: isoKey,
            totalPoints,
            results,
            allMet: allGoalsMet,
            level: achievement.level,
            levelTitle: achievement.title,
            levelIcon: achievement.icon
        };

        // 6. Persist snapshot in cache for past days
        if (canUseCache) {
            if (!this.settings.goalScoreHistory) {
                this.settings.goalScoreHistory = {};
            }
            this.settings.goalScoreHistory[isoKey] = {
                ...resultObj,
                cachedAt: Date.now()
            };
        }

        return resultObj;
    }


    // Simplified calculation for "Yesterday" to avoid infinite loops/deep recursion
    async calculateDailyScoreSimple(date, allTasks) {
        const activeGoals = (this.settings.goals || []).filter(g => !!g.enabled);

        if (activeGoals.length === 0) return { allMet: false };

        let met = 0;
        for (const goal of activeGoals) {
            const res = await this.checkGoal(goal, date, allTasks);
            if (res.isMet) met++;
        }
        return { allMet: met === activeGoals.length };
    }

    // --- HELPER TO GET DAILY NOTE PATH ---
    getDailyNotePath(date, overrideFolder) {
        let folder = overrideFolder || '';
        let format = 'YYYY-MM-DD';

        // 1. Try Periodic Notes (Community Plugin)
        // Attempt to detect Periodic Notes plugin (community plugin)
        const periodicNotes = this.app.plugins.plugins['periodic-notes'];
        if (periodicNotes && periodicNotes.settings?.daily?.enabled) {
            const daily = periodicNotes.settings.daily;
            if (!folder) folder = daily.folder || '';
            format = daily.format || 'YYYY-MM-DD';
        }
        else {
            // 2. Try Core Daily Notes Plugin
            const dailyNotes = this.app.internalPlugins.getPluginById('daily-notes');
            if (dailyNotes && dailyNotes.instance && dailyNotes.instance.options) {
                const options = dailyNotes.instance.options;
                if (!folder) folder = options.folder || '';
                format = options.format || 'YYYY-MM-DD';
            }
        }

        // 3. Fallback
        if (!format) format = 'YYYY-MM-DD';

        // 4. Construct Path
        const filename = date.format(format);
        const normalizedFolder = folder ? folder.trim().replace(/^\/|\/$/g, '') : '';
        const fullPath = normalizedFolder ? `${normalizedFolder}/${filename}.md` : `${filename}.md`;

        return fullPath;
    }

    /**
     * Checks if a daily note exists.
     */
    async checkNoteCreated(date, folderPath) {
        const path = this.getDailyNotePath(date, folderPath);
        const file = this.app.vault.getAbstractFileByPath(path);
        const exists = file instanceof TFile;
        return { isMet: exists, current: exists ? 1 : 0 };
    }

    /**
     * Checks word count in a daily note.
     */
    async checkWordCount(date, folderPath, target) {
        const path = this.getDailyNotePath(date, folderPath);
        const file = this.app.vault.getAbstractFileByPath(path);

        if (!file || !(file instanceof TFile)) {
            return { isMet: false, current: 0 };
        }

        const content = await this.app.vault.read(file);
        const contentBody = content.replace(/^---[\s\S]+?---/, ''); // Strip frontmatter
        const words = contentBody.trim().split(/\s+/).filter(w => w.length > 0).length;

        return { isMet: words >= target, current: words };
    }

    /**
     * Checks completed task count.
     */
    checkTaskCount(date, allTasks, tagQuery, target) {
        if (!allTasks) return { isMet: false, current: 0 };

        const targetDateStart = date.clone().startOf('day');
        const targetDateEnd = date.clone().endOf('day');

        const completed = allTasks.filter(t => {
            const isDone = t.status === 'x' || t.status?.type === 'DONE';
            if (!isDone) return false;

            const completionDate = t.done?.moment || (t.completionDate ? moment(t.completionDate) : null);
            if (!completionDate) return false;

            const isSameDay = completionDate.isBetween(targetDateStart, targetDateEnd, null, '[]');

            const matchesTag = tagQuery
                ? (t.tags && t.tags.some(tag => tag.includes(tagQuery.replace('#', ''))))
                : true;

            return isSameDay && matchesTag;
        });

        return { isMet: completed.length >= target, current: completed.length };
    }

    getAchievementLevel(points) {
        const LEVEL_BANDS = [
            { frac: 1.00, title: "Grandmaster of Flow", icon: "infinity" },
            { frac: 0.90, title: "Legendary Leader", icon: "crown" },
            { frac: 0.80, title: "Relentless Result", icon: "trophy" },
            { frac: 0.70, title: "Task Titan", icon: "medal" },
            { frac: 0.60, title: "Output Overlord", icon: "award" },
            { frac: 0.50, title: "High Performer", icon: "star" },
            { frac: 0.40, title: "Productivity Pro", icon: "zap" },
            { frac: 0.30, title: "Goal Getter", icon: "target" },
            { frac: 0.22, title: "Focused Ninja", icon: "crosshair" },
            { frac: 0.16, title: "Efficiency Enthusiast", icon: "gauge" },
            { frac: 0.10, title: "Daily Driver", icon: "calendar-check" },
            { frac: 0.06, title: "Momentum Maker", icon: "trending-up" },
            { frac: 0.03, title: "Task Tinkerer", icon: "check-circle-2" },
            { frac: 0.01, title: "Routine Rookie", icon: "clipboard-list" },
            { frac: 0.00, title: "Starter Spark", icon: "sprout" }
        ];

        //const target = this.getLifetimeTargetPoints();
        const target = this.getLifetimeTargetPoints() || 300000;        
        if (!target) {
            // Fallback: no goals yet
            return { min: 0, title: "Starter Spark", level: 1, icon: "sprout" };
        }

        const levels = LEVEL_BANDS
            .map((band, idx) => ({
                min: Math.round(band.frac * target),
                title: band.title,
                level: LEVEL_BANDS.length - idx,
                icon: band.icon
            }))
            // IMPORTANT: sort from highest min to lowest
            .sort((a, b) => b.min - a.min);

        // Find the highest band whose min you meet
        const match = levels.find(l => points >= l.min);
        return match || levels[levels.length - 1];

    }

    static async getLifetimePoints(app, settings, allTasks) {
        const history = settings.goalScoreHistory || {};
        let total = 0;
        for (const dateKey in history) {
            total += history[dateKey].totalPoints || 0;
        }
        return total;
    }

    getLifetimeTargetPoints() {
        const idealDaily = this.getIdealDailyMax();
        if (!idealDaily) return 0;

        // Assume a typical user hits ~80% of ideal on average
        const typicalDaily = idealDaily * 0.8;

        const daysForMaxLevel = 3 * 365; // 3 years
        return Math.round(typicalDaily * daysForMaxLevel);
    }

    getIdealDailyMax() {
        const goals = this.settings.goals || [];
        if (goals.length === 0) return 0;

        // Sum configured points for all goals
        let base = goals.reduce((acc, g) => acc + (parseInt(g.points || 0) || 0), 0);

        // Assume "all goals met" bonus
        base += 100;

        // If user has only 1–2 goals, they still get the small multiplier
        if (goals.length < 3) {
            base = Math.floor(base * 1.5);
        }

        // Assume they're in a streak on a good day
        base += 50;

        return base;  // this is "max-ish" points for a really good day
    }
}
