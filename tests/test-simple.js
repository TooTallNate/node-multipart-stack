var fs = require('fs');
var assert = require('assert');
var Parser = require('../parser');

var stream = fs.createReadStream(__dirname + '/dumps/simple.dump');
var parser = new Parser(stream, 'simple boundary');

var gotPreamble = false;
parser.on('preamble', function(preamble) {
  gotPreamble = true;
  var text = '';
  preamble.on('data', function(chunk) {
    text += chunk;
  });
  preamble.on('end', function() {
    assert.equal(text, 'This is the preamble.  It is to be ignored, though it\r\nis a handy place for mail composers to include an\r\nexplanatory note to non-MIME compliant readers.');
  });
});

var partCount = 0;
parser.on('part', function(part) {
  var num = partCount++;
  var text = '';
  part.on('data', function(chunk) {
    text += chunk;
  });
  part.on('end', function() {
    switch(num) {
      case 0:
        assert.equal(text, 'This is implicitly typed plain ASCII text.\r\nIt does NOT end with a linebreak.');
        break;
      case 1:
        assert.equal(text, 'This is explicitly typed plain ASCII text.\r\nIt DOES end with a linebreak.\r\n'); 
        break;
    }
  });
});

var gotEpilogue = false;
parser.on('epilogue', function(epilogue) {
  gotEpilogue = true;
  var text = '';
  epilogue.on('data', function(chunk) {
    text += chunk;
  });
  epilogue.on('end', function() {
    assert.equal(text, 'This is the epilogue.  It is also to be ignored.');
  });
});

process.on('exit', function() {
  assert.ok(gotPreamble);
  assert.ok(gotEpilogue);
  assert.equal(partCount, 2);
});
