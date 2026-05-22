let logInUser = null;
let logInData = null;

function getInform() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  const newUser = {
    username: user,
    password: pass,
  };
  serverReg(newUser);
}
function logIn() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  const userData = {
    username: user,
    password: pass,
  };
  serverLogIn(userData);
}
async function serverLogIn(user) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
    const result = await response.json();
    console.log('Success:', result);
    if (result) {
      sessionStorage.setItem('userId', String(result.id));
      sessionStorage.setItem(
        'userInfo',
        JSON.stringify({
          id: result.id,
          username: result.username,
        })
      );
      window.location.href = '/user/' + encodeURIComponent(result.id);
    }
  } catch (error) {
    if (error.message === 'User not found') {
      window.alert('User does not exist yet. Please create an account first.');
      return;
    }

    if (error.message === 'Invalid password') {
      window.alert('Wrong password. Please try again.');
      return;
    }

    console.error('Error:', error);
  }
}
async function serverReg(newUser) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network response is not ok');
    }
    const result = await response.json();
    if (result) {
      window.alert('Account created. Now sign in with your new user.');
    }
  } catch (error) {
    if (error.message === 'This user is already existed') {
      window.alert('An account with this username already exists. Choose another username.');
      return;
    }

    console.error('Error:', error);
  }
}

async function LoadUser(user) {
  const response = fetch('/');
}
