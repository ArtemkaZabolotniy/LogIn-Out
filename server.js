const express = require("express");
const app = express();

const PORT = 3000;
app.use(express.static("public"));
app.use(express.json()); 

let users = [
    {
        id:1,
        username:"admin",
        password:"admin"
    },
]

app.post("/api/login", (req, res) => {
    const user = users.find(u => u.username == req.body.username);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    } else if (user.password != req.body.password) {
        return res.status(401).json({ error: "Invalid password" });
    } else {
        res.json({ id: user.id, username: user.username });
    }
});
app.post("/api/register", (req,res) => {
    const user = users.find(u => u.username == req.body.username)
    if(!user) {
        const newUser = users.push({
            id:users.at(-1).id+1,
            username:req.body.username,
            password:req.body.password
        });
        res.json(newUser)
    } else {
        return res.status(409).json({error:"This user is already existed"})
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});