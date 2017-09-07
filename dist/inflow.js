"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
const format = require("./format");
const types = require("./types");
function start() {
    if (!config.inflow.enabled) {
        return;
    }
    const server = libs.http.createServer();
    const wss = new libs.WebSocketServer({ server });
    const app = libs.express();
    app.use(libs.bodyParser.json());
    app.post(config.inflow.httpFallbackPath, (request, response) => {
        const protocol = request.body;
        const isValidJson = libs.validateFlowProtocol(protocol);
        if (isValidJson) {
            handleMessage(protocol);
            response.end("accepted");
        }
        else {
            response.end(libs.validateFlowProtocol.errors[0].message);
        }
    });
    wss.on("connection", ws => {
        ws.on("message", (inflowString) => {
            try {
                const protocol = format.decodeFlow(inflowString);
                handleMessage(protocol);
            }
            catch (error) {
                libs.publishError(error);
            }
        });
    });
    server.on("request", app);
    server.listen(config.inflow.port, config.inflow.host);
}
exports.start = start;
function handleMessage(protocol) {
    for (const flow of protocol.flows) {
        if (flow.kind === "log" /* log */) {
            libs.logSubject.next(flow.log);
        }
        else if (flow.kind === "sample" /* sample */) {
            libs.sampleSubject.next(flow.sample);
        }
    }
}
