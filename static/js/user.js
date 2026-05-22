const chatsContainer = document.querySelector('#chats');
let currentUser;
let myConnection;

const autoScroll = () => {
  const chat = document.querySelector('#main_chat');
  chat.scrollTop = chat.scrollHeight;
};

function renderMessage(message) {
  const mainChat = document.querySelector('#main_chat');
  const isMine = message.fromId === currentUser.id;
  const senderName = isMine ? currentUser.username : message.senderUsername || activeChat?.username;

  mainChat.innerHTML += `
   <div class="${isMine ? 'my_massege' : 'friend_massege'}">
     <span class="${isMine ? 'my_text' : 'friend_text'}">${senderName}: ${message.text}</span>
   </div>
  `;
}

function renderDirectChat(user) {
  const isKnownUser = knownUsers.some(
    (knownUser) => knownUser.id === user.id || knownUser.username === user.username
  );

  if (isKnownUser) {
    return;
  }

  knownUsers.push(user);
  chatsContainer.innerHTML += `
      <div class="chat" data-id='${user.id}' data-chat-type="direct">
        <div class="left">
          <img src="/client/img/user_icon.png" alt="" class="user_icon" />
          ${user.username}
        </div>
      </div>
      `;
}

function renderGroupChat(group) {
  const alreadyKnown = knownGroups.some((knownGroup) => knownGroup.id === group.id);

  if (alreadyKnown) {
    return;
  }

  knownGroups.push(group);
  chatsContainer.innerHTML += `
      <div class="chat" data-group-id='${group.id}' data-chat-type="group">
        <div class="left">
          <img src="/assets/user_icon.png" alt="" class="user_icon" />
          ${group.username}
        </div>
      </div>
      `;
}

async function loadSavedChats() {
  if (!currentUser) return;

  const response = await fetch('/api/chats/' + encodeURIComponent(currentUser.id));
  if (!response.ok) {
    console.error('Cannot load chats');
    return;
  }

  const chats = await response.json();
  chats.forEach((chat) => {
    if (chat.isGroup) {
      renderGroupChat({
        id: chat.id,
        isGroup: true,
        username: chat.groupName,
      });
      return;
    }

    renderDirectChat(chat);
  });
}

async function ensureDirectChatExists(userId) {
  const knownUser = knownUsers.find((user) => user.id === Number(userId));
  if (knownUser) {
    return knownUser;
  }

  const response = await fetch('/api/user/' + encodeURIComponent(userId));
  if (!response.ok) {
    return null;
  }

  const user = await response.json();
  if (!user || user.id === currentUser.id) {
    return null;
  }

  renderDirectChat(user);
  return user;
}

async function loadUserFromUrl() {
  const parts = window.location.pathname.split('/');
  const id = parts[parts.length - 1];

  if (!id) return;

  const response = await fetch('/api/user/' + encodeURIComponent(id));
  if (!response.ok) {
    console.error('Cannot load user');
    return;
  }

  currentUser = await response.json();
  if (currentUser) {
    initWebSocket();
    loadSavedChats();
  }
}
const knownUsers = [];
const knownGroups = [];
loadUserFromUrl();
const searchBtn = document.querySelector('#search');

async function searchUser() {
  const usernameToFind = document.querySelector('#search').value.trim();
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameToFind }),
    });
    const findedUser = await response.json();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
    const isKnownUser = knownUsers.some(
      (user) => user.id === findedUser.id || user.username === findedUser.username
    );
    const isSelf = findedUser.id === currentUser.id;

    if (findedUser && !isKnownUser && !isSelf) {
      renderDirectChat(findedUser);
    }
    if (!findedUser) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
  } catch (error) {
    console.log('Error:', error);
  }
}

searchBtn.addEventListener('keydown', searchUser);

let activeChat;

