"use strict";
const libs = require("./libs");
const defaultConfig = {
    inflow: {
        enabled: true,
        port: 8001,
        host: "localhost",
        httpFallbackPath: "/logs",
    },
    outflow: {
        enabled: false,
        url: "ws://localhost:8001",
    },
    watcher: {
        enabled: true,
        paths: [],
        filePositionsDataPath: "./log-tool.watcher.data",
        parseLine: (line, moment, filepath) => {
            return {
                skip: false,
                time: moment().format("YYYY-MM-DD HH:mm:ss"),
                content: line,
            };
        },
    },
    gui: {
        enabled: true,
        port: 8000,
        host: "localhost",
    },
    elastic: {
        enabled: true,
        // `tool` is the index name, `logs` is the type name, they are all needed.
        url: "http://localhost:9200/tool/logs",
    },
    protobuf: {
        enabled: true,
    },
    folderSizeWatcher: {
        enabled: true,
        // tslint:disable-next-line:no-object-literal-type-assertion
        folders: {},
    },
    countLogs: {
        enabled: true,
    },
    os: {
        enabled: true,
    },
    sqlite: {
        filePath: "./data.db",
        samples: true,
    },
};
try {
    const configurationFilePath = process.argv[2] || "../log-tool.config.js";
    // tslint:disable-next-line:no-var-requires
    require(configurationFilePath)(defaultConfig);
}
catch (error) {
    libs.print(error);
}
module.exports = defaultConfig;
