"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
const sql = require("./variables");
let db;
function start() {
    db = new libs.sqlite3.Database(config.sqlite.filePath, error => {
        if (error) {
            libs.publishError(error);
        }
        else {
            createTablesIfNotExists();
        }
    });
    if (config.sqlite.samples) {
        libs.bufferedSampleSubject.subscribe((samples) => {
            const time = Math.round(Date.now() / 1000);
            db.run(sql.saveSampleSql, [time, JSON.stringify(samples)], error => {
                if (error) {
                    libs.publishError(error);
                }
            });
        });
    }
}
exports.start = start;
function createTablesIfNotExists() {
    // this table is used to store sample
    db.get(sql.queryTableSamplesExistsSql, [], (error, row) => {
        if (error) {
            libs.publishError(error);
        }
        else {
            const exists = row.count > 0;
            if (!exists) {
                db.run(sql.createTableSampleSql, creationError => {
                    if (creationError) {
                        libs.publishError(creationError);
                    }
                });
            }
        }
    });
    // this table is used to store logs that cannot be sent out by outflow
    db.get(sql.queryTableOutflowLogsExistsSql, [], (error, row) => {
        if (error) {
            libs.publishError(error);
        }
        else {
            const exists = row.count > 0;
            if (!exists) {
                db.run(sql.createTableOutflowLogsSql, creationError => {
                    if (creationError) {
                        libs.publishError(creationError);
                    }
                });
            }
        }
    });
    // this table is used to store logs that cannot be stored into elastic search
    db.get(sql.queryTableElasticLogsExistsSql, [], (error, row) => {
        if (error) {
            libs.publishError(error);
        }
        else {
            const exists = row.count > 0;
            if (!exists) {
                db.run(sql.createTableElasticLogsSql, creationError => {
                    if (creationError) {
                        libs.publishError(creationError);
                    }
                });
            }
        }
    });
}
function querySamples(from, to) {
    return new Promise((resolve, reject) => {
        db.all(sql.querySamplesSql, [from, to], (error, rows) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(rows.map(r => {
                    return {
                        time: libs.moment(r.time * 1000).format("YYYY-MM-DD HH:mm:ss"),
                        samples: JSON.parse(r.value),
                    };
                }));
            }
        });
    });
}
exports.querySamples = querySamples;
function saveOutflowLog(log) {
    db.run(sql.saveOutflowLogsSql, [log], error => {
        if (error) {
            libs.publishError(error);
        }
    });
}
exports.saveOutflowLog = saveOutflowLog;
function queryAllOutflowLogs(next) {
    db.all(sql.queryOutflowLogsSql, [], (error, rows) => {
        if (error) {
            libs.publishError(error);
        }
        else {
            next(rows);
        }
    });
}
exports.queryAllOutflowLogs = queryAllOutflowLogs;
function deleteSuccessfulOutflowLog(rowid) {
    db.run(sql.deleteOutflowLogsSql, [rowid], error => {
        if (error) {
            libs.publishError(error);
        }
    });
}
exports.deleteSuccessfulOutflowLog = deleteSuccessfulOutflowLog;
function saveElasticLog(log) {
    db.run(sql.saveElasticLogsSql, [JSON.stringify(log)], error => {
        if (error) {
            libs.publishError(error);
        }
    });
}
exports.saveElasticLog = saveElasticLog;
function queryAllElasticLogs() {
    return new Promise((resolve, reject) => {
        db.all(sql.queryElasticLogsSql, [], (error, rows) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(rows);
            }
        });
    });
}
exports.queryAllElasticLogs = queryAllElasticLogs;
function deleteSuccessfulElasticLog(rowid) {
    return new Promise((resolve, reject) => {
        db.run(sql.deleteElasticLogsSql, [rowid], error => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.deleteSuccessfulElasticLog = deleteSuccessfulElasticLog;
