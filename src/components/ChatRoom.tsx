import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Message } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface ChatRoomProps {
  activityId: number;
  currentUser: User;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ activityId, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            users(avatar_url, avatar_position)
          `)
          .eq('activity_id', activityId)
          .order('timestamp', { ascending: true });

        if (data) {
          setMessages(data.map((m: any) => ({
            ...m,
            user_avatar: m.users?.avatar_url || null,
            user_avatar_position: m.users?.avatar_position || 'center'
          })));
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`chat-${activityId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `activity_id=eq.${activityId}`
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/activities/${activityId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          text: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <UserIcon size={32} className="opacity-20" />
            <p className="text-xs font-medium italic">Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-500">{msg.user_name}</span>
                  <span className="text-[9px] text-slate-400">
                    {format(parseISO(msg.timestamp), 'HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <div 
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm shadow-sm",
                    isMe 
                      ? "bg-[#00153D] text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={connected ? "Digite sua mensagem..." : "Conectando..."}
          disabled={!connected}
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={!connected || !newMessage.trim()}
          className="p-2 bg-[#00153D] text-white rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
