
# Overview
- React (Front End Library)
- Typscript (Front End Language)
- C# (Backend Language)

# Instructions for Install

**Install Node Version Manager**
- Go install the .exe for the program from "https://github.com/coreybutler/nvm-windows/releases"

**Open a command terminal**
- nvm install 20 //Install a specific Node version
- nvm use 20 //Switch to a specific installed version 
- node -v //Check current Node version. We want Javascript [v20.19.4]

**Installing Git**
- Go install .exe for git at their website (This is for version control) "https://git-scm.com/"

**Git Clone Repository in a folder**
- git clone https://github.com/MoboBytes/Panorama-Rules-Deployer.git

**Installing Node Dependecies for Front-End**
- cd Panorama-Rules-Deployer //Going into project folder
- cd app-web //Going into Front-End folder
- npm install //installing dependencies

**Running the Front-End**
- npm run dev //Assuming you're within app-web
- Results:
  VITE v7.3.1  ready in 2725 ms

  - Local:   http://localhost:5173/
  - Network: use --host to expose
  - press h + enter to show help

**Installing the Back-End**
- Using Visual Studio 2026 (You should be able to use any version I believe)
  - The "Workloads/Packs" on the installer required will be 
1) ASP.NET and Web Development
2) Node.js Development
3) Azure Development
4) .NET Desktop Development

- Note: Not all these packs are actually required, but I have these installed. Better safe than sorry. Bare minimum .NET packages (since its C#)

**Opening the Back-End**
- Time to make the API calls work!
- After starting Visual Studio 2026, click "Open Project/Solution"
- Navigate to app-api within Panorama-Rules-Deployer project folder
- Click on "app-solution" folder -> "app-solution.sln" sln being the project file.

**Connecting Back-end to Front End**
-  Go to "Program.cs"
- Replace "http://localhost:5173" with your port# if different
  Note: If you can't find it, Control + F "http://localhost:5173" to appear
- Click Control + S to save changes on Program.cs
- Click "Run https" button, filed green array at the top. Should boot Swagger (API Tester) to verify the back-end is working

**Accessing the App**
- While both Swagger Page (Back-End) and Web-App (Front-End) are open, then login with your credentials
1) Host (Being an IP address or host website used to access Paloalto Networks Dashboard)
2) User Name
3) Password




