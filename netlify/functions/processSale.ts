
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import * as admin from 'firebase-admin';

// Define the structure of the incoming request body
interface SalePayload {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }[];
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card';
  customerPhone: string | null;
}

// Initialize Firebase Admin SDK
// This check ensures we don't try to re-initialize the app on hot reloads
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

const db = admin.firestore();

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload: SalePayload = JSON.parse(event.body || '{}');

    // Basic validation
    if (!payload.items || !payload.grandTotal || !payload.userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required sale data.' }) };
    }
    
    let customerId: string | null = null;

    // --- Find or Create Customer Logic ---
    if (payload.customerPhone) {
      const customersRef = db.collection(`customers/${payload.userId}/userCustomers`);
      const snapshot = await customersRef.where('phone', '==', payload.customerPhone).limit(1).get();

      if (snapshot.empty) {
        // Customer not found, create a new one
        const newCustomerRef = await customersRef.add({
          name: 'Unknown Customer', // Default name, can be updated later in the CRM
          phone: payload.customerPhone,
          email: '',
          loyaltyPoints: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        customerId = newCustomerRef.id;
      } else {
        // Customer found, use their ID
        customerId = snapshot.docs[0].id;
      }
    }

    // --- Transactional Sale & Stock Update Logic using a Batch Write ---
    const batch = db.batch();

    // 1. Decrement stock for each item sold
    payload.items.forEach(item => {
      const productRef = db.doc(`products/${payload.userId}/userProducts/${item.productId}`);
      batch.update(productRef, {
        quantity: admin.firestore.FieldValue.increment(-item.quantity),
      });
    });

    // 2. Create the new sale record
    const saleRef = db.collection(`sales/${payload.userId}/userSales`).doc(); // Auto-generate ID
    batch.set(saleRef, {
      items: payload.items,
      grandTotal: payload.grandTotal,
      paymentMethod: payload.paymentMethod,
      customerId, // Link to the customer (or null)
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Add to activity log
    const logRef = db.collection(`users/${payload.userId}/activityLog`).doc();
    batch.set(logRef, {
        message: `Sale of $${payload.grandTotal.toFixed(2)} recorded.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Atomically commit all the operations
    await batch.commit();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sale processed successfully!', saleId: saleRef.id }),
    };

  } catch (error) {
    console.error('Error processing sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal error occurred.';
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

export { handler };
