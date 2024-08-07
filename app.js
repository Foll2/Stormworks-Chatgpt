import http from 'http';
import url from 'url';
import 'dotenv/config';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_ACCESS_TOKEN,
});

const openai = new OpenAIApi(configuration);

let conversationLog = [{ role: "system", content: "You are a friendly chatbot.",}];
let privateLogs = {};


function getPrivateLog(userId) {
  if (!privateLogs[userId]) {
    privateLogs[userId] = [];
  }
  return privateLogs[userId];
}

let Textraw = null;
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let Private = null;
  let response = null;
  let Received = null;
  if (parsedUrl.query.name && parsedUrl.query.message) {
    Received = parsedUrl.query;
    Textraw = Received.message;
    Private = Received.private;
    console.log(Received)
    if (Private === "true") {
      const userId = Received.name;
      getPrivateLog(userId).push({
        role: "user",
        content: Textraw,
      });
      const privateCompletion = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: getPrivateLog(userId),
        max_tokens: 80,
      });
      response = privateCompletion.data.choices[0].message.content;
      getPrivateLog(userId).push({
        role: "assistant",
        content: response,
      });
    } else {
    conversationLog.push({
        role: "user",
        content: Textraw,
    });
    const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: conversationLog,
        max_tokens: 80,
    });
    response = completion.data.choices[0].message.content;
    conversationLog.push({
        role: "assistant",
        content: response,
    });
    }
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

  if (req.method === 'GET' && parsedUrl.pathname === '/chat') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if (Private === "true"){
      res.write(Private.concat(";",Textraw[0],";",response));
    } else {
      res.write(Textraw[0].concat(";",response));
    }
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
