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

    /**
     * Retrieves the full history from settings and formats it for the chart renderer.
     * Includes labels, daily points, running totals, and breakdown details.
     */
    static async getAllHistory(app, settings, allTasks) {
        // 1. Get the raw history map from settings
        const historyMap = settings.goalScoreHistory || {};
        
        // 2. Prepare arrays for the chart data
        const labels = [];
        const dailyData = [];
        const breakdowns = [];
        const totalData = [];
        
        // 3. Sort dates chronologically to ensure the line chart flows correctly
        const sortedDates = Object.keys(historyMap).sort();
        
        // 4. Calculate running total variable
        let currentRunningTotal = 0;
        
        // 5. Iterate through every day in history
        for (const dateKey of sortedDates) {
            const dayData = historyMap[dateKey];
            
            // A. Date Label (e.g., "2025-12-16")
            labels.push(dateKey);
            
            // B. Daily Points (e.g., 268)
            const dailyPoints = dayData.totalPoints || 0;
            dailyData.push(dailyPoints);
            
            // C. Running Total (Accumulated points over time)
            currentRunningTotal += dailyPoints;
            totalData.push(currentRunningTotal);
            
            // D. Breakdowns (CRITICAL: Used for Tooltip details like Bonus/Streak)
            // We default to an empty object if missing to keep arrays aligned
            breakdowns.push(dayData.breakdown || { goals: 0, allMet: 0, streak: 0 });
        }

        // 6. Return the formatted object expected by CssChartRenderer
        return {
            labels: labels,
            breakdowns: breakdowns, // <--- This fixes your tooltip!
            datasets: [
                {
                    label: 'Daily Momentum',
                    data: dailyData,
                    // Optional: Add styling hints here if your renderer uses them, 
                    // though your CssChartRenderer usually handles styles internally.
                    fill: true
                },
                {
                    label: 'Lifetime Total',
                    data: totalData,
                    fill: false
                }
            ]
        };
    }


    
    static async rebuildFullHistory(app, settings, allTasks) {
        const tracker = new GoalTracker(app, settings);
        
        // 1. DETERMINE SCAN START DATE
        let earliestDate = moment();
        
        if (allTasks && allTasks.length > 0) {
            allTasks.forEach(t => {
                if (t.created && t.created.isValid() && t.created.isBefore(earliestDate)) {
                    earliestDate = t.created.clone();
                }
                if (t.completion && t.completion.isValid() && t.completion.isBefore(earliestDate)) {
                    earliestDate = t.completion.clone();
                }
            });
        } else {
            earliestDate = moment().subtract(1, 'year');
        }

        const safetyCap = moment().subtract(3, 'years');
        if (earliestDate.isBefore(safetyCap)) earliestDate = safetyCap;

        console.log(`[GoalTracker] Scanning history starting from: ${earliestDate.format('YYYY-MM-DD')}`);

        // 2. ITERATE DAY BY DAY (CALCULATE RAW HISTORY)
        const today = moment();
        const rawHistory = {};
        let totalProcessed = 0;
        
        for (let m = earliestDate.clone(); m.isSameOrBefore(today, 'day'); m.add(1, 'day')) {
            try {
                const dayScore = await tracker.calculateDailyScore(m, allTasks);
                const dateKey = m.format('YYYY-MM-DD');
                rawHistory[dateKey] = dayScore; 
                totalProcessed++;
                
                // Prevent UI freeze on large vaults
                if (totalProcessed % 30 === 0) await new Promise(r => setTimeout(r, 0));
            } catch (err) {
                console.error(`Failed to calc score for ${m.format('YYYY-MM-DD')}`, err);
            }
        }

        // 3. FILTER: FIND FIRST POSITIVE SCORE (The Auto-Start)
        // We trim all days at the start that have <= 0 points.
        const sortedDates = Object.keys(rawHistory).sort();
        const finalHistory = {};
        let gameHasStarted = false;

        for (const dateKey of sortedDates) {
            const dayData = rawHistory[dateKey];
            const points = dayData.totalPoints || 0;

            // The "Game" officially starts on the first day you get positive points
            if (!gameHasStarted && points > 0) {
                gameHasStarted = true;
                console.log(`[GoalTracker] 🚀 History auto-started on ${dateKey} (First positive score: ${points})`);
            }

            // Once started, we keep every day (including negative ones)
            if (gameHasStarted) {
                finalHistory[dateKey] = dayData;
            }
        }

        // Fallback: If user has NEVER had a positive day, show the last 7 days 
        // so the chart isn't completely broken.
        if (Object.keys(finalHistory).length === 0 && sortedDates.length > 0) {
            const last7 = sortedDates.slice(-7);
            last7.forEach(d => finalHistory[d] = rawHistory[d]);
        }

        // 4. RECALCULATE LIFETIME TOTAL
        // Sum up points only from the filtered history
        let newLifetimeTotal = 0;
        Object.values(finalHistory).forEach(day => {
            newLifetimeTotal += (day.totalPoints || 0);
        });

        // 5. UPDATE SETTINGS OBJECT
        // We modify the 'settings' object passed by reference.
        // The CALLER of this function is responsible for saving it to disk.
        settings.goalScoreHistory = finalHistory;
        settings.totalPoints = newLifetimeTotal; 

        console.log(`[GoalTracker] History rebuilt. Filtered days: ${Object.keys(finalHistory).length}. Total Points: ${newLifetimeTotal}`);
        
        return Object.keys(finalHistory).length;
    }
}
