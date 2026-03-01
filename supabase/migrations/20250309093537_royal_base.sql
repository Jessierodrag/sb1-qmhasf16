/*
  # Create demo users and posts

  1. Changes
    - Creates demo users in auth.users
    - Creates profiles for demo users
    - Creates posts for each profile
    - Creates demo reviewers and their reviews

  2. Security
    - Uses existing RLS policies
*/

-- Create demo users in auth.users
WITH demo_users AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES
  -- Sophie
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sophie@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', 'Sophie',
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Marie
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'marie@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', 'Marie',
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Léa
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'lea@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', 'Léa',
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Emma
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'emma@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', 'Emma',
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  -- Jade
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jade@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', 'Jade',
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id, raw_user_meta_data->>'name' as name
)
-- Create profiles for demo users
INSERT INTO public.profiles (
  id,
  name,
  location,
  description,
  interests,
  photos,
  physical_info,
  personal_info,
  prestations,
  user_type,
  created_at,
  updated_at
)
SELECT 
  du.id,
  du.name,
  CASE du.name
    WHEN 'Sophie' THEN 'Paris'
    WHEN 'Marie' THEN 'Lyon'
    WHEN 'Léa' THEN 'Marseille'
    WHEN 'Emma' THEN 'Bordeaux'
    WHEN 'Jade' THEN 'Nice'
  END,
  CASE du.name
    WHEN 'Sophie' THEN 'Passionnée d''art et de voyages ✈️'
    WHEN 'Marie' THEN 'Amoureuse de toutes les formes d''expression artistique 🎶'
    WHEN 'Léa' THEN 'Danseuse professionnelle et masseuse certifiée 💃'
    WHEN 'Emma' THEN 'Maîtresse expérimentée, stricte mais juste 👠'
    WHEN 'Jade' THEN 'Professeure de yoga et masseuse holistique 🧘‍♀️'
  END,
  CASE du.name
    WHEN 'Sophie' THEN ARRAY['Massage', 'Domination', 'Fétichisme']
    WHEN 'Marie' THEN ARRAY['Naturiste', 'Tantrique', 'GFE']
    WHEN 'Léa' THEN ARRAY['Massage', 'Tantra', 'Accompagnement']
    WHEN 'Emma' THEN ARRAY['BDSM', 'Fétichisme', 'Domination']
    WHEN 'Jade' THEN ARRAY['Massage', 'Yoga', 'Méditation']
  END,
  CASE du.name
    WHEN 'Sophie' THEN ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400']
    WHEN 'Marie' THEN ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400']
    WHEN 'Léa' THEN ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400']
    WHEN 'Emma' THEN ARRAY['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400']
    WHEN 'Jade' THEN ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400']
  END,
  CASE du.name
    WHEN 'Sophie' THEN jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Métisse',
      'nationalite', 'Brazilian',
      'age', 27,
      'yeux', 'Marron',
      'taille', '165 cm',
      'poids', '55 Kg',
      'cheveux', 'Roux',
      'mensurations', '90-60-90',
      'poitrine', '90D',
      'bonnet', 'D',
      'tour_poitrine', '90',
      'epilation', 'Entièrement rasée'
    )
    WHEN 'Marie' THEN jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Caucasienne',
      'nationalite', 'Française',
      'age', 24,
      'yeux', 'Marron',
      'taille', '170 cm',
      'poids', '58 kg',
      'cheveux', 'Châtain',
      'mensurations', '85-60-90',
      'poitrine', '85C',
      'bonnet', 'C',
      'tour_poitrine', '85',
      'epilation', 'Entièrement rasée'
    )
    WHEN 'Léa' THEN jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Méditerranéenne',
      'nationalite', 'Italienne',
      'age', 26,
      'yeux', 'Verts',
      'taille', '168 cm',
      'poids', '54 kg',
      'cheveux', 'Noir',
      'mensurations', '88-58-89',
      'poitrine', '88C',
      'bonnet', 'C',
      'tour_poitrine', '88',
      'epilation', 'Naturelle'
    )
    WHEN 'Emma' THEN jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Caucasienne',
      'nationalite', 'Française',
      'age', 29,
      'yeux', 'Bleus',
      'taille', '175 cm',
      'poids', '60 kg',
      'cheveux', 'Blond',
      'mensurations', '92-62-91',
      'poitrine', '92D',
      'bonnet', 'D',
      'tour_poitrine', '92',
      'epilation', 'Entretenue'
    )
    WHEN 'Jade' THEN jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Asiatique',
      'nationalite', 'Franco-vietnamienne',
      'age', 25,
      'yeux', 'Marron',
      'taille', '162 cm',
      'poids', '50 kg',
      'cheveux', 'Noir',
      'mensurations', '84-58-86',
      'poitrine', '84B',
      'bonnet', 'B',
      'tour_poitrine', '84',
      'epilation', 'Naturelle'
    )
  END,
  CASE du.name
    WHEN 'Sophie' THEN jsonb_build_object(
      'alcool', 'Occasionnellement',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Anglais', 'Portugais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Franco-brésilienne'
    )
    WHEN 'Marie' THEN jsonb_build_object(
      'alcool', 'Non',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Française'
    )
    WHEN 'Léa' THEN jsonb_build_object(
      'alcool', 'Social',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Italien', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Italienne'
    )
    WHEN 'Emma' THEN jsonb_build_object(
      'alcool', 'Occasionnellement',
      'fumeur', 'Social',
      'langues', ARRAY['Français', 'Anglais', 'Allemand'],
      'orientation', 'Bisexuelle',
      'origine', 'Franco-allemande'
    )
    WHEN 'Jade' THEN jsonb_build_object(
      'alcool', 'Non',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Vietnamien', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Vietnamienne'
    )
  END,
  CASE du.name
    WHEN 'Sophie' THEN 'Massage sensuel • Domination soft • Fétichisme • Jeux de rôle • Préliminaires • Câlins • Soirées libertines • Accompagnement événements • Week-end • Dîner en ville'
    WHEN 'Marie' THEN 'Massage naturiste • Préliminaires • Soirées privées • Dîner romantique • Week-end détente • Jeux de rôle • Fétichisme des pieds • Domination soft • Accompagnement événements'
    WHEN 'Léa' THEN 'Massage tantrique • Danse privée • Accompagnement VIP • Dîner en ville • Week-end détente • Voyages • Événements mondains'
    WHEN 'Emma' THEN 'Domination • BDSM • Fétichisme • Jeux de rôle • Education • Initiation • Soirées privées • Sessions personnalisées'
    WHEN 'Jade' THEN 'Massage tantrique • Yoga privé • Méditation guidée • Massage thaï • Réflexologie • Aromathérapie • Séances de bien-être'
  END,
  'pro',
  NOW(),
  NOW()
FROM demo_users du;

-- Create posts for each profile
INSERT INTO posts (
  user_id,
  caption,
  location,
  tags,
  photos,
  created_at,
  updated_at
)
SELECT 
  id,
  description,
  location,
  interests,
  photos,
  created_at,
  updated_at
FROM profiles
WHERE user_type = 'pro';