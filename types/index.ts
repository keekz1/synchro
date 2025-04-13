// src/types/index.ts
export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;         // Optional fields
    image?: string;        // Profile picture URL
    // Add other fields that exist in your Prisma/DB model
  }
  
  export interface FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    // Include relations if needed
    sender?: User;
    receiver?: User;
  }