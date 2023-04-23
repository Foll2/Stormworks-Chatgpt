import http from 'http';
import url from 'url';
import 'dotenv/config';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_ACCESS_TOKEN,
});

const openai = new OpenAIApi(configuration);

let conversationLog = [{ role: "system", content: "You are a friendly chatbot.",}];

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let paramValue = null;
  let response = null;

  if (parsedUrl.query.param) {
    paramValue = parsedUrl.query.param.split(":");
    conversationLog.push({
        role: "user",
        content: paramValue[1],
    });
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0301",
        messages: conversationLog,
        max_tokens: 80,
    });
    response = completion.data.choices[0].message.content;
    conversationLog.push({
        role: "assistant",
        content: response,
    });
  } else {
    const latestAssistantMessage = conversationLog
      .slice()
      .reverse()
      .find(message => message.role === 'assistant');

    if (latestAssistantMessage) {
      response = latestAssistantMessage.content;
    } else {
      response = "Sorry, I don't have any messages to display.";
    }
  }

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
