import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to verify that the authenticated user owns the resource
 * Use after authenticateUser middleware
 */
export function requireOwnership(userIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authenticatedUserId = req.auth?.userId;
      const resourceUserId = req.params[userIdParam];

      if (!authenticatedUserId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (authenticatedUserId !== resourceUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not own this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
}

/**
 * Middleware to verify user owns the order (for order-specific operations)
 */
export async function requireOrderOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const authenticatedUserId = req.auth?.userId;
    const orderId = req.params.id;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const order = await storage.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Allow if user is creator OR provider of the order
    const isOwner = order.creatorId === authenticatedUserId || order.providerId === authenticatedUserId;
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not associated with this order'
      });
    }

    // Attach order to request for downstream use
    (req as any).order = order;
    next();
  } catch (error) {
    console.error('Order ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
}

/**
 * Middleware to verify user is a provider (for provider-only endpoints)
 */
export async function requireProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const authenticatedUserId = req.auth?.userId;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await storage.getUser(authenticatedUserId);
    
    if (!user || user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Provider access required'
      });
    }

    next();
  } catch (error) {
    console.error('Provider check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
}
