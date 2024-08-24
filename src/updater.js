import { updateAppUsage } from "./database.js";
import { ActiveWindow } from "@paymoapp/active-window";
import osName from "os-name";
import { execSync } from "child_process";
import { exit } from "process";

// Initialize the ActiveWindow module
ActiveWindow.initialize();

if (!ActiveWindow.requestPermissions()) {
  console.log(
    "Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording"
  );
  process.exit(0);
}

// Retrieve the idle state argument from command line
const args = process.argv.slice(2);

// Check if the number of arguments is correct
if (args.length !== 3) {
  console.error("Error: Two arguments are required");
  process.exit(1);
}

// Check if the idle state argument is valid
const idleState = args[0];
if (!["0", "1"].includes(idleState)) {
  console.error("Error: idleState should be 0 (active) or 1 (idle)");
  process.exit(1);
}

// Check if the Wayland and Gnome argument is valid
const isWaylandAndGnome = args[1];
if (!["0", "1"].includes(isWaylandAndGnome)) {
  console.error("Error: isWaylandAndGnome should be 0 or 1");
  process.exit(1);
}

// CHeck if the dbus session bus address is valid
const dbusSessionBusAddress = args[2];
if (!dbusSessionBusAddress) {
  console.error("Error: DBUS_SESSION_BUS_ADDRESS is required");
  process.exit(1);
}

function getActiveWindowInfo() {
  const os = osName();

  let currentWindow;
  let appName;

  try {
    // If the user is using Wayland and Gnome, we need to use a different method to get the active window, using the extension 'window-calls-extended'
    if (os.includes("Linux") && isWaylandAndGnome) {

      try {
        // Command to get the PID of the active window using the retrieved DBUS_SESSION_BUS_ADDRESS
        const pidCommand = `DBUS_SESSION_BUS_ADDRESS=${dbusSessionBusAddress} gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowsExt --method org.gnome.Shell.Extensions.WindowsExt.FocusPID | sed -E "s/\\('(.*)',\\)/\\1/g"`;
        const pid = execSync(pidCommand, { shell: true }).toString().trim();

        // If the active window is the desktop, the PID will be empty
        if (pid === "") return;

        // Get the application name using the PID
        const appNameCommand = `ps -p ${pid} -o comm=`;
        appName = execSync(appNameCommand).toString().trim();
      } catch (error) {
        console.error("Failed: " + error.message);
        return;
      }
    } else {
      // Otherwise, use the ActiveWindow module to get the active window
      currentWindow = ActiveWindow.getActiveWindow();
      appName = currentWindow.application;
    }

    switch (idleState) {
      case "0":
        if (appName === "") {
          console.log("Active window found, but no application name");
          break;
        }

        console.log("Active window:", appName);
        updateAppUsage(appName);
        break;

      case "1":
        console.log("System is idle");
        // No action is needed when the state is idle
        break;

      default:
        console.error("Unexpected idleState value");
        break;
    }
  } catch (error) {
    console.error("Error in getActiveWindowInfo:", error);
  }
}

getActiveWindowInfo();
