import cron from 'node-cron';
import { storage } from './storage';
import { broadcastAttendanceUpdate } from './websocket';
import type { AttendanceRecord } from '../shared/schema';

async function autoSignOutPreviousDays() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const now = new Date();
    const dubaiTodayParts = formatter.formatToParts(now);
    const year = parseInt(dubaiTodayParts.find(p => p.type === 'year')!.value);
    const month = parseInt(dubaiTodayParts.find(p => p.type === 'month')!.value);
    const day = parseInt(dubaiTodayParts.find(p => p.type === 'day')!.value);
    
    const dubaiToday = new Date(Date.UTC(year, month - 1, day));
    const todayDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const allRecords = await storage.getAllAttendanceRecords();
    
    const oldSignedIn = allRecords.filter((record: AttendanceRecord) => {
      if (!record.signInTime || record.signOutTime) return false;
      
      const recordDate = record.date;
      return recordDate < todayDate;
    });
    
    if (oldSignedIn.length === 0) {
      return 0;
    }
    
    console.log(`Found ${oldSignedIn.length} artists from previous days still signed in`);
    
    for (const record of oldSignedIn) {
      const signOutTimeDubai = new Date(`${record.date}T23:59:59+04:00`);
      
      const updatedRecord = await storage.updateAttendanceRecord(record.id, {
        signOutTime: signOutTimeDubai,
        signedOutBy: null,
      });
      
      if (updatedRecord) {
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
    
    console.log(`Successfully auto-signed out ${oldSignedIn.length} artists from previous days`);
    return oldSignedIn.length;
  } catch (error) {
    console.error('Error during catch-up auto-signout:', error);
    return 0;
  }
}

async function autoSignOutYesterday() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const dubaiTodayParts = formatter.formatToParts(now);
    const year = parseInt(dubaiTodayParts.find(p => p.type === 'year')!.value);
    const month = parseInt(dubaiTodayParts.find(p => p.type === 'month')!.value);
    const day = parseInt(dubaiTodayParts.find(p => p.type === 'day')!.value);
    
    const dubaiToday = new Date(Date.UTC(year, month - 1, day));
    dubaiToday.setUTCDate(dubaiToday.getUTCDate() - 1);
    
    const yesterdayYear = dubaiToday.getUTCFullYear();
    const yesterdayMonth = String(dubaiToday.getUTCMonth() + 1).padStart(2, '0');
    const yesterdayDay = String(dubaiToday.getUTCDate()).padStart(2, '0');
    const yesterdayDate = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
    
    const records = await storage.getAttendanceRecordsByDate(yesterdayDate);
    
    const stillSignedIn = records.filter(record => record.signInTime && !record.signOutTime);
    
    if (stillSignedIn.length === 0) {
      console.log('No artists to auto-signout');
      return;
    }
    
    console.log(`Auto-signing out ${stillSignedIn.length} artists from yesterday...`);
    
    const signOutTimeDubai = new Date(`${yesterdayDate}T23:59:59+04:00`);
    
    for (const record of stillSignedIn) {
      const updatedRecord = await storage.updateAttendanceRecord(record.id, {
        signOutTime: signOutTimeDubai,
        signedOutBy: null,
      });
      
      if (updatedRecord) {
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
}

export async function setupScheduledTasks() {
  console.log('Checking for artists from previous days still signed in...');
  await autoSignOutPreviousDays();
  
  cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight auto-signout task...');
    await autoSignOutYesterday();
  }, {
    timezone: 'Asia/Dubai'
  });
  
  console.log('Scheduled tasks initialized: midnight auto-signout + startup catch-up');
}
