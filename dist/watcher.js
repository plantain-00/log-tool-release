"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
let positions = {};
async function start() {
    if (!config.watcher.enabled) {
        return;
    }
    // restore positions from file
    const filePositionData = await libs.readFileAsync(config.watcher.filePositionsDataPath);
    if (filePositionData) {
        try {
            positions = JSON.parse(filePositionData);
        }
        catch (error) {
            libs.publishError(error);
        }
    }
    // watch all paths
    for (const pathname of config.watcher.paths) {
        const stats = await libs.statAsync(pathname);
        if (stats) {
            await initialize(pathname, stats);
            if (stats.isDirectory()) {
                libs.fs.watch(pathname, { recursive: true }, (event, filename) => {
                    fileOrDirectoryChanged(libs.path.resolve(pathname, filename));
                });
            }
            else if (stats.isFile()) {
                libs.fs.watch(pathname, (event, filename) => {
                    fileOrDirectoryChanged(pathname);
                });
            }
        }
    }
    // save postions every 1 seconds
    setInterval(() => {
        libs.fs.writeFile(config.watcher.filePositionsDataPath, JSON.stringify(positions, null, "  "), writeFileError => {
            if (writeFileError) {
                libs.publishError(writeFileError);
            }
        });
    }, 1000);
}
exports.start = start;
async function initialize(pathname, stats) {
    // for every file, if no position in positions, read all file
    if (stats.isDirectory()) {
        const files = await libs.readDirAsync(pathname);
        if (files) {
            for (const file of files) {
                const filepath = libs.path.resolve(pathname, file);
                const fileStats = await libs.statAsync(filepath);
                if (fileStats) {
                    await initialize(filepath, fileStats);
                }
            }
        }
    }
    else if (stats.isFile()) {
        readNewlyAddedLogsThenPublish(pathname, stats.size);
    }
}
function fileOrDirectoryChanged(pathname) {
    libs.statAsync(pathname).then(stats => {
        if (stats && stats.isFile()) {
            // the file is updated or a new file
            readNewlyAddedLogsThenPublish(pathname, stats.size);
        }
    }, statError => {
        // the file or directory is deleted
        libs.publishError(statError);
        delete positions[pathname];
    });
}
function readNewlyAddedLogsThenPublish(filepath, end) {
    const position = positions[filepath];
    const start = position === undefined ? 0 : position;
    if (end > start) {
        libs.fs.createReadStream(filepath, {
            start,
            end,
            encoding: "utf8",
        }).on("data", (fileContentChanged) => {
            const lines = fileContentChanged.match(/[^\r\n]+/g);
            if (lines) {
                for (const line of lines) {
                    try {
                        const { skip, time, content } = config.watcher.parseLine(line, libs.moment, filepath);
                        if (!skip) {
                            libs.logSubject.next({
                                time,
                                content,
                                filepath,
                                hostname: libs.hostname,
                            });
                        }
                    }
                    catch (error) {
                        libs.publishError(error);
                        libs.logSubject.next({
                            time: libs.getNow(),
                            content: line,
                            filepath,
                            hostname: libs.hostname,
                        });
                    }
                }
            }
        });
    }
    positions[filepath] = end;
}
