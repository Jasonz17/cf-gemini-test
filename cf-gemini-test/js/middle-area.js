// js/middle-area.js

// 存储选中的文件
let selectedFiles = [];

export function initializeMiddleArea() {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const inputContainer = document.getElementById('input-container');
    
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
                if (part.text) {
                    const textElement = document.createElement('div');
                    textElement.textContent = part.text;
                    messageElement.appendChild(textElement);
                } else if (part.inlineData) {
                    const imgElement = document.createElement('img');
                    imgElement.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    imgElement.style.maxWidth = '100%'; // Optional: style the image
                    imgElement.style.height = 'auto'; // Optional: style the image
                    messageElement.appendChild(imgElement);
                }
            });
        } else {
            // Handle plain text response (for backward compatibility or non-image models)
            messageElement.textContent = message.content;
        }

        chatDisplay.appendChild(messageElement);

        // 如果消息包含文件，显示文件预览
        if (message.files && message.files.length > 0) {
            const filePreviewContainer = document.createElement('div');
            filePreviewContainer.classList.add('message-file-preview-container');

            message.files.forEach(file => {
                const previewItem = document.createElement('div');
                previewItem.classList.add('message-preview-item');

                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    previewItem.appendChild(img);
                } else {
                    const fileNameDiv = document.createElement('div');
                    fileNameDiv.classList.add('message-file-name');
                    fileNameDiv.textContent = file.name;
                    previewItem.appendChild(fileNameDiv);
                }
                filePreviewContainer.appendChild(previewItem);
                filePreviewContainer.style.display = 'flex';
            });
            // 将文件预览容器添加到聊天显示区域，位于消息元素下方
            chatDisplay.appendChild(filePreviewContainer);
        }

        // 滚动到最新消息
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    // 初始化流式响应状态
    let isStreamMode = false;
    
    // 添加流式响应开关按钮的点击事件
    const streamToggle = document.querySelector('.stream-toggle');
    if (streamToggle) {
        streamToggle.addEventListener('click', () => {
            isStreamMode = !isStreamMode;
            streamToggle.classList.toggle('active');
        });
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
    filePreviewContainer.style.display = 'none'; // 初始隐藏
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
                    // 检查是否还有文件，没有则隐藏预览容器
                    if (selectedFiles.length === 0) {
                        filePreviewContainer.style.display = 'none';
                    }
                });
                previewItem.appendChild(removeButton);
                
                // 添加到预览容器
                filePreviewContainer.appendChild(previewItem);
                filePreviewContainer.style.display = 'flex';
            });
        });
    }

    // 存储当前请求的控制器
    let currentController = null;

    // 处理发送消息
    async function handleSendMessage() {
        const messageText = userInput.value.trim();
        const sendButton = document.querySelector('.send-button');
        
        // 如果当前有请求在进行中，则中断请求
        if (currentController) {
            currentController.abort();
            currentController = null;
            sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>`;
            return;
        }
        
        // 只有当有文本或有文件时才发送消息
        if (messageText || selectedFiles.length > 0) {
            // 显示用户消息
            if (messageText) {
                displayMessage({
                    type: 'user',
                    content: messageText,
                    files: selectedFiles // 添加文件到消息对象
                });
            }
           


            // 获取选中的模型
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect.value;

            // 构建 FormData
            const formData = new FormData();
            formData.append('model', selectedModel); // 使用选中的模型
            formData.append('apikey', 'AIzaSyCfZk7O-XTcm20GHvht85goeS2Irwtb4jw'); // 使用指定的 API 密钥
            formData.append('input', messageText); // 用户输入作为内容
            formData.append('stream', streamToggleStatus.toString()); // 添加流式响应标志

            // 添加文件到 FormData
            selectedFiles.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });

            // 清空输入框和文件预览
            userInput.value = '';
            adjustInputHeight();
            filePreviewContainer.innerHTML = ''; // 清空预览容器
            selectedFiles = []; // 清空文件数组
            filePreviewContainer.style.display = 'none'; // 无文件时隐藏预览容器
            
            // 创建新的 AbortController
            currentController = new AbortController();
            
            // 更改发送按钮为终止图标
            sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>`;

            // 创建AI消息元素
            const aiMessageElement = document.createElement('div');
            aiMessageElement.classList.add('message', 'ai');
            chatDisplay.appendChild(aiMessageElement);



            // 调用后端 API
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    signal: currentController.signal,
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                if (isStreamMode) {
                    // 流式处理响应
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let accumulatedContent = '';

                    while (true) {
                        const {value, done} = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value, {stream: true});
                        // 处理每个JSON行
                        const lines = chunk.split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            try {
                                const parts = JSON.parse(line);
                                // 处理文本和图片内容
                                parts.forEach(part => {
                                    if (part.text) {
                                        accumulatedContent += part.text;
                                    } else if (part.inlineData) {
                                        // 处理图片数据
                                        const imgElement = document.createElement('img');
                                        imgElement.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                                        imgElement.style.maxWidth = '100%';
                                        imgElement.style.height = 'auto';
                                        aiMessageElement.appendChild(imgElement);
                                    }
                                });
                            } catch (e) {
                                console.error('Error parsing JSON chunk:', e);
                            }
                        }
                        
                        // 更新文本内容
                        if (accumulatedContent) {
                            aiMessageElement.textContent = accumulatedContent;
                        }
                        // 滚动到最新消息
                        chatDisplay.scrollTop = chatDisplay.scrollHeight;
                    }
                } else {
                    // 非流式处理
                    const parts = await response.json();
                    // 处理文本和图片内容
                    parts.forEach(part => {
                        if (part.text) {
                            aiMessageElement.textContent = part.text;
                        } else if (part.inlineData) {
                            const imgElement = document.createElement('img');
                            imgElement.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            imgElement.style.maxWidth = '100%';
                            imgElement.style.height = 'auto';
                            aiMessageElement.appendChild(imgElement);
                        }
                    });
                }

                // 重置发送按钮图标和控制器
                currentController = null;
                sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>`;

            } catch (error) {
                console.error('Error fetching AI response:', error);
                // 只有在不是用户主动取消的情况下才显示错误消息
                if (error.name !== 'AbortError') {
                    displayMessage({
                        type: 'ai',
                        content: `发生错误: ${error.message}`
                    });
                }
                
                // 重置发送按钮图标和控制器
                currentController = null;
                sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>`;
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