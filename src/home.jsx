import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from './App';
import Questions from './Questions';
import { CommunityIllustration } from './AuthLayout';
import axiosbase from './axiosConfig';
import './home.css';
import './data-dialog.css';
import useCommunity from './useCommunity';
import CommunityDialog from './CommunityDialog';
import { errorMessage } from './axiosConfig';

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    question: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1.2 1.2-1.9 1.5-1.9 3" /><path d="M12 17h.01" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
    smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    paperclip: <><path d="m21.4 11.1-8.5 8.5a5 5 0 0 1-7.1-7.1l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg {...common}>{paths[name] || paths.chat}</svg>;
}

function Avatar({ person, small = false }) {
  return <span className={`avatar ${person.color}${small ? ' avatar-small' : ''}`} aria-label={person.name}>{person.initials}</span>;
}

function formatTimeAgo(dateValue) {
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return 'recently';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
}

function Home({ page = 'home' }) {
  const { user, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const username = user?.username || localStorage.getItem('username') || 'Guest';
  const signedInPerson = { name: username, initials: username.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: 'avatar-blue' };
  const [dialogMode, setDialogMode] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelsVisible, setRightPanelsVisible] = useState(() => localStorage.getItem('rightPanelsVisible') !== 'false');
  const [questionTab, setQuestionTab] = useState('Recent');
  const live = useCommunity(user, page, search, questionTab);
  const activeDirectChat = live.activeChat;
  const directChatList = live.chats;
  const homeDashboard = live.dashboard;
  const homeDashboardError = user ? live.error : 'Sign in to view live community data.';
  const setActiveDirectChat = (chat) => { live.select(chat.id); };
  const setActiveChat = (chat) => { if (chat) { live.select(chat.id); navigate('/chat'); } };
  const activeChat = live.activeChat;
  const visibleChats = live.chats;
  const visiblePeople = live.people;
  const visibleQuestions = live.questions.map(item => ({ ...item, answers: Number(item.answer_count), time: formatTimeAgo(item.created_at), icon: '▣' }));
  const quickQuestions = visibleQuestions;
  const normalizedSearch = search.trim().toLowerCase();
  const unreadTotal = live.chats.reduce((total, chat) => total + (chat.muted ? 0 : chat.unread), 0);
  const selectCreatedChat = async (id) => { setSearch(''); await live.refreshChats(); live.select(id); navigate('/chat'); };
  const downloadAttachment = async (item) => {
    try {
      const { data } = await axiosbase.get(`/chats/${item.conversation_id}/messages/${item.id}/attachment`, { responseType: 'blob' });
      const url = URL.createObjectURL(data), link = document.createElement('a');
      link.href = url; link.download = item.attachment_name; link.click(); URL.revokeObjectURL(url);
    } catch { live.setError('Attachment could not be downloaded. Please try again.'); }
  };

  const logout = async () => {
    try {
      await axiosbase.post('/user/logout');
      localStorage.removeItem('token'); localStorage.removeItem('username');
      setUser(null); navigate('/login');
    } catch (error) { live.setError(errorMessage(error, 'Log out failed. Please try again.')); }
  };

  const toggleNavigation = () => {
    if (window.innerWidth <= 800) {
      setMobileNavOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  const toggleRightPanels = () => {
    setRightPanelsVisible((visible) => {
      const nextVisible = !visible;
      localStorage.setItem('rightPanelsVisible', String(nextVisible));
      return nextVisible;
    });
  };

  return (
    <div className={`dashboard dashboard-page-${page}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">•••</span>
          <span><strong>ChatQ</strong><small>Chat · Ask · Learn · Together</small></span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          <Link className={`nav-item${page === 'home' ? ' active' : ''}`} to="/" onClick={() => setMobileNavOpen(false)}><Icon name="home" />Home</Link>
          {page !== 'chat' ? <>
            <Link className={`nav-item${page === 'questions' ? ' active' : ''}`} to="/questions" onClick={() => setMobileNavOpen(false)}><Icon name="question" />Questions &amp; Answers</Link>
            <Link className={`nav-item${page === 'chat' ? ' active' : ''}`} to="/chat" onClick={() => { setMobileNavOpen(false); }}><Icon name="chat" />Chat</Link>
          </> : <>
            <Link className={`nav-item${page === 'chat' ? ' active' : ''}`} to="/chat" onClick={() => { setMobileNavOpen(false); }}><Icon name="chat" />Chat</Link>
            <Link className={`nav-item${page === 'questions' ? ' active' : ''}`} to="/questions" onClick={() => setMobileNavOpen(false)}><Icon name="question" />Questions &amp; Answers</Link>
          </>}
          <button className="nav-item" onClick={() => { setDialogMode('communities'); setMobileNavOpen(false); }}><Icon name="users" />Communities</button>
          <button className="nav-item" onClick={() => { setDialogMode('profile'); setMobileNavOpen(false); }}><Icon name="user" />My Profile</button>
          <button className="nav-item" onClick={() => { setDialogMode('settings'); setMobileNavOpen(false); }}><Icon name="settings" />Settings</button>
        </nav>

        <section className="sidebar-section chat-list-section">
          <div className="section-title"><span>{page === 'home' ? 'Recent Chats' : 'My Chats'}</span><button aria-label="Start a new chat" onClick={() => setDialogMode('people')}><Icon name="plus" size={16} /></button></div>
          {visibleChats.map((chat) => (
            <button className={`chat-link${activeChat?.id === chat.id ? ' selected' : ''}`} key={chat.id} onClick={() => setActiveChat(chat)}>
              <span className={`chat-symbol ${chat.color}`}>{chat.icon}</span>
              <span className="chat-link-copy"><strong>{chat.name}</strong><small>{chat.preview}</small></span>
              <span className="chat-meta"><small>{chat.time}</small>{chat.unread > 0 && <i>{chat.unread}</i>}</span>
            </button>
          ))}
        </section>

        {page !== 'home' && <section className="sidebar-section recent-questions">
          <div className="section-title"><span>Recent Questions</span></div>
          {visibleQuestions.slice(0, 5).map((item) => (
            <Link className="recent-question" to={`/questions?question=${item.id}`} key={item.id}>
              <span className="recent-question-icon"><Icon name="question" size={15} /></span>
              <span><strong>{item.title}</strong><small>{item.answers} answers · {item.time}</small></span>
            </Link>
          ))}
        </section>}

        <div className="learn-card">
          <span className="learn-icon">✦</span>
          <strong>Learn Together</strong>
          <p>Ask questions, share ideas, help others grow.</p>
          <Link to="/questions?ask=1">Create New Question</Link>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="workspace">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={window.innerWidth <= 800 ? mobileNavOpen : !sidebarCollapsed} onClick={toggleNavigation}><span /><span /><span /></button>
          <label className="search-box">
            <Icon name="search" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={255} placeholder="Search chats, questions, or users..." />
          </label>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}><Icon name="bell" />{unreadTotal > 0 && <i>{unreadTotal}</i>}</button>
            <button className="profile-button" aria-label={`Profile for ${username}`} onClick={() => setProfileOpen((open) => !open)}>
              <Avatar person={signedInPerson} small />
              <span className="topbar-profile-copy"><strong>{username}</strong><small><i className="online-dot" />{user ? 'Signed in' : 'Preview'}</small></span>
            </button>
            <button
              className="profile-menu-toggle"
              aria-label={rightPanelsVisible ? 'Hide information panels' : 'Show information panels'}
              aria-expanded={rightPanelsVisible}
              onClick={toggleRightPanels}
            >⋮</button>
            {notificationsOpen && <div className="profile-menu"><strong>Unread conversations</strong>{live.chats.filter(chat => chat.unread > 0 && !chat.muted).map(chat => <button key={chat.id} onClick={() => { setActiveChat(chat); setNotificationsOpen(false); }}>{chat.name} · {chat.unread}</button>)}{unreadTotal === 0 && <p>No unread messages.</p>}</div>}
            {profileOpen && <div className="profile-menu">
              <button onClick={() => { setDialogMode('settings'); setProfileOpen(false); }}><span className="menu-dot" />Availability <span>›</span></button>
              <button onClick={() => { navigate('/questions'); setProfileOpen(false); }}><Icon name="question" size={16} />Quick Q&amp;A <span>›</span></button>
              <button onClick={() => { setDialogMode('profile'); setProfileOpen(false); }}><Icon name="user" size={16} />Profile</button>
              <button onClick={() => { setDialogMode('settings'); setProfileOpen(false); }}><Icon name="settings" size={16} />Settings</button>
              <button onClick={logout} className="logout-button">↪ Log out</button>
            </div>}
          </div>
        </header>

        {live.error && <p className="questions-error" role="alert">{live.error}</p>}
        {live.loading && <p className="questions-empty">Loading community data...</p>}
        {dialogMode && user && <CommunityDialog mode={dialogMode} user={user} setUser={setUser} onClose={() => setDialogMode(null)} onSelect={selectCreatedChat} />}
        {page === 'home' ? (
          <div className={`page-with-info-panels${rightPanelsVisible ? '' : ' panels-hidden'}`}>
            <HomeOverview username={username} dashboard={homeDashboard} error={homeDashboardError} />
            {rightPanelsVisible && <DashboardInfoPanels
              people={visiblePeople}
              questions={quickQuestions}
              questionTab={questionTab}
              onQuestionTabChange={setQuestionTab}
              onShowAllPeople={() => setDialogMode('people')}
              stats={homeDashboard?.stats}
            />}
          </div>
        ) : page === 'questions' ? (
          <div className={`page-with-info-panels${rightPanelsVisible ? '' : ' panels-hidden'}`}>
            <section className="questions-page panel"><Questions username={username} globalSearch={search} /></section>
            {rightPanelsVisible && <DashboardInfoPanels
              people={visiblePeople}
              questions={quickQuestions}
              questionTab={questionTab}
              onQuestionTabChange={setQuestionTab}
              onShowAllPeople={() => setDialogMode('people')}
              stats={homeDashboard?.stats}
            />}
          </div>
        ) : page === 'chat' ? (
          <ChatPage
            key={activeDirectChat?.id || 'empty'}
            chats={directChatList.filter((chat) => `${chat.name} ${chat.preview}`.toLowerCase().includes(normalizedSearch))}
            activeChat={activeDirectChat}
            messages={live.messages}
            onSelectChat={(chat) => {
              setActiveDirectChat(chat);
            }}
            onMarkAllRead={live.markAllRead}
            onSendMessage={(event, draft, file) => { event.preventDefault(); return live.send(draft, file); }}
            onNewChat={() => setDialogMode('people')}
            onMute={live.mute}
            onDownload={downloadAttachment}
            loading={live.messagesLoading}
            hasOlder={live.hasOlder}
            onLoadOlder={live.loadOlder}
            searchText={search}
            onChatSearch={setSearch}
            hasMoreChats={live.nextChatOffset !== null}
            onMoreChats={live.loadMoreChats}
            username={username}
            people={visiblePeople}
            questions={quickQuestions}
            questionTab={questionTab}
            onQuestionTabChange={setQuestionTab}
            onShowAllPeople={() => setDialogMode('people')}
              stats={homeDashboard?.stats}
            showInfoPanels={rightPanelsVisible}
          />
        ) : null}
      </main>
    </div>
  );
}

function ChatPage({
  chats,
  activeChat,
  messages,
  onSelectChat,
  onMarkAllRead,
  onSendMessage,
  onNewChat, onMute, onDownload, loading, hasOlder, onLoadOlder, hasMoreChats, onMoreChats, stats, searchText, onChatSearch,
  username,
  showInfoPanels,
  people: onlinePeople,
  questions: quickQuestions,
  questionTab,
  onQuestionTabChange,
  onShowAllPeople,
}) {
  const [draft, setDraft] = useState('');
  const chatSearch = searchText;
  const setChatSearch = onChatSearch;
  const [chatListMenuOpen, setChatListMenuOpen] = useState(false);
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  const notificationsMuted = Boolean(activeChat?.muted);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const chatSearchRef = useRef(null);
  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(chatSearch.trim().toLowerCase()));

  useEffect(() => { setDraft(''); setFile(null); setContactDetailsOpen(false); setConversationMenuOpen(false); }, [activeChat?.id]);
  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => { bottomRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [lastMessageId]);
  const chooseFile = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (!chosen.size || chosen.size > 1048576) { setFileError('Choose a nonempty file up to 1 MiB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setFile({ name: chosen.name, data: String(reader.result).split(',')[1] }); setFileError(''); };
    reader.onerror = () => setFileError('The file could not be read.');
    reader.readAsDataURL(chosen);
  };
  const submitMessage = async (event) => {
    event.preventDefault();
    if (sending || (!draft.trim() && !file)) return;
    setSending(true);
    try { if (await onSendMessage(event, draft, file)) { setDraft(''); setFile(null); } }
    finally { setSending(false); }
  };

  return (
    <section className={`chat-page-layout panel${showInfoPanels ? '' : ' chat-panels-hidden'}`}>
      <aside className="direct-chat-list">
        <header className="direct-chat-list-heading">
          <h1>My Chats</h1>
          <button type="button" aria-label="Find someone to chat with" onClick={onNewChat}><Icon name="plus" size={16} /></button>
          <div className="chat-menu-anchor">
            <button
              type="button"
              aria-label="Chat list options"
              aria-expanded={chatListMenuOpen}
              className="direct-chat-options"
              onClick={() => setChatListMenuOpen((open) => !open)}
            >⋮</button>
            {chatListMenuOpen && <div className="chat-options-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { onMarkAllRead(); setChatListMenuOpen(false); }}>Mark all as read</button>
            </div>}
          </div>
        </header>
        <label className="direct-chat-search">
          <Icon name="search" size={15} />
          <input ref={chatSearchRef} value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} maxLength={255} placeholder="Search conversations..." aria-label="Search conversations" />
        </label>
        <div className="direct-chat-items">
          {filteredChats.map((chat) => (
            <button
              type="button"
              className={`direct-chat-item${activeChat?.id === chat.id ? ' selected' : ''}`}
              key={chat.id}
              onClick={() => onSelectChat(chat)}
            >
              <Avatar person={chat} small />
              <span className="direct-chat-item-copy">
                <strong>{chat.name}</strong>
                <small>{chat.preview}</small>
              </span>
              <span className="direct-chat-item-meta">
                <time>{chat.time}</time>
                {chat.unread > 0 && <i>{chat.unread}</i>}
              </span>
            </button>
          ))}
          {hasMoreChats && <button type="button" className="view-all" onClick={onMoreChats}>Load more conversations</button>}
          {filteredChats.length === 0 && <p className="direct-chat-empty">No conversations found.</p>}
        </div>
      </aside>

      <section className="direct-conversation">
        {activeChat ? <>
        <header className="direct-conversation-heading">
          <Avatar person={activeChat} small />
          <div className="direct-conversation-title">
            <h2>{activeChat.name}</h2>
            <p><i className={activeChat.status === 'Online' ? 'online-dot' : 'away-dot'} />{activeChat.kind === 'room' ? 'Community' : activeChat.status}</p>
          </div>
          <div className="chat-menu-anchor">
            <button
              type="button"
              className="direct-conversation-menu"
              aria-label="Conversation options"
              aria-expanded={conversationMenuOpen}
              onClick={() => setConversationMenuOpen((open) => !open)}
            >⋮</button>
            {conversationMenuOpen && <div className="chat-options-menu conversation-options-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { onMute(!notificationsMuted); setConversationMenuOpen(false); }}>
                {notificationsMuted ? 'Unmute notifications' : 'Mute notifications'}
              </button>
              <button type="button" role="menuitem" onClick={() => { setContactDetailsOpen((open) => !open); setConversationMenuOpen(false); }}>
                {contactDetailsOpen ? 'Hide contact details' : 'View contact details'}
              </button>
            </div>}
          </div>
        </header>
        {contactDetailsOpen && <div className="direct-contact-details">
          <Avatar person={activeChat} small />
          <span><strong>{activeChat.name}</strong><small>{activeChat.kind === 'room' ? 'Community' : activeChat.status}</small></span>
          {notificationsMuted && <small className="muted-status">Notifications muted</small>}
        </div>}
        {!contactDetailsOpen && notificationsMuted && <div className="direct-muted-status">Notifications muted for this chat</div>}
        <div className="direct-messages" aria-live="polite">
          {loading && <p className="direct-chat-empty">Loading messages...</p>}
          {hasOlder && <button type="button" className="view-all" onClick={onLoadOlder}>Load older messages</button>}
          {messages.map((item) => {
            const isOwnMessage = item.author === username;
            return (
              <article className={`direct-message${isOwnMessage ? ' own-message' : ''}`} key={item.id}>
                {!isOwnMessage && <Avatar person={item} small />}
                <div className="direct-message-content">
                  {!isOwnMessage && <strong className="direct-message-author">{item.author}</strong>}
                  {item.attachment ? (
                    <div className="direct-attachment">
                      <span className="direct-attachment-icon">▣</span>
                      <strong>{item.attachment_name}</strong>
                      <button type="button" aria-label={`Download ${item.text}`} onClick={() => onDownload(item)}>↓</button>
                    </div>
                  ) : <p className="direct-message-bubble">{item.text}</p>}
                  {item.attachment && item.body && <p className="direct-message-bubble">{item.body}</p>}
                  <time>{item.time}</time>
                </div>
              </article>
            );
          })}
          {!loading && messages.length === 0 && <p className="direct-chat-empty conversation-empty">Start a conversation with {activeChat.name}.</p>}
          <span ref={bottomRef} />
        </div>
        {fileError && <p className="questions-error" role="alert">{fileError}</p>}
        {file && <p className="direct-muted-status">{file.name}<button type="button" onClick={() => setFile(null)}>Remove attachment</button></p>}
        <form className="direct-composer" onSubmit={submitMessage}>
          <input type="file" hidden ref={fileRef} onChange={chooseFile} />
          <button type="button" className="direct-composer-add" aria-label="Add attachment" onClick={() => fileRef.current?.click()}><Icon name="plus" size={17} /></button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message..." aria-label="Type a message" maxLength={10000} disabled={sending} />
          <button type="button" aria-label="Add emoji" onClick={() => setDraft(value => value + ' 😊')}><Icon name="smile" size={16} /></button>
          <button type="button" aria-label="Attach file" onClick={() => fileRef.current?.click()}><Icon name="paperclip" size={16} /></button>
          <button type="submit" className="direct-send" aria-label="Send message" disabled={sending || (!draft.trim() && !file)}><Icon name="send" size={16} /></button>
        </form>
        </> : <p className="direct-chat-empty">Select a conversation or use + to start one.</p>}
      </section>
      {showInfoPanels && <DashboardInfoPanels
        people={onlinePeople}
        questions={quickQuestions}
        questionTab={questionTab}
        onQuestionTabChange={onQuestionTabChange}
        onShowAllPeople={onShowAllPeople}
        stats={stats}
      />}
    </section>
  );
}

function DashboardInfoPanels({ stats, people: onlinePeople, questions: quickQuestions, questionTab, onQuestionTabChange, onShowAllPeople }) {
  return (
    <aside className="chat-right-column">
      <section className="panel online-panel">
        <div className="panel-heading"><h2><Icon name="users" size={16} />Online Users</h2></div>
        <div className="people-list">
          {onlinePeople.length === 0 && <p className="no-results">No online members found.</p>}
          {onlinePeople.map((person) => <div className="person-row" key={person.name}>
            <Avatar person={person} small />
            <span className="person-copy"><strong>{person.name}</strong><small><i className={person.status === 'Online' ? 'online-dot' : 'away-dot'} />{person.status}</small></span>
          </div>)}
        </div>
        <button className="view-all" type="button" onClick={onShowAllPeople}>View all users <Icon name="arrow" size={15} /></button>
      </section>

      <section className="panel qna-panel">
        <div className="panel-heading"><h2>Quick Q&amp;A</h2><Link to="/questions">View all <Icon name="arrow" size={14} /></Link></div>
        <div className="question-tabs" role="tablist" aria-label="Question filter">
          {['Recent', 'Popular', 'Unanswered'].map((tab) => <button key={tab} className={questionTab === tab ? 'current' : ''} onClick={() => onQuestionTabChange(tab)} role="tab" aria-selected={questionTab === tab}>{tab}</button>)}
        </div>
        <div className="quick-questions">
          {quickQuestions.slice(0, 4).map((item) => <Link to={`/questions?question=${item.id}`} className="quick-question" key={item.id}>
            <span className="quick-question-icon">{item.icon}</span>
            <span className="quick-question-copy"><strong>{item.title}</strong><small>{item.answers} {item.answers === 1 ? 'answer' : 'answers'} · {item.time}</small></span>
            <span className="answer-count">▱ {item.answers}</span>
          </Link>)}
          {quickQuestions.length === 0 && <p className="no-results">{questionTab === 'Unanswered' ? 'No unanswered questions found.' : 'No matching questions.'}</p>}
        </div>
      </section>

      <section className="panel stats-panel">
        <div className="panel-heading"><h2><span className="stats-bars">▮▮▮</span>Platform Stats</h2></div>
        <div className="stat-row"><span className="stat-icon stat-users"><Icon name="users" /></span><span><small>Active Users</small><strong>{stats?.activeUsers ?? '—'}</strong></span></div>
        <div className="stat-row"><span className="stat-icon stat-questions"><Icon name="question" /></span><span><small>Questions Asked</small><strong>{stats?.questions ?? '—'}</strong></span></div>
        <div className="stat-row"><span className="stat-icon stat-answers">▣</span><span><small>Answers Given</small><strong>{stats?.answers ?? '—'}</strong></span></div>
        <div className="stat-row"><span className="stat-icon stat-groups"><Icon name="users" /></span><span><small>Communities</small><strong>{stats?.communities ?? '—'}</strong></span></div>
        <div className="learning-banner"><span>🚀</span><strong>Keep Learning!</strong><small>Great minds ask great questions.</small></div>
      </section>
    </aside>
  );
}

function HomeOverview({ username, dashboard, error }) {
  const stats = dashboard?.stats;
  const trendingQuestions = dashboard?.trendingQuestions || [];

  return (
    <div className="home-overview">
      <section className="welcome-card">
        <div>
          <h1>Welcome back,<br />{username}!</h1>
          <p>Great to see you again. Ask questions, share ideas, and be part of our growing community.</p>
        </div>
        <CommunityIllustration />
      </section>

      <section className="overview-stats" aria-label="Community statistics">
        <article className="overview-stat"><span className="stat-icon stat-users"><Icon name="users" /></span><div><strong>{stats?.members ?? '—'}</strong><small>Community Members</small></div></article>
        <article className="overview-stat"><span className="stat-icon stat-questions"><Icon name="question" /></span><div><strong>{stats?.questions ?? '—'}</strong><small>Questions Asked</small></div></article>
        <article className="overview-stat"><span className="stat-icon stat-answers">▣</span><div><strong>{stats?.answers ?? '—'}</strong><small>Answers Given</small></div></article>
      </section>

      <section className="overview-questions panel">
        <div className="panel-heading"><h2>Trending Questions</h2><Link to="/questions">View all <Icon name="arrow" size={15} /></Link></div>
        <div className="overview-question-list">
          {error && <p className="home-dashboard-error" role="alert">{error}</p>}
          {!dashboard && !error && <p className="home-dashboard-loading">Loading your dashboard...</p>}
          {trendingQuestions.slice(0, 5).map((item) => (
            <Link to={`/questions?question=${item.id}`} className="overview-question" key={item.id}>
              <span className="quick-question-icon"><Icon name="question" size={15} /></span>
              <span className="quick-question-copy"><strong>{item.title}</strong><small>{item.answer_count} {Number(item.answer_count) === 1 ? 'answer' : 'answers'} · {formatTimeAgo(item.created_at)}</small></span>
              <span className="answer-count">▱ {item.answer_count}</span>
            </Link>
          ))}
          {dashboard && trendingQuestions.length === 0 && <p className="no-results">No questions yet. Be the first to ask!</p>}
        </div>
      </section>
    </div>
  );
}

export default Home;
