"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("./config");
const libs = require("./libs");
let protocolType;
function start() {
    libs.protobuf.load("./static/protocol.proto").then(root => {
        protocolType = root.lookup("protocolPackage.Protocol");
    }, error => {
        libs.publishError(error);
    });
}
exports.start = start;
function encode(protocol) {
    if (config.protobuf.enabled) {
        return protocolType.encode(protocol).finish();
    }
    return JSON.stringify(protocol);
}
exports.encode = encode;
function decode(protocol) {
    if (typeof protocol === "string") {
        const result = JSON.parse(protocol);
        const isValidJson = libs.validate(result);
        if (!isValidJson) {
            throw new Error(libs.validate.errors[0].message);
        }
        return result;
    }
    return protocolType.decode(new Buffer(protocol)).toJSON();
}
exports.decode = decode;
