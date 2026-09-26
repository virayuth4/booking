'use client'
import { useContext, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  fetchSignInMethodsForEmail,
  GoogleAuthProvider, 
  signInWithPopup,
  deleteUser 
} from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import authenticatedFetch from '../auth/authenticatedFetch';
import { AuthContext} from './authContext';

export const useSignUpLogic = ({ isModal = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callback');
  const {setCurrentUserManually, checkUserSession} = useContext(AuthContext)


  const STORAGE_KEY = 'shopping-cart';
  const CART_UPDATED_EVENT = 'cartUpdated';


  const checkIfUserExists = async (email) => {
    try {
      console.log('[DEBUG] checkIfUserExists -> checking:', email);
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log('[DEBUG] checkIfUserExists -> signInMethods result:', signInMethods);
      return signInMethods.length > 0;
    } catch (error) {
      console.error('[DEBUG] checkIfUserExists -> ERROR:', error.code, error.message);
      throw error;
    }
  };


const handleSuccessfulSignUp = async (user, fullName, referredBy) => {
  // Step A: the critical, must-succeed-or-rollback part
  let data;
  try {
    const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/create-user-profile`, {
      method: "POST",
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, fullName, referredBy })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data = await response.json();
  } catch (error) {
    console.error('Error creating backend profile:', error);
    setError('Failed to complete signup process. Please try again.');
    setIsLoading(false);
    return { success: false, error }; // caller will roll back Firebase — correct, since DB write never happened
  }

  // Step B: non-critical side effects — failures here should NOT trigger rollback
  try {
    setCurrentUserManually?.(data.user);

    localStorage.setItem('user', JSON.stringify({
      email: user.email,
      role: "buyer",
      id: data.user.id,
      isNew: true,
    }));

    // await loadCart?.();

    if (isModal) setIsOpen(false);

    if (data.user.isNew) {
      await router.push('/');
    } else if (callbackUrl) {
      await router.push(decodeURIComponent(callbackUrl));
    } else {
      await router.push('/');
    }
  } catch (sideEffectError) {
    // Log it, but the account IS valid at this point — don't roll back
    console.error('Non-critical post-signup step failed:', sideEffectError);
  }

  setIsLoading(false);
  return { success: true, data };
};
  const emailSignUp = async (email, password) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const userExists = await checkIfUserExists(email);
      if (userExists) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const result = await handleSuccessfulSignUp(userCredential.user);
      
      if (!result.success) {
        // If backend registration failed, clean up the Firebase user
        await deleteUser(userCredential.user);
        throw new Error('Failed to register with the backend server');
      }
      
      setIsLoading(false);
      return result;
      
    } catch (error) {
      console.error('Error signing up:', error);
      
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
        'auth/weak-password': 'Please choose a stronger password. It should be at least 6 characters long.'
      };

      setError(errorMessages[error.code] || 'Failed to sign up. Please try again.');
      setIsLoading(false);
      return { success: false, error };
    }
  };

  // fullName is no longer collected at signup — the backend fills in a
  // "user" + phoneNumber placeholder when it's omitted, so we simply don't
  // send it here.
  const phoneEmailSignUp = async (phoneNumber, password, referredBy) => {
    console.log('[DEBUG] phoneEmailSignUp -> called with phoneNumber:', phoneNumber, 'isLoading:', isLoading, 'referedBy:', referredBy);

    if (isLoading) return { success: false, error: 'Operation already in progress' };
    
    const phoneEmail = '855'+phoneNumber+'@phone.com';
    console.log('[DEBUG] phoneEmailSignUp -> constructed phoneEmail:', phoneEmail);
    
    setIsLoading(true);
    setError('');
    
    try {
      const userExists = await checkIfUserExists(phoneEmail);
      console.log('[DEBUG] phoneEmailSignUp -> userExists:', userExists);

      if (userExists) {
        setError('An account with this phone number already exists. Please sign in instead.');
        setIsLoading(false);
        return { success: false, error: 'Account already exists' };
      }

      // Step 1: Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, phoneEmail, password);
      
      // Step 2: Register with backend (fullName omitted — backend substitutes a placeholder)
      const result = await handleSuccessfulSignUp(userCredential.user, undefined, referredBy);
      
      // If backend registration failed, delete the Firebase user to maintain consistency
      if (!result.success) {
        console.error('[DEBUG] phoneEmailSignUp -> Backend registration failed. Deleting Firebase user:', userCredential.user.uid);
        await deleteUser(userCredential.user);
        console.log('[DEBUG] phoneEmailSignUp -> Firebase user deleted (rollback complete)');
        throw new Error('Failed to register with the backend server');
      }
      
      console.log("[DEBUG] phoneEmailSignUp -> Registration complete on both Firebase and backend");
      setIsLoading(false);
      return { success: true, user: userCredential.user };
      
    } catch (error) {
      console.error('[DEBUG] phoneEmailSignUp -> CAUGHT ERROR:', error.code || '(no code)', error.message);
      
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this phone number already exists. Please sign in instead.',
        'auth/invalid-email': 'Invalid phone format.',
        'auth/operation-not-allowed': 'Phone accounts are not enabled. Please contact support.',
        'auth/weak-password': 'Please choose a stronger password. It should be at least 6 characters long.'
      };

      setError(errorMessages[error.code] || 'Failed to sign up. Please try again.');
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };


  const googleSignUp = async () => {
    if (isLoading) return { success: false, error: 'Operation already in progress' };
    
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Use the user from Google sign-in result. fullName comes from the
      // Google profile when available, otherwise the backend falls back
      // to its "user" + phoneNumber-style placeholder.
      const signUpResult = await handleSuccessfulSignUp(result.user, result.user.displayName || undefined);
      
      if (!signUpResult.success) {
        // If backend registration failed, clean up
        await deleteUser(result.user);
        throw new Error('Failed to register with the backend server');
      }
      
      setIsLoading(false);
      return signUpResult;
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      
      const errorMessages = {
        'auth/popup-closed-by-user': 'Sign-up popup was closed. Please try again.',
        'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
        'auth/cancelled-popup-request': 'Previous sign-up operation is still in progress.',
        'auth/network-request-failed': 'Network error occurred. Please check your connection and try again.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.'
      };

      setError(errorMessages[error.code] || 'Failed to sign up with Google. Please try again.');
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  return {
    isLoading,
    error,
    emailSignUp,
    googleSignUp,
    phoneEmailSignUp
  };
};