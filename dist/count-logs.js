"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
function start() {
    if (!config.countLogs.enabled) {
        return;
    }
    libs.bufferedLogSubject.subscribe((logs) => {
        libs.sampleSubject.next({
            hostname: libs.hostname,
            values: {
                logCount: logs.length,
            },
        });
    });
}
exports.start = start;
