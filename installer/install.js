// const fs = require("fs-extra");
// const path = require("path");
// const asar = require("asar");
// const child_process = require("child_process");

// var signalPath = "C:/Users/Admin/AppData/Local/Programs/signal-desktop";
// var asarPath = path.join(signalPath, "/resources/app.asar")
// var appPath = path.join(signalPath, "/resources/app");
// var backgroundPath = path.join(appPath, "background.html");
// var preloadPath = path.join(appPath, "preload.js");
// var bettersignalPath = path.join(process.env.APPDATA, "bettersignal");
// var bettersignalAppPath = path.join(appPath, "bettersignal");
// var appFilesPath = "./appFiles";
// var appdataFilesPath = "./appdataFiles";
// var newBackgroundData = `<head>\n<link type="text/css" rel="stylesheet" href="bettersignal/manifest.css">\n`;
// var newPreloadData = "require('./bettersignal/index.js');\n";

// console.log("Kill Signal process ...");
// child_process.exec("taskkill /f /im signal.exe");
// console.log("Signal process killed");

// console.log("Copying files to appdata ...")
// fs.copySync(appdataFilesPath, bettersignalPath)
// console.log("Copying done")

// console.log("Extracting app ...");
// asar.extractAll(asarPath, appPath);
// console.log("Extracting done");

// console.log("Reading file background.html ...");
// let backgroundData = fs.readFileSync(backgroundPath, { encoding: "utf-8" });
// console.log("Reading done");

// console.log("Writting file background.html ...");
// fs.writeFileSync(backgroundPath, backgroundData.replace("<head>", newBackgroundData), "utf8");
// console.log("Writting done");

// console.log("Reading file preload.js ...");
// let preloadData = fs.readFileSync(preloadPath, { encoding: "utf-8" });
// console.log("Reading done");

// console.log("Writting file preload.js ...");
// fs.writeFileSync(preloadPath, newPreloadData + preloadData, "utf8");
// console.log("Writting done");

// console.log("Copying files to app...")
// fs.copySync(appFilesPath, bettersignalAppPath)
// console.log("Copying done")

// console.log("Packing app ...");
// asar.createPackage(appPath, asarPath).then(() => {
// 	console.log("Packing done");
// 	console.log("Deleting app folder ...");
// 	fs.rmdirSync(appPath, {
// 		recursive: true,
// 	});
// 	console.log("Deleting done");
// 	console.log("Instalation done !");
// });