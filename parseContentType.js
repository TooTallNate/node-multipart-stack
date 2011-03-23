function parseContentType(contentType) {
  var rtn = {};
  if (!contentType || typeof contentType !== 'string') return rtn;
  var parts = contentType.split(';');
  for (var i=0, l=parts.length; i<l; i++) {
    var part = parts[i].trim();
    var firstEquals = part.indexOf('=');
    if (firstEquals > 0) {
      var name = part.substring(0, firstEquals);
      part = part.substring(firstEquals+1);
      if (part[0] === '"' && part[part.length-1] === '"') {
        part = part.substring(1, part.length-1);
      }
      rtn[name] = part;
    } else if (part.indexOf('/') > 0) {
      part = part.split('/');
      rtn.type = part[0];
      rtn.subtype = part[1];
    } else {
      throw new Error("Don't know what to do with this part: " + part);
    }
  }
  return rtn;
}
module.exports = parseContentType;
