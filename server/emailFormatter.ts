import { format } from 'date-fns';

interface TrainingData {
  trainingName: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  stageManagerName?: string;
  artistNames: string[];
  departmentNames: string[];
  notes?: string;
}

interface ReportData {
  date: string;
  stageManagerOnDuty?: string;
  notes?: string;
  trainings: TrainingData[];
}

export function replaceDateVariable(template: string, date: string): string {
  try {
    // Parse the date string (YYYY-MM-DD format) and format it with day of week
    const dateObj = new Date(date);
    const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
    return template.replace(/\{\{date\}\}/g, formattedDate);
  } catch {
    // If date parsing fails, just replace with the raw date
    return template.replace(/\{\{date\}\}/g, date);
  }
}

export function formatEmailBody(reportData: ReportData, bodyPrefix?: string): string {
  let body = '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">';

  // Add custom prefix if provided
  if (bodyPrefix) {
    body += `<p>${bodyPrefix}</p>`;
  }

  // Add report header info
  body += `<p><strong>Training Report - ${format(new Date(reportData.date), 'EEEE, MMMM d, yyyy')}</strong></p>`;
  if (reportData.stageManagerOnDuty) {
    body += `<p>Stage Manager on Duty: ${reportData.stageManagerOnDuty}</p>`;
  }

  // Add training sessions
  if (reportData.trainings.length > 0) {
    body += `<p style="font-weight: bold; font-size: 18px; margin-top: 20px; margin-bottom: 10px;">Today's Training Sessions</p>`;
    
    reportData.trainings.forEach((training, index) => {
      // Training header with name, time, and stage manager
      let header = `<strong>${training.trainingName}</strong>`;
      header += ` | ${training.startTime} - ${training.endTime}`;
      if (training.stageManagerName) {
        header += ` | SM: ${training.stageManagerName}`;
      }
      body += `<p style="margin: 10px 0 5px 0;">${header}</p>`;
      
      // Artists
      if (training.artistNames.length > 0) {
        body += `<p style="margin: 5px 0;"><strong><u>Artists:</u></strong></p>`;
        body += `<p style="margin: 5px 0;">${training.artistNames.join(', ')}</p>`;
      }
      
      // Departments
      if (training.departmentNames.length > 0) {
        body += `<p style="margin: 5px 0;"><strong><u>Departments:</u></strong> ${training.departmentNames.join(', ')}</p>`;
      }
      
      // Notes (HTML content from rich text editor)
      if (training.notes) {
        body += `<p style="margin: 5px 0;"><strong><u>Notes:</u></strong></p>`;
        body += `<div style="margin: 5px 0;">${training.notes}</div>`;
      }
      
      // Horizontal line between trainings (except after last one)
      if (index < reportData.trainings.length - 1) {
        body += `<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">`;
      }
    });
  }

  // Add report notes if any
  if (reportData.notes) {
    body += `<h3 style="margin-top: 20px; margin-bottom: 10px;">Report Notes</h3>`;
    body += `<div>${reportData.notes}</div>`;
  }

  body += '</body></html>';
  return body;
}
