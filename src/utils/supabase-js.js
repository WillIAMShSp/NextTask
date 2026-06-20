import { createClient } from "@supabase/supabase-js";

const supabaseurl = "https://zjvtxilvlsxefbwrlegw.supabase.co"; //process.env.REACT_APP_SUPABASE_URL;
const supabasekey = "sb_publishable_JGPYUFME6pN_7ft34D1V8Q_J3dKazd4"; //process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseurl, supabasekey);
