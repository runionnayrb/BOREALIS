import { format } from 'date-fns';

interface TrainingData {
  trainingName: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  stageManagerName?: string;
  artistNames: string[];
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
  let body = '';

  // Add custom prefix if provided
  if (bodyPrefix) {
    body += bodyPrefix + '\n\n';
  }

  // Add report header info
  body += `Training Report - ${format(new Date(reportData.date), 'MMMM d, yyyy')}\n`;
  if (reportData.stageManagerOnDuty) {
    body += `Stage Manager on Duty: ${reportData.stageManagerOnDuty}\n`;
  }
  body += '\n';

  // Add training sessions
  if (reportData.trainings.length > 0) {
    body += `=== Training Sessions ===\n\n`;
    
    reportData.trainings.forEach((training, index) => {
      body += `${index + 1}. ${training.trainingName}\n`;
      body += `   Time: ${training.startTime} - ${training.endTime}\n`;
      if (training.locationName) {
        body += `   Location: ${training.locationName}\n`;
      }
      if (training.stageManagerName) {
        body += `   Stage Manager: ${training.stageManagerName}\n`;
      }
      if (training.artistNames.length > 0) {
        body += `   Artists: ${training.artistNames.join(', ')}\n`;
      }
      if (training.notes) {
        body += `   Notes: ${training.notes}\n`;
      }
      body += '\n';
    });
  }

  // Add report notes if any
  if (reportData.notes) {
    body += `=== Report Notes ===\n${reportData.notes}\n\n`;
  }

  return body;
}
