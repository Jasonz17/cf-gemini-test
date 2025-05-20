import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai"; // 使用正确的库

serve(async (req) => {
  const url = new URL(req.url);

  // 处理根路径的 GET 请求，返回 index.html
  if (req.method === "GET" && url.pathname === "/") {
    try {
      const htmlContent = await Deno.readTextFile("./index.html");
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("Error reading index.html:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 只处理根路径的 POST 请求
  if (req.method !== "POST" || url.pathname !== "/") {
    return new Response("Not Found", { status: 404 });
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
});
