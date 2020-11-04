const path = require("path")

const ent = require("ent")

const express = require("express")
const app     = express()
const server  = require("http").createServer(app)
const session = require("express-session")

const io = require("socket.io")(server)

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert")

const mongoURI = "mongodb://localhost:27017"
// const client = new MongoClient(mongoURI)

let dbPromise = MongoClient.connect(mongoURI)
// console.log(">>", dbPromise)
// dbPromise.then(db => console.log(">>", db.db("chat").collection("messages")))


app.use(express.static(path.join(__dirname, "static")))
// app.use(express.urlencoded({ extended: true }))
const sessionParser = session({
    secret: "bonjour",
    resave: true,
    saveUninitialized: true
})
app.use(sessionParser)

app.get("/", (req, res) => {
    req.session.username = "user"
    res.sendFile(path.join(__dirname, "/index.html"))
})


// dbPromise.then(client => {
    // client.db("chat").collection("messages").find().sort({ _id: -1 }).limit(50).toArray
// })

// app.post("/", (req, res) => {
//     if (req.method !== "POST" || req.body.pseudo === undefined)
//         res.redirect("/?error=invalid_request")
//     res.sendfile(path.join(__dirname, "/index.html"))
// })
//
// app.get("/chat", (req, res) => {
//     res.sendfile(path.join(__dirname, "/chat.html"))
// })

io.use((socket, next) => sessionParser(socket.request, socket.request.res, next))
io.on("connection", socket => {
    const author = socket.request.session.username

    socket.on("send", content => {
        const date = new Date();
        content = ent.encode(content)
        console.log(`[${date.toDateString()}] RECEIVED ${author}: ${content}`)
        dbPromise.then(client => {
            client.db("chat").collection("messages").insert({
                "date":    date,
                "author":  author,
                "content": content
            })
        })
        socket.broadcast.emit("received", {
            date:    date,
            author:  author,
            content: content
        })
    })

    socket.on("disconnect", () => {
        console.log(`DISCONNECTED ${author}`)
    })
})

server.listen(8000, () => {
    console.log("Listening")
})
