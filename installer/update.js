const fs = require("fs-extra");
const path = require("path");
const asar = require("asar");
const child_process = require("child_process");

var signalPath = "C:/Users/Admin/AppData/Local/Programs/signal-desktop";
var asarPath = path.join(signalPath, "/resources/app.asar");
var appPath = path.join(signalPath, "/resources/app");
var bettersignalAppPath = path.join(appPath, "bettersignal");
var files = require("./files.json");

console.log("Kill Signal process ...");
child_process.exec("taskkill /f /im signal.exe");
console.log("Signal process killed");

if (!fs.existsSync(appPath)) {
	console.log("Extracting app ...");
	asar.extractAll(asarPath, appPath);
	console.log("Extracting done");
}

console.log("Copying files to app...");
//fs.copySync(appFilesPath, bettersignalAppPath);
fs.readdirSync('./').forEach(function(file) {
	if(files.app.includes(file)) {
		fs.copyFileSync(file, path.join(bettersignalAppPath, file));
		console.log('Copying '+file+" done")
	}
})
console.log("Copying done");

console.log("Packing app ...");
asar.createPackage(appPath, asarPath).then(() => {
	console.log("Packing done");
	console.log("Updating done !");
	child_process.exec('start /I "" "C:\\Users\\Admin\\AppData\\Local\\Programs\\signal-desktop\\Signal.exe" --enable-dev-tools');
	console.log("Signal started !!");
});
