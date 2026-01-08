-- Create invitations table for invitation-only authentication mode
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'resident',
  created_by INTEGER REFERENCES users(id),
  used BOOLEAN DEFAULT FALSE,
  used_by INTEGER REFERENCES users(id),
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_used ON invitations(used);
