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
    // Parse the date string (YYYY-MM-DD format) and format it nicely
    const dateObj = new Date(date);
    const formattedDate = format(dateObj, 'MMMM d, yyyy');
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
  body += `<p><strong>Training Report - ${format(new Date(reportData.date), 'MMMM d, yyyy')}</strong></p>`;
  if (reportData.stageManagerOnDuty) {
    body += `<p>Stage Manager on Duty: ${reportData.stageManagerOnDuty}</p>`;
  }

  // Add training sessions
  if (reportData.trainings.length > 0) {
    body += `<h3 style="margin-top: 20px; margin-bottom: 10px;">Training Sessions</h3>`;
    
    reportData.trainings.forEach((training, index) => {
      body += `<div style="margin-bottom: 20px;">`;
      
      // Training header with name, time, and stage manager
      let header = `<strong>${training.trainingName}</strong>`;
      header += ` | ${training.startTime} - ${training.endTime}`;
      if (training.stageManagerName) {
        header += ` | Stage Manager: ${training.stageManagerName}`;
      }
      body += `<p style="margin: 5px 0;">${header}</p>`;
      
      // Artists
      if (training.artistNames.length > 0) {
        body += `<p style="margin: 5px 0; padding-left: 20px;"><strong>Artists:</strong> ${training.artistNames.join(', ')}</p>`;
      }
      
      // Departments
      if (training.departmentNames.length > 0) {
        body += `<p style="margin: 5px 0; padding-left: 20px;"><strong>Departments:</strong> ${training.departmentNames.join(', ')}</p>`;
      }
      
      // Notes (HTML content from rich text editor)
      if (training.notes) {
        body += `<div style="margin: 5px 0; padding-left: 20px;"><strong>Notes:</strong> ${training.notes}</div>`;
      }
      
      body += `</div>`;
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
