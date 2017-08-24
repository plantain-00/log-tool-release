"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
function start() {
    if (!config.folderSizeWatcher.enabled) {
        return;
    }
    setInterval(async () => {
        const values = {};
        for (const name in config.folderSizeWatcher.folders) {
            if (config.folderSizeWatcher.folders.hasOwnProperty(name)) {
                const folder = config.folderSizeWatcher.folders[name];
                values[name] = await getSize(folder);
            }
        }
        libs.sampleSubject.next({
            hostname: libs.hostname,
            values,
        });
    }, 1000);
}
exports.start = start;
async function getSize(path) {
    const stats = await libs.statAsync(path);
    if (stats) {
        if (stats.isDirectory()) {
            let size = 0;
            const files = await libs.readDirAsync(path);
            if (files && files.length > 0) {
                for (const file of files) {
                    const filepath = libs.path.resolve(path, file);
                    size += await getSize(filepath);
                }
            }
            return size;
        }
        else if (stats.isFile()) {
            return stats.size;
        }
    }
    return 0;
}
