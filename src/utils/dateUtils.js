// src/utils/dateUtils.js
import { moment } from 'obsidian';

/**
 * Calculates the custom period and week number based on a given start date.
 * A year is divided into 13 periods of 4 weeks each.
 * @param {Date} date - The date to calculate for.
 * @param {string} startOfPeriodsOverride - The start date in "YYYY-MM-DD" format from settings.
 * @returns {{period: number, week: number, weekSinceStart: number}} An object with the period, week, and total weeks since start.
 */
export function getPeriodWeek(date = new Date(), startOfPeriodsOverride) {
    const defaultStartString = "2025-03-02";
    let startString = startOfPeriodsOverride || defaultStartString;

    let startMoment = moment(startString, "YYYY-MM-DD", true);

    if (!startMoment.isValid()) {
        console.warn(
            `[Calendar Period Week Notes] Invalid "Start of Period 1" date format: "${startString}". ` +
            `It must be YYYY-MM-DD. Falling back to default date ${defaultStartString}.`
        );
        startMoment = moment(defaultStartString, "YYYY-MM-DD", true);
    }

    // Uses moment's built-in diff method to correctly calculate the number of
    // calendar days. This automatically handles Daylight Saving Time and other offsets.
    const daysSinceStart = moment(date).startOf('day').diff(startMoment.startOf('day'), 'days');
    const weekNumber = Math.floor(daysSinceStart / 7);
    const periodIndex = Math.floor(weekNumber / 4);
    const period = ((periodIndex % 13) + 13) % 13 + 1;
    const week = ((weekNumber % 4) + 4) % 4 + 1;

    return { period, week, weekSinceStart: weekNumber + 1 };
}


// Utility wrappers around moment.js for consistent date handling.
export function formatDate(date, format) { return moment(date).format(format); }

export function formatMonthTitle(date, format) { return moment(date).format(format); }

export function isSameDay(a, b) { return moment(a).isSame(b, 'day'); }
