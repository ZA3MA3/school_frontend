import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationApi } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useNotificationWebSocket(onChatUnreadUpdate?: (count: number) => void) {
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onChatUnreadUpdate);

  useEffect(() => {
    callbackRef.current = onChatUnreadUpdate;
  }, [onChatUnreadUpdate]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const connectWebSocket = async () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/ws-ticket/`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();
        const ticket = data.ticket;

        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?ticket=${ticket}`);

        ws.onopen = () => {
          console.log('Notification WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification_update') {
              setUnreadCount(data.count);
            } else if (data.type === 'chat_unread_update') {
              if (callbackRef.current) {
                callbackRef.current(data.count);
              }
            }
          } catch (e) {
            console.error('Error parsing notification WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('Notification WebSocket disconnected');
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to get WebSocket ticket for notifications:', error);
      }
    };

    const init = async () => {
      await loadUnreadCount();
      if (mounted) {
        connectWebSocket();
      }
    };

    init();

    return () => {
      mounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loadUnreadCount]);

  return { unreadCount, refresh: loadUnreadCount };
}
