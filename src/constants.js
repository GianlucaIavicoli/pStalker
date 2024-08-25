import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';

// App
export const APP_NAME = 'pStalker';
export const APP_DESCRIPTION =`pStalker is a CLI-only time tracking tool that monitors the time spent on desktop applications.`;
export const APP_VERSION = '1.2.6';
export const LOWERCASE_APP_NAME = APP_NAME.toLowerCase();


// Paths
export const ROOT_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'..'
);
export const DB_PATH = path.join(ROOT_DIR, 'data', 'tracker.db');
export const UPDATER_PATH = path.join(ROOT_DIR, 'src', 'updater.js');


// General Utils
export const IDLE_THRESHOLD = 300;
export const DEFAULT_SLEEP_TIME = 2000;


// Utils Linux
export const LINUX_INSTALL_PATH = path.join(
	ROOT_DIR,
	'scripts',
	'linux',
	'install.sh'
);
export const LINUX_UNINSTALL_PATH = path.join(
	ROOT_DIR,
	'scripts',
	'linux',
	'uninstall.sh'
);
export const LINUX_PYTHON_SCRIPT_PATH = path.join(
	ROOT_DIR,
	'scripts',
	'linux',
	'idle.py'
);
export const LINUX_LOGS_PATH = path.join('/var/log/', `${APP_NAME.toLowerCase()}.log`);
export const LINUX_INSTALL_ARGS = `${ROOT_DIR} ${LINUX_PYTHON_SCRIPT_PATH} ${UPDATER_PATH} ${IDLE_THRESHOLD} ${APP_NAME} ${LINUX_LOGS_PATH}`;


// Messages
export const SEPARATOR = '-------------------------------------------------------------------------------'
export const SMALL_SEPARATOR = '----------------------------------------------------'
const header = `${chalk.bold(`${APP_NAME}`)} - ${chalk.bold(`v${APP_VERSION}`)} - Made by ${chalk.redBright.bold('Gianluca Iavicoli')}`;


export const MAIN_MENU_HELP = (trackingStatus) => `${SEPARATOR}
${header}

${chalk.bold('Description:')} ${APP_DESCRIPTION}

${chalk.bold('Main menu options:')}
 ${chalk.cyan(`${trackingStatus ? 'Disable tracking:' : 'Enable tracking: '}`)}   ${trackingStatus ? 'Disable the tracking process both now and on boot.\n                     This will also remove any files created by the tool to make it work properly.\n                     (Note: The database will not be deleted or modified in any way. Sudo may be required.)' : 'Enable the tracking process both now and on boot.\n                     This will re-run again the installer script to ensure the tool is properly set up.\n                     (Note: If the database already exists, it will not be modified. Sudo may be required.)'}
 ${chalk.cyan('Show apps usage:')}    Display options to show the report of app usage.
 ${chalk.cyan('Manage apps:')}        Manage the list of apps to track.
 ${chalk.cyan('Help:')}               Show this help menu.
 ${chalk.cyan('Exit:')}               Exit the tool.

Use the arrow keys to navigate the menu and press Enter to select an option.
${SEPARATOR}`;


export const APP_USAGE_HELP = `${SEPARATOR}
${chalk.bold('README:')} The names of the apps are detected automatically, unfortunately they are not always user-friendly and can be cryptic.

${chalk.bold('Show apps usage options:')}
 ${chalk.cyan('Show today:')}         Show the apps usage for today.
 ${chalk.cyan('Show last week:')}     Show the apps usage for the last 7 days.
 ${chalk.cyan('Show last month:')}    Show the apps usage for the last 30 days.
 ${chalk.cyan('Show last year:')}     Show the apps usage for the last 365 days.
 ${chalk.cyan('Show specific day:')}  Show the apps usage for a specific day.
 ${chalk.cyan('Show date range:')}    Show the apps usage for a specific date range.
 ${chalk.cyan('Help:')}               Show this help menu.
 ${chalk.cyan('Back')}                Go back to the main menu.

Use the arrow keys to navigate the menu and press Enter to select an option.
${SEPARATOR}`;


export const APPS_MENU_HELP = `${SEPARATOR}
${chalk.bold('README:')} By default, all apps are included in the tracking list.

${chalk.bold('Apps management options:')}
 ${chalk.cyan('Show apps list:')}             Show the list of apps detected at least once.
 ${chalk.cyan('Include apps:')}               Include apps that were previously excluded.
 ${chalk.cyan('Exclude apps:')}               Exclude apps from tracking.
 ${chalk.cyan('Delete apps usage history:')}  Remove all the usage history of one or more apps.
 ${chalk.cyan('Help:')}                       Show this help menu.
 ${chalk.cyan('Back')}                        Go back to the main menu.

Use the arrow keys to navigate the menu and press Enter to select an option.
${SEPARATOR}`;