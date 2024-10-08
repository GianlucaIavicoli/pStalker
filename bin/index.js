#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import {
  sleepAndClear,
  enableTracking,
  disableTracking,
  exportData,
  setuDirectory,
  getAppUsage,
  createBackup,
  restoreBackup,
} from "../src/utils.js";
import {
  DEFAULT_SLEEP_TIME,
  MAIN_MENU_HELP,
  APP_USAGE_HELP,
  APPS_MENU_HELP,
  SMALL_SEPARATOR,
  EXPORT_MENU_HELP,
  BACKUPS_MENU_HELP,
  BACKUP_PATH,
} from "../src/constants.js";
import {
  getApps,
  markAppsAsExcludedOrIncluded,
  isTrackingEnabled,
  deleteAppUsageHistory,
  getUsedApps,
} from "../src/database.js";
import { Table } from "console-table-printer";
import fs from "fs";
import path from "path";

async function appsMenu() {
  var defaultTable = new Table({
    columns: [
      { name: "app_name", title: "App Name", alignment: "left", color: "cyan" },
      {
        name: "excluded",
        title: "Excluded",
        alignment: "left",
        color: "red",
      },
    ],
  });

  try {
    const apps = await getApps("all");

    // If there are no apps, show a message and return to the main menu
    if (apps.length === 0) {
      console.log(chalk.blue("No apps found."));
      await sleepAndClear(DEFAULT_SLEEP_TIME);
      return;
    }

    const excludedApps = apps.filter((app) => app.excluded === 1);
    const notExcludedApps = apps.filter((app) => app.excluded === 0);

    // Generate the choices based on the apps data
    let choices = ["Show apps list"];

    if (notExcludedApps.length > 0) choices.push("Exclude apps");
    if (excludedApps.length > 0) choices.push("Include apps");
    choices.push("Delete apps usage history", "Help", "Back");

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "appAction",
        message: "Manage Apps options:",
        choices,
        theme: {
          helpMode: "always",
        },
        pageSize: 15,
      },
    ]);

    switch (answers.appAction) {
      case "Show apps list":
        // Reshape the apps data to display in a table
        const reshapedApps = apps.map((app) => {
          const { app_name, excluded } = app;
          return {
            app_name: app_name.charAt(0).toUpperCase() + app_name.slice(1),
            excluded: excluded ? "Yes" : "No",
          };
        });

        // Update the table title and add the rows
        defaultTable.table.title = "Apps list";
        defaultTable.addRows(reshapedApps);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Exclude apps":
        const excludeAnswers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "appsToExclude",
            message: "Select apps to exclude:",
            choices: notExcludedApps.map((app) => ({
              name: app.app_name,
              value: app.id,
            })),
            loop: false,
            pageSize: 15,
            theme: {
              helpMode: "always",
            },
            required: false,
          },
        ]);

        if (excludeAnswers.appsToExclude.length > 0) {
          await markAppsAsExcludedOrIncluded(
            excludeAnswers.appsToExclude,
            true
          );
          console.log(chalk.green("Apps have been excluded."));
        } else {
          console.log(chalk.blue("No apps selected."));
        }
        await sleepAndClear(DEFAULT_SLEEP_TIME);
        break;

      case "Include apps":
        const includeAnswers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "appsToInclude",
            message: "Select apps to exclude:",
            choices: excludedApps.map((app) => ({
              name: app.app_name,
              value: app.id,
            })),
            loop: false,
            pageSize: 15,
            theme: {
              helpMode: "always",
            },
          },
        ]);

        if (includeAnswers.appsToInclude.length > 0) {
          await markAppsAsExcludedOrIncluded(
            includeAnswers.appsToInclude,
            false
          );
          console.log(chalk.green("Apps have been included."));
        } else {
          console.log(chalk.blue("No apps selected."));
        }
        await sleepAndClear(DEFAULT_SLEEP_TIME);
        break;

      case "Delete apps usage history":
        const usedApps = await getUsedApps();
        const deleteAnswers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "appsToDelete",
            message: "Select apps to delete all usage history:",
            choices: usedApps.map((app) => ({
              name: app.app_name,
              value: app.id,
            })),
            loop: false,
            pageSize: 15,
            theme: {
              helpMode: "always",
            },
          },
        ]);

        if (deleteAnswers.appsToDelete.length > 0) {
          // Confirm deletion
          const { confirmDelete } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirmDelete",
              message: `Are you sure you want to delete all usage history for the selected apps? This action cannot be undone.`,
              default: false,
            },
          ]);

          if (confirmDelete) {
            const success = await deleteAppUsageHistory(
              deleteAnswers.appsToDelete
            );
            if (success) {
              console.log(
                chalk.green(
                  "All usage history for the selected apps has been deleted."
                )
              );
            } else {
              console.log(chalk.red("Failed to delete usage history."));
            }
          } else {
            console.log(chalk.green("Operation cancelled."));
          }
        } else {
          console.log(chalk.blue("No apps selected for deletion."));
        }

        await sleepAndClear(DEFAULT_SLEEP_TIME);
        break;

      case "Help":
        console.clear();
        console.log(APPS_MENU_HELP);
        break;

      case "Back":
        console.clear();
        return; // Go back to the main menu
    }

    await appsMenu(); // Return to the apps menu after each action
  } catch (error) {
    // Handle the Ctrl+C exit prompt
    if (error.name === "ExitPromptError") {
      console.log(chalk.red("\nExiting..."));
      process.exit(0);
    }
  }
}

