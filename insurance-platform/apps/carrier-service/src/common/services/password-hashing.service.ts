/**
 * Password Hashing Service
 * 
 * Handles password encryption using bcrypt for secure storage
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Recommended rounds for production

@Injectable()
export class PasswordHashingService {
  /**
   * Hash plain password to bcrypt hash
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  /**
   * Verify plain password against stored hash
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // Support both SHA256 (DEV) and bcrypt hashes
      if (hashedPassword.startsWith('SHA256_')) {
        const crypto = require('crypto');
        const inputHash = crypto.createHash('sha256').update(plainPassword).digest('hex');
        const storedHash = hashedPassword.replace('SHA256_', '');
        return inputHash === storedHash;
      }
      
      // For bcrypt hashes - use proper bcrypt comparison
      // This handles $2a$, $2b$, $2y$ prefixes
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('[PasswordHashingService] Verification error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Get salt rounds configuration
   */
  getSaltRounds(): number {
    return SALT_ROUNDS;
  }
}
