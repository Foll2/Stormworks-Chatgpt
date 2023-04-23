import http from 'http';
import url from 'url';
import 'dotenv/config';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_ACCESS_TOKEN,
});

const openai = new OpenAIApi(configuration);

let conversationLog = [{ role: "system", content: "You are a friendly chatbot that can only write very short text/messages.",}];

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const paramValue = parsedUrl.query.param.split(":");
  const formated = paramValue[0] + ":" + " " + paramValue[1]
  
    conversationLog.push({
        role: "user",
        content: paramValue[1],
        name: paramValue[0],
    });
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0301",
        messages: conversationLog,
    });
    const response = completion.data.choices[0].message.content
    conversationLog.push({
        role: "assistant",
        content: response,
    });

  if (req.method === 'GET' && parsedUrl.pathname === '/127.0.0.1') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(response);
    res.end();
    console.log(response)
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('404 Not Found');
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});