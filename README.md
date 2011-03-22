node-multipart-stack
====================
### A `StreamStack` subclass that parses "multipart" data, often from SMTP or HTTP.


This module implements section [7.2 of RFC 1341][rfc1341]. It can be easily used
in conjunction with any node `ReadableStream`.


Usage
-----

Here's a simple HTTP server that can parse multipart requests, like from an HTML
multipart form.

    var http = require('http');
    var multipart = require('multipart-stack');

    http.createServer(function(req, res) {
      var parsed = multipart.parseContentType(req.headers['content-type']);
      if (parsed.type === 'multipart') {
        var parser = new multipart.Parser(req, parsed.boundary);
        parser.on('preamble', function(data) {
          // May be fired once if there's any data that
          // comes before the first multipart boundary.
        });
        parser.on('multipart', function(stream) {
          // Fired once every part of the multipart message.
          // 'stream' is a ReadableStream that also emits a 'headers' event
        });
        parser.on('epilogue', function(data) {
          // May be fired once if there's any data that
          // comes after the final multipart boundary.
        });
      } else {
        // Serve a normal request
      }
    }).listen(80);

[Node]: http://nodejs.org
[rfc1341]: http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
