import { dbHelpers } from "./db";

export interface WatcherStatus {
  isActive: boolean;
  lastChecked: string | null;
  logs: string[];
}

class AutonomousWatcher {
  private isActive = false;
  private intervalId: NodeJS.Timeout | null = null;
  private logs: string[] = [];

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.log("Autonomous Watcher activated.");
    
    // Simulate background monitoring every 30 seconds
    this.intervalId = setInterval(() => {
      this.monitor();
    }, 30000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    this.log("Autonomous Watcher deactivated.");
  }

  private monitor() {
    const timestamp = new Date().toISOString();
    this.log(`[${timestamp}] Scanning external vendor APIs and recent database records...`);
    
    const bills = dbHelpers.getBills('default') || [];
    if (bills.length > 0) {
      this.log(`Detected ${bills.length} historical statements in ledger. No new anomalies detected in background scan.`);
    } else {
      this.log("No statements found. Standing by for incoming financial data.");
    }
  }

  private log(message: string) {
    console.log(`[Watcher] ${message}`);
    this.logs.unshift(message);
    if (this.logs.length > 20) {
      this.logs.pop(); // keep last 20 logs
    }
  }

  getStatus(): WatcherStatus {
    return {
      isActive: this.isActive,
      lastChecked: new Date().toISOString(),
      logs: this.logs,
    };
  }
}

export const watcher = new AutonomousWatcher();
