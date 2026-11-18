-- ============================================================================
-- UPDATE: Leaderboard only includes affiliates with at least 1 paid/approved closing
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_leaderboard(
  p_period TEXT DEFAULT 'month',
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  affiliate_id UUID,
  display_name TEXT,
  affiliate_code TEXT,
  total_conversions BIGINT,
  total_commission NUMERIC,
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_settings RECORD;
BEGIN
  SELECT leaderboard_start_date, leaderboard_end_date
  INTO v_settings
  FROM public.affiliate_settings
  LIMIT 1;

  IF p_period = 'week' THEN
    v_start := date_trunc('week', now());
    v_end := now() + interval '1 day';
  ELSIF p_period = 'month' THEN
    v_start := date_trunc('month', now());
    v_end := now() + interval '1 day';
  ELSIF p_period = 'contest' THEN
    v_start := COALESCE(p_start, v_settings.leaderboard_start_date, date_trunc('month', now()));
    v_end := COALESCE(p_end, v_settings.leaderboard_end_date, now() + interval '1 day');
  ELSE
    v_start := '2000-01-01'::timestamptz;
    v_end := now() + interval '1 day';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      a.id AS aff_id,
      a.display_name AS dname,
      a.affiliate_code AS acode,
      COUNT(c.id) AS conv_count,
      COALESCE(SUM(c.commission_amount), 0) AS comm_sum
    FROM public.affiliates a
    INNER JOIN public.affiliate_commissions c
      ON c.affiliate_id = a.id
      AND c.status IN ('approved', 'paid')
      AND c.created_at >= v_start
      AND c.created_at <= v_end
    WHERE a.is_active = true
    GROUP BY a.id, a.display_name, a.affiliate_code
    HAVING COUNT(c.id) > 0
  )
  SELECT
    agg.aff_id,
    agg.dname,
    agg.acode,
    agg.conv_count,
    agg.comm_sum,
    ROW_NUMBER() OVER (ORDER BY agg.conv_count DESC, agg.comm_sum DESC, agg.dname ASC) AS rnk
  FROM agg
  ORDER BY rnk ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_leaderboard(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
