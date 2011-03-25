var fs = require('fs');
var assert = require('assert');
var Parser = require('../parser');
var inspect = require('util').inspect;

var stream = fs.createReadStream(__dirname + '/dumps/simple.dump', {
  bufferSize: 1
});
var parser = new Parser(stream, 'simple boundary');

var gotPreamble = false;
parser.on('preamble', function(preamble) {
  gotPreamble = true;
  var text = '';
  preamble.on('data', function(chunk) {
    text += chunk;
  });
  preamble.on('end', function() {
    console.error('Preamble:', inspect(text));
    assert.equal(text, 'This is the preamble.  It is to be ignored, though it\r\nis a handy place for mail composers to include an\r\nexplanatory note to non-MIME compliant readers.');
  });
});

var partCount = 0;
var endCount = 0;
var headerCount = 0;
parser.on('part', function(part) {
  var num = partCount++;
  var text = '';
  part.on('data', function(chunk) {
    text += chunk;
  });
  part.on('end', function() {
    endCount++;
    console.error('Part #'+num+' Body:', inspect(text));
    switch(num) {
      case 0:
        assert.equal(text, 'This is implicitly typed plain ASCII text.\r\nIt does NOT end with a linebreak.');
        break;
      case 1:
        assert.equal(text, 'This is explicitly typed plain ASCII text.\r\nIt DOES end with a linebreak.\r\n'); 
        break;
    }
  });
  part.on('headers', function(headers) {
    headerCount++;
    console.error('Part #'+num+' Headers:', headers);
    switch(num) {
      case 0:
        assert.equal(headers.length, 0);
        break;
      case 1:
        assert.equal(headers.length, 1);
        assert.equal(headers[0].key, 'Content-type');
        assert.equal(headers[0].value, 'text/plain; charset=us-ascii');
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
    console.error('Epilogue: ', inspect(text));
    assert.equal(text, 'This is the epilogue.  It is also to be ignored.\r\n');
  });
});

process.on('exit', function() {
  assert.ok(gotPreamble);
  assert.ok(gotEpilogue);
  assert.equal(partCount, 2);
  assert.equal(endCount, 2);
  assert.equal(headerCount, 2);
});
