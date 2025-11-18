---


# Contributing to Calendar Period Week Notes

Thank you for your interest in contributing to the Calendar Period Week Notes plugin for Obsidian! This guide provides all the information you need to set up your development environment, make changes, and build the plugin.

## Development Environment Setup

To get started, you'll need to set up your local environment. This involves cloning the repository and installing the necessary dependencies.

### Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   **Node.js**: You can download it from [nodejs.org](https://nodejs.org).
*   **npm** (or a similar package manager like Yarn or pnpm): npm is included with the Node.js installation.
*   **Git**: For version control.
*   **Obsidian**: The desktop application is required for testing the plugin.

### Getting Started

Follow these steps to set up your development environment:

1.  **Clone the Repository**:
    First, open your terminal and clone the repository into a local directory.

    ```
    git clone https://github.com/your-username/calendar-period-week-notes.git
    ```

2.  **Navigate to the Project Directory**:
    Change into the newly created directory.

    ```
    cd calendar-period-week-notes
    ```

3.  **Install Dependencies**:
    Run the following command to install all the required packages listed in `package.json`.

    ```
    npm install
    ```

4.  **Set Up for Testing in Obsidian**:
    To test the plugin, you need to load it into your Obsidian vault. The recommended approach is to clone this repository directly into your vault's plugin directory:
    ```
    git clone https://github.com/your-username/calendar-period-week-notes.git /path/to/your/vault/.obsidian/plugins/calendar-period-week-notes
    ```
    After cloning, go to **Settings** > **Community Plugins** in Obsidian, and enable the "Calendar Period Week Notes" plugin.

## Project Structure

A `src` folder is used to keep the project's source code organized and separate from configuration files and build outputs.

Your project structure should look something like this:

```
Calendar Period Week Notes/
├── src/
│ ├── data/
│ │ ├── constants.js 
│ │ ├── templates.js 
│ │ ├── themes.js 
│ ├── main.js # The main entry point for the plugin
│ ├── modals/
│ │ ├── ActionChoiceModal.js 
│ │ ├── ConfirmationModal.js 
│ │ ├── SectionHeaderModal.js 
│ │ ├── TemplatePickerModal.js 
│ │ ├── WidgetBuilderModal.js 
│ ├── settings/
│ │ ├── PeriodSettingsTab.js 
│ │── templates/
│ │ ├── cumulative-created-vs-completed.json 
│ │ ├── kpi-due.json 
│ │ ├── line-7-day-completion.json 
│ │ ├── pie-30-day-status.json
│ ├── themes/
│ │ ├── Autumn.json
│ │ ├── Beach.json
│ │ ├── Calm.json
│ │ ├── Christmas.json
│ │ ├── Default-Developer.json
│ │ ├── Default.json
│ │ ├── Garden.json
│ │ ├── Halloween.json
│ │ ├── Izzy.json
│ │ ├── Kate.json
│ │ ├── Pride.json
│ │ ├── Scary.json
│ │ ├── Sky.json
│ │ ├── Spring.json
│ │ ├── Summer.json
│ │ ├── Winter.json
│ ├── utils/
│ │ ├── colorUtils.js
│ │ ├── dateUtils.js
│ │ ├── suggesters.js
│ ├── views/
│ │ ├── PeriodMonthView.js
│ ├── widgets/
│ │ ├── CssChartRenderer.js
│ │ ├── TaskDataAggregator.js  
├── manifest.json # The plugin manifest
├── package.json
├── rollup.config.js # The Rollup configuration file
├── styles.css
└── README.md

```

All your development work, including new JavaScript files and styles, should be done within the `src` directory.

## Building the Plugin

The `npm run build` command is used to compile your source code from the `src` folder into a production-ready `main.js` file that Obsidian can use.

*   **To perform a one-time build**:
    ```
    npm run build
    ```
*   **To build and watch for changes**:
    For continuous development, you can use the `dev` script, which will automatically rebuild the plugin whenever you save a file.
    ```
    npm run dev
    ```

These commands trigger the build process defined in your `package.json`, which uses Rollup to bundle, transpile, and minify the code.

## Handling External Libraries (ical.js)

This plugin uses `ical.js` to parse calendar data. To include this library in the final `main.js` bundle, we use **Rollup** with specific plugins.

### Rollup Configuration

Your `rollup.config.js` file is the key to bundling external libraries. To properly include `ical.js`, you'll need the following plugins:
*   **@rollup/plugin-node-resolve**: Helps Rollup find third-party modules in your `node_modules` folder.
*   **@rollup/plugin-commonjs**: Converts CommonJS modules (like `ical.js`) into ES6, so they can be included in the bundle.

Here is a sample `rollup.config.js` that bundles `ical.js` correctly:

```
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/main.js',
  output: {
    file: 'main.js',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    json(),
  ],
};
```

By listing `'obsidian'` as an `external` dependency, you tell Rollup not to include it in the final bundle, as it is provided by the Obsidian application at runtime. Since `ical.js` is *not* listed as external, the `resolve` and `commonjs` plugins will process it and merge its code directly into your `main.js` file.



