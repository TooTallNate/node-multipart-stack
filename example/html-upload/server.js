var http = require('http');
var multipart = require('../../');

module.exports = http.createServer(function(req, res) {
  console.error(req.headers);
  var pct = multipart.parseContentType(req.headers['content-type']);
  if (pct.type === 'multipart') {
    var parser = new multipart.Parser(req, pct.boundary);
    parser.on('preamble', function(preamble) {
      console.error('got "preamble" event');
      preamble.on('data', function(chunk) {
        console.error('got "preamble" "data":', chunk, chunk+'');
      });
      preamble.on('end', function() {
        console.error('got "preamble" "end" event');
      });
    });
    parser.on('part', function(part) {
      console.error('got "part" event');
      part.on('headers', function(headers) {
        console.error(headers);
      });
      part.on('data', function(chunk) {
        console.error('got "part" "data":', chunk, chunk+'');
      });
      part.on('end', function() {
        console.error('got "part" "end" event');
      });
      parser.on('epilogue', function(e) {
        console.error('got "epilogue" event');
        e.on('data', function(chunk) {
          console.error('got "epilogue" "data":', chunk, chunk+'');
        });
        e.on('end', function() {
          console.error('got "epilogue" "end" event');
        });
      });
    });
  } else {
    res.setCode(404);
    res.end();
  }
}).listen(3000);
