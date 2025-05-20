import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai"; // 使用正确的库
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

// 获取当前脚本所在的目录
const __dirname = dirname(fromFileUrl(import.meta.url));

serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // --- 1. 处理 API 代理请求 ---
  // 只处理 /process 的 POST 请求
  if (pathname === "/process") {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      // 解析 FormData
      const formData = await req.formData();
      const model = formData.get('model');
      const apikey = formData.get('apikey');
      const inputText = formData.get('input');

      if (!model || !apikey) {
        return new Response("Missing model or apikey in request body", { status: 400 });
      }

      const ai = new GoogleGenAI({ apiKey: apikey.toString() });

      // 构建内容数组
      const contents = [];

      // 添加文本部分
      if (inputText) {
        contents.push({ text: inputText.toString() });
      }

      // 添加文件部分
      const fileEntries = Array.from(formData.entries()).filter(([key, value]) => value instanceof File);

      for (const [key, file] of fileEntries) {
        if (file instanceof File) {
          try {
            // 将文件上传到 Google AI Platform
            const uploadedFile = await ai.files.upload({
              file: file,
            });
            console.log(`Uploaded file ${file.name} with URI: ${uploadedFile.uri}`);

            // 创建文件内容部分
            contents.push({
              fileData: {
                mimeType: uploadedFile.mimeType,
                uri: uploadedFile.uri,
              },
            });
          } catch (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            return new Response(`Error uploading file: ${file.name}`, { status: 500 });
          }
        }
      }

      if (contents.length === 0) {
         return new Response("No text or files provided", { status: 400 });
      }

      // 调用 Gemini API
      const result = await ai.models.generateContent({
        model: model.toString(),
        contents: contents,
      });

      // 获取并返回文本响应
      const responseText = result.response.text();

      return new Response(responseText, {
        headers: { "Content-Type": "text/plain" },
      });

    } catch (error) {
      console.error("Error processing request:", error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
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
    const fileResponse = await serveFile(req, filePath); // Use the original request object
    console.log(`Served static file: ${filePath}`);
    return fileResponse;
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
});
