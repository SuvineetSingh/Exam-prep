import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route uses the service-role key to bypass RLS for bot message insertion.
// Triggered by Vercel Cron or manual POST request.
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase service config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Fetch all bot profiles with scripts
  const { data: bots, error: botsError } = await supabase
    .from('user_profiles')
    .select('id, username, bot_script')
    .eq('is_bot', true)
    .not('bot_script', 'is', null);

  if (botsError || !bots?.length) {
    return NextResponse.json({ message: 'No bots found', error: botsError?.message }, { status: 200 });
  }

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

  return NextResponse.json({ messagesSent });
}
