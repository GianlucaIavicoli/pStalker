# Changelog

## 1.3.6
- Added the options to export the usage history to a CSV or JSON file

## v1.2.6
- Update app usage menu to handle cases with no apps used yet

## v1.2.5
- Enhanced GNOME detection to support mixed desktop identifiers in XDG_CURRENT_DESKTOP such as 'ubuntu:gnome'

## v1.2.4
- Improved the logic to detect the desktop environment in use
- Added the logic to ensure the XDG_SESSION_TYPE is not set to tty
- Fixed the issue with the installation process that was causing the script to fail when checking if python3 is installed even if it was installed
- Added the check for the 'pip3' command to be installed before installing the required packages
- Revert the changes made in v1.2.3 and v1.2.2

## v1.2.3
- Added a small fix during the install/uninstall when checking if python3 is installed

## v1.2.2
- Added a small fix during the install/uninstall when checking if python is installed

## v1.2.1
- Added a small fix during the install/uninstall process to support older versions of bash

## v1.2.0
- Added the option to delete all the usage history for one or more apps. 

## v1.1.0 
- Added the possibility to get the report of apps usage for a specific date
- Added the possibility to get the report of apps usage for a specific date range

## v1.0.0 Initial Release
- Initial release of the package
