// ARQUIVO: backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const os = require('os'); // Importante para descobrir o IP

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" })); 

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Configuração de pastas e Upload
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket Logic
io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 1) io.to(roomId).emit('room-connected');
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
        socket.to(roomId).emit('peer-disconnected');
    });
  });
});

app.post('/upload/:roomId', upload.single('file'), (req, res) => {
  const { roomId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).send('Erro no arquivo');
  
  // Aqui usamos o Host do request para garantir o link correto
  const fileLink = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
  
  console.log(`Arquivo recebido na sala ${roomId}: ${file.originalname}`);
  io.to(roomId).emit('file-received', { link: fileLink, fileName: file.originalname });
  res.json({ success: true, link: fileLink });
});

// --- A MÁGICA DA DETECÇÃO DE IP ---
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pula endereços internos (127.0.0.1) e não IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log('---------------------------------------------------');
  console.log('✅ SERVIDOR RODANDO!');
  console.log('---------------------------------------------------');
  console.log(`📡 Para usar, abra este endereço no navegador do PC:`);
  console.log(`👉 http://${ip}:5173`); 
  console.log('---------------------------------------------------');
});