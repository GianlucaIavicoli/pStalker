import chalk from "chalk";
import { setTrackingEnabled } from "./database.js";
import { execSync } from "child_process";
import osName from "os-name";
import {
  APP_NAME,
  LINUX_INSTALL_PATH,
  LINUX_UNINSTALL_PATH,
  LINUX_INSTALL_ARGS,
	ROOT_DIR,
} from "./constants.js";
import fs from "fs";

// Function to enable tracking on boot
export async function enableTracking() {
  const os = osName();

  switch (true) {
    case os.includes("Linux"):
      try {
        // Execute the installer script
        execSync(`sh ${LINUX_INSTALL_PATH} ${LINUX_INSTALL_ARGS}`, {
          stdio: "inherit",
          shell: true,
        });

        // Update the database to indicate tracking is enabled
        await setTrackingEnabled(true);
      } catch (error) {
        console.error(chalk.red(`Error enabling tracking: ${error.message}`));
      }
      break;

    case os.includes("Windows"):
      throw new Error("OS not yet supported");

    case os.includes("macOS"):
      throw new Error("OS not yet supported");

    default:
      throw new Error("Unsupported OS");
  }
}

// Function to disable tracking now and on boot
export async function disableTracking() {
  const os = osName();

  switch (true) {
    case os.includes("Linux"):
      try {
        // Call the uninstall script with the app name as an argument
        execSync(`sh ${LINUX_UNINSTALL_PATH} ${APP_NAME} ${ROOT_DIR}`, {
          stdio: "inherit",
          shell: true,
        });
				await setTrackingEnabled(false);
      } catch (error) {
        console.error(chalk.red(`Error disabling tracking: ${error.message}`));
      }
      break;

    case os.includes("Windows"):
      throw new Error("Windows not yet supported");

    case os.includes("macOS"):
      throw new Error("macOS not yet supported");

    default:
      throw new Error("Unsupported OS");
  }
}

// Convert seconds into a human-readable format
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}h ${minutes}m ${secs}s`;
}

// Get the date range based on the period
export function getDateRange(period) {
  const today = new Date();
  let startDate;

  switch (period) {
    case "1d":
      startDate = new Date(today.setDate(today.getDate() - 1));
      break;
    case "1w":
      startDate = new Date(today.setDate(today.getDate() - 7));
      break;
    case "1m":
      startDate = new Date(today.setMonth(today.getMonth() - 1));
      break;
    case "1y":
      startDate = new Date(today.setFullYear(today.getFullYear() - 1));
      break;
    default:
      throw new Error("Invalid period. Use 1d, 1w, 1m, or 1y.");
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  };
}

export async function sleepAndClear(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.clear();
}


export function setuDirectory() {
  const userHomeDir = os.homedir();
  const appExportDir = path.join(userHomeDir, APP_NAME, "exports");
  const appBackupDir = path.join(userHomeDir, APP_NAME, "backups");

  // Create export directory if it doesn't exist
  if (!fs.existsSync(appExportDir)) {
    fs.mkdirSync(appExportDir, { recursive: true });
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(appBackupDir)) {
    fs.mkdirSync(appBackupDir, { recursive: true });
  }
}