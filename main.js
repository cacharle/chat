const path = require("path")

// const ent = require("ent")

const express = require("express")
const app = express()
const http = require("http").createServer(app)

const cookieSession = require("cookie-session")
const socketSession = require("express-socket.io-session")

const io = require("socket.io")(http)

const MongoClient = require("mongodb").MongoClient;

let db = MongoClient.connect("mongodb://localhost:27017/chat", (err, _) => {
    assert(err, null)
    console.log("Connected to db")
})

app.use(express.static(path.join(__dirname, "static")))
app.use(express.urlencoded({ extended: true })
app.use(cookieSession({secret: "session-secret"}))
io.use(socketSession(cookieSession))

app.get("/", (req, res) => {
    res.sendfile(path.join(__dirname, "/index.html"))
})

app.post("/", (req, res) => {
    if (req.method !== "POST" || req.body.pseudo === undefined)
        res.redirect("/?error=invalid_request")
    res.sendfile(path.join(__dirname, "/index.html"))
})

app.get("/chat", (req, res) => {
    res.sendfile(path.join(__dirname, "/chat.html"))
})

io.on("connection", socket => {
    console.log("connection")

    socket.on("message", msg => {
        console.log("received: " + msg)

        let data = new Date();
        msg = ent.encode(msg)

        socket.broadcast.emit("received", msg)
    })

    socket.on("disconnect", () => {
        console.log("disconnected")
    })
})

http.listen(8000, () => {
    console.log("Listening")
})
