import osName from "os-name";
import { LINUX_INSTALL_PATH, LINUX_INSTALL_ARGS } from "../src/constants.js";
import { execSync } from "child_process";

(async () => {
  try {
    // Get the user's operating system
    const os = osName();

    // Skip execution in CI environment
    if (process.env.CI) {
      console.log("Skipping post-install script in CI environment.");
      process.exit(0);
    }

    switch (true) {
      case os.includes("Linux"):
        try {
          const command = `sh ${LINUX_INSTALL_PATH} ${LINUX_INSTALL_ARGS}`;
          execSync(command, {
            stdio: "inherit",
            shell: true,
          });
        } catch (error) {
          console.error("Error setting up startup script.");
          process.exit(1);
        }
        break;

      case os.includes("Windows"):
        throw new Error("OS not yet supported");

      case os.includes("macOS"):
        throw new Error("OS not yet supported");

      default:
        throw new Error("Unsupported OS");
    }
  } catch (error) {
    console.error("Error during post-install setup:", error);
    process.exit(1);
  }
})();
