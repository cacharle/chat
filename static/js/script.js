let socket = io()

let input = document.getElementById("input-message")

document.getElementById("button-send").addEventListener("click", () => {
    socket.emit("message", input.value)
})

socket.on("received", msg => {
    console.log("received: " + msg)
})
