import { useState, useEffect } from "react"
import "./App.css"

function App() {
    return (
        <>
            <div class="chat-container">
                <div id="chat-box" class="chat-box"></div>
                <div class="chat-input-area">
                    <input id="input" type="text" placeholder="Type a message..." />
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </>
    )
}

export default App