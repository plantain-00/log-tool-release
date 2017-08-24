"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
const types = require("./types");
const sqlite = require("./sqlite");
function start() {
    if (!config.elastic.enabled) {
        return;
    }
    libs.logSubject.subscribe(log => {
        libs.fetch(config.elastic.url, {
            method: "POST",
            body: JSON.stringify(log),
            headers: { "Content-Type": "application/json" },
        }).catch(error => {
            libs.publishError(error);
            sqlite.saveElasticLog(log);
        });
    });
}
exports.start = start;
async function search(parameters, requestId) {
    const response = await libs.fetch(`${config.elastic.url}/_search`, {
        method: "POST",
        body: JSON.stringify({
            from: parameters.from,
            size: parameters.size,
            sort: [{ time: "desc" }],
            query: {
                query_string: {
                    query: `content:${parameters} AND time:${parameters.time} AND hostname:${parameters.hostname}`,
                },
            },
        }),
    });
    const json = await response.json();
    return {
        kind: "success" /* success */,
        total: json.hits.total,
        logs: json.hits.hits.map(s => s._source),
        requestId,
    };
}
exports.search = search;
async function resaveFailedLogs(requestId) {
    const rows = await sqlite.queryAllElasticLogs();
    let count = 0;
    for (const row of rows) {
        const response = await libs.fetch(config.elastic.url, {
            method: "POST",
            body: row.value,
            headers: { "Content-Type": "application/json" },
        });
        if (response.status < 300) {
            await sqlite.deleteSuccessfulElasticLog(row.ROWID);
            count++;
        }
    }
    return {
        kind: "success" /* success */,
        requestId,
        savedCount: count,
        totalCount: rows.length,
    };
}
exports.resaveFailedLogs = resaveFailedLogs;
