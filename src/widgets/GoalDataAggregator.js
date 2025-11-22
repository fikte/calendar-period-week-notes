import { GoalTracker } from '../logic/GoalTracker';
import { moment } from 'obsidian';

export class GoalDataAggregator {
    
    static async getTodaysGoals(app, settings, allTasks) {
        const tracker = new GoalTracker(app, settings);
        const score = await tracker.calculateDailyScore(moment(), allTasks);
        return score.results; // [{ name: 'Journal', isMet: true, ... }]
    }

    static async getPointsHistory(app, settings, allTasks) {
        const tracker = new GoalTracker(app, settings);
        const labels = [];
        const data = []; // This will hold the ACTUAL cumulative totals

        // 1. Calculate "Baseline" Total (Score from deep past up to 7 days ago)
        let runningTotal = 0;
        const startOfHistory = moment().subtract(30, 'days');
        const startOfChart = moment().subtract(6, 'days');

        // Calculate baseline (simplified loop for performance)
        for (let d = startOfHistory.clone(); d.isBefore(startOfChart, 'day'); d.add(1, 'day')) {
            const score = await tracker.calculateDailyScore(d, allTasks);
            runningTotal += score.totalPoints;
        }

        // 2. Calculate Visible 7 Days
        for (let i = 6; i >= 0; i--) {
            const date = moment().subtract(i, 'days');
            labels.push(date.format('ddd'));

            const score = await tracker.calculateDailyScore(date, allTasks);
            runningTotal += score.totalPoints;
            data.push(runningTotal);
        }

        return {
            labels,
            datasets: [{
                label: 'Total Points',
                data: data // [150, 160, 165...]
            }]
        };
    }


}
