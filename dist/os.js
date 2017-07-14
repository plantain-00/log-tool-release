"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const config = require("./config");
function start() {
    if (!config.os.enabled) {
        return;
    }
    setInterval(() => {
        const cpus = libs.os.cpus();
        for (let i = 0; i < cpus.length; i++) {
            const cpu = cpus[i];
            const rate = Math.round(100 - cpu.times.idle / (cpu.times.idle + cpu.times.irq + cpu.times.nice + cpu.times.sys + cpu.times.user) * 100);
            libs.sampleSubject.next({
                hostname: libs.hostname,
                port: i,
                values: {
                    cpu: rate,
                },
            });
        }
        const memory = Math.round(100 - libs.os.freemem() / libs.os.totalmem() * 100);
        libs.sampleSubject.next({
            hostname: libs.hostname,
            values: {
                memory,
            },
        });
    }, 1000);
}
exports.start = start;
