import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './home';
import { AppContext } from './App';
import useCommunity from './useCommunity';
jest.mock('./useCommunity');
jest.mock('./Questions', () => () => <div>Questions content</div>);
let live;
beforeEach(() => {
  localStorage.clear();
  live = { chats: [], people: [], questions: [], dashboard: {stats:{members:0,questions:0,answers:0,activeUsers:0,communities:0},trendingQuestions:[]}, error:'',loading:false,activeChat:null,messages:[],messagesLoading:false,hasOlder:false,nextChatOffset:null,select:jest.fn(),send:jest.fn(),markAllRead:jest.fn(),mute:jest.fn(),setError:jest.fn(),refreshChats:jest.fn() };
  useCommunity.mockImplementation(() => live);
});
function page(name) { return render(<MemoryRouter><AppContext.Provider value={{user:{userid:1,username:'test-user'},setUser:jest.fn()}}><Home page={name} /></AppContext.Provider></MemoryRouter>); }
test.each(['home','questions','chat'])('three-dot information panels toggle on %s and persist preference', name => {
  page(name);
  const toggle=screen.getByRole('button',{name:'Hide information panels'});
  expect(screen.getByText('Online Users')).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.queryByText('Online Users')).not.toBeInTheDocument();
  expect(localStorage.getItem('rightPanelsVisible')).toBe('false');
  fireEvent.click(screen.getByRole('button',{name:'Show information panels'}));
  expect(screen.getByText('Online Users')).toBeInTheDocument();
});
test('chat draft stays after failed send and clears only after saved send', async () => {
  live.activeChat={id:2,name:'Test recipient',initials:'TR',color:'avatar-blue',status:'Offline',kind:'direct'};
  live.chats=[live.activeChat]; live.send.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  page('chat');const input=screen.getByRole('textbox',{name:'Type a message'});
  fireEvent.change(input,{target:{value:'Keep my draft'}});fireEvent.click(screen.getByRole('button',{name:'Send message'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Send message'})).not.toBeDisabled());
  expect(input).toHaveValue('Keep my draft');
  fireEvent.click(screen.getByRole('button',{name:'Send message'}));
  await waitFor(()=>expect(input).toHaveValue(''));
});
test('conversation menu keeps contact details and persists mute through the API hook',()=>{
  live.activeChat={id:2,name:'Test recipient',initials:'TR',color:'avatar-blue',status:'Offline',kind:'direct'};live.chats=[live.activeChat];page('chat');
  fireEvent.click(screen.getByRole('button',{name:'Conversation options'}));
  fireEvent.click(screen.getByRole('menuitem',{name:'Mute notifications'}));expect(live.mute).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole('button',{name:'Conversation options'}));fireEvent.click(screen.getByRole('menuitem',{name:'View contact details'}));expect(screen.getAllByText('Test recipient').length).toBeGreaterThan(2);
});
