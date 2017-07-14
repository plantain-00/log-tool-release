module.exports = {
  /**
   * transport logs from another log-tool server.
   */
  inflow: {
    enabled: true,
    port: 8001,
    host: 'localhost',
    /**
     * with this path, you can post logs to http://localhost:8001/logs
     */
    httpFallbackPath: '/logs'
  },
  /**
   * transport logs to another log-tool server.
   */
  outflow: {
    enabled: false,
    url: 'ws://localhost:8001'
  },
  /**
   * watch log directories or files and read logs.
   */
  watcher: {
    enabled: true,
    /**
     * paths of directories or files to be watched.
     */
    paths: [
      './logs/'
    ],
    /**
     * path of the file that stores the status of the watched files.
     */
    filePositionsDataPath: './log-tool.watcher.data',
    /**
     * parse a line of log string to get time and other valid information.
     * line: string, the log line,
     * moment: Object, the object from moment.js
     * filepath: string, the path of the log file
     */
    parseLine: (line, moment, filepath) => {
      return {
        skip: false, // if true, just skip this line of log
        time: moment().format('YYYY-MM-DD HH:mm:ss'),
        content: line // the string that not include time, better be a json string
      }
    }
  },
  /**
   * push new logs to a web page, for monitor purpose.
   */
  gui: {
    enabled: true,
    port: 9000,
    host: 'localhost'
  },
  /**
   * transport logs to elastic search server for searching old logs purpose.
   */
  elastic: {
    enabled: false,
        // `tool` is the index name, `logs` is the type name, they are all needed.
    url: 'http://localhost:9200/tool/logs'
  },
  /**
   * transport data by protobuf binary, rather than json string.
   */
  protobuf: {
    enabled: true
  },
  /**
   * watch the size of folder.
   */
  folderSizeWatcher: {
    enabled: true,
    folders: {
      mysqlSize: './static/'
    }
  },
  /**
   * count the logs.
   */
  countLogs: {
    enabled: true
  },
  /**
   * show os information.
   */
  os: {
    enabled: true
  },
  sqlite: {
    filePath: './data.db',
    // if enabled, will save samples to sqlite.
    samples: true
  }
}
