-- Keep same-email auth methods (password + Google) mapped to one profile
-- and persist user theme preference.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('light', 'dark', 'system'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_existing_profile_id UUID;
  v_full_name TEXT;
BEGIN
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');

  SELECT id
  INTO v_existing_profile_id
  FROM public.profiles
  WHERE lower(email) = lower(new.email)
  ORDER BY created_at ASC NULLS FIRST
  LIMIT 1;

  IF v_existing_profile_id IS NULL THEN
    INSERT INTO public.profiles (auth_user_id, email, full_name, theme_preference)
    VALUES (new.id, lower(new.email), v_full_name, 'system');
  ELSE
    UPDATE public.profiles
    SET
      auth_user_id = new.id,
      email = lower(new.email),
      full_name = COALESCE(public.profiles.full_name, v_full_name)
    WHERE id = v_existing_profile_id;

    DELETE FROM public.profiles
    WHERE auth_user_id = new.id
      AND id <> v_existing_profile_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_email TEXT;
  v_full_name TEXT;
  v_profile_id UUID;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.';
  END IF;

  SELECT
    lower(u.email),
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), '')
  INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = v_auth_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Signed-in user email was not found.';
  END IF;

  SELECT p.id
  INTO v_profile_id
  FROM profiles p
  WHERE lower(p.email) = v_email
  ORDER BY
    CASE WHEN p.auth_user_id = v_auth_user_id THEN 0 ELSE 1 END,
    p.created_at ASC NULLS FIRST
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, full_name, theme_preference)
    VALUES (v_auth_user_id, v_email, v_full_name, 'system')
    RETURNING id INTO v_profile_id;

    RETURN v_profile_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = v_profile_id
      AND p.auth_user_id <> v_auth_user_id
  ) THEN
    DELETE FROM profiles p
    WHERE p.auth_user_id = v_auth_user_id
      AND p.id <> v_profile_id;

    UPDATE profiles
    SET
      auth_user_id = v_auth_user_id,
      email = v_email,
      full_name = COALESCE(profiles.full_name, v_full_name)
    WHERE id = v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_for_current_user() TO authenticated;
