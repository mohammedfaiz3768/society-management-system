-- Add email column to otp_codes table to support email-based OTP authentication
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- Make phone column nullable since we now support both phone and email
ALTER TABLE otp_codes ALTER COLUMN phone DROP NOT NULL;
