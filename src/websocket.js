const WebSocket = require('ws');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (socket) => {
    console.log('User is online');

    socket.on('message', (msg) => {
      console.log('Message:', msg.toString());
    });

    socket.send('Hello from WS');
  });
}

module.exports = setupWebSocket;