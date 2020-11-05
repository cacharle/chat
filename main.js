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
app.use(express.urlencoded({ extended: true }))
const sessionParser = session({
    secret: "bonjour",
    resave: true,
    saveUninitialized: true
})
app.use(sessionParser)

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

app.post("/", (req, res) => {
    if (req.body.username === undefined || req.body.username.length < 5 || req.body.username.length > 25)
        res.redirect("/")
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
                            }
                        )
                  })
        })
    }
})


// dbPromise.then(client => {
    // client.db("chat").collection("messages").find().sort({ _id: -1 }).limit(50).toArray
// })

io.use((socket, next) => sessionParser(socket.request, socket.request.res, next))
io.on("connection", socket => {
    const author = socket.request.session.username

    socket.on("send", content => {
        const date = new Date();
        content = ent.encode(content)
        console.log(`[${date.toDateString()}] RECEIVED ${author}: ${content}`)
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
