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
    },
    end: this._onEnd
  });
  this.parent = parent;
  this.isFinalBoundary = false;
  this._ended = false;
  this._buffers = new BufferList();
  if (parent._started) {
    this._onData = parseHeaders ? this._parseHeaders : this._parseBody;
  } else {
    // We just have to buffer any incoming data until the Parser starts.
    this._onData = this._bufferData;
    var self = this;
    parent.on('_start', function() {
      self._onData = parseHeaders ? self._parseHeaders : self._parseBody;
      if (self._buffers.length > 0) {
        var buf = self._buffers.take();
        self._buffers.advance(buf.length);
        self._onData(buf);
      }
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
//     If bufferlist.length >= endingBoundary.length+1, check if there's a boundary:
//       Check endingBoundary, then regularBoundary
//         If yes, emit 'end' on this PartParser
//         If no, we can safely emit what we have so far as 'data'
//  -If the current bufferlist contains the beginning of a boundary (a \r),
//   then slice the Buffer and emit the data to the user up to the
//   beginning of the "potential" boundary.
//  -Repeat from step 1, checking for a boundary again, etc.
PartParser.prototype._parseBody = function parseBody(chunk) {
  if (chunk) {
    this._bufferData(chunk);
  }
  var buf = this._buffers.take();
  //console.error(buf);
  if (buf.length >= this.parent.endingBoundary.length) {
    if (buf.indexOf(this.parent.endingBoundary) === 0) {
      this.isFinalBoundary = true;
      this._buffers.advance(this.parent.endingBoundary.length);
      console.error('found ending boundary!');
      this._end();
    } else if (buf.indexOf(this.parent.normalBoundary) === 0) {
      this._buffers.advance(this.parent.normalBoundary.length);
      console.error('found normal boundary');
      this._end();
    } else {
      var s = buf.indexOf(this.parent.beginningOfBoundary);
      if (s < 1) {
        s = this.parent.endingBoundary.length;
      }
      //console.error(s);
      var slice = buf.slice(0, s);
      this._buffers.advance(s);
      this.emit('data', slice);
      this._parseBody();
    }
  }
  //var beginningOfBoundary = buf.indexOf(this.parent.beginningOfBoundary); // \r
  //console.error(beginningOfBoundary);
  //if (beginningOfBoundary >= 1) {
  //}
}


// If the parent Stream ends, then:
//   1) We're parsing a body part, and anything in the buffers should be emitted
//      to the user, up to the ending boundary which should be at the end.
//   2) We're parsing the epilogue, and anything in the buffers should be emitted
//      to the user. There will be no ending boundary to parse out.
PartParser.prototype._onEnd = function onEnd() {
  console.error('got "end" event from upstream');
  this._parseBody();
  if (this.parent._started) {
    this._end();
  } else {
    this.parent.once('_start', this._end.bind(this));
  }
}

// Ensures we only fire the 'end' event once per part.
PartParser.prototype._end = function () {
  console.error('got "_end"');
  if (!this._ended) {
    this._ended = true;
    this.emit('end');
    console.error("Leftover: ", this._buffers.take('utf8'));
    //if (this._buffers.length > 0) {
    //  this.parent.currentPart.emit('data', this._buffers.take());
    //}
  }
}
