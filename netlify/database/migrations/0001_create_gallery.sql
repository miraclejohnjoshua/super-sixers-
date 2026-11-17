
CREATE TABLE IF NOT EXISTS shared_items (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL CHECK (
    username IN (
      'Miracle', 'Melvin', 'Chris',
      'Curtis', 'Rayan', 'Harsith'
    )
  ),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shared_items_created_at_idx
ON shared_items (created_at DESC);
