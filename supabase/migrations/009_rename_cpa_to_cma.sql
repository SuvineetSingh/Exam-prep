-- Rename exam_type CPA → CMA across all relevant tables
UPDATE public.questions SET exam_type = 'CMA' WHERE exam_type = 'CPA';
UPDATE public.user_answers SET exam_type = 'CMA' WHERE exam_type = 'CPA';
UPDATE public.exam_sessions SET exam_type = 'CMA' WHERE exam_type = 'CPA';
UPDATE public.course_subscriptions SET course = 'CMA' WHERE course = 'CPA';
UPDATE public.starred_questions SET exam_type = 'CMA' WHERE exam_type = 'CPA';
