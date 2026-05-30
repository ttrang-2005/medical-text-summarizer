import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Activity, Stethoscope, Brain, User, Bot, FileText, Paperclip, X, Upload } from 'lucide-react';
import './MedicalSummarizer.css';

const SUMMARY_LEVELS = [
  { id: 1, title: 'Sơ lược', value: 'Sơ lược', icon: <Activity size={16} />, desc: 'Tóm tắt ngắn gọn các ý chính cốt lõi nhất' },
  { id: 2, title: 'Dễ hiểu', value: 'Dễ hiểu', icon: <Brain size={16} />, desc: 'Dịch thuật ngữ chuyên ngành sang ngôn ngữ phổ thông' },
  { id: 3, title: 'Chuyên sâu', value: 'Chuyên sâu', icon: <Stethoscope size={16} />, desc: 'Giữ nguyên thuật ngữ lâm sàng & chi tiết thông số nghiên cứu' }
];

const cleanMarkdownArtifacts = (text, isLevel3 = false) => {
  if (typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Remove markdown code block artifacts
  cleaned = cleaned.replace(/```text/gi, '');
  cleaned = cleaned.replace(/```json/gi, '');
  cleaned = cleaned.replace(/```/g, '');
  
  // Specific Level 3 formatting: remove "text" or "text\n" at the beginning of lines
  if (isLevel3) {
    cleaned = cleaned.split('\n').map(line => {
      let trimmed = line.trim();
      // Remove leading backticks and 'text'
      if (/^`+text/i.test(trimmed)) {
        trimmed = trimmed.replace(/^`+text/i, '').trim();
      }
      if (/^`+/g.test(trimmed)) {
        trimmed = trimmed.replace(/^`+/g, '').trim();
      }
      if (/^text\b/i.test(trimmed)) {
        trimmed = trimmed.substring(4).replace(/^[:\s\-`']*/, '').trim();
      }
      return trimmed;
    }).filter(line => line !== '').join('\n');
  }
  
  return cleaned.trim();
};

