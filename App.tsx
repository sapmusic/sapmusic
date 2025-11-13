




import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import SongRegistration from './components/SongRegistration';
import Agreements from './components/Agreements';
import Writers from './components/Writers';
import { RegisteredSong, ManagedWriter, User, Earning, PayoutRequest, PayoutStatus, AgreementStatus, ChatSession, ChatMessage, SyncDeal, DealStatus, SyncStatus, PayPalDetails, BankDetails, Role } from './types';
import { mockWriters, mockUsers, mockEarnings, mockPayouts, mockSyncDeals, PUBLISHING_AGREEMENT_TEXT } from './constants';
import ManageEarnings from './components/ManageEarnings';
import UserManagement from './components/UserManagement';
import ProfileSettings from './components/ProfileSettings';
import UserEarnings from './components/UserEarnings';
import ManagePayouts from './components/ManagePayouts';
import ManageRoles from './components/ManageRoles';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import AdminApproval from './components/AdminApproval';
import LiveSupport from './components/LiveSupport';
import SyncLicensing from './components/SyncLicensing';
import SongDetailModal from './components/SongDetailModal';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import AgreementTemplate from './components/AgreementTemplate';


type View = 'dashboard' | 'new-song' | 'agreements' | 'writers' | 'user-management' | 'earnings' | 'settings' | 'profile' | 'manager-roles' | 'payouts' | 'approval' | 'live-support' | 'sync-licensing' | 'agreement-template';

// Helper to convert snake_case keys from Supabase to camelCase
const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('_', ''));
const keysToCamel = (o: any): any => {
    if (Array.isArray(o)) {
        return o.map(v => keysToCamel(v));
    } else if (o !== null && typeof o === 'object') {
        return Object.keys(o).reduce((acc, key) => {
            acc[toCamel(key)] = keysToCamel(o[key]);
            return acc;
        }, {} as any);
    }
    return o;
};

// Helper to reconstruct a User object from a flat Supabase response
const reconstructUser = (rawUser: any): User => {
    const user: User = {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        role: rawUser.role,
        status: rawUser.status,
        hasProfile: true, // Mark that this user has a profile in the database
    };
    if (rawUser.payoutType === 'paypal' && rawUser.paypalEmail) {
        user.payoutMethod = {
            method: 'paypal',
            email: rawUser.paypalEmail
        };
    } else if (rawUser.payoutType === 'bank') {
        user.payoutMethod = {
            method: 'bank',
            accountHolderName: rawUser.accountHolderName,
            bankName: rawUser.bankName,
            swiftBic: rawUser.swiftBic,
            accountNumberIban: rawUser.accountNumberIban,
            country: rawUser.country,
        };
    }
    return user;
};

