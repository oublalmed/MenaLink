import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { firebaseDatabase } from '../services/firebase';
import { BookingStatus } from '../../../shared/types';

interface BookingRealtime {
  bookingId: string;
  status: BookingStatus;
  updatedAt: number;
}

/**
 * Écoute les mises à jour temps réel d'une réservation via Firebase Realtime DB.
 */
export function useFirebaseBooking(bookingId: string | null): BookingRealtime | null {
  const [data, setData] = useState<BookingRealtime | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const bookingRef = ref(firebaseDatabase, `bookings/${bookingId}`);
    onValue(bookingRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val() as BookingRealtime);
      }
    });

    return () => off(bookingRef);
  }, [bookingId]);

  return data;
}
