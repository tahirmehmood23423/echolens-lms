-- 0007: public feedback wall (store.js `feedback` collection)

CREATE TABLE IF NOT EXISTS feedback (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_data_gin ON feedback USING GIN (data);
