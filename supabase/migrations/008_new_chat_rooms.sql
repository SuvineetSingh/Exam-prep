-- New chat rooms: expand topics beyond existing exam rooms
-- Run this in your Supabase SQL editor

INSERT INTO public.lobby_rooms (name, slug, description, icon, industry, sort_order)
VALUES
  ('CMA After Work Hours',        'cma-after-work',        'CMA candidates balancing work and study — evening sessions, tips, support.',           '📊', 'CMA',      20),
  ('FE for Professionals',        'fe-professionals',      'Working engineers preparing for the FE exam. Share study strategies and resources.',    '⚙️', 'FE',       21),
  ('FE for Students',             'fe-students',           'Full-time students sitting the FE exam. Discuss courses, prep material, and more.',     '🎓', 'FE',       22),
  ('FE — Civil Engineering',      'fe-civil',              'FE Civil discipline: structures, geotechnical, transportation, and water resources.',    '🏗️', 'FE Civil', 23),
  ('FE — Mechanical Engineering', 'fe-mechanical',         'FE Mechanical discipline: thermodynamics, fluid mechanics, machine design.',             '🔧', 'FE Mech',  24),
  ('FE — IT / Computer Science',  'fe-it',                 'FE Computer Engineering / IT discipline: software, networks, algorithms.',              '💻', 'FE IT',    25),
  ('Developer Feedback',          'developer-feedback',    'Share bugs, feature requests, and suggestions directly with the dev team.',             '🛠️', 'Meta',     99)
ON CONFLICT (slug) DO NOTHING;
