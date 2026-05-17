import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Activity, Stethoscope, Brain, User, Bot, FileText, Paperclip, X } from 'lucide-react';
import './MedicalSummarizer.css';

const SUMMARY_LEVELS = [
  { id: 1, title: 'Sơ lược', icon: <Activity size={16} /> },
  { id: 2, title: 'Dễ hiểu', icon: <Brain size={16} /> },
  { id: 3, title: 'Chuyên sâu', icon: <Stethoscope size={16} /> }
];

export default function MedicalSummarizer() {
  const [inputText, setInputText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // State lưu file đính kèm
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // Ref để gọi input file ẩn

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: 'Chào bác sĩ/chuyên gia. Vui lòng nhập đoạn văn bản hoặc tải lên file y khoa (PDF/Word) cần xử lý.',
      level: null
    }
  ]);

  const [sessions, setSessions] = useState([
    { id: 1, title: 'Cơ chế tác dụng của thuốc ức chế SGLT2', date: 'Hôm nay' }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Xử lý khi chọn file
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset value để có thể chọn lại cùng 1 file nếu vừa xóa
    e.target.value = null; 
  };

  // Hủy file đã chọn
  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedFile) return;

    // Tạo nội dung tin nhắn kết hợp text và file
    let messageContent = inputText;
    if (selectedFile) {
      messageContent = `[Đính kèm file: ${selectedFile.name}]\n${inputText}`;
    }

    const newUserMsg = { 
      id: Date.now(), 
      role: 'user', 
      content: messageContent.trim(), 
      level: selectedLevel 
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setSelectedFile(null); // Gửi xong thì xóa file đính kèm
    setIsTyping(true);

    // Giả lập API phản hồi
    setTimeout(() => {
      const mockResponse = `Đã nhận yêu cầu xử lý ở cấp độ: **${SUMMARY_LEVELS.find(l=>l.id === selectedLevel).title}**. ${
        newUserMsg.content.includes('[Đính kèm file:') 
        ? '\nHệ thống đang phân tích dữ liệu từ tài liệu của bạn...' 
        : ''
      }\nĐây là bản tóm tắt mẫu...`;
      
      const newBotMsg = { id: Date.now() + 1, role: 'bot', content: mockResponse, level: selectedLevel };
      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="med-app">
      {/* SIDEBAR (Giữ nguyên) */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="btn-new-session">
            <Plus size={20} />
            <span>Phiên tóm tắt mới</span>
          </button>
        </div>
        <div className="sidebar-history">
          <h3 className="history-title">Lịch sử gần đây</h3>
          {sessions.map(session => (
            <button key={session.id} className="history-item">
              <MessageSquare size={16} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.title}
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-avatar">Dr</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Medical Workspace</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="header">
          <h1>
            <FileText size={20} color="var(--primary)" style={{ filter: 'brightness(0.8)' }} />
            Medical Text Summarizer (MedLM)
          </h1>
        </header>

        <div className="chat-area">
          <div className="chat-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                {msg.role === 'bot' && <div className="avatar bot"><Bot size={20} /></div>}
                
                <div className="message-content-wrapper">
                  {msg.level && msg.role === 'user' && (
                    <span className="level-badge">
                      {SUMMARY_LEVELS.find(l => l.id === msg.level)?.icon}
                      Yêu cầu: {SUMMARY_LEVELS.find(l => l.id === msg.level)?.title}
                    </span>
                  )}
                  <div className="message-bubble">{msg.content}</div>
                </div>

                {msg.role === 'user' && <div className="avatar user"><User size={20} /></div>}
              </div>
            ))}
            
            {isTyping && (
              <div className="message-row bot">
                <div className="avatar bot"><Bot size={20} /></div>
                <div className="typing-dots">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="input-section">
          <div className="input-container">
            
            <div className="level-tabs">
              {SUMMARY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`tab-btn ${selectedLevel === level.id ? 'active' : ''}`}
                >
                  {level.icon}
                  {level.title}
                </button>
              ))}
            </div>

            {/* HIỂN THỊ FILE ĐÃ CHỌN TRƯỚC KHI GỬI */}
            {selectedFile && (
              <div className="file-preview-chip">
                <FileText size={14} color="var(--primary)" style={{ filter: 'brightness(0.8)' }} />
                <span className="file-name">{selectedFile.name}</span>
                <button onClick={removeSelectedFile} className="btn-remove-file">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="textarea-wrapper">
              {/* NÚT UPLOAD FILE */}
              <button 
                className="btn-attach" 
                onClick={() => fileInputRef.current.click()}
                title="Đính kèm PDF hoặc Word"
              >
                <Paperclip size={20} />
              </button>
              
              {/* INPUT FILE ẨN */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
              />

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nhập văn bản hoặc đính kèm tài liệu..."
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && !selectedFile) || isTyping}
                className="btn-send"
              >
                <Send size={20} />
              </button>
            </div>
            
            <p className="disclaimer">
              Mô hình có thể mắc sai lầm. Hãy luôn kiểm chứng thông tin y khoa với chuyên gia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}