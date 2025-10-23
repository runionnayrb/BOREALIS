import { Request, Response, NextFunction } from "express";
import type { UserRole } from "@shared/schema";

// Middleware to require specific roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const userRole = req.user!.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

// Helper to check if user has any of the required roles
export function hasRole(user: Express.User | undefined, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as UserRole);
}

// Common role combinations
export const canEditLineups = requireRole('admin', 'stage_management');
export const canManageRestrictions = requireRole('admin', 'performance_wellness');
export const canManagePlans = requireRole('admin', 'stage_management', 'coaching');
export const canOverrideRestrictions = requireRole('admin');
