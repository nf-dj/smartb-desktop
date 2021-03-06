const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron')
const fs = require('fs')


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  var page="main_desktop" ;
  var params={};
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,
        additionalArguments: [page,JSON.stringify(params)],
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('print_page', (event, page, params, print_opts) => {
    console.log("print_page",page,params,print_opts);
    if (!print_opts) print_opts={};
    const print_win = new BrowserWindow({
        title: "Print",
        width: 500,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            additionalArguments: [page,JSON.stringify(params||{})],
        },
    });
    print_win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    setTimeout(()=>{
        console.log("print window",print_win);
        var printers=print_win.webContents.getPrinters();
        console.log("printers",printers);
        if (print_opts.pdf_path) {
            print_win.webContents.printToPDF(print_opts).then(data=>{
                fs.writeFile(pdf_path,data);
            });
        } else {
            print_win.webContents.print(print_opts);
        }
        console.log("printed");
        setTimeout(()=>{
            print_win.close();
        },2000);
    },2000);
})
