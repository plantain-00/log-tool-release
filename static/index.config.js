/**
 * fields:
 *   enabled: boolean
 *   name: string
 *   description: string
 *   unit?: string;
 *   unitScale?: number, eg: { unit: "KB", unitScale: 1024 }, 10240 B -> 10 KB
 *   compute?: (sample: { [name: string]: number }) => number, see the example below
 */
var chartConfigs = [
  {
    enabled: true,
    name: 'logCount',
    description: '日志数'
  },
  {
    enabled: true,
    name: 'mysqlSize',
    description: 'mysql数据',
    unit: 'kB',
    unitScale: 1024
  },
  {
    enabled: true,
    name: 'cpu',
    description: 'CPU',
    unit: '%'
  },
  {
    enabled: true,
    name: 'memory',
    description: '内存',
    unit: '%'
  },
  {
    enabled: false,
    name: 'httpRequestCount',
    description: 'HTTP请求数'
  },
  {
    enabled: false,
    name: 'httpResponseTime',
    description: 'HTTP响应总耗时',
    unit: 'ms'
  },
  {
    enabled: false,
    name: 'httpAverageResponsesTime',
    description: 'HTTP响应平均耗时',
    unit: 'ms',
    compute: sample => sample.httpRequestCount === 0 ? 0 : Math.round(sample.httpResponseTime / sample.httpRequestCount)
  }
]

/* eslint-disable no-unused-vars */
var protobufConfig = {
  enabled: true
}
/* eslint-enable no-unused-vars */

chartConfigs = chartConfigs.filter(config => config.enabled)
for (const config of chartConfigs) {
  if (!('unit' in config)) {
    config.unit = undefined
  }
  if (!('unitScale' in config)) {
    config.unitScale = undefined
  }
  if (!('compute' in config)) {
    config.compute = undefined
  }
}
