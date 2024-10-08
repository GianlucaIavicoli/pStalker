import chalk from "chalk";
import { setTrackingEnabled, fetchAppUsage } from "./database.js";
import { execSync } from "child_process";
import osName from "os-name";
import {
  APP_NAME,
  LOWERCASE_APP_NAME,
  LINUX_INSTALL_PATH,
  LINUX_UNINSTALL_PATH,
  LINUX_INSTALL_ARGS,
  ROOT_DIR,
  EXPORT_PATH,
  BACKUP_PATH,
  DB_PATH,
} from "./constants.js";
import fs from "fs";
import os from "os";
import path from "path";

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

export function exportData(format, results) {
  const userHomeDir = os.homedir();
  const exportDir = path.join(userHomeDir, `${APP_NAME}`, "exports");

  // Check OS compatibility
  const currentOS = osName();
  if (!currentOS.includes("Linux")) {
    console.log("Export is only supported on Linux.");
    return;
  }

  // Create export directory if it doesn't exist
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  // Generate file name based on current date and time
  const dateString = getDateString();

  const fileName = `${LOWERCASE_APP_NAME}_${dateString}.${
    format === "csv" ? "csv" : "json"
  }`;
  const filePath = path.join(exportDir, fileName);

  try {
    switch (format) {
      case "csv":
        // Convert app usage data to CSV format
        const csvData = results
          .map((row) => `${row.app_name},${row.total_seconds},${row.excluded}`)
          .join("\n");
        const csvHeader = "App Name,Total Seconds,Excluded\n";
        const fullCsvData = csvHeader + csvData;
        fs.writeFileSync(filePath, fullCsvData);
        console.log(chalk.green(`Data exported to ${filePath}`));
        break;

      case "json":
        // Reshape the data
        const reshapedData = results.map((row) => ({
          app_name: row.app_name,
          total_seconds: row.total_seconds,
          excluded: row.excluded,
        }));

        // Convert app usage data to JSON format
        const jsonData = JSON.stringify(reshapedData, null, 2);
        fs.writeFileSync(filePath, jsonData);
        console.log(chalk.green(`Data exported to ${filePath}`));
        break;

      default:
        console.error("Invalid format. Please choose 'csv' or 'json'.");
        return;
    }
  } catch (error) {
    console.error(`Error exporting data to ${format.toUpperCase()}:`, error);
  }
}

export async function sleepAndClear(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.clear();
}

function getDateString() {
  const date = new Date();
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

export async function getAppUsage(period, range = false, reshape = true) {
  const results = await fetchAppUsage(period, range);

  // Reshape the data if needed
  if (reshape) {
    return results.map((row) => ({
      name: row.app_name,
      excluded: row.excluded ? "Yes" : "No",
      usage: formatDuration(row.total_seconds),
    }));
  }

  return results;
}


export function setuDirectory() {
  // Create export directory if it doesn't exist
  if (!fs.existsSync(EXPORT_PATH)) {
    fs.mkdirSync(EXPORT_PATH, { recursive: true });
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.mkdirSync(BACKUP_PATH, { recursive: true });
  }
}

export function createBackup() {
  try {
    const dateString = getDateString();

    const backupFileName = `pStalker_backup_${dateString}.db`;
    const backupFilePath = path.join(BACKUP_PATH, backupFileName);

    fs.copyFileSync(DB_PATH, backupFilePath);
    console.log(
      chalk.green(`Backup created successfully at ${backupFilePath}`)
    );
  } catch (error) {
    console.error(chalk.red("Error creating backup:", error));
  }
}


export function restoreBackup(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(chalk.red("Backup file not found."));
      return;
    }

    fs.copyFileSync(backupFile, DB_PATH);
    console.log(chalk.green("Backup restored successfully."));
  } catch (error) {
    console.error(chalk.red("Error restoring backup:", error));
  }
}