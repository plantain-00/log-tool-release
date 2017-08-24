"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
const format = require("./format");
const sqlite = require("./sqlite");
function start() {
    if (!config.outflow.enabled) {
        return;
    }
    let ws;
    let sender;
    const subscription = libs.bufferedFlowObservable.subscribe(flows => {
        const message = format.encodeFlow({ flows });
        if (ws && ws.readyState === ws.OPEN && sender) {
            sender.send(message, { binary: config.protobuf.enabled, mask: true }, isSuccess => {
                if (!isSuccess) {
                    sqlite.saveOutflowLog(message);
                }
            });
        }
        else {
            sqlite.saveOutflowLog(message);
        }
    });
    const reconnector = new libs.Reconnector(() => {
        ws = new libs.WebSocket(config.outflow.url);
        sender = new libs.Sender(ws);
        ws.on("close", (code, message) => {
            libs.publishErrorMessage(`outflow connection closed with code: ${code} and message: ${message}`);
            subscription.unsubscribe();
            reconnector.reconnect();
        });
        ws.on("open", () => {
            reconnector.reset();
            sqlite.queryAllOutflowLogs(rows => {
                for (const row of rows) {
                    sender.send(row.value, { binary: config.protobuf.enabled, mask: true }, isSuccess => {
                        if (isSuccess) {
                            sqlite.deleteSuccessfulOutflowLog(row.ROWID);
                        }
                    });
                }
            });
        });
    });
}
exports.start = start;
