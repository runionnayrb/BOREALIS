import cron from 'node-cron';
import { storage } from './storage';
import { broadcastAttendanceUpdate } from './websocket';

export function setupScheduledTasks() {
  // Run at midnight (00:00) every day to automatically sign out all signed-in artists
  cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight auto-signout task...');
    
    try {
      // Get yesterday's date in Dubai timezone (the day that just ended at midnight Dubai time)
      // Use Intl.DateTimeFormat to reliably get date parts in Dubai timezone
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Get today's date in Dubai timezone
      const dubaiTodayParts = formatter.formatToParts(now);
      const year = parseInt(dubaiTodayParts.find(p => p.type === 'year')!.value);
      const month = parseInt(dubaiTodayParts.find(p => p.type === 'month')!.value);
      const day = parseInt(dubaiTodayParts.find(p => p.type === 'day')!.value);
      
      // Create a Date object for today in Dubai, then subtract a day
      const dubaiToday = new Date(Date.UTC(year, month - 1, day));
      dubaiToday.setUTCDate(dubaiToday.getUTCDate() - 1);
      
      // Format as YYYY-MM-DD for database query
      const yesterdayYear = dubaiToday.getUTCFullYear();
      const yesterdayMonth = String(dubaiToday.getUTCMonth() + 1).padStart(2, '0');
      const yesterdayDay = String(dubaiToday.getUTCDate()).padStart(2, '0');
      const yesterdayDate = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
      
      // Get all attendance records for yesterday
      const records = await storage.getAttendanceRecordsByDate(yesterdayDate);
      
      // Filter records that are still signed in (have signInTime but no signOutTime)
      const stillSignedIn = records.filter(record => record.signInTime && !record.signOutTime);
      
      if (stillSignedIn.length === 0) {
        console.log('No artists to auto-signout');
        return;
      }
      
      console.log(`Auto-signing out ${stillSignedIn.length} artists...`);
      
      // Sign out each artist at 23:59:59 of the previous day in Dubai timezone
      // Build the timestamp: yesterdayDate (YYYY-MM-DD) + T23:59:59+04:00
      const signOutTimeDubai = new Date(`${yesterdayDate}T23:59:59+04:00`); // +04:00 is Dubai timezone offset
      
      for (const record of stillSignedIn) {
        const updatedRecord = await storage.updateAttendanceRecord(record.id, {
          signOutTime: signOutTimeDubai,
          signedOutBy: null, // System auto-signout, not by a user
        });
        
        if (updatedRecord) {
          // Get artist info for broadcast
          const artist = await storage.getArtist(record.artistId);
          if (artist) {
            broadcastAttendanceUpdate({
              record: updatedRecord,
              artist,
              action: 'sign_out',
            });
          }
        }
      }
      
      console.log(`Successfully auto-signed out ${stillSignedIn.length} artists`);
    } catch (error) {
      console.error('Error during midnight auto-signout:', error);
    }
  }, {
    timezone: 'Asia/Dubai' // Set timezone to Dubai (UTC+4) for La Perle location
  });
  
  console.log('Scheduled tasks initialized: midnight auto-signout');
}