async function appUsageMenu() {
  var results;
  var defaultTable = new Table({
    columns: [
      { name: "name", title: "App Name", alignment: "left", color: "cyan" },
      {
        name: "excluded",
        title: "Excluded",
        alignment: "left",
        color: "red",
      },
      { name: "usage", title: "Usage", alignment: "left", color: "green" },
    ],
  });

  try {
    const apps = await getUsedApps();

    // If there are no apps, show a message and return to the main menu
    if (apps.length === 0) {
      console.log(chalk.blue("No apps used yet."));
      await sleepAndClear(DEFAULT_SLEEP_TIME);
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "reportOption",
        message: "Select the report period:",
        choices: [
          "Show today",
          "Show last week",
          "Show last month",
          "Show last year",
          "Show specific day",
          "Show date range",
          "Help",
          "Back",
        ],
        pageSize: 15,
      },
    ]);

    switch (answers.reportOption) {
      case "Show today":
        results = await getAppUsage("1d", false, true);

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for today";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last week":
        results = await getAppUsage("1w", false, true);

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last week";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last month":
        results = await getAppUsage("1m", false, true);

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last month";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last year":
        results = await getAppUsage("1y", false, true);

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last year";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show specific day":
        const { specificDate } = await inquirer.prompt([
          {
            type: "input",
            name: "specificDate",
            message: "Enter the date in the format (DD MM YYYY):",
            validate: (input) => {
              const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
              return isValidDate
                ? true
                : "Please enter a valid date in the format DD MM YYYY. For example, 21 04 2024.";
            },
          },
        ]);

        // Convert the space-separated date into a Date object
        const [day, month, year] = specificDate.split(" ").map(Number);
        const formattedDate = `${String(day).padStart(2, "0")}/${String(
          month
        ).padStart(2, "0")}/${year}`;
        const displayDate = new Date(year, month - 1, day).toDateString();

        // Fetch the app usage data for the specific day
        results = await getAppUsage(formattedDate, false, true);

        // Update and print the table
        defaultTable.table.title = `Apps usage report for: ${displayDate}`;
        defaultTable.addRows(results);
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show date range":
        const { startDate, endDate } = await inquirer.prompt([
          {
            type: "input",
            name: "startDate",
            message: "Enter the start date (DD MM YYYY):",
            validate: (input) => {
              const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
              return isValidDate
                ? true
                : "Please enter a valid date in the format DD MM YYYY. For example, 01 01 2024.";
            },
          },
          {
            type: "input",
            name: "endDate",
            message: "Enter the end date (DD MM YYYY):",
            validate: (input) => {
              const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
              return isValidDate
                ? true
                : "Please enter a valid date in the format DD MM YYYY. For example, 31 12 2024.";
            },
          },
        ]);

        // Convert the space-separated dates into Date objects
        const [startDay, startMonth, startYear] = startDate
          .split(" ")
          .map(Number);
        const [endDay, endMonth, endYear] = endDate.split(" ").map(Number);

        const formattedStartDate = `${String(startDay).padStart(
          2,
          "0"
        )}/${String(startMonth).padStart(2, "0")}/${startYear}`;
        const formattedEndDate = `${String(endDay).padStart(2, "0")}/${String(
          endMonth
        ).padStart(2, "0")}/${endYear}`;

        const displayStartDate = new Date(
          startYear,
          startMonth - 1,
          startDay
        ).toDateString();
        const displayEndDate = new Date(
          endYear,
          endMonth - 1,
          endDay
        ).toDateString();

        // Fetch the app usage data for the specified date range
        results = await getAppUsage(
          {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
          },
          true,
          true
        );

        // Update and print the table
        defaultTable.table.title = `Apps usage: \nFrom: ${displayStartDate} -> ${displayEndDate}`;
        defaultTable.addRows(results);
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Help":
        console.clear();
        console.log(APP_USAGE_HELP);
        break;

      case "Back":
        console.clear();
        return;
    }

    await appUsageMenu();
  } catch (error) {
    // Handle the Ctrl+C exit prompt
    if (error.name === "ExitPromptError") {
      console.log(chalk.red("\nExiting..."));
      process.exit(0);
    }
  }
}

