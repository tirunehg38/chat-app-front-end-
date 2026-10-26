import { useCallback, useEffect, useRef, useState } from 'react';
import axiosbase, { errorMessage } from './axiosConfig';
export const personData = (name = '') => ({ name, initials: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(), color: 'avatar-blue' });
export const chatData = (chat) => ({ ...chat, ...personData(chat.name || chat.username), icon: chat.kind === 'room' ? '#' : (chat.username || '?').slice(0, 1), color: 'blue', preview: chat.preview || 'Start a conversation', unread: Number(chat.unread), muted: Boolean(chat.muted), time: chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' });
export const messageData = (item) => ({ ...item, ...personData(item.username), author: item.username, text: item.body || item.attachment_name, attachment: Boolean(item.attachment_name), time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
export default function useCommunity(user, page, search, questionTab) {
  const [chats, setChats] = useState([]);
  const [people, setPeople] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [nextChatOffset, setNextChatOffset] = useState(null);
  const [selectedId, setSelectedId] = useState(() => { const saved = Number(sessionStorage.getItem(`activeChat:${user?.userid}`)); return Number.isSafeInteger(saved) && saved > 0 ? saved : null; });
  const [selectedChat, setSelectedChat] = useState(null);
  const newest = useRef(0);
  const activeRef = useRef(null);
  activeRef.current = selectedId;
  const activeChat = chats.find(chat => chat.id === selectedId) || (selectedChat?.id === selectedId ? selectedChat : null);
  useEffect(() => { if (user && selectedId) sessionStorage.setItem(`activeChat:${user.userid}`, String(selectedId)); }, [user, selectedId]);
  useEffect(() => {
    if (!user || !selectedId || page !== 'chat') return;
    let cancelled = false;
    axiosbase.get(`/chats/${selectedId}`).then(({data}) => { if (!cancelled) setSelectedChat(chatData(data)); }).catch(failure => {
      if (cancelled) return;
      setError(errorMessage(failure, 'Conversation could not be loaded.'));
      if (failure.response?.status === 404) setSelectedId(null);
    });
    return () => { cancelled = true; };
  }, [user, selectedId, page]);
  const refreshChats = useCallback(async () => {
    const { data } = await axiosbase.get('/chats', { params: { limit: 100, search } });
    setChats(current => [...data.conversations.map(chatData), ...current.filter(chat => !data.conversations.some(row => row.id === chat.id) && data.nextOffset !== null)]);
    setNextChatOffset(data.nextOffset);
    return data.conversations;
  }, [search]);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let disposed = false, running = false;
    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        const results = await Promise.allSettled([
          axiosbase.get('/chats', { params: { limit: 100, search } }),
          axiosbase.get('/user/users', { params: { online: '1', search } }),
          axiosbase.get('/all_question', { params: { limit: 5, search, filter: questionTab === 'Popular' ? 'popular' : questionTab === 'Unanswered' ? 'unanswered' : 'all' } }),
          axiosbase.get('/dashboard/home'),
        ]);
        if (disposed) return;
        if (results[0].status === 'fulfilled') {
          const data = results[0].value.data;
          setChats(current => [...data.conversations.map(chatData), ...current.filter(chat => !data.conversations.some(row => row.id === chat.id) && data.nextOffset !== null)]);
          setNextChatOffset(data.nextOffset);
          setSelectedId(current => current || data.conversations[0]?.id || null);
        }
        if (results[1].status === 'fulfilled') setPeople(results[1].value.data.users.map(person => ({ ...person, ...personData(person.username) })));
        if (results[2].status === 'fulfilled') setQuestions(results[2].value.data);
        if (results[3].status === 'fulfilled') setDashboard(results[3].value.data);
        const failed = results.find(result => result.status === 'rejected');
        setError(failed ? errorMessage(failed.reason, 'Some community data could not be loaded. Please retry.') : '');
      } finally { running = false; if (!disposed) setLoading(false); }
    };
    const delay = setTimeout(refresh, 200);
    const timer = setInterval(refresh, 10000);
    window.addEventListener('community-changed', refresh);
    return () => { disposed = true; clearTimeout(delay); clearInterval(timer); window.removeEventListener('community-changed', refresh); };
  }, [user, page, search, questionTab]);
  useEffect(() => {
    if (!user) return;
    const beat = () => { if (document.visibilityState === 'visible') axiosbase.post('/user/heartbeat').catch(() => setError('Presence could not be updated. Check your connection.')); };
    beat(); const timer = setInterval(beat, 25000);
    return () => clearInterval(timer);
  }, [user]);
  useEffect(() => {
    setMessages([]); newest.current = 0; setHasOlder(false);
    if (!user || !selectedId || page !== 'chat') return;
    let disposed = false, running = false, initialized = false;
    setMessagesLoading(true);
    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        const { data } = await axiosbase.get(`/chats/${selectedId}/messages`, { params: initialized ? { after: newest.current } : {} });
        if (disposed) return;
        if (!initialized) setHasOlder(data.hasMore);
        initialized = true;
        if (data.messages.length) {
          newest.current = Math.max(newest.current, data.messages.at(-1).id);
          setMessages(current => [...current.filter(item => !data.messages.some(row => row.id === item.id)), ...data.messages.map(messageData)].sort((a,b) => a.id-b.id));
        }
        if (document.visibilityState === 'visible') {
          await axiosbase.post(`/chats/${selectedId}/read`, { lastId: newest.current });
          if (!disposed) setChats(current => current.map(chat => chat.id === selectedId ? { ...chat, unread: 0 } : chat));
        }
      } catch (failure) { if (!disposed) setError(errorMessage(failure, 'Messages could not be loaded.')); }
      finally { running = false; if (!disposed) setMessagesLoading(false); }
    };
    refresh(); const timer = setInterval(refresh, 2000);
    return () => { disposed = true; clearInterval(timer); };
  }, [user, selectedId, page]);
  const loadOlder = async () => {
    const target = selectedId;
    try {
      const { data } = await axiosbase.get(`/chats/${target}/messages`, { params: { before: messages[0]?.id } });
      if (activeRef.current !== target) return;
      setHasOlder(data.hasMore);
      setMessages(current => [...data.messages.map(messageData).filter(item => !current.some(row => row.id === item.id)), ...current]);
    } catch (failure) { setError(errorMessage(failure, 'Older messages could not be loaded.')); }
  };
  const loadMoreChats = async () => {
    try {
      const { data } = await axiosbase.get('/chats', { params: { offset: nextChatOffset, limit: 100, search } });
      setChats(current => [...current, ...data.conversations.map(chatData).filter(chat => !current.some(row => row.id === chat.id))]);
      setNextChatOffset(data.nextOffset);
    } catch (failure) { setError(errorMessage(failure, 'Conversations could not be loaded.')); }
  };
  const send = async (draft, file) => {
    const target = selectedId;
    try {
      const { data } = await axiosbase.post(`/chats/${target}/messages`, { text: draft, attachment: file });
      if (activeRef.current === target) setMessages(current => [...current.filter(item => item.id !== data.id), messageData(data)].sort((a,b) => a.id-b.id));
      try { await refreshChats(); } catch { setError('Message saved, but the conversation list could not be refreshed.'); }
      return true;
    } catch (failure) { setError(errorMessage(failure, 'Message could not be sent. Your draft has been kept.')); return false; }
  };
  const markAllRead = async () => { try { await axiosbase.post('/chats/read-all'); await refreshChats(); } catch (failure) { setError(errorMessage(failure, 'Read state could not be saved.')); } };
  const mute = async (value) => {
    try { await axiosbase.patch(`/chats/${selectedId}/preferences`, { muted: value }); await refreshChats(); }
    catch (failure) { setError(errorMessage(failure, 'Chat preference could not be saved.')); }
  };
  return { chats, people, questions, dashboard, error, setError, loading, activeChat, select: setSelectedId, messages, messagesLoading, hasOlder, loadOlder, nextChatOffset, loadMoreChats, send, markAllRead, mute, refreshChats };
}
