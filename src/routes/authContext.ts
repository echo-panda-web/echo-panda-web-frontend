import { auth, googleProvider } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "./firebaseConfig";
import { loginFirebaseUserToBackend } from "./backendAuth";

const db = getFirestore(app);

interface UserData {
  user_id?: number;
  artist_id?: number | null;
  role?: "user" | "artist" | "publicer" | "admin";
  name?: string;
  username?: string;
  email: string;
  registeredAt?: string;
  displayName?: string;
  photoURL?: string;
  uid?: string;
  authProvider?: "google" | "email";
  backendRole?: "user" | "artist" | "publicer" | "admin";
}

interface AuthResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

async function persistGoogleUser(user: User): Promise<UserData> {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.status === "blocked") {
      await firebaseSignOut(auth);
      throw new Error("Your account has been blocked. Please contact support.");
    }

    await setDoc(
      userDocRef,
      {
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } else {
    await setDoc(userDocRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
    });
  }

  const backendAuth = await loginFirebaseUserToBackend({
    email: user.email || "",
    name: user.displayName || undefined,
    firebase_uid: user.uid,
    provider: "google",
  });

  const userData: UserData = {
    user_id: backendAuth.user.user_id,
    artist_id: backendAuth.user.artist_id,
    role: backendAuth.user.role,
    name: user.displayName || user.email || "Artist",
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    uid: user.uid,
    registeredAt: new Date().toISOString(),
    authProvider: "google",
    backendRole: backendAuth.user.role,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userToken", backendAuth.token);
  if (["artist", "publicer", "admin"].includes(backendAuth.user.role)) {
    localStorage.setItem("artistUser", JSON.stringify(userData));
  }

  return userData;
}

// Google Sign In
export async function SignInWithGoogle(): Promise<UserData | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await persistGoogleUser(result.user);
  } catch (popupError: any) {
    if (
      popupError.code === "auth/popup-blocked" ||
      popupError.code === "auth/internal-error" ||
      popupError.message?.includes("COOP") ||
      popupError.message?.includes("window.closed") ||
      popupError.message?.includes("The popup window was blocked") ||
      popupError.message?.includes("apis.google.com/js/api.js") ||
      popupError.message?.includes("identitytoolkit.googleapis.com") ||
      popupError.message?.includes("CORS request did not succeed")
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw popupError;
  }
}

export async function completeGoogleRedirectSignIn(): Promise<UserData | null> {
  const result = await getRedirectResult(auth);

  if (!result?.user) {
    return null;
  }

  return await persistGoogleUser(result.user);
}
//=========================================================================

// Email/Password Registration
export async function registerWithEmail(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResult> {
  // Validation
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (username) {
      await updateProfile(user, { displayName: username });
    }

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      displayName: username || user.displayName,
      photoURL: user.photoURL,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
      authProvider: "email",
    }, { merge: true });

    const backendAuth = await loginFirebaseUserToBackend({
      email: user.email || email,
      name: username || user.displayName || undefined,
      firebase_uid: user.uid,
      provider: "email",
    });

    const userData: UserData = {
      user_id: backendAuth.user.user_id,
      artist_id: backendAuth.user.artist_id,
      role: backendAuth.user.role,
      name: username || user.displayName || user.email || "Artist",
      username,
      email: user.email || email,
      displayName: username || user.displayName || "",
      photoURL: user.photoURL || "",
      uid: user.uid,
      registeredAt: new Date().toISOString(),
      authProvider: "email",
      backendRole: backendAuth.user.role,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userToken", backendAuth.token);
    if (["artist", "publicer", "admin"].includes(backendAuth.user.role)) {
      localStorage.setItem("artistUser", JSON.stringify(userData));
    }

    return { success: true, user: userData };
  } catch (error: any) {
    if (error?.code === "auth/email-already-in-use") {
      return { success: false, error: "An account with this email already exists" };
    }

    if (error?.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email address" };
    }

    if (error?.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak" };
    }

    console.error("Email registration error:", error);
    return { success: false, error: "Failed to register. Please try again." };
  }
}
//=====================================================================================
// Email/Password Login
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().status === "blocked") {
      await firebaseSignOut(auth);
      return { success: false, error: "Your account has been blocked. Please contact support." };
    }

    await setDoc(userDocRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      status: userDoc.exists() ? (userDoc.data().status || "active") : "active",
      ...(userDoc.exists() ? {} : { registeredAt: new Date().toISOString(), authProvider: "email" }),
    }, { merge: true });

    const backendAuth = await loginFirebaseUserToBackend({
      email: user.email || email,
      name: user.displayName || undefined,
      firebase_uid: user.uid,
      provider: "email",
    });

    const userData: UserData = {
      user_id: backendAuth.user.user_id,
      artist_id: backendAuth.user.artist_id,
      role: backendAuth.user.role,
      name: user.displayName || user.email || "Artist",
      email: user.email || email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      uid: user.uid,
      registeredAt: userDoc.exists() ? userDoc.data().registeredAt : new Date().toISOString(),
      authProvider: "email",
      backendRole: backendAuth.user.role,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userToken", backendAuth.token);
    if (["artist", "publicer", "admin"].includes(backendAuth.user.role)) {
      localStorage.setItem("artistUser", JSON.stringify(userData));
    }

    return { success: true, user: userData };
  } catch (error: any) {
    if (
      error?.code === "auth/invalid-credential" ||
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/user-not-found"
    ) {
      return { success: false, error: "Invalid email or password" };
    }

    if (error?.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email address" };
    }

    console.error("Email login error:", error);
    return { success: false, error: "Failed to log in. Please try again." };
  }
}
//================================================================================

// Sign Out
export function signOut(): void {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user");
  localStorage.removeItem("userToken");
  localStorage.removeItem("artistUser");
}

//+++++++++++++++++++++++++++++=++++++++++++++
// for storing user data and can be easily call from other page
export function getCurrentUser(): UserData | null {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  if (isAuthenticated !== "true") {
    return null;
  }

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as UserData;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return localStorage.getItem("isAuthenticated") === "true";
}