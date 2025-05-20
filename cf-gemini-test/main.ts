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
      const { model, apikey, input } = await req.json();

      if (!model || !apikey || !input) {
        return new Response("Missing model, apikey, or input in request body", { status: 400 });
      }

      const ai = new GoogleGenAI({ apiKey: apikey });

      const response = await ai.models.generateContent({
        model: model,
        contents: input,
      });

      return new Response(response.text, {
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