async function exportMenu() {
  const apps = await getUsedApps();

  // If there are no apps, show a message and return to the main menu
  if (apps.length === 0) {
    console.log(chalk.blue("No apps used yet."));
    await sleepAndClear(DEFAULT_SLEEP_TIME);
    return;
  }

  const { exportFormat } = await inquirer.prompt([
    {
      type: "list",
      name: "exportFormat",
      message: "Choose the export format:",
      choices: ["Export to CSV", "Export to JSON", "Help", "Back"],
    },
  ]);

  switch (exportFormat) {
    case "Export to CSV":
      await chooseExportPeriods("csv");
      break;

    case "Export to JSON":
      await chooseExportPeriods("json");
      break;

    case "Help":
      console.clear();
      console.log(EXPORT_MENU_HELP);
      break;

    case "Back":
      console.clear();
      return;
  }

  await exportMenu();
}

async function chooseExportPeriods(format) {
  const { usageOption } = await inquirer.prompt([
    {
      type: "list",
      name: "usageOption",
      message: "Select the usage period:",
      choices: [
        "Usage today",
        "Usage last week",
        "Usage last month",
        "Usage last year",
        "Usage specific day",
        "Usage date range",
        "Back",
      ],
      pageSize: 15,
    },
  ]);

  let results;
  switch (usageOption) {
    case "Usage today":
      results = await getAppUsage("1d", false, false);
      break;
    case "Usage last week":
      results = await getAppUsage("1w", false, false);
      break;
    case "Usage last month":
      results = await getAppUsage("1m", false, false);
      break;
    case "Usage last year":
      results = await getAppUsage("1y", false, false);
      break;

    case "Usage specific day":
      const { specificDate } = await inquirer.prompt([
        {
          type: "input",
          name: "specificDate",
          message: "Enter the date in the format (DD MM YYYY):",
          validate: (input) => {
            const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
            return isValidDate
              ? true
              : "Please enter a valid date in the format DD MM YYYY. For example, 21 04 2024.";
          },
        },
      ]);

      const [day, month, year] = specificDate.split(" ").map(Number);
      const formattedDate = `${String(day).padStart(2, "0")}/${String(
        month
      ).padStart(2, "0")}/${year}`;

      results = await getAppUsage(formattedDate, false, false);
      break;

    case "Usage date range":
      const { startDate, endDate } = await inquirer.prompt([
        {
          type: "input",
          name: "startDate",
          message: "Enter the start date (DD MM YYYY):",
          validate: (input) => {
            const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
            return isValidDate
              ? true
              : "Please enter a valid date in the format DD MM YYYY. For example, 01 01 2024.";
          },
        },
        {
          type: "input",
          name: "endDate",
          message: "Enter the end date (DD MM YYYY):",
          validate: (input) => {
            const isValidDate = /^\d{2} \d{2} \d{4}$/.test(input.trim());
            return isValidDate
              ? true
              : "Please enter a valid date in the format DD MM YYYY. For example, 31 12 2024.";
          },
        },
      ]);

      const [startDay, startMonth, startYear] = startDate
        .split(" ")
        .map(Number);
      const [endDay, endMonth, endYear] = endDate.split(" ").map(Number);

      const formattedStartDate = `${String(startDay).padStart(2, "0")}/${String(
        startMonth
      ).padStart(2, "0")}/${startYear}`;
      const formattedEndDate = `${String(endDay).padStart(2, "0")}/${String(
        endMonth
      ).padStart(2, "0")}/${endYear}`;

      results = await getAppUsage(
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        true,
        false
      );
      break;

    case "Back":
      return;
  }

  if (!results || results.length === 0) {
    console.log(chalk.red("No data found for the selected period."));
    return;
  }

  // Export the data
  exportData(format, results);
  await sleepAndClear(DEFAULT_SLEEP_TIME);
}

