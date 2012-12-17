/**
 * BUDP object, with options.
 */
function BrowserUDP(options) {
  options = extend({
    host: 0.0.0.0,
    port: 5000
  });
  this._port = options.port;
  this._host = options.host;

  // SYN
  window.postMessage({
    type: 'udp-syn',
    host: this._host,
    port: this._port
  }, '*');

  // Javascript is great.
  var self = this;

  /**
  * Listens for BUDP response.
  */
  window.addEventListener('message', function(event) {
    if (event.source != window) return;

    if (event.data.type && event.data.type == 'budp-response') {
      self.onmessage(event.data.msg);
    }
  }
}


/**
 * Send a message.
 */
BrowserUDP.prototype.send = function(msg) {
  window.postMessage({
    type: 'budp-msg',
    data: msg,
    host: this._host,
    port: this._port
  }, '*');
}

/**
 * Message event shell.
 */
BrowserUDP.prototype.onmessage = function(msg) {
  console.log(msg);
}


function extend(dst, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key)) {
      dst[key] = src[key];
    }
  }
  return dst;
}
