<a id="readme-top"></a>

[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Forks][forks-shield]][forks-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/GianlucaIavicoli/pStalker">
    <img src="images/logo.png" alt="Logo">
  </a>

<h3 align="center">pStalker</h3>

  <p align="center">
pStalker is a CLI time-tracking tool for Linux, with future support planned for other OS. It tracks time spent on desktop apps from installation, continuing on each boot. Users can view usage reports for various timeframes (today, last 7 days, last month) and can exclude specific apps as needed.
    <br />
    <a href="https://github.com/GianlucaIavicoli/pStalker"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/GianlucaIavicoli/pStalker/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/GianlucaIavicoli/pStalker/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project
[![Product Name Screen Shot][product-screenshot]](https://github.com/GianlucaIavicoli/pStalker)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=F7DF1E) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Shell Script](https://img.shields.io/badge/shell_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white) ![Python](https://img.shields.io/badge/python-%2314354C.svg?style=for-the-badge&logo=python&logoColor=white) ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Supported Operating Systems

| Operating System       | Support Level                |
| ---------------------- | ------------------------------ |
| Linux (X11)            | Full Support ✅                |
| Linux (GNOME/Wayland)  | Requires Extension ✅         |
| Windows                | Not Yet Supported ❌          |
| macOS                  | Not Yet Supported ❌          |

**Tested Distributions:**
- **Manjaro GNOME/Wayland**: Tested and supported. ✅
- **Ubuntu 22 GNOME X11**: Tested and supported. ✅


<!-- GETTING STARTED -->
## Getting Started

Follow the instructions below to set up pStalker on your local Linux machine.

### Prerequisites

Ensure that you have the following installed on your system:

* Python
* Node.js

### Installation

> **⚠️ Warning for Linux Users:**
> - **GNOME/Wayland Users:** You **must** install the [Window Calls Extended](https://extensions.gnome.org/extension/4974/window-calls-extended/) extension for pStalker to function properly.
> - **Autostart Configuration:** Ensure your Linux distribution uses the `~/.config/autostart/` directory to run scripts on login; otherwise, pStalker won't work.
> - **Privileges:** You might need to use `sudo` to install pStalker.

**Install pStalker globally** using npm:

```bash
 npm install -g --foreground-scripts pstalker
 ```

**Thats it**, pStalker will automatically configures itself to start on boot by placing a script in the `~/.config/autostart/` directory.

> **🔒 Privacy Note:** Rest assured, pStalker does not collect any type of user data. You can review the code to confirm our commitment to your privacy. :)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- USAGE EXAMPLES -->
## Usage

Run the tool with the following command:

```bash
pstalker
```

The following is a representation of the pStalker CLI menu and its options:

```md
pStalker CLI
├── Main Menu
│   ├── Enable Tracking
│   │   └── Enables tracking both now and on boot. Re-runs the installer script; may require sudo.
│   ├── Disable Tracking
│   │   └── Disables tracking both now and on boot. Removes tool-related files; database remains unchanged; may require sudo.
│   │ 
│   ├── Show Apps Usage
│   │   ├── Show Today
│   │   │   └── Displays usage data for today.
│   │   ├── Show Last Week
│   │   │   └── Displays usage data for the last 7 days.
│   │   ├── Show Last Month
│   │   │   └── Displays usage data for the last 30 days.
│   │   ├── Show Last Year
│   │   │   └── Displays usage data for the last 365 days.
│   │   ├── Show Specific Date
│   │   │   └── Displays usage data for a specific day.
│   │   └── Show Date Range
│   │       └── Displays usage data for a specific date range.
│   │ 
│   ├── Manage Apps
│   │   ├── Show Apps List
│   │   │   └── Lists all apps detected at least once.
│   │   ├── Include Apps
│   │   │   └── Re-includes apps that were previously excluded.
│   │   ├── Exclude Apps
│   │   │   └── Excludes apps from tracking.
│   │   └── Delete Apps Usage History
│   │       └── Deletes usage history for one or more apps.
│   │ 
│   ├── Help
│   │   └── Displays the help menu for the current section.
│   └── Exit
│       └── Exits the tool.
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ROADMAP -->
## Roadmap

- [x] Enable selecting a specific day for generating reports
- [x] Enable selecting a date range for generating reports
- [x] Enable deleting all usage history for a specific app
- [ ] Allow exporting data to a CSV file
- [ ] Allow exporting data to a JSON file
- [ ] Add support for Windows
- [ ] Add automated tests
- [ ] Develop a GUI using Electron for viewing data on Linux and Windows
- [ ] Enable importing and exporting database backups

See the [open issues](https://github.com/GianlucaIavicoli/pStalker/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make pStalker better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTACT -->
## Contact

Gianluca Iavicoli - [Linkedin](https://www.linkedin.com/in/gianluca-iavicoli-684b32262) - info@gianlucaiavicoli.dev

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

Special thanks to the resources and tools that helped make this project possible:

* [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
* [node-real-idle](https://github.com/paymoapp/node-real-idle)
* [node-active-window](https://github.com/paymoapp/node-active-window)
* [window-calls-extended](https://extensions.gnome.org/extension/4974/window-calls-extended/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[forks-shield]: https://img.shields.io/github/forks/GianlucaIavicoli/pStalker.svg?style=for-the-badge
[forks-url]: https://github.com/GianlucaIavicoli/pStalker/network/members
[stars-shield]: https://img.shields.io/github/stars/GianlucaIavicoli/pStalker.svg?style=for-the-badge
[stars-url]: https://github.com/GianlucaIavicoli/pStalker/stargazers
[issues-shield]: https://img.shields.io/github/issues/GianlucaIavicoli/pStalker.svg?style=for-the-badge
[issues-url]: https://github.com/GianlucaIavicoli/pStalker/issues
[product-screenshot]: images/screenshot.png
