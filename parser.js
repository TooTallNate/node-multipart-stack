require('bufferjs');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var PartParser = require('./partParser');

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
  this.currentPart = new PartParser(this, false);
  this._started = false;
}
inherits(Parser, EventEmitter);
module.exports = Parser;
