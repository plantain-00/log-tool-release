function loadConfig (config) { // eslint-disable-line no-unused-vars
  config.chart.push({
    enabled: true,
    name: 'mysqlSize',
    description: 'mysql数据',
    unit: 'kB',
    unitScale: 1024
  })
  config.chart.push({
    enabled: false,
    name: 'httpRequestCount',
    description: 'HTTP请求数'
  })
  config.chart.push({
    enabled: false,
    name: 'httpResponseTime',
    description: 'HTTP响应总耗时',
    unit: 'ms'
  })
  config.chart.push({
    enabled: false,
    name: 'httpAverageResponsesTime',
    description: 'HTTP响应平均耗时',
    unit: 'ms',
    compute: sample => sample.httpRequestCount === 0 ? 0 : Math.round(sample.httpResponseTime / sample.httpRequestCount)
  })
}
