'use client'
import { useContext, useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import authenticatedFetch from '@/app/auth/authenticatedFetch';
import { AuthContext, checkUserSession, setCurrentUserManually} from './authContext';



export const useLoginLogic = ({ isModal = false, callback: callbackOverride  }) => {
const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  const router = useRouter();
  const auth = getAuth();
  const searchParams = useSearchParams();
  const callbackUrl = callbackOverride ?? searchParams.get('callback');
  const {setCurrentUserManually, createAndSetCurrentUserManually} = useContext(AuthContext)

 

  const checkNewUser = (user) => {
    if (user.user.isNew) {
      router.push('/') //replace complete-signup
    }
  }

  const handleSuccessLogin = async (user) => {
    try {

      const currentUser = await setCurrentUserManually();

      console.log('currentUser after successful login', currentUser)
      
    //   await loadCart()

      if (isModal) {
        await checkNewUser(data)
      } else if (callbackUrl) {
        await router.push(decodeURIComponent(callbackUrl));
      } else {
        router.push('/admin');
      }

    } catch (error) {
      console.error('Profile retrieval error:', error);
      setError('Failed to retrieve user information. Please try again.');
    } finally {
        setIsLoading(false)
        setIsOpen(false)
    }
  };

  const handleGoogleSuccessfulLogin = async (result) => {
    try {
        // Check if the user is new
        // console.log('result in handleGoogle Sign IN', result)
        const creationTime = new Date(result.metadata.creationTime).getTime();
        const currentTime = Date.now();
        const threshold = 60000; // 1 minute in milliseconds
        const isNewUser = currentTime - creationTime < threshold;
        // console.log('isNewUser', isNewUser)
        // Set current user manually, passing isNew as true if the user is new
        if (isNewUser) {
          const currentUser = await createAndSetCurrentUserManually(result)
          
        } else {
          const currentUser = await setCurrentUserManually();
        }
      
        
        // await loadCart();

        if (isModal) {
            setIsOpen(false);
        } else if (callbackUrl) {
            await router.push(decodeURIComponent(callbackUrl));
        } else {
            router.push('/');
        }

    } catch (error) {
        console.error('Profile creation error:', error);
        setError('Failed to complete signup process. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

  const emailSignIn = async (email, password) => {
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessLogin(userCredential.user);
    } catch (err) {
      setError('Invalid phone number or password');
      console.error(err);
      setIsLoading(false);
    }
  };
  const phoneEmailSignIn = async (phoneNumber, password) => {
    setIsLoading(true);
    setError('');

    
    // Check if phone number starts with 0 and remove it
    let formattedPhoneNumber = phoneNumber;
    if (formattedPhoneNumber.startsWith('0')) {
      formattedPhoneNumber = formattedPhoneNumber.substring(1);
    }

    
    const phoneEmail = '855' + formattedPhoneNumber + '@phone.com';
        console.log('phone number in phoneEmailSignIn', phoneEmail)
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, phoneEmail, password);
      await handleSuccessLogin(userCredential.user);
    } catch (err) {
      setError('Invalid phone number or password');
      console.error(err);
      setIsLoading(false);
    }
  };

  const googleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

  
      await handleGoogleSuccessfulLogin(result.user)

   
 
    
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      const errorMessages = {
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
        'auth/cancelled-popup-request': 'Previous sign-in operation is still in progress.',
        'auth/network-request-failed': 'Network error occurred. Please check your connection and try again.'
      };

      setError(errorMessages[error.code] || 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };


  const goToSignup = () => {
    const callbackParam = callbackUrl ? `?callback=${encodeURIComponent(callbackUrl)}` : '';
    router.push(`/signup${callbackParam}`);
  };

  const forgotPassword = () => {
    console.log('Forgot password button clicked')
  }



  return {
    error,
    isLoading,
    emailSignIn,
    googleSignIn,
    goToSignup,
    forgotPassword,
    phoneEmailSignIn
  };
};