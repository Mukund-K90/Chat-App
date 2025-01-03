(function () {

    const app = document.querySelector(".app");
    const socket = io();

    let uname;

    app.querySelector(".join-screen #join-user").addEventListener('click', function () {
        let username = app.querySelector(".join-screen #username").value;
        if (username.length == 0) {
            return;
        }
        socket.emit('newuser', username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    const messageInput = app.querySelector(".chat-screen #message-input");
    messageInput.addEventListener('input', function () {
        if (messageInput.value.length > 0) {
            socket.emit('typing');
        } else {
            socket.emit('stopTyping');
        }
    });

    app.querySelector(".chat-screen #send-message").addEventListener('click', function () {
        let message = app.querySelector(".chat-screen #message-input").value;
        if (message.length == 0) {
            return;
        }
        renderMessage("my", {
            text: message,
            username: uname
        });
        socket.emit('chat', {
            text: message,
            username: uname
        });

        app.querySelector(".chat-screen #message-input").value = "";
        socket.emit('stopTyping');
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener('click', function () {
        socket.emit('exituser', uname);
        window.location.href = window.location.href;
    });

    socket.on("typing", function (username) {
        console.log("Typing username:", username);
        renderTyping(username, true);
    });

    socket.on("stopTyping", function (username) {
        console.log("Stop typing username:", username);
        renderTyping(username, false);
    });

    socket.on("update", function (update) {
        renderMessage("update", update);
    });

    socket.on("chat", function (message) {
        renderMessage("other", message);
    });

    function renderMessage(type, message) {
        const msgData = `${new Date().getHours()}:${new Date().getMinutes()}`;
        let messageContainer = app.querySelector(".chat-screen .messages");
        message.fileSize = message.fileSize > 1024 ? `${(message.fileSize / 1024).toFixed(2)} MB` : `${message.fileSize} KB`;
        if (type === "my" || type === "other") {
            if (message.fileUrl) {
                let el = document.createElement("div");
                el.setAttribute("class", `message ${type === "my" ? "my-message" : "other-message"}`);
                el.innerHTML = `
                <div>
                    <div class="name">${type === "my" ? "You" : `${message.username} ${msgData}`}</div>
                    <div class="file-card">
                        <i class="fa fa-file" style="font-size: 24px; margin-right: 8px;"></i>
                        <div class="file-info">
                                <span>${message.fileName}</span>
                                <span style="font-size: 10px;"> ${message.fileSize}</span>
                        </div>
                         <a href="${message.fileUrl}" class="download-btn" download="${message.fileName}">
                           <i class="fa-solid fa-download"></i>
                        </a>
                    </div>
                    <div class="caption">${message.text}</div>
                </div>`;
                messageContainer.appendChild(el);
            } else {
                let el = document.createElement("div");
                el.setAttribute("class", `message ${type === "my" ? "my-message" : "other-message"}`);
                el.innerHTML = `
                <div>
                    <div class="name">${type === "my" ? "You" : `${message.username} ${msgData}`}  </div >
                <div class="text">${message.text}</div>
                </div > `;
                messageContainer.appendChild(el);
            }
        } else if (type === "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }

        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

    function renderTyping(username, isTyping) {
        let typingIndicator = document.querySelector(".typing-indicator");
        if (!typingIndicator) {
            typingIndicator = document.createElement("div");
            typingIndicator.classList.add("typing-indicator");
            app.querySelector(".chat-screen").prepend(typingIndicator);
        }

        if (isTyping && username) {
            typingIndicator.innerText = `${username} is typing...`;
            typingIndicator.style.display = "block";
        } else {
            typingIndicator.style.display = "none";
        }
    }

    const fileModal = document.getElementById('fileModal');
    const filePreview = document.getElementById('filePreview');
    const fileCaption = document.getElementById('fileCaption');
    const uploadFileButton = document.getElementById('uploadFile');
    const closeModalButton = fileModal.querySelector('.close');
    const fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            filePreview.innerHTML = "";
            const fileSize = file.size > 1024 * 1024
                ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                : (file.size / 1024).toFixed(2) + ' KB';
            const fileName = file.name;
            const fileType = file.type || "Unknown";

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '40%';
                img.style.height = '40%';
                filePreview.appendChild(img);
            } else {
                const fileIcon = document.createElement('i');
                fileIcon.classList.add('fa', 'fa-file');
                fileIcon.style.fontSize = '50px';
                filePreview.appendChild(fileIcon);
            }
            const fileDetails = document.createElement('p');
            fileDetails.innerText = `${fileName} | ${fileSize} | ${fileType} `;
            filePreview.appendChild(fileDetails);

            fileModal.style.display = 'block';
        }
    });

    closeModalButton.addEventListener('click', function () {
        fileModal.style.display = 'none';
    });

    uploadFileButton.addEventListener('click', function () {
        const file = fileInput.files[0];
        const caption = fileCaption.value;

        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('caption', caption);
            formData.append('username', uname);

            fetch('/upload', {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    renderMessage("my", {
                        text: caption,
                        username: uname,
                        fileName: file.name,
                        fileSize: (file.size / 1024).toFixed(2),
                        fileType: file.type,
                        fileUrl: data.fileUrl
                    });
                    socket.emit('file', {
                        text: caption,
                        username: uname,
                        fileName: file.name,
                        fileSize: (file.size / 1024).toFixed(2),
                        fileType: file.type,
                        fileUrl: data.fileUrl
                    });
                    fileModal.style.display = 'none';
                    fileInput.value = '';
                    fileCaption.value = '';
                })
                .catch(err => console.error(err));
        }
    });

    socket.on("file", function (message) {
        renderMessage("other", message);
    });

    const emojiButton = document.getElementById('emoji-button');
    const emojiPickerContainer = document.getElementById('emoji-picker-container');

    emojiButton.addEventListener('click', () => {
        if (emojiPickerContainer.style.display === 'none' || emojiPickerContainer.style.display === '') {
            const emojiPicker = new EmojiMart.Picker({
                onEmojiSelect: (emoji) => {
                    messageInput.value += emoji.native;
                },
            });
            emojiPickerContainer.innerHTML = '';
            emojiPickerContainer.appendChild(emojiPicker);
            emojiPickerContainer.style.display = 'block';
        } else {
            emojiPickerContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!emojiPickerContainer.contains(e.target) && !emojiButton.contains(e.target)) {
            emojiPickerContainer.style.display = 'none';
        }
    });

    // Select elements
    const contextMenu = document.getElementById('context-menu');
    const editMessageOption = document.getElementById('edit-message');
    const deleteMessageOption = document.getElementById('delete-message');
    const cancelMenuOption = document.getElementById('cancel-menu');

    let selectedMessage = null; // Track the currently selected message

    // Right-click handler for messages
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target.closest('.message');
        if (target) {
            selectedMessage = target;
            const { clientX: mouseX, clientY: mouseY } = e;
            contextMenu.style.left = `${mouseX}px`;
            contextMenu.style.top = `${mouseY}px`;
            contextMenu.style.display = 'block';
        } else {
            contextMenu.style.display = 'none';
        }
    });

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    cancelMenuOption.addEventListener('click', () => {
        selectedMessage = null;
        contextMenu.style.display = 'none';
    });

    socket.on('edit-message', (data) => {
        const message = document.querySelector(`.message[data-id="${data.id}"]`);
        if (message) {
            message.querySelector('.text').textContent = data.text;
        }
    });

    socket.on('delete-message', (data) => {
        const message = document.querySelector(`.message[data-id="${data.id}"]`);
        if (message) {
            message.remove();
        }
    });


})();
