import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { getPublicKey } from '../../services/pushService';
import { supabase } from '../../config/supabase';

const router = Router();

// Get the VAPID public key
router.get('/vapid-key', authenticateUser as any, (req, res) => {
    res.json({ publicKey: getPublicKey() });
});

// Save a push subscription
router.post('/subscribe', authenticateUser as any, async (req: any, res: any) => {
    try {
        const { subscription } = req.body;
        const userId = req.user?.id;

        if (!subscription || !userId) {
            return res.status(400).json({ error: 'Subscription and user ID are required' });
        }

        const { error } = await supabase
            .from('users')
            .update({ push_subscription: subscription })
            .eq('id', userId);

        if (error) {
            // Might fail if push_subscription column doesn't exist
            console.error('Subscription save error DB:', error);
            if (error.message.includes('Could not find the ' + "'push_subscription' column")) {
                 return res.status(500).json({ error: 'Schema migration required for push notifications' });
            }
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

router.post('/register-fcm', authenticateUser as any, async (req: any, res: any) => {
    try {
        const { token } = req.body;
        const userId = req.user?.id;

        if (!token || !userId) {
            return res.status(400).json({ error: 'Token and user ID are required' });
        }

        const { error } = await supabase
            .from('users')
            .update({ 
                fcm_token: token,
                push_type: 'fcm'
            })
            .eq('id', userId);

        if (error) {
            console.error('FCM Token save error DB:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'FCM token registered successfully' });
    } catch (error) {
        console.error('FCM registration error:', error);
        res.status(500).json({ error: 'Failed to register FCM token' });
    }
});

export default router;
