document.addEventListener("DOMContentLoaded", function () {
    const chatContainer = document.getElementById("chat-container");
    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.getElementById("chat-box");
    const header = document.getElementById("header");
    const inputContainer = document.getElementById("chat-input-container");
    const buttons = document.getElementById("button");

    function adjustChatPosition() {
        chatContainer.classList.add("active-chat");
        header.style.display = "none";
        chatContainer.style.width = "780px";
        chatContainer.style.height = "93%";
        chatBox.style.flexGrow = "1";
        chatBox.style.minHeight = "93%";
        inputContainer.style.position = "absolute";
        inputContainer.style.bottom = "0";
        inputContainer.style.width = "780px";
        inputContainer.style.background = "rgba(0,0,0,0.774)";
        chatInput.style.border = "0";
        buttons.style.display = "none";
    }

    async function sendMessageToAI(messageText) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
    
            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    model: "Dennis",
                    prompt: messageText,
                    stream: true
                })
            });
    
            clearTimeout(timeoutId);
    
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
    
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            
            // Create a response element
            const botMessageElement = document.createElement("div");
            botMessageElement.classList.add("message", "bot-message");
            chatBox.appendChild(botMessageElement);
            chatBox.scrollTop = chatBox.scrollHeight;
    
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
    
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
    
                for (let i = 0; i < lines.length - 1; i++) {
                    if (lines[i].trim().length > 0) {
                        try {
                            const json = JSON.parse(lines[i]);
                            const token = json.response;
                            botMessageElement.innerHTML += token + "&nbsp;"; // Append token dynamically
                            chatBox.scrollTop = chatBox.scrollHeight;
                        } catch (e) {
                            console.error("Error parsing JSON:", e);
                        }
                    }
                }
                buffer = lines[lines.length - 1];
            }
    
            if (buffer.trim().length > 0) {
                try {
                    const json = JSON.parse(buffer);
                    const token = json.response;
                    botMessageElement.innerHTML += token + "&nbsp;";
                } catch (e) {
                    console.error("Error parsing final JSON:", e);
                }
            }
        } catch (error) {
            console.error("Error communicating with AI:", error);
            const errorMessage = document.createElement("div");
            errorMessage.classList.add("message", "bot-message");
            errorMessage.textContent = "Error: Unable to connect to AI.";
            chatBox.appendChild(errorMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
    
    const style = document.createElement("style");
    style.textContent = `
        .user-message {
            align-self: flex-end;
            background-color: rgba(0, 0, 0, 0.774);
            color: white;
            padding: 10px;
            border-radius: 10px;
            max-width: 60%;
            margin: 5px;
        }
        .bot-message {
            align-self: flex-start;
            color: white;
            background-color: rgba(0, 0, 0, 0.774);
            padding: 10px;
            border-radius: 10px;
            max-width: 60%;
            margin: 5px;
        }
        #chat-box {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 10px;
            overflow-y: auto;
            height: calc(100vh - 60px);
        }
    `;
    document.head.appendChild(style);
});