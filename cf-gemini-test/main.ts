import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai"; // 使用正确的库
import { dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

// CORS处理函数
function fixCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, { status: response.status, headers });
}

// OPTIONS请求处理函数
function handleOPTIONS(): Response {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  }});
}

// 定义HTTP请求处理函数
const handler = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return handleOPTIONS();
  if (request.method !== "POST" || new URL(request.url).pathname !== "/generate") {
    return fixCors(new Response("Not Found", { status: 404 }));
  }

  try {
    // 解析前端传入的JSON数据
    const { content, apiKey, model, temperature, streaming } = await request.json();
if (!content || !apiKey || !model || typeof content !== "string") {
  console.error("Missing or invalid parameters: content must be string, apiKey and model required");
  return fixCors(new Response("Missing or invalid required parameters", { status: 400 }));
}

    // 初始化Google GenAI客户端
    const ai = new GoogleGenAI({ apiKey });
    const modelInstance = ai.models.get(model);

    // 调用模型生成内容
    const response = await modelInstance.generateContent(content);
    const result = await response.response.json();

    const candidate = result.candidates[0];
const text = candidate?.content?.parts?.[0]?.text || "";
const images = candidate?.content?.parts?.filter(p => p.inlineData)?.map(p => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`) || [];
return fixCors(new Response(JSON.stringify({ text, images, model }), {
  status: 200,
  headers: { "Content-Type": "application/json" }
}));
  } catch (error) {
  console.error("Error processing request:", error);
  let status = 500;
  let message = "Internal Server Error";
  if (error instanceof Error) {
    message = error.message;
    if (error.message.includes("API Key")) status = 401;
    else if (error.message.includes("timeout")) status = 408;
  }
  return fixCors(new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } }));
}
};

// 启动HTTP服务器（Deno Deploy自动分配端口）
serve(handler);
