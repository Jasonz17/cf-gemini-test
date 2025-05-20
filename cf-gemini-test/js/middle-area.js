// js/middle-area.js

export function initializeMiddleArea() {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const inputContainer = document.getElementById('input-container');
    
    // 获取已存在的工具栏元素
    const toolbarLeft = document.querySelector('.toolbar-left');
    
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
        messageElement.textContent = message.content;
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

    // 创建文件预览容器
    const filePreviewContainer = document.createElement('div');
    filePreviewContainer.id = 'file-preview-container';
    inputContainer.insertBefore(filePreviewContainer, inputContainer.firstChild);

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
                // 检查文件名长度（假设一个中文字符占2个字节）
                const fileName = file.name;
                const displayName = fileName.length > 16 ? fileName.substring(0, 16) + '...' : fileName;
                
                // 创建预览项容器
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
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
                    previewItem.remove();
                    // 这里可以添加从已选文件列表中移除文件的逻辑
                });
                previewItem.appendChild(removeButton);
                
                // 添加到预览容器
                filePreviewContainer.appendChild(previewItem);
            });
        });
    }

    // 处理发送消息
    function handleSendMessage() {
        const messageText = userInput.value.trim();
        if (messageText) {
            // 显示用户消息
            displayMessage({
                type: 'user',
                content: messageText
            });
            // 清空输入框
            userInput.value = '';
            // 重置输入框高度
            adjustInputHeight();
            
            // 调用后端 API
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gemini-2.0-flash', // 使用默认模型
                        apikey: 'AIzaSyCfZk7O-XTcm20GHvht85goeS2Irwtb4jw', // 使用指定的 API 密钥
                        input: messageText // 用户输入作为内容
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const aiResponseText = await response.text();
                displayMessage({
                    type: 'ai',
                    content: aiResponseText
                });

            } catch (error) {
                console.error('Error fetching AI response:', error);
                displayMessage({
                    type: 'ai',
                    content: `发生错误: ${error.message}`
                });
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
