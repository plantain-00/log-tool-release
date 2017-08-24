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
            ws.send(format.encodeResponse({
                kind: "flows" /* flows */,
                flows: {
                    serverTime: libs.getNow(),
                    flows,
                },
            }), { binary: config.protobuf.enabled });
        });
        ws.on("close", (code, name) => {
            subscription.unsubscribe();
        });
        if (config.elastic.enabled) {
            ws.on("message", (data, flag) => {
                try {
                    const protocol = format.decodeRequest(data);
                    if (protocol.kind === "search logs" /* searchLogs */) {
                        elastic.search(protocol.searchLogs, protocol.requestId).then(result => {
                            ws.send(format.encodeResponse({
                                kind: "search logs result" /* searchLogsResult */,
                                searchLogsResult: result,
                            }), { binary: config.protobuf.enabled });
                        }, (error) => {
                            ws.send(format.encodeResponse({
                                kind: "search logs result" /* searchLogsResult */,
                                searchLogsResult: {
                                    kind: "fail" /* fail */,
                                    requestId: protocol.requestId,
                                    error: error.message,
                                },
                            }), { binary: config.protobuf.enabled });
                        });
                    }
                    else if (protocol.kind === "resave failed logs" /* resaveFailedLogs */) {
                        elastic.resaveFailedLogs(protocol.requestId).then(result => {
                            ws.send(format.encodeResponse({
                                kind: "resave failed logs result" /* resaveFailedLogsResult */,
                                resaveFailedLogsResult: result,
                            }), { binary: config.protobuf.enabled });
                        }, error => {
                            ws.send(format.encodeResponse({
                                kind: "resave failed logs result" /* resaveFailedLogsResult */,
                                resaveFailedLogsResult: {
                                    kind: "fail" /* fail */,
                                    requestId: protocol.requestId,
                                    error: error.message,
                                },
                            }), { binary: config.protobuf.enabled });
                        });
                    }
                    else if (protocol.kind === "search samples" /* searchSamples */) {
                        const from = Math.round(libs.moment(protocol.searchSamples.from).valueOf() / 1000);
                        const to = Math.round(libs.moment(protocol.searchSamples.to).valueOf() / 1000);
                        sqlite.querySamples(from, to).then(rows => {
                            ws.send(format.encodeResponse({
                                kind: "search samples result" /* searchSamplesResult */,
                                searchSamplesResult: {
                                    kind: "success" /* success */,
                                    requestId: protocol.requestId,
                                    searchSampleResult: rows,
                                },
                            }), { binary: config.protobuf.enabled });
                        }, error => {
                            ws.send(format.encodeResponse({
                                kind: "search samples result" /* searchSamplesResult */,
                                searchSamplesResult: {
                                    kind: "fail" /* fail */,
                                    requestId: protocol.requestId,
                                    error: error.message,
                                },
                            }), { binary: config.protobuf.enabled });
                        });
                    }
                }
                catch (error) {
                    libs.publishError(error);
                }
            });
        }
        ws.send(format.encodeResponse({
            kind: "history samples" /* historySamples */,
            historySamples,
        }), { binary: config.protobuf.enabled });
    });
    server.on("request", app);
    server.listen(config.gui.port, config.gui.host);
}
exports.start = start;
