#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import {
  sleepAndClear,
  enableTracking,
  disableTracking,
} from "../src/utils.js";
import {
  DEFAULT_SLEEP_TIME,
  MAIN_MENU_HELP,
  APP_USAGE_HELP,
  APPS_MENU_HELP,
  SMALL_SEPARATOR,
} from "../src/constants.js";
import {
  getApps,
  markAppsAsExcludedOrIncluded,
  isTrackingEnabled,
  fetchAppUsage,
} from "../src/database.js";
import { Table } from "console-table-printer";

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
    choices.push("Help", "Back");

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
  try {
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
          "Help",
          "Back",
        ],
      },
    ]);

    switch (answers.reportOption) {
      case "Show today":
        results = await fetchAppUsage("1d");

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for today";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last week":
        results = await fetchAppUsage("1w");

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last week";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last month":
        results = await fetchAppUsage("1m");

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last month";
        defaultTable.addRows(results);

        // Clear the console and print the table
        console.clear();
        console.log(SMALL_SEPARATOR);
        defaultTable.printTable();
        break;

      case "Show last year":
        results = await fetchAppUsage("1y");

        // Update the table title and add the rows
        defaultTable.table.title = "Apps usage report for the last year";
        defaultTable.addRows(results);

        // Clear the console and print the table
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

async function mainMenu() {
  try {
    const trackingEnabled = await isTrackingEnabled();

    let choices = [];

    // Add the tracking option based on the current status
    if (trackingEnabled) choices.push("Disable tracking");
    else choices.push("Enable tracking");

    // Add the rest of the options
    choices.push("Show apps usage", "Manage apps", "Help", "Exit");

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
        await sleepAndClear(DEFAULT_SLEEP_TIME);
        break;

      case "Disable tracking":
        await disableTracking();
        await sleepAndClear(DEFAULT_SLEEP_TIME);
        break;

      case "Show apps usage":
        await appUsageMenu();
        break;

      case "Manage apps":
        await appsMenu();
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

  // Re-run the main menu after each action
  mainMenu();
}

// Clear the console
console.clear();

// Start the CLI
mainMenu();
