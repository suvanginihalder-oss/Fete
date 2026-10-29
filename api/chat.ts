import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message, plan } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const lower = message.toLowerCase();
    let reply = '';
    let suggestedAction: any = null;

    if (lower.includes('budget') || lower.includes('save') || lower.includes('cost') || lower.includes('food') || lower.includes('cheaper')) {
      reply = `I analyzed your budget. We can optimize your Catering & Decor line items. By switching from a multi-appetizer plated buffet to curated live stations and leveraging in-house audio equipment, we can save approximately ${plan.input.currency} 8,000 without reducing guest satisfaction.`;
      suggestedAction = {
        type: 'modify_budget',
        label: `Apply ${plan.input.currency} 8,000 Budget Optimization`,
        diffSummary: 'Reduces Food (-5,000) & Decor (-3,000), increasing Emergency Buffer (+8,000)',
        applyPayload: {
          categoryAdjustments: [
            { categoryMatch: 'Food', delta: -5000 },
            { categoryMatch: 'Decor', delta: -3000 },
            { categoryMatch: 'Emergency', delta: 8000 }
          ]
        }
      };
    } else if (lower.includes('rain') || lower.includes('weather') || lower.includes('plan b')) {
      reply = `I have drafted an enhanced Weather Plan B specifically for ${plan.input.city}. This includes booking an indoor pre-function hallway buffer and scheduling a weather alert check 36 hours prior to load-in.`;
      suggestedAction = {
        type: 'add_task',
        label: 'Add 36-Hour Weather Contingency Check',
        diffSummary: 'Adds high-priority task: "Execute Rain Check & Hall Transition Standby"',
        applyPayload: {
          task: {
            title: 'Execute Rain Check & Hall Transition Standby',
            category: 'Safety',
            dueOffsetDays: 2,
            priority: 'high',
            notes: 'Contact venue manager to confirm dry storage for electrical fixtures.'
          }
        }
      };
    } else if (lower.includes('photo') || lower.includes('booth') || lower.includes('camera')) {
      reply = `A themed interactive photobooth will create memorable keepsakes for your ${plan.input.guests} guests. I can schedule a dedicated setup task 2 days prior to calibrate lighting and test instant QR sharing.`;
      suggestedAction = {
        type: 'add_task',
        label: 'Add Photobooth Setup & Test Task',
        diffSummary: 'Adds task: "Photobooth Backdrop Setup & QR Printer Test"',
        applyPayload: {
          task: {
            title: 'Photobooth Backdrop Setup & QR Printer Test',
            category: 'Production',
            dueOffsetDays: 2,
            priority: 'medium',
            notes: 'Ensure 2x power outlets and test wireless printer battery.'
          }
        }
      };
    } else {
      reply = `Great consideration for "${plan.input.name}". Based on your ${plan.input.guests} guests in ${plan.input.city}, I recommend locking in key vendor deliverables and reviewing dietary accommodations early. Would you like me to find cost reductions in your budget lines or adjust your day schedule?`;
    }

    return res.status(200).json({
      success: true,
      data: {
        reply,
        suggestedAction,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Chat error' });
  }
}