// Consistent query for fetching song data
// FIX: Changed `user_id` to `creator_id` and aliased it to match client-side expectations and resolve schema mismatch.
// FIX: Removed `agreement_text` to prevent crashes if the column doesn't exist in the database.
// The app will now inject this data on the client-side.
const SONG_SELECT_QUERY = `
    id,
    creator_id:user_id,
    title,
    artist:main_artist,
    artwork_url,
    registration_date,
    writers:writers_data,
    signature_data,
    sync_status,
    duration,
    isrc,
    upc,
    status
`;


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [songs, setSongs] = useState<RegisteredSong[]>([]);
  const [managedWriters, setManagedWriters] = useState<ManagedWriter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(mockPayouts);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [syncDeals, setSyncDeals] = useState<SyncDeal[]>(mockSyncDeals);
  const [viewingSong, setViewingSong] = useState<RegisteredSong | null>(null);
  const [agreementTemplate, setAgreementTemplate] = useState<string>(PUBLISHING_AGREEMENT_TEXT);
  const [isAgreementTemplateFeatureEnabled, setIsAgreementTemplateFeatureEnabled] = useState(true);
  const [isChatFeatureEnabled, setIsChatFeatureEnabled] = useState(true);
  const [isEarningsFeatureEnabled, setIsEarningsFeatureEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
        if (session) {
            let currentAgreementTemplate = PUBLISHING_AGREEMENT_TEXT;
            // FIX: Replaced direct table query with an edge function to fetch the agreement template,
            // bypassing the recursive RLS policy that was causing errors.
            const { data: templateData, error: templateError } = await supabase.functions.invoke('get-agreement-template');

            if (templateError) {
                // Log the error and disable the feature as a fallback.
                console.warn("Could not fetch agreement template via edge function, using default. Error:", templateError.message);
                setIsAgreementTemplateFeatureEnabled(false);
            } else if (templateData && templateData.template) {
                currentAgreementTemplate = templateData.template;
                setAgreementTemplate(templateData.template);
                setIsAgreementTemplateFeatureEnabled(true);
            } else {
                // Function ran successfully but no template was returned. This is a valid state.
                // The feature remains enabled, using the default text from constants.
                setIsAgreementTemplateFeatureEnabled(true);
            }

            // FIX: Replaced direct table query with an edge function invocation to bypass recursive RLS policies.
            const { data: userProfileResponse, error: userProfileError } = await supabase.functions.invoke('get-user-profile');
            const userProfileData = userProfileResponse?.user;
            
            // FIX: Use Promise.allSettled to allow parts of the app to load even if some fetches fail due to RLS issues.
            const results = await Promise.allSettled([
                supabase.from('managed_writers').select('id, user_id, name, dob, society, ipi:ipi_cae'),
                supabase.from('songs').select(SONG_SELECT_QUERY),
                supabase.from('chat_sessions').select('*'), // RLS filters this for the current user or admin
            ]);

            const [writersResult, songsResult, chatSessionsResult] = results;
            
            if (writersResult.status === 'rejected') {
                console.error("Error fetching managed writers:", writersResult.reason.message, writersResult.reason);
            } else if (writersResult.value.data) {
                setManagedWriters(keysToCamel(writersResult.value.data));
            }

            let userSongIds: string[] = [];
            if (songsResult.status === 'rejected') {
                console.error("Error fetching songs:", songsResult.reason.message, songsResult.reason);
            } else if (songsResult.value.data) {
                userSongIds = songsResult.value.data.map(s => s.id);
                // FIX: Map over fetched songs and inject the agreement text from the current template.
                // This ensures the rest of the app functions correctly without relying on the database column.
                const songsData = (keysToCamel(songsResult.value.data) as Omit<RegisteredSong, 'agreementText'>[]).map(song => ({
                    ...song,
                    agreementText: currentAgreementTemplate.replace('[DATE]', new Date(song.registrationDate).toLocaleDateString()),
                }));
                setSongs(songsData);
            }
            
            if (chatSessionsResult.status === 'rejected') {
                console.error("Error fetching chat sessions:", chatSessionsResult.reason.message, chatSessionsResult.reason);
            } else if (chatSessionsResult.value.data) {
                setChatSessions(keysToCamel(chatSessionsResult.value.data));
            }
            
            // Now fetch earnings. For non-admins, we filter by their song IDs to avoid RLS permission errors
            // if the policy is restrictive. This makes the fetch more robust.
            let earningsResult;

            if (userProfileData?.role === 'admin') {
                 earningsResult = await supabase.from('earnings').select('*').order('created_at', { ascending: false });
            } else {
                if (userSongIds.length > 0) {
                     earningsResult = await supabase.from('earnings').select('*').in('song_id', userSongIds).order('created_at', { ascending: false });
                } else {
                    // If a user has no songs, they have no earnings. No need to query.
                    earningsResult = { data: [], error: null };
                }
            }
            
            if (earningsResult.error) {
                console.error("Error fetching earnings:", earningsResult.error.message, earningsResult.error);
            } else if (earningsResult.data) {
                setEarnings(keysToCamel(earningsResult.data));
            }
            
            if (userProfileError) {
                console.error("Error fetching user profile:", userProfileError.message, userProfileError);
            } else if (!userProfileData) {
                 // The function returns { user: null } for new users without a profile.
                const newUser: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || 'New User',
                    role: 'user',
                    status: 'active',
                    hasProfile: false,
                };
                setCurrentUser(newUser);
            } else {
                const fullUser = reconstructUser(keysToCamel(userProfileData));
                setCurrentUser(fullUser);
                
                // If the user is an admin, fetch all other user profiles
                if (fullUser.role === 'admin') {
                    try {
                        const { data: allUsersData, error: allUsersError } = await supabase.functions.invoke('get-all-users');
                        if (allUsersError) throw allUsersError;
                        if (allUsersData && allUsersData.users) {
                            const allUsers = allUsersData.users.map((u: any) => reconstructUser(keysToCamel(u)));
                            setUsers(allUsers);
                        }
                    } catch (error: any) {
                        console.error('Error fetching all users:', error.message, error);
                        // Fallback to empty list if fetch fails
                        setUsers([]); 
                    }
                }
            }
        } else {
            // No session, clear all data
            setCurrentUser(null);
            setSongs([]);
            setManagedWriters([]);
            setEarnings([]);
            setPayoutRequests([]);
            setChatSessions([]);
            setChatMessages([]);
            setSyncDeals([]);
            setUsers([]);
        }
    };

    fetchUserData();
    
    // Set up a real-time subscription to the earnings table
    if (session) {
        const earningsChannel = supabase
            .channel('public:earnings')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'earnings' },
                (payload) => {
                    const newEarning = keysToCamel(payload.new) as Earning;
                    // Add new earning to the start of the list to show it at the top
                    setEarnings((prev) => [newEarning, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
            )
            .subscribe();

        // Clean up the channel when the component unmounts or session changes
        return () => {
            supabase.removeChannel(earningsChannel);
        };
    }
  }, [session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message, error);
    } else {
        // State will be cleared by the useEffect [session] dependency
        setCurrentView('dashboard');
    }
  };

  const handleRegistration = async (song: RegisteredSong): Promise<{ success: boolean; error?: any }> => {
    const { error } = await supabase.from('songs').insert({
        id: song.id,
        // FIX: Use `creator_id` to match the corrected schema assumption.
        creator_id: song.userId,
        title: song.title,
        main_artist: song.artist,
        artwork_url: song.artworkUrl,
        registration_date: song.registrationDate,
        writers_data: song.writers,
        signature_data: song.signatureData,
        status: song.status,
        sync_status: song.syncStatus,
        duration: song.duration,
        isrc: song.isrc,
        upc: song.upc,
        // agreement_text is NOT saved, it's generated on the fly.
    });
    
    if (error) {
        console.error('Error registering song:', error.message, error);
        return { success: false, error };
    }
    
    // Add song locally and trigger notification
    setSongs(prev => [song, ...prev]);
    
    // Send email notification to admin
    try {
        await supabase.functions.invoke('send-email', {
            body: { 
                userEmail: 'admin@sapmusicgroup.com', // Hardcoded admin email for now
                userName: 'Admin',
                songTitle: song.title,
                newStatus: 'pending_admin_notification'
            }
        });
    } catch (e: any) {
        console.error("Failed to send admin notification email:", e.message, e);
    }

    return { success: true };
  };

  const handleUpdateSongStatus = async (songId: string, status: AgreementStatus) => {
    const { data, error } = await supabase
      .from('songs')
      .update({ status: status })
      .eq('id', songId)
      .select()
      .single();

    if (error) {
      console.error('Error updating song status:', error.message, error);
      return;
    }
    
    if (data) {
        setSongs(prevSongs => prevSongs.map(s => s.id === songId ? { ...s, status } : s));
        const song = songs.find(s => s.id === songId);
        const user = users.find(u => u.id === song?.userId);

        if (song && user) {
            try {
                // Don't send email for 'pending' status changes made by admin.
                if (status === 'active' || status === 'rejected' || status === 'expired') {
                     await supabase.functions.invoke('send-email', {
                        body: {
                            userEmail: user.email,
                            userName: user.name,
                            songTitle: song.title,
                            newStatus: status
                        }
                    });
                }
            } catch (e: any) {
                console.error("Error sending status update email:", e.message, e);
            }
        }
    }
  };

  const handleAddManagedWriter = async (writerData: Omit<ManagedWriter, 'id' | 'userId'>): Promise<ManagedWriter | null> => {
      if (!currentUser) return null;

      const { data, error } = await supabase
          .from('managed_writers')
          .insert({
              user_id: currentUser.id,
              name: writerData.name,
              dob: writerData.dob,
              society: writerData.society,
              ipi_cae: writerData.ipi,
          })
          .select('id, user_id, name, dob, society, ipi:ipi_cae')
          .single();
      
      if (error) {
          console.error("Error adding managed writer:", error.message, error);
          return null;
      }
      const newWriter = keysToCamel(data) as ManagedWriter;
      setManagedWriters(prev => [...prev, newWriter]);
      return newWriter;
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    // FIX: Use `upsert` instead of `update` to handle creation of new user profiles.
    // This resolves a critical bug where new users could not save their initial profile.
    const payload: any = {
      // id is required for upsert to know which row to update or insert
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
    };

    if (updatedUser.payoutMethod) {
      payload.payout_type = updatedUser.payoutMethod.method;
      if (updatedUser.payoutMethod.method === 'paypal') {
        payload.paypal_email = updatedUser.payoutMethod.email;
        // Null out bank fields to prevent data conflicts
        payload.account_holder_name = null;
        payload.bank_name = null;
        payload.swift_bic = null;
        payload.account_number_iban = null;
        payload.country = null;
      } else {
        payload.account_holder_name = updatedUser.payoutMethod.accountHolderName;
        payload.bank_name = updatedUser.payoutMethod.bankName;
        payload.swift_bic = updatedUser.payoutMethod.swiftBic;
        payload.account_number_iban = updatedUser.payoutMethod.accountNumberIban;
        payload.country = updatedUser.payoutMethod.country;
        // Null out paypal field
        payload.paypal_email = null;
      }
    }

    const { data, error } = await supabase
        .from('users')
        .upsert(payload)
        .select()
        .single();
    
    if (error) {
      console.error("Error upserting user profile:", error.message, error);
    } else if(data) {
      const fullUser = reconstructUser(keysToCamel(data));
      // After a successful upsert, this user definitely has a profile.
      setCurrentUser({ ...fullUser, hasProfile: true });
      setUsers(prevUsers => {
          const userIndex = prevUsers.findIndex(u => u.id === fullUser.id);
          if (userIndex > -1) {
              const newUsers = [...prevUsers];
              newUsers[userIndex] = fullUser;
              return newUsers;
          }
          return [...prevUsers, fullUser];
      });
    }
  }

  const handleAddEarning = async (earningData: Omit<Earning, 'id'>): Promise<{ success: boolean; error?: any }> => {
    const { error } = await supabase.from('earnings').insert({
        song_id: earningData.songId,
        amount: earningData.amount,
        platform: earningData.platform,
        source: earningData.source,
        created_at: earningData.createdAt,
    });

    if (error) {
        console.error("Error adding earning record:", error.message, error);
        return { success: false, error };
    }

    // The realtime subscription will update the state, so we don't need to do it here.
    return { success: true };
  };

  const handleUpdateSongSyncStatus = async (songId: string, status: SyncStatus) => {
    const { error } = await supabase.from('songs').update({ sync_status: status }).eq('id', songId);
    if(error) {
        console.error("Error updating sync status:", error.message, error);
    } else {
        setSongs(prev => prev.map(s => s.id === songId ? {...s, syncStatus: status} : s));
    }
  }

  const handleCreateDeal = (deal: Omit<SyncDeal, 'id' | 'status' | 'offerDate'>) => {
      const newDeal: SyncDeal = {
          ...deal,
          id: `deal-${Date.now()}`,
          status: 'offered',
          offerDate: new Date().toISOString().split('T')[0],
      };
      // In a real app, this would be a DB insert.
      setSyncDeals(prev => [newDeal, ...prev]);
  };
  
  const handleUpdateDealStatus = (dealId: string, status: DealStatus) => {
      setSyncDeals(prev => prev.map(d => d.id === dealId ? {...d, status} : d));
  };
  
  const handleUpdateAgreementTemplate = async (newTemplate: string) => {
    const { error } = await supabase
      .from('app_settings')
      .update({ value: newTemplate })
      .eq('key', 'publishing_agreement_text');

    if (error) {
      console.error("Error saving agreement template:", error.message, error);
    } else {
      setAgreementTemplate(newTemplate);
    }
  };
  
  const handleSendMessage = async (text: string, sessionId: string, senderId: string) => {
    // This function will need to be implemented fully with Supabase Realtime/DB
    console.log("Sending message:", text, sessionId, senderId);
  }
  
  const handleSessionSelect = async (sessionId: string) => {
      // Mark session as read
      const session = chatSessions.find(s => s.id === sessionId);
      if(session && !session.isReadByAdmin){
        setChatSessions(prev => prev.map(s => s.id === sessionId ? {...s, isReadByAdmin: true} : s));
        // In a real app, this would update the DB.
        // await supabase.from('chat_sessions').update({ is_read_by_admin: true }).eq('id', sessionId);
      }
  }

  if (!session || !currentUser) {
    return <Login />;
  }
  
  const earningsForSong = (songId: string): Earning[] => {
    return earnings.filter(e => e.songId === songId);
  }
  
  const dealsForSong = (songId: string): SyncDeal[] => {
    return syncDeals.filter(d => d.songId === songId);
  }
  
  // A simple way to check if the user has filled out their profile.
  // In a real app, you might have more robust checks.
  if (!currentUser.hasProfile) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
            <div className="w-full max-w-2xl mx-auto">
                <ProfileSettings user={currentUser} onUpdateUser={handleUpdateUser} />
            </div>
        </div>
    );
  }


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return currentUser.role === 'admin' 
            ? <AdminDashboard songs={songs} onRegisterNew={() => setCurrentView('new-song')} onViewSongDetails={setViewingSong} /> 
            : <UserDashboard songs={songs} earnings={earnings} currentUser={currentUser} onRegisterNew={() => setCurrentView('new-song')} syncDeals={syncDeals} onUpdateDealStatus={handleUpdateDealStatus} onViewSongDetails={setViewingSong} managedWriters={managedWriters} />;
      case 'new-song':
        return <SongRegistration onRegistrationComplete={handleRegistration} managedWriters={managedWriters} currentUser={currentUser} onAddManagedWriter={handleAddManagedWriter} onRegistrationSuccess={() => setCurrentView('dashboard')} agreementTemplate={agreementTemplate} />;
      case 'agreements':
        return <Agreements songs={songs} onUpdateSongStatus={handleUpdateSongStatus} isAdmin={currentUser.role === 'admin'} onResubmitAgreement={async (songId) => { await handleUpdateSongStatus(songId, 'pending') }} />;
      case 'writers':
        return <Writers writers={managedWriters} onAddWriter={handleAddManagedWriter} />;
      case 'user-management':
        return currentUser.role === 'admin' ? <UserManagement users={users} /> : null;
      case 'earnings':
        return currentUser.role === 'admin' 
            ? <ManageEarnings songs={songs} earnings={earnings} onAddEarning={handleAddEarning} /> 
            : <UserEarnings songs={songs} earnings={earnings} currentUser={currentUser} payoutRequests={payoutRequests} onPayoutRequest={()=>{}} managedWriters={managedWriters} />;
      case 'payouts':
          return currentUser.role === 'admin' ? <ManagePayouts requests={payoutRequests} users={users} onUpdateStatus={() => {}} /> : null;
      case 'profile':
        return <ProfileSettings user={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'manager-roles':
        return currentUser.role === 'admin' ? <ManageRoles /> : null;
      case 'approval':
          return currentUser.role === 'admin' ? <AdminApproval songs={songs} users={users} onUpdateStatus={handleUpdateSongStatus} /> : null;
      case 'live-support':
          return currentUser.role === 'admin' ? <LiveSupport sessions={chatSessions} messages={chatMessages} users={users} onSendMessage={handleSendMessage} onSessionSelect={handleSessionSelect} /> : null;
      case 'sync-licensing':
          return currentUser.role === 'admin' ? <SyncLicensing songs={songs} deals={syncDeals} onUpdateSongSyncStatus={handleUpdateSongSyncStatus} onCreateDeal={handleCreateDeal} /> : null;
      case 'agreement-template':
          return currentUser.role === 'admin' ? <AgreementTemplate template={agreementTemplate} onSave={handleUpdateAgreementTemplate} /> : null;
      default:
        return <div>Not implemented</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        userRole={currentUser.role}
        onLogout={handleLogout}
        isAgreementEditorEnabled={isAgreementTemplateFeatureEnabled}
        isChatEnabled={isChatFeatureEnabled}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onRegisterNew={() => setCurrentView('new-song')} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
             {renderView()}
            </div>
        </main>
      </div>
      
       {isChatFeatureEnabled && currentUser.role === 'user' && (
        <Chatbot 
            currentUser={currentUser}
            session={chatSessions.find(s => s.userId === currentUser.id)}
            messages={chatMessages.filter(m => m.sessionId === chatSessions.find(s => s.userId === currentUser.id)?.id)}
            onSendMessage={(text, user) => console.log('Send message:', text, user.name)}
        />
      )}
      
      {viewingSong && (
        <SongDetailModal 
            song={viewingSong} 
            earningsForSong={earningsForSong(viewingSong.id)}
            dealsForSong={dealsForSong(viewingSong.id)}
            onClose={() => setViewingSong(null)}
        />
      )}
    </div>
  );
};

export default App;