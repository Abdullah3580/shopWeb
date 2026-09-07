import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Notification query failed', error);
    return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 });
  }
  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const notificationId = typeof body.notificationId === 'string' ? body.notificationId : '';
  const markAllRead = body.markAllRead === true;
  const supabase = supabaseAdmin();

  if (markAllRead) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id);

    if (error) return NextResponse.json({ error: 'Unable to update notifications' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', session.user.id);

    if (error) return NextResponse.json({ error: 'Unable to update notification' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
