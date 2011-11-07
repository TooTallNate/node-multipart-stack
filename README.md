node-multipart-stack
====================
### A `StreamStack` subclass that parses "multipart" data, often from SMTP or HTTP.


This module implements [Section 7.2 of RFC 1341][rfc1341]. It can be easily used
in conjunction with any node `ReadableStream`.


Usage
-----

Here's a simple HTTP server that can parse multipart requests, like from an HTML
multipart form.

``` javascript
var http = require('http');
var multipart = require('multipart-stack');

var server = http.createServer(function(req, res) {

  // includes a built-in "Content-Type Parser"
  var parsed = multipart.parseContentType(req.headers['content-type']);

  if (parsed.type === 'multipart') {
    var parser = new multipart.Parser(req, parsed.boundary);

    // A 'part' event gets fired once per individual "part" of the multipart body
    parser.on('part', function (part) {
      // the 'part' arg is a `ReadableStream` that also emits a 'headers' event.
      part.on('headers', function(headers) {
        console.log(headers);
      });
      part.pipe(process.stdout, { end: false });
    });
  } else {
    // non-file-upload logic
  }

});
```

[Node]: http://nodejs.org
[rfc1341]: http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
