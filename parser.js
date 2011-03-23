require('bufferjs');
var StreamStack = require('stream-stack').StreamStack;
var inherits = require('util').inherits;

/**
 *
 */
function Parser(stream, boundary) {
  StreamStack.call(this, stream, {
    data: function onData(chunk) {
      // '_onData' is a pointer to the current data parsing function
      this._onData(chunk);
    },
    end: this._onEnd
  });
  if (typeof boundary !== 'string') {
    throw new Error("Parser expects a String 'boundary' as a second argument");
  }
  this.boundary = boundary;
}
inherits(Parser, StreamStack);
module.exports = Parser;

// Called when the upstream emits its 'end' event.
Parser.prototype._onEnd = function onEnd() {}




/**
 * Works in conjunction with the regular parent Parser to parse out
 */
function PartParser(parent) {
  StreamStack.call(this, parent, {

  });
}
inherits(PartParser, StreamStack);
