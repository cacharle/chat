let socket = io()

let input = document.getElementById("input-message")
let messages = document.getElementById("messages")

function addMessage(author, content) {
    liNode      = document.createElement("li")
    authorNode  = document.createElement("div")
    contentNode = document.createElement("div")
    authorNode.classList.add("author")
    contentNode.classList.add("content")
    authorNode.textContent = author
    contentNode.textContent = content
    liNode.appendChild(authorNode)
    liNode.appendChild(contentNode)
    messages.appendChild(liNode)
}

function send() {
    const author = "user"
    const content = input.value
    if (content === "")
        return
    input.value = ""
    socket.emit("send", content)
    addMessage(author, content)
}

socket.on("received", data => {
    addMessage(data.author, data.content)
})

document.getElementById("button-send").addEventListener("click", send)
document.addEventListener("keydown", event => {
    if (event.key === "Enter")
        send()
})
