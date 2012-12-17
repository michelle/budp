chrome.app.runtime.onLaunched.addListener(function() { 
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

    // Convert JSON to ArrayBuffer for sending UDP packets.
    function json_to_ab(obj) {
      str = JSON.stringify(obj);
      var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
      var buf_view = new Uint16Array(buf);
      for (var i = 0, strlen = str.length; i < strlen; i += 1){
        buf_view[i] = str.charCodeAt(i);
      }
      return buf;
    }

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
                  chrome.socket.write(socketId, json_to_ab(msg.data), function() {
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

    });
  });
});
