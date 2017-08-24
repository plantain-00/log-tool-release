"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
exports.fs = fs;
const path = require("path");
exports.path = path;
const rxjs_1 = require("rxjs");
exports.Subject = rxjs_1.Subject;
exports.Observable = rxjs_1.Observable;
const WebSocket = require("ws");
exports.WebSocket = WebSocket;
const os = require("os");
exports.os = os;
const express = require("express");
exports.express = express;
const http = require("http");
exports.http = http;
const node_fetch_1 = require("node-fetch");
exports.fetch = node_fetch_1.default;
const types = require("./types");
const nodejs_1 = require("reconnection/nodejs/nodejs");
exports.Reconnector = nodejs_1.default;
const moment = require("moment");
exports.moment = moment;
const uws_1 = require("uws");
exports.WebSocketServer = uws_1.Server;
const protobuf = require("protobufjs");
exports.protobuf = protobuf;
const sqlite3 = require("sqlite3");
exports.sqlite3 = sqlite3;
const bodyParser = require("body-parser");
exports.bodyParser = bodyParser;
const Ajv = require("ajv");
const _ = require("lodash");
exports._ = _;
const ajv = new Ajv();
const requestProtocolJsonSchema = require("../static/request-protocol.json");
exports.validateRequestProtocol = ajv.compile(requestProtocolJsonSchema);
const flowProtocolJsonSchema = require("../static/flow-protocol.json");
exports.validateFlowProtocol = ajv.compile(flowProtocolJsonSchema);
function printInConsole(message) {
    // tslint:disable-next-line:no-console
    console.log(message);
}
exports.printInConsole = printInConsole;
exports.hostname = os.hostname();
exports.logSubject = new rxjs_1.Subject();
exports.sampleSubject = new rxjs_1.Subject();
exports.bufferedLogSubject = exports.logSubject.bufferTime(1000);
exports.bufferedSampleSubject = exports.sampleSubject
    .bufferTime(1000)
    .filter((s) => s.length > 0)
    .map((samples) => {
    const result = [];
    for (const sample of samples) {
        const resultSample = result.find(r => r.hostname === sample.hostname && r.port === sample.port);
        if (resultSample) {
            Object.assign(resultSample.values, sample.values);
        }
        else {
            result.push(sample);
        }
    }
    return result;
});
exports.bufferedFlowObservable = rxjs_1.Observable.merge(exports.bufferedLogSubject
    .filter((logs) => logs.length > 0)
    .map((logs) => logs.map(log => {
    return {
        kind: "log" /* log */,
        log,
    };
})), exports.bufferedSampleSubject
    .map((samples) => (samples.map((sample) => {
    return {
        kind: "sample" /* sample */,
        sample,
    };
}))))
    .bufferTime(1000)
    .filter(s => s.length > 0)
    .map(logsOrSamplesArray => {
    let result = [];
    for (const logsOrSamples of logsOrSamplesArray) {
        result = result.concat(logsOrSamples);
    }
    return result;
});
function publishError(error) {
    exports.logSubject.next({
        time: getNow(),
        hostname: exports.hostname,
        filepath: "",
        content: error.stack || error.message,
    });
}
exports.publishError = publishError;
function publishErrorMessage(message) {
    exports.logSubject.next({
        time: getNow(),
        hostname: exports.hostname,
        filepath: "",
        content: message,
    });
}
exports.publishErrorMessage = publishErrorMessage;
function getNow() {
    return moment().format("YYYY-MM-DD HH:mm:ss");
}
exports.getNow = getNow;
function statAsync(pathname) {
    return new Promise((resolve, reject) => {
        fs.access(pathname, err => {
            if (err) {
                resolve(undefined);
            }
            else {
                fs.stat(pathname, (error, stats) => {
                    if (error) {
                        publishError(error);
                    }
                    resolve(stats);
                });
            }
        });
    });
}
exports.statAsync = statAsync;
function readFileAsync(filepath) {
    return new Promise((resolve, reject) => {
        fs.access(filepath, err => {
            if (err) {
                resolve(undefined);
            }
            else {
                fs.readFile(filepath, "utf8", (error, data) => {
                    if (error) {
                        publishError(error);
                    }
                    resolve(data);
                });
            }
        });
    });
}
exports.readFileAsync = readFileAsync;
function readDirAsync(filepath) {
    return new Promise((resolve, reject) => {
        fs.access(filepath, err => {
            if (err) {
                resolve(undefined);
            }
            else {
                fs.readdir(filepath, (error, files) => {
                    if (error) {
                        publishError(error);
                    }
                    resolve(files);
                });
            }
        });
    });
}
exports.readDirAsync = readDirAsync;
class Sender {
    constructor(ws) {
        this.ws = ws;
        this.timeout = 3000;
    }
    send(message, options, next) {
        this.ws.send(message, options, error1 => {
            if (error1) {
                publishError(error1);
                setTimeout(() => {
                    this.ws.send(message, options, error2 => {
                        if (error2) {
                            publishError(error2);
                            setTimeout(() => {
                                this.ws.send(message, options, error3 => {
                                    if (error3) {
                                        publishError(error3);
                                        next(false);
                                    }
                                    else {
                                        next(true);
                                    }
                                });
                            }, this.timeout);
                        }
                        else {
                            next(true);
                        }
                    });
                }, this.timeout);
            }
            else {
                next(true);
            }
        });
    }
}
exports.Sender = Sender;
