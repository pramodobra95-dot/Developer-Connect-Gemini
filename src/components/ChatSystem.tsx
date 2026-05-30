import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Paperclip, 
  CheckCheck, 
  CheckCircle,
  MessageSquare,
  Sparkles,
  Lock,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Download
} from "lucide-react";
import { Chat, Message, User } from "../types.js";

interface ChatSystemProps {
  currentUser: User;
  chats: Chat[];
  messages: Message[];
  usersList: any[];
  onSendMessage: (chatId: string, receiverId: string, text: string, fileUrl?: string, fileType?: "image" | "file") => void;
  onInitiateChat: (oppositeId: string) => void;
  onToggleKeepOpen: (chatId: string, keepOpen: boolean) => void;
  selectedChatId?: string | null;
  onSelectChat?: (chatId: string | null) => void;
}

export default function ChatSystem({
  currentUser,
  chats,
  messages,
  usersList,
  onSendMessage,
  onInitiateChat,
  onToggleKeepOpen,
  selectedChatId: propSelectedChatId,
  onSelectChat
}: ChatSystemProps) {
  const [internalSelectedChatId, setInternalSelectedChatId] = useState<string | null>(chats[0]?.id || null);
  
  const selectedChatId = propSelectedChatId !== undefined ? propSelectedChatId : internalSelectedChatId;
  
  const setSelectedChatId = (id: string | null) => {
    if (onSelectChat) {
      onSelectChat(id);
    }
    setInternalSelectedChatId(id);
  };

  useEffect(() => {
    if (propSelectedChatId) {
      setInternalSelectedChatId(propSelectedChatId);
    } else if (chats.length > 0 && !internalSelectedChatId) {
      setInternalSelectedChatId(chats[0].id);
    }
  }, [propSelectedChatId, chats]);

  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Gemini actions state
  const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Sync scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  // Fetch Gemini suggested actions when chatId changes or last message updates
  const activeChat = chats.find(c => c.id === selectedChatId);
  const lastMessageText = activeChat?.lastMessageText;

  const fetchSuggestedActions = async (chatId: string) => {
    setLoadingSuggestions(true);
    try {
      const resp = await fetch(`/api/chats/${chatId}/suggested-actions`);
      if (resp.ok) {
        const data = await resp.json();
        setSuggestedActions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Error fetching Gemini suggested actions", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      fetchSuggestedActions(selectedChatId);
    } else {
      setSuggestedActions([]);
    }
  }, [selectedChatId, lastMessageText]);

  // Find active chat details
  const otherUserId = activeChat 
    ? (activeChat.developerId === currentUser.id ? activeChat.recruiterId : activeChat.developerId)
    : null;

  const otherUser = usersList.find(u => u.id === otherUserId);
  const otherProfileName = otherUser 
    ? (otherUser.role === "DEVELOPER" ? otherUser.devProfile?.fullName : otherUser.recProfile?.companyName)
    : "Connected partner";

  const chatMessages = selectedChatId 
    ? messages.filter(m => m.chatId === selectedChatId)
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !otherUserId || !text.trim()) return;
    onSendMessage(selectedChatId, otherUserId, text.trim());
    setText("");
  };

  const handleApplySuggestion = (suggestionText: string) => {
    setText(suggestionText);
  };

  // Real File Upload & sharing
  const processUploadFile = (file: File, type: "image" | "file") => {
    if (!selectedChatId || !otherUserId) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onSendMessage(selectedChatId, otherUserId, file.name, base64Data, type);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadFile(file, type);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      processUploadFile(file, isImage ? "image" : "file");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl h-[650px] flex overflow-hidden text-slate-800 shadow-sm">
      {/* Chats Thread list (Left panel) */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-sans font-bold text-slate-900 text-sm">Discussions</h3>
          <p className="text-[10px] text-indigo-600 font-semibold font-mono uppercase tracking-wide mt-0.5">Secure Intermediary Line</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              No active discussions. Connect via any candidate profile or application review!
            </div>
          ) : (
            chats.map((ch) => {
              const opId = ch.developerId === currentUser.id ? ch.recruiterId : ch.developerId;
              const usrDetails = usersList.find(u => u.id === opId);
              const opProfileName = usrDetails
                ? (usrDetails.role === "DEVELOPER" ? usrDetails.devProfile?.fullName : usrDetails.recProfile?.companyName)
                : ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChatId(ch.id)}
                  className={`w-full text-left p-4 hover:bg-slate-100 transition-all flex items-center justify-between cursor-pointer ${
                    selectedChatId === ch.id ? "bg-indigo-50/50 border-l-4 border-l-indigo-600" : ""
                  }`}
                >
                  <div className="overflow-hidden pr-2 flex-grow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{opProfileName}</p>
                      {ch.keepOpen && (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 ml-1.5 shrink-0">
                          KEEP OPEN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-1">{ch.lastMessageText}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0 font-mono">Just Now</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Feed Canvas (Right panel) */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {activeChat && otherUserId ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs text-indigo-600 font-bold border border-slate-200 shadow-sm select-none">
                  {otherProfileName ? otherProfileName.substring(0, 2).toUpperCase() : "CO"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{otherProfileName}</h4>
                  <span className="text-[9px] font-mono text-indigo-605 font-bold flex items-center gap-1 mt-0.5 select-none">
                    <CheckCircle className="w-2.5 h-2.5 text-indigo-600" /> SECURE CHAT CHANNEL (Section 72 Enforced)
                  </span>
                </div>
              </div>

              {/* Keep Chat Open Toggle option */}
              <div className="flex items-center gap-2 bg-slate-100/75 p-1.5 px-3 rounded-xl border border-slate-200 transition-all">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Keep Chat Open</span>
                <button
                  type="button"
                  onClick={() => onToggleKeepOpen(activeChat.id, !activeChat.keepOpen)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                    activeChat.keepOpen ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
                      activeChat.keepOpen ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Persistent Keep Open Announcement banner */}
            {activeChat.keepOpen && (
              <div className="bg-emerald-50 text-emerald-800 px-4 py-2 border-b border-emerald-100/80 flex items-center justify-between font-sans text-[11px] animate-fade-in select-none">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold">Persistent Mode Active:</span>
                  <span>This thread remains permanently open and priority-locked for both parties.</span>
                </div>
                <span className="font-mono text-[9px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">Priority line</span>
              </div>
            )}

            {/* Message Flow Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/20 relative transition-all duration-200 ${
                isDragging ? "bg-indigo-50/40 border-2 border-dashed border-indigo-400" : ""
              }`}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center pointer-events-none z-10 gap-3 text-indigo-700 animate-fade-in">
                  <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100">
                    <Paperclip className="w-8 h-8 text-indigo-600 animate-bounce" />
                  </div>
                  <p className="font-sans font-bold text-sm">Drop images or files here to upload instantly</p>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">Supports standard images and documents</p>
                </div>
              )}

              <div className="flex justify-center my-2">
                <span className="text-[9px] font-mono bg-slate-100 px-3 py-0.5 rounded-full text-slate-500 uppercase font-semibold">
                  Workspace Conversation Initiated
                </span>
              </div>

              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 stroke-[1.5] text-slate-300" />
                  <p className="text-[11px] font-sans font-semibold">No messages exchanged yet</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">Introduce yourself or propose project milestones below to build alignment!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[75%] ${isMine ? "self-end ml-auto items-end" : "self-start mr-auto items-start"}`}
                    >
                      <div className={`p-3 rounded-2xl leading-relaxed text-xs shadow-xs border ${
                        isMine 
                          ? "bg-indigo-600 text-white rounded-tr-none border-indigo-600" 
                          : "bg-white text-slate-800 rounded-tl-none border-slate-200"
                      }`}>
                        {msg.fileType ? (
                          <div className="space-y-2">
                            {msg.fileType === "image" ? (
                              <div className="rounded overflow-hidden border border-slate-200/50 max-w-[280px]">
                                <img 
                                  src={msg.fileUrl} 
                                  alt={msg.text} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-auto max-h-[160px] object-cover cursor-pointer hover:opacity-95 transition" 
                                  onClick={() => window.open(msg.fileUrl)}
                                />
                                <div className={`p-1.5 text-[10px] truncate font-mono flex items-center gap-1.5 ${isMine ? "bg-black/10 text-slate-100" : "bg-slate-50 text-slate-500"}`}>
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>{msg.text}</span>
                                </div>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isMine ? "bg-black/15 text-white border-white/10" : "bg-slate-50 text-slate-800 border-slate-200"}`}>
                                <FileText className="w-5 h-5 opacity-90 shrink-0" />
                                <div className="text-left overflow-hidden">
                                  <p className="text-[11px] font-bold font-mono truncate">{msg.text}</p>
                                  <span className="text-[9px] opacity-80 uppercase tracking-wide font-semibold">Document Attachment</span>
                                </div>
                                <a 
                                  href={msg.fileUrl} 
                                  download={msg.text}
                                  title="Download shared file"
                                  className={`p-1.5 rounded-lg hover:bg-black/10 transition shrink-0 ${isMine ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono">
                        <span>3:32 PM</span>
                        {isMine && <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggested Actions Bar */}
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 select-none">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200 animate-pulse" />
                  Gemini Suggested Actions
                </span>
                <button
                  type="button"
                  title="Ask Gemini to analyze history and regenerate suggested workflow shortcuts"
                  onClick={() => fetchSuggestedActions(activeChat.id)}
                  disabled={loadingSuggestions}
                  className="p-1 px-1.5 rounded hover:bg-slate-150 transition-all text-slate-400 hover:text-indigo-600 shrink-0 flex items-center gap-1 text-[10px] font-mono cursor-pointer disabled:opacity-55"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? "animate-spin text-indigo-600" : ""}`} />
                  <span>REFRESH</span>
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="py-2.5 flex items-center gap-2 text-[10px] text-slate-400 font-mono select-none">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Gemini is reading past chat milestones & formulating recommended next steps...</span>
                </div>
              ) : suggestedActions.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No recommendations yet. Send a message to seed AI contextual insights!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                  {suggestedActions.slice(0, 3).map((action, idx) => {
                    // Match Tailwind colors
                    let btnStyle = "border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
                    if (action.color === "green") {
                      btnStyle = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70";
                    } else if (action.color === "blue") {
                      btnStyle = "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100/70";
                    } else if (action.color === "indigo" || action.color === "purple") {
                      btnStyle = "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/70";
                    } else if (action.color === "yellow" || action.color === "amber") {
                      btnStyle = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70";
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplySuggestion(action.textToFill)}
                        className={`text-left p-2 rounded-xl border text-[10px] leading-tight transition-all cursor-pointer ${btnStyle}`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{action.title}</span>
                        </div>
                        <p className="opacity-80 text-[9px] mt-0.5 line-clamp-2">{action.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input Box with Real attachments */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 items-center">
              
              {/* Hidden file inputs */}
              <input 
                type="file" 
                ref={imageInputRef}
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileChange(e, "image")}
              />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".pdf,.doc,.docx,.zip,.csv,.txt"
                onChange={(e) => handleFileChange(e, "file")}
              />

              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  title="Share image from machine"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach generic document"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-none text-slate-800 transition-all font-sans"
                placeholder="Write your message, or click a Gemini suggestion to pre-fill..."
              />

              <button
                type="submit"
                disabled={!text.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-300 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Select a Chat Conversation Thread</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Frictionless discussions can be started freely with developers or recruiter partners across the system.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
