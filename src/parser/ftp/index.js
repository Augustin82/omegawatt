const fs = require("fs");

const { FTP_LOG_PATH } = process.env;

let lastTimestampRead = new Date(0).getTime();

const parseLogFile = () => {};
