FROM node:16

CMD ["node", "-e", "http.createServer((req, res) => res.end('OK')).listen(3000)"]