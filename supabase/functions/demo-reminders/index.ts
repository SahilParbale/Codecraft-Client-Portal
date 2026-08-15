import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Twilio Configuration
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM = 'whatsapp:+14155238886';
const PHONE_NUMBERS = [
  'whatsapp:+918446588526', // Your personal WhatsApp number
  'whatsapp:+919876543210'  // Replace with the second number
];

serve(async (req) => {
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Automatically injected by Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch all clients from the database
    const { data: clients, error } = await supabase.from('clients').select('*');
    if (error) throw error;

    const now = new Date();
    // Calculate the time windows (Between 12 and 13 hours from exactly now)
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const thirteenHoursFromNow = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    
    let remindersSent = 0;

    // 2. Loop through clients and check their scheduled demo times
    for (const client of clients) {
      const data = client.client_data;
      
      // Skip clients that don't have a demo time or are already closed
      if (!data.demoTime || data.result === 'Closed Won' || data.result === 'Closed Lost') {
        continue;
      }
      
      const demoDate = new Date(data.demoTime);
      
      // If the demo is scheduled exactly within the next 12 hour window
      if (demoDate > twelveHoursFromNow && demoDate <= thirteenHoursFromNow) {
        
        // Dynamically find the client's name based on which product schema they used
        const clientName = data.name || data['College Representative'] || data['Builder Name'] || 'A client';
        
        // 3. Construct the WhatsApp Message
        const messageBody = `*Codecraft Reminder*\nYou have a scheduled demo with ${clientName} in exactly 12 hours!\n\nTime: ${demoDate.toLocaleString()}`;
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        // 4. Send the WhatsApp Message to ALL phone numbers
        for (const targetNumber of PHONE_NUMBERS) {
          const params = new URLSearchParams();
          params.append('To', targetNumber);
          params.append('From', TWILIO_FROM);
          params.append('Body', messageBody);

          const twilioRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });

          if (!twilioRes.ok) {
            console.error(`Twilio Error for ${targetNumber}:`, await twilioRes.text());
          } else {
            console.log(`WhatsApp Reminder successfully sent to ${targetNumber} for ${clientName}`);
            remindersSent++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent }),
      { headers: { "Content-Type": "application/json" } },
    );
    
  } catch (err) {
    console.error(err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
