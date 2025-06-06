import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'debug.log');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Add timestamp to log
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;
    
    // Write to log file
    fs.appendFileSync(logFile, logEntry);
    
    console.log(`[DEBUG LOG] ${JSON.stringify(data)}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging debug data:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // If log file doesn't exist yet, create it
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, '');
    }
    
    // Read the last 100 lines of logs
    const logs = fs.readFileSync(logFile, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .slice(-100)
      .join('\n');
    
    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading debug logs:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear log file
    fs.writeFileSync(logFile, '');
    
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing debug logs:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 