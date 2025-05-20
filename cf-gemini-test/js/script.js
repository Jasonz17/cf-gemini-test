// js/script.js

// 移除右面板相关引用
import { initializeTopArea } from './top-area.js';
import { initializeLeftSidebar } from './left-sidebar.js';
import { initializeMiddleArea } from './middle-area.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeTopArea();
    initializeLeftSidebar();
    initializeMiddleArea();
});