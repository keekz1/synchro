export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;       
    image?: string;       
  }
  
  export interface FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    sender?: User;
    receiver?: User;
  }