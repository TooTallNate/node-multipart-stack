node-multipart-stack
====================
### A `StreamStack` subclass that parses "multipart" data, often from SMTP or HTTP.


This module implements [Section 7.2 of RFC 1341][rfc1341]. It can be easily used
in conjunction with any node `ReadableStream`.


Usage
-----

Here's a simple HTTP server that can parse multipart requests, like from an HTML
multipart form.

    var http = require('http');
    var multipart = require('multipart-stack');

    var server = http.createServer(function(req, res) {
      var parsed = multipart.parseContentType(req.headers['content-type']);
      if (parsed.type === 'multipart') {
        var parser = new multipart.Parser(req, parsed.boundary);
        parser.on('part', function(part) {
          // Fired once for each individual part of the multipart message.
          // 'part' is a ReadableStream that also emits a 'headers' event.
          part.on('headers', function(headers) {
            console.log(headers);
          });
          part.pipe(process.stdout);
        });
      }
    });

[Node]: http://nodejs.org
[rfc1341]: http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
