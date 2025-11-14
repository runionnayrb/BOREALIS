import type { Request } from "express";

/**
 * Extract the real client IP from the request
 * Handles proxy headers (X-Forwarded-For, X-Real-IP) used in production
 */
export function getClientIp(req: Request): string | undefined {
  // Check X-Forwarded-For header (Replit and most reverse proxies use this)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (the original client)
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIp = ips.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // Check X-Real-IP header (some proxies use this)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }

  // Fallback to direct connection IP
  return req.ip || req.socket.remoteAddress;
}

/**
 * Normalize an IP address by stripping IPv6-to-IPv4 mapping prefix
 * Converts "::ffff:192.168.1.1" to "192.168.1.1"
 * 
 * @param ip - The IP address to normalize
 * @returns The normalized IP address
 */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  
  // Strip IPv6-to-IPv4 mapping prefix (::ffff:)
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.substring(7); // Remove "::ffff:" prefix
  }
  
  return trimmed;
}

/**
 * Check if an IP address matches a pattern
 * Supports exact match and wildcard patterns (e.g., "192.168.1.*")
 * Handles IPv6-mapped IPv4 addresses (::ffff:x.x.x.x)
 * 
 * @param clientIp - The IP address to check
 * @param pattern - The pattern to match against (exact IP or wildcard pattern)
 * @returns true if the IP matches the pattern
 */
export function matchesIpPattern(clientIp: string, pattern: string): boolean {
  // Normalize both IPs (remove whitespace, lowercase, strip IPv6 mapping)
  const normalizedClientIp = normalizeIp(clientIp);
  const normalizedPattern = normalizeIp(pattern);

  // Exact match
  if (normalizedClientIp === normalizedPattern) {
    return true;
  }

  // Wildcard matching
  if (normalizedPattern.includes('*')) {
    // Convert pattern to regex
    // Escape special regex characters except *
    const regexPattern = normalizedPattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*'); // Replace * with .*
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedClientIp);
  }

  return false;
}

/**
 * Check if a client IP is in the list of trusted IPs
 * 
 * @param clientIp - The IP address to check
 * @param trustedIps - Array of trusted IP patterns
 * @returns true if the IP matches any trusted pattern
 */
export function isIpTrusted(clientIp: string | undefined, trustedIps: string[]): boolean {
  if (!clientIp) return false;
  if (trustedIps.length === 0) return false;

  return trustedIps.some(pattern => matchesIpPattern(clientIp, pattern));
}
