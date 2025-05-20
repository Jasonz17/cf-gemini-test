// main.ts - Deno HTTP proxy with Static File Serving

import { serve } from "https://deno.land/std@0.211.0/http/server.ts";
// 确保 GoogleGenerativeAI 导入正确，根据你的 npm install 情况确认路径
import { GoogleGenerativeAI, Part, GenerativeContentBlob, Content, GenerationConfig } from "npm:@google/generative-ai";
// 导入用于处理文件路径和提供静态文件的模块
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.211.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.211.0/http/file_server.ts";

// 获取当前脚本所在的目录
const __dirname = dirname(fromFileUrl(import.meta.url));

// CORS处理函数，主要用于 /process API 响应
function fixCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  // Also add CORS headers to potential error responses from serveFile for consistency
  // Note: serveFile might already add some headers, be careful not to override needed ones
  // Simple approach: always apply fixCors to API responses, let serveFile handle static files
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

// OPTIONS请求处理函数，用于CORS预检请求
function handleOPTIONS(request: Request): Response {
  console.log(`Handling OPTIONS request from: ${request.headers.get("Origin")}`);
  return new Response(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// 主请求处理函数
async function handler(request: Request): Promise<Response> {
  // 优先处理 OPTIONS 请求
  if (request.method === "OPTIONS") {
    return handleOPTIONS(request);
  }

  console.log(`Received request: ${request.method} ${request.url}`);

  const url = new URL(request.url);
  const pathname = url.pathname;

  // --- 1. 处理 API 代理请求 ---
  if (pathname === "/process") {
      if (request.method !== "POST") {
           console.log(`Method not allowed for /process: ${request.method}`);
           return fixCors(new Response("Method Not Allowed", { status: 405 }));
      }

      let requestBody;
      try {
          requestBody = await request.json();
      } catch (error) {
          console.error("Error parsing request body:", error);
          return fixCors(new Response("Invalid JSON in request body", { status: 400 }));
      }

      // ** 修改：接收前端发送的包含历史和当前消息的 contents 数组 **
      const { apikey, model, contents } = requestBody; // 现在期望接收 contents 数组

      // ** 修改：检查必要的字段，特别是 contents 数组 **
      if (!apikey || !model || !contents || !Array.isArray(contents) || contents.length === 0) {
          console.error("Missing or invalid required parameters: apikey, model, or contents array.");
          return fixCors(new Response("Missing or invalid required parameters: apikey, model, or contents array.", { status: 400 }));
      }

      // --- Google AI API 调用逻辑 ---
      let genAI;
      try {
          genAI = new GoogleGenerativeAI(apikey);
          console.log("GoogleGenerativeAI client initialized.");
      } catch (error) {
          console.error("Error initializing GoogleGenerativeAI client:", error);
           // Return 401 for API Key issues during client initialization
           return fixCors(new Response(JSON.stringify({ error: { message: "Invalid API Key or failed to initialize Google AI client." } }, null, 2), {
               status: 401, // Unauthorized
               headers: { "Content-Type": "application/json" },
           }));
      }

      let apiResponse;
      try {
          const generativeModel = genAI.getGenerativeModel({ model });
          console.log(`Attempting to call model: ${model}`);

          // ** 修改：直接将前端提供的 contents 数组传递给 generateContent **
          // 前端现在负责构建包含历史和当前消息的 contents 数组
          // 后端不再需要从 input 和 files 构建 parts
          console.log("Calling generativeModel.generateContent with provided contents.");
          const result = await generativeModel.generateContent({
              contents: contents, // Use the contents array directly
              generationConfig: {
                  // Optional: add common generation configs here if not sent from frontend
                  // e.g., temperature, topK, topP
              },
          });
          console.log("[INFO] Google AI generateContent call finished.");
          apiResponse = result.response;

           // --- 处理 Prompt Feedback (Safety) ---
           if (apiResponse?.promptFeedback?.blockReason) {
               console.warn(`Prompt blocked. Reason: ${apiResponse.promptFeedback.blockReason}`);
               // Return 400 for prompt issues flagged by the API
               return fixCors(new Response(JSON.stringify({
                   error: {
                       message: `Prompt blocked by safety settings: ${apiResponse.promptFeedback.blockReason}`,
                       safetyRatings: apiResponse.promptFeedback.safetyRatings,
                       code: 400,
                   }
               }, null, 2), {
                   status: 400,
                   headers: { "Content-Type": "application/json" },
               }));
           }


          // --- 处理 API 响应内容 ---
          // 检查 candidates
          if (!apiResponse?.candidates || apiResponse.candidates.length === 0) {
              console.error("API call failed: No candidates found in response.", JSON.stringify(apiResponse));
               // Attempt to extract more specific error from API response structure
               const errorDetails = apiResponse?.promptFeedback?.blockReason ? `Blocked: ${apiResponse.promptFeedback.blockReason}` : 'No candidates returned.';
              return fixCors(new Response(JSON.stringify({ error: { message: `API call failed: ${errorDetails}` } }, null, 2), {
                  status: 500, // Internal server error or bad gateway depending on upstream failure
                  headers: { "Content-Type": "application/json" },
              }));
          }

          const candidate = apiResponse.candidates[0];
          if (!candidate?.content?.parts) {
               console.error("API call failed: No content parts found in candidate.", JSON.stringify(candidate));
               return fixCors(new Response(JSON.stringify({ error: { message: "API call failed: Invalid response structure from Google AI." } }, null, 2), {
                   status: 500,
                   headers: { "Content-Type": "application/json" },
               }));
          }

           // 提取文本和图片 Parts
           const responseTextParts = candidate.content.parts.filter(part => part.text !== undefined && part.text !== null);
           const responseImageParts = candidate.content.parts.filter(part => part.inlineData);

           const responseText = responseTextParts.map(part => part.text).join('');
           const responseImages = responseImageParts.map(part => {
               // Reconstruct Data URL for images
               const mimeType = part.inlineData?.mimeType || 'image/png'; // Default mime type
               const base64Data = part.inlineData?.data;
               if (base64Data) {
                   return `data:${mimeType};base64,${base64Data}`;
               }
               console.warn("Skipping image part with no data:", part);
               return null; // Skip invalid image parts
           }).filter(url => url !== null) as string[]; // Filter out nulls and assert string array

           console.log(`API call successful. Response: Text length ${responseText.length}, Images ${responseImages.length}.`);

           // --- 返回前端友好的格式 (包含 text 和 images 字段) ---
           const unifiedResponse = {
               text: responseText,
               images: responseImages,
               model: model, // Include model name for frontend reference
               created: Math.floor(Date.now() / 1000), // Timestamp
               finishReason: candidate.finishReason, // API finish reason
               // Include safety ratings if needed for display
               // safetyRatings: apiResponse?.promptFeedback?.safetyRatings,
               // usage: apiResponse.usageMetadata, // Optional: Include usage info
           };


           return fixCors(new Response(JSON.stringify(unifiedResponse, null, 2), {
               status: 200,
               headers: { "Content-Type": "application/json" },
           }));


      } catch (error) { // 捕获 Google AI API 调用过程中的错误
          console.error("Error calling Google AI API:", error);
          let errorMessage = "An internal error occurred while calling Google AI API.";
          let statusCode = 500;

          // Attempt to extract more detailed information from the error object
          if (error instanceof Error) {
              errorMessage = error.message;
              // Check for specific properties used by google-generative-ai errors
              if ('status' in error && typeof (error as any).status === 'number') {
                  statusCode = (error as any).status;
              } else if ('code' in error && typeof (error as any).code === 'number') {
                  statusCode = (error as any).code;
              }
               if ((error as any).name === 'GoogleGenerativeAIApiError' && (error as any).response?.status) {
                  statusCode = (error as any).response.status;
               }

              // Based on specific error message content
              const lowerErrorMessage = errorMessage.toLowerCase();
              if (lowerErrorMessage.includes('timeout') || (error as any).name === 'AbortError') {
                  statusCode = 408; // Request Timeout
              } else if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('connection')) {
                  statusCode = 503; // Service Unavailable or Gateway Timeout
              } else if (lowerErrorMessage.includes('api key') || statusCode === 401) {
                  statusCode = 401; // Unauthorized
                  errorMessage = "Invalid API Key or insufficient permissions.";
               } else if (statusCode >= 400 && statusCode < 500) {
                    // Propagate client errors from API if status is available
               } else {
                   statusCode = 500; // Default to internal server error
               }
               // In development/debugging, uncomment below for more details:
               // errorMessage = `${errorMessage} | Details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;

          } else if (typeof error === 'object' && error !== null && 'message' in error) {
               errorMessage = (error as any).message;
               if ('status' in error && typeof (error as any).status === 'number') {
                   statusCode = (error as any).status;
               } else if ('code' in error && typeof (error as any).code === 'number') {
                   statusCode = (error as any).code;
               }
               const lowerErrorMessage = errorMessage.toLowerCase();
               if (lowerErrorMessage.includes('timeout')) { statusCode = 408; }
               else if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('connection')) { statusCode = 503; }
               else if (lowerErrorMessage.includes('api key') || statusCode === 401) { statusCode = 401; errorMessage = "Invalid API Key or insufficient permissions."; }
                else if (statusCode >= 400 && statusCode < 500) {}
               else { statusCode = 500; }
               // In development/debugging, uncomment below for more details:
               // errorMessage = `${errorMessage} | Details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;

          } else if (typeof error === 'string') {
              errorMessage = error;
              const lowerErrorMessage = errorMessage.toLowerCase();
              if (lowerErrorMessage.includes('timeout')) { statusCode = 408; }
              else if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('connection')) { statusCode = 503; }
               else if (lowerErrorMessage.includes('api key') || statusCode === 401) { statusCode = 401; errorMessage = "Invalid API Key or insufficient permissions."; }
          } else {
              console.error("Unknown error type:", error);
              errorMessage = "An unexpected error occurred.";
          }

          console.error(`Returning error response: Status ${statusCode}, Message: ${errorMessage}`);
          return fixCors(new Response(JSON.stringify({ error: { message: `API call failed: ${errorMessage}`, code: statusCode } }, null, 2), {
              status: statusCode,
              headers: { "Content-Type": "application/json" },
          }));
      }
      // --- 结束 Google AI API 调用逻辑 ---
  }

  // --- 2. 处理静态文件请求 ---
  // 如果请求路径不是 /process，尝试将其作为静态文件来服务
  try {
      // 将根路径 '/' 映射到 'index.html'，其他路径移除开头的 '/'
      const filename = pathname === '/' ? 'index.html' : pathname.substring(1);
      // 构建文件在文件系统中的完整路径
      const filePath = join(__dirname, filename);

      // 使用 serveFile 实用函数来处理文件服务。
      // serveFile 会自动处理文件读取、MIME类型设置、Etag缓存等。
      // 如果文件存在并成功读取，它会返回一个 Response 对象。
      // 如果文件不存在，它会抛出一个 NotFound 错误。
      console.log(`Attempting to serve static file: ${filePath}`);
      const fileResponse = await serveFile(request, filePath); // Use the original request object
      console.log(`Served static file: ${filePath}`);
      // Static files usually don't need CORS headers if served from the same origin
      // If frontend and backend are on different origins and static files need CORS,
      // uncomment the line below.
      // return fixCors(fileResponse); // If static files need CORS
      return fileResponse; // Normal case
  } catch (error) {
      // If serveFile throws NotFound error or other errors (like permission issues)
      // Return 404 Not Found for NotFound errors specifically
      if (error instanceof Deno.errors.NotFound) {
          console.warn(`Static file not found: ${pathname}`);
          return new Response("Not Found", { status: 404 });
      } else {
          // Log other errors and return 500
          console.error(`Error serving static file ${pathname}:`, error);
          return new Response("Internal Server Error", { status: 500 });
      }
  }

}

console.log("Gemini simple proxy server starting...");
// On Deno Deploy, no need to specify hostname and port
// For local run, you might want to specify { port: 8000 }
serve(handler);
console.log("Gemini simple proxy server listening for requests.");
