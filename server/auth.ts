import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request, Response, NextFunction } from "express";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Extend Express Request to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

// Middleware to verify Clerk session and attach user ID to request
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Use networkless verification (recommended by Clerk)
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      
      if (!payload || !payload.sub) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Invalid token"
        });
      }

      // Attach user info to request
      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid as string,
      };

      next();
    } catch (verifyError: any) {
      console.error('Token verification failed:', verifyError.message || verifyError);
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token verification failed"
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Authentication failed"
    });
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        
        if (payload && payload.sub) {
          req.auth = {
            userId: payload.sub,
            sessionId: payload.sid as string,
          };
        }
      } catch {
        // Silently fail for optional auth
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

// Helper to get Clerk user details
export async function getClerkUser(userId: string) {
  try {
    return await clerkClient.users.getUser(userId);
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    return null;
  }
}

// Sync Clerk user to our database
export async function syncClerkUserToDatabase(clerkUserId: string, storage: any) {
  try {
    const clerkUser = await getClerkUser(clerkUserId);
    
    if (!clerkUser) {
      throw new Error('Clerk user not found');
    }

    // Check if user already exists in our database
    const existingUser = await storage.getUser(clerkUserId);
    
    if (existingUser) {
      return existingUser;
    }

    // Create new user in our database
    const newUser = await storage.createUser({
      id: clerkUserId,
      username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || `user_${clerkUserId.slice(0, 8)}`,
      password: 'clerk_managed', // Password managed by Clerk
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'TapLive User',
      avatar: clerkUser.imageUrl || null,
    });

    return newUser;
  } catch (error) {
    console.error('Error syncing Clerk user to database:', error);
    throw error;
  }
}
