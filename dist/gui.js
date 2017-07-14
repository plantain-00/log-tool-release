"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const types = require("./types");
const config = require("./config");
const elastic = require("./elastic");
const format = require("./format");
const sqlite = require("./sqlite");
const historySamples = [];
const maxHistorySampleCount = 300;
function start() {
    if (!config.gui.enabled) {
        return;
    }
    const server = libs.http.createServer();
    const wss = new libs.WebSocketServer({ server });
    const app = libs.express();
    app.use(libs.express.static(libs.path.resolve(__dirname, "../static")));
    libs.bufferedSampleSubject.subscribe((samples) => {
        historySamples.push({
            time: libs.getNow(),
            samples,
        });
        if (historySamples.length > maxHistorySampleCount) {
            historySamples.splice(0, historySamples.length - maxHistorySampleCount);
        }
    });
    wss.on("connection", ws => {
        const subscription = libs.bufferedFlowObservable.subscribe(flows => {
            const protocol = {
                kind: "flows" /* flows */,
                serverTime: libs.getNow(),
                flows,
            };
            ws.send(format.encode(protocol), { binary: config.protobuf.enabled });
        });
        ws.on("close", (code, name) => {
            subscription.unsubscribe();
        });
        if (config.elastic.enabled) {
            ws.on("message", (data, flag) => {
                try {
                    const protocol = format.decode(data);
                    if (protocol.kind === "search" /* search */) {
                        if (protocol.search) {
                            elastic.search(protocol.search.content, protocol.search.time, protocol.search.hostname, protocol.search.from, protocol.search.size).then(result => {
                                const searchResult = {
                                    kind: "search result" /* searchResult */,
                                    requestId: protocol.requestId,
                                    searchResult: result,
                                };
                                ws.send(format.encode(searchResult), { binary: config.protobuf.enabled });
                            }, (error) => {
                                const searchResult = {
                                    kind: "search result" /* searchResult */,
                                    requestId: protocol.requestId,
                                    error: error.message,
                                };
                                ws.send(format.encode(searchResult), { binary: config.protobuf.enabled });
                            });
                        }
                        else {
                            const searchResult = {
                                kind: "search result" /* searchResult */,
                                requestId: protocol.requestId,
                                error: "no parameter",
                            };
                            ws.send(format.encode(searchResult), { binary: config.protobuf.enabled });
                        }
                    }
                    else if (protocol.kind === "resave failed logs" /* resaveFailedLogs */) {
                        elastic.resaveFailedLogs().then(result => {
                            const resaveFailedLogsResult = {
                                kind: "resave failed logs result" /* resaveFailedLogsResult */,
                                requestId: protocol.requestId,
                                resaveFailedLogsResult: result,
                            };
                            ws.send(format.encode(resaveFailedLogsResult), { binary: config.protobuf.enabled });
                        }, error => {
                            const resaveFailedLogsResult = {
                                kind: "resave failed logs result" /* resaveFailedLogsResult */,
                                requestId: protocol.requestId,
                                error: error.message,
                            };
                            ws.send(format.encode(resaveFailedLogsResult), { binary: config.protobuf.enabled });
                        });
                    }
                    else if (protocol.kind === "search samples" /* searchSamples */) {
                        if (protocol.searchSamples) {
                            const from = Math.round(libs.moment(protocol.searchSamples.from).valueOf() / 1000);
                            const to = Math.round(libs.moment(protocol.searchSamples.to).valueOf() / 1000);
                            sqlite.querySamples(from, to).then(rows => {
                                const searchSamplesResult = {
                                    kind: "search samples result" /* searchSamplesResult */,
                                    requestId: protocol.requestId,
                                    searchSampleResult: rows,
                                };
                                ws.send(format.encode(searchSamplesResult), { binary: config.protobuf.enabled });
                            }, error => {
                                const searchSamplesResult = {
                                    kind: "search samples result" /* searchSamplesResult */,
                                    requestId: protocol.requestId,
                                    error: error.message,
                                };
                                ws.send(format.encode(searchSamplesResult), { binary: config.protobuf.enabled });
                            });
                        }
                        else {
                            const searchSamplesResult = {
                                kind: "search samples result" /* searchSamplesResult */,
                                requestId: protocol.requestId,
                                error: "no parameter",
                            };
                            ws.send(format.encode(searchSamplesResult), { binary: config.protobuf.enabled });
                        }
                    }
                    else {
                        libs.publishErrorMessage(`protocol kind ${protocol.kind} is not recognized.`);
                    }
                }
                catch (error) {
                    libs.publishError(error);
                }
            });
        }
        const protocol = {
            kind: "history samples" /* historySamples */,
            historySamples,
        };
        ws.send(format.encode(protocol), { binary: config.protobuf.enabled });
    });
    server.on("request", app);
    server.listen(config.gui.port, config.gui.host);
}
exports.start = start;
