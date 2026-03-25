import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  // This wrapper keeps the auth use case independent from the hashing library.
  compare(plainText: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedValue);
  }
}