chatsContainer.addEventListener('click', getActiveUser);
function getActiveUser(event) {
  const clickedChat = event.target.closest('.chat');
  if (!clickedChat) return;

  const chatType = clickedChat.dataset.chatType;
  if (chatType === 'group') {
    const groupId = clickedChat.dataset.groupId;
    activeChat = knownGroups.find((group) => group.id === groupId);
    document.querySelector('#UsernameChat').innerHTML = activeChat.username;
    loadChatHistory(activeChat);
    return;
  }

  const userId = clickedChat.dataset.id;
  activeChat = knownUsers.find((u) => u.id === Number(userId));
  document.querySelector('#UsernameChat').innerHTML = activeChat.username;
  loadChatHistory(activeChat);
}
function loadChatHistory(receiver) {
  if (receiver.isGroup) {
    const payload = {
      isGroup: true,
      type: 'load_history',
      groupId: receiver.id,
    };
    myConnection.send(JSON.stringify(payload));
    return;
  }

  const payload = {
    type: 'load_history',
    fromId: currentUser.id,
    toId: receiver.id,
  };
  myConnection.send(JSON.stringify(payload));
}
function initWebSocket() {
  myConnection = new WebSocket('ws://' + window.location.host);
  myConnection.onopen = function () {
    const authPayload = {
      type: 'connect_user',
      fromId: currentUser.id,
      username: currentUser.username,
    };
    myConnection.send(JSON.stringify(authPayload));
  };
  myConnection.onmessage = async function (event) {
    const unpackedData = JSON.parse(event.data);
    const mainChat = document.querySelector('#main_chat');

    if (unpackedData.type === 'history_data') {
      mainChat.innerHTML = '';
      unpackedData.data.forEach((element) => {
        renderMessage(element);
      });
      autoScroll();
      return;
    }

    if (unpackedData.type === 'group-maked') {
      renderGroupChat({
        id: unpackedData.groupId,
        isGroup: true,
        username: unpackedData.groupName,
      });
      return;
    }

    if (!unpackedData.isGroup && unpackedData.fromId !== currentUser.id) {
      await ensureDirectChatExists(unpackedData.fromId);
    }

    if (!activeChat) return;

    if (unpackedData.isGroup) {
      if (!activeChat.isGroup || unpackedData.groupId !== activeChat.id) return;
    } else if (activeChat.isGroup || unpackedData.fromId !== activeChat.id) {
      return;
    }

    document.querySelector('#UsernameChat').innerHTML = activeChat.username;
    renderMessage(unpackedData);
    autoScroll();
  };
}
let createNewGroup;
function openModalWindow() {
  const modalWindow = document.createElement('dialog');
  modalWindow.className = 'modal_window';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal_close_btn';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => modalWindow.close());

  const modalCards = document.createElement('div');
  modalCards.className = 'modal-cards';

  modalWindow.appendChild(closeBtn);
  modalWindow.appendChild(modalCards);
  modalWindow.insertAdjacentHTML(
    'beforeend',
    `
      <div id="group-create-panel" class="group-create-panel--modal">
        <input type="text" id="group-name-input" placeholder="Enter group name" />
        <button id="create-group-btn" type="button">Create Group</button>
      </div>
    `
  );
  document.body.appendChild(modalWindow);
  createNewGroup = document.querySelector('#create-group-btn');
  modalWindow.showModal();
  modalWindow.addEventListener('close', () => modalWindow.remove());
  knownUsers.forEach((u) => {
    modalCards.insertAdjacentHTML(
      'beforeend',
      `
        <div class="chat" data-status="false">
          <div class="left">
            <img src="/assets/user_icon.png" alt="" class="user_icon" />
            <span class = 'innerUserName' data-user-name='${u.username}'>${u.username}</span>
          </div>
      </div>
      `
    );
  });
  modalCards.addEventListener('click', (e) => {
    let chat = e.target.closest('.chat');
    chat.dataset.dataStatus =
      e.target.closest('.chat').dataset.dataStatus === 'true' ? 'false' : 'true';
  });
  createNewGroup.addEventListener('click', () => {
    const allChats = modalCards.querySelectorAll('.chat');
    const name = document.querySelector('#group-name-input').value;
    let payload = {
      isGroup: true,
      type: 'group_create',
      username: currentUser.username,
      grouName: name,
      people: [],
    };
    allChats.forEach((chat) => {
      if (chat.dataset.dataStatus === 'true') {
        const userForGroupCreate = chat.querySelector('.innerUserName').dataset.userName;
        payload.people.push(userForGroupCreate);
      }
    });
    myConnection.send(JSON.stringify(payload));
  });
}
function greateGroup() {}
const gropuMakerBtn = document.querySelector('#new-group-btn');
gropuMakerBtn.addEventListener('click', openModalWindow);

const sendBtn = document.querySelector('#send_massage');
const inputValue = document.querySelector('#input_send');

const sendMsg = () => {
  if (!activeChat) return;
  const sendValue = inputValue.value;
  if (!sendValue.trim()) return;
  renderMessage({
    fromId: currentUser.id,
    senderUsername: currentUser.username,
    text: sendValue,
  });
  inputValue.value = '';
  autoScroll();
  const fullMsg = activeChat.isGroup
    ? {
        isGroup: true,
        type: 'sendMsg',
        fromId: currentUser.id,
        groupId: activeChat.id,
        text: sendValue,
      }
    : {
        type: 'sendMsg',
        fromId: currentUser.id,
        toId: activeChat.id,
        text: sendValue,
      };
  myConnection.send(JSON.stringify(fullMsg));
};

sendBtn.addEventListener('click', sendMsg);
