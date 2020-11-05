const path = require("path")

const ent = require("ent")

const express = require("express")
const app     = express()
const server  = require("http").createServer(app)
const session = require("express-session")

const io = require("socket.io")(server)

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert")

const MongoStore = require("connect-mongo")(session)

const mongoURI = "mongodb://localhost:27017"
let dbPromise = MongoClient.connect(mongoURI)

app.use(express.static(path.join(__dirname, "static")))
app.use(express.urlencoded({ extended: true }))


const sessionParser = session({
    secret: "bonjour",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        url: mongoURI,
        dbName: "chat",
    })
})
app.use(sessionParser)

app.get("/", (req, res) => {
    if (req.session.username !== undefined)
        res.redirect("/chat")
    req.session.username = undefined
    res.sendFile(path.join(__dirname, "/index.html"))
})

app.post("/", (req, res) => {
    if (req.body.username === undefined ||
        !/^[a-zA-Z][a-zA-Z0-9]{5,20}$/.test(req.body.username)
    )
        res.redirect("/?error=error")
    else {
        req.session.username = req.body.username
        res.redirect("/chat")
    }
})

app.get("/chat", (req, res) => {
    if (req.session.username === undefined)
        res.redirect("/")
    else {
        dbPromise.then(client => {
            client.db("chat")
                  .collection("messages")
                  .find()
                  .sort({ _id: -1 })
                  // .limit(50)
                  .toArray((err, dbres) => {
                        res.render(
                            path.join(__dirname, "/chat.ejs"),
                            {
                                username: req.session.username,
                                messages: dbres.reverse()
                                               .map(x => {
                                                   x.content = ent.decode(x.content)
                                                   return x
                                               })
                            }
                        )
                  })
        })
    }
})

function log(str) {
    console.log(`[${(new Date()).toDateString()}] ${str}`)
}

io.use((socket, next) => sessionParser(socket.request, socket.request.res, next))
io.on("connection", socket => {
    const author = socket.request.session.username
    log(`CONNECTED ${author}`)

    socket.on("send", content => {
        const date = new Date();
        content = ent.encode(content)
        log(`RECEIVED ${author}: ${content}`)
        dbPromise.then(client => {
            client.db("chat").collection("messages").insertOne({
                "date":    date,
                "author":  author,
                "content": content
            })
        })
        socket.broadcast.emit("received", {
            date:    date,
            author:  author,
            content: ent.decode(content)
        })
    })

    socket.on("disconnect", () => {
        log(`DISCONNECTED ${author}`)
    })
})

server.listen(8000, () => {
    console.log("Listening")
})
