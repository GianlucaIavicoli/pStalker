#!/usr/bin/env python3

from dbus_idle import IdleMonitor
import sys
import subprocess

def monitor_idle_time(threshold):
    milliseconds = IdleMonitor().get_dbus_idle()
    seconds = milliseconds / 1000
    return seconds > threshold

def run_js_script(js_script_path, idle_state, is_wayland_and_gnome, dbus_session_bus_address):
    try:
        subprocess.run(["node", js_script_path, idle_state, is_wayland_and_gnome, dbus_session_bus_address], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running JavaScript script: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: ./idle_monitor.py <idle_threshold_in_seconds> <updater_script_path> <is_wayland_and_gnome> <dbus_session_bus_address>")
        sys.exit(1)
    
    try:
        threshold = float(sys.argv[1])
    except ValueError:
        print("Please provide a valid number for the idle threshold.")
        sys.exit(1)
    
    # Path to the JavaScript script that will update the system idle state
    js_script_path = sys.argv[2]

    # Check if the user is using Wayland and GNOME
    is_wayland_and_gnome = sys.argv[3] == "1"
    is_wayland_and_gnome = "1" if is_wayland_and_gnome else "0"

    # get the new argv DBUS_SESSION_BUS_ADDRESS
    dbus_session_bus_address = sys.argv[4]

    try:
        is_idle = monitor_idle_time(threshold)
        idle_state = "1" if is_idle else "0"
 
        run_js_script(js_script_path, idle_state, is_wayland_and_gnome, dbus_session_bus_address)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
