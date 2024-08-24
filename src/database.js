import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { DB_PATH } from "./constants.js";
import { formatDuration, getDateRange } from "./utils.js";

// Function to check if the database file already exists
function checkDatabaseExists() {
  return fs.existsSync(DB_PATH);
}

// Function to initialize the database and create tables if necessary
export async function initializeDatabase() {
  // Ensure the data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Check if the tables exist
  const tablesExist = await db.get(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='app_usage';
  `);

  if (!tablesExist) {
    // Create a table for tracking app usage
    await db.exec(`
			CREATE TABLE IF NOT EXISTS apps (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				app_name TEXT NOT NULL UNIQUE,
				excluded INTEGER DEFAULT 0 -- 0 = Not Excluded, 1 = Excluded
			)
    `);

    // Create a table for tracking app usage
    await db.exec(`
			CREATE TABLE IF NOT EXISTS app_usage (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				app_id INTEGER NOT NULL,
				duration INTEGER,
				usage_date DATE NOT NULL,
				FOREIGN KEY (app_id) REFERENCES apps(id)
			)
    `);

    // Create a table for storing tracking settings
    await db.exec(`
			CREATE TABLE IF NOT EXISTS settings (
				id INTEGER PRIMARY KEY,
				tracking_enabled INTEGER DEFAULT 1
			)
    `);

    // Insert default settings
    await db.run(`
			INSERT INTO settings (id, tracking_enabled)
			VALUES (1, 1)
    `);
  }

  return db;
}

// Fetch app usage for a given period
export async function fetchAppUsage(period, range = false) {
  const db = await initializeDatabase();
  let startDate, endDate;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(period)) {
    // Handle specific day
    const [day, month, year] = period.split("/").map(Number);
    const specificDate = new Date(year, month - 1, day);
    startDate = specificDate.toISOString().split("T")[0];
    endDate = startDate; // For a specific day, startDate and endDate are the same
  } else if (range) {
    const [startDay, startMonth, startYear] = period.startDate
      .split("/")
      .map(Number);
    const [endDay, endMonth, endYear] = period.endDate.split("/").map(Number);

    startDate = new Date(startYear, startMonth - 1, startDay)
      .toISOString()
      .split("T")[0];
    endDate = new Date(endYear, endMonth - 1, endDay)
      .toISOString()
      .split("T")[0];
  } else {
    // Use the date range function for predefined periods
    ({ startDate, endDate } = getDateRange(period));
  }

  // Query to get app usage data within the specified date range
  const rows = await db.all(
    `SELECT a.app_name, a.excluded, SUM(au.duration) as total_seconds
			 FROM app_usage au
			 JOIN apps a ON au.app_id = a.id
			 WHERE au.usage_date BETWEEN ? AND ?
			 GROUP BY a.app_name
			 ORDER BY total_seconds DESC`,
    startDate,
    endDate
  );

  // Reshape and format the output
  const result = rows.map((row) => ({
    name: row.app_name,
    excluded: row.excluded ? "Yes" : "No",
    usage: formatDuration(row.total_seconds),
  }));

  await db.close();
  return result;
}

// Function to add app usage data
export async function updateAppUsage(appName) {
  const db = await initializeDatabase();
  const currentDate = new Date().toISOString().split("T")[0];

  // Make the first letter of the app name uppercase
  appName = appName.charAt(0).toUpperCase() + appName.slice(1);

  try {
    // Check if the app exists in the apps table
    let app = await db.get(
      `SELECT id, excluded FROM apps WHERE app_name = ?`,
      appName
    );

    // If the app does not exist, add it
    if (!app) {
      const result = await db.run(
        `INSERT INTO apps (app_name) VALUES (?)`,
        appName
      );
      app = { id: result.lastID, excluded: 0 };
    }

    // If the app is excluded, do not track usage
    if (app.excluded === 1) {
      return;
    }

    // Check if there is an existing entry in the app_usage table for the current date
    const appUsage = await db.get(
      `SELECT id, duration FROM app_usage WHERE app_id = ? AND usage_date = ?`,
      app.id,
      currentDate
    );

    if (!appUsage) {
      // If no entry exists for today, create a new entry with duration 1
      await db.run(
        `INSERT INTO app_usage (app_id, duration, usage_date) VALUES (?, ?, ?)`,
        app.id,
        1,
        currentDate
      );
    } else {
      // If an entry exists for today, add 1 second to the duration
      await db.run(
        `UPDATE app_usage SET duration = duration + 1 WHERE id = ?`,
        appUsage.id
      );
    }
  } catch (error) {
    console.error(
      `Failed to update app usage for ${appName}: ${error.message}`
    );
  } finally {
    await db.close();
  }
}

// Function to check if tracking is enabled
export async function isTrackingEnabled() {
  const db = await initializeDatabase();
  const setting = await db.get(`
        SELECT tracking_enabled FROM settings WHERE id = 1;
    `);
  await db.close();
  return setting.tracking_enabled === 1;
}

// Function to enable or disable tracking status
export async function setTrackingEnabled(enabled) {
  const db = await initializeDatabase();
  await db.run(
    `
        UPDATE settings
        SET tracking_enabled = ?
        WHERE id = 1
    `,
    [enabled ? 1 : 0]
  );
  await db.close();
}

// Function to get apps based on their excluded status
export async function getApps(exclusionStatus = "all") {
  const db = await initializeDatabase();
  try {
    let query = `SELECT id, app_name, excluded FROM apps`;

    // Modify the query based on the exclusionStatus parameter
    if (exclusionStatus === "excluded") {
      query += ` WHERE excluded = 1`;
    } else if (exclusionStatus === "not_excluded") {
      query += ` WHERE excluded = 0`;
    }

    const apps = await db.all(query);
    await db.close();
    return apps;
  } catch (error) {
    console.error("Error retrieving apps:", error);
  }
}

// Function to mark apps as excluded or included
export async function markAppsAsExcludedOrIncluded(appIds, exclude) {
  const db = await initializeDatabase();
  try {
    const placeholders = appIds.map(() => "?").join(",");
    const query = `
            UPDATE apps
            SET excluded = ?
            WHERE id IN (${placeholders})
        `;
    await db.run(query, [exclude ? 1 : 0, ...appIds]);
    await db.close();
  } catch (error) {
    console.error("Error updating app exclusion status:", error);
  }
}

// Ensure the data directory exists, if not create it
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the database when the module is loaded
if (!checkDatabaseExists()) {
  initializeDatabase().catch((error) => {
    console.error("Error during database setup:", error);
  });
}