async function backupMenu() {
  const backupOptions = [
    "Create Backup",
    "Restore from Backup",
    "Help",
    "Back",
  ];

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "backupAction",
      message: "Select an action:",
      choices: backupOptions,
      pageSize: 15,
    },
  ]);

  switch (answers.backupAction) {
    case "Create Backup":
      createBackup();
      await sleepAndClear(DEFAULT_SLEEP_TIME);

      break;

    case "Restore from Backup":
      try {
        // Get the list of all backup files in the backup directory
        const backupFiles = fs
          .readdirSync(BACKUP_PATH)
          .filter((file) => file.endsWith(".db"));

        if (backupFiles.length === 0) {
          console.log(chalk.yellow("No backup files found."));
          return;
        }

        // Create a list of backups with their creation dates
        const backupChoices = backupFiles.map((file) => {
          const filePath = path.join(BACKUP_PATH, file);
          const fileStats = fs.statSync(filePath);
          const creationDate = new Date(fileStats.birthtime).toLocaleString();
          return `${file} - ${creationDate}`;
        });

        // Prompt the user to select a backup file
        const { selectedBackup } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedBackup",
            message: "Select a backup file to restore:",
            choices: backupChoices,
            pageSize: 15,
          },
        ]);

        // Extract the filename from the selected choice
        const selectedBackupFile = selectedBackup.split(" - ")[0];
        const backupFilePath = path.join(BACKUP_PATH, selectedBackupFile);

        // Confirm the restoration
        const { confirmRestore } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmRestore",
            message: `Are you sure you want to restore the backup '${selectedBackupFile}'? This will overwrite the current database and cannot be undone.`,
            default: false,
          },
        ]);

        // If confirmed, proceed with restoring the backup
        if (confirmRestore) {
          restoreBackup(backupFilePath);
          await sleepAndClear(DEFAULT_SLEEP_TIME);
        } else {
          console.log(chalk.yellow("Restore operation canceled."));
          await sleepAndClear(DEFAULT_SLEEP_TIME);
        }
      } catch (error) {
        console.error(chalk.red("Error restoring backup:", error));
      }
      break;

    case "Help":
      console.clear();
      console.log(BACKUPS_MENU_HELP);
      break;

    case "Back":
      console.clear();
      return;
  }

  // After completing an action, return to the main backup menu
  await backupMenu();
}

async function mainMenu() {
  try {
    const trackingEnabled = await isTrackingEnabled();

    let choices = [];

    // Add the tracking option based on the current status
    if (trackingEnabled) choices.push("Disable tracking");
    else choices.push("Enable tracking");

    // Add the rest of the options
    choices.push(
      "Show apps usage",
      "Manage apps",
      "Export data",
      "Backup & Restore",
      "Help",
      "Exit"
    );

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What do you want to do?",
        choices,
        theme: {
          helpMode: "always",
        },
        pageSize: 15,
      },
    ]);
    switch (answers.action) {
      case "Enable tracking":
        await enableTracking();
        await sleepAndClear(5000);
        break;

      case "Disable tracking":
        await disableTracking();
        await sleepAndClear(5000);
        break;

      case "Show apps usage":
        await appUsageMenu();
        break;

      case "Manage apps":
        await appsMenu();
        break;

      case "Export data":
        await exportMenu();
        break;

      case "Backup & Restore": // New case for backup and restore
        await backupMenu();
        break;

      case "Help":
        console.clear();
        console.log(MAIN_MENU_HELP(trackingEnabled));
        break;

      case "Exit":
        console.log(chalk.red("\nExiting..."));
        process.exit(0);
    }
  } catch (error) {
    // Handle the Ctrl+C exit prompt
    if (error.name === "ExitPromptError") {
      console.log(chalk.red("\nExiting..."));
      process.exit(0);
    }
  }

  // Constantly check if the pStalker directories are set up
  setuDirectory();

  // Re-run the main menu after each action
  mainMenu();
}

// Clear the console
console.clear();

// Start the CLI
mainMenu();
