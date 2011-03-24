require('bufferjs');
var BufferList = require('bufferlist');
var StreamStack = require('stream-stack').StreamStack;
var inherits = require('util').inherits;

/**
 * Works in conjunction with the regular parent Parser to parse
 * out pieces (parts) of the multipart stream. First arg is the parent
 * Parser instance, second arg is whether this PartParser should attempt
 * to parse out headers first (true for message bodies, false for the
 * 'preamble' and 'epilogue')
 */
function PartParser(parent, parseHeaders) {
  StreamStack.call(this, parent.stream, {
    data: function onData(chunk) {
      this._onData(chunk);
    }
  });
  this.parent = parent;
  this._buffers = new BufferList();
  if (parent._started) {
    this._onData = parseHeaders ? this._parseHeaders : this._parseBody;
  } else {
    // We just have to buffer any incoming data until the Parser starts.
    this._onData = this._bufferData;
    var self = this;
    parent.on('_start', function() {
      self._onData = parseHeaders ? self._parseHeaders : self._parseBody;
      var buf = self._buffers.take();
      self._buffers.advance(buf.length);
      self.emit('data', buf);
    });
  }
}
inherits(PartParser, StreamStack);
module.exports = PartParser;


PartParser.prototype._bufferData = function bufferData(chunk) {
  this._buffers.push(chunk);
}

PartParser.prototype._parseHeaders = function parseHeaders(chunk) {
}

// Parsing Logic:
//  -Add the current chunk to the bufferlist if necessary.
//  -Check to see if the beginning of the bufferlist looks like a boundary:
//     If the bufferlist.length < endingBoundary.length+1, wait for next data event
//     If bufferlist.length >= endingBoundary+1, check if there's a boundary:
//       Check endingBoundary, then regularBoundary
//         If yes, emit 'end' on this PartParser
//         If no, we can safely emit what we have so far as 'data'
//  -If the current bufferlist contains the beginning of a boundary,
//   then slice the Buffer and emit the data to the user up to the
//   beginning of the "potential" boundary.
//  -Repeat from step 1, checking for a boundary again, etc.
PartParser.prototype._parseBody = function parseBody(chunk) {
  if (chunk) {
    this._bufferData(chunk);
  }
}


// If the parent Stream ends, then:
//   1) We're parsing a body part, and anything in the buffers should be emitted
//      to the user, up to the ending boundary which should be at the end.
//   2) We're parsing the epilogue, and anything in the buffers should be emitted
//      to the user. There will be no ending boundary to parse out.
PartParser.prototype._onEnd = function onEnd() {
  this.emit('end');
}
