import { FactorialService } from './factorialService';
import { addItem, updateItem, subscribeToCollection, setItem } from './firestore';
import { Subcontractor, TimeLog, Role, Status, Project } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export class IntegrationService {

    static async syncData() {
        try {
            console.log("Starting Sync...");
            const employees = await FactorialService.getEmployees();
            await this.syncEmployees(employees);

            const projects = await FactorialService.getProjects();
            await this.syncProjects(projects);

            // Fetch time entries for current month or specific range
            // For MVP, lets just fetch recent entries or all flexible
            const timeEntries = await FactorialService.getTimeEntries();
            await this.syncTimeEntries(timeEntries);

            console.log("Sync Completed.");
            return { success: true };
        } catch (error) {
            console.error("Sync Failed:", error);
            return { success: false, error };
        }
    }

    private static async syncEmployees(factorialEmployees: any[]) {
        for (const emp of factorialEmployees) {
            if (!emp.email) continue;

            // Deterministic ID to prevent duplicates
            const docId = `fac_emp_${emp.id}`;

            const subData: Subcontractor & { factorialId: string } = {
                id: docId,
                name: `${emp.first_name} ${emp.last_name}`,
                role: emp.role || 'Factorial Employee',
                hourlyRate: 0,
                currency: 'EUR',
                factorialId: emp.id,
                personnelNumber: emp.identifier || emp.employee_number || '',
                managerEmail: emp.manager_email || '', // Map manager if available
            };

            // Upsert: Create or Update
            await setItem('subcontractors', docId, subData);
        }
    }

    private static async syncTimeEntries(entries: any[]) {
        for (const entry of entries) {
            // Find Subcontractor by Factorial ID (optimization: cache map if slow)
            // For now, simple query or check if we can reconstruct their ID.
            // Since we use deterministic IDs for employees now (fac_emp_ID), we can guess it!
            const empFactorialId = entry.employee_id;
            const subDocId = `fac_emp_${empFactorialId}`;

            // Verify if user exists (optional, strictly speaking we need subId for relation)
            // If we trust our sync order (employees first), we can just use the ID.

            let hours = 0;
            if (entry.start && entry.end) {
                const start = new Date(entry.start);
                const end = new Date(entry.end);
                hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            } else if (entry.minutes) {
                hours = entry.minutes / 60;
            }

            if (hours <= 0) continue;

            const logDocId = `fac_log_${entry.id}`;

            const logData: TimeLog & { factorialId: string } = {
                id: logDocId,
                subcontractorId: subDocId, // Using the deterministic ID
                projectId: 'fac_default_project', // We'll improve this later mapping real projects
                date: entry.date || entry.start?.split('T')[0],
                hours: parseFloat(hours.toFixed(2)),
                description: entry.observations || 'Imported from Factorial',
                status: Status.PENDING,
                factorialId: entry.id
            };

            // Upsert
            await setItem('timeLogs', logDocId, logData);
        }
    }

    private static async syncProjects(factorialProjects: any[]) {
        for (const proj of factorialProjects) {
            const docId = `fac_proj_${proj.id}`;

            const projectData: Project = {
                id: docId,
                name: proj.name,
                client: proj.client_name || 'Factorial Import',
                budget: 0,
                currency: 'EUR',
                managerId: '',
                assignments: []
            };

            // Upsert
            // Note: We use merge: true equivalent logic (setItem overwrites). 
            // If we wanted to preserve local changes (like manual budget setting), we'd need a read-modify-write.
            // For now, per requirement "control uniqueness", ID-based overwrite is safest for sync.
            // Improve: check existance to preserve 'budget' if needed.

            await setItem('projects', docId, projectData);
        }
    }
}
