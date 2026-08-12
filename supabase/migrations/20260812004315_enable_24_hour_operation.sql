update public.operating_hours
set opens_at = time '00:00',
    closes_at = time '00:00',
    closes_next_day = true;
