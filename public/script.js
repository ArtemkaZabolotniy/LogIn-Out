import users from './localStorage.js';
let logInUser = null;
let logInData = null;

window.getInform = () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    let flag = true;
    for(let elem in users) {
        if(users[elem].username == user) {
            alert("User with same username already existed");
            flag = false;
            break;
        }
    }
    if(flag == true) {
        users.push(
            {
            id:users.at(-1).id+1,
            username:user,
            password:`${pass}`
            }
        )
    }
}
window.logIn = () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const userData = {
        username:user,
        password:pass
    }
    serverLogIn(userData)
}
async function serverLogIn(user) {
    try {
    const response = await fetch("/api/login", {
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(user)
    });
    if(!response.ok) {
        throw new Error('Network responce is not ok');
    }
    const result = await response.json();
    console.log('Success:',result);
    } catch (error) {
        console.error('Error:',error)
    }
}
window.showUp = () => {
    console.log(users)
}