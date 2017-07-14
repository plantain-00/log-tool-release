"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configurationFilePath = process.argv[2] || "../log-tool.config.js";
// tslint:disable-next-line:no-var-requires
_a = require(configurationFilePath), exports.elastic = _a.elastic, exports.gui = _a.gui, exports.inflow = _a.inflow, exports.outflow = _a.outflow, exports.watcher = _a.watcher, exports.protobuf = _a.protobuf, exports.folderSizeWatcher = _a.folderSizeWatcher, exports.countLogs = _a.countLogs, exports.os = _a.os, exports.sqlite = _a.sqlite;
var _a;
