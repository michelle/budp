/**
  * Establish a connection to the client.
  */
chrome.extension.onConnect.addListener(function(port) {
  console.assert(port.name == 'budp-syn');

  // Mappings of [host, port] tuples to tab ids.
  var connections = {}

  // Response handler for socket data.
  function pass_data(d) {
    var data = chrome.socket.read(d.socketId);
    console.log('Received data: ', data);
    port.postMessage({data: data});
  };

  port.onMessage.addListener(function(msg, sender) {
    // Save tab associated with connection for future reference.
    var host_port = [msg.host, msg.port];
    if (!connections[host_port]) {
      connections[host_port] == sender.tab.id;

      // Make the connection.
      chrome.socket.create('udp', msg.host, msg.port, { onEvent: pass_data },
        function(socketInfo) {
          var socketId = socketInfo.socketId;
          chrome.socket.connect(socketId, function(result) {
            console.log('Connected to socket ', socketId, ' for ', host_port);
            port.postMessage({data: 'Ready'});

            // Add event listener for messages.
            chrome.extension.onConnect.addListener(function(data_port) {
              console.assert(data_port.name == 'budp-client');
              data_port.onMessage.addListener(function(msg) {
                // TODO: convert data to ArrayBuffer
                chrome.socket.write(socketId, msg.data, function() {
                  console.log('Sent message: ', msg.data);
                });
              });
            });

          });
        }
      );
    } else {
      console.log('Connection already exists');
      // TODO: Error object passed back here.
    }

    // Send the message.

  });
});
