"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("./config");
const libs = require("./libs");
let requestProtocolType;
let responsetProtocolType;
let flowProtocolType;
function start() {
    libs.protobuf.load("./static/protocol.proto").then(root => {
        requestProtocolType = root.lookup("RequestProtocol");
        responsetProtocolType = root.lookup("ResponseProtocol");
        flowProtocolType = root.lookup("FlowProtocol");
    }, error => {
        libs.publishError(error);
    });
}
exports.start = start;
function encodeResponse(protocol) {
    if (config.protobuf.enabled) {
        return responsetProtocolType.encode(protocol).finish();
    }
    return JSON.stringify(protocol);
}
exports.encodeResponse = encodeResponse;
function encodeFlow(protocol) {
    if (config.protobuf.enabled) {
        return flowProtocolType.encode(protocol).finish();
    }
    return JSON.stringify(protocol);
}
exports.encodeFlow = encodeFlow;
function decodeRequest(protocol) {
    if (typeof protocol === "string") {
        const result = JSON.parse(protocol);
        const isValidJson = libs.validateRequestProtocol(result);
        if (!isValidJson) {
            throw new Error(libs.validateRequestProtocol.errors[0].message);
        }
        return result;
    }
    return requestProtocolType.toObject(requestProtocolType.decode(new Buffer(protocol)));
}
exports.decodeRequest = decodeRequest;
function decodeFlow(protocol) {
    if (typeof protocol === "string") {
        const result = JSON.parse(protocol);
        const isValidJson = libs.validateRequestProtocol(result);
        if (!isValidJson) {
            throw new Error(libs.validateRequestProtocol.errors[0].message);
        }
        return result;
    }
    return flowProtocolType.toObject(flowProtocolType.decode(new Buffer(protocol)));
}
exports.decodeFlow = decodeFlow;
