import React, { useEffect, useRef, useState } from 'react';
import axiosbase, { errorMessage } from './axiosConfig';
export default function CommunityDialog({ mode, onClose, onSelect, user, setUser }) {
  const [members, setMembers] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (mode === 'profile' || mode === 'settings') {
          const { data } = await axiosbase.get('/user/profile'); if (!cancelled) setProfile(data);
        } else {
          const { data } = await axiosbase.get('/user/users', { params: { search } });
          if (!cancelled) { setMembers(data.users.filter(person => person.userid !== user.userid)); setNextOffset(data.nextOffset); }
        }
      } catch (failure) { if (!cancelled) setError(errorMessage(failure, 'Unable to load data.')); }
      finally { if (!cancelled) setLoading(false); }
    };
    const timer = setTimeout(load, 200); return () => { cancelled = true; clearTimeout(timer); };
  }, [mode, search, user.userid]);
  const start = async (body) => {
    if (busy) return;
    setBusy(true); setError('');
    try { const { data } = await axiosbase.post('/chats', body); await onSelect(data.id); onClose(); }
    catch (failure) { setError(errorMessage(failure, 'Unable to start conversation.')); }
    finally { setBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'settings') await axiosbase.patch('/user/settings', { availability: profile.availability });
      else {
        const { data } = await axiosbase.patch('/user/profile', profile);
        setUser({ ...user, ...data }); localStorage.setItem('username', data.username);
      }
      onClose();
    } catch (failure) { setError(errorMessage(failure, 'Unable to save profile.')); }
    finally { setBusy(false); }
  };
  const more = async () => {
    try {
      const { data } = await axiosbase.get('/user/users', { params: { search, offset: nextOffset } });
      setMembers(current => [...current, ...data.users.filter(person => person.userid !== user.userid)]); setNextOffset(data.nextOffset);
    } catch (failure) { setError(errorMessage(failure, 'Unable to load more members.')); }
  };
  return <dialog ref={dialog} className="panel community-dialog" onCancel={onClose} aria-label={mode === 'profile' ? 'My Profile' : mode === 'settings' ? 'Settings' : 'Start a conversation'}>
    <section className="question-form-card">
      <button type="button" className="ask-question-toggle" onClick={onClose}>Close</button>
      <h2>{mode === 'profile' ? 'My Profile' : mode === 'settings' ? 'Settings' : mode === 'communities' ? 'Communities' : 'Start a conversation'}</h2>
      {error && <p className="questions-error" role="alert">{error}</p>}
      {loading && <p className="questions-empty">Loading...</p>}
      {(mode === 'profile' || mode === 'settings') && profile ? <form onSubmit={save}>
        {mode === 'profile' ? ['username','Fname','Lname','Email'].map(key => <label key={key}>{({username:'Username',Fname:'First name',Lname:'Last name',Email:'Email'})[key]}<input required maxLength={255} type={key === 'Email' ? 'email' : 'text'} value={profile[key]} onChange={event => setProfile({ ...profile, [key]: event.target.value })} /></label>) : <label>Availability<select value={profile.availability} onChange={event => setProfile({ ...profile, availability: event.target.value })}><option>Online</option><option>Away</option></select></label>}
        <button className="primary-button" disabled={busy}>Save</button>
      </form> : mode === 'communities' ? <form onSubmit={event => { event.preventDefault(); start({ kind: 'room', name }); }}><p>Choose a community in My Chats, or create one for all members.</p><input required maxLength={255} aria-label="Community name" placeholder="Community name" value={name} onChange={event => setName(event.target.value)} /><button className="primary-button" disabled={busy}>Create Community</button></form> : <>
        <input aria-label="Search members" maxLength={255} placeholder="Search members..." value={search} onChange={event => setSearch(event.target.value)} />
        {members.map(person => <button type="button" className="chat-link" disabled={busy} key={person.userid} onClick={() => start({ userId: person.userid })}><span className="chat-link-copy"><strong>{person.username}</strong><small>{person.status}</small></span></button>)}
        {!loading && members.length === 0 && <p className="questions-empty">No other members found.</p>}
        {nextOffset !== null && <button type="button" onClick={more}>Load more members</button>}
      </>}
    </section>
  </dialog>;
}
