const WebSocket = require('ws');
const chatStore = {};

function buildDirectChatId(from, to) {
  if (from > to) {
    return `${to},${from}`;
  }

  return `${from},${to}`;
}

function getChatsForUser(userId, users) {
  const normalizedUserId = String(userId);
  const currentUser = users.find((user) => String(user.id) === normalizedUserId);

  if (!currentUser) {
    return [];
  }

  return Object.entries(chatStore).flatMap(([chatId, chat]) => {
    if (chat.isGroup) {
      if (!chat.members.includes(currentUser.username)) {
        return [];
      }

      return [
        {
          id: chatId,
          isGroup: true,
          groupName: chat.groupName,
        },
      ];
    }

    const members = chatId.split(',');
    if (!members.includes(normalizedUserId)) {
      return [];
    }

    const companionId = members.find((memberId) => memberId !== normalizedUserId);
    const companion = users.find((user) => String(user.id) === companionId);

    if (!companion) {
      return [];
    }

    return [
      {
        id: companion.id,
        isGroup: false,
        username: companion.username,
      },
    ];
  });
}

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

      if (action == 'group_create') {
        const members = [...unpackedData.people, unpackedData.username].sort();
        const current_id = members.join(',');
        if (!chatStore[current_id]) {
          chatStore[current_id] = {
            isGroup: true,
            groupName: unpackedData.grouName,
            members,
            messages: [],
          };
          const payload_group = {
            isGroup: true,
            type: 'group-maked',
            groupId: current_id,
            groupName: unpackedData.grouName,
          };
          wss.clients.forEach((client) => {
            if (members.includes(client.username)) {
              client.send(JSON.stringify(payload_group));
            }
          });
        }
      }
      if (action == 'connect_user') {
        socket.userId = from;
        socket.username = unpackedData.username;
      } else if (action == 'sendMsg') {
        if (unpackedData.isGroup) {
          const groupChat = chatStore[unpackedData.groupId];

          if (!groupChat) {
            return;
          }

          const payload = {
            isGroup: true,
            type: 'send_msg',
            groupId: unpackedData.groupId,
            fromId: from,
            senderUsername: socket.username,
            text: unpackedData.text,
          };

          groupChat.messages.push(payload);
          wss.clients.forEach((client) => {
            if (groupChat.members.includes(client.username) && client.userId !== from) {
              client.send(JSON.stringify(payload));
            }
          });
          return;
        }

        const current_id = buildDirectChatId(from, to);
        if (!chatStore[current_id]) {
          chatStore[current_id] = {
            messages: [],
          };
        }

        const payload = {
          type: 'send_msg',
          fromId: from,
          senderUsername: socket.username,
          text: unpackedData.text,
        };
        chatStore[current_id].messages.push(payload);
        wss.clients.forEach((client) => {
          if (client.userId == to) {
            client.send(JSON.stringify(payload));
          }
        });
      } else if (action == 'load_history') {
        if (unpackedData.isGroup) {
          const groupChat = chatStore[unpackedData.groupId];

          const dataToSend = {
            isGroup: true,
            type: 'history_data',
            groupId: unpackedData.groupId,
            data: groupChat ? groupChat.messages : [],
          };
          socket.send(JSON.stringify(dataToSend));
          return;
        }

        const current_id = buildDirectChatId(from, to);
        const dataToSend = {
          type: 'history_data',
          data: chatStore[current_id] ? chatStore[current_id].messages : [],
        };
        socket.send(JSON.stringify(dataToSend));
      }
    });
  });
}

module.exports = { setupWebSocket, getChatsForUser };
