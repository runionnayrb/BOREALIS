import { format } from 'date-fns';

interface TrainingData {
  trainingName: string;
  startTime: string;
  endTime: string;
  locationName?: string;
  stageManagerName?: string;
  artistNames: string[];
  departmentNames: string[];
  goalNotes?: string;
  notes?: string;
  followUpNotes?: string;
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
    // Convert line breaks to HTML: double line breaks = new paragraph, single line break = <br>
    const formattedPrefix = bodyPrefix
      .split('\n\n')
      .map(para => {
        const paraWithBreaks = para.replace(/\n/g, '<br>');
        return `<p style="margin: 10px 0;">${paraWithBreaks}</p>`;
      })
      .join('');
    body += formattedPrefix;
    // Add spacing after the message
    body += '<br><br>';
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
      
      // Goal Notes (HTML content from rich text editor)
      if (training.goalNotes) {
        body += `<p style="margin: 5px 0;"><strong><u>Goal Notes:</u></strong></p>`;
        body += `<div style="margin: 5px 0;">${training.goalNotes}</div>`;
      }
      
      // Training Notes (HTML content from rich text editor)
      if (training.notes) {
        body += `<p style="margin: 5px 0;"><strong><u>Training Notes:</u></strong></p>`;
        body += `<div style="margin: 5px 0;">${training.notes}</div>`;
      }
      
      // Next Steps (HTML content from rich text editor)
      if (training.followUpNotes) {
        body += `<p style="margin: 5px 0;"><strong><u>Next Steps:</u></strong></p>`;
        body += `<div style="margin: 5px 0;">${training.followUpNotes}</div>`;
      }
      
      // Artists
      if (training.artistNames.length > 0) {
        body += `<p style="margin: 5px 0;"><strong><u>Artists:</u></strong></p>`;
        body += `<p style="margin: 5px 0;">${training.artistNames.join(', ')}</p>`;
      }
      
      // Departments
      if (training.departmentNames.length > 0) {
        body += `<p style="margin: 5px 0;"><strong><u>Departments:</u></strong></p>`;
        body += `<p style="margin: 5px 0;">${training.departmentNames.join(', ')}</p>`;
      }
      
      // Horizontal line between trainings (except after last one)
      if (index < reportData.trainings.length - 1) {
        body += `<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">`;
      }
    });
  }

  // Add general notes if any
  if (reportData.notes) {
    body += `<h3 style="margin-top: 20px; margin-bottom: 10px;">General Notes</h3>`;
    body += `<div>${reportData.notes}</div>`;
  }

  body += '</body></html>';
  return body;
}

interface ReportTemplateHeader {
  leftImageUrl?: string | null;
  title: string;
  rightImageUrl?: string | null;
}

export function formatPdfBody(reportData: ReportData, templateHeader?: ReportTemplateHeader): string {
  let body = '<html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }</style></head><body>';

  // Add header with images and title if template provided
  if (templateHeader) {
    body += '<div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">';
    
    // Top row: images and title
    body += '<div style="display: flex; align-items: center; justify-content: space-between;">';
    
    // Left image
    if (templateHeader.leftImageUrl) {
      body += `<div style="flex: 0 0 auto;"><img src="${templateHeader.leftImageUrl}" alt="Left Logo" style="max-height: 80px; max-width: 150px;" /></div>`;
    }
    
    // Title and Date in same centered block
    body += `<div style="flex: 1; text-align: center;">`;
    body += `<h1 style="margin: 0; padding: 0; font-size: 24px; line-height: 1.2;">${templateHeader.title}</h1>`;
    body += `<p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.2;">${format(new Date(reportData.date), 'EEEE, MMMM d, yyyy')}</p>`;
    body += `</div>`;
    
    // Right image
    if (templateHeader.rightImageUrl) {
      body += `<div style="flex: 0 0 auto;"><img src="${templateHeader.rightImageUrl}" alt="Right Logo" style="max-height: 80px; max-width: 150px;" /></div>`;
    }
    
    body += '</div>'; // Close top row
    
    body += '</div>'; // Close header container
  }

  // Add training sessions
  if (reportData.trainings.length > 0) {
    
    reportData.trainings.forEach((training, index) => {
      // Training title header (14px)
      let header = `<strong>${training.trainingName}</strong>`;
      header += ` | ${training.startTime} - ${training.endTime}`;
      if (training.stageManagerName) {
        header += ` | SM: ${training.stageManagerName}`;
      }
      body += `<p style="margin: 10px 0 5px 0; font-size: 14px;">${header}</p>`;
      
      // Goal Notes (13px header, 12px content)
      if (training.goalNotes) {
        body += `<p style="margin: 5px 0; font-size: 13px;"><strong><u>Goal Notes:</u></strong></p>`;
        body += `<div style="margin: 5px 0; font-size: 12px;">${training.goalNotes}</div>`;
      }
      
      // Training Notes (13px header, 12px content)
      if (training.notes) {
        body += `<p style="margin: 5px 0; font-size: 13px;"><strong><u>Training Notes:</u></strong></p>`;
        body += `<div style="margin: 5px 0; font-size: 12px;">${training.notes}</div>`;
      }
      
      // Next Steps (13px header, 12px content)
      if (training.followUpNotes) {
        body += `<p style="margin: 5px 0; font-size: 13px;"><strong><u>Next Steps:</u></strong></p>`;
        body += `<div style="margin: 5px 0; font-size: 12px;">${training.followUpNotes}</div>`;
      }
      
      // Artists (13px header, 12px content)
      if (training.artistNames.length > 0) {
        body += `<p style="margin: 5px 0; font-size: 13px;"><strong><u>Artists:</u></strong></p>`;
        body += `<p style="margin: 5px 0; font-size: 12px;">${training.artistNames.join(', ')}</p>`;
      }
      
      // Departments (13px header, 12px content)
      if (training.departmentNames.length > 0) {
        body += `<p style="margin: 5px 0; font-size: 13px;"><strong><u>Departments:</u></strong></p>`;
        body += `<p style="margin: 5px 0; font-size: 12px;">${training.departmentNames.join(', ')}</p>`;
      }
      
      // Horizontal line between trainings (except after last one)
      if (index < reportData.trainings.length - 1) {
        body += `<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">`;
      }
    });
  }

  // Add general notes if any
  if (reportData.notes) {
    body += `<h3 style="margin-top: 20px; margin-bottom: 10px;">General Notes</h3>`;
    body += `<div>${reportData.notes}</div>`;
  }

  body += '</body></html>';
  return body;
}
