#!/bin/bash

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to handle cleanup and exit
cleanup_and_exit() {
    local exit_code=$1

    # Check if the virtual environment directory exists and remove it
    if [ -d "$VENV_PATH" ]; then
        echo -e "${YELLOW}Cleaning up: Removing virtual environment in $VENV_PATH...${NC}"
        rm -rf "$VENV_PATH"
    fi

    # Check if the profile script exists and remove it
    if [ -f "$EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME" ]; then
        echo -e "${YELLOW}Cleaning up: Removing existing profile script at $EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME...${NC}"
        sudo rm "$EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME"
    fi


    # Check if the autostart script exists and remove it
    if [ -f "$AUTOSTART_SCRIPT_PATH" ]; then
        echo -e "${YELLOW}Cleaning up: Removing existing autostart script at $AUTOSTART_SCRIPT_PATH...${NC}"
        rm "$AUTOSTART_SCRIPT_PATH"
    fi

    exit "$exit_code"
}


# Check if the correct number of arguments are provided
if [ "$#" -ne 6 ]; then
    echo -e "${RED}Usage: $0 <project_root> <python_script> <updater_script> <threshold> <app_name> <logs_path>${NC}"
    cleanup_and_exit 1
fi


# Retrieve the passed arguments
PROJECT_ROOT="$1"
PYTHON_SCRIPT="$2"
UPDATER_SCRIPT="$3"
THRESHOLD="$4"
APP_NAME="$5"
LOGS_FILE_PATH="$6"

# Print warning message
echo -e "${YELLOW}The script for installing $APP_NAME may require superuser privileges${NC}"
sleep 2

# Print greeting and app installation message
echo -e "${GREEN}Preparing to install ${APP_NAME}...${NC}"
sleep 2


# Define paths and variables
LOWERCASE_APP_NAME="$(echo "${APP_NAME}" | tr '[:upper:]' '[:lower:]')"
EXEC_SCRIPT_NAME="$LOWERCASE_APP_NAME.sh"
EXEC_SCRIPT_PATH="$PROJECT_ROOT/bin"
AUTOSTART_SCRIPT_PATH="$HOME/.config/autostart/$LOWERCASE_APP_NAME.desktop"
VENV_PATH="$PROJECT_ROOT/.venv"
PYTHON_DEPENDENCY="dbus_idle" # Dependency required by the Python script to monitor idle time

#### Checks and validations ####

# Check if Python3 is installed
if ! which python3 &> /dev/null; then
    echo -e "${RED}Error: Python is not installed.${NC}"
    cleanup_and_exit 1
fi

# Check if the Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}Error: Python script not found at $PYTHON_SCRIPT${NC}"
    cleanup_and_exit 1
fi

# Check if the updater script exists
if [ ! -f "$UPDATER_SCRIPT" ]; then
    echo -e "${RED}Error: Updater script not found at $UPDATER_SCRIPT${NC}"
    cleanup_and_exit 1
fi

# Check if /etc/profile.d directory exists
if [ ! -d "/etc/profile.d" ]; then
    echo -e "${RED}Error: /etc/profile.d directory does not exist.${NC}"
    cleanup_and_exit 1
fi

# Check if the exec script already exists and remove it
if [ -f "$EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME" ]; then
    echo -e "${YELLOW}Warning: EXEC script already exists. Removing it...${NC}"
    rm "$EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME"
fi

# Delete the existing virtual environment if it exists and create a new one
if [ -d "$VENV_PATH" ]; then
    echo -e "${YELLOW}Warning: Deleting existing python virtual environment in the project folder...${NC}"
    rm -rf "$VENV_PATH"
fi

# Check if the /var/log directory exists
if [ ! -d "/var/log" ]; then
    echo -e "${RED}Error: /var/log directory does not exist.${NC}"
    cleanup_and_exit 1
fi

# Check if the logs file already exists and remove it 
if [ -f "$LOGS_FILE_PATH" ]; then
    echo -e "${YELLOW}Warning: The log file for $LOWERCASE_APP_NAME  already exists. Removing it...${NC}"
    sudo rm "$LOGS_FILE_PATH"
fi

# Check if the pid file already exists and remove it
if [ -f "/var/run/${LOWERCASE_APP_NAME}_pid.pid" ]; then
    echo -e "${YELLOW}Warning: The PID file for $LOWERCASE_APP_NAME already exists. Removing it...${NC}"
    sudo rm "/var/run/${LOWERCASE_APP_NAME}_pid.pid"
fi

# Check if the process is already running and kill it
if pgrep -f "$EXEC_SCRIPT_NAME" > /dev/null; then
    echo -e "${YELLOW}Warning: The script for $APP_NAME is already running. Killing it...${NC}"
    sudo pkill -f "$EXEC_SCRIPT_NAME"
fi

# Check if DBUS_SESSION_BUS_ADDRESS is set
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    echo -e "${RED}Error: DBUS_SESSION_BUS_ADDRESS is not set.${NC}"
    cleanup_and_exit 1
fi

# Check if the autostart directory exists
if [ ! -d "$HOME/.config/autostart" ]; then
    echo -e "${RED}Error: $HOME/.config/autostart directory does not exist.${NC}"
    cleanup_and_exit 1
fi

# Check if the .desktop file already exists and remove it
if [ -f "$AUTOSTART_SCRIPT_PATH" ]; then
    echo -e "${YELLOW}Warning: The desktop entry already exists. Removing it...${NC}"
    rm "$AUTOSTART_SCRIPT_PATH"
