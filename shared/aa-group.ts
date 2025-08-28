// AA Split Group Management System

// Type imports will be resolved at runtime

export interface AAGroupCreation {
  originalOrder: any; // Order type
  maxParticipants: number;
  splitAmount: number;
  expirationHours: number;
}

export interface AAGroupStatus {
  id: string;
  originalOrderId: string;
  totalAmount: number;
  splitAmount: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: any[]; // GroupParticipant[]
  isComplete: boolean;
  canJoin: boolean;
  timeRemaining: number; // in milliseconds
  progressPercentage: number;
}

export interface JoinAAGroupRequest {
  groupId: string;
  userId: string;
  paymentMethod: string;
}

export interface AAGroupPaymentSummary {
  totalAmount: number;
  individualAmount: number;
  participantCount: number;
  completedPayments: number;
  pendingPayments: number;
  allPaid: boolean;
}

// AA Group Management Functions
export function calculateSplitAmount(totalAmount: number, maxParticipants: number): number {
  return Math.ceil((totalAmount / maxParticipants) * 100) / 100; // Round up to nearest cent
}

export function validateAAGroupCreation(order: any, maxParticipants: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if order is eligible for AA split
  if (order.type !== 'group') {
    errors.push("Only group orders can be split with AA payment");
  }

  if (order.isPaid) {
    errors.push("Order is already paid and cannot be split");
  }

  if (order.status !== 'pending' && order.status !== 'open') {
    errors.push("Order must be pending or open to create AA group");
  }

  // Validate participant count
  if (maxParticipants < 2) {
    errors.push("AA group must have at least 2 participants");
  }

  if (maxParticipants > 50) {
    errors.push("AA group cannot exceed 50 participants");
  }

  if (order.maxParticipants && maxParticipants > order.maxParticipants) {
    errors.push(`AA group size cannot exceed order limit of ${order.maxParticipants}`);
  }

  // Check minimum amount per person
  const splitAmount = calculateSplitAmount(parseFloat(order.price), maxParticipants);
  if (splitAmount < 1.00) {
    errors.push("Split amount cannot be less than $1.00 per person");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getAAGroupStatus(group: any, participants: any[]): AAGroupStatus {
  const now = new Date();
  const expiresAt = new Date(group.expiresAt);
  const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
  const progressPercentage = ((group.currentParticipants || 0) / group.maxParticipants) * 100;

  return {
    id: group.id,
    originalOrderId: group.originalOrderId,
    totalAmount: parseFloat(group.totalAmount.toString()),
    splitAmount: parseFloat(group.splitAmount.toString()),
    maxParticipants: group.maxParticipants,
    currentParticipants: group.currentParticipants || 0,
    participants,
    isComplete: group.isComplete || false,
    canJoin: !(group.isComplete || false) && (group.currentParticipants || 0) < group.maxParticipants && timeRemaining > 0,
    timeRemaining,
    progressPercentage
  };
}

export function calculateAAPaymentSummary(group: any, participants: any[]): AAGroupPaymentSummary {
  const completedPayments = participants.filter(p => p.isPaid).length;
  const pendingPayments = participants.length - completedPayments;
  
  return {
    totalAmount: parseFloat(group.totalAmount.toString()),
    individualAmount: parseFloat(group.splitAmount.toString()),
    participantCount: participants.length,
    completedPayments,
    pendingPayments,
    allPaid: completedPayments === participants.length && participants.length === group.maxParticipants
  };
}

export function canCompleteAAGroup(group: any, participants: any[]): {
  canComplete: boolean;
  reason?: string;
} {
  // Check if all participants have joined
  const currentCount = group.currentParticipants || 0;
  if (currentCount < group.maxParticipants) {
    return {
      canComplete: false,
      reason: `Waiting for ${group.maxParticipants - currentCount} more participants`
    };
  }

  // Check if all participants have paid
  const unpaidParticipants = participants.filter(p => !p.isPaid);
  if (unpaidParticipants.length > 0) {
    return {
      canComplete: false,
      reason: `Waiting for ${unpaidParticipants.length} participants to complete payment`
    };
  }

  // Check if group has expired
  const now = new Date();
  if (now > new Date(group.expiresAt)) {
    return {
      canComplete: false,
      reason: "Group has expired"
    };
  }

  return { canComplete: true };
}

// Automatic refund logic for failed AA groups
export function shouldRefundAAGroup(group: any, participants: any[]): {
  shouldRefund: boolean;
  reason: string;
  refundParticipants: any[];
} {
  const now = new Date();
  const hasExpired = now > new Date(group.expiresAt);
  const isIncomplete = (group.currentParticipants || 0) < group.maxParticipants;
  
  if (hasExpired && (isIncomplete || !group.isComplete)) {
    const paidParticipants = participants.filter(p => p.isPaid);
    return {
      shouldRefund: true,
      reason: isIncomplete ? "Group did not reach required participants" : "Group expired before completion",
      refundParticipants: paidParticipants
    };
  }

  return {
    shouldRefund: false,
    reason: "",
    refundParticipants: []
  };
}

// Generate AA group invitation link
export function generateAAGroupInvite(groupId: string, hostName: string, orderTitle: string): {
  inviteUrl: string;
  message: string;
  qrCodeData: string;
} {
  const baseUrl = process.env.VITE_APP_URL || "https://app.taplive.com";
  const inviteUrl = `${baseUrl}/aa-group/${groupId}`;
  
  const message = `${hostName} invited you to join an AA split for "${orderTitle}". Split the cost and enjoy together! Join here: ${inviteUrl}`;
  
  return {
    inviteUrl,
    message,
    qrCodeData: inviteUrl
  };
}

// Time formatting utilities
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return "Expired";
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

export function getAAGroupExpirationTime(hours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + (hours * 60 * 60 * 1000));
}