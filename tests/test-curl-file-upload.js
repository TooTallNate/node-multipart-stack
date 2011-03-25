var fs = require('fs');
var assert = require('assert');
var Parser = require('../parser');

var stream = fs.createReadStream(__dirname + '/dumps/curl-file-upload.dump');
var parser = new Parser(stream, '----------------------------a4d460617f5b');
parser.on('preamble', function(preamble) {
  console.error('got preamble');
  preamble.pipe(process.stdout);
});
parser.on('part', function(part) {
  console.error('got part');
  part.on('headers', function(headers) {
    console.error(headers);
  });
  part.on('data', function(chunk) {
    console.error(chunk, chunk+'');
  });
});
parser.on('epilogue', function(epilogue) {
  console.error('got epologue');
  epilogue.on('data', console.error);
  epilogue.on('end', function() {
    console.error('got "end" from epilogue');
  });
});
