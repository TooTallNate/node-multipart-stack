require('bufferjs');
var Stream = require('stream').Stream;
var BufferList = require('bufferlist');
var StreamStack = require('stream-stack').StreamStack;
var HeaderParser = require('header-stack').Parser;
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
  //console.error('creating new PartParser; parseHeaders:', parseHeaders);
  this.parent = parent;
  this.isFinalBoundary = false;
  this._ended = false;
  this._buffers = new BufferList();
  // This is for a special edge-case where the read stream begins on a boundary, and
  // does not begin with a CRLF. In that case, this PartParser should end immediately.
  // After it gets set to `false`, this edge-case should no longer be checked for.
  this._isBeginning = true;

  var self = this;
  if (parseHeaders) {
    this._headerParser = new HeaderParser(new Stream());
    this._headerParser.on('headers', this._onHeaders.bind(this));
  }
  if (parent._started) {
    this._onData = parseHeaders ? this._parseHeaders : this._parseBody;
  } else {
    // We just have to buffer any incoming data until the Parser starts.
    this._onData = this._bufferData;
    parent.on('_start', function() {
      //console.error('got "_start" event, _buffers.length:', self._buffers.length, ', parent._started:', parent._started);
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
  //console.error('_bufferData:', chunk, 'parent._started:', this.parent._started);
  this._buffers.push(chunk);
}

PartParser.prototype._parseHeaders = function parseHeaders(chunk) {
  //console.error('_parseHeaders:', chunk);
  this._headerParser._onData(chunk);
}

PartParser.prototype._onHeaders = function onHeaders(headers, leftover) {
  //console.error('_onHeaders');
  this._onData = this._parseBody;
  this.emit('headers', headers);
  if (leftover) {
    this._onData(leftover);
  }
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
  //console.error('_parseBody');
  if (chunk) {
    this._bufferData(chunk);
  }
  //console.error(this._buffers.length);
  if (this._buffers.length >= this.parent.endingBoundary.length) {
    var buf = this._buffers.take();
    //console.error("Gonna do something with: ", buf, buf+'');
    if (buf.indexOf(this.parent.endingBoundary) === 0) {
      this.isFinalBoundary = true;
      this._buffers.advance(this.parent.endingBoundary.length);
      //console.error('found ending boundary!');
      this._end();
    } else if (buf.indexOf(this.parent.normalBoundary) === 0) {
      this._buffers.advance(this.parent.normalBoundary.length);
      //console.error('found normal boundary');
      this._end();
    } else if (this._isBeginning && buf.indexOf(this.parent.beginningBoundary) === 0) {
      this._buffers.advance(this.parent.beginningBoundary.length);
      //console.error('found beginning boundary at without a beginning CRLF');
      this._end();
    } else {
      var s = buf.indexOf(this.parent.beginningOfBoundary);
      if (s === 0) {
        s = buf.slice(1).indexOf(this.parent.beginningOfBoundary);
        if (s !== -1) s++;
      }
      if (s === -1) {
        s = this.parent.endingBoundary.length;
      }
      //console.error(s);
      var slice = buf.slice(0, s);
      this._buffers.advance(s);
      //console.error("Emitting data: ", slice, slice+'');
      this.emit('data', slice);
      this._isBeginning = false;
      this._parseBody();
    }
  } else {
    //console.error('waiting for more data');
  }
}


// If the parent Stream ends, then:
//   1) We're parsing a body part, and anything in the buffers should be emitted
//      to the user, up to the ending boundary which should be at the end.
//   2) We're parsing the epilogue, and anything in the buffers should be emitted
//      to the user. There will be no ending boundary to parse out.
PartParser.prototype._onEnd = function onEnd() {
  //console.error('got "end" event from upstream');
  function flushBuffersThenEnd() {
    
    if (this._buffers.length > 0 && this === this.parent.currentPart) {
      // emit any remaining 'data' in the buffers
      var remaining = this._buffers.take();
      this._buffers.advance(remaining.length);
      //console.error(remaining, remaining + '');
      this.emit('data', remaining);
    }
    this.parent.currentPart._end();
  }
  if (this.parent._started) {
    flushBuffersThenEnd.call(this);
  } else {
    this.parent.once('_start', flushBuffersThenEnd.bind(this));
  }
}

// Ensures we only fire the 'end' event once per part.
PartParser.prototype._end = function () {
  //console.error('got "_end"');
  if (!this._ended) {
    this._ended = true;
    this.cleanup();
    this.emit('end');
    if (this._buffers.length > 0) {
      this.parent.currentPart._onData(this._buffers.take());
    }
  }
}