const parseMarkdown = (text, isLevel3 = false) => {
  if (!text || typeof text !== 'string') return '';

  // 1. Clean up markdown artifacts
  let html = cleanMarkdownArtifacts(text, isLevel3);

  // 2. Escape HTML characters (excluding ones we generate ourselves)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Headings: ###, ##, #
  html = html.replace(/^### (.*?)$/gm, '<h5 class="md-h3" style="font-size: 15px; font-weight: 700; color: #8b4465; margin: 12px 0 6px 0; border-bottom: 1px dashed rgba(242,189,214,0.4); padding-bottom: 4px;">$1</h5>');
  html = html.replace(/^## (.*?)$/gm, '<h4 class="md-h2" style="font-size: 16px; font-weight: 700; color: #8b4465; margin: 16px 0 8px 0; border-bottom: 1px solid rgba(242,189,214,0.6); padding-bottom: 4px;">$1</h4>');
  html = html.replace(/^# (.*?)$/gm, '<h3 class="md-h1" style="font-size: 18px; font-weight: 800; color: #8b4465; margin: 20px 0 10px 0;">$1</h3>');

  // 4. Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 5. Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 6. Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #d67ba6; text-decoration: underline;">$1</a>');

  // 7. Bullet Lists
  const lines = html.split('\n');
  if (lines.length === 1) {
    const line = lines[0];
    const match = line.match(/^[-*+]\s+(.*)$/);
    if (match) {
      return match[1];
    }
    return line;
  }

  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^[-*+]\s+(.*)$/);
    
    if (match) {
      if (!inList) {
        processedLines.push('<ul class="md-list" style="margin-left: 20px; margin-bottom: 10px; list-style-type: disc; display: flex; flex-direction: column; gap: 4px;">');
        inList = true;
      }
      processedLines.push(`<li style="font-size: 14px; line-height: 1.5; color: var(--text-main);">${match[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      const trimmed = line.trim();
      if (trimmed === '') {
        processedLines.push('');
      } else if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul') || trimmed.startsWith('<li')) {
        processedLines.push(line);
      } else {
        processedLines.push(`<p style="margin-bottom: 8px; font-size: 14px; line-height: 1.5; color: var(--text-main);">${line}</p>`);
      }
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('\n');
};

export default function MedicalSummarizer() {
  const [inputText, setInputText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sessions, setSessions] = useState([
    {
      id: 1,
      title: 'Cơ chế tác dụng của thuốc SGLT2i',
      date: 'Hôm nay',
      file: null,
      selectedLevel: 3,
      messages: [
        {
          id: 1,
          role: 'bot',
          content: 'Chào bác sĩ/chuyên gia. Vui lòng đính kèm file bài báo y khoa (PDF) để hệ thống tiến hành tóm tắt.',
          level: null
        },
        {
          id: 2,
          role: 'user',
          content: '[Đã đính kèm file: sglt2_inhibitors_cardio.pdf]\nTóm tắt tác dụng bảo vệ tim mạch của SGLT2i.',
          level: 3
        },
        {
          id: 3,
          role: 'bot',
          content: '',
          rawData: {
            "Tổng quan cơ chế": [
              "Giảm tái hấp thu Glucose và Natri ở ống lượn gần.",
              "Tăng đào thải đường qua nước tiểu, giảm áp lực thể tích nội mạch."
            ],
            "Tác động tim mạch": [
              "Giảm tiền gánh và hậu gánh do tác dụng lợi niệu thẩm thấu.",
              "Cải thiện chuyển hóa cơ tim, chuyển dịch năng lượng sang sử dụng Thể Ketone hiệu quả hơn.",
              "Giảm xơ hóa cơ tim và ức chế hệ trao đổi Natri-Hydro (NHE-1)."
            ],
            "Kết luận lâm sàng": "Thuốc ức chế SGLT2 làm giảm đáng kể nguy cơ nhập viện vì suy tim và tử vong do mọi nguyên nhân tim mạch ở bệnh nhân suy tim phân suất tống máu giảm."
          },
          level: 3
        }
      ]
    }
  ]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isTyping]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
      } else {
        alert('⚠️ Hệ thống hiện tại chỉ chấp nhận tài liệu định dạng .pdf. Vui lòng thử lại!');
      }
    }
    e.target.value = null; 
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
      } else {
        alert('⚠️ Hệ thống hiện tại chỉ chấp nhận tài liệu định dạng .pdf. Vui lòng thử lại!');
      }
    }
  };

  const handleNewSession = () => {
    setSelectedFile(null);
    setInputText('');
    setActiveSessionId(null);
  };

  const handleLoadSession = (sessionId) => {
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedLevel(session.selectedLevel || 1);
    }
  };

  const formatBotResponse = (data) => {
    if (!data) return "Không nhận được phản hồi từ AI.";
    if (data.error) return `❌ Lỗi: ${data.error}`;

    let output = "";
    for (const [key, val] of Object.entries(data)) {
        output += `ĐỀ MỤC: ${key.toUpperCase()}\n`;
        if (Array.isArray(val)) {
            val.forEach(item => output += `• ${item}\n`);
        } else if (typeof val === 'object' && val !== null) {
            for (const [subKey, subVal] of Object.entries(val)) {
                output += `  - ${subKey}: ${subVal}\n`;
            }
        } else {
            output += `${val}\n`;
        }
        output += "\n";
    }
    return output.trim();
  };

  const triggerSummarizeForSession = async (sessionId, file, levelId) => {
    const currentLevelObj = SUMMARY_LEVELS.find(l => l.id === levelId);
    
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: `[Yêu cầu tóm tắt ở cấp độ: ${currentLevelObj.title}]`,
      level: levelId
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, userMsg] };
      }
      return s;
    }));

    setIsTyping(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("level", currentLevelObj.value);

    try {
      const response = await fetch("http://localhost:8000/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Lỗi Server Backend (500)");
      }

      const json_data = await response.json();
      
      const newBotMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: formatBotResponse(json_data), 
        rawData: json_data,
        level: levelId 
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, newBotMsg] };
        }
        return s;
      }));

    } catch (error) {
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        content: `❌ Lỗi kết nối AI: ${error.message}. Hãy kiểm tra xem file main.py của Backend đã được chạy chưa.`, 
        level: levelId 
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, errorMsg] };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleLevelChange = async (levelId) => {
    setSelectedLevel(levelId);
    
    if (activeSessionId) {
      // Find current active session
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (!currentSession) return;
      
      // Update session's selectedLevel
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, selectedLevel: levelId };
        }
        return s;
      }));

      // If the session has an associated file, trigger summarization if not already generated
      if (currentSession.file) {
        const hasSummaryForLevel = currentSession.messages.some(
          msg => msg.role === 'bot' && msg.level === levelId && !msg.content.includes("⚠️")
        );
        if (!hasSummaryForLevel) {
          await triggerSummarizeForSession(activeSessionId, currentSession.file, levelId);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!activeSessionId) {
      if (!selectedFile) {
        alert('⚠️ Vui lòng đính kèm file PDF bài báo trước khi yêu cầu tóm tắt!');
        return;
      }
      
      const fileToSend = selectedFile;
      const newSessionId = Date.now();
      const newSessionTitle = fileToSend.name.replace('.pdf', '');
      const currentLevelObj = SUMMARY_LEVELS.find(l => l.id === selectedLevel);
      
      const initialBotMsg = {
        id: 1,
        role: 'bot',
        content: 'Chào bác sĩ/chuyên gia. Vui lòng đính kèm file bài báo y khoa (PDF) để hệ thống tiến hành tóm tắt.',
        level: null
      };
      
      const initialUserMsg = {
        id: Date.now(),
        role: 'user',
        content: `[Đã đính kèm file: ${fileToSend.name}]${inputText ? '\n' + inputText : ''}`,
        level: selectedLevel
      };

      const newSessionObj = {
        id: newSessionId,
        title: newSessionTitle,
        date: 'Vừa xong',
        file: fileToSend,
        selectedLevel: selectedLevel,
        messages: [initialBotMsg, initialUserMsg]
      };

      setSessions(prev => [newSessionObj, ...prev]);
      setActiveSessionId(newSessionId);
      setInputText('');
      setSelectedFile(null);
      setIsTyping(true);

      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append("level", currentLevelObj.value);

      try {
        const response = await fetch("http://localhost:8000/api/summarize", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Lỗi Server Backend (500)");
        }

        const json_data = await response.json();
        
        const newBotMsg = { 
          id: Date.now() + 1, 
          role: 'bot', 
          content: formatBotResponse(json_data), 
          rawData: json_data,
          level: selectedLevel 
        };

        setSessions(prev => prev.map(s => {
          if (s.id === newSessionId) {
            return { ...s, messages: [...s.messages, newBotMsg] };
          }
          return s;
        }));

      } catch (error) {
        const errorMsg = { 
          id: Date.now() + 1, 
          role: 'bot', 
          content: `❌ Lỗi kết nối AI: ${error.message}. Hãy kiểm tra xem file main.py của Backend đã được chạy chưa.`, 
          level: selectedLevel 
        };
        setSessions(prev => prev.map(s => {
          if (s.id === newSessionId) {
            return { ...s, messages: [...s.messages, errorMsg] };
          }
          return s;
        }));
      } finally {
        setIsTyping(false);
      }
    } else {
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (!currentSession) return;

      if (selectedFile) {
        const fileToSend = selectedFile;
        const newSessionId = Date.now();
        const newSessionTitle = fileToSend.name.replace('.pdf', '');
        const currentLevelObj = SUMMARY_LEVELS.find(l => l.id === selectedLevel);
        
        const initialBotMsg = {
          id: 1,
          role: 'bot',
          content: 'Chào bác sĩ/chuyên gia. Vui lòng đính kèm file bài báo y khoa (PDF) để hệ thống tiến hành tóm tắt.',
          level: null
        };
        
        const initialUserMsg = {
          id: Date.now(),
          role: 'user',
          content: `[Đã đính kèm file: ${fileToSend.name}]${inputText ? '\n' + inputText : ''}`,
          level: selectedLevel
        };

        const newSessionObj = {
          id: newSessionId,
          title: newSessionTitle,
          date: 'Vừa xong',
          file: fileToSend,
          selectedLevel: selectedLevel,
          messages: [initialBotMsg, initialUserMsg]
        };

        setSessions(prev => [newSessionObj, ...prev]);
        setActiveSessionId(newSessionId);
        setInputText('');
        setSelectedFile(null);
        setIsTyping(true);

        const formData = new FormData();
        formData.append("file", fileToSend);
        formData.append("level", currentLevelObj.value);

        try {
          const response = await fetch("http://localhost:8000/api/summarize", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Lỗi Server Backend (500)");
          }

          const json_data = await response.json();
          
          const newBotMsg = { 
            id: Date.now() + 1, 
            role: 'bot', 
            content: formatBotResponse(json_data), 
            rawData: json_data,
            level: selectedLevel 
          };

          setSessions(prev => prev.map(s => {
            if (s.id === newSessionId) {
              return { ...s, messages: [...s.messages, newBotMsg] };
            }
            return s;
          }));

        } catch (error) {
          const errorMsg = { 
            id: Date.now() + 1, 
            role: 'bot', 
            content: `❌ Lỗi kết nối AI: ${error.message}. Hãy kiểm tra xem file main.py của Backend đã được chạy chưa.`, 
            level: selectedLevel 
          };
          setSessions(prev => prev.map(s => {
            if (s.id === newSessionId) {
              return { ...s, messages: [...s.messages, errorMsg] };
            }
            return s;
          }));
        } finally {
          setIsTyping(false);
        }
        return;
      }

      const fileToSend = currentSession.file;
      if (!fileToSend) {
        const userMsg = {
          id: Date.now(),
          role: 'user',
          content: inputText || `[Yêu cầu tóm tắt ở cấp độ: ${SUMMARY_LEVELS.find(l => l.id === selectedLevel).title}]`,
          level: selectedLevel
        };
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: '⚠️ Phiên này là dữ liệu mô phỏng, không có file PDF đính kèm để tóm tắt hoặc phản hồi.'
        };
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, userMsg, errorMsg] };
          }
          return s;
        }));
        setInputText('');
        return;
      }

      const currentLevelObj = SUMMARY_LEVELS.find(l => l.id === selectedLevel);
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: inputText || `[Yêu cầu tóm tắt ở cấp độ: ${currentLevelObj.title}]`,
        level: selectedLevel
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, userMsg] };
        }
        return s;
      }));

      setInputText('');
      setIsTyping(true);

      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append("level", currentLevelObj.value);

      try {
        const response = await fetch("http://localhost:8000/api/summarize", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Lỗi Server Backend (500)");
        }

        const json_data = await response.json();
        
        const newBotMsg = { 
          id: Date.now() + 1, 
          role: 'bot', 
          content: formatBotResponse(json_data), 
          rawData: json_data,
          level: selectedLevel 
        };

        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, newBotMsg] };
          }
          return s;
        }));

      } catch (error) {
        const errorMsg = { 
          id: Date.now() + 1, 
          role: 'bot', 
          content: `❌ Lỗi kết nối AI: ${error.message}. Hãy kiểm tra xem file main.py của Backend đã được chạy chưa.`, 
          level: selectedLevel 
        };
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, errorMsg] };
          }
          return s;
        }));
      } finally {
        setIsTyping(false);
      }
    }
  };

  const RenderBotResponse = ({ msg }) => {
    if (msg.rawData && typeof msg.rawData === 'object') {
      if (msg.rawData.error) {
        return <div style={{ color: '#ef4444', fontWeight: 600 }}>❌ Lỗi: {msg.rawData.error}</div>;
      }
      
      return (
        <div className="bot-response-container">
          {Object.entries(msg.rawData).map(([key, val], idx) => {
            const cleanKey = cleanMarkdownArtifacts(key, msg.level === 3);
            const showHeader = cleanKey.toLowerCase() !== 'raw_data' && cleanKey.toLowerCase() !== 'raw_output';
            
            return (
              <div key={idx} className="bot-section-card">
                {showHeader && (
                  <h4 className="bot-section-header">
                    <Activity size={14} />
                    {cleanKey}
                  </h4>
                )}
                
                {Array.isArray(val) ? (
                  <ul className="bot-bullet-list">
                    {val.map((item, bulletIdx) => (
                      <li key={bulletIdx} className="bot-bullet-item" dangerouslySetInnerHTML={{ __html: parseMarkdown(item, msg.level === 3) }} />
                    ))}
                  </ul>
                ) : typeof val === 'object' && val !== null ? (
                  <div className="bot-key-value-list">
                    {Object.entries(val).map(([subKey, subVal], subIdx) => {
                      const cleanSubKey = cleanMarkdownArtifacts(subKey, msg.level === 3);
                      return (
                        <div key={subIdx} className="bot-key-value-row">
                          <span className="bot-key-label">{cleanSubKey}:</span>
                          <span className="bot-key-value" dangerouslySetInnerHTML={{ __html: parseMarkdown(String(subVal), msg.level === 3) }} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bot-simple-text" dangerouslySetInnerHTML={{ __html: parseMarkdown(String(val), msg.level === 3) }} />
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content, msg.level === 3) }} />;
  };

  const isInitialState = !activeSessionId;

  return (
    <div 
      className="med-app"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-wrapper">
              <Activity size={20} className="pulse-heart" />
            </div>
            <span className="logo-text">MedLM Portal</span>
          </div>
        </div>
        
        <div style={{ padding: '0 16px 16px 16px' }}>
          <button onClick={handleNewSession} className="btn-new-session">
            <Plus size={16} />
            <span>Phiên tóm tắt mới</span>
          </button>
        </div>

        <div className="sidebar-history">
          <h3 className="history-title">Lịch sử gần đây</h3>
          {sessions.map(session => (
            <button 
              key={session.id} 
              onClick={() => handleLoadSession(session.id)}
              className={`history-item ${activeSessionId === session.id ? 'active' : ''}`}
            >
              <MessageSquare size={16} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.title}
              </span>
            </button>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">AI</div>
            <div className="user-info">
              <span className="user-name">Bác sĩ Trí</span>
              <span className="user-role">Chuyên gia MedLM</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="header">
          <h1>
            <FileText size={20} style={{ color: 'var(--primary-hover)' }} />
            {activeSession ? `Tài liệu: ${activeSession.title}` : "Tóm tắt Tài liệu Y sinh"}
          </h1>
          <div className="header-meta">
            {activeSession?.file && (
              <span className="badge-file-attached" style={{ marginRight: '8px', background: '#f5eef1', color: '#8b4465', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                📄 {activeSession.file.name}
              </span>
            )}
            <span className="badge-version">v1.2.0-Alpha</span>
          </div>
        </header>

        {/* DRAG OVERLAY INDICATOR */}
        {isDragActive && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(251, 226, 235, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            pointerEvents: 'none',
            border: '4px dashed var(--primary-hover)',
            margin: '16px',
            borderRadius: '24px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ textAlign: 'center', color: '#8b4465' }}>
              <Upload size={48} style={{ marginBottom: '12px', animation: 'heartbeat 1.5s infinite' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Thả file PDF để tải lên</h2>
              <p style={{ fontSize: '14px', marginTop: '6px', opacity: 0.8 }}>Hệ thống sẽ tự động liên kết tài liệu này</p>
            </div>
          </div>
        )}

        <div className="chat-area">
          <div className="chat-container">
            {isInitialState ? (
              /* WELCOME DASHBOARD LANDING */
              <div className="welcome-dashboard">
                <div className="welcome-logo-large">
                  <Stethoscope size={36} />
                </div>
                <h2 className="welcome-title">Trình Tóm Tắt MedLM</h2>
                <p className="welcome-subtitle">
                  Ứng dụng trí tuệ nhân tạo hỗ trợ dịch thuật ngữ chuyên sâu, tóm tắt và phân tích các nghiên cứu y khoa, bài báo lâm sàng PDF.
                </p>
                
                <div className="welcome-cards">
                  {SUMMARY_LEVELS.map(level => (
                    <div 
                      key={level.id}
                      onClick={() => handleLevelChange(level.id)}
                      className={`feature-card ${selectedLevel === level.id ? 'active' : ''}`}
                    >
                      <div className="feature-icon-wrapper">
                        {level.icon}
                      </div>
                      <h4 className="feature-card-title">{level.title}</h4>
                      <p className="feature-card-desc">{level.desc}</p>
                    </div>
                  ))}
                </div>

                <div 
                  className="dropzone"
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="dropzone-icon">
                    <Upload size={24} />
                  </div>
                  <span className="dropzone-text">
                    {selectedFile ? `Đã chọn: ${selectedFile.name}` : "Kéo thả tài liệu PDF vào đây hoặc bấm để chọn"}
                  </span>
                  <span className="dropzone-subtext">Hỗ trợ các file báo cáo y khoa, kết quả xét nghiệm dưới 25MB</span>
                </div>
              </div>
            ) : (
              /* CHAT MESSAGES */
              currentMessages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  {msg.role === 'bot' && (
                    <div className="avatar bot">
                      <Bot size={18} />
                    </div>
                  )}
                  
                  <div className="message-content-wrapper">
                    {msg.level && msg.role === 'user' && (
                      <span className="level-badge">
                        {SUMMARY_LEVELS.find(l => l.id === msg.level)?.icon}
                        Cấp độ tóm tắt: {SUMMARY_LEVELS.find(l => l.id === msg.level)?.title}
                      </span>
                    )}
                    <div className="message-bubble">
                      {msg.role === 'bot' ? (
                        <RenderBotResponse msg={msg} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="avatar user">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="message-row bot">
                <div className="avatar bot"><Bot size={18} /></div>
                <div className="typing-dots">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT PANEL */}
        <div className="input-section">
          <div className="input-container">
            
            {/* Cấp độ tóm tắt nếu không ở welcome dashboard */}
            {!isInitialState && (
              <div className="level-tabs">
                {SUMMARY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleLevelChange(level.id)}
                    className={`tab-btn ${selectedLevel === level.id ? 'active' : ''}`}
                  >
                    {level.icon}
                    {level.title}
                  </button>
                ))}
              </div>
            )}

            {selectedFile && !isInitialState && (
              <div className="file-preview-chip">
                <FileText size={14} style={{ color: 'var(--primary-hover)' }} />
                <span className="file-name">{selectedFile.name}</span>
                <button onClick={removeSelectedFile} className="btn-remove-file">
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="textarea-wrapper">
              <button 
                className="btn-attach" 
                onClick={() => fileInputRef.current.click()}
                title="Đính kèm file PDF"
              >
                <Paperclip size={18} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf"
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
                placeholder="Nhập ghi chú thêm hoặc chỉ dẫn tóm tắt y khoa..."
                rows={1}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && !selectedFile) || isTyping}
                className="btn-send"
              >
                <Send size={18} />
              </button>
            </div>
            
            <p className="disclaimer">
              Mô hình chuyên dụng y sinh MedLM. Hãy kiểm tra chéo các thông tin lâm sàng quan trọng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}