fi


# Get the session type and convert it to lowercase
SESSION_TYPE=$(echo "$XDG_SESSION_TYPE" | tr '[:upper:]' '[:lower:]')

# Check if the session type is Wayland and GNOME Shell is running
if [ "$SESSION_TYPE" = "wayland" ] && pgrep -x "gnome-shell" > /dev/null; then
    echo -e "${GREEN}Wayland session with GNOME Shell detected.${NC}"

    # Check if the GNOME Shell extension is installed by querying D-Bus
    if gdbus introspect --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowsExt &> /dev/null; then
        # Extract output to determine if extension is installed
        introspect_output=$(gdbus introspect --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowsExt)
        if echo "$introspect_output" | grep -q "interface org.freedesktop.DBus.Properties"; then
            echo -e "${GREEN}GNOME extension 'Window Calls Extended' is installed.${NC}"
            IS_WAYLAND_AND_GNOME=1
        else
            echo -e "${RED}Error: GNOME extension 'Window Calls Extended' is not installed. You can install the extension from https://extensions.gnome.org/extension/4974/window-calls-extended/${NC}"
            cleanup_and_exit 1
        fi
    else
        echo -e "${RED}Error: GNOME extension 'Window Calls Extended' is not installed. You can install the extension from https://extensions.gnome.org/extension/4974/window-calls-extended/${NC}"
        cleanup_and_exit 1
    fi
else
    echo -e "${YELLOW}Warning: XDG_SESSION_TYPE is not Wayland or GNOME Shell is not running. Assuming X11 environment.${NC}"
    IS_WAYLAND_AND_GNOME=0
fi

echo -e "${GREEN}All checks and validations passed.${NC}"
sleep 2

################################

# Create a new virtual environment in the project root directory
echo -e "${GREEN}Creating new python virtual environment in $VENV_PATH...${NC}"
python3 -m venv "$VENV_PATH"
sleep 2

# Source the virtual environment and install the required dependency
source "$VENV_PATH/bin/activate"
echo -e "${GREEN}Installing Python dependency...${NC}"
sleep 2
pip install --upgrade pip
pip install "$PYTHON_DEPENDENCY"

# TODO: Add all the same checks and validations in the exec script since on reboot something might have changed

# Create the exec script file and write the content
cat <<EOL > "$EXEC_SCRIPT_NAME"
#!/bin/bash

date >> /home/kalix/notes.txt

# Path to the Python virtual environment
VENV_PATH=$VENV_PATH

# Path to the Python script
PYTHON_SCRIPT=$PYTHON_SCRIPT

# Path to the updater script
UPDATER_SCRIPT=$UPDATER_SCRIPT

# Path to the log file
LOGS_FILE_PATH=$LOGS_FILE_PATH

# Hard-coded threshold value (in seconds)
THRESHOLD=$THRESHOLD

# Variable to store if the user is using wayland with gnome
IS_WAYLAND_AND_GNOME=$IS_WAYLAND_AND_GNOME

# Path to the PID file so we can kill the script later
PID_FILE=/var/run/${LOWERCASE_APP_NAME}_pid.pid

# DBUS_SESSION_BUS_ADDRESS for D-Bus communication
DBUS_SESSION_BUS_ADDRESS=$DBUS_SESSION_BUS_ADDRESS

# Source the virtual environment and run the Python script every second in the background
{
    source "\$VENV_PATH/bin/activate"
    echo \$\$ > "\$PID_FILE"
    while true; do
        python3 "\$PYTHON_SCRIPT" "\$THRESHOLD" "\$UPDATER_SCRIPT" "\$IS_WAYLAND_AND_GNOME" "\$DBUS_SESSION_BUS_ADDRESS"
        sleep 1
    done
} > "\$LOGS_FILE_PATH" 2>&1 &
EOL

# Create the logs file and change persmission to be runned and logged without sudo
sudo touch "$LOGS_FILE_PATH"
sudo chmod 777 "$LOGS_FILE_PATH"
sudo chown "$USER:$USER" "$LOGS_FILE_PATH"

chmod +x "$EXEC_SCRIPT_NAME"

# Change ownership to root:root
sudo chown "$USER:$USER" "$EXEC_SCRIPT_NAME"

# Move the profile.sh file to /etc/profile.d/
sudo mv "$EXEC_SCRIPT_NAME" "$EXEC_SCRIPT_PATH"

echo -e "${GREEN}The stalker script for ${APP_NAME} has been created and moved to $EXEC_SCRIPT_PATH${NC}"

# Create the autostart .desktop file
cat <<EOL > "$AUTOSTART_SCRIPT_PATH"
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Exec=sh $EXEC_SCRIPT_PATH/$EXEC_SCRIPT_NAME
EOL

# Make the .desktop file executable
sudo chmod +x "$AUTOSTART_SCRIPT_PATH"

echo -e "${GREEN}Autostart entry for ${APP_NAME} has been created at $AUTOSTART_SCRIPT_PATH${NC}"

echo -e "${GREEN}Installation of ${APP_NAME} is complete.${NC}"

# Run the script now
sh "$EXEC_SCRIPT_PATH"/$EXEC_SCRIPT_NAME

# Check if the script is running
if pgrep -f "$EXEC_SCRIPT_NAME" > /dev/null; then
    continue
else
    echo -e "${RED}Error: Could't start the process for $APP_NAME.${NC}"
    cleanup_and_exit 1
fi

echo -e "${GREEN}The process for ${APP_NAME} has been started successfully.${NC}"