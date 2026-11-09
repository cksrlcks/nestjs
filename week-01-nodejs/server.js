import http from 'node:http';

const PORT = 3001;

const memos = [
  {id: 1, content: 'Node.js 공부 시작'}
]

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const sendJson = (status, data) => {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
    })
  
    res.end(JSON.stringify(data))
  }

  if(url.pathname === '/health' && req.method === 'GET'){
    return sendJson(200, {
      status: 'ok',
      uptime: process.uptime()
    })
  }

  if(url.pathname === '/memos' && req.method === 'GET'){
    return sendJson(200, memos)
  }

  if(url.pathname === '/memos' && req.method === 'POST'){
    try{
      let body = '';
      for await (const chunk of req){
        body += chunk;
        if(body.length > 10000){
          return sendJson(413, {message : '요청 크기 초과'})
        }
      }

      const data = JSON.parse(body);

      if(typeof data.content !== 'string' || !data.content.trim()){
        return sendJson(400, {message: '내용을 입력하세요.'})
      }

      const memo = {
        id: (memos.at(-1)?.id ?? 0) + 1,
        content: data.content.trim()
      }

      memos.push(memo);
      return sendJson(201, memo)
    }catch {
      return sendJson(400, {message: '잘못된 JSON 요청입니다.'})
    }
  }

  const match = url.pathname.match(/^\/memos\/(\d+)$/);

  if(match){
    const id = Number(match[1]);

    if(req.method === 'PATCH'){
      const memo = memos.find(item => item.id === id);

      if(!memo){
        return sendJson(404, {
          message: '메모가 없습니다.'
        })
      }

      try{
        let body = '';

        for await(const chunk of req){
          body += chunk;

          if(Buffer.byteLength(body, 'utf-8') > 1000){
            return sendJson(413, {
              message: '요청 크기 초과'
            })
          }
        }

        const data = JSON.parse(body);
        if(typeof data.content !== 'string' || !data.content.trim()){
          return sendJson(400, {
            message: '내용을 입력하세요'
          })
        }

        memo.content = data.content.trim();

        return sendJson(200, memo)
      }catch{
        return sendJson(400, {
          message: '잘못된 JSON 요청입니다.'
        })
      }
    }

    if(req.method === 'DELETE'){
      const index = memos.findIndex(item => item.id === id)
      
      if(index === -1){
        return sendJson(404, {
          message: '메모가 없습니다.'
        })
      }
    
      memos.splice(index, 1);
      res.writeHead(204)
      return res.end();
    }
  }

  return sendJson(404, {message: 'API를 찾을수 없습니다.'})
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})