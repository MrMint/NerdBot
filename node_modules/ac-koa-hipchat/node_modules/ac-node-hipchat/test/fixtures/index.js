var fs = require('fs');
var os = require('os');
var paths = require('path');

var hostname = os.hostname().toLowerCase();

exports.load = function (path) {
  path = paths.join(__dirname, path);
  var data = fs.readFileSync(path).toString('utf8').replace(/\{\{hostname\}\}/g, hostname);
  if (/\.json$/.test(path)) {
    data = JSON.parse(data);
  }
  return data;
};
