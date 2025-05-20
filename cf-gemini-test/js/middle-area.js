// js/middle-area.js

import { initializeChatDisplay } from './middle-area-up.js';
import { initializeInputArea } from './middle-area-down.js';

// 初始化中间区域
export function initializeMiddleArea() {
    // 初始化聊天显示区域
    const chatDisplay = initializeChatDisplay();
    
    // 初始化输入区域，传入displayMessage函数
    initializeInputArea((message) => {
        // 将chatDisplay作为参数传递给displayMessage
        displayMessage(message, chatDisplay);
    });
}