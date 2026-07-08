// ============================================
// SUPABASE CONFIG — SIG HSEQ Colombia · LPS Grupo
// Proyecto: kssoegcjwngsnfwdvjne
// ============================================
const SUPABASE_URL = 'https://kssoegcjwngsnfwdvjne.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc29lZ2Nqd25nc25md2R2am5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjE3OTMsImV4cCI6MjA5OTAzNzc5M30.rtvKepiLyKEMkJPxTHw336E6UEoPyAkEX_5jU7WgGM4';

let _sb = null;
function getSupabase() {
  if (!_sb) {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  }
  return _sb;
}

// Helper genérico para operaciones CRUD
const db = {
  async getAll(table, orderBy = 'created_at', asc = true) {
    const { data, error } = await getSupabase().from(table).select('*').order(orderBy, { ascending: asc });
    if (error) { console.error('DB getAll error:', table, error); return []; }
    return data || [];
  },
  async getFiltered(table, filters = {}, orderBy = 'created_at') {
    let q = getSupabase().from(table).select('*');
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q.order(orderBy, { ascending: true });
    if (error) { console.error('DB getFiltered error:', table, error); return []; }
    return data || [];
  },
  async insert(table, row) {
    const { data, error } = await getSupabase().from(table).insert(row).select();
    if (error) { console.error('DB insert error:', table, error); return null; }
    return data?.[0] || null;
  },
  async update(table, id, updates) {
    const { data, error } = await getSupabase().from(table).update(updates).eq('id', id).select();
    if (error) { console.error('DB update error:', table, error); return null; }
    return data?.[0] || null;
  },
  async remove(table, id) {
    const { error } = await getSupabase().from(table).delete().eq('id', id);
    if (error) { console.error('DB remove error:', table, error); return false; }
    return true;
  },
  async count(table, filters = {}) {
    let q = getSupabase().from(table).select('*', { count: 'exact', head: true });
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    const { count, error } = await q;
    if (error) { console.error('DB count error:', table, error); return 0; }
    return count || 0;
  }
};
