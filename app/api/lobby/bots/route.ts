import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const COURSES = ['CMA', 'CFA', 'FE'];
// A bot posts a new feed event at most once per this window (randomized per
// bot per run so they don't all fire on the same cron tick).
const MIN_EVENT_GAP_MS = 15 * 60 * 1000;
const MAX_EVENT_GAP_MS = 45 * 60 * 1000;

// This route uses the secret key to bypass RLS for bot message insertion.
// Triggered by Vercel Cron or manual POST request.
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json({ error: 'Missing Supabase service config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, secretKey);

  // 1. Fetch all bot profiles (scripted or not — unscripted bots still emit
  // feed events and accept friend requests)
  const { data: allBots, error: botsError } = await supabase
    .from('user_profiles')
    .select('id, username, exam_type, bot_script')
    .eq('is_bot', true);

  if (botsError || !allBots?.length) {
    return NextResponse.json({ message: 'No bots found', error: botsError?.message }, { status: 200 });
  }
  const bots = allBots.filter((b) => b.bot_script != null);

  // 2. Fetch room slug-to-id mapping
  const { data: rooms } = await supabase.from('lobby_rooms').select('id, slug');
  const roomMap = new Map(rooms?.map((r) => [r.slug, r.id]) || []);

  let messagesSent = 0;

  for (const bot of bots) {
    const script = bot.bot_script as {
      messages: Array<{ content: string; room_slug: string; min_delay_ms: number; max_delay_ms: number }>;
      loop: boolean;
    };

    if (!script?.messages?.length) continue;

    // 3. Check last message from this bot
    const { data: lastMsg } = await supabase
      .from('lobby_messages')
      .select('created_at')
      .eq('sender_id', bot.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count how many messages this bot has sent
    const { count } = await supabase
      .from('lobby_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', bot.id);

    const msgIndex = (count || 0) % script.messages.length;

    // If looping is off and we've sent all messages, skip
    if (!script.loop && (count || 0) >= script.messages.length) continue;

    const nextMsg = script.messages[msgIndex];
    if (!nextMsg) continue;
    const roomId = roomMap.get(nextMsg.room_slug);
    if (!roomId) continue;

    // 4. Check if enough time has passed
    if (lastMsg?.created_at) {
      const elapsed = Date.now() - new Date(lastMsg.created_at).getTime();
      const requiredDelay = nextMsg.min_delay_ms + Math.random() * (nextMsg.max_delay_ms - nextMsg.min_delay_ms);
      if (elapsed < requiredDelay) continue;
    }

    // 5. Insert the message
    const { error: insertError } = await supabase.from('lobby_messages').insert({
      room_id: roomId,
      sender_id: bot.id,
      content: nextMsg.content,
      message_type: 'room',
    });

    if (!insertError) messagesSent++;
  }

  // 6. Bot activity-feed events: keep the feed looking alive pre-scale, the
  // same strategy the scripted messages use for chat rooms. Throttled per
  // bot; the feed's read-time dedupe caps display further.
  let eventsLogged = 0;
  const allRooms = rooms ?? [];
  for (const bot of allBots) {
    const { data: lastEvent } = await supabase
      .from('activity_events')
      .select('created_at')
      .eq('user_id', bot.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastEvent?.created_at) {
      const elapsed = Date.now() - new Date(lastEvent.created_at).getTime();
      const gap = MIN_EVENT_GAP_MS + Math.random() * (MAX_EVENT_GAP_MS - MIN_EVENT_GAP_MS);
      if (elapsed < gap) continue;
    }

    let eventType: string;
    let metadata: Record<string, unknown>;
    if (Math.random() < 0.6) {
      const course = bot.exam_type || COURSES[Math.floor(Math.random() * COURSES.length)];
      const totalQuestions = 10 + Math.floor(Math.random() * 11);
      const percentage = 55 + Math.floor(Math.random() * 41);
      eventType = 'quiz_completed';
      metadata = {
        // Synthetic session id keeps the quiz_completed dedupe index happy
        session_id: randomUUID(),
        course,
        mode: Math.random() < 0.7 ? 'practice' : 'timed',
        score: Math.round((percentage / 100) * totalQuestions),
        percentage,
        total_questions: totalQuestions,
      };
    } else {
      const room = allRooms[Math.floor(Math.random() * allRooms.length)];
      if (!room) continue;
      const { data: roomRow } = await supabase
        .from('lobby_rooms')
        .select('name')
        .eq('id', room.id)
        .single();
      eventType = 'room_joined';
      metadata = { room_id: room.id, room_slug: room.slug, room_name: roomRow?.name };
    }

    const { error: eventError } = await supabase
      .from('activity_events')
      .insert({ user_id: bot.id, event_type: eventType, metadata });
    if (!eventError) eventsLogged++;
  }

  return NextResponse.json({ messagesSent, eventsLogged });
}
