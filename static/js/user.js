const chatsContainer = document.querySelector('#chats');
let currentUser;

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
}
const knownUsers = [];
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
      body: JSON.stringify({username:usernameToFind}),
    });
    const findedUser = await response.json();
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
    const isKnownUser = knownUsers.some(
      (user) => user.id === findedUser.id || user.username === findedUser.username
    );

    if (findedUser && !isKnownUser) {
      knownUsers.push(findedUser);
      document.querySelector('#chats').innerHTML += `
      <div class="chat" data-id='${findedUser.id}'>
        <div class="left">
          <img src="/client/img/user_icon.png" alt="" class="user_icon" />
          ${findedUser.username}
        </div>
      </div>
      `;
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
function getActiveUser (event) {
  const clickedChat = event.target.closest('.chat');
  if (!clickedChat) return;

  const userId = clickedChat.dataset.id;
  activeChat = knownUsers.find((u) => u.id === Number(userId));
}

const myConnection  = new WebSocket('ws://'+window.location.host);
myConnection.onopen = function() {
   console.log("Server is opened in user");
}

const sendBtn = document.querySelector('#send_massage');
const inputValue = document.querySelector('#input_send')

const sendMsg = () => {
  const sendValue = inputValue.value;
  const fullMsg = {
    type:'sendMsg',
    fromId:currentUser.id,
    toId:activeChat.id,
    text:sendValue
  }
  myConnection.send(JSON.stringify(fullMsg));
}

sendBtn.addEventListener('click', sendMsg)


myConnection.onmessage = function (event)  {
  const unpackedData = JSON.parse(event.data);
  const chat = document.querySelector('#main_chat');
  chat.innerHTML += unpackedData;
}