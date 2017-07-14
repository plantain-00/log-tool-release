"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
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
async function search(content, time, hostname, from, size) {
    const response = await libs.fetch(`${config.elastic.url}/_search`, {
        method: "POST",
        body: JSON.stringify({
            from,
            size,
            sort: [{ time: "desc" }],
            query: {
                query_string: {
                    query: `content:${content} AND time:${time} AND hostname:${hostname}`,
                },
            },
        }),
    });
    const json = await response.json();
    return {
        total: json.hits.total,
        logs: json.hits.hits.map(s => s._source),
    };
}
exports.search = search;
async function resaveFailedLogs() {
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
        savedCount: count,
        totalCount: rows.length,
    };
}
exports.resaveFailedLogs = resaveFailedLogs;
