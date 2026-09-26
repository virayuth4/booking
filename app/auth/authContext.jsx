'use client'
import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import authenticatedFetch from './authenticatedFetch';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { auth } from '../firebase/config';



export const AuthContext = createContext({
  currentUser: null,
  currentSession: null,
  loading: true,
  anonId: null,
  login: async () => {},
  logout: async () => {}
});

// Function to generate random anonymous ID
const generateAnonId = () => {
  return crypto.randomUUID();
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


const ANON_ID_KEY = 'anonId';
const ANON_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days — the browser-enforced cap anyway

// --- cookie helpers -------------------------------------------------

const setCookie = (name, value, maxAge = ANON_ID_COOKIE_MAX_AGE) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

// --- unified anonId storage ------------------------------------------
// Reads from cookie first, falls back to localStorage, creates if neither
// exists, and always re-syncs both so they never drift apart.

const getOrCreateAnonId = () => {
  let id = null;

  try {
    id = getCookie(ANON_ID_KEY) || localStorage.getItem(ANON_ID_KEY);
    if (id && !UUID_RE.test(id)) {
      console.warn('Discarding non-UUID anonId:', id);
      id = null;
    }
  } catch (error) {
    console.error('Error reading anonId:', error);
  }

  if (!id) {
    id = generateAnonId();
  }

  try {
    localStorage.setItem(ANON_ID_KEY, id);
  } catch (error) {
    console.error('Error persisting anonId to localStorage:', error);
  }

  try {
    setCookie(ANON_ID_KEY, id);
  } catch (error) {
    console.error('Error persisting anonId to cookie:', error);
  }

  return id;
};
const clearAnonIdStorage = () => {
  localStorage.removeItem(ANON_ID_KEY);
  deleteCookie(ANON_ID_KEY);
};

// const sendUniqueAnonIdToServer = async (anonId) => {
//  try{
//   const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/user/anonId`, {
//     method: 'POST',
//     credentials: 'include',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ anonId })
//   });
//  } catch (error) {
//     console.error('Failed to send anonymous ID to server:', error);
//  }
 
// };


let cachedUserSessionPromise = null;

export const invalidateUserSessionCache = () => {
  cachedUserSessionPromise = null;
};

export const getUserId = (user) => user?.id ?? null;

export const checkUserSession = async (forceRefresh = false) => {
  // 1. Check in-memory promise
  if (cachedUserSessionPromise && !forceRefresh) {
    return cachedUserSessionPromise;
  }

  // 2. Check sessionStorage if not forcing a refresh
  if (!forceRefresh && typeof window !== 'undefined') {
    const cachedData = sessionStorage.getItem('user_session_cache');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Ensure cache isn't older than 5 minutes
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data;
        }
      } catch (e) {
        sessionStorage.removeItem('user_session_cache');
      }
    }
  }

  // 3. Fetch from server and store in both places
  cachedUserSessionPromise = (async () => {
    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user/profile`,
        { method: 'GET', credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();

        // Save to sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'user_session_cache',
            JSON.stringify({ data, timestamp: Date.now() })
          );
        }
        return data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      return null;
    }
  })();

  return cachedUserSessionPromise;
};

export const clearUserData = () => {
  try {
    clearUserSessionCache();
    clearAnonIdStorage();
    localStorage.removeItem('event_tracker_history');
    sessionStorage.removeItem('user_session_cache');
    fetch('/api/session', { method: 'DELETE' }).catch(() => {});
    console.log('User data cleared');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Helper function to clear cache on logout
export const clearUserSessionCache = () => {
  cachedUserSessionPromise = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_session_cache');
  }
};

export const getUserPrefrences = async () => {
  try {
    const eventHistory = localStorage.getItem('event_tracker_history');
     // Return empty preferences if no history exists
    if (!eventHistory) {
      console.log('No event tracking history found in localStorage');
      return {
        tagPreferences: {},
        categoryPreferences: {},
        priceRanges: {
          min: 0,
          max: 0,
          preferred: 0
        },
        recentlyViewed: []
      };
    }
    // Parse the event history from JSON
    const events = JSON.parse(eventHistory);
    console.log('Event history loaded from localStorage:', events);
  } catch (e) {
    console.error('Failed to fetch user preferences:', e);
  }
}

// Pushes the Firebase ID token to our own httpOnly-cookie session endpoint
// and waits for it to finish. Both the onIdTokenChanged listener and the
// manual Google sign-up path call this — the listener alone was racing
// against create-user-profile calls that need the cookie to already exist.
const syncSessionCookie = async (firebaseUser) => {
  if (!firebaseUser) {
    await fetch('/api/session', { method: 'DELETE' });
    return;
  }
  const idToken = await firebaseUser.getIdToken();
  await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
};


export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anonId, setAnonId] = useState(null);
  const router = useRouter();


  useEffect(() => {
    const fetchInitialSession = async () => {
      // console.log("AuthProvider Mounted")
      const userData = await checkUserSession();
      setCurrentUser(userData?.user ?? null);
      setCurrentSession(userData?.session ?? null);

      if (!userData) {
        setAnonId(getOrCreateAnonId());
      }

      setLoading(false);
    };

    fetchInitialSession();
  }, []);

useEffect(() => {

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        await syncSessionCookie(firebaseUser);
      } catch (err) {
        console.error('Failed to sync session cookie:', err);
      }
    });
    return () => unsubscribe();
  }, []);


  const createAndSetCurrentUserManually = async (firebaseUser) => {
    try {
      // Make sure the httpOnly session cookie is set before calling any
      // authenticated backend route. The onIdTokenChanged listener above
      // also does this, but it fires asynchronously and isn't guaranteed
      // to finish before we get here — that gap was why a refresh was
      // needed to see the new user's data after signing up with Google.
      await syncSessionCookie(firebaseUser);

      const priorAnonId = anonId ?? getCookie(ANON_ID_KEY) ?? localStorage.getItem(ANON_ID_KEY);

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/create-user-profile`, {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          fullName: firebaseUser.displayName || undefined,
          anonId: priorAnonId, // let the backend merge/claim this anonId's history into the new account
        })
      })

      if (!response.ok) {
        throw new Error(`create-user-profile failed with status ${response.status}`);
      }

      const { user } = await response.json();
      if (user) {
        setCurrentUser(user);
        // Anon identity has been merged server-side (via priorAnonId above) —
        // safe to clear it from local state/storage now that it's attached to the account.
        clearAnonIdStorage();
        setAnonId(null);
        setLoading(false);
        return user;
      }
      return null;

    } catch (e) {
      console.error(`Unexpected Error with while create and set current user manually ${e}`)
      return null;
    }
  }

 const setCurrentUserManually = async () => {
  try {
    const userData = await checkUserSession(true); // { user, session } or null

    if (userData) {
      setCurrentUser(userData.user);
      setCurrentSession(userData.session);
      setAnonId(null);
      setLoading(false);
      return userData.user; // return just the user, matching what callers expect
    }

    if (!anonId) {
      setAnonId(getOrCreateAnonId());
    }

    return null;
  } catch (error) {
    console.error('Error in setCurrentUserManually', error);
    return null;
  }
};



const getAnonId = () => {
  return getOrCreateAnonId();
};

  // Function to clear anonId (can be used during logout)
  const clearAnonId = () => {
    clearAnonIdStorage();
    setAnonId(null);
  };

  // Function to regenerate anonId
  const regenerateAnonId = () => {
    const newAnonId = generateAnonId();
    localStorage.setItem(ANON_ID_KEY, newAnonId);
    setCookie(ANON_ID_KEY, newAnonId);
    setAnonId(newAnonId);
    return newAnonId;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      currentSession,
      loading,
      anonId,
      getAnonId,
      setCurrentUserManually,
      createAndSetCurrentUserManually,
      clearAnonId,
      regenerateAnonId,
      getUserPrefrences,
      getUserId,
      clearUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};