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
  StreamStack.call(this, parent, {

  });
}
inherits(PartParser, StreamStack);
module.exports = PartParser;
