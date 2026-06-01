-- Migration 009: Personnel Management (employees, absences, payroll)
-- Ajouté le 2026-05-26

-- 1. SYNCEED_EMPLOYEES
CREATE TABLE IF NOT EXISTS synced_employees (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  local_id BIGINT,
  gym_user_id TEXT,
  coach_id BIGINT,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  hire_date TEXT NOT NULL DEFAULT '',
  contract_type TEXT NOT NULL DEFAULT 'cdi',
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  bank_name TEXT NOT NULL DEFAULT '',
  bank_rib TEXT NOT NULL DEFAULT '',
  emergency_contact TEXT NOT NULL DEFAULT '',
  emergency_phone TEXT NOT NULL DEFAULT '',
  social_security TEXT NOT NULL DEFAULT '',
  birth_date TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'other',
  photo TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

ALTER TABLE synced_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_employees" ON synced_employees
  FOR ALL USING (get_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_synced_employees_name ON synced_employees(name);
CREATE INDEX IF NOT EXISTS idx_synced_employees_position ON synced_employees(position);
CREATE INDEX IF NOT EXISTS idx_synced_employees_is_active ON synced_employees(is_active);

ALTER PUBLICATION supabase_realtime ADD TABLE synced_employees;

CREATE OR REPLACE FUNCTION upsert_synced_employee(
  p_local_id BIGINT,
  p_gym_user_id TEXT DEFAULT NULL,
  p_coach_id BIGINT DEFAULT NULL,
  p_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_address TEXT DEFAULT '',
  p_position TEXT DEFAULT '',
  p_department TEXT DEFAULT '',
  p_hire_date TEXT DEFAULT '',
  p_contract_type TEXT DEFAULT 'cdi',
  p_base_salary NUMERIC DEFAULT 0,
  p_bank_name TEXT DEFAULT '',
  p_bank_rib TEXT DEFAULT '',
  p_emergency_contact TEXT DEFAULT '',
  p_emergency_phone TEXT DEFAULT '',
  p_social_security TEXT DEFAULT '',
  p_birth_date TEXT DEFAULT '',
  p_gender TEXT DEFAULT 'other',
  p_photo TEXT DEFAULT '',
  p_is_active BOOLEAN DEFAULT true
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id BIGINT; v_created_at TIMESTAMPTZ;
BEGIN
  SELECT id, created_at INTO v_id, v_created_at FROM synced_employees WHERE local_id = p_local_id;
  IF v_id IS NOT NULL THEN
    UPDATE synced_employees SET
      gym_user_id = p_gym_user_id, coach_id = p_coach_id, name = p_name,
      phone = p_phone, email = p_email, address = p_address,
      position = p_position, department = p_department, hire_date = p_hire_date,
      contract_type = p_contract_type, base_salary = p_base_salary,
      bank_name = p_bank_name, bank_rib = p_bank_rib,
      emergency_contact = p_emergency_contact, emergency_phone = p_emergency_phone,
      social_security = p_social_security, birth_date = p_birth_date, gender = p_gender,
      photo = p_photo, is_active = p_is_active, updated_at = NOW()
    WHERE id = v_id;
    RETURN (SELECT row_to_json(synced_employees.*) FROM synced_employees WHERE id = v_id)::JSONB;
  ELSE
    INSERT INTO synced_employees (local_id, gym_user_id, coach_id, name, phone, email, address, position, department, hire_date, contract_type, base_salary, bank_name, bank_rib, emergency_contact, emergency_phone, social_security, birth_date, gender, photo, is_active)
    VALUES (p_local_id, p_gym_user_id, p_coach_id, p_name, p_phone, p_email, p_address, p_position, p_department, p_hire_date, p_contract_type, p_base_salary, p_bank_name, p_bank_rib, p_emergency_contact, p_emergency_phone, p_social_security, p_birth_date, p_gender, p_photo, p_is_active)
    RETURNING id INTO v_id;
    RETURN (SELECT row_to_json(synced_employees.*) FROM synced_employees WHERE id = v_id)::JSONB;
  END IF;
END $$;

-- 2. SYNCEED_ABSENCES
CREATE TABLE IF NOT EXISTS synced_absences (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  local_id BIGINT,
  employee_id BIGINT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'other',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

ALTER TABLE synced_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_absences" ON synced_absences
  FOR ALL USING (get_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_synced_absences_employee ON synced_absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_synced_absences_status ON synced_absences(status);
CREATE INDEX IF NOT EXISTS idx_synced_absences_dates ON synced_absences(start_date, end_date);

ALTER PUBLICATION supabase_realtime ADD TABLE synced_absences;

CREATE OR REPLACE FUNCTION upsert_synced_absence(
  p_local_id BIGINT,
  p_employee_id BIGINT DEFAULT 0,
  p_type TEXT DEFAULT 'other',
  p_start_date TEXT DEFAULT '',
  p_end_date TEXT DEFAULT '',
  p_reason TEXT DEFAULT '',
  p_status TEXT DEFAULT 'pending',
  p_approved_by TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id BIGINT;
BEGIN
  SELECT id INTO v_id FROM synced_absences WHERE local_id = p_local_id;
  IF v_id IS NOT NULL THEN
    UPDATE synced_absences SET
      employee_id = p_employee_id, type = p_type, start_date = p_start_date,
      end_date = p_end_date, reason = p_reason, status = p_status,
      approved_by = p_approved_by, updated_at = NOW()
    WHERE id = v_id;
    RETURN (SELECT row_to_json(synced_absences.*) FROM synced_absences WHERE id = v_id)::JSONB;
  ELSE
    INSERT INTO synced_absences (local_id, employee_id, type, start_date, end_date, reason, status, approved_by)
    VALUES (p_local_id, p_employee_id, p_type, p_start_date, p_end_date, p_reason, p_status, p_approved_by)
    RETURNING id INTO v_id;
    RETURN (SELECT row_to_json(synced_absences.*) FROM synced_absences WHERE id = v_id)::JSONB;
  END IF;
END $$;

-- 3. SYNCEED_PAYROLL
CREATE TABLE IF NOT EXISTS synced_payroll (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  local_id BIGINT,
  employee_id BIGINT NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT '',
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonuses NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  absence_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

ALTER TABLE synced_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payroll" ON synced_payroll
  FOR ALL USING (get_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_synced_payroll_employee ON synced_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_synced_payroll_period ON synced_payroll(period);
CREATE INDEX IF NOT EXISTS idx_synced_payroll_status ON synced_payroll(status);

ALTER PUBLICATION supabase_realtime ADD TABLE synced_payroll;

CREATE OR REPLACE FUNCTION upsert_synced_payroll(
  p_local_id BIGINT,
  p_employee_id BIGINT DEFAULT 0,
  p_period TEXT DEFAULT '',
  p_base_salary NUMERIC DEFAULT 0,
  p_bonuses NUMERIC DEFAULT 0,
  p_deductions NUMERIC DEFAULT 0,
  p_absence_deductions NUMERIC DEFAULT 0,
  p_net_salary NUMERIC DEFAULT 0,
  p_status TEXT DEFAULT 'pending',
  p_paid_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT ''
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id BIGINT;
BEGIN
  SELECT id INTO v_id FROM synced_payroll WHERE local_id = p_local_id;
  IF v_id IS NOT NULL THEN
    UPDATE synced_payroll SET
      employee_id = p_employee_id, period = p_period, base_salary = p_base_salary,
      bonuses = p_bonuses, deductions = p_deductions, absence_deductions = p_absence_deductions,
      net_salary = p_net_salary, status = p_status, paid_at = p_paid_at,
      notes = p_notes, updated_at = NOW()
    WHERE id = v_id;
    RETURN (SELECT row_to_json(synced_payroll.*) FROM synced_payroll WHERE id = v_id)::JSONB;
  ELSE
    INSERT INTO synced_payroll (local_id, employee_id, period, base_salary, bonuses, deductions, absence_deductions, net_salary, status, paid_at, notes)
    VALUES (p_local_id, p_employee_id, p_period, p_base_salary, p_bonuses, p_deductions, p_absence_deductions, p_net_salary, p_status, p_paid_at, p_notes)
    RETURNING id INTO v_id;
    RETURN (SELECT row_to_json(synced_payroll.*) FROM synced_payroll WHERE id = v_id)::JSONB;
  END IF;
END $$;
