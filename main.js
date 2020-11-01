const path = require("path")

const express = require("express")
const app = express()
const port = 8000


express.static(path.join(__dirname, "static"))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
