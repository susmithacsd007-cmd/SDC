CREATE SEQUENCE IF NOT EXISTS student_demo_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS students (
  device_id TEXT PRIMARY KEY,
  demo_number BIGINT NOT NULL UNIQUE DEFAULT nextval('student_demo_number_seq'),
  roll_number TEXT GENERATED ALWAYS AS (
    'SDC26-' || CASE WHEN demo_number < 10000 THEN lpad(demo_number::text, 4, '0') ELSE demo_number::text END
  ) STORED UNIQUE,
  college_id TEXT GENERATED ALWAYS AS (
    'CC26-' || CASE WHEN demo_number < 10000 THEN lpad(demo_number::text, 4, '0') ELSE demo_number::text END
  ) STORED UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  registration_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES students(device_id),
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_venue TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  class_name TEXT NOT NULL,
  year TEXT NOT NULL,
  branch TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  college_id TEXT NOT NULL,
  fee NUMERIC(10, 2) NOT NULL CHECK (fee >= 0),
  payment_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registrations_one_per_student_event UNIQUE (roll_number, event_id)
);

CREATE INDEX IF NOT EXISTS registrations_device_created_idx
  ON registrations (device_id, created_at DESC);

-- Upgrade older installations whose duplicate rule used the browser device ID.
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_one_per_event;
CREATE UNIQUE INDEX IF NOT EXISTS registrations_student_event_idx
  ON registrations (upper(roll_number), event_id);
