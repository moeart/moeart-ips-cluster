'use strict';

var path = require('path');

function RequestSplitter (url, query) {
  this.url = url || '';
  this.urlMatch = RequestSplitter.urlMatch;
  this.query = query || '';
}

function fixUrlProtocol (url) {
  return url.replace(/^([a-z]+:)\/+([^\/])/, '$1//$2');
}

RequestSplitter.urlMatch = new RegExp([
  '^(\/moeart-ips-node)?',
  '\/?(c|w|h)?([0-9]+)x?([0-9]+)?,?',
  '(c|e|w|n(?:e|w)?|s(?:e|w)?)?',
  '\/?(png|jpg)?,?([0-9]+)?',
  '\/(.*)$'
].join(''));

RequestSplitter.prototype.mapOptions = function () {
  
  var param = this.url.match(this.urlMatch);
  var options;

  param[8] = fixUrlProtocol(param[8]);

  options = {
    action:  param[2] === 'c' ? 'crop' : 'resize',
    width:   param[2] === 'h' ? '' : param[3],
    height:  param[2] === 'w' ? '' : param[2] === 'h' ? param[3] : param[4],
    gravity: param[5] || 'c',
    format:  param[6] || 'jpg',
    quality: param[7] || '80',
    imagefile: param[8],
    url: param[8] + this.buildQueryString()
  };

  options.quality = Math.round(Math.min(100, Math.max(0, options.quality)));
  options.suffix = path.extname(options.imagefile);

  return options;
};

RequestSplitter.prototype.buildQueryString = function () {
  var queryArray = [];

  for (var i in this.query) {
    if (this.query.hasOwnProperty(i)) {
      queryArray.push(i + '=' + encodeURIComponent(this.query[i]));
    }
  }

  return '?' + queryArray.join('&');
};

module.exports = RequestSplitter;
