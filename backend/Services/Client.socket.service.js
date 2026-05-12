import WebSocket from 'ws';
import readline from 'readline';

const ws = new WebSocket('ws://localhost:8080');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

ws.on('open', () => {
  console.log('Connected to chat');
  console.log('Type messages below:\n');

  rl.on('line', (input) => {
    ws.send(input);
  });
});

ws.on('message', (data) => {
  const message = JSON.parse(data);

  console.log(`\n${message.clientId}: ${message.text}`);
});

ws.on('close', () => {
  console.log('Disconnected');
});