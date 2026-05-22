const WebSocket = require('ws');
const chatStore = {};
function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (socket) => {
    console.log('User is online');

    socket.on('message', (msg) => {
      const message = msg.toString();
      const unpackedData = JSON.parse(message);
      const from = unpackedData.fromId;
      const to = unpackedData.toId;
      const action = unpackedData.type;
      const payload = {
        type: 'send_msg',
        fromId: from,
        text: unpackedData.text,
      };

      let current_id;
      if (from > to) {
        current_id = `${to},${from}`;
      } else {
        current_id = `${from},${to}`;
      }
      if (!chatStore[current_id]) {
        chatStore[current_id] = {
          messages: [],
        };
      }

      if (action == 'connect_user') {
        socket.userId = from;
      } else if (action == 'sendMsg') {
        chatStore[current_id].messages.push(payload);
        wss.clients.forEach((client) => {
          if (client.userId == to) {
            client.send(JSON.stringify(payload));
          }
        });
      } else if (action == 'load_history') {
        if (chatStore[current_id]) {
          const dataToSend = {
            type: 'history_data',
            data: chatStore[current_id].messages,
          };
          socket.send(JSON.stringify(dataToSend));
        }
      }
    });
  });
}

module.exports = setupWebSocket;
