"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const watcher = require("./watcher");
const gui = require("./gui");
const inflow = require("./inflow");
const outflow = require("./outflow");
const elastic = require("./elastic");
const format = require("./format");
const sqlite = require("./sqlite");
const folderSizeWatcher = require("./folder-size-watcher");
const countLogs = require("./count-logs");
const os = require("./os");
watcher.start();
gui.start();
inflow.start();
outflow.start();
elastic.start();
format.start();
sqlite.start();
folderSizeWatcher.start();
countLogs.start();
os.start();
libs.printInConsole("log tool started.");
libs.logSubject.subscribe(log => {
    libs.printInConsole(log);
});
