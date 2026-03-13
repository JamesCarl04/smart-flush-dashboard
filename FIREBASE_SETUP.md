# Smart Flush IoT System - Firebase Setup

## TASK 1 - Firebase Project Setup

### 1. Create the Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter the name: `smart-flush-system`.
3. Enable or disable Google Analytics based on your preference, then click **Create project**.
4. Wait for the project to be provisioned and click **Continue**.

### 2. Enable Firestore Database
1. In the left navigation menu under the **Build** section, click on **Firestore Database**.
2. Click **Create database**.
3. Select **Start in test mode** (we have generated restricted `firestore.rules` which will replace these test rules).
4. Choose the region **asia-southeast1** as requested.
5. Click **Enable**.

### 3. Enable Authentication
1. In the left navigation menu under **Build**, click on **Authentication**.
2. Click **Get started**.
3. In the **Sign-in method** tab, click on **Email/Password**.
4. Enable the **Email/Password** provider (leave Email link passwordless sign-in disabled for now).
5. Click **Save**.

### 4. Setup Client SDK (Web App)
1. Go to **Project Overview** (gear icon -> Project settings) or simply click the Web `</>` icon on the dashboard.
2. Register the app with a nickname (e.g., `smart-flush-dashboard`).
3. You will be provided with a `firebaseConfig` object.
4. Copy these values into your `.env.local` or `.env` file for the `NEXT_PUBLIC_FIREBASE_*` variables.

### 5. Setup Admin SDK
1. Go to **Project Settings** (gear icon) -> **Service accounts**.
2. Click **Generate new private key**, which will download a JSON file containing your Admin SDK credentials.
3. Open the downloaded JSON and copy the values for `project_id`, `client_email`, and `private_key`.
4. Paste these into your `.env.local` file under the `FIREBASE_ADMIN_*` variables. 
*(Note: When pasting the `private_key` into the `.env` file, include the `\n` characters naturally. The provided `firebase-admin.ts` replaces escaped newline chars automatically.)*

---

## TASK 6 - Firestore Collection Schemas

Below is the document schema reference for all Firestore collections used by the Smart Flush IoT System:

### `users`
**Path:** `/users/{userId}`
```typescript
{
  id: string;          // Maps to Auth UID
  email: string;
  displayName: string;
  createdAt: timestamp;
}
```

### `devices`
**Path:** `/devices/{deviceId}`
```typescript
{
  id: string;
  name: string;
  status: 'online' | 'offline';
  firmwareVersion: string;
  lastSeen: timestamp;
  config: Map<string, any>;
}
```

### `sensorReadings`
**Path:** `/sensorReadings/{YYYY-MM-DD}/readings/{readingId}`  
*(Partitioned by date string YYYY-MM-DD to prevent massive collections)*
```typescript
{
  id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: timestamp;
}
```

### `flushEvents`
**Path:** `/flushEvents/{eventId}`
```typescript
{
  id: string;
  deviceId: string;
  waterVolume: number; // e.g., Liters used
  duration: number;    // e.g., Duration of flush in seconds
  timestamp: timestamp;
}
```

### `lidEvents`
**Path:** `/lidEvents/{eventId}`
```typescript
{
  id: string;
  deviceId: string;
  status: 'open' | 'closed';
  timestamp: timestamp;
}
```

### `uvCycles`
**Path:** `/uvCycles/{eventId}`
```typescript
{
  id: string;
  deviceId: string;
  duration: number;   // Duration in seconds
  completed: boolean; // Indicates if the cycle wasn't interrupted 
  timestamp: timestamp;
}
```

### `automationRules`
**Path:** `/automationRules/{ruleId}`
```typescript
{
  id: string;
  name: string;
  group: string;
  trigger: string;
  threshold: number;
  action: string;
  enabled: boolean;
  createdAt: timestamp;
}
```

### `alerts`
**Path:** `/alerts/{alertId}`
```typescript
{
  id: string;
  type: string;
  message: string;
  severity: string;  
  acknowledged: boolean;
  deviceId: string;
  timestamp: timestamp;
}
```

### `reports`
**Path:** `/reports/{reportId}`
```typescript
{
  id: string;
  type: string;
  from: timestamp;
  to: timestamp;
  format: string;
  generatedAt: timestamp;
  userId?: string; // Explicit mapping for user ownership
}
```

### `maintenanceCounters` (Subcollection)
**Path:** `/devices/{deviceId}/maintenanceCounters/{counterId}`
```typescript
{
  uvOnTimeSeconds: number;
  lidCycleCount: number;
  flowSensorTotalLiters: number;
  pumpTotalLiters: number;
  relayTotalTriggers: number;
  ultrasonicConsecutiveFailures: number;
}
```

## Security Rules Deployment
Copy the provided `.rules` contents to a file named `firestore.rules` and deploy them via the Firebase CLI:
`firebase deploy --only firestore:rules`
