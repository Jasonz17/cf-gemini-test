import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai"; // 使用正确的库

// 定义HTTP请求处理函数
const handler = async (request: Request): Promise<Response> => {
  if (request.method !== "POST" || new URL(request.url).pathname !== "/generate") {
    return new Response("Not Found", { status: 404 });
  }

  try {
    // 解析前端传入的JSON数据
    const { content, apiKey, model } = await request.json();
    if (!content || !apiKey || !model) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // 初始化Google GenAI客户端
    const ai = new GoogleGenAI({ apiKey });
    const modelInstance = ai.models.get(model);

    // 调用模型生成内容
    const response = await modelInstance.generateContent(content);
    const result = await response.response.json();

    return new Response(JSON.stringify({ text: result.candidates[0].content.parts[0].text }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

// 启动HTTP服务器（Deno Deploy自动分配端口）
serve(handler);
