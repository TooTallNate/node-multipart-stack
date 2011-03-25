require('bufferjs');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var PartParser = require('./partParser');
var CRLF = '\r\n';
var BOUNDARY_SIDE = '--';

/**
 * The main parser to parse a multipart Stream into individual Stream
 * instances. Expects a ReadableStream instance and a 'boundary' String.
 */
function Parser(stream, boundary) {
  if (typeof boundary !== 'string') {
    throw new Error("Parser expects a String 'boundary' as a second argument");
  }
  EventEmitter.call(this);
  this.stream = stream;
  this.boundary = boundary;

  // The PartParser first checks for the ending boundary, if that
  // isn't there, then it checks for the normal one
  this.beginningOfBoundary = new Buffer(CRLF[0], 'ascii');
  this.normalBoundary = new Buffer(CRLF+BOUNDARY_SIDE+boundary+CRLF, 'ascii');
  this.endingBoundary = new Buffer(CRLF+BOUNDARY_SIDE+boundary+BOUNDARY_SIDE+CRLF, 'ascii');

  // This _started nonsense is used by the PartParser, and only in the case of the
  // very first Stream (preamble). It is to counter any 'data' event upstream due to
  // the nextTick call below.
  this._started = false;
  this.once('_start', this._onStart);

  // The first 'part' is the preamble. It is possible that this Stream will emit
  // no data whatsoever, if the multipart upstream begins with a proper boundary.
  this._createPartParser(false, true);

  // We have to nextTick emitting 'preamble', so that we give time
  // for the user to attach an event handler for the event.
  var self = this;
  process.nextTick(function() {
    self.emit('preamble', self.currentPart);
    self.emit('_start');
  });
}
inherits(Parser, EventEmitter);
module.exports = Parser;

// Called after the initial nextTick after Parser construction. This event
// is called after we can assume the user has set up their event listeners. 
Parser.prototype._onStart = function onStart() {
 this._started = true;
}

Parser.prototype._createPartParser = function createPartParser(parseHeaders, listenForEnd) {
  this.currentPart = new PartParser(this, parseHeaders);
  if (listenForEnd) {
    this.currentPart.once('end', this._partParserFinished.bind(this));
  }
}

Parser.prototype._partParserFinished = function partParserFinished() {
  var isEpilogue = this.currentPart.isFinalBoundary;
  //console.error('isEpilogue:', isEpilogue);
  this._createPartParser(!isEpilogue, !isEpilogue);
  this.emit(isEpilogue ? 'epilogue' : 'part', this.currentPart);
}
