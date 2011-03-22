var parseContentType = require('../parseContentType');
var assert = require('assert');

assert.deepEqual( parseContentType('text/plain'), {
  type: 'text',
  subtype: 'plain'
});

assert.deepEqual( parseContentType('multipart/mixed; boundary="simple boundary"'), {
  type: 'multipart',
  subtype: 'mixed',
  boundary: 'simple boundary'
});

assert.deepEqual( parseContentType('multipart/alternative; boundary=boundary42'), {
  type: 'multipart',
  subtype: 'alternative',
  boundary: 'boundary42'
});

assert.deepEqual( parseContentType('multipart/digest; boundary="---- next message ----" '), {
  type: 'multipart',
  subtype: 'digest',
  boundary: '---- next message ----'
});

assert.deepEqual( parseContentType('multipart/parallel; boundary=gc0p4Jq0M2Yt08jU534c0p'), {
  type: 'multipart',
  subtype: 'parallel',
  boundary: 'gc0p4Jq0M2Yt08jU534c0p'
});
