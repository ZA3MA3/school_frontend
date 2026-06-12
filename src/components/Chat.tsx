import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X } from 'lucide-react';

interface Contact {
  id: number;
  full_name: string;
  role: string;
}

interface Message {
  id: number;
  sender: number;
  sender_name: string;
  receiver: number;
  receiver_name: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatProps {
  onClose?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export default function Chat({ onClose, onUnreadCountChange }: ChatProps) {
  const { t } = useTranslation();
  const { user, activeRole } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Ref so WS message handler always reads the latest selectedContact
  // without needing it as an effect dependency
  const selectedContactRef = useRef<Contact | null>(null);
  selectedContactRef.current = selectedContact;

  // Ref so we can call the latest onUnreadCountChange inside effects/handlers
  // without it becoming a dependency that causes re-runs
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  onUnreadCountChangeRef.current = onUnreadCountChange;

  // ✅ FIX: Sync total unread to parent in a dedicated effect.
  // Previously, onUnreadCountChange (parent setState) was called INSIDE a child
  // setState callback, which React forbids and caused the warning:
  // "Cannot update a component while rendering a different component".
  // Now unreadCounts is the single source of truth, and this effect
  // propagates the total upward after every change — safely, outside render.
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);
    onUnreadCountChangeRef.current?.(total);
  }, [unreadCounts]);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const data = await chatApi.getUnreadCounts(activeRole || undefined);
      // Just set state — the effect above will sync the total to the parent
      setUnreadCounts(data.contact_counts || {});
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  }, [activeRole]);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatApi.getContacts(activeRole || undefined);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  const loadMessages = async (contactId: number) => {
    try {
      const data = await chatApi.getMessages(contactId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  };

  // Initial load
  useEffect(() => {
    loadContacts();
    loadUnreadCounts();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loadContacts, loadUnreadCounts]);

  // WebSocket lifecycle.
  // Only depends on primitive IDs — not objects or functions — so it never
  // re-runs due to reference changes, which was the original infinite loop cause.
  useEffect(() => {
    if (!selectedContact) {
      disconnectWebSocket();
      return;
    }

    loadMessages(selectedContact.id);

    // ✅ Plain setState with no parent call inside the callback.
    // The dedicated sync effect above handles notifying the parent.
    setUnreadCounts(prev => {
      const next = { ...prev };
      delete next[selectedContact.id];
      return next;
    });

    // cancelled flag: if cleanup runs before the async ticket fetch resolves
    // (StrictMode double-invoke, or user switches contacts rapidly),
    // we discard the stale ticket rather than opening a zombie WebSocket.
    let cancelled = false;

    const connectWs = async () => {
      disconnectWebSocket();
      try {
        // Delay outlasts StrictMode's mount→unmount→remount cycle so the
        // first (discarded) mount's cleanup can set cancelled=true before
        // we consume a one-time ticket from the server.
        await new Promise(resolve => setTimeout(resolve, 150));
        if (cancelled) return;

        const ticket = await chatApi.getWsTicket();
        if (cancelled) return;

        const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/?ticket=${ticket}`);

        ws.onopen = () => {
          if (cancelled) { ws.close(); return; }
          console.log('WebSocket connected');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'message_sent' || data.type === 'new_message') {
              const msg = data.message;
              const contact = selectedContactRef.current;
              const currentUserId = user?.id;

              const isForThisConversation =
                (msg.sender === currentUserId && msg.receiver === contact?.id) ||
                (msg.sender === contact?.id && msg.receiver === currentUserId);

              if (isForThisConversation) {
                setMessages(prev => {
                  if (prev.some(m => m.id === msg.id)) return prev;
                  return [...prev, msg];
                });
              } else if (msg.receiver === currentUserId) {
                // ✅ Just update state — sync effect notifies parent automatically
                setUnreadCounts(prev => ({
                  ...prev,
                  [msg.sender]: (prev[msg.sender] || 0) + 1,
                }));
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to get WebSocket ticket:', error);
      }
    };

    connectWs();

    return () => {
      cancelled = true;
      disconnectWebSocket();
    };
  }, [selectedContact?.id, user?.id]); // ✅ primitives only — no function deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sending) return;

    setSending(true);
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_message',
          receiver_id: selectedContact.id,
          content: newMessage.trim(),
        }));
      } else {
        await chatApi.sendMessage(selectedContact.id, newMessage.trim());
        loadMessages(selectedContact.id);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const dateKey = new Date(msg.created_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-t bg-white dark:bg-zinc-900 flex justify-between items-center">
          <h2 className="font-semibold">{t('chat.messages')}</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No contacts available</p>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-b ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{contact.full_name}</p>
                      {unreadCounts[contact.id] > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCounts[contact.id] > 9 ? '9+' : unreadCounts[contact.id]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{contact.role}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-t bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {selectedContact.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedContact.full_name}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {selectedContact.role}
                    {` • ${wsConnected ? t('chat.connected') : t('chat.connecting')}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(groupMessagesByDate(messages)).map(([dateKey, msgs]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
                    <span className="text-xs text-muted-foreground">{formatDate(dateKey)}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
                  </div>
                  {msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex mb-2 ${
                        msg.sender === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === user?.id
                              ? 'text-blue-100'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white dark:bg-zinc-900">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chat.placeholder')}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 border-t flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('chat.selectContact')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}