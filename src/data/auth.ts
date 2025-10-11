export const auth = {
  currentUser: {
    uid: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    callback(auth.currentUser);
    return () => {};
  },
  signInWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: auth.currentUser });
  },
  createUserWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: auth.currentUser });
  },
  sendPasswordResetEmail: (email) => {
    return Promise.resolve();
  },
  signOut: () => {
    auth.currentUser = null;
    return Promise.resolve();
  },
};