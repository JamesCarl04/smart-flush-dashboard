'use client';

import { useState, useEffect } from 'react';
import {
  getAuth,
  updateProfile as firebaseUpdateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import type { NotificationPrefs } from '@/types';

// ── Default prefs used when Firestore doc doesn't exist yet ─────────────────
const DEFAULT_PREFS: NotificationPrefs = {
  criticalAlerts:     true,
  highPriorityAlerts: true,
  dailySummaryEmail:  false,
  weeklyReportEmail:  false,
};

// ── Types ────────────────────────────────────────────────────────────────────
interface UpdateProfileArgs {
  displayName: string;
  email: string;
}

interface ChangePasswordArgs {
  currentPassword: string;
  newPassword: string;
}

interface UseProfileReturn {
  user: ReturnType<typeof getAuth>['currentUser'];
  notifPrefs: NotificationPrefs;
  loading: boolean;
  updateProfile: (args: UpdateProfileArgs) => Promise<void>;
  changePassword: (args: ChangePasswordArgs) => Promise<void>;
  updateNotifications: (prefs: NotificationPrefs) => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useProfile(): UseProfileReturn {
  const auth = getAuth(app);
  const user = auth.currentUser;

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  // Load Firestore notification prefs on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, 'users', user.uid);
    getDoc(docRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.notifications) {
            setNotifPrefs(data.notifications as NotificationPrefs);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // ── updateProfile ──────────────────────────────────────────────────────────
  const updateProfile = async ({ displayName, email }: UpdateProfileArgs): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    // Firebase Auth updates
    await firebaseUpdateProfile(user, { displayName });
    if (email !== user.email) {
      await updateEmail(user, email);
    }

    // Firestore merge
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { displayName, email, updatedAt: Date.now() }, { merge: true });
  };

  // ── changePassword ─────────────────────────────────────────────────────────
  const changePassword = async ({ currentPassword, newPassword }: ChangePasswordArgs): Promise<void> => {
    if (!user || !user.email) throw new Error('Not authenticated');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  // ── updateNotifications ────────────────────────────────────────────────────
  const updateNotifications = async (prefs: NotificationPrefs): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, { notifications: prefs });
    setNotifPrefs(prefs);
  };

  return { user, notifPrefs, loading, updateProfile, changePassword, updateNotifications };
}
