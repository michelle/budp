$(function() {
  // TODO: Check meta tags before continuing. 
  var syn_port = chrome.extension.connect({name: 'budp-init'});

  /**
   * Inject a node into the DOM so extension can be detected.
   */
  var node = document.createElement('budp');
  (document.body||document.documentElement).appendChild(node);

  /**
   * Injected script to create a wrapper for window.postMessage.
   * TODO: allow for multiple connections in one window.
   */
  var s = document.createElement('script');
  s.src = chrome.extension.getURL('wrapper.js');
 // s.onload = function() {
 //   this.parentNode.removeChild(this);
 // };
  (document.head||document.documentElement).appendChild(s);

  /**
   * Listen for messages from the injected script from window.postMessage.
   */
  window.addEventListener('message', function(event) {
    if (event.source != window) return;

    if (event.data.type && event.data.type == 'udp-syn') {
      // If all ports are go, send the message to the extension.
      syn_port.postMessage({
        data: event.data.data,
        host: event.data.host,
        port: event.data.port
      });
    }
  }, false);

  /**
   * Listens for the connection to be initialized.
   */
  syn_port.onMessage.addListener(function(msg) {
    if (msg.data == 'Ready') {
      var data_port = chrome.extension.connect({name: 'budp-client'});
      // TODO: gc?

      // Listener to send UDP messages to the extension.
      window.addEventListener('message', function(event) {
        if (event.source != window) return;
        if (event.data.type && event.data.type == 'budp-msg') {
          data_port.postMessage({
            data: event.data.data,
            host: event.data.host,
            port: event.data.port
          });
        }
      }, false);

      // Add event handler for responses.
      data_port.onMessage.addListener(function(msg) {
        window.postMessage(msg);
      });
    }
  });
});
