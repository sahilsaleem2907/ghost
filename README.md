<p align="center">
  <div align="center" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <img src="src/logos/ghost.svg" alt="Ghost Logo" width="300" height="300" style="vertical-align: middle;" />
    <h1 align="center">Ghost - VS Code Extension</h1>
  </div>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code">
  <img src="https://img.shields.io/badge/Ollama-FF6F61?style=for-the-badge&logo=openai&logoColor=white" alt="Ollama">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
</p>

<p align="center">
  Ghost is a VS Code extension that helps you optimize your project folder structure using TypeScript and the Ollama model. Get AI-powered suggestions for best practices in organizing your files!
</p>

---

## Features

- **📂 Folder Structure Analysis**: Scans your folder structure and identifies inefficiencies.
- **🤖 AI-Powered Suggestions**: Provides tailored recommendations using the Ollama model.
- **⚙️ Customizable Recommendations**: Adjust suggestions to fit your project's needs.
- **⏱️ Real-Time Feedback**: Get instant feedback as you make changes.
- **🛠️ TypeScript Support**: Built with TypeScript for reliability and extensibility.

---

## Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view by clicking on the Extensions icon in the Activity Bar or pressing `Ctrl+Shift+X`.
3. Search for **"Ghost"**.
4. Click **Install** to add the extension to your VS Code.

---

## Usage

1. Open your project in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and type **"Ghost: Analyze Folder Structure"**.
3. Select the root folder of your project.
4. Ghost will analyze the folder structure and display recommendations in a new panel.
5. Review the suggestions and apply them to your project as needed.

---

## Configuration

Ghost can be customized via the VS Code settings. To configure the extension:

1. Open **Settings** (`Ctrl+,` or `Cmd+,` on macOS).
2. Search for **"Ghost"**.
3. Adjust the following settings:
   - **Ghost.ModelPath**: Path to the Ollama model (if using a custom model).
   - **Ghost.IgnorePatterns**: Specify patterns to exclude certain files or folders from analysis.
   - **Ghost.RecommendationLevel**: Set the level of detail for recommendations (e.g., basic, advanced).

---

## Requirements

- **Visual Studio Code**: Version 1.60.0 or higher.
- **Node.js**: Version 16.x or higher.
- **Ollama Model**: Ensure the Ollama model is installed and accessible.

---

## Development

If you'd like to contribute to Ghost or customize it for your needs, follow these steps:

1. Clone the repository:
   ```bash
   https://github.com/sahilsaleem2907/ghost.git
