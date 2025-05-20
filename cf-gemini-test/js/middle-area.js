import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI, Modality } from "npm:@google/genai"; // 使用正确的库
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

      // 检查输入是否为图片 URL
      const imageUrlRegex = /^(http(s?):)([/|.][\w\s-])*\.(?:jpg|jpeg|gif|png|webp|heic|heif)$/i;
      if (inputText && imageUrlRegex.test(inputText.toString())) {
        // 如果是图片 URL，添加到 contents 数组
        const imageUrl = inputText.toString();
        // 尝试从 URL 推断 MIME 类型，或者使用默认值
        const mimeType = imageUrl.split('.').pop()?.toLowerCase() === 'jpg' ? 'image/jpeg' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'jpeg' ? 'image/jpeg' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'png' ? 'image/png' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'gif' ? 'image/gif' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'webp' ? 'image/webp' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'heic' ? 'image/heic' :
                         imageUrl.split('.').pop()?.toLowerCase() === 'heif' ? 'image/heif' :
                         'image/*'; // 默认或未知类型

        contents.push({
          fileData: {
            mimeType: mimeType,
            uri: imageUrl,
          },
        });
      } else if (inputText) {
        // 如果不是图片 URL，作为文本添加
        contents.push({ text: inputText.toString() });
      }

      // 添加文件部分 (处理上传的文件)
      const fileEntries = Array.from(formData.entries()).filter(([key, value]) => value instanceof File);

      for (const [key, file] of fileEntries) {
        if (file instanceof File) {
          const fileSizeLimit = 20 * 1024 * 1024; // 20MB

          try {
            if (file.size <= fileSizeLimit) {
              // 小于等于 20MB，使用 base64 编码
              // 小于等于 20MB，使用 base64 编码
              const fileBuffer = await file.arrayBuffer();
              // 使用 TextDecoder 和 btoa 进行 base64 编码，避免栈溢出
              const uint8Array = new Uint8Array(fileBuffer);
              let binaryString = '';
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              const base64Data = btoa(binaryString);

              contents.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              });
            } else {
              // 大于 20MB，使用文件上传 API
              console.log(`Uploading large file: ${file.name}`);
              const uploadResult = await ai.uploadFile(file, {
                mimeType: file.type,
                displayName: file.name,
              });
              console.log(`Upload complete for ${file.name}, URI: ${uploadResult.file.uri}`);

              contents.push({
                fileData: {
                  mimeType: file.type,
                  uri: uploadResult.file.uri,
                },
              });
            }
          } catch (fileProcessError) {
            console.error(`Error processing file ${file.name}:`, fileProcessError);
            // 尝试打印更详细的错误信息，如果 fileProcessError 是一个 Error 对象
            if (fileProcessError instanceof Error) {
                console.error(`Error details: ${fileProcessError.message}`);
                if (fileProcessError.stack) {
                    console.error(`Error stack: ${fileProcessError.stack}`);
                }
            }
            // 如果错误对象有其他属性，也可以尝试打印
            console.error(`Full error object:`, JSON.stringify(fileProcessError, null, 2));

            return new Response(`Error processing file: ${file.name}`, { status: 500 });
          }
        }
      }

      if (contents.length === 0) {
         return new Response("No text or files provided", { status: 400 });
      }

      // 调用 Gemini API
      const config: any = {};
      if (model === 'gemini-2.0-flash-preview-image-generation') {
        config.responseModalities = [Modality.TEXT, Modality.IMAGE];
      }

      const result = await ai.models.generateContent({
        model: model.toString(),
        contents: contents,
        config: config,
      });

      // 处理响应，检查文本和图片部分
      if (result && result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts) {
        const parts = result.candidates[0].content.parts;
        let responseContent = '';
        let imageData = null;

        for (const part of parts) {
          if (part.text) {
            responseContent += part.text + '\n';
          } else if (part.inlineData) {
            // 找到图片数据，这里只记录，后续需要修改前端来处理
            console.log('Received image data:', part.inlineData.mimeType);
            // For now, just indicate that image data was received
            responseContent += `[Image data received: ${part.inlineData.mimeType}]\n`;
            imageData = part.inlineData; // Store image data if needed later
          }
        }

        if (parts.length > 0) {
           // Return the parts array as JSON
           return new Response(JSON.stringify(parts), {
             headers: { "Content-Type": "application/json" },
           });
        } else {
           return new Response("Received empty response from AI", { status: 500 });
        }

      } else {
        console.error("Unexpected API response structure:", JSON.stringify(result, null, 2));
        return new Response("Error: Unexpected API response structure", { status: 500 });
      }

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
