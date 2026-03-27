
Running this programing, Front-End using Visual Studio Code (Front-End) and Visual Studio 2022 (Backend) at the same time.
Visual 2022 is responsible for the API calls. VS Code is responsible for web page/app interface.

Overview:
- React (Front End Library)
- Typscript (Front End Language)
- C# (Backend Language)

**Instructions for Install:**

1) **Install Node Version Manager**
Go install the .exe for the program from "https://github.com/coreybutler/nvm-windows/releases"

2) **Open a command terminal**
Install a specific Node version
nvm install 20
Switch to a specific installed version
nvm use 20
Check current Node version
node -v 
//We want Javascript [v20.19.4]

3) **Git Clone Repository in a folder**
git clone https://github.com/MoboBytes/Panorama-Rules-Deployer.git

4) **Installing Node Dependecies for Front-End**
cd Panorama-Rules-Deployer //Going into project folder
cd app-web //Going into Front-End folder
npm install //installing dependencies

5) **Running the Front-End**
npm run dev //Assuming you're within app-web
Results:
  VITE v7.3.1  ready in 2725 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

6) **Installing the Back-End**
Using Visual Studio 2022 (You should be able to use any version I beleive)
  - The "Workloads/Packs" on the installer required will be 
1) ASP.NET and Web Development
2) Node.js Development
3) Azure Development
4) .NET Desktop Development

Note: Not all these packs are actually required, but I have these installed. Better safe than sorry. Bare minimum .NET packages (since its C#)

7) **Opening the Back-End**
Time to make the API calls work!
1) After starting Visual Studio 2022, click "Open Project/Solution"
2) Navigate to app-api within Panorama-Rules-Deployer project folder
3) Click on "app-solution" folder -> "app-solution.sln" sln being the project file.

8) **Connecting Back-end to Front End**
1) Go to "Program.cs"
2) Replace "http://localhost:5173" with your port# if different
     -  If you can't find it, Control + F "http://localhost:5173" to appear
3) Click Control + S to save changes on Program.cs
4) Click "Run https" button, filed green array at the top. Should boot Swagger (API Tester) to verify the back-end is working

9) **Accessing the App**
While both Swagger Page (Back-End) and Web-App (Front-End) are open
Login with your credentials
1) Host (Being an IP address or host website used to access Paloalto Networks Dashboard)
2) User Name
3) Password




