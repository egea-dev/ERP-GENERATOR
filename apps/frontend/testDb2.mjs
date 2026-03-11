import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("Fetching a ticket...");
    const { data: tickets, error: err1 } = await supabase
        .from('operativo_tickets')
        .select('*')
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
    console.log(`Testing update on ticket ${ticketId} with a bogus column...`);

    const updates = {
        estado: 'Resuelto',
        un_campo_que_no_existe: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('operativo_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select();

    if (error) {
        console.error("EXACT ERROR OBJECT:", JSON.stringify(error, null, 2));
    } else {
        console.log("UPDATE SUCCESS:", data);
    }
}

test();
