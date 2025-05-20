// js/middle-area.js

import { initializeChatDisplay } from './middle-area-up.js';
import { initializeInputArea } from './middle-area-down.js';

export function initializeMiddleArea() {
    // 初始化聊天显示区域
    const chatDisplay = initializeChatDisplay();
    
    // 初始化输入区域，传入displayMessage函数用于显示消息
    initializeInputArea((message) => {
        const chatDisplay = document.getElementById('chat-display');
        displayMessage(message, chatDisplay);
    });
}