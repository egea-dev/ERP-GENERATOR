import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/frontend/.env
dotenv.config({ path: '.env' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("Fetching a ticket...");
    const { data: tickets, error: err1 } = await supabase
        .from('operativo_tickets')
        .select('id, estado')
        .limit(1);

    if (err1) {
        console.error("Error fetching:", err1);
        return;
    }

    if (!tickets || tickets.length === 0) {
        console.log("No tickets found to test.");
        return;
    }

    const ticketId = tickets[0].id;
    console.log(`Testing update on ticket ${ticketId}`);

    const updates = {
        estado: 'En proceso',
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('operativo_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select();

    if (error) {
        console.error("UPDATE ERROR:", error);
    } else {
        console.log("UPDATE SUCCESS:", data);
    }
}

test();
