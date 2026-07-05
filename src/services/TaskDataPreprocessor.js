import { moment } from 'obsidian';

export class TaskDataPreprocessor {
    static process(task, options = { stripTags: true, stripAlerts: true }) {
        let text = task.description || ""; 
        const tags = Array.isArray(task.tags) ? [...task.tags] : [];
        
        // Variables for all fields
        let alert = null;
        let start = null;
        let scheduled = null;
        let doneDate = null;
        let recurrence = null;
        let id = null;
        let dependsOn = [];
        let onCompletion = null;

        // 1. Extract Tags
        const tagRegex = /(^|\s)(#[^\s#.,;!:?]+)/g;
        const tagMatches = text.match(tagRegex);
        if (tagMatches) {
            tagMatches.forEach(t => {
                const tag = t.trim();
                if (!tags.includes(tag)) tags.push(tag);
            });
            if (options.stripTags) {
                text = text.replace(tagRegex, ' ');
            }
        }

        // helper to strip if enabled
        const clean = (regex) => {
             if (options.stripTags) text = text.replace(regex, ' ');
        };

        // 2. ALERT (⏰ or [alert::])
        const alertEmoji = /⏰\s*(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{1,2}:\d{2})/;
        const alertDv = /\[alert::\s*(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{1,2}:\d{2})\]/i;
        let alertMatch = text.match(alertEmoji) || text.match(alertDv);
        
        if (alertMatch) {
            const d = alertMatch[1]; const t = alertMatch[2];
            let fb = moment().format('YYYY-MM-DD');
            if (task.due?.moment) fb = task.due.moment.format('YYYY-MM-DD');
            else if (task.dueDate) fb = task.dueDate;
            
            alert = { date: d || fb, time: t };
            if (options.stripAlerts) { // Special flag for alerts
                 if (text.match(alertDv)) text = text.replace(alertDv, ' ');
                 else text = text.replace(alertEmoji, ' ');
            }
        }

        // 3. START DATE (🛫 or [start::])
        const startEmoji = /🛫\s*(\d{4}-\d{2}-\d{2})/;
        const startDv = /\[start::\s*(\d{4}-\d{2}-\d{2})\]/i;
        let startM = text.match(startEmoji) || text.match(startDv);
        if (startM) {
            start = { moment: moment(startM[1], 'YYYY-MM-DD') };
            clean(startM[0] === (text.match(startDv)?.[0]) ? startDv : startEmoji);
        } else if (task.startDate) start = { moment: moment(task.startDate) };
        else if (task.start) start = { moment: moment(task.start) };

        // 4. SCHEDULED DATE (⏳ or [scheduled::])
        const schedEmoji = /⏳\s*(\d{4}-\d{2}-\d{2})/;
        const schedDv = /\[scheduled::\s*(\d{4}-\d{2}-\d{2})\]/i;
        let schedM = text.match(schedEmoji) || text.match(schedDv);
        if (schedM) {
            scheduled = { moment: moment(schedM[1], 'YYYY-MM-DD') };
            clean(schedM[0] === (text.match(schedDv)?.[0]) ? schedDv : schedEmoji);
        } else if (task.scheduledDate) scheduled = { moment: moment(task.scheduledDate) };

        // 5. COMPLETION DATE (✅ or [completion::])
        // Note: Tasks plugin uses ✅ YYYY-MM-DD for completed tasks
        const doneEmoji = /✅\s*(\d{4}-\d{2}-\d{2})/;
        const doneDv = /\[completion::\s*(\d{4}-\d{2}-\d{2})\]/i; // Custom DV field
        let doneM = text.match(doneEmoji) || text.match(doneDv);
        if (doneM) {
            doneDate = { moment: moment(doneM[1], 'YYYY-MM-DD') };
            clean(doneM[0] === (text.match(doneDv)?.[0]) ? doneDv : doneEmoji);
        } else if (task.doneDate) doneDate = { moment: moment(task.doneDate) };

        // 6. RECURRENCE (🔁 or [repeat::])
        // Captures the rule text after the icon
        const recurEmoji = /🔁\s*([^\s📅🛫⏳✅🔺🆔⛔🏁]+)/;
        const recurDv = /\[repeat::\s*([^\]]+)\]/i;
        let recurM = text.match(recurEmoji) || text.match(recurDv);
        if (recurM) {
            recurrence = recurM[1].trim();
            clean(recurM[0] === (text.match(recurDv)?.[0]) ? recurDv : recurEmoji);
        } else if (task.recurrenceRule) recurrence = task.recurrenceRule;

        // 7. ID (🆔 or [id::])
        const idEmoji = /🆔\s*([^\s📅🛫⏳✅🔺⛔🏁]+)/;
        const idDv = /\[id::\s*([^\]]+)\]/i;
        let idM = text.match(idEmoji) || text.match(idDv);
        if (idM) {
            id = idM[1].trim();
            clean(idM[0] === (text.match(idDv)?.[0]) ? idDv : idEmoji);
        } else if (task.id) id = task.id;

        // 8. DEPENDS ON (⛔ or [depends::])
        const depEmoji = /⛔\s*([^\s📅🛫⏳✅🔺🆔🏁]+)/;
        const depDv = /\[depends::\s*([^\]]+)\]/i;
        let depM = text.match(depEmoji) || text.match(depDv);
        if (depM) {
            dependsOn = depM[1].trim().split(',').map(s => s.trim());
            clean(depM[0] === (text.match(depDv)?.[0]) ? depDv : depEmoji);
        } else if (task.dependsOn && Array.isArray(task.dependsOn)) dependsOn = task.dependsOn;

        // 9. ON COMPLETION (🏁 or [on_completion::])
        // Used for 'delete' or 'keep' logic
        const ocEmoji = /🏁\s*([^\s📅🛫⏳✅🔺🆔⛔]+)/;
        const ocDv = /\[on_completion::\s*([^\]]+)\]/i;
        let ocM = text.match(ocEmoji) || text.match(ocDv);
        if (ocM) {
            onCompletion = ocM[1].trim();
            clean(ocM[0] === (text.match(ocDv)?.[0]) ? ocDv : ocEmoji);
        }

        // Cleanup
        text = text.replace(/\s+/g, ' ').trim();

        const safeLineNumber = task.lineNumber ?? (task.taskLocation ? (task.taskLocation.lineNumber ?? task.taskLocation._lineNumber) : undefined);
        const safePath = task.path ?? (task.taskLocation ? (task.taskLocation.path ?? (task.taskLocation._tasksFile ? task.taskLocation._tasksFile._path : undefined)) : undefined);

        return {
            ...task, 
            cleanText: text,
            tags: tags,
            alert: alert,
            start: start,          
            scheduled: scheduled,
            doneDate: doneDate,    
            recurrence: recurrence, 
            id: id,                
            dependsOn: dependsOn,  
            onCompletion: onCompletion, 
            priority: task.priority ?? 2,
            lineNumber: safeLineNumber,
            path: safePath,
            taskLocation: task.taskLocation 
        };
    }
}
