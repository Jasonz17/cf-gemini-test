// js/middle-area.js

// 存储选中的文件
let selectedFiles = [];

export function initializeMiddleArea() {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const inputContainer = document.getElementById('input-container');
    let filePreviewContainer = document.getElementById('file-preview-container'); // 获取文件预览容器

    console.log('initializeMiddleArea function called');

    // 获取已存在的工具栏元素
    const toolbarLeft = document.querySelector('.toolbar-left');
    console.log('toolbarLeft element:', toolbarLeft);

    // 定义工具图标和提示信息
    const tooltipTexts = {
        'image': '格式支持：PNG, JPEG, WEBP, HEIC, HEIF',
        'document': '格式支持：PDF, TXT, Markdown, CSV, XML',
        'code': '格式支持：JavaScript, Python, HTML, CSS, Markdown, XML',
        'audio': '格式支持：WAV, MP3, AIFF, AAC, OGG Vorbis, FLAC',
        'video': '格式支持：MP4, MPEG, MOV, AVI, X-FLV, WMV, 3GPP, WEBM'
    };

    const tools = ['image', 'document', 'code', 'audio', 'video'].map(type => {
        const icon = document.createElement('button');
        icon.className = 'toolbar-icon';
        icon.type = 'button';
        icon.setAttribute('data-type', type);

        // 创建提示元素
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipTexts[type];

        icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getIconPath(type)}
        </svg>`;

        // 添加提示元素到图标
        icon.appendChild(tooltip);

        return icon;
    });

    // 添加工具图标到左侧容器
    tools.forEach(icon => toolbarLeft.appendChild(icon));
    console.log('Tool icons appended to toolbarLeft');

    // 为每个工具图标添加点击事件
    tools.forEach(icon => {
        icon.addEventListener('click', () => {
            const type = icon.getAttribute('data-type');
            console.log(`${type} button clicked`);
            handleToolClick(type);
        });
    });

    // 添加默认欢迎消息
    const welcomeMessage = {
        type: 'ai',
        content: '你好！我是AI助手，很高兴为您服务。请问有什么我可以帮您的吗？'
    };
    displayMessage(welcomeMessage);

    // 输入框高度自动调整逻辑
    function adjustInputHeight() {
        // 重置高度以正确计算scrollHeight
        userInput.style.height = 'auto';
        // 获取最大高度限制
        const maxHeight = parseInt(getComputedStyle(userInput).maxHeight, 10);
        console.log('当前maxHeight:', maxHeight); // 调试日志
        // 计算高度（最小40px，不超过maxHeight）
        const calculatedHeight = Math.max(userInput.scrollHeight, 40);
        console.log('当前scrollHeight:', userInput.scrollHeight, 'calculatedHeight:', calculatedHeight); // 调试日志
        userInput.style.height = Math.min(calculatedHeight, maxHeight) + 'px';
        console.log('最终设置高度:', userInput.style.height); // 调试日志
        // 控制滚动条显示：当内容超过最大高度时显示
        userInput.style.overflowY = calculatedHeight >= maxHeight ? 'auto' : 'hidden';
        // 自动滚动到底部
        userInput.scrollTop = userInput.scrollHeight;
    }

    // 初始化时调整一次高度
    adjustInputHeight();

    // 监听输入事件调整高度
    userInput.addEventListener('input', adjustInputHeight);

    // 显示消息的函数
    function displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.type);

        if (Array.isArray(message.content)) { // Check if content is an array of parts
            message.content.forEach(part => {
                if (part.type === 'text' && part.content) {
                    const textElement = document.createElement('div');
                    textElement.textContent = part.content;
                    messageElement.appendChild(textElement);
                } else if (part.type === 'file') {
                    const filePreviewElement = document.createElement('div');
                    filePreviewElement.classList.add('chat-file-preview');
                    filePreviewElement.dataset.fileName = part.name;

                    if (part.mimeType.startsWith('image/') && part.previewUrl) {
                        const imgElement = document.createElement('img');
                        imgElement.src = part.previewUrl;
                        filePreviewElement.appendChild(imgElement);
                    } else {
                        const fileNameDiv = document.createElement('div');
                        fileNameDiv.className = 'file-name';
                        fileNameDiv.textContent = part.name;
                        filePreviewElement.appendChild(fileNameDiv);
                    }

                    // 添加放大镜图标容器
                    const viewButton = document.createElement('div');
                    viewButton.className = 'view-file';
                    viewButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'; // 放大镜SVG
                    viewButton.addEventListener('click', () => {
                        // TODO: Implement file detail viewing logic
                        console.log('View file clicked:', part.name);
                        alert(`查看文件详情功能待实现：${part.name}`);
                    });
                    filePreviewElement.appendChild(viewButton);

                    messageElement.appendChild(filePreviewElement);
                } else if (part.inlineData) {
                    const imgElement = document.createElement('img');
                    imgElement.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    imgElement.style.maxWidth = '100%'; // Optional: style the image
                    imgElement.style.height = 'auto'; // Optional: style the image
                    messageElement.appendChild(imgElement);
                }
            });
        } else if (typeof message.content === 'string') {
            // Handle plain text response (for backward compatibility or non-image models)
            messageElement.textContent = message.content;
        }

        chatDisplay.appendChild(messageElement);
        // 滚动到最新消息
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    // 添加发送按钮的点击事件
    const sendButton = document.querySelector('.send-button');
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }

    // 添加键盘事件监听
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // 创建文件预览容器 (如果不存在)
    if (!filePreviewContainer) {
        const newFilePreviewContainer = document.createElement('div');
        newFilePreviewContainer.id = 'file-preview-container';
        inputContainer.insertBefore(newFilePreviewContainer, inputContainer.firstChild);
        // 更新 filePreviewContainer 变量以引用新创建的元素
        filePreviewContainer = newFilePreviewContainer;
        // 初始隐藏容器
        filePreviewContainer.style.display = 'none';
    } else {
         // 初始隐藏容器
        filePreviewContainer.style.display = 'none';
    }

    // 文件类型映射
    const fileTypeMap = {
        'image': '.png,.jpg,.jpeg,.webp,.heic,.heif',
        'document': '.pdf,.txt,.md,.csv,.xml',
        'code': '.js,.py,.html,.css,.md,.xml',
        'audio': '.wav,.mp3,.aiff,.aac,.ogg,.flac',
        'video': '.mp4,.mpeg,.mov,.avi,.flv,.wmv,.3gp,.webm'
    };

    // 处理工具按钮点击
    function handleToolClick(type) {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = fileTypeMap[type];
        fileInput.multiple = true;

        // 触发文件选择
        fileInput.click();

        // 处理文件选择
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                // 将文件添加到 selectedFiles 数组
                selectedFiles.push(file);

                // 检查文件名长度（假设一个中文字符占2个字节）
                const fileName = file.name;
                const displayName = fileName.length > 16 ? fileName.substring(0, 16) + '...' : fileName;

                // 创建预览项容器
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                // 存储文件对象或其索引，以便移除时使用
                previewItem.dataset.fileName = fileName; // 使用文件名作为标识

                if (type === 'image') {
                    // 图片预览
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    previewItem.appendChild(img);
                } else {
                    // 文件名显示
                    const fileNameDiv = document.createElement('div');
                    fileNameDiv.className = 'file-name';
                    fileNameDiv.textContent = displayName;
                    previewItem.appendChild(fileNameDiv);
                }

                // 添加删除按钮
                const removeButton = document.createElement('div');
                removeButton.className = 'remove-file';
                removeButton.innerHTML = '×';
                removeButton.addEventListener('click', () => {
                    // 从 selectedFiles 数组中移除文件
                    selectedFiles = selectedFiles.filter(f => f.name !== file.name);
                    previewItem.remove();
                    // 如果文件列表为空，隐藏预览容器
                    if (selectedFiles.length === 0) {
                        filePreviewContainer.style.display = 'none';
                    }
                });
                previewItem.appendChild(removeButton);

                // 添加到预览容器
                filePreviewContainer.appendChild(previewItem);
            });
            // 如果文件列表不为空，显示预览容器
            if (selectedFiles.length > 0) {
                filePreviewContainer.style.display = 'flex';
            }
        });
    }

    // 处理发送消息
    async function handleSendMessage() {
        const messageText = userInput.value.trim();

        // 只有当有文本或有文件时才发送消息
        if (messageText || selectedFiles.length > 0) {
            // 构建用户消息内容，包含文本和文件信息
            const userMessageContent = [];
            if (messageText) {
                userMessageContent.push({ type: 'text', content: messageText });
            }

            // 添加文件信息到用户消息内容
            selectedFiles.forEach(file => {
                userMessageContent.push({
                    type: 'file',
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    // 对于图片，可以包含一个预览URL
                    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                });
            });

            // 显示用户消息
            if (userMessageContent.length > 0) {
                 displayMessage({
                    type: 'user',
                    content: userMessageContent
                });
            }

            // 获取选中的模型
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect.value;

            // 构建 FormData
            const formData = new FormData();
            formData.append('model', selectedModel); // 使用选中的模型
            const apiKeyInput = document.getElementById('api-key-input');
            const apiKey = apiKeyInput ? apiKeyInput.value : ''; // 从输入框获取 API 密钥，如果输入框不存在则为空字符串
            formData.append('apikey', apiKey); // 使用获取的 API 密钥
            formData.append('input', messageText); // 用户输入作为内容

            // 添加文件到 FormData
            selectedFiles.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });

            // 清空输入框和文件预览
            userInput.value = '';
            adjustInputHeight();
            filePreviewContainer.innerHTML = ''; // 清空预览容器
            selectedFiles = []; // 清空文件数组
            // 清空文件后隐藏预览容器
            filePreviewContainer.style.display = 'none';

            // 禁用发送按钮并显示加载状态
            sendButton.disabled = true;
            sendButton.classList.add('loading'); // 添加一个loading class用于样式控制

            // 调用后端 API
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    // 当使用 FormData 时，浏览器会自动设置 Content-Type 为 multipart/form-data
                    // headers: { 'Content-Type': 'application/json' }, // 不需要手动设置
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const aiResponse = await response.json();
                displayMessage({
                    type: 'ai',
                    content: aiResponse
                });

            } catch (error) {
                console.error('Error fetching AI response:', error);
                displayMessage({
                    type: 'ai',
                    content: `发生错误: ${error.message}`
                });
            } finally {
                // 重新启用发送按钮并移除加载状态
                sendButton.disabled = false;
                sendButton.classList.remove('loading');
            }
        }
    }

    // 获取SVG图标路径
    function getIconPath(type) {
        const paths = {
            image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
            document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
            code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
            audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
            video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'            
        };
        return paths[type] || '';
    }

    // TODO: Implement displaying chat messages
    // TODO: Implement handling file previews
}
