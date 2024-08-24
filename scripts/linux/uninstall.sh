#!/bin/bash

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_NAME=$1
PROJECT_ROOT=$2
SCRIPT_NAME="${APP_NAME,,}.sh"
AUTOSTART_PATH="$HOME/.config/autostart/${APP_NAME,,}.desktop"
LOGS_FILE_PATH="/var/log/${APP_NAME,,}.log"

# Check if the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Usage: $0 <app_name> <project_root>${NC}"
    exit 1
fi

# Step 1: Stop the tracking process using pgrep and kill
PID=$(pgrep -f "$SCRIPT_NAME")
if [ -n "$PID" ]; then
    kill "$PID"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}The ${APP_NAME} process has been terminated.${NC}"
    else
        echo -e "${RED}Failed to terminate the ${APP_NAME} process.${NC}"
    fi
else
    echo -e "${RED}Process not found. It may already be stopped.${NC}"
fi

# Step 2: Remove the tracking startup script from autostart
if [ -f "$AUTOSTART_PATH" ]; then
    rm "$AUTOSTART_PATH"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}The autostart script for ${APP_NAME} has been removed.${NC}"
    else
        echo -e "${RED}Failed to remove the autostart script.${NC}"
    fi
else
    echo -e "${RED}Autostart script not found.${NC}"
fi


# Step 3: Remove the tracking script from the bin directory
if [ -f "$PROJECT_ROOT/bin/$SCRIPT_NAME" ]; then
    rm "$PROJECT_ROOT/bin/$SCRIPT_NAME"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}The tracking script for ${APP_NAME} has been removed.${NC}"
    else
        echo -e "${RED}Failed to remove the tracking script.${NC}"
    fi
else
    echo -e "${RED}Tracking script not found.${NC}"
fi


# Step 4: Remove the log file
if [ -f "$LOGS_FILE_PATH" ]; then
    sudo rm "$LOGS_FILE_PATH"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}The log file for ${APP_NAME} has been removed.${NC}"
    else
        echo -e "${RED}Failed to remove the log file.${NC}"
    fi
else
    echo -e "${RED}Log file not found.${NC}"
fi


# Step 5: Remove the python virtual environment
if [ -d "$PROJECT_ROOT/.venv" ]; then
    rm -rf "$PROJECT_ROOT/.venv"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}The virtual environment for ${APP_NAME} has been removed.${NC}"
    else
        echo -e "${RED}Failed to remove the virtual environment.${NC}"
    fi
else
    echo -e "${RED}Virtual environment not found.${NC}"
fi

echo -e "${RED}The tracking for $APP_NAME has been disabled correctly.${NC}"
