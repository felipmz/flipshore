import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import QRCode from "react-qr-code";
import './index.css'; 

// --- CONFIGURAÇÃO ---
const API_URL = "https://uploader-9aqu.onrender.com";
const APP_URL = window.location.href.split('?')[0];

const socket = io(API_URL, { 
    autoConnect: true,
    transports: ['websocket', 'polling']
});

// --- LISTA DE MENSAGENS ANIMADAS (NOVA IMPLEMENTAÇÃO) ---
const MESSAGES = [
  "Crie uma nova sala para estabelecer conexão com outro aparelho.",
  "Selecione o arquivo que deseja enviar e veja a mágica acontecer.",
  "Conecte-se onde precisar."
];

function App() {
  const [view, setView] = useState('home'); 
  const [roomId, setRoomId] = useState('');
  const [inputCode, setInputCode] = useState('');
   
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(''); 
  const [downloadLink, setDownloadLink] = useState(null);
  const [receivedFileName, setReceivedFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mobileMode, setMobileMode] = useState('join'); 
   
  const [mobileConnected, setMobileConnected] = useState(false);

  // --- NOVOS ESTADOS PARA A ANIMAÇÃO ---
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeProp, setFadeProp] = useState('opacity-100');

  // --- EFEITO DE TROCAR MENSAGEM (IMPLEMENTAÇÃO NOVA) ---
  useEffect(() => {
    if (view !== 'home') return; 

    const interval = setInterval(() => {
        setFadeProp('opacity-0 translate-y-2'); // Apaga
        
        setTimeout(() => {
            setMsgIndex((prev) => (prev + 1) % MESSAGES.length); // Troca texto
            setFadeProp('opacity-100 translate-y-0'); // Acende
        }, 500); 

    }, 4000); // Tempo de leitura

    return () => clearInterval(interval);
  }, [view]);

  // --- CORREÇÃO DO SOCKET ---
  useEffect(() => {
    socket.on('connect', () => {
      console.log("🟢 Socket conectado! ID:", socket.id);
      if (roomId) {
        console.log("🔄 Reconectando na sala:", roomId);
        socket.emit('join-room', roomId);
      }
    });

    socket.on('user-joined', () => {
        console.log("👋 Alguém entrou na sala.");
        setMobileConnected(true);
    });

    socket.on('file-received', (data) => {
      console.log("📂 ARQUIVO RECEBIDO NO FRONT:", data);
      setDownloadLink(data.link);
      setReceivedFileName(data.fileName);
      setStatus('recebido');
    });

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInputCode(roomFromUrl);
      setRoomId(roomFromUrl);
      socket.emit('join-room', roomFromUrl);
      setView('mobile');
      setMobileMode('upload'); 
    }

    return () => {
      socket.off('connect');
      socket.off('user-joined');
      socket.off('file-received');
    };
  }, [roomId]);

  const goHome = () => {
    setFile(null);
    setStatus('');
    setDownloadLink(null);
    setReceivedFileName('');
    setRoomId('');
    setInputCode('');
    setUploadProgress(0); 
    setMobileConnected(false); 
    setMobileMode('join');
    setView('home');
    window.history.pushState({}, document.title, "/");
  };

  const startPC = () => {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomId(id);
    socket.emit('join-room', id);
    setMobileConnected(false); 
    setView('pc');
  };

  const joinRoom = () => {
    const codeToUse = inputCode || roomId; 
    if (codeToUse.length === 6) {
      setRoomId(codeToUse);
      socket.emit('join-room', codeToUse);
      setView('mobile'); 
      setMobileMode('upload'); 
    } else alert("Código inválido (deve ter 6 dígitos)");
  };

  const sendFile = async () => {
    if (!file) return;
    setStatus('enviando');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload/${roomId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
        }
      });
      setStatus('sucesso');
    } catch (error) {
      console.error(error);
      setStatus('erro');
    }
  };

  // --- RENDERIZAÇÃO ---

  if (view === 'home') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 text-white p-4 bg-slate-900">
      <h1 className="text-6xl font-bold texto-gradiente-animado">
        Flipshore
      </h1>
      
      {/* --- ÁREA DA MENSAGEM ANIMADA (SUBSTITUÍDO) --- */}
      <div className="h-16 flex items-center justify-center w-full max-w-lg px-4">
          <p className={`text-slate-400 text-center text-lg transition-all duration-500 transform ${fadeProp}`}>
            {MESSAGES[msgIndex]}
          </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-8 px-4">
        <button 
          onClick={startPC} 
          className="flex-1 group relative px-6 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 overflow-hidden"
        >
           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
           <span className="relative flex items-center justify-center gap-2">Criar Sala</span>
        </button>

        <button 
          onClick={() => setView('mobile')} 
          className="flex-1 px-6 py-5 rounded-2xl border border-slate-600 bg-slate-800/50 text-slate-300 font-bold text-xl hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-300 backdrop-blur-sm"
        >
           Entrar
        </button>
      </div>
    </div>
  );

  if (view === 'pc') return (
    <div className={`h-screen flex flex-col items-center justify-center text-white relative transition-all duration-700 ${mobileConnected ? 'bg-emerald-600' : 'bg-slate-800'}`}>
       
      <button 
        onClick={goHome} 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 px-5 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 group z-10"
      >
        <span className="group-hover:-translate-x-1 transition-transform">⬅</span> 
        <span className="font-semibold text-sm">Voltar</span>
      </button>

      <div className="text-center p-8 w-full max-w-2xl">
        
       {downloadLink ? (
        <div className="relative w-full max-w-2xl p-[4px] rounded-3xl bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 shadow-2xl shadow-cyan-500/20 animate-in fade-in slide-in-from-bottom-8 overflow-hidden">
           
            <div className="bg-slate-900 rounded-[calc(1.5rem-4px)] p-8 sm:p-12 text-center relative h-full w-full">

                <p className="mb-6 text-lg font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-2">
                      📄 Arquivo pronto para download:
                </p>

                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 break-all leading-tight select-all font-mono py-4 border-y border-slate-800">
                    {receivedFileName}
                </h2>
                
                <a 
                    href={downloadLink} 
                    download={receivedFileName} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-5 rounded-xl font-bold text-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                    <span>BAIXAR ARQUIVO</span>
                </a>
            </div>
        </div>

    ) : mobileConnected ? (
        <div className="animate-in zoom-in duration-500 flex flex-col items-center">
            <div className="bg-white/20 p-8 rounded-full mb-6 backdrop-blur-sm shadow-xl">
                <span className="text-8xl"></span>
            </div>
            <h1 className="text-5xl font-bold mb-4">Dispositivo Conectado!</h1>
            <p className="text-2xl text-emerald-100 animate-pulse">Aguardando envio do arquivo...</p>
            <div className="mt-8 text-emerald-200 text-sm font-mono">Sala: {roomId}</div>
        </div>

    ) : (
        <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="qrcode-frame-animado mb-6">
                <div className="qrcode-bg-solido">
                    <QRCode 
                        value={`${APP_URL}?room=${roomId}`} 
                        size={200} 
                        viewBox={`0 0 256 256`}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                </div>
            </div>
            
            <p className="mb-2 text-slate-400 text-lg">Leia o QR Code para entrar:</p>
            <h1 className="text-7xl font-mono font-bold tracking-widest text-white mb-8">{roomId}</h1>
            
            <div className="flex items-center gap-3 text-blue-300 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="font-semibold tracking-wide text-sm">Aguardando conexão...</span>
            </div>
        </div>
    )}
      </div>
    </div>
  );

  if (view === 'mobile') return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white relative">
       
      <button 
        onClick={goHome} 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm transition-all"
      >
        <span>⬅</span> <span className="font-bold text-sm">Sair</span>
      </button>

      {mobileMode === 'join' ? (
        <div className="w-full max-w-sm">
            <h2 className="text-center text-2xl font-bold mb-6">Código da Sala</h2>
            <input 
                value={inputCode} 
                onChange={e => setInputCode(e.target.value)} 
                maxLength={6} 
                placeholder="000000"
                className="w-full bg-slate-800 text-center text-5xl py-6 rounded-2xl mb-6 tracking-widest text-white border border-slate-600 focus:border-green-500 outline-none transition-colors" 
            />
            
            <button 
                onClick={joinRoom} 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 py-5 rounded-xl font-bold text-xl text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 tracking-wide"
            >
                ACESSAR SALA ➜
            </button>
        </div>
      ) : (
        <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-8">Enviar Arquivo</h1>
            <p className="mb-4 text-green-400">Conectado na Sala {roomId}</p>
            
            {status !== 'sucesso' && (
                <label className="block w-full h-48 border-2 border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition mb-8 relative bg-slate-800/50">
                    <input 
                        type="file" 
                        onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                                setFile(e.target.files[0]); 
                                setStatus('');
                            }
                        }} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <span className="text-6xl mb-4">{file ? '📄' : '📁'}</span>
                    <span className="text-slate-300 text-lg px-4 break-all p-2">{file ? file.name : 'Toque para escolher'}</span>
                </label>
            )}
            
            {status === 'enviando' && (
                <div className="w-full bg-slate-700 rounded-full h-4 mb-6 overflow-hidden">
                    <div className="bg-yellow-400 h-4 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}

            {status === 'sucesso' ? (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/50 p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-2xl font-bold text-white mb-2">Arquivo Enviado!</h2>
                    <p className="text-slate-400 text-sm">O outro aparelho já recebeu o arquivo.</p>
                </div>
            ) : (
                <button 
                    onClick={(e) => {
                        e.preventDefault(); 
                        sendFile();
                    }} 
                    disabled={!file || status === 'enviando'} 
                    className={`w-full py-5 rounded-xl font-bold text-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                      ${!file || status === 'enviando' 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-70' 
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 active:scale-95'}
                    `}
                >
                    {status === 'enviando' ? (
                       <>
                         <span className="animate-spin">⏳</span> Enviando...
                       </>
                    ) : (
                       <>
                         ENVIAR ARQUIVO 
                       </> 
                    )}
                </button>
            )}
        </div>
      )}
    </div>
  );
}

export default App;