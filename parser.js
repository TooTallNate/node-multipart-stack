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
  this._started = false;
  this.currentPart = new PartParser(this, false);
  this.once('_start', this._onStart);

  // We have to nextTick emitting 'preamble', since we have to give time
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
