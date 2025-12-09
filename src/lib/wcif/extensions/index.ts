/**
 * Central exports for all WCIF extensions used by Delegate Dashboard
 *
 * This module provides a type-safe, modular interface for working with
 * WCIF extensions from multiple sources:
 * - delegateDashboard: Extensions created by this app
 * - groupifier: Extensions from Groupifier (backward compatibility)
 * - competitionScheduler: Extensions from Competition Scheduler
 * - natshelper: Extensions from Nats Helper (CubingUSA)
 */

// Delegate Dashboard extensions
export * from './delegateDashboard';

// Groupifier extensions (backward compatibility)
export * from './groupifier';

// Competition Scheduler extensions
export * from './competitionScheduler';

// Nats Helper extensions
export * from './natshelper';

// Utility functions
export * from './utils';
