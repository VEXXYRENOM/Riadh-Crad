/**
 * lib/email-templates/index.ts
 *
 * Barrel file — re-exports every email template so callers only need:
 *   import { welcomeEmail, otpEmail, ... } from '@/lib/email-templates';
 */

import { welcomeEmail }  from './welcome';
import { otpEmail }      from './otp';
import { rewardEmail }   from './reward';
import { campaignEmail } from './campaign';

export { welcomeEmail, otpEmail, rewardEmail, campaignEmail };
