import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai"; // 使用正确的库

// 定义请求处理函数
async function handler(req: Request): Promise<Response> {
  // 只处理 POST 请求
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 解析请求体为 JSON
    const { model, apikey, input } = await req.json();

    // 检查是否提供了所有必需的字段
    if (!model || !apikey || !input) {
      return new Response("Missing required fields: model, apikey, or input", { status: 400 });
    }

    // 使用提供的 apikey 初始化 GoogleGenAI
    const ai = new GoogleGenAI({ apiKey: apikey }); // 使用正确的类名和初始化方式

    // 发送内容给模型并生成响应
    const result = await ai.models.generateContent({ // 使用正确的调用路径和参数结构
      model: model,
      contents: input,
    });    console.log("Full result object:", result);
    // 提取响应文本，根据实际返回结构调整
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response("Failed to extract response text from model result", { status: 500 });
    }

    // 返回模型的响应文本
    return new Response(responseText, {
      headers: { "content-type": "text/plain" },
    });

  } catch (error) {
    console.error("Error processing request:", error);
    // 返回错误信息
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}

// 启动 HTTP 服务器，监听在 8000 端口
console.log("Listening on http://localhost:8000/");
serve(handler, { port: 8000 });