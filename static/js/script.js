let socket = io()

let input = document.getElementById("input-message")
let messages = document.getElementById("messages")

const username = document.getElementById("username").textContent

function divWithClassContent(class_, content) {
    let node = document.createElement("div")
    node.classList.add(class_)
    node.textContent = content
    return node
}

function addMessage(date, author, content) {
    trNode      = document.createElement("li")
    let hours = date.getHours()
    if (hours < 10)
        hours = `0${hours}`
    let min = date.getMinutes()
    if (min < 10)
        min = `0${min}`
    dateNode    = divWithClassContent(
        "date",
        `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ` +
        `${hours}:${min}`
    )
    authorNode  = divWithClassContent("author", author)
    contentNode = divWithClassContent("content", content)
    trNode.appendChild(dateNode)
    trNode.appendChild(authorNode)
    trNode.appendChild(contentNode)
    messages.appendChild(trNode)
}

function send() {
    const content = input.value
    if (content === "")
        return
    input.value = ""
    socket.emit("send", content)
    addMessage(new Date(), username, content)
    window.scrollTo(0, document.body.scrollHeight)
}

socket.on("received", data => {
    scrolled = document.documentElement
    console.log(scrolled.scrollTop)
    console.log(scrolled.scrollHeight - scrolled.clientHeight)
    const shouldScroll = scrolled.scrollTop >= scrolled.scrollHeight - scrolled.clientHeight - 100
    addMessage(new Date(data.date), data.author, data.content)
    if (shouldScroll)
        window.scrollTo(0, document.body.scrollHeight)
})

document.getElementById("button-send").addEventListener("click", send)
document.addEventListener("keydown", event => {
    if (event.key === "Enter")
        send()
})

window.scrollTo(0, document.body.scrollHeight)
