# 🌊 Flipshore - Real-Time File Sharing

Este projeto é uma aplicação web focada em produtividade que permite a transferência instantânea de arquivos entre dispositivos (PC e Mobile) via Wi-Fi, eliminando a necessidade de cabos, bluetooth ou logins.

---

## 🔗 Visualização do Projeto
### **[➤ Clique aqui para testar o site ao vivo](https://up-loader-bice.vercel.app/)**

---

## ⚡ Diferencial: Conexão em Tempo Real (Socket.io)
O grande destaque do projeto é a experiência de uso fluida ("Magic Pairing"). O sistema utiliza WebSockets para criar um canal de comunicação bidirecional:
- **Zero Login:** Não é necessário criar conta. O pareamento é feito via **QR Code** exclusivo por sessão.
- **Feedback Instantâneo:** Assim que o celular lê o código, a tela do computador atualiza automaticamente, sem precisar de "refresh".

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React.js + Vite**: Construção da interface reativa e veloz.
- **Tailwind CSS**: Estilização moderna e responsiva para mobile e desktop.
- **Socket.io-client**: Gerenciamento da conexão em tempo real e eventos de entrada na sala.
- **Axios**: Upload de arquivos robusto com barra de progresso.

### **Backend**
- **Node.js + Express**: API REST para gerenciamento de uploads.
- **Socket.io (Server)**: Orquestração das salas (Rooms) e sinalização entre dispositivos.
- **File System (FS)**: Gerenciamento temporário dos arquivos recebidos.

## 📂 Estrutura do Repositório
O projeto utiliza uma estrutura organizada separando as responsabilidades:
- `/frontend`: Interface visual, lógica de QR Code e Cliente Socket.
- `/backend`: Servidor Node.js, lógica de WebSocket e armazenamento.

## 🚀 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone git@github.com:felipmz/flipshore.git